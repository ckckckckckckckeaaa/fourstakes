/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAppKitAccount, useWalletInfo } from '@reown/appkit/react'
import { ASSETS, NETWORKS, getAsset, getWalletProvider } from '../config/catalog'
import { accountApi } from '../services/api/client'
import { fetchBinanceMarkets, subscribeBinanceMarkets } from '../services/marketData/binance'
import { fetchNetworkActivity, isNetworkActivityConfigured, subscribeNetworkActivity } from '../services/supabase/networkActivity'
import { disconnectReownWallet } from '../web3/reown/appkit'

const StakeionContext = createContext(null)
const list = (payload, key) => Array.isArray(payload) ? payload : payload?.[key] || payload?.data || []
const apiConfigured = Boolean(import.meta.env.VITE_API_URL)
const LOCAL_WALLETS_KEY = 'fourstakes-linked-wallets'
const EVM_NETWORKS = { 1: 'ethereum', 56: 'bnb', 137: 'polygon', 43114: 'avalanche' }
const EVM_NETWORK_KEYS = Object.values(EVM_NETWORKS)

function networksForConnection(provider, namespace) {
  if (namespace === 'solana') return provider.networks.includes('solana') ? ['solana'] : []
  if (namespace === 'cosmos') return provider.networks.includes('cosmos') ? ['cosmos'] : []
  if (namespace === 'sui') return provider.networks.includes('sui') ? ['sui'] : []
  if (namespace === 'tron') return provider.networks.includes('tron') ? ['tron'] : []
  return provider.networks.filter((network) => EVM_NETWORK_KEYS.includes(network))
}

const createDemoData = () => {
  const now = Date.now()
  const demoWallets = [
    { id: 'validator-ops-eth', providerId: 'ledger', provider: 'Validator Ops', address: '0xFA6B8F089E2747E145B6F5B51A0D7D012D7F76A1', chainId: 1, network: 'ethereum', networks: ['ethereum', 'bnb', 'avalanche'], ecosystem: 'Ethereum', firstConnected: '2026-10-02T09:15:00.000Z', verified: true, local: true },
    { id: 'validator-ops-sol', providerId: 'phantom', provider: 'Stake Relay', address: '9nYQ9hH3kM4F8fV6KdT1C8h9s1dQvNj7m3XyUeG6J5P', chainId: 101, network: 'solana', networks: ['solana'], ecosystem: 'Solana', firstConnected: '2026-10-04T11:40:00.000Z', verified: true, local: true },
    { id: 'validator-ops-bnb', providerId: 'okx', provider: 'BNB Council', address: '0xC91B9FEC317C6BA4D1A4F4A0D3A19E6A4D21C8FE', chainId: 56, network: 'bnb', networks: ['bnb', 'ethereum'], ecosystem: 'BNB Smart Chain', firstConnected: '2026-10-06T08:00:00.000Z', verified: true, local: true },
    { id: 'validator-ops-cosmos', providerId: 'keplr', provider: 'Network Treasury', address: 'cosmos14c7d4q3k9n8f2s1q3h7r8m0k4p6d9w8x2y6z3a', chainId: null, network: 'cosmos', networks: ['cosmos', 'solana'], ecosystem: 'Cosmos', firstConnected: '2026-10-06T14:25:00.000Z', verified: true, local: true },
  ]

  const demoMarkets = [
    { symbol: 'ETH', priceUsd: 3128.42, change24h: 1.48, timestamp: now },
    { symbol: 'SOL', priceUsd: 138.74, change24h: 2.21, timestamp: now },
    { symbol: 'BNB', priceUsd: 611.83, change24h: 0.92, timestamp: now },
    { symbol: 'ATOM', priceUsd: 9.94, change24h: -0.34, timestamp: now },
    { symbol: 'AVAX', priceUsd: 35.81, change24h: 1.87, timestamp: now },
    { symbol: 'SUI', priceUsd: 1.68, change24h: 2.13, timestamp: now },
    { symbol: 'POL', priceUsd: 0.74, change24h: 0.68, timestamp: now },
    { symbol: 'TRX', priceUsd: 0.26, change24h: -0.52, timestamp: now },
  ]

  const demoPools = [
    { id: 'pool-eth', symbol: 'ETH', network: 'ethereum', networkName: 'Ethereum', ecosystem: 'EVM', apy: 4.6, tvl: 620000, status: 'Active', lockPeriod: '28 days', price: 3128.42, change: 1.48, isActive: true },
    { id: 'pool-sol', symbol: 'SOL', network: 'solana', networkName: 'Solana', ecosystem: 'Solana', apy: 6.8, tvl: 340000, status: 'Active', lockPeriod: '30 days', price: 138.74, change: 2.21, isActive: true },
    { id: 'pool-bnb', symbol: 'BNB', network: 'bnb', networkName: 'BNB Smart Chain', ecosystem: 'EVM', apy: 5.4, tvl: 215000, status: 'Active', lockPeriod: '21 days', price: 611.83, change: 0.92, isActive: true },
    { id: 'pool-atom', symbol: 'ATOM', network: 'cosmos', networkName: 'Cosmos Hub', ecosystem: 'Cosmos', apy: 7.2, tvl: 190000, status: 'Active', lockPeriod: '14 days', price: 9.94, change: -0.34, isActive: true },
    { id: 'pool-avax', symbol: 'AVAX', network: 'avalanche', networkName: 'Avalanche C-Chain', ecosystem: 'EVM', apy: 5.9, tvl: 165000, status: 'Active', lockPeriod: '21 days', price: 35.81, change: 1.87, isActive: true },
    { id: 'pool-sui', symbol: 'SUI', network: 'sui', networkName: 'Sui', ecosystem: 'Sui', apy: 6.1, tvl: 125000, status: 'Active', lockPeriod: '30 days', price: 1.68, change: 2.13, isActive: true },
    { id: 'pool-pol', symbol: 'POL', network: 'polygon', networkName: 'Polygon PoS', ecosystem: 'EVM', apy: 4.9, tvl: 45000, status: 'Active', lockPeriod: '21 days', price: 0.74, change: 0.68, isActive: true },
    { id: 'pool-trx', symbol: 'TRX', network: 'tron', networkName: 'TRON', ecosystem: 'TRON', apy: 5.2, tvl: 32000, status: 'Active', lockPeriod: '7 days', price: 0.26, change: -0.52, isActive: true },
  ]

  const demoBalances = [
    { id: 'bal-eth', walletId: 'validator-ops-eth', symbol: 'ETH', available: 12.4, staked: 186.2, rewards: 2.8, promoRewardsLocked: 0.5, deposited: 198.6 },
    { id: 'bal-sol', walletId: 'validator-ops-sol', symbol: 'SOL', available: 820, staked: 15100, rewards: 184, promoRewardsLocked: 22, deposited: 15920 },
    { id: 'bal-bnb', walletId: 'validator-ops-bnb', symbol: 'BNB', available: 134, staked: 1139, rewards: 18, promoRewardsLocked: 3, deposited: 1273 },
    { id: 'bal-atom', walletId: 'validator-ops-cosmos', symbol: 'ATOM', available: 1620, staked: 4680, rewards: 105, promoRewardsLocked: 14, deposited: 6300 },
    { id: 'bal-avax', walletId: 'validator-ops-eth', symbol: 'AVAX', available: 810, staked: 3680, rewards: 64, promoRewardsLocked: 11, deposited: 4490 },
    { id: 'bal-sui', walletId: 'validator-ops-sol', symbol: 'SUI', available: 2200, staked: 6600, rewards: 128, promoRewardsLocked: 14, deposited: 8800 },
    { id: 'bal-pol', walletId: 'validator-ops-eth', symbol: 'POL', available: 940, staked: 760, rewards: 18, promoRewardsLocked: 5, deposited: 1700 },
    { id: 'bal-trx', walletId: 'validator-ops-cosmos', symbol: 'TRX', available: 62000, staked: 168000, rewards: 4420, promoRewardsLocked: 610, deposited: 233000 },
  ]

  const demoLedger = [
    { id: 'ledger-1', type: 'Stake', symbol: 'ETH', amount: 8.6, status: 'Confirmed', date: new Date(now - 1000 * 60 * 42).toISOString() },
    { id: 'ledger-2', type: 'Deposit', symbol: 'SOL', amount: 420, status: 'Confirmed', date: new Date(now - 1000 * 60 * 89).toISOString() },
    { id: 'ledger-3', type: 'Withdraw', symbol: 'ATOM', amount: -180, status: 'Completed', date: new Date(now - 1000 * 60 * 140).toISOString() },
    { id: 'ledger-4', type: 'Reward', symbol: 'BNB', amount: 4.4, status: 'Confirmed', date: new Date(now - 1000 * 60 * 240).toISOString() },
    { id: 'ledger-5', type: 'Stake', symbol: 'SUI', amount: 420, status: 'Pending', date: new Date(now - 1000 * 60 * 8 * 60).toISOString() },
  ]

  const demoHistory = [
    { timestamp: '2026-09-30', valueUsd: 1574000 },
    { timestamp: '2026-10-01', valueUsd: 1631000 },
    { timestamp: '2026-10-02', valueUsd: 1716000 },
    { timestamp: '2026-10-03', valueUsd: 1765000 },
    { timestamp: '2026-10-04', valueUsd: 1802000 },
    { timestamp: '2026-10-05', valueUsd: 1839000 },
    { timestamp: '2026-10-06', valueUsd: 1843000 },
  ]

  const demoNotifications = [
    { id: 'note-1', title: 'ETH validator queue refreshed', read: true },
    { id: 'note-2', title: 'SOL reward cycle boosted performance', read: false },
    { id: 'note-3', title: 'ATOM staking cycle is available', read: false },
  ]

  return { wallets: demoWallets, balances: demoBalances, ledger: demoLedger, markets: demoMarkets, pools: demoPools, portfolioHistory: demoHistory, networkActivity: [], notifications: demoNotifications }
}

function dedupeWallets(wallets) {
  return wallets.reduce((unique, wallet) => {
    const walletNamespace = wallet.namespace || wallet.network
    const index = unique.findIndex((item) => {
      const itemNamespace = item.namespace || item.network
      return item.providerId === wallet.providerId && item.address?.toLowerCase() === wallet.address?.toLowerCase() && itemNamespace === walletNamespace
    })
    if (index === -1) return [...unique, wallet]
    const existing = unique[index]
    const merged = { ...existing, networks: [...new Set([...existing.networks, ...wallet.networks])], firstConnected: existing.firstConnected || wallet.firstConnected }
    return unique.map((item, itemIndex) => itemIndex === index ? merged : item)
  }, [])
}

function readLocalWallets() {
  try {
    const normalized = JSON.parse(window.localStorage.getItem(LOCAL_WALLETS_KEY) || '[]').flatMap((wallet) => {
      const namespace = wallet.namespace || (wallet.network === 'solana' ? 'solana' : wallet.network === 'cosmos' ? 'cosmos' : wallet.network === 'sui' ? 'sui' : wallet.network === 'tron' ? 'tron' : 'eip155')
      const knownProvider = getWalletProvider(wallet.providerId) || getWalletProvider(wallet.provider)
      const provider = knownProvider || {
        id: wallet.providerId || 'wallet',
        name: wallet.provider || 'Connected wallet',
        networks: wallet.networks?.length ? wallet.networks : [wallet.network].filter(Boolean),
        ecosystems: [namespace],
      }
      const networks = networksForConnection(provider, namespace)
      const network = networks.includes(wallet.network) ? wallet.network : networks[0]
      if (!network) return []
      return [{ ...wallet, namespace, providerId: provider.id, provider: provider.name, network, networks, ecosystem: NETWORKS[network]?.name || provider.ecosystems.join(' · ') }]
    })
    return dedupeWallets(normalized)
  } catch { return [] }
}

const walletProviderIds = {
  walletconnect: 'walletconnect', 'walletconnect wallet': 'walletconnect',
  metamask: 'metamask', 'binance wallet': 'binance', 'okx wallet': 'okx', 'trust wallet': 'trust',
  'coinbase wallet': 'coinbase', phantom: 'phantom', solflare: 'solflare',
  backpack: 'backpack', slush: 'slush', talisman: 'talisman', keplr: 'keplr', leap: 'leap',
  cosmostation: 'cosmostation', tronlink: 'tronlink', core: 'core', ledger: 'ledger', subwallet: 'subwallet',
}

function createLocalWallet(address, chainId, walletInfo, namespace = 'eip155') {
  const network = namespace === 'solana' ? 'solana' : namespace === 'cosmos' ? 'cosmos' : EVM_NETWORKS[Number(chainId)] || 'ethereum'
  const provider = walletInfo?.name || 'Connected wallet'
  const providerId = walletProviderIds[provider.toLowerCase()] || provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wallet'
  const walletProvider = getWalletProvider(providerId) || { networks: [network] }
  const providerNetworks = networksForConnection(walletProvider, namespace)
  return { id: `reown-${namespace}-${chainId}-${address.toLowerCase()}`, address, chainId, namespace, network, networks: providerNetworks?.length ? providerNetworks : [network], provider, providerId, ecosystem: NETWORKS[network]?.name || 'Supported network', firstConnected: new Date().toISOString(), verified: false, local: true }
}

export function StakeionProvider({ children }) {
  const demoData = useMemo(() => createDemoData(), [])
  const [wallets, setWallets] = useState([])
  const [localWallets, setLocalWallets] = useState(() => apiConfigured ? [] : readLocalWallets())
  const [balances, setBalances] = useState([])
  const [ledger, setLedger] = useState([])
  const [markets, setMarkets] = useState(() => apiConfigured ? [] : demoData.markets)
  const [pools, setPools] = useState(() => apiConfigured ? [] : demoData.pools)
  const [portfolioHistory, setPortfolioHistory] = useState(() => apiConfigured ? [] : demoData.portfolioHistory)
  const [networkActivity, setNetworkActivity] = useState(() => apiConfigured ? [] : demoData.networkActivity)
  const [networkActivityLoading, setNetworkActivityLoading] = useState(isNetworkActivityConfigured)
  const [networkActivityError, setNetworkActivityError] = useState(null)
  const [notifications, setNotifications] = useState(() => apiConfigured ? [] : demoData.notifications)
  const [status, setStatus] = useState(apiConfigured ? 'loading' : 'ready')
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const { address, chainId, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { address: solanaAddress, chainId: solanaChainId, isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' })
  const { address: cosmosAddress, chainId: cosmosChainId, isConnected: isCosmosConnected } = useAppKitAccount({ namespace: 'cosmos' })
  const { walletInfo } = useWalletInfo('eip155')
  const { walletInfo: solanaWalletInfo } = useWalletInfo('solana')
  const { walletInfo: cosmosWalletInfo } = useWalletInfo('cosmos')

  const activeWallets = useMemo(() => {
    if (apiConfigured) return wallets
    return localWallets.map((wallet) => {
      const connected = wallet.namespace === 'solana'
        ? isSolanaConnected && wallet.address.toLowerCase() === solanaAddress?.toLowerCase()
        : wallet.namespace === 'cosmos'
          ? isCosmosConnected && wallet.address.toLowerCase() === cosmosAddress?.toLowerCase()
          : isConnected && wallet.address.toLowerCase() === address?.toLowerCase() && Number(wallet.chainId) === Number(chainId)
      return { ...wallet, status: connected ? 'Connected' : 'Linked' }
    })
  }, [address, chainId, cosmosAddress, isConnected, isCosmosConnected, isSolanaConnected, localWallets, solanaAddress, wallets])

  const notify = useCallback((title, tone = 'success') => {
    setToast({ id: Date.now(), title, tone })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const hydrate = useCallback(async () => {
    if (!apiConfigured) {
      setError(null)
      setStatus('ready')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const results = await Promise.allSettled([
        accountApi.wallets(), accountApi.portfolio(), accountApi.ledger(), accountApi.markets(),
        accountApi.stakingPools(), accountApi.portfolioHistory('1M'), accountApi.networkActivity(),
      ])
      const value = (index) => results[index].status === 'fulfilled' ? results[index].value : null
      const [walletResult, portfolioResult, ledgerResult, marketResult, poolResult, historyResult, activityResult] = results.map((_, index) => value(index))
      setWallets(list(walletResult, 'wallets').map((wallet) => ({
        ...wallet,
        providerId: wallet.providerId || wallet.provider_id,
        networks: wallet.networks || [wallet.network].filter(Boolean),
        firstConnected: wallet.firstConnected || wallet.first_connected || wallet.created_at,
      })))
      setBalances(list(portfolioResult, 'balances'))
      setLedger(list(ledgerResult, 'entries'))
      setMarkets(list(marketResult, 'markets'))
      setPools(list(poolResult, 'pools'))
      setPortfolioHistory(list(historyResult, 'history'))
      if (!isNetworkActivityConfigured) setNetworkActivity(list(activityResult, 'activity'))
      setNotifications(list(portfolioResult, 'notifications'))
      const accountReady = results.slice(0, 3).every((result) => result.status === 'fulfilled')
      if (!accountReady) throw results.find((result) => result.status === 'rejected')?.reason || new Error('Your account details are temporarily unavailable. Please try again.')
      setStatus('ready')
    } catch (requestError) {
      setStatus('error')
      setError(requestError.message || 'Fourstakes services are currently unavailable.')
    }
  }, [])

  useEffect(() => {
    const task = window.setTimeout(hydrate, 0)
    return () => window.clearTimeout(task)
  }, [hydrate])

  useEffect(() => {
    if (!isNetworkActivityConfigured) return undefined
    let active = true
    const loadNetworkActivity = () => {
      setNetworkActivityLoading(true)
      fetchNetworkActivity().then((items) => {
        if (!active) return
        setNetworkActivity(items)
        setNetworkActivityError(null)
      }).catch((requestError) => {
        if (active) setNetworkActivityError(requestError.message || 'Network activity could not be loaded.')
      }).finally(() => {
        if (active) setNetworkActivityLoading(false)
      })
    }
    loadNetworkActivity()
    const unsubscribe = subscribeNetworkActivity(loadNetworkActivity)
    return () => { active = false; unsubscribe() }
  }, [])

  useEffect(() => {
    if (apiConfigured || !isConnected || !address) return undefined
    const task = window.setTimeout(() => {
      setLocalWallets((current) => {
        const sanitized = dedupeWallets(current.filter((wallet) => !wallet.id?.startsWith('demo-wallet-') && !wallet.id?.startsWith('validator-ops-')))
        const id = `reown-eip155-${chainId}-${address.toLowerCase()}`
        const connectedWallet = createLocalWallet(address, chainId, walletInfo)
        if (!connectedWallet) return sanitized
        const currentWallet = sanitized.find((wallet) => wallet.id === id || (wallet.namespace === 'eip155' && wallet.providerId === connectedWallet.providerId && wallet.address.toLowerCase() === address.toLowerCase()))
        if (!currentWallet) return [...sanitized, connectedWallet]
        if (currentWallet.provider === connectedWallet.provider && currentWallet.providerId === connectedWallet.providerId && currentWallet.ecosystem === connectedWallet.ecosystem && currentWallet.networks.join('|') === connectedWallet.networks.join('|')) return sanitized
        return sanitized.map((wallet) => wallet.id === currentWallet.id ? { ...wallet, ...connectedWallet, id: wallet.id, firstConnected: wallet.firstConnected } : wallet)
      })
    }, 0)
    return () => window.clearTimeout(task)
  }, [address, chainId, isConnected, walletInfo])

  useEffect(() => {
    if (apiConfigured || !isSolanaConnected || !solanaAddress) return undefined
    const task = window.setTimeout(() => {
      setLocalWallets((current) => {
        const sanitized = dedupeWallets(current.filter((wallet) => !wallet.id?.startsWith('demo-wallet-') && !wallet.id?.startsWith('validator-ops-')))
        const id = `reown-solana-${solanaChainId}-${solanaAddress.toLowerCase()}`
        const connectedWallet = createLocalWallet(solanaAddress, solanaChainId, solanaWalletInfo, 'solana')
        if (!connectedWallet) return sanitized
        const currentWallet = sanitized.find((wallet) => wallet.id === id || (wallet.namespace === 'solana' && wallet.providerId === connectedWallet.providerId && wallet.address.toLowerCase() === solanaAddress.toLowerCase()))
        if (!currentWallet) return [...sanitized, connectedWallet]
        if (currentWallet.provider === connectedWallet.provider && currentWallet.providerId === connectedWallet.providerId && currentWallet.ecosystem === connectedWallet.ecosystem && currentWallet.networks.join('|') === connectedWallet.networks.join('|')) return sanitized
        return sanitized.map((wallet) => wallet.id === currentWallet.id ? { ...wallet, ...connectedWallet, id: wallet.id, firstConnected: wallet.firstConnected } : wallet)
      })
    }, 0)
    return () => window.clearTimeout(task)
  }, [isSolanaConnected, solanaAddress, solanaChainId, solanaWalletInfo])

  useEffect(() => {
    if (apiConfigured || !isCosmosConnected || !cosmosAddress) return undefined
    const task = window.setTimeout(() => {
      setLocalWallets((current) => {
        const sanitized = dedupeWallets(current.filter((wallet) => !wallet.id?.startsWith('demo-wallet-') && !wallet.id?.startsWith('validator-ops-')))
        const id = `reown-cosmos-${cosmosChainId}-${cosmosAddress.toLowerCase()}`
        const connectedWallet = createLocalWallet(cosmosAddress, cosmosChainId, cosmosWalletInfo, 'cosmos')
        if (!connectedWallet) return sanitized
        const currentWallet = sanitized.find((wallet) => wallet.id === id || (wallet.namespace === 'cosmos' && wallet.providerId === connectedWallet.providerId && wallet.address.toLowerCase() === cosmosAddress.toLowerCase()))
        if (!currentWallet) return [...sanitized, connectedWallet]
        if (currentWallet.provider === connectedWallet.provider && currentWallet.providerId === connectedWallet.providerId && currentWallet.ecosystem === connectedWallet.ecosystem && currentWallet.networks.join('|') === connectedWallet.networks.join('|')) return sanitized
        return sanitized.map((wallet) => wallet.id === currentWallet.id ? { ...wallet, ...connectedWallet, id: wallet.id, firstConnected: wallet.firstConnected } : wallet)
      })
    }, 0)
    return () => window.clearTimeout(task)
  }, [cosmosAddress, cosmosChainId, cosmosWalletInfo, isCosmosConnected])

  useEffect(() => {
    if (!apiConfigured) window.localStorage.setItem(LOCAL_WALLETS_KEY, JSON.stringify(localWallets))
  }, [localWallets])

  useEffect(() => {
    const streamUrl = import.meta.env.VITE_ACCOUNT_STREAM_URL
    if (!streamUrl || status !== 'ready') return undefined
    const stream = new EventSource(streamUrl, { withCredentials: true })
    stream.addEventListener('portfolio.updated', hydrate)
    stream.addEventListener('transaction.updated', hydrate)
    stream.onerror = () => setError('Live account updates are temporarily disconnected.')
    return () => stream.close()
  }, [hydrate, status])

  useEffect(() => {
    const streamUrl = import.meta.env.VITE_MARKET_STREAM_URL
    if (!streamUrl) return undefined
    const stream = new EventSource(streamUrl)
    const updateMarkets = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const updates = Array.isArray(payload) ? payload : [payload]
        setMarkets((current) => updates.reduce((items, update) => {
          const index = items.findIndex((item) => item.symbol === update.symbol)
          if (index === -1) return [...items, update]
          return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item)
        }, current))
      } catch {
        // Malformed public market frames never replace the last verified values.
      }
    }
    stream.addEventListener('market.updated', updateMarkets)
    stream.onmessage = updateMarkets
    return () => stream.close()
  }, [])

  useEffect(() => {
    let active = true
    fetchBinanceMarkets().then((items) => {
      if (active) setMarkets(items)
    }).catch(() => {
      // Public market data is optional; no placeholder values are created.
    })
    return subscribeBinanceMarkets((update) => {
      setMarkets((current) => {
        const index = current.findIndex((item) => item.symbol === update.symbol)
        return index === -1 ? [...current, update] : current.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item)
      })
    })
  }, [])

  const runOperation = useCallback(async (request, successMessage) => {
    try {
      const result = await request()
      notify(successMessage)
      await hydrate()
      return result
    } catch (operationError) {
      notify(operationError.message || 'The request could not be completed.', 'error')
      return null
    }
  }, [hydrate, notify])

  const disconnectWallet = useCallback(async (id) => {
    if (apiConfigured) return runOperation(() => accountApi.disconnectWallet(id), 'Wallet disconnected.')
    const wallet = localWallets.find((item) => item.id === id)
    const remainingWallets = localWallets.filter((item) => item.id !== id)
    window.sessionStorage.removeItem('fourstakes-show-landing')
    window.localStorage.setItem(LOCAL_WALLETS_KEY, JSON.stringify(remainingWallets))
    setLocalWallets(remainingWallets)
    const isCurrentConnection = wallet?.namespace === 'solana'
      ? isSolanaConnected && wallet.address.toLowerCase() === solanaAddress?.toLowerCase()
      : wallet?.namespace === 'cosmos'
        ? isCosmosConnected && wallet.address.toLowerCase() === cosmosAddress?.toLowerCase()
        : ['sui', 'tron'].includes(wallet?.namespace)
          ? false
        : isConnected && wallet?.address.toLowerCase() === address?.toLowerCase() && Number(wallet.chainId) === Number(chainId)
    if (wallet && isCurrentConnection) {
      const namespace = wallet.namespace || (wallet.network === 'solana' ? 'solana' : wallet.network === 'cosmos' ? 'cosmos' : 'eip155')
      await disconnectReownWallet(namespace)
    }
    notify('Wallet disconnected.')
    return true
  }, [address, chainId, cosmosAddress, isConnected, isCosmosConnected, isSolanaConnected, localWallets, notify, runOperation, solanaAddress])
  const linkLocalWallet = useCallback((wallet) => {
    if (apiConfigured) return false
    setLocalWallets((current) => dedupeWallets([...current, wallet]))
    notify(`${wallet.provider} connected to ${wallet.ecosystem}.`)
    return true
  }, [notify])
  const deposit = useCallback((payload) => runOperation(() => accountApi.createDeposit(payload), 'Deposit intent created. Waiting for network confirmation.'), [runOperation])
  const stake = useCallback((payload) => runOperation(() => accountApi.createStake(payload), 'Stake request submitted.'), [runOperation])
  const unstake = useCallback((payload) => runOperation(() => accountApi.createUnstake(payload), 'Unstake request submitted.'), [runOperation])
  const withdraw = useCallback((payload) => runOperation(() => accountApi.createWithdrawal(payload), 'Withdrawal submitted for validation.'), [runOperation])

  const assets = useMemo(() => ASSETS.map((asset) => {
    const market = markets.find((item) => item.symbol === asset.symbol)
    const pool = pools.find((item) => item.symbol === asset.symbol)
    return { ...asset, price: Number(market?.priceUsd || market?.price_usd || 0), change: Number(market?.change24h || market?.change_24h || 0), apy: Number(pool?.apy || pool?.currentApy || pool?.current_apy || 0), marketTimestamp: market?.timestamp || null }
  }), [markets, pools])

  const portfolio = useMemo(() => balances.map((balance) => {
    const configuredAsset = getAsset(balance.symbol)
    const marketAsset = assets.find((item) => item.symbol === balance.symbol) || configuredAsset
    const wallet = activeWallets.find((item) => item.id === balance.walletId || item.id === balance.wallet_id)
    const available = Number(balance.available || 0)
    const staked = Number(balance.staked || 0)
    const rewards = Number(balance.rewards || 0)
    const lockedRewards = Number(balance.promoRewardsLocked || balance.promo_rewards_locked || 0)
    const totalUnits = available + staked + rewards + lockedRewards
    return { ...balance, walletId: balance.walletId || balance.wallet_id, deposited: Number(balance.deposited || 0), asset: marketAsset, wallet, available, staked, rewards, lockedRewards, totalUnits, value: totalUnits * marketAsset.price, principalValue: (available + staked) * marketAsset.price }
  }), [activeWallets, assets, balances])

  const summary = useMemo(() => {
    const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0)
    const deposited = portfolio.reduce((sum, item) => sum + item.principalValue, 0)
    const rewards = portfolio.reduce((sum, item) => sum + (item.rewards + item.lockedRewards) * item.asset.price, 0)
    const lockedRewards = portfolio.reduce((sum, item) => sum + item.lockedRewards * item.asset.price, 0)
    const activePositions = portfolio.filter((item) => item.staked > 0).length
    const weightedApy = deposited ? portfolio.reduce((sum, item) => sum + item.principalValue * Number(item.apy || item.asset.apy || 0), 0) / deposited : 0
    return { totalValue, deposited, rewards, lockedRewards, activePositions, weightedApy }
  }, [portfolio])

  const markNotificationsRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })))

  return <StakeionContext.Provider value={{
    assets, wallets: activeWallets, balances, portfolio, ledger, markets, pools, portfolioHistory, networkActivity, networkActivityLoading, networkActivityError, isBackendConfigured: apiConfigured,
    summary, notifications, toast, status, error, refresh: hydrate,
    disconnectWallet, linkLocalWallet, deposit, stake, unstake, withdraw, markNotificationsRead,
  }}>{children}</StakeionContext.Provider>
}

export function useStakeion() {
  const context = useContext(StakeionContext)
  if (!context) throw new Error('useStakeion must be used within StakeionProvider')
  return context
}
