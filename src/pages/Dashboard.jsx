import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpRight, CircleDollarSign, Coins, Layers3, Plus, ShieldCheck } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { AssetCell, MetricCard, money, PageHeader, PanelHeader, ServiceState, StatusBadge, WalletCell } from '../components/Common'
import TradingViewChart from '../components/TradingViewChart'
import { BINANCE_SYMBOLS } from '../services/marketData/binance'

export default function Dashboard() {
  const { summary, portfolio, ledger, portfolioHistory, assets, status, error, refresh } = useStakeion()
  const [marketSymbol, setMarketSymbol] = useState('ETH')
  const chartData = useMemo(() => portfolioHistory.map((point) => ({ label: point.timestamp || point.date, value: Number(point.valueUsd ?? point.value_usd ?? point.value) })), [portfolioHistory])

  if (status !== 'ready') return <><PageHeader eyebrow="Portfolio overview" title="Account overview" description="Your balances, positions, and rewards in one place."/><ServiceState status={status} error={error} onRetry={refresh}/></>

  return <>
    <PageHeader eyebrow="Portfolio overview" title="Account overview" description="Your assets, one portfolio. Track deposits, positions, and rewards across every linked wallet." action={<div className="header-actions"><Link className="button secondary" to="/wallets"><Plus size={16} />Add wallet</Link><Link className="button primary" to="/deposit"><ArrowDownToLine size={16} />Deposit</Link></div>} />
    <section className="metrics-grid">
      <MetricCard label="Total portfolio value" value={money(summary.totalValue)} detail={chartData.length ? 'Based on your account activity' : 'No activity yet'} icon={CircleDollarSign} />
      <MetricCard label="Total deposited" value={money(summary.deposited)} detail="Confirmed principal" icon={Layers3} />
      <MetricCard label="Total rewards" value={money(summary.rewards)} detail="Across active positions" trend={1} icon={Coins} />
      <MetricCard label="Average APY" value={`${summary.weightedApy.toFixed(1)}%`} detail={`${summary.activePositions} active positions`} icon={ShieldCheck} />
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-panel">
        <PanelHeader title="Live market chart" meta="TradingView · Binance market data" action={<select className="standalone-select" value={marketSymbol} onChange={(event) => setMarketSymbol(event.target.value)}>{assets.filter((asset) => BINANCE_SYMBOLS[asset.symbol]).map((asset) => <option key={asset.symbol} value={asset.symbol}>{asset.symbol}/USDT</option>)}</select>} />
        <div className="chart-summary"><strong>{assets.find((asset) => asset.symbol === marketSymbol)?.price ? money(assets.find((asset) => asset.symbol === marketSymbol).price) : '—'}</strong><span>Live spot price</span></div>
        <TradingViewChart asset={marketSymbol}/>
      </article>
      <article className="panel allocation-panel">
        <PanelHeader title="Portfolio allocation" meta="By deposited asset" />
        <div className="allocation-ring" style={{ '--sol': `${summary.totalValue ? (portfolio[0]?.value || 0) / summary.totalValue * 360 : 0}deg` }}><div><strong>{portfolio.length}</strong><span>Assets</span></div></div>
        <div className="allocation-list">{portfolio.map((item) => <div key={item.id}><AssetCell symbol={item.symbol} network={item.asset.networkName} compact /><span>{summary.totalValue ? ((item.value / summary.totalValue) * 100).toFixed(1) : '0.0'}%</span><strong>{money(item.value)}</strong></div>)}</div>
      </article>
    </section>
    <section className="panel positions-panel">
      <PanelHeader title="Active positions" meta="Staked balances remain attributed to their source wallet" action={<Link to="/portfolio" className="text-link">View portfolio <ArrowUpRight size={14} /></Link>} />
      <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Source wallet</th><th>Principal</th><th>Rewards</th><th>Current APY</th><th>Status</th></tr></thead><tbody>{portfolio.filter((item) => item.staked > 0).map((item) => <tr key={item.id}><td><AssetCell symbol={item.symbol} network={item.asset.networkName} /></td><td><WalletCell wallet={item.wallet} /></td><td><strong>{item.staked} {item.symbol}</strong><small>{money(item.staked * item.asset.price)}</small></td><td className="positive">+{item.rewards} {item.symbol}</td><td><strong>{item.asset.apy}%</strong><small>Current APY</small></td><td><StatusBadge status="Active" /></td></tr>)}</tbody></table></div>
    </section>
    <section className="panel recent-panel">
      <PanelHeader title="Recent activity" meta="Your latest account movements" action={<Link to="/ledger" className="text-link">View all activity <ArrowUpRight size={14} /></Link>} />
      <div className="activity-list">{ledger.slice(0, 4).map((entry) => <div className="activity-row" key={entry.id}><span className={`activity-icon ${entry.amount >= 0 ? 'in' : 'out'}`}>{entry.amount >= 0 ? <ArrowDownToLine size={17} /> : <ArrowUpRight size={17} />}</span><div><strong>{entry.type} · {entry.symbol}</strong><span>{new Date(entry.date).toLocaleString()}</span></div><div><strong className={entry.amount >= 0 ? 'positive' : ''}>{entry.amount > 0 ? '+' : ''}{entry.amount} {entry.symbol}</strong><StatusBadge status={entry.status} /></div></div>)}</div>
    </section>
  </>
}
