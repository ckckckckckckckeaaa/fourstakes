/* eslint-disable react-refresh/only-export-components */
import { ArrowDownRight, ArrowUpRight, ChevronRight, Info } from 'lucide-react'
import { AssetIcon, WalletIcon } from './Icons'
import { walletDisplayName } from '../config/catalog'

export const money = (value, digits = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0)
export const compactMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
export const shortAddress = (address = '') => address.includes('...') ? address : `${address.slice(0, 6)}...${address.slice(-4)}`

export function PageHeader({ eyebrow, title, description, action }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>
}

export function MetricCard({ label, value, detail, trend, icon: Icon }) {
  return <article className="metric-card">
    <div className="metric-label"><span>{label}</span>{Icon && <Icon size={16} />}</div>
    <strong>{value}</strong>
    <div className={`metric-detail ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : ''}`}>
      {trend > 0 && <ArrowUpRight size={14} />}{trend < 0 && <ArrowDownRight size={14} />}{detail}
    </div>
  </article>
}

export function StatusBadge({ status }) {
  const tone = ['Completed', 'Active', 'Connected', 'Verified', 'Confirmed', 'Live'].includes(status) ? 'success' : ['Failed', 'Cancelled', 'Disconnected'].includes(status) ? 'danger' : 'pending'
  return <span className={`status status-${tone}`}><i />{status}</span>
}

export function AssetCell({ symbol, network, compact = false }) {
  return <div className="identity-cell"><AssetIcon symbol={symbol} size={compact ? 28 : 34} /><div><strong>{symbol}</strong>{network && <span>{network}</span>}</div></div>
}

export function WalletCell({ wallet }) {
  if (!wallet) return <span className="muted">System</span>
  return <div className="identity-cell"><WalletIcon providerId={wallet.providerId} size={32} /><div><strong>{walletDisplayName(wallet)}</strong><span>{shortAddress(wallet.address)}</span></div></div>
}

export function EmptyState({ icon: Icon = Info, title, detail, action }) {
  return <div className="empty-state"><Icon size={22} /><h3>{title}</h3><p>{detail}</p>{action}</div>
}

export function PanelHeader({ title, meta, action }) {
  return <div className="panel-header"><div><h2>{title}</h2>{meta && <p>{meta}</p>}</div>{action}</div>
}

export function LinkButton({ children }) {
  return <span className="link-button">{children}<ChevronRight size={15} /></span>
}

export function ServiceState({ status, error, onRetry }) {
  if (status === 'ready') return null
  return <div className={`service-state ${status === 'error' ? 'service-error' : ''}`} role="status">
    <span className="service-state-icon">{status === 'loading' ? <i /> : <Info size={20} />}</span>
    <div><strong>{status === 'loading' ? 'Preparing your account' : 'We could not load your account'}</strong><p>{status === 'loading' ? 'Restoring your wallets, balances, market prices, and activity.' : error || 'Please try again in a moment.'}</p></div>
    {status === 'error' && onRetry && <button className="button secondary" onClick={onRetry}>Retry</button>}
  </div>
}
