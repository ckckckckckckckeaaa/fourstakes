const env = import.meta.env

export const RPC_ENDPOINTS = {
  ethereum: env.VITE_RPC_ETHEREUM || 'https://ethereum-rpc.publicnode.com',
  solana: env.VITE_RPC_SOLANA || 'https://api.mainnet.solana.com',
  bnb: env.VITE_RPC_BNB || 'https://bsc-dataseed.bnbchain.org',
  sui: env.VITE_RPC_SUI || 'https://fullnode.mainnet.sui.io:443',
  cosmos: env.VITE_RPC_COSMOS || 'https://rpc.cosmos.directory/cosmoshub',
  tron: env.VITE_RPC_TRON || 'https://api.trongrid.io/jsonrpc',
  avalanche: env.VITE_RPC_AVALANCHE || 'https://api.avax.network/ext/bc/C/rpc',
  polygon: env.VITE_RPC_POLYGON || 'https://polygon-bor-rpc.publicnode.com',
}

export const EVM_RPC_URLS = {
  'eip155:1': [{ url: RPC_ENDPOINTS.ethereum }],
  'eip155:56': [{ url: RPC_ENDPOINTS.bnb }],
  'eip155:137': [{ url: RPC_ENDPOINTS.polygon }],
  'eip155:43114': [{ url: RPC_ENDPOINTS.avalanche }],
}
