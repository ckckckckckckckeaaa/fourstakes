import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import './index.css'
import App from './App.jsx'
import { getWagmiConfig, initializeReown } from './web3/reown/appkit'

initializeReown()
const wagmiConfig = getWagmiConfig()
const queryClient = new QueryClient()
const app = wagmiConfig
  ? <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
    </WagmiProvider>
  : <App />

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
