import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { mainnet, bsc, avalanche, defineChain, polygon, solana } from '@reown/appkit/networks'
import { EVM_RPC_URLS, RPC_ENDPOINTS } from '../../config/rpc'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
const solanaMainnet = {
  ...solana,
  rpcUrls: { ...solana.rpcUrls, default: { http: [RPC_ENDPOINTS.solana] } },
}
const cosmosHub = defineChain({
  id: 'cosmoshub-4',
  name: 'Cosmos Hub',
  network: 'cosmoshub-4',
  nativeCurrency: { name: 'Cosmos Hub Atom', symbol: 'ATOM', decimals: 6 },
  rpcUrls: { default: { http: [RPC_ENDPOINTS.cosmos] } },
  blockExplorers: { default: { name: 'Mintscan', url: 'https://www.mintscan.io/cosmos' } },
  testnet: false,
  chainNamespace: 'cosmos',
  caipNetworkId: 'cosmos:cosmoshub-4',
})
const networks = [mainnet, bsc, avalanche, polygon, solanaMainnet, cosmosHub]
let appKit = null
let wagmiConfig = null
let openingConnectModal = false
let openingReleaseTimer = null

export function initializeReown() {
  if (!projectId || appKit) return appKit
  const evmAdapter = new WagmiAdapter({
    projectId,
    networks: [mainnet, bsc, avalanche, polygon],
    customRpcUrls: EVM_RPC_URLS,
  })
  wagmiConfig = evmAdapter.wagmiConfig
  const solanaAdapter = new SolanaAdapter()
  appKit = createAppKit({
    adapters: [evmAdapter, solanaAdapter], networks, projectId,
    metadata: {
      name: import.meta.env.VITE_APP_NAME || 'Fourstakes',
      description: 'Multi-chain staking infrastructure for digital assets.',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    features: { analytics: true, email: false, socials: [], allWallets: true },
    allWallets: 'SHOW',
    themeMode: 'dark',
    themeVariables: { '--w3m-accent': '#9b87f5', '--w3m-border-radius-master': '2px' },
  })
  return appKit
}

export function getWagmiConfig() {
  initializeReown()
  return wagmiConfig
}

export async function openReownModal(namespace) {
  const client = initializeReown()
  if (!client || openingConnectModal) return undefined
  // Phantom rejects concurrent connect() calls. Do not close/reopen the modal
  // during an active selection; it can create a second provider request.
  openingConnectModal = true
  try {
    return await client.open({ view: 'Connect', namespace })
  } finally {
    window.clearTimeout(openingReleaseTimer)
    openingReleaseTimer = window.setTimeout(() => { openingConnectModal = false }, 800)
  }
}

export function closeReownModal() {
  openingConnectModal = false
  window.clearTimeout(openingReleaseTimer)
  return appKit?.close()
}

export async function disconnectReownWallet(namespace) {
  const client = initializeReown()
  if (!client || !namespace) return undefined
  try {
    await client.disconnect(namespace).catch(() => undefined)
  } finally {
    await client.close().catch(() => undefined)
  }
}

export const isReownConfigured = () => Boolean(projectId)
