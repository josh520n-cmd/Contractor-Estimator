import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
      <div className="landing-nav">
  <div className="brand-row">
    <img
      src="/cee-logo.png"
      alt="Contractor Estimator"
      className="brand-logo"
    />
    <strong className="brand">Contractor Estimator</strong>
  </div>

  <div>
            <Link href="/login" className="secondary">Sign In</Link>
            <Link href="/signup" className="primary">Start Free</Link>
          </div>
        </div>

        <div className="hero-content">
          <h1>Create professional contractor estimates in minutes.</h1>
          <p>
            Build estimates, save quotes, email branded PDFs, manage templates,
            and keep your contractor paperwork organized.
          </p>

          <div className="hero-actions">
            <Link href="/signup" className="primary big">
              Start Free — 5 Estimates Included
            </Link>
            <Link href="/login" className="secondary big">
              Sign In
            </Link>
          </div>

          <p className="small-note">
            No credit card required. After 5 saved estimates, upgrade to Pro for $39/month.
          </p>
        </div>
      </section>

      <section className="features-section">
        <h2>Built for small contractors who need fast, clean estimates.</h2>

        <div className="feature-grid">
          <div>
            <h3>Save Quotes</h3>
            <p>Store estimates, reopen them, edit them, and keep job records organized.</p>
          </div>

          <div>
            <h3>Email Branded PDFs</h3>
            <p>Send professional PDFs with your company name, phone, address, and logo.</p>
          </div>

          <div>
            <h3>Templates & Materials</h3>
            <p>Reuse common materials, labor tasks, and quote templates to save time.</p>
          </div>

          <div>
            <h3>Simple Pricing</h3>
            <p>Start with 5 free saved estimates. Then unlock unlimited estimates for $39/month.</p>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="pricing-card">
          <h2>Free</h2>
          <p className="price">$0</p>
          <p>5 saved estimates included</p>
          <Link href="/signup" className="primary">Start Free</Link>
        </div>

        <div className="pricing-card featured">
          <h2>Pro</h2>
          <p className="price">$39/month</p>
          <p>Unlimited estimates, branded PDFs, email quotes, templates, scheduler, and backups.</p>
          <Link href="/signup?plan=pro" className="primary">
  Start Pro
</Link>
        </div>
      </section>
    </main>
  )
}
