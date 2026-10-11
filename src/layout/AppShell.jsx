import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, ChartNoAxesCombined, CircleDollarSign, Coins, LayoutDashboard, Menu, Network, PanelLeftClose, Settings, ShieldCheck, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { useStakeion } from '../context/StakeionContext'
import { BrandMark } from '../components/Icons'
import { money } from '../components/Common'

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: ChartNoAxesCombined },
  { to: '/wallets', label: 'Wallets', icon: WalletCards },
  { to: '/staking-pools', label: 'Staking pools', icon: Coins },
  { to: '/stake', label: 'Stake', icon: Coins },
  { to: '/unstake', label: 'Unstake', icon: PanelLeftClose },
  { to: '/deposit', label: 'Deposit', icon: CircleDollarSign },
  { to: '/withdraw', label: 'Withdraw', icon: PanelLeftClose },
  { to: '/ledger', label: 'Activity', icon: ShieldCheck },
  { to: '/network-activity', label: 'Network activity', icon: Network },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { summary, notifications, markNotificationsRead, toast, status } = useStakeion()
  const location = useLocation()
  const navigate = useNavigate()
  const current = nav.find((item) => location.pathname.startsWith(item.to))?.label || 'Fourstakes'
  const returnToLanding = () => {
    window.sessionStorage.setItem('fourstakes-show-landing', 'true')
    navigate('/')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><button className="brand brand-button" onClick={returnToLanding}><BrandMark /><b>Fourstakes</b></button><button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <div className="environment-chip"><i />Live network</div>
      <nav className="side-nav" aria-label="Application navigation">
        <span className="nav-section-label">Workspace</span>
        {nav.slice(0, 6).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}><Icon size={18} />{label}</NavLink>)}
        <span className="nav-section-label">Activity</span>
        {nav.slice(6).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}><Icon size={18} />{label}</NavLink>)}
      </nav>
      <button className="sidebar-landing" onClick={returnToLanding}><ArrowLeft size={16}/>Back to home</button>
      <div className="sidebar-account"><div className="account-avatar">FS</div><div><strong>Fourstakes Account</strong><span>Your account is active</span></div><Settings size={17} /></div>
    </aside>
    {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="app-main">
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
        <div className="topbar-title"><span>Workspace</span><strong>{current}</strong></div>
        <div className="topbar-actions">
          <div className="network-health"><i />{status === 'ready' ? 'Account ready' : status === 'loading' ? 'Preparing account' : 'Account unavailable'}</div>
          <div className="top-balance"><span>Portfolio value</span><strong>{money(summary.totalValue)}</strong></div>
          <div className="notification-wrap">
            <button className="icon-button" onClick={() => { setNotificationsOpen((value) => !value); markNotificationsRead() }} aria-label="Notifications"><Bell size={19} />{notifications.some((n) => !n.read) && <i className="notification-dot" />}</button>
            {notificationsOpen && <div className="notification-popover"><div className="popover-title"><strong>Notifications</strong><span>{notifications.length} updates</span></div>{notifications.map((item) => <div className="notification-item" key={item.id}><i /><div><strong>{item.title}</strong><span>{item.detail}</span></div></div>)}</div>}
          </div>
          <NavLink to="/wallets" className="top-wallet"><WalletCards size={17} />Wallets</NavLink>
        </div>
      </header>
      <main className="app-content"><Outlet /></main>
    </div>
    {toast && <div className={`toast toast-${toast.tone}`}><i />{toast.title}</div>}
    <nav className="mobile-nav">{nav.slice(0, 4).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to}><Icon size={19} /><span>{label.split(' ')[0]}</span></NavLink>)}</nav>
  </div>
}
