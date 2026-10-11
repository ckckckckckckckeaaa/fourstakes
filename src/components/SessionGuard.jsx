import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { accountApi } from '../services/api/client'

export default function SessionGuard() {
  return import.meta.env.VITE_API_URL ? <ProductionSessionGuard /> : <WalletSessionGuard />
}

function WalletSessionGuard() {
  const { isConnected: isEvmConnected, status: evmStatus } = useAppKitAccount({ namespace: 'eip155' })
  const { isConnected: isSolanaConnected, status: solanaStatus } = useAppKitAccount({ namespace: 'solana' })
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    const task = window.setTimeout(() => setIsRestoring(false), 800)
    return () => window.clearTimeout(task)
  }, [])

  if (isEvmConnected || isSolanaConnected) return <Outlet />
  if (isRestoring || evmStatus === 'connecting' || evmStatus === 'reconnecting' || solanaStatus === 'connecting' || solanaStatus === 'reconnecting') {
    return <div className="route-loader" role="status"><i/><span>Restoring wallet connection</span></div>
  }
  return <Navigate to="/?auth=required" replace />
}

function ProductionSessionGuard() {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    accountApi.me().then(() => setStatus('authenticated')).catch(() => setStatus('unauthenticated'))
  }, [])
  if (status === 'loading') return <div className="route-loader" role="status"><i/><span>Restoring secure session</span></div>
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/?auth=required" replace />
}
