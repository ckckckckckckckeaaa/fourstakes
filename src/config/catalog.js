export const ASSETS = [
  { symbol: 'ETH', name: 'Ethereum', network: 'ethereum', networkName: 'Ethereum', ecosystem: 'EVM', color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', network: 'solana', networkName: 'Solana', ecosystem: 'Solana', color: '#14f195' },
  { symbol: 'BNB', name: 'BNB', network: 'bnb', networkName: 'BNB Smart Chain', ecosystem: 'EVM', color: '#f3ba2f' },
  { symbol: 'SUI', name: 'Sui', network: 'sui', networkName: 'Sui', ecosystem: 'Sui', color: '#6fbcf0' },
  { symbol: 'ATOM', name: 'Cosmos Hub', network: 'cosmos', networkName: 'Cosmos Hub', ecosystem: 'Cosmos', color: '#6f7390' },
  { symbol: 'TRX', name: 'TRON', network: 'tron', networkName: 'TRON', ecosystem: 'TRON', color: '#ef0027' },
  { symbol: 'AVAX', name: 'Avalanche', network: 'avalanche', networkName: 'Avalanche C-Chain', ecosystem: 'EVM', color: '#e84142' },
  { symbol: 'POL', name: 'Polygon', network: 'polygon', networkName: 'Polygon PoS', ecosystem: 'EVM', color: '#8247e5' },
]

export const NETWORKS = {
  ethereum: { name: 'Ethereum', explorer: 'https://etherscan.io', confirmations: 12 },
  solana: { name: 'Solana', explorer: 'https://solscan.io', confirmations: 32 },
  bnb: { name: 'BNB Smart Chain', explorer: 'https://bscscan.com', confirmations: 15 },
  sui: { name: 'Sui', explorer: 'https://suiscan.xyz/mainnet', confirmations: 1 },
  cosmos: { name: 'Cosmos Hub', explorer: 'https://www.mintscan.io/cosmos', confirmations: 2 },
  tron: { name: 'TRON', explorer: 'https://tronscan.org', confirmations: 20 },
  avalanche: { name: 'Avalanche C-Chain', explorer: 'https://snowtrace.io', confirmations: 5 },
  polygon: { name: 'Polygon PoS', explorer: 'https://polygonscan.com', confirmations: 64 },
}

export const WALLET_PROVIDERS = [
  { id: 'walletconnect', name: 'WalletConnect', mark: 'WC', color: '#3b99fc', ecosystems: ['EVM', 'Solana', 'Sui', 'Cosmos', 'TRON'], networks: ['ethereum', 'solana', 'bnb', 'sui', 'cosmos', 'tron', 'avalanche', 'polygon'], supportedAssets: ['ETH', 'SOL', 'BNB', 'SUI', 'ATOM', 'TRX', 'AVAX', 'POL'] },
  { id: 'okx', name: 'OKX Wallet', mark: 'OKX', color: '#f2f4f7', ecosystems: ['EVM', 'Solana', 'Sui', 'Cosmos', 'TRON'], networks: ['ethereum', 'solana', 'bnb', 'sui', 'cosmos', 'tron', 'avalanche', 'polygon'], supportedAssets: ['ETH', 'SOL', 'BNB', 'SUI', 'ATOM', 'TRX', 'AVAX', 'POL'] },
  { id: 'metamask', name: 'MetaMask', mark: 'M', color: '#f6851b', ecosystems: ['EVM', 'Solana', 'TRON'], networks: ['ethereum', 'solana', 'bnb', 'tron', 'avalanche', 'polygon'], supportedAssets: ['ETH', 'SOL', 'BNB', 'TRX', 'AVAX', 'POL'] },
  { id: 'trust', name: 'Trust Wallet', mark: 'T', color: '#3375bb', ecosystems: ['EVM', 'Solana', 'Sui', 'Cosmos', 'TRON'], networks: ['ethereum', 'solana', 'bnb', 'sui', 'cosmos', 'tron', 'avalanche', 'polygon'], supportedAssets: ['ETH', 'SOL', 'TRX', 'BNB', 'AVAX', 'ATOM', 'SUI', 'POL'] },
  { id: 'coinbase', name: 'Coinbase Wallet', mark: 'CB', color: '#0052ff', ecosystems: ['EVM'], networks: ['ethereum', 'bnb', 'avalanche', 'polygon'], supportedAssets: ['ETH', 'BNB', 'AVAX', 'POL'] },
  { id: 'phantom', name: 'Phantom', mark: 'P', color: '#ab9ff2', ecosystems: ['Ethereum', 'Solana', 'BNB Chain', 'Polygon'], networks: ['ethereum', 'solana', 'bnb', 'polygon'], supportedAssets: ['ETH', 'SOL', 'BNB', 'POL'] },
  { id: 'solflare', name: 'Solflare', mark: 'S', color: '#f9a826', ecosystems: ['Solana'], networks: ['solana'], supportedAssets: ['SOL'] },
  { id: 'backpack', name: 'Backpack', mark: 'BP', color: '#e6e6e6', ecosystems: ['Solana', 'Sui'], networks: ['solana', 'sui'], supportedAssets: ['SOL', 'SUI'] },
  { id: 'slush', name: 'Slush', mark: 'S', color: '#6fbcf0', ecosystems: ['Sui'], networks: ['sui'], supportedAssets: ['SUI'] },
  { id: 'ledger', name: 'Ledger', mark: 'L', color: '#d9d9d9', ecosystems: ['EVM', 'Solana', 'Sui', 'Cosmos', 'TRON'], networks: ['ethereum', 'solana', 'tron', 'bnb', 'avalanche', 'polygon', 'cosmos', 'sui'], supportedAssets: ['ETH', 'SOL', 'TRX', 'BNB', 'AVAX', 'POL', 'ATOM', 'SUI'] },
  { id: 'tronlink', name: 'TronLink', mark: 'TR', color: '#ef0027', ecosystems: ['TRON'], networks: ['tron'], supportedAssets: ['TRX'] },
  { id: 'core', name: 'Core', mark: 'C', color: '#e84142', ecosystems: ['Avalanche'], networks: ['avalanche'], supportedAssets: ['AVAX'] },
  { id: 'keplr', name: 'Keplr', mark: 'K', color: '#4f5ee4', ecosystems: ['Cosmos'], networks: ['cosmos'], supportedAssets: ['ATOM'] },
  { id: 'leap', name: 'Leap', mark: 'L', color: '#48d29b', ecosystems: ['Cosmos'], networks: ['cosmos'], supportedAssets: ['ATOM'] },
  { id: 'cosmostation', name: 'Cosmostation', mark: 'CS', color: '#5268ff', ecosystems: ['Cosmos'], networks: ['cosmos'], supportedAssets: ['ATOM'] },
]

export const getAsset = (symbol) => ASSETS.find((asset) => asset.symbol === symbol)
export const walletNetworkName = (wallet) => NETWORKS[wallet?.network]?.name || wallet?.ecosystem || 'Unknown network'
export const walletDisplayName = (wallet) => `${wallet?.provider || 'Wallet'} (${walletNetworkName(wallet)})`
export const getWalletProvider = (value) => {
  const key = String(value || '').trim().toLowerCase()
  return WALLET_PROVIDERS.find((wallet) => wallet.id === key || wallet.name.toLowerCase() === key)
}
export const compatibleAssets = (wallet) => {
  const provider = getWalletProvider(wallet?.providerId) || getWalletProvider(wallet?.provider)
  const symbols = provider?.supportedAssets
  const connectedNetworks = wallet?.networks || []
  return ASSETS.filter((asset) => connectedNetworks.includes(asset.network) && (!symbols || symbols.includes(asset.symbol)))
}
