import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Check, CheckCircle2, CircleDollarSign, Clock3, Eye, Layers3, LockKeyhole, Megaphone, Menu, Network, Send, ShieldCheck, Sparkles, WalletCards, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { AssetIcon, BrandMark } from '../components/Icons'
import { compactMoney } from '../components/Common'
import { useStakeion } from '../context/StakeionContext'
import { closeReownModal, openReownModal } from '../web3/reown/appkit'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' })
  const isConnected = isEvmConnected || isSolanaConnected
  const navigate = useNavigate()
  const beginConnection = () => {
    window.sessionStorage.removeItem('fourstakes-show-landing')
    openReownModal()
  }
  useEffect(() => {
    if (!isConnected) return
    if (window.sessionStorage.getItem('fourstakes-show-landing') === 'true') return
    closeReownModal()
    navigate('/dashboard', { replace: true })
  }, [isConnected, navigate])
  return <div className="public-site"><header className="public-nav"><Link to="/" className="brand"><BrandMark/><b>FourStakes</b></Link><nav className={open ? 'open' : ''}><NavLink to="/networks">Networks</NavLink><NavLink to="/announcements">Announcements</NavLink><NavLink to="/how-it-works">How it works</NavLink><NavLink to="/security">Security</NavLink><NavLink to="/contact">Contact</NavLink></nav><div className="public-actions">{isConnected ? <><span className="wallet-connected"><i/>Wallet connected</span><button className="button primary" onClick={() => navigate('/dashboard')}>Open dashboard<ArrowUpRight size={15}/></button></> : <><button className="nav-connect" onClick={beginConnection}>Connect wallet</button><button className="button primary" onClick={beginConnection}>Launch app<ArrowUpRight size={15}/></button></>}</div><button className="icon-button nav-menu" onClick={() => setOpen((value) => !value)}>{open ? <X/> : <Menu/>}</button></header><Outlet/><PublicFooter/></div>
}

export default function Landing() {
  const { assets, pools } = useStakeion()
  const { isConnected: isEvmConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { isConnected: isSolanaConnected } = useAppKitAccount({ namespace: 'solana' })
  const isConnected = isEvmConnected || isSolanaConnected
  const navigate = useNavigate()
  const beginConnection = () => {
    window.sessionStorage.removeItem('fourstakes-show-landing')
    openReownModal()
  }
  const liveMarkets = assets.filter((asset) => asset.marketTimestamp || asset.price > 0)
  const publicPools = pools.map((pool) => ({ ...assets.find((asset) => asset.symbol === pool.symbol), ...pool }))
  const marketCards = (publicPools.length ? publicPools : assets.filter((asset) => asset.marketTimestamp || asset.price > 0)).slice(0, 6)
  const tickerAssets = [...assets, ...assets]
  return <>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><div className="hero-kicker"></div><h1>𝙁𝙤𝙪𝙧𝙎𝙩𝙖𝙠𝙚𝙨<br/><em>𝐒𝐭𝐚𝐤𝐞 𝐂𝐫𝐲𝐩𝐭𝐨 & 𝐄𝐚𝐫𝐧 𝐑𝐞𝐰𝐚𝐫𝐝𝐬</em></h1><p>Every deposit of at least $50 will receive a 10% bonus. Earn up to 17.14% every 3 months by staking with us!</p><div className="hero-actions">{isConnected ? <button className="button primary large" onClick={() => navigate('/dashboard')}>Open dashboard<ArrowRight size={17}/></button> : <button className="button primary large" onClick={beginConnection}>Start staking<ArrowRight size={17}/></button>}<a className="button secondary large" href="#markets">Explore assets</a></div><div className="hero-trust"><span><Check size={14}/>6% Fourstakes fee</span><span><Check size={14}/>Use more than one wallet</span><span><Check size={14}/>Assets matched to your wallet</span></div></div>
        <div className="hero-visual">
          <div className="visual-top"><div><span>Market overview</span><strong>Live asset prices</strong><small>Current prices and staking information</small></div><span className="live-chip"><i/>{liveMarkets.length ? 'Live prices' : 'Prices updating'}</span></div>
          <div className="visual-wallets">{assets.slice(0, 4).map((asset) => <div key={asset.symbol}><AssetIcon symbol={asset.symbol}/><span><strong>{asset.name}</strong><small>{asset.networkName}</small></span><b>{asset.price > 0 ? `$${asset.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '—'}</b></div>)}</div>
          <div className="visual-footer"><span><ShieldCheck size={15}/>Clear account activity</span><span>Confirmed network transfers</span></div>
        </div>
      </section>
      <section className="market-strip" aria-label="Live market changes"><span className="market-strip-label">Network</span><div className="market-strip-track">{tickerAssets.map((asset, index) => <div className="market-strip-item" key={`${asset.symbol}-${index}`} aria-hidden={index >= assets.length}><AssetIcon symbol={asset.symbol} size={24}/><b>{asset.symbol}</b><small className={asset.price > 0 ? (asset.change >= 0 ? 'positive' : 'negative') : ''}>{asset.price > 0 ? `${asset.change > 0 ? '+' : ''}${asset.change}%` : '—'}</small></div>)}</div></section>
      <section className="landing-section markets-section" id="markets"><div className="section-heading"><span className="eyebrow">Staking opportunities</span><h2>Explore assets built for staking.</h2><p>See live prices now. Rates and terms are shown as soon as staking is available.</p></div><div className="staking-market-cards">{marketCards.map((asset) => { const apy = Number(asset.apy || asset.currentApy || asset.current_apy || 0); const active = asset.isActive || asset.status === 'Active' || asset.status === 'Available'; return <article className="staking-market-card" key={asset.id || asset.symbol}><div className="staking-card-icon"><AssetIcon symbol={asset.symbol} size={44}/></div><div className="staking-card-main"><div><h3>{asset.name}</h3><span>{asset.symbol} · {asset.networkName}</span></div><strong>{apy > 0 ? `${apy}%` : asset.price ? compactMoney(asset.price) : '—'}</strong><small>{apy > 0 ? 'Current reward rate' : 'Live market price'}</small><div className={`mini-trend ${asset.change >= 0 ? 'up' : 'down'}`} aria-label={`${asset.symbol} market trend`}><i/><i/><i/><i/><i/><i/><i/></div></div><Link className="staking-card-action" to={active ? `/stake?asset=${asset.symbol}` : '/networks'}>{active ? 'Stake now' : 'View asset'}<ArrowRight size={16}/></Link></article>})}</div><div className="section-link"><Link to="/networks">View all networks<ArrowRight size={15}/></Link><span>APY is variable and not guaranteed.</span></div></section>
      <section className="landing-section process-section"><div className="section-heading"><span className="eyebrow">How it works</span><h2>From wallet to rewards, all in one place.</h2></div><div className="process-grid">{[['01',WalletCards,'Connect your wallet','Connect a wallet you already use. Your private keys always stay with you.'],['02',CircleDollarSign,'Add funds','Deposit a supported asset using the matching network.'],['03',Layers3,'Choose a pool','Choose an available asset and review its current terms.'],['04',BarChart3,'Track rewards','Follow your positions, estimated rewards, and account activity.']].map(([number,Icon,title,copy]) => <article key={number}><span>{number}</span><Icon size={22}/><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="landing-section multiwallet-section"><div className="multiwallet-copy"><span className="eyebrow">One account, many wallets</span><h2>Your assets,<br/>one portfolio.</h2><p>Connect the wallets you use and view eligible balances and positions together, while each wallet remains separate.</p><ul><li><Check size={15}/>Clear wallet ownership</li><li><Check size={15}/>Assets matched to each network</li><li><Check size={15}/>One simple portfolio view</li></ul><Link to="/wallets" className="text-link">Manage wallets<ArrowRight size={15}/></Link></div><div className="wallet-equation"><div className="equation-wallet"><WalletCards size={42}/><span><b>Your connected wallet</b><small>Securely linked</small></span><div><strong>Network ready</strong><small>Your wallet, your address</small></div></div><span>+</span><div className="equation-wallet"><ShieldCheck size={42}/><span><b>Confirmed deposits</b><small>Added after confirmation</small></span><div><strong>Protected</strong><small>Network checks included</small></div></div><span>=</span><div className="equation-total"><span>Fourstakes portfolio</span><strong>Your account overview</strong><small>Each wallet stays separate</small></div></div></section>
      <section className="landing-section security-section"><div className="security-visual"><div className="security-orbit"><BrandMark size={48}/><span className="orbit-node one"><BadgeCheck/></span><span className="orbit-node two"><Eye/></span><span className="orbit-node three"><Network/></span></div><div className="security-status"><i/><span><strong>Account protection</strong><small>Always monitored</small></span></div></div><div className="security-copy"><span className="eyebrow">Security by design</span><h2>Built around clarity and control.</h2><p>Connect your wallet securely, use compatible assets and networks, and follow every account movement in one place.</p><div className="security-points"><div><ShieldCheck/><span><strong>Wallet connection</strong><small>Confirm directly in your wallet</small></span></div><div><Network/><span><strong>Network matching</strong><small>Use the right asset on the right network</small></span></div><div><Eye/><span><strong>Account activity</strong><small>Every movement is clearly recorded</small></span></div><div><Layers3/><span><strong>Withdrawal checks</strong><small>We check your details before funds move</small></span></div></div><Link to="/security" className="button secondary">Explore security<ArrowRight size={15}/></Link></div></section>
      <section className="landing-cta"><BrandMark size={40}/><span className="eyebrow">Built for the assets you hold</span><h2>Put your portfolio to work.</h2><p>Connect your first wallet and explore multi-chain staking with transparent accounting.</p><div>{isConnected ? <button className="button primary large" onClick={() => navigate('/dashboard')}>Open dashboard<ArrowRight size={17}/></button> : <button className="button primary large" onClick={beginConnection}>Launch Fourstakes<ArrowRight size={17}/></button>}<Link className="button secondary large" to="/risk-disclosure">Read risk disclosure</Link></div></section>
    </main>
  </>
}

export function NotFoundPage() {
  return <main className="public-inner"><section className="inner-hero"><span className="eyebrow">Fourstakes · Page not found</span><X size={34}/><h1>404</h1><p>The page you requested could not be found.</p><Link className="button primary" to="/">Return home<ArrowRight size={16}/></Link></section></main>
}

export function PublicPage({ type }) {
  const content = {
    markets: ['Markets', 'Compare supported staking markets.', 'Review current APY, network conditions, and pool status before moving assets.', BarChart3],
    staking: ['Staking', 'Make your assets work for you.', 'Add funds, stake available assets, earn variable rewards, and withdraw when eligible—all tracked in your account activity.', Layers3],
    security: ['Security', 'Protection designed around your control.', 'Confirm in your wallet, use compatible assets and networks, and track every movement in your account.', ShieldCheck],
    'how-it-works': ['How it works', 'A transparent path from wallet to rewards.', 'Connect and verify a wallet, deposit supported assets, select a pool, and track every movement.', Network],
    'risk-disclosure': ['Risk disclosure', 'Understand the risks before staking.', 'Digital assets, staking rewards, and network conditions involve risk. APY is variable and never guaranteed.', Eye],
  }[type]
  const [title, heading, copy, Icon] = content
  return <main className="public-inner"><section className="inner-hero"><span className="eyebrow">Fourstakes · {title}</span><Icon size={34}/><h1>{heading}</h1><p>{copy}</p><Link className="button primary" to="/dashboard">Open the app<ArrowRight size={16}/></Link></section><section className="inner-grid">{[['Account clarity','Your balance reflects completed deposits, rewards, and withdrawals.'],['Network matching','Only compatible assets are shown for each connected wallet.'],['Transparent fees','Fourstakes fee is 6%. Network costs are shown before you confirm.']].map(([head,text]) => <article key={head}><h2>{head}</h2><p>{text}</p></article>)}</section></main>
}

export function AnnouncementsPage() {
  const updates = [{ date: '04 Aug 2026', title: 'Sui network is live', copy: 'SUI has been added to the Fourstakes network directory with wallet compatibility guidance.', detail: 'Sui is now available in the Fourstakes directory. Users can review SUI market information and see which wallet types are intended to support this network before proceeding.' }, { date: '20 May 2026', title: 'Fourstakes launched', copy: 'Fourstakes began providing one place to view supported networks, assets, and staking activity.', detail: 'Fourstakes launched with a clear account experience for supported networks, wallet connections, asset availability, and account activity.' }]
  const [selectedIndex, setSelectedIndex] = useState(null)
  const selected = selectedIndex === null ? null : updates[selectedIndex]
  const openAnnouncement = (index) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setSelectedIndex(index) }
  return <main className="public-inner announcement-page"><section className="announcement-hero"><span className="eyebrow">Fourstakes · Official updates</span><Megaphone size={36}/><h1>Announcements</h1><p>Product milestones, network availability, and important updates—published clearly for the Fourstakes community.</p><div><span><CheckCircle2 size={15}/>Official product updates</span><span><Clock3 size={15}/>Operating since 20 May 2026</span></div></section><section className="announcement-layout"><div className="announcement-timeline">{updates.map((update, index) => <article key={update.date}><div className="announcement-date"><i/>{update.date}</div><button className="announcement-entry" onClick={() => openAnnouncement(index)}><span className="announcement-index">{String(index + 1).padStart(2, '0')}</span><h2>{update.title}</h2><p>{update.copy}</p><span className="announcement-read">Read update <ArrowRight size={14}/></span></button></article>)}</div>{selected && <><button className="announcement-scrim" aria-label="Close announcement" onClick={() => setSelectedIndex(null)}/><aside className="announcement-detail" aria-live="polite"><button className="icon-button" aria-label="Close announcement" onClick={() => setSelectedIndex(null)}><X size={20}/></button><span className="eyebrow">Release {String(selectedIndex + 1).padStart(2, '0')}</span><h2>{selected.title}</h2><div className="announcement-detail-meta"><span>{selected.date}</span><span>Official update</span></div><p>{selected.detail}</p><div><ShieldCheck size={17}/><span>Published by Fourstakes</span></div></aside></>}</section></main>
}

export function HowItWorksPage() {
  const steps = [[WalletCards,'Connect a supported wallet','Choose a wallet you already use. Your wallet remains under your control.'],[CircleDollarSign,'Add supported assets','Select a compatible asset and follow the network details shown before you continue.'],[Layers3,'Choose your opportunity','Review the current rate, term, and availability for each asset.'],[BarChart3,'Follow your account','Track deposits, staking positions, rewards, and activity in one place.']]
  return <main className="public-inner trust-page"><section className="trust-hero"><span className="eyebrow">A clear process</span><Sparkles size={35}/><h1>Built for confident decisions.</h1><p>Every step is designed to show you what is happening, what is available, and what to review before you continue.</p></section><section className="trust-steps">{steps.map(([Icon,title,copy], index) => <article key={title}><span>0{index + 1}</span><Icon size={25}/><h2>{title}</h2><p>{copy}</p></article>)}</section><section className="trust-note"><ShieldCheck size={22}/><div><strong>What Fourstakes will never ask for</strong><p>Your seed phrase, password, or private keys. Confirm wallet actions only inside your wallet.</p></div></section></main>
}

export function SecurityPage() {
  return <main className="public-inner trust-page"><section className="trust-hero security-hero"><span className="eyebrow">Security and transparency</span><LockKeyhole size={35}/><h1>Protection you can understand.</h1><p>Fourstakes is designed to make wallet connections, network matching, and account activity clear at every stage.</p></section><section className="security-assurance"><article><ShieldCheck size={24}/><h2>Wallet confirmation</h2><p>Wallet actions are confirmed in the wallet you choose. We never request your private keys or seed phrase.</p></article><article><Network size={24}/><h2>Network matching</h2><p>Only compatible assets are shown for each connected wallet to reduce avoidable transfer errors.</p></article><article><Eye size={24}/><h2>Clear account activity</h2><p>Deposits, withdrawals, rewards, and staking activity are presented in one account history.</p></article></section></main>
}

export function ContactPage() {
  const telegramUrl = import.meta.env.VITE_TELEGRAM_URL?.trim()
  const validTelegramUrl = telegramUrl && /^https:\/\/t\.me\//i.test(telegramUrl) ? telegramUrl : ''
  const [submitted, setSubmitted] = useState(false)
  const submit = (event) => { event.preventDefault(); setSubmitted(true); if (validTelegramUrl) window.open(validTelegramUrl, '_blank', 'noopener,noreferrer') }
  const topics = [[LockKeyhole,'Account support','Questions about your wallet connection, deposits, or account activity.'],[Network,'Partnerships','Connect with us about supported networks and product collaboration.'],[Megaphone,'Feedback','Share ideas that can make the Fourstakes experience clearer and better.'],[Send,'General questions','Reach our team for questions about Fourstakes and supported assets.']]
  return <main className="contact-page"><section className="contact-hero"><span className="eyebrow">Fourstakes · Support</span><h1>Get in touch.</h1><p>Questions about Fourstakes? Our team is here to help.</p><a href="#contact-form" className="button primary">Contact us<ArrowRight size={16}/></a></section><section className="contact-content"><div><span className="eyebrow">How can we help?</span><h2>Choose the right conversation.</h2><p>Use the topic closest to your question so we can guide you faster.</p><div className="contact-topic-grid">{topics.map(([Icon,title,copy]) => <article key={title}><Icon size={22}/><h3>{title}</h3><p>{copy}</p></article>)}</div></div><section className="contact-form-section" id="contact-form"><div className="contact-orbit"><BrandMark size={58}/></div><form onSubmit={submit}><span className="eyebrow">Contact us</span><h2>Tell us how we can help.</h2><p>Never include your seed phrase, password, or private keys.</p><label>Topic<select required defaultValue="General question"><option>General question</option><option>Account support</option><option>Partnership</option><option>Feedback</option></select></label><div className="contact-fields"><label>Name<input required placeholder="Your name"/></label><label>Email<input required type="email" placeholder="you@example.com"/></label></div><label>Message<textarea required rows="5" placeholder="How can we help?"/></label><button className="button primary full" type="submit">{validTelegramUrl ? 'Continue to Telegram' : 'Send request'}</button>{submitted && <small className="contact-confirmation">{validTelegramUrl ? 'Telegram is opening in a new tab.' : 'Your request is ready. Our Telegram link will be available soon.'}</small>}</form></section></section></main>
}

function PublicFooter() {
  return <footer className="public-footer"><div className="footer-brand"><strong className="footer-tagline">Staking has never<br/><em>been this easy.</em></strong><Link to="/" className="brand"><BrandMark/><b>Fourstakes</b></Link><p>Stake digital assets across supported networks.</p><span>© 2026 Fourstakes. All rights reserved.</span></div><div><strong>Product</strong><Link to="/networks">Networks</Link><Link to="/announcements">Announcements</Link><Link to="/security">Security</Link><Link to="/contact">Contact</Link></div><div><strong>Legal</strong><Link to="/risk-disclosure">Risk disclosure</Link><a href="#terms">Terms</a><a href="#privacy">Privacy</a><a href="#support">Support</a></div><div className="footer-status"><span><i/>Live service</span><p>Current APY is variable. Staking and digital assets involve risk. Fourstakes manages balances for its users.</p></div></footer>
}
