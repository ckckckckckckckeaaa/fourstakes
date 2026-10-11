import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StakeionProvider } from './context/StakeionContext'
import { AppShell } from './layout/AppShell'
import SessionGuard from './components/SessionGuard'

const Landing = lazy(() => import('./pages/Landing'))
const PublicLayout = lazy(() => import('./pages/Landing').then((module) => ({ default: module.PublicLayout })))
const PublicPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.PublicPage })))
const ContactPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.ContactPage })))
const AnnouncementsPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.AnnouncementsPage })))
const HowItWorksPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.HowItWorksPage })))
const SecurityPage = lazy(() => import('./pages/Landing').then((module) => ({ default: module.SecurityPage })))
const TermsPage = lazy(() => import('./pages/Terms'))
const SupportPage = lazy(() => import('./pages/Support'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Wallets = lazy(() => import('./pages/Wallets'))
const StakingPools = lazy(() => import('./pages/StakingPools'))
const AssetDetails = lazy(() => import('./pages/AssetDetails'))
const StakePage = lazy(() => import('./pages/Flows').then((module) => ({ default: module.StakePage })))
const DepositPage = lazy(() => import('./pages/Flows').then((module) => ({ default: module.DepositPage })))
const UnstakePage = lazy(() => import('./pages/Flows').then((module) => ({ default: module.UnstakePage })))
const WithdrawPage = lazy(() => import('./pages/Flows').then((module) => ({ default: module.WithdrawPage })))
const Ledger = lazy(() => import('./pages/Ledger'))
const NetworkActivity = lazy(() => import('./pages/NetworkActivity'))

function RouteLoader() {
  return <div className="route-loader" role="status"><i/><span>Loading Fourstakes</span></div>
}

function App() {
  return <StakeionProvider><BrowserRouter><Suspense fallback={<RouteLoader/>}><Routes>
    <Route element={<PublicLayout/>}>
      <Route index element={<Landing/>}/>
      <Route path="markets" element={<Navigate to="/networks" replace/>}/>
      <Route path="staking" element={<Navigate to="/networks" replace/>}/>
      <Route path="networks" element={<div className="public-network-page"><StakingPools detailBase="/networks"/></div>}/>
      <Route path="networks/:symbol" element={<AssetDetails/>}/>
      <Route path="security" element={<SecurityPage/>}/>
      <Route path="how-it-works" element={<HowItWorksPage/>}/>
      <Route path="risk-disclosure" element={<PublicPage type="risk-disclosure"/>}/>
      <Route path="terms" element={<TermsPage/>}/>
      <Route path="support" element={<SupportPage/>}/>
      <Route path="announcements" element={<AnnouncementsPage/>}/>
      <Route path="contact" element={<ContactPage/>}/>
    </Route>
    <Route element={<SessionGuard/>}>
      <Route element={<AppShell/>}>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path="portfolio" element={<Portfolio/>}/>
        <Route path="wallets" element={<Wallets/>}/>
        <Route path="staking-pools" element={<StakingPools/>}/>
        <Route path="staking-pools/:symbol" element={<AssetDetails/>}/>
        <Route path="stake" element={<StakePage/>}/>
        <Route path="deposit" element={<DepositPage/>}/>
        <Route path="unstake" element={<UnstakePage/>}/>
        <Route path="withdraw" element={<WithdrawPage/>}/>
        <Route path="ledger" element={<Ledger/>}/>
        <Route path="network-activity" element={<NetworkActivity/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Suspense></BrowserRouter></StakeionProvider>
}

export default App
