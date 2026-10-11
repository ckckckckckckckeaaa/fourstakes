import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { AssetIcon } from '../components/Icons'
import { compactMoney, EmptyState } from '../components/Common'
import TradingViewChart from '../components/TradingViewChart'

export default function AssetDetails() {
  const { symbol = '' } = useParams()
  const location = useLocation()
  const { assets, pools } = useStakeion()
  const isPoolDetail = location.pathname.startsWith('/staking-pools')
  const backTo = isPoolDetail ? '/staking-pools' : '/networks'
  const backLabel = isPoolDetail ? 'Staking pools' : 'Networks'
  const asset = assets.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase())
  if (!asset) return <main className="asset-details-page"><EmptyState title="Asset not found" detail={`Choose an asset from ${backLabel} to view its details.`} action={<Link className="button secondary" to={backTo}>Back to {backLabel}</Link>}/></main>
  const pool = pools.find((item) => item.symbol === asset.symbol)
  const apy = Number(pool?.apy || pool?.currentApy || 0)
  const active = pool?.status === 'Active' || pool?.status === 'Available'
  return <main className="asset-details-page"><Link className="detail-back" to={backTo}><ArrowLeft size={15}/>Back to {backLabel}</Link><section className="asset-detail-hero"><div className="asset-detail-title"><AssetIcon symbol={asset.symbol} size={58}/><div><span className="eyebrow">{asset.networkName}</span><h1>{asset.name}</h1><p>{asset.symbol} market overview and staking information.</p></div></div><div className="asset-detail-price"><span>Live price</span><strong>{asset.price ? compactMoney(asset.price) : '—'}</strong><small className={asset.change >= 0 ? 'positive' : 'negative'}>{asset.price ? `${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}% today` : 'Updating'}</small></div></section><section className="asset-detail-grid"><div className="asset-chart-card"><TradingViewChart asset={asset.symbol}/><p>Live market data from Binance and TradingView.</p></div><aside className="asset-facts"><div><span>Staking APY</span><strong>{apy > 0 ? `${apy}%` : 'Not available yet'}</strong></div><div><span>Staking term</span><strong>{pool?.lockPeriod || pool?.lock_period || '—'}</strong></div><div><span>Total staked</span><strong>{pool?.tvl ? compactMoney(pool.tvl) : '—'}</strong></div><div><span>Network</span><strong>{asset.networkName}</strong></div>{active ? <Link className="button primary full" to={`/stake?asset=${asset.symbol}`}>Stake now<ArrowRight size={16}/></Link> : <><button className="button primary full" disabled>Stake now</button><div className="detail-readiness"><ShieldCheck size={16}/><span>Staking opens when a verified rate and term are available.</span></div></>}</aside></section></main>
}
