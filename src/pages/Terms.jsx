import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Building2, Clock3, FileText, LockKeyhole, Scale, ShieldAlert, WalletCards } from 'lucide-react'

const sections = [
  {
    id: 'service',
    title: '1. Our service and your agreement',
    body: <>These Terms govern your access to Fourstakes and any custodial staking, wallet, account, or related services we make available (the <strong>Services</strong>). By opening an account, depositing assets, or using the Services, you confirm that you have read and accept these Terms and our Risk Disclosure. If you do not agree, do not use the Services.</>,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility and account verification',
    body: <>You must be legally able to enter into this agreement and use the Services only where they are permitted by applicable law. We may require identity, source-of-funds, sanctions, or other compliance checks before or after enabling an account, deposit, withdrawal, or reward payment. You must provide complete and accurate information and keep it current.</>,
  },
  {
    id: 'custody',
    title: '3. Custody of digital assets',
    body: <>When you deposit digital assets into a Fourstakes deposit address, you authorize us or our approved custodial providers to hold and safeguard those assets on your behalf. Custodial assets may be held in omnibus or segregated wallets, subject to applicable law and our operational controls. We maintain records of your beneficial entitlement, but blockchain transfers are irreversible once confirmed. Do not send unsupported assets, assets over an unsupported network, or assets from prohibited sources.</>,
  },
  {
    id: 'staking',
    title: '4. Staking instructions, terms, and rewards',
    body: <>When you instruct us to stake an eligible asset, you authorize us to delegate, validate, or otherwise stake it through selected network infrastructure or providers. The applicable asset page or confirmation screen will show the available term, estimated reward rate, fees, and any unbonding or withdrawal conditions. Estimated APY is not a promise or guarantee. Rewards can change because of protocol rules, validator performance, slashing, network participation, taxes, or other factors. Rewards begin, accrue, and are credited only as described in the applicable staking terms.</>,
  },
  {
    id: 'withdrawals',
    title: '5. Withdrawals, lock-ups, and network events',
    body: <>Withdrawals are subject to security review, address validation, minimums, network fees, and the applicable network’s processing times. Staked assets can be unavailable during a lock-up, unbonding, or withdrawal queue. We may delay, reject, or reverse an internal request where necessary to protect an account, comply with law, investigate suspected fraud, or resolve an operational error. Network outages, forks, airdrops, or protocol changes may affect timing, availability, or support for an asset.</>,
  },
  {
    id: 'fees',
    title: '6. Fees, taxes, and statements',
    body: <>Fees and applicable network costs will be presented before you confirm an instruction where reasonably practicable. You are responsible for taxes, reporting, and any duties arising from your use of the Services. Account activity and reward records are provided for convenience; they are not tax, legal, or investment advice. You should retain your own records and consult qualified advisers as appropriate.</>,
  },
  {
    id: 'risk',
    title: '7. Key risks',
    body: <>Digital assets are volatile and may lose all value. Staking involves protocol, validator, liquidity, counterparty, cybersecurity, legal, and operational risks, including slashing or reduced rewards. Custody reduces your direct control of private keys while assets are held with us. Nothing in the Services is an offer, recommendation, or guarantee of returns. Please read the Risk Disclosure before staking.</>,
  },
  {
    id: 'security',
    title: '8. Your security responsibilities',
    body: <>Keep your credentials, device, and withdrawal details secure. We will never ask for your recovery phrase or private keys. Notify Support immediately if you believe your account, email, authentication method, or withdrawal address has been compromised. We may suspend activity while investigating a security report. You remain responsible for instructions authenticated through your account except where applicable law requires otherwise.</>,
  },
  {
    id: 'suspension',
    title: '9. Suspension and termination',
    body: <>We may limit, suspend, or close access to the Services where required by law, to protect customers or the platform, or where we reasonably suspect misuse, fraud, sanctions exposure, or a breach of these Terms. Where permitted, we will provide notice and reasonable information about how to withdraw eligible assets after any required review or hold period.</>,
  },
  {
    id: 'changes',
    title: '10. Changes, complaints, and contact',
    body: <>We may update these Terms to reflect legal, security, or service changes. Material changes will be communicated through the Service or another reasonable channel before they take effect, unless immediate change is required for security or law. For a complaint or question, use our Support page and include the relevant account reference and transaction hash where available. These Terms should be reviewed by your legal team and localized for the jurisdictions in which Fourstakes operates before production use.</>,
  },
]

export default function TermsPage() {
  return <main className="legal-page">
    <section className="legal-hero">
      <div><span className="eyebrow">Fourstakes · Legal</span><FileText size={34}/><h1>Terms of service</h1><p>Clear terms for custody, staking, and managing digital assets through Fourstakes.</p></div>
      <div className="legal-meta"><span><Clock3 size={15}/>Effective 11 October 2026</span><span><Scale size={15}/>Version 1.0</span></div>
    </section>
    <section className="legal-notice"><AlertTriangle size={21}/><div><strong>Important legal notice</strong><p>This product-ready template describes standard custodial staking terms. It must be reviewed and adapted by qualified counsel for Fourstakes’ entity, licences, jurisdictions, and actual custody arrangements before it is relied upon.</p></div></section>
    <div className="legal-layout">
      <aside className="legal-toc"><strong>On this page</strong>{sections.map(({ id, title }) => <a key={id} href={`#${id}`}>{title.replace(/^\d+\. /, '')}</a>)}<Link className="legal-risk-link" to="/risk-disclosure"><ShieldAlert size={15}/>Read risk disclosure</Link></aside>
      <article className="legal-copy">{sections.map(({ id, title, body }) => <section id={id} key={id}><h2>{title}</h2><p>{body}</p></section>)}</article>
    </div>
    <section className="legal-assurance"><div><LockKeyhole size={23}/><span><strong>Custody clarity</strong><small>Custody, records, and withdrawal conditions should be explained before assets are committed.</small></span></div><div><WalletCards size={23}/><span><strong>Account controls</strong><small>Security reviews and address checks help protect withdrawal instructions.</small></span></div><div><Building2 size={23}/><span><strong>Operational transparency</strong><small>Terms should identify the operating entity and applicable support path.</small></span></div></section>
    <section className="legal-cta"><div><span className="eyebrow">Need assistance?</span><h2>Questions about an account or transaction?</h2><p>Our Support page explains the right information to provide without sharing sensitive credentials.</p></div><Link className="button primary" to="/support">Visit Support <ArrowRight size={16}/></Link></section>
  </main>
}
