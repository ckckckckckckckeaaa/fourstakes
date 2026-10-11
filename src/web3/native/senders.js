import { getWallets } from '@wallet-standard/app'
import { RPC_ENDPOINTS } from '../../config/rpc'
import { connectCosmosWallet, COSMOS_HUB_CHAIN_ID } from '../cosmos/wallet'

const SUI_MAINNET = 'sui:mainnet'
const SUI_COIN_TYPE = '0x2::sui::SUI'
const SUI_GAS_BUDGET = 10_000_000n // 0.01 SUI; the wallet/RPC will reject if this is not enough.

const asBytes = (value) => Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0))

export function decimalToAtomic(value, decimals) {
  const normalized = String(value || '').trim()
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Enter a valid decimal amount.')
  const [whole, fraction = ''] = normalized.split('.')
  if (fraction.length > decimals) throw new Error(`This network supports up to ${decimals} decimal places.`)
  const atomic = `${whole}${fraction.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '')
  if (BigInt(atomic || '0') <= 0n) throw new Error('Enter an amount greater than zero.')
  return BigInt(atomic || '0')
}

function suiWallets() {
  return getWallets().get().filter((wallet) => wallet.chains?.includes(SUI_MAINNET))
}

export async function connectSuiWallet(preferredName) {
  const wallet = suiWallets().find((item) => item.name === preferredName) || suiWallets()[0]
  if (!wallet) throw new Error('Install a Sui Wallet Standard wallet such as Slush, Suiet, OKX Wallet, or Backpack.')
  const connect = wallet.features?.['standard:connect']
  if (!connect) throw new Error(`${wallet.name} does not expose the standard Sui connection method.`)
  await connect.connect()
  const account = wallet.accounts?.find((item) => item.chains?.includes(SUI_MAINNET))
  if (!account?.address) throw new Error(`${wallet.name} did not return a Sui mainnet account.`)
  return {
    wallet: {
      id: `sui-${wallet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${account.address.toLowerCase()}`,
      address: account.address,
      chainId: SUI_MAINNET,
      namespace: 'sui',
      network: 'sui',
      networks: ['sui'],
      provider: wallet.name,
      providerId: wallet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ecosystem: 'Sui',
      firstConnected: new Date().toISOString(),
      verified: false,
      local: true,
    },
    walletStandard: wallet,
    account,
  }
}

async function suiRpc(method, params) {
  const response = await fetch(RPC_ENDPOINTS.sui, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload.error) throw new Error(payload.error?.message || 'Sui RPC could not prepare this transfer.')
  return payload.result
}

export async function sendSui({ walletId, address, receiver, amount }) {
  const activeWallet = suiWallets().find((item) => item.accounts?.some((account) => account.address?.toLowerCase() === address.toLowerCase()))
  const { wallet, walletStandard, account } = activeWallet
    ? { wallet: { address }, walletStandard: activeWallet, account: activeWallet.accounts.find((item) => item.address?.toLowerCase() === address.toLowerCase()) }
    : await connectSuiWallet(walletId)
  if (wallet.address.toLowerCase() !== address.toLowerCase()) throw new Error('Connect the Sui wallet linked to this deposit before sending.')
  const mist = decimalToAtomic(amount, 9)
  const coins = await suiRpc('suix_getCoins', [address, SUI_COIN_TYPE, null, 50])
  const coin = coins.data?.find((item) => BigInt(item.balance) >= mist + SUI_GAS_BUDGET)
  if (!coin) throw new Error('Your Sui wallet needs the amount plus at least 0.01 SUI available for gas.')
  const prepared = await suiRpc('unsafe_transferSui', [address, coin.coinObjectId, String(SUI_GAS_BUDGET), receiver, String(mist)])
  const feature = walletStandardFeature(walletStandard, 'sui:signAndExecuteTransactionBlock', 'sui:signAndExecuteTransaction')
  const input = feature.name === 'sui:signAndExecuteTransactionBlock'
    ? { account, chain: SUI_MAINNET, transactionBlock: prepared.txBytes, options: { showEffects: true } }
    : { account, chain: SUI_MAINNET, transaction: prepared.txBytes, options: { showEffects: true } }
  const result = await feature.method(input)
  return result.digest || result.effects?.transactionDigest || result.transactionDigest
}

function walletStandardFeature(wallet, ...names) {
  for (const name of names) {
    const feature = wallet.features?.[name]
    if (feature?.signAndExecuteTransactionBlock) return { name, method: feature.signAndExecuteTransactionBlock.bind(feature) }
    if (feature?.signAndExecuteTransaction) return { name, method: feature.signAndExecuteTransaction.bind(feature) }
  }
  throw new Error(`${wallet.name} does not support signing and executing Sui transactions.`)
}

const encodeVarint = (value) => {
  const bytes = []
  let current = BigInt(value)
  while (current > 127n) { bytes.push(Number((current & 127n) | 128n)); current >>= 7n }
  bytes.push(Number(current))
  return Uint8Array.from(bytes)
}
const join = (...parts) => Uint8Array.from(parts.flatMap((part) => [...part]))
const protobufBytes = (field, value) => join(encodeVarint(BigInt(field << 3 | 2)), encodeVarint(value.length), value)
const protobufString = (field, value) => protobufBytes(field, new TextEncoder().encode(value))
const protobufUint = (field, value) => join(encodeVarint(BigInt(field << 3)), encodeVarint(value))

const cosmosRestUrl = () => import.meta.env.VITE_REST_COSMOS || 'https://rest.cosmos.directory/cosmoshub'
const deepBaseAccount = (account) => account?.base_account || account?.base_vesting_account?.base_account || account?.base_account

async function cosmosAccount(address) {
  const response = await fetch(`${cosmosRestUrl()}/cosmos/auth/v1beta1/accounts/${address}`)
  const payload = await response.json().catch(() => ({}))
  const account = deepBaseAccount(payload.account)
  if (!response.ok || !account?.account_number?.toString) throw new Error('Cosmos account details could not be read from the public REST endpoint.')
  return { accountNumber: BigInt(account.account_number), sequence: BigInt(account.sequence || 0) }
}

export async function sendAtom({ providerId, address, receiver, amount }) {
  const { wallet, provider, signer } = await connectCosmosWallet(providerId)
  if (wallet.address.toLowerCase() !== address.toLowerCase()) throw new Error('Connect the Cosmos wallet linked to this deposit before sending.')
  const [account] = await signer.getAccounts()
  const { accountNumber, sequence } = await cosmosAccount(address)
  const amountUatom = decimalToAtomic(amount, 6).toString()
  const coin = join(protobufString(1, 'uatom'), protobufString(2, amountUatom))
  const msgSend = join(protobufString(1, address), protobufString(2, receiver), protobufBytes(3, coin))
  const message = join(protobufString(1, '/cosmos.bank.v1beta1.MsgSend'), protobufBytes(2, msgSend))
  const bodyBytes = protobufBytes(1, message)
  const pubKey = protobufBytes(1, account.pubkey)
  const publicKeyAny = join(protobufString(1, '/cosmos.crypto.secp256k1.PubKey'), protobufBytes(2, pubKey))
  const modeInfo = protobufBytes(1, protobufUint(1, 1))
  const signerInfo = join(protobufBytes(1, publicKeyAny), protobufBytes(2, modeInfo), protobufUint(3, sequence))
  const feeCoin = join(protobufString(1, 'uatom'), protobufString(2, '5000'))
  const fee = join(protobufBytes(1, feeCoin), protobufUint(2, 200000n))
  const authInfoBytes = join(protobufBytes(1, signerInfo), protobufBytes(2, fee))
  const signed = await signer.signDirect(address, { bodyBytes, authInfoBytes, chainId: COSMOS_HUB_CHAIN_ID, accountNumber })
  const txRaw = join(protobufBytes(1, signed.signed.bodyBytes), protobufBytes(2, signed.signed.authInfoBytes), protobufBytes(3, asBytes(signed.signature.signature)))
  const hash = await provider.sendTx(COSMOS_HUB_CHAIN_ID, txRaw, 'sync')
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export async function connectTronWallet() {
  const provider = window.tronLink || window.tronWeb
  if (!provider) throw new Error('Install TronLink or use an installed wallet that exposes a TRON provider.')
  if (window.tronLink?.request) await window.tronLink.request({ method: 'tron_requestAccounts' })
  const tronWeb = window.tronWeb
  const address = tronWeb?.defaultAddress?.base58
  if (!tronWeb || !address) throw new Error('Unlock your TRON wallet and approve the connection request.')
  return { wallet: { id: `tron-tronlink-${address.toLowerCase()}`, address, chainId: 'tron-mainnet', namespace: 'tron', network: 'tron', networks: ['tron'], provider: 'TronLink', providerId: 'tronlink', ecosystem: 'TRON', firstConnected: new Date().toISOString(), verified: false, local: true }, tronWeb }
}

export async function sendTrx({ address, receiver, amount }) {
  const { wallet, tronWeb } = await connectTronWallet()
  if (wallet.address !== address) throw new Error('Connect the TRON wallet linked to this deposit before sending.')
  const sun = decimalToAtomic(amount, 6)
  if (sun > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('This TRX amount is too large to submit from this browser wallet.')
  const transaction = await tronWeb.transactionBuilder.sendTrx(receiver, Number(sun), address)
  const signed = await tronWeb.trx.sign(transaction)
  const result = await tronWeb.trx.sendRawTransaction(signed)
  if (!result.result || !result.txid) throw new Error(result.message || 'TRON rejected this transaction.')
  return result.txid
}
