import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight, PieChart } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { AssetCell, EmptyState, money, PageHeader, PanelHeader, ServiceState, WalletCell } from '../components/Common'

export default function Portfolio() {
  const { portfolio, summary, status, error, refresh } = useStakeion()
  if (status !== 'ready') return <><PageHeader eyebrow="Account holdings" title="Portfolio" description="Loading your Fourstakes balances."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  return <>
    <PageHeader eyebrow="Account holdings" title="Portfolio" description="A consolidated view of confirmed Fourstakes balances. External wallet balances are never included." action={<Link to="/deposit" className="button primary"><ArrowDownToLine size={16}/>Deposit assets</Link>} />
    <section className="portfolio-hero panel">
      <div><span>Total portfolio value</span><strong>{money(summary.totalValue)}</strong><p>Across {portfolio.length} assets and {new Set(portfolio.map((item) => item.walletId)).size} linked wallets</p></div>
      <div className="portfolio-hero-stats"><div><span>Available</span><strong>{money(portfolio.reduce((sum, item) => sum + item.available * item.asset.price, 0))}</strong></div><div><span>Staked</span><strong>{money(portfolio.reduce((sum, item) => sum + item.staked * item.asset.price, 0))}</strong></div><div><span>Rewards</span><strong className="positive">+{money(summary.rewards)}</strong></div></div>
    </section>
    <section className="panel">
      <PanelHeader title="Asset balances" meta="Principal and rewards grouped by source wallet" action={<div className="segmented"><button className="active">All assets</button><button>EVM</button><button>Non-EVM</button></div>} />
      {portfolio.length === 0 ? <EmptyState title="No balance yet" detail="Connect a wallet and make a deposit to start building your portfolio."/> : <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Wallet</th><th>Deposited</th><th>Staked</th><th>Available</th><th>Rewards</th><th>Promo locked</th><th>APY</th><th>Value</th></tr></thead><tbody>{portfolio.map((item) => <tr key={item.id}><td><AssetCell symbol={item.symbol} network={item.asset.networkName}/></td><td><WalletCell wallet={item.wallet}/></td><td>{item.deposited} {item.symbol}</td><td>{item.staked} {item.symbol}</td><td>{item.available} {item.symbol}</td><td className="positive">+{item.rewards} {item.symbol}</td><td>{item.lockedRewards} {item.symbol}<small>{item.promoUnlockAt || item.promo_unlock_at ? `Available ${new Date(item.promoUnlockAt || item.promo_unlock_at).toLocaleDateString()}` : 'Available after a 3-month stake'}</small></td><td>{item.apy || item.asset.apy || 0}% <small>Current</small></td><td><strong>{money(item.value)}</strong><small>{item.totalUnits.toFixed(4)} {item.symbol}</small></td></tr>)}</tbody></table></div>}
    </section>
    <div className="info-strip"><PieChart size={18}/><div><strong>How your portfolio value is calculated</strong><p>Completed deposits and earned rewards, less completed withdrawals. Transfers still in progress are not included.</p></div><Link to="/ledger">View activity <ArrowUpRight size={14}/></Link></div>
  </>
}
