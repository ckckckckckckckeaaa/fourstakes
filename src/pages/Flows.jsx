import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useSendTransaction, useSwitchChain } from 'wagmi'
import { isAddress, parseEther } from 'viem'
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { AlertTriangle, ArrowRight, Check, ChevronDown, Clock3, Info, LockKeyhole, ShieldCheck, WalletCards, X } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { AssetIcon, NetworkIcon, WalletIcon } from '../components/Icons'
import { EmptyState, PageHeader, PanelHeader, ServiceState, shortAddress } from '../components/Common'
import { compatibleAssets, getAsset, NETWORKS, walletDisplayName } from '../config/catalog'
import { RPC_ENDPOINTS } from '../config/rpc'
import { sendAtom, sendSui, sendTrx } from '../web3/native/senders'

const receivers = {
  ETH: import.meta.env.VITE_FOURSTAKES_ETH_RECEIVER,
  SOL: import.meta.env.VITE_FOURSTAKES_SOL_RECEIVER,
  BNB: import.meta.env.VITE_FOURSTAKES_BNB_RECEIVER,
  SUI: import.meta.env.VITE_FOURSTAKES_SUI_RECEIVER,
  ATOM: import.meta.env.VITE_FOURSTAKES_ATOM_RECEIVER,
  TRX: import.meta.env.VITE_FOURSTAKES_TRX_RECEIVER,
  AVAX: import.meta.env.VITE_FOURSTAKES_AVAX_RECEIVER,
  POL: import.meta.env.VITE_FOURSTAKES_POLYGON_RECEIVER,
}
const EVM_CHAIN_IDS = { ethereum: 1, bnb: 56, avalanche: 43114, polygon: 137 }
const MINIMUM_DEPOSITS = {
  ETH: 0.01,
  BNB: 0.1,
  SOL: 0.1,
  AVAX: 0.1,
  ATOM: 0.1,
  SUI: 1,
  POL: 10,
  TRX: 100,
}

const isSolanaAddress = (value) => {
  try { return new PublicKey(value).toBase58() === value }
  catch { return false }
}

const isConfiguredReceiver = (asset, value) => {
  if (!value) return false
  if (EVM_CHAIN_IDS[asset.network]) return isAddress(value)
  if (asset.network === 'solana') return isSolanaAddress(value)
  if (asset.network === 'cosmos') return /^cosmos1[02-9ac-hj-np-z]{38}$/.test(value)
  if (asset.network === 'sui') return /^0x[0-9a-fA-F]{64}$/.test(value)
  if (asset.network === 'tron') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)
  return false
}

const transferErrorMessage = (error) => {
  const message = String(error?.shortMessage || error?.message || '')
  if (/user rejected|user denied|rejected the request/i.test(message)) return 'Transaction cancelled. No funds were sent.'
  if (/insufficient funds|insufficient balance/i.test(message)) return 'Your wallet does not have enough funds to cover this amount and the network fee.'
  if (/chain|network/i.test(message)) return 'Switch to the required network in your wallet and try again.'
  return 'We could not prepare this transaction. Review the amount and network, then try again.'
}

function StepRail({ active = 1, labels }) {
  return <ol className="step-rail">{labels.map((label, index) => <li className={index + 1 <= active ? 'active' : ''} key={label}><span>{index + 1 < active ? <Check size={13}/> : index + 1}</span><div><strong>{label}</strong><small>{index + 1 < active ? 'Complete' : index + 1 === active ? 'In progress' : 'Next'}</small></div></li>)}</ol>
}

function ThemedSelect({ value, onChange, options, placeholder, disabled = false, renderIcon }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const selected = options.find((option) => option.value === value)
  useEffect(() => {
    const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  return <div className={`themed-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={root}>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} disabled={disabled} onClick={() => setOpen((current) => !current)}>{renderIcon(selected)}<span className="themed-select-label">{selected?.label || placeholder}</span><ChevronDown size={17}/></button>
    {open && <div className="themed-select-menu" role="listbox">{options.length ? options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false) }}>{renderIcon(option)}<span className="themed-select-label">{option.label}</span>{option.value === value && <Check size={15}/>}</button>) : <p>No compatible options</p>}</div>}
  </div>
}

function SelectAssetWallet({ symbol, setSymbol, walletId, setWalletId, wallets, balanceOnly = false, assetFirst = false, filterWalletsByAsset = false }) {
  const { assets, balances } = useStakeion()
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId)
  const compatibleWallets = (assetFirst || filterWalletsByAsset) && symbol
    ? wallets.filter((wallet) => compatibleAssets(wallet).some((asset) => asset.symbol === symbol))
    : wallets
  const walletAssets = selectedWallet ? compatibleAssets(selectedWallet).map((item) => assets.find((asset) => asset.symbol === item.symbol) || item) : []
  const availableAssets = assetFirst ? assets : balanceOnly ? walletAssets.filter((asset) => balances.some((balance) => (balance.walletId || balance.wallet_id) === walletId && balance.symbol === asset.symbol && Number(balance.available) > 0)) : walletAssets
  const selectWallet = (nextWalletId) => {
    const wallet = wallets.find((item) => item.id === nextWalletId)
    const nextAssets = wallet ? compatibleAssets(wallet).map((item) => assets.find((asset) => asset.symbol === item.symbol) || item) : []
    const selectable = balanceOnly ? nextAssets.filter((asset) => balances.some((balance) => (balance.walletId || balance.wallet_id) === nextWalletId && balance.symbol === asset.symbol && Number(balance.available) > 0)) : nextAssets
    setWalletId(nextWalletId)
    setSymbol((current) => selectable.some((asset) => asset.symbol === current) ? current : '')
  }
  const selectAsset = (nextSymbol) => {
    setSymbol(nextSymbol)
    if (selectedWallet && !compatibleAssets(selectedWallet).some((asset) => asset.symbol === nextSymbol)) setWalletId('')
  }
  const walletOptions = compatibleWallets.map((wallet) => ({ value: wallet.id, label: `${walletDisplayName(wallet)} · ${shortAddress(wallet.address)}`, providerId: wallet.providerId }))
  const assetOptions = availableAssets.map((asset) => ({ value: asset.symbol, label: `${asset.symbol} · ${asset.networkName}`, symbol: asset.symbol }))
  const walletField = <label className="field"><span>Linked wallet</span><ThemedSelect value={walletId} onChange={selectWallet} options={walletOptions} placeholder={assetFirst && !symbol ? 'Select asset first' : assetFirst && symbol ? `Choose a ${symbol} wallet` : 'Select linked wallet'} disabled={assetFirst && !symbol} renderIcon={(option) => option ? <WalletIcon providerId={option.providerId} size={24}/> : <WalletCards size={21}/>}/><small>{symbol ? `${walletOptions.length} linked wallet${walletOptions.length === 1 ? '' : 's'} compatible with ${symbol}` : `${wallets.length} linked wallet${wallets.length === 1 ? '' : 's'}`}</small></label>
  const assetField = <label className="field"><span>Asset</span><ThemedSelect value={symbol} onChange={selectAsset} options={assetOptions} placeholder={assetFirst ? 'Select deposit asset' : walletId ? 'Select supported asset' : 'Select wallet first'} disabled={!assetFirst && !walletId} renderIcon={(option) => option ? <AssetIcon symbol={option.symbol} size={24}/> : <WalletCards size={21}/>}/><small>{symbol ? getAsset(symbol)?.networkName : assetFirst ? 'Choose the network asset you want to deposit.' : 'Assets are filtered by wallet ecosystem and network.'}</small></label>
  return <div className="form-grid two">{assetFirst ? <>{assetField}{walletField}</> : <>{walletField}{assetField}</>}</div>
}

function TransactionSummary({ asset, wallet, amount, type, available = 0 }) {
  const estimated = amount * asset.apy / 100
  return <aside className="transaction-summary panel"><PanelHeader title="Transaction summary" meta="Review before you continue"/><div className="summary-asset"><AssetIcon symbol={asset.symbol} size={42}/><div><strong>{amount || '0'} {asset.symbol}</strong><span>{asset.networkName}</span></div><NetworkIcon network={asset.network} size={24}/></div><dl><div><dt>Wallet</dt><dd>{wallet ? walletDisplayName(wallet) : 'Not selected'}</dd></div><div><dt>Available balance</dt><dd>{available} {asset.symbol}</dd></div>{type === 'stake' && <><div><dt>Current APY</dt><dd>{asset.apy}%</dd></div><div><dt>Estimated yearly rewards</dt><dd className="positive">{estimated.toFixed(4)} {asset.symbol}</dd></div></>}<div><dt>Fourstakes fee</dt><dd>0%</dd></div><div><dt>Network fee</dt><dd>Shown before confirmation</dd></div></dl><div className="summary-disclosure"><Info size={15}/><p>{type === 'stake' ? 'Rewards are estimated from the current variable APY and are not guaranteed.' : 'Your amount is credited after the transfer is confirmed on the selected network.'}</p></div></aside>
}

export function StakePage() {
  const [params] = useSearchParams()
  const { wallets, balances, pools, stake, status, error, refresh, isBackendConfigured } = useStakeion()
  const requestedAsset = params.get('asset')?.toUpperCase() || ''
  const [symbol, setSymbol] = useState(() => getAsset(requestedAsset)?.symbol || '')
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const pool = pools.find((item) => item.symbol === symbol)
  const asset = { ...(getAsset(symbol) || getAsset('ETH')), apy: Number(pool?.apy || pool?.currentApy || pool?.current_apy || 0) }
  const wallet = wallets.find((item) => item.id === walletId)
  const balance = balances.find((item) => (item.walletId || item.wallet_id) === walletId && item.symbol === symbol)
  const canSubmit = isBackendConfigured && walletId && pool?.id && Number(amount) > 0 && Number(amount) <= (balance?.available || 0)
  const submit = async () => { if (canSubmit && await stake({ walletId, symbol, amount: Number(amount), poolId: pool?.id })) setAmount('') }
  useEffect(() => {
    if (!symbol) return undefined
    const selectedIsCompatible = wallets.some((item) => item.id === walletId && compatibleAssets(item).some((itemAsset) => itemAsset.symbol === symbol))
    if (selectedIsCompatible) return undefined
    const compatibleWallet = wallets.find((item) => item.status === 'Connected' && compatibleAssets(item).some((itemAsset) => itemAsset.symbol === symbol))
      || wallets.find((item) => compatibleAssets(item).some((itemAsset) => itemAsset.symbol === symbol))
    if (!compatibleWallet) return undefined
    const task = window.setTimeout(() => setWalletId(compatibleWallet.id), 0)
    return () => window.clearTimeout(task)
  }, [symbol, walletId, wallets])
  if (status !== 'ready') return <><PageHeader eyebrow="Earn rewards" title="Stake assets" description="Loading your available balances and staking options."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  return <><PageHeader eyebrow="Earn rewards" title="Stake assets" description="Choose a wallet, select a supported network asset, and review your stake."/><div className="flow-layout"><section className="panel flow-form"><StepRail active={2} labels={['Choose wallet', 'Choose asset', 'Review']}/><SelectAssetWallet {...{ symbol, setSymbol, walletId, setWalletId }} wallets={wallets} filterWalletsByAsset/><label className="field amount-field"><span>Amount to stake</span><div><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" disabled={!symbol}/><b>{symbol}</b><button disabled={!balance} onClick={() => setAmount(String(balance?.available || 0))}>MAX</button></div><small>Available: {balance?.available || 0} {symbol}</small></label>{walletId && symbol && !balance && <div className="inline-warning"><AlertTriangle size={17}/>There is no available {symbol} balance in this wallet yet. <Link to="/deposit">Make a deposit first</Link></div>}{!isBackendConfigured && <div className="inline-warning"><AlertTriangle size={17}/>Account service is not configured. Staking stays disabled until VITE_API_URL points to the Fourstakes backend.</div>}<div className="inline-warning"><Info size={17}/>Promotional rewards can be withdrawn after completing a qualifying 90-day stake.</div><button disabled={!canSubmit} className="button primary full large" onClick={submit}>Review stake <ArrowRight size={17}/></button><p className="secure-note"><ShieldCheck size={15}/>We check your balance and eligibility before your stake is recorded.</p></section><TransactionSummary asset={asset} wallet={wallet} amount={Number(amount)} available={balance?.available || 0} type="stake"/></div></>
}

export function DepositPage() {
  const { wallets, status, error, refresh } = useStakeion()
  const { address: evmAddress, chainId: evmChainId, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { address: solanaAddress, isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' })
  const { walletProvider: solanaProvider } = useAppKitProvider('solana')
  const { mutateAsync: sendEvmTransaction, isPending: isEvmSending } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const [symbol, setSymbol] = useState('')
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [amountModalOpen, setAmountModalOpen] = useState(false)
  const [transferHash, setTransferHash] = useState('')
  const [transferError, setTransferError] = useState('')
  const [isNativeSending, setIsNativeSending] = useState(false)
  const amountInput = useRef(null)
  const asset = getAsset(symbol) || getAsset('ETH')
  const wallet = wallets.find((item) => item.id === walletId)
  const configuredReceiver = receivers[symbol]
  const minimumAmount = MINIMUM_DEPOSITS[asset.symbol] ?? 0
  const numericAmount = Number(amount)
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const isBelowMinimum = hasAmount && numericAmount < minimumAmount
  const targetChainId = symbol ? EVM_CHAIN_IDS[asset.network] : undefined
  const receiverValid = isConfiguredReceiver(asset, configuredReceiver)
  const receiver = receiverValid ? configuredReceiver : undefined
  const selectedWalletMatchesEvm = wallet?.address?.toLowerCase() === evmAddress?.toLowerCase()
  const selectedWalletMatchesSolana = wallet?.address === solanaAddress
  const canPrepareEvm = Boolean(targetChainId && walletId && receiverValid && isEvmConnected && selectedWalletMatchesEvm)
  const canPrepareSolana = Boolean(asset.network === 'solana' && walletId && receiverValid && isSolanaConnected && selectedWalletMatchesSolana && solanaProvider)
  const canPrepareNative = Boolean(walletId && receiverValid && ((asset.network === 'sui' && wallet?.namespace === 'sui') || (asset.network === 'cosmos' && wallet?.namespace === 'cosmos') || (asset.network === 'tron' && wallet?.namespace === 'tron')))
  const validateAmount = () => {
    if (hasAmount && !isBelowMinimum) return true
    setAmountModalOpen(true)
    return false
  }
  const closeAmountModal = () => {
    setAmountModalOpen(false)
    window.setTimeout(() => amountInput.current?.focus(), 0)
  }
  useEffect(() => {
    if (!amountModalOpen) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setAmountModalOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [amountModalOpen])
  const sendFromEvmWallet = async () => {
    if (!canPrepareEvm || !validateAmount()) return
    setTransferError('')
    setTransferHash('')
    try {
      if (Number(evmChainId) !== targetChainId) await switchChainAsync({ chainId: targetChainId })
      const hash = await sendEvmTransaction({ chainId: targetChainId, to: receiver, value: parseEther(amount) })
      setTransferHash(hash)
    } catch (sendError) {
      setTransferError(transferErrorMessage(sendError))
    }
  }
  const sendFromSolanaWallet = async () => {
    if (!canPrepareSolana || !validateAmount()) return
    setTransferError('')
    setTransferHash('')
    try {
      const connection = new Connection(RPC_ENDPOINTS.solana, 'confirmed')
      const from = solanaProvider.publicKey || new PublicKey(solanaAddress)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      const transaction = new Transaction({ feePayer: from, blockhash, lastValidBlockHeight }).add(
        SystemProgram.transfer({ fromPubkey: from, toPubkey: new PublicKey(receiver), lamports: Math.round(numericAmount * LAMPORTS_PER_SOL) }),
      )
      const signature = await solanaProvider.sendTransaction(transaction, connection, { preflightCommitment: 'confirmed' })
      setTransferHash(signature)
    } catch (sendError) { setTransferError(transferErrorMessage(sendError)) }
  }
  const sendFromNativeWallet = async () => {
    if (!canPrepareNative || !validateAmount()) return
    setTransferError('')
    setTransferHash('')
    setIsNativeSending(true)
    try {
      const hash = asset.network === 'sui'
        ? await sendSui({ walletId: wallet.id, address: wallet.address, receiver, amount })
        : asset.network === 'cosmos'
          ? await sendAtom({ providerId: wallet.providerId, address: wallet.address, receiver, amount })
          : await sendTrx({ address: wallet.address, receiver, amount })
      if (!hash) throw new Error('The wallet did not return a transaction identifier.')
      setTransferHash(hash)
    } catch (sendError) { setTransferError(transferErrorMessage(sendError)) } finally { setIsNativeSending(false) }
  }
  if (status !== 'ready') return <><PageHeader eyebrow="Add funds" title="Deposit" description="Preparing your wallets and deposit details."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  const directSendSupported = Boolean(targetChainId || asset.network === 'solana' || ['sui', 'cosmos', 'tron'].includes(asset.network))
  return <><PageHeader eyebrow="Add funds" title="Deposit" description="Choose a linked wallet first, then send an asset supported by that wallet's connected network."/><div className="flow-layout"><section className="panel flow-form"><StepRail active={2} labels={['Choose wallet', 'Choose asset', 'Confirm transfer']}/><SelectAssetWallet {...{ symbol, setSymbol, walletId, setWalletId }} wallets={wallets}/>{walletId && symbol && receiver && <div className="receiver-block"><div className="qr-code" aria-label={`${symbol} deposit QR code`}><QRCode value={receiver} size={72} bgColor="#ffffff" fgColor="#111111"/></div><div><span>Validated receiver format · {asset.networkName}</span><code>{receiver}</code></div></div>}{walletId && symbol && !receiver && <div className="inline-warning"><AlertTriangle size={17}/>The configured receiver for {asset.networkName} is missing or invalid. Sending is disabled.</div>}<label className="field amount-field"><span>Amount to send</span><div><input ref={amountInput} type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" disabled={!symbol}/><b>{symbol}</b></div><small>{symbol ? `Minimum deposit: ${minimumAmount} ${symbol}. Keep enough ${symbol} for the network fee.` : walletId ? 'Select one of the assets supported by this wallet.' : 'Select a linked wallet first.'}</small></label>{walletId && targetChainId && !selectedWalletMatchesEvm && <div className="inline-warning"><AlertTriangle size={17}/>Connect the selected EVM wallet before sending this deposit.</div>}{walletId && asset.network === 'solana' && !selectedWalletMatchesSolana && <div className="inline-warning"><AlertTriangle size={17}/>Connect the selected Solana wallet before sending this deposit.</div>}{walletId && symbol && <div className="inline-warning"><Info size={17}/>Send only {symbol} on {asset.networkName}. Keep your transaction hash until the transfer is confirmed.</div>}{symbol && <div className="network-facts"><div><NetworkIcon network={asset.network}/><span>Network</span><strong>{asset.networkName}</strong></div><div><Clock3 size={19}/><span>Estimated confirmation</span><strong>About {NETWORKS[asset.network].confirmations} blocks</strong></div></div>}{!walletId || !symbol ? <button className="button primary full large" disabled>{!walletId ? 'Select a wallet to continue' : 'Select a supported asset'}</button> : targetChainId ? <button disabled={!canPrepareEvm || isEvmSending} className="button primary full large" onClick={sendFromEvmWallet}>{isEvmSending ? 'Check your wallet…' : `Send ${symbol} from wallet`}<ArrowRight size={17}/></button> : asset.network === 'solana' ? <button disabled={!canPrepareSolana} className="button primary full large" onClick={sendFromSolanaWallet}>Send {symbol} from wallet<ArrowRight size={17}/></button> : <button disabled={!canPrepareNative || isNativeSending} className="button primary full large" onClick={sendFromNativeWallet}>{isNativeSending ? 'Check your wallet…' : `Send ${symbol} from wallet`}<ArrowRight size={17}/></button>}{transferError && <div className="inline-warning"><AlertTriangle size={17}/>{transferError}</div>}{transferHash && <div className="inline-success"><Check size={17}/>Transaction submitted: {transferHash.slice(0, 10)}…{transferHash.slice(-8)}</div>}{symbol && <div className="inline-warning"><Info size={17}/>{directSendSupported ? 'Review the validated receiver, amount, and network in your wallet before approving.' : 'This asset network is not supported for direct sending.'}</div>}</section>{symbol ? <TransactionSummary asset={asset} wallet={wallet} amount={numericAmount} type="deposit"/> : <aside className="transaction-summary panel"><PanelHeader title="Transaction summary" meta="Select an asset to continue"/><EmptyState icon={WalletCards} title="No asset selected" detail="Choose a linked wallet, then select one of its supported network assets."/></aside>}</div>{amountModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={closeAmountModal}><div className="modal deposit-validation-modal" role="alertdialog" aria-modal="true" aria-labelledby="deposit-amount-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Deposit validation</span><h2 id="deposit-amount-title">{hasAmount ? 'Amount below minimum' : 'Enter a deposit amount'}</h2><p>{hasAmount ? `The amount entered does not meet the minimum deposit for ${asset.symbol}.` : `Enter an amount before continuing with your ${asset.symbol} deposit.`}</p></div><button className="icon-button" aria-label="Close amount validation" onClick={closeAmountModal}><X size={20}/></button></div><div className="deposit-validation-body"><div className="deposit-validation-asset"><AssetIcon symbol={asset.symbol} size={38}/><div><span>{asset.name}</span><strong>{asset.symbol} · {asset.networkName}</strong></div></div><dl><div><dt>Amount entered</dt><dd>{hasAmount ? `${amount} ${asset.symbol}` : 'No amount entered'}</dd></div><div><dt>Minimum deposit</dt><dd className="positive">{minimumAmount} {asset.symbol}</dd></div></dl><div className="deposit-validation-actions"><button className="button primary full" onClick={() => { setAmount(String(minimumAmount)); setAmountModalOpen(false) }}>Use minimum amount</button><button className="button secondary full" onClick={closeAmountModal}>Edit amount</button></div><p><ShieldCheck size={14}/>The wallet request will only open after the amount passes validation.</p></div></div></div>}</>
}

export function UnstakePage() {
  const { portfolio, unstake, status, error, refresh } = useStakeion()
  const [selected, setSelected] = useState('')
  const [amount, setAmount] = useState('')
  const effectiveSelected = selected || portfolio.find((item) => item.staked > 0)?.id || ''
  const position = portfolio.find((item) => item.id === effectiveSelected)
  if (status !== 'ready') return <><PageHeader eyebrow="Manage your stake" title="Unstake" description="Loading your staked assets."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  if (!position) return <><PageHeader eyebrow="Position management" title="Unstake" description="Move eligible staking principal back to your available balance."/><EmptyState title="No active staking positions" detail="Stake a supported asset to create your first position." action={<Link className="button primary" to="/staking-pools">Explore pools</Link>}/></>
  const canSubmit = Number(amount) > 0 && Number(amount) <= position.staked
  return <><PageHeader eyebrow="Position management" title="Unstake" description="Move eligible staking principal back to your available balance."/><div className="flow-layout"><section className="panel flow-form"><div className="position-selector">{portfolio.filter((item) => item.staked > 0).map((item) => <button className={item.id === effectiveSelected ? 'active' : ''} key={item.id} onClick={() => { setSelected(item.id); setAmount('') }}><AssetIcon symbol={item.symbol} size={32}/><span><strong>{item.symbol}</strong><small>{item.wallet.provider}</small></span><b>{item.staked} {item.symbol}</b></button>)}</div><label className="field amount-field"><span>Amount to unstake</span><div><input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00"/><b>{position.symbol}</b><button onClick={() => setAmount(String(position.staked))}>MAX</button></div><small>Staked: {position.staked} {position.symbol}</small></label><button disabled={!canSubmit} className="button primary full large" onClick={async () => { if (await unstake({ walletId: position.walletId, symbol: position.symbol, amount: Number(amount), positionId: position.id })) setAmount('') }}>Confirm unstake<ArrowRight size={17}/></button></section><TransactionSummary asset={position.asset} wallet={position.wallet} amount={Number(amount)} available={position.staked} type="unstake"/></div></>
}

export function WithdrawPage() {
  const { wallets, balances, withdraw, status, error, refresh, isBackendConfigured } = useStakeion()
  const [symbol, setSymbol] = useState('')
  const [walletId, setWalletId] = useState('')
  const [amount, setAmount] = useState('')
  const [destination, setDestination] = useState('')
  const asset = getAsset(symbol) || getAsset('ETH')
  const wallet = wallets.find((item) => item.id === walletId)
  const balance = balances.find((item) => (item.walletId || item.wallet_id) === walletId && item.symbol === symbol)
  const destinationValid = Boolean(symbol && isConfiguredReceiver(asset, destination.trim()))
  const canSubmit = isBackendConfigured && walletId && destinationValid && Number(amount) > 0 && Number(amount) <= (balance?.available || 0)
  if (status !== 'ready') return <><PageHeader eyebrow="Move funds" title="Withdraw" description="Loading your available balance."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  return <><PageHeader eyebrow="Move funds" title="Withdraw" description="Send your available balance to a wallet on the same network."/><div className="flow-layout"><section className="panel flow-form"><StepRail active={2} labels={['Choose wallet', 'Choose asset', 'Review']}/><SelectAssetWallet {...{ symbol, setSymbol, walletId, setWalletId }} wallets={wallets} balanceOnly/><label className="field"><span>Destination address</span><div className="input-icon"><LockKeyhole size={17}/><input value={destination} disabled={!symbol} onChange={(event) => setDestination(event.target.value)} placeholder={symbol ? `Enter a ${asset.networkName} address` : 'Select an asset first'}/></div><small>{symbol ? `Use an address on ${asset.networkName} only.` : 'The destination format is validated against the selected network.'}</small></label>{destination && !destinationValid && <div className="inline-warning"><AlertTriangle size={17}/>This is not a valid {asset.networkName} destination address.</div>}<label className="field amount-field"><span>Amount to withdraw</span><div><input type="number" value={amount} disabled={!symbol} onChange={(event) => setAmount(event.target.value)} placeholder="0.00"/><b>{symbol}</b><button disabled={!balance} onClick={() => setAmount(String(balance?.available || 0))}>MAX</button></div><small>Available: {balance?.available || 0} {symbol}. Promotional rewards are available after a qualifying 90-day stake.</small></label>{!isBackendConfigured && <div className="inline-warning"><AlertTriangle size={17}/>Account service is not configured. Withdrawals stay disabled until VITE_API_URL points to the Fourstakes backend.</div>}<div className="withdraw-fees"><div><span>Withdrawal amount</span><strong>{amount || '0'} {symbol}</strong></div><div><span>Network fee</span><strong>Shown before confirmation</strong></div><div><span>Fourstakes fee</span><strong>0%</strong></div></div><button disabled={!canSubmit} className="button primary full large" onClick={async () => { if (await withdraw({ walletId, symbol, amount: Number(amount), destination: destination.trim() })) { setAmount(''); setDestination('') } }}>Review withdrawal <ArrowRight size={17}/></button><p className="secure-note"><ShieldCheck size={15}/>We check your destination, balance, and account before the withdrawal is processed.</p></section><TransactionSummary asset={asset} wallet={wallet} amount={Number(amount)} available={balance?.available || 0} type="withdraw"/></div></>
}
