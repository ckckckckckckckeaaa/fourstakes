import { Atom, Avax, Bnb, Eth, Pol, Sol, Sui, Trx } from 'react-web3-icons/coin'
import { BackpackWallet, CoinbaseWallet, Keplr, Ledger, MetaMask, OKXWallet, PhantomWallet, Solflare, TrustWallet } from 'react-web3-icons/wallet'
import { getAsset, getWalletProvider } from '../config/catalog'

function FallbackMark({ text, color, className, size }) {
  const variable = className.includes('asset-icon') ? '--asset-color' : '--wallet-color'
  return <span className={className} style={{ width: size, height: size, [variable]: color }}>{text}</span>
}

export function AssetIcon({ symbol, size = 36, className = '' }) {
  const asset = getAsset(symbol)
  const Icon = { ETH: Eth, SOL: Sol, BNB: Bnb, SUI: Sui, ATOM: Atom, TRX: Trx, AVAX: Avax, POL: Pol }[symbol]
  const fallback = <FallbackMark text={symbol?.slice(0, 3)} color={asset?.color || '#7c8795'} className={`asset-icon asset-icon-fallback ${className}`} size={size}/>
  return Icon ? <span className={`asset-icon ${className}`} style={{ width: size, height: size }}><Icon width={size} height={size}/></span> : fallback
}

export function NetworkIcon({ network, size = 24 }) {
  const symbol = { ethereum: 'ETH', solana: 'SOL', bnb: 'BNB', sui: 'SUI', cosmos: 'ATOM', tron: 'TRX', avalanche: 'AVAX', polygon: 'POL' }[network]
  return <AssetIcon symbol={symbol} size={size} />
}

const walletIcons = {
  metamask: MetaMask, trust: TrustWallet, coinbase: CoinbaseWallet, phantom: PhantomWallet,
  solflare: Solflare, backpack: BackpackWallet, ledger: Ledger, keplr: Keplr, okx: OKXWallet,
}

export function WalletIcon({ providerId, size = 36 }) {
  const provider = getWalletProvider(providerId)
  const Icon = walletIcons[providerId]
  const fallback = <FallbackMark text={provider?.mark || 'W'} color={provider?.color || '#7c8795'} className="wallet-icon" size={size}/>
  return Icon ? <span className="wallet-icon wallet-icon-library" style={{ width: size, height: size }}><Icon width={size} height={size}/></span> : fallback
}

export function BrandMark({ size = 32 }) {
  return <img className="brand-mark" style={{ width: size, height: size }} src="/logoFS.png" alt="" aria-hidden="true" />
}
