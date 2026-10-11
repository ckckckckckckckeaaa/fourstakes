export const COSMOS_HUB_CHAIN_ID = 'cosmoshub-4'

const providers = () => [
  { id: 'okx', name: 'OKX Wallet', provider: window.okxwallet?.keplr },
  { id: 'keplr', name: 'Keplr', provider: window.keplr },
  { id: 'leap', name: 'Leap', provider: window.leap },
  { id: 'cosmostation', name: 'Cosmostation', provider: window.cosmostation?.providers?.keplr },
].filter((item) => item.provider)

export function availableCosmosWallets() {
  return providers().map(({ id, name }) => ({ id, name }))
}

export async function connectCosmosWallet(preferredProviderId) {
  const available = providers()
  const selected = available.find((item) => item.id === preferredProviderId) || available[0]
  if (!selected) throw new Error('Install OKX Wallet, Keplr, Leap, or Cosmostation to connect Cosmos Hub.')

  await selected.provider.enable(COSMOS_HUB_CHAIN_ID)
  const signer = selected.provider.getOfflineSigner(COSMOS_HUB_CHAIN_ID)
  const [account] = await signer.getAccounts()
  if (!account?.address) throw new Error('The wallet did not return a Cosmos Hub account.')

  return {
    wallet: {
      id: `cosmos-${selected.id}-${account.address.toLowerCase()}`,
      address: account.address,
      chainId: COSMOS_HUB_CHAIN_ID,
      namespace: 'cosmos',
      network: 'cosmos',
      networks: ['cosmos'],
      provider: selected.name,
      providerId: selected.id,
      ecosystem: 'Cosmos Hub',
      firstConnected: new Date().toISOString(),
      verified: false,
      local: true,
    },
    provider: selected.provider,
    signer,
  }
}
