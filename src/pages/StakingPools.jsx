import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpDown, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { useStakeion } from '../context/StakeionContext'
import { AssetCell, compactMoney, EmptyState, PageHeader, PanelHeader, ServiceState, StatusBadge } from '../components/Common'

const filters = ['All', 'EVM', 'Solana', 'Sui', 'Cosmos', 'TRON']

export default function StakingPools({ detailBase = '/staking-pools' }) {
  const { portfolio, pools: livePools, assets, status, error, refresh } = useStakeion()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('price')
  const navigate = useNavigate()
  const configuredPools = useMemo(() => (livePools.length ? livePools.map((pool) => ({ ...assets.find((asset) => asset.symbol === pool.symbol), ...pool, isActive: pool.status === 'Active' || pool.status === 'Available', apy: Number(pool.apy || 0), tvl: Number(pool.tvl || pool.tvlUsd || pool.tvl_usd || 0) })) : assets.filter((asset) => asset.marketTimestamp || asset.price > 0).map((asset) => ({ ...asset, id: `market-${asset.symbol.toLowerCase()}`, status: 'Live', lockPeriod: '—', apy: null, tvl: null, isActive: false }))), [assets, livePools])
  const pools = useMemo(() => configuredPools.filter((pool) => (filter === 'All' || pool.ecosystem === filter) && `${pool.symbol} ${pool.name}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'change' ? b.change - a.change : sort === 'asset' ? a.symbol.localeCompare(b.symbol) : b.price - a.price), [configuredPools, filter, search, sort])
  const cycleSort = () => setSort((current) => current === 'price' ? 'change' : current === 'change' ? 'asset' : 'price')
  if (status !== 'ready') return <><PageHeader eyebrow="Earn rewards" title="Staking opportunities" description="Loading available assets and current rates."/><ServiceState status={status} error={error} onRetry={refresh}/></>
  return <>
    <PageHeader eyebrow="Earn rewards" title="Staking opportunities" description="Explore current prices and staking opportunities across supported assets." action={<button className="button secondary" onClick={refresh}><RefreshCw size={15}/>Refresh</button>} />
    <section className="pool-stats"><div><span>{livePools.length ? 'Assets in staking' : 'Assets listed'}</span><strong>{livePools.length ? compactMoney(configuredPools.reduce((sum, pool) => sum + (pool.tvl || 0), 0)) : configuredPools.length}</strong></div><div><span>Networks covered</span><strong>{new Set(configuredPools.map((pool) => pool.network)).size}</strong></div><div><span>{livePools.length ? 'Highest current APY' : 'Wallet support'}</span><strong>{livePools.length ? `${Math.max(...configuredPools.map((pool) => pool.apy || 0)).toFixed(1)}%` : 'Multi-chain'}</strong></div><div><span>Platform fee</span><strong>0%</strong></div></section>
    <section className="panel">
      <PanelHeader title="Explore assets" meta={`${pools.length} assets`} action={<div className="pool-tools"><label className="search-box"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets"/></label><button className="pool-sort" onClick={cycleSort} title="Change sort order"><ArrowUpDown size={15}/>{sort === 'price' ? 'Price' : sort === 'change' ? '24h' : 'Asset'}</button></div>} />
      <div className="filter-tabs"><SlidersHorizontal size={15}/>{filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}{(filter !== 'All' || search) && <button className="clear-filter" onClick={() => { setFilter('All'); setSearch('') }}>Clear</button>}</div>
      {pools.length === 0 ? <EmptyState title="Prices are loading" detail="Please refresh if assets do not appear."/> : <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Current price</th><th>24h</th><th>Staking APY</th><th>Your stake</th><th>Term</th><th>Status</th><th></th></tr></thead><tbody>{pools.map((pool) => { const position = portfolio.find((item) => item.symbol === pool.symbol); return <tr className="pool-row" key={pool.id} onClick={() => navigate(`${detailBase}/${pool.symbol.toLowerCase()}`)}><td><AssetCell symbol={pool.symbol} network={pool.networkName}/></td><td>{pool.price ? compactMoney(pool.price) : '—'}</td><td><strong className={pool.change > 0 ? 'positive' : pool.change < 0 ? 'negative' : ''}>{pool.price ? `${pool.change > 0 ? '+' : ''}${pool.change.toFixed(2)}%` : '—'}</strong></td><td><strong className="apy-value">{pool.apy === null ? '—' : `${pool.apy}%`}</strong></td><td>{position ? `${position.staked} ${pool.symbol}` : '—'}</td><td>{pool.lockPeriod || pool.lock_period || '—'}</td><td><StatusBadge status={pool.status}/></td><td><div className="pool-actions">{pool.isActive ? <Link className="button table-button" to={`/stake?asset=${pool.symbol}`} onClick={(event) => event.stopPropagation()}>Stake</Link> : <button className="button table-button" disabled title="Staking is not open for this asset">Stake</button>}</div></td></tr>})}</tbody></table></div>}
    </section>
  </>
}
