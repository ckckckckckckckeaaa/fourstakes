import { useState } from 'react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { ExternalLink, Link2, Plus, ShieldCheck, Unplug, WalletCards } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { compatibleAssets, walletDisplayName } from '../config/catalog'
import { AssetIcon, WalletIcon } from '../components/Icons'
import { EmptyState, PageHeader, ServiceState, shortAddress, StatusBadge } from '../components/Common'
import { accountApi } from '../services/api/client'
import { isReownConfigured } from '../web3/reown/appkit'
import { connectCosmosWallet } from '../web3/cosmos/wallet'
import { connectSuiWallet, connectTronWallet } from '../web3/native/senders'

export default function Wallets() {
  const { wallets, portfolio, disconnectWallet, linkLocalWallet, status, error, refresh, isBackendConfigured } = useStakeion()
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const { address, chainId, isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { address: solanaAddress, isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' })
  const { walletProvider } = useAppKitProvider('eip155')
  const startWalletLink = async () => {
    setVerificationError('')
    if (!isReownConfigured()) {
      setVerificationError('Wallet connection is unavailable until VITE_REOWN_PROJECT_ID is configured.')
      return
    }
    try {
      const { openReownModal } = await import('../web3/reown/appkit')
      await openReownModal()
    } catch (requestError) {
      setVerificationError(requestError.message || 'Wallet connection failed.')
    }
  }
  const connectNativeWallet = async (network) => {
    setVerificationError('')
    try {
      const connection = network === 'sui'
        ? await connectSuiWallet()
        : network === 'cosmos'
          ? await connectCosmosWallet()
          : await connectTronWallet()
      if (!linkLocalWallet(connection.wallet)) throw new Error('Native wallet linking requires local account mode while the Fourstakes backend is not connected.')
    } catch (requestError) {
      setVerificationError(requestError.message || `Could not connect the ${network} wallet.`)
    }
  }
  const verifyConnectedWallet = async () => {
    if (!address || !walletProvider) return
    setVerifying(true)
    setVerificationError('')
    try {
      const challenge = await accountApi.linkWallet({ address, chainId, namespace: 'eip155' })
      const message = challenge.message || challenge.challenge
      if (!message) throw new Error('We could not prepare your wallet confirmation. Please try again.')
      const signature = await walletProvider.request({ method: 'personal_sign', params: [message, address] })
      await accountApi.verifyWallet({ walletId: challenge.walletId || challenge.wallet_id, address, chainId, message, signature })
      await refresh()
    } catch (requestError) {
      setVerificationError(requestError.message || 'Wallet verification failed.')
    } finally {
      setVerifying(false)
    }
  }

  if (status !== 'ready') return <><PageHeader eyebrow="Your wallets" title="Linked wallets" description="Restoring your connected wallets."/><ServiceState status={status} error={error} onRetry={refresh}/></>

  return <>
    <PageHeader eyebrow="Your wallets" title="Linked wallets" description="Connect the wallets you use. Each wallet only shows assets available on its supported networks." action={<button className="button primary" onClick={startWalletLink}><Plus size={16}/>Add wallet</button>} />
    <div className="wallet-summary"><div><WalletCards size={19}/><span>Linked wallets</span><strong>{wallets.length}</strong></div><div><ShieldCheck size={19}/><span>Confirmed wallets</span><strong>{wallets.filter((wallet) => wallet.verified).length}</strong></div><div><Link2 size={19}/><span>Networks available</span><strong>{new Set(wallets.flatMap((wallet) => wallet.networks)).size}</strong></div></div>
    {verificationError && <div className="inline-warning">{verificationError}</div>}
    {!isBackendConfigured && <div className="inline-warning"><WalletCards size={17}/><span>For native signing, connect Sui, Cosmos Hub, or TRON directly from its installed wallet extension.</span><div className="header-actions"><button className="button secondary" onClick={() => connectNativeWallet('sui')}>Connect Sui wallet</button><button className="button secondary" onClick={() => connectNativeWallet('cosmos')}>Connect Cosmos wallet</button><button className="button secondary" onClick={() => connectNativeWallet('tron')}>Connect TRON wallet</button></div></div>}
    {isBackendConfigured && isEvmConnected && <div className="wallet-verification-panel panel"><div><ShieldCheck size={18}/><span><strong>Confirm connected wallet</strong><small>Sign a message to link {shortAddress(address)} to your Fourstakes account.</small></span></div><button className="button primary" disabled={verifying} onClick={verifyConnectedWallet}>{verifying ? 'Confirm in your wallet…' : 'Verify wallet'}</button></div>}
    {isBackendConfigured && isSolanaConnected && <div className="inline-warning">Solana wallet {shortAddress(solanaAddress)} is connected. Backend verification for Solana must be enabled before it can be linked.</div>}
    {wallets.length === 0 ? <EmptyState icon={WalletCards} title="No wallets linked" detail="Connect a wallet to view its supported assets and start using Fourstakes." action={<button className="button primary" onClick={startWalletLink}><Plus size={16}/>Connect wallet</button>}/> : <section className="wallet-grid">{wallets.map((wallet) => {
      const holdings = portfolio.filter((item) => item.walletId === wallet.id)
      const total = holdings.reduce((sum, item) => sum + item.value, 0)
      return <article className={`wallet-card panel ${wallet.status === 'Disconnected' ? 'wallet-disabled' : ''}`} key={wallet.id}>
        <div className="wallet-card-head"><WalletIcon providerId={wallet.providerId} size={44}/><div><h2>{walletDisplayName(wallet)}</h2><span>Chain-specific account</span></div><StatusBadge status={wallet.verified ? 'Verified' : wallet.status}/></div>
        <div className="wallet-address"><code>{shortAddress(wallet.address)}</code><button aria-label="Open wallet in explorer"><ExternalLink size={15}/></button></div>
        <div className="wallet-networks"><span>Compatible assets</span><div>{compatibleAssets(wallet).map((asset) => <AssetIcon key={asset.symbol} symbol={asset.symbol} size={24}/>)}</div></div>
        <div className="wallet-balances"><div><span>Fourstakes balance</span><strong>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div><div><span>Positions</span><strong>{holdings.filter((item) => item.staked > 0).length}</strong></div></div>
        <div className="wallet-meta"><span>Linked {new Date(wallet.firstConnected).toLocaleDateString()}</span><span><i/> {wallet.status}</span></div>
        <button className="button danger-ghost full" onClick={() => disconnectWallet(wallet.id)}><Unplug size={15}/>{wallet.status === 'Connected' ? 'Disconnect wallet' : 'Remove linked wallet'}</button>
      </article>
    })}</section>}
  </>
}
