import Head from "next/head";
import Link from "next/link";

const SEO_PAGES = {
  "contractor-estimate-software": {
    title: "Contractor Estimate Software",
    audience: "contractors",
    headline: "Simple Estimate Software for Contractors",
    description:
      "Create professional contractor estimates, save quotes, print PDFs, send client links, and schedule job start and end dates without messy paperwork.",
    keywords:
      "contractor estimate software, contractor estimating app, construction estimate software, contractor quote software",
  },

  "handyman-estimate-software": {
    title: "Handyman Estimate Software",
    audience: "handymen",
    headline: "Simple Estimate Software for Handymen",
    description:
      "Create handyman estimates quickly, organize saved quotes, print professional PDFs, and send client links from one simple tool.",
    keywords:
      "handyman estimate software, handyman estimating app, handyman quote software, handyman invoice estimate tool",
  },

  "painting-estimate-software": {
    title: "Painting Estimate Software",
    audience: "painters",
    headline: "Simple Estimate Software for Painters",
    description:
      "Build painting estimates with materials, labor, waste, overhead, profit, and tax calculations in one place.",
    keywords:
      "painting estimate software, painter estimating app, painting quote software, paint job estimate tool",
  },

  "landscaping-estimate-software": {
    title: "Landscaping Estimate Software",
    audience: "landscapers",
    headline: "Simple Estimate Software for Landscapers",
    description:
      "Create landscaping estimates, save reusable templates, print PDFs, send client links, and schedule job dates.",
    keywords:
      "landscaping estimate software, landscaping estimating app, landscaping quote software, lawn care estimate tool",
  },

  "remodeling-estimate-software": {
    title: "Remodeling Estimate Software",
    audience: "remodelers",
    headline: "Simple Estimate Software for Remodelers",
    description:
      "Create professional remodeling estimates with materials, labor, presets, templates, PDF printing, and client links.",
    keywords:
      "remodeling estimate software, remodeler estimating app, home remodeling quote software, renovation estimate tool",
  },

  "construction-estimate-template": {
    title: "Construction Estimate Template",
    audience: "small crews",
    headline: "A Simple Construction Estimate Template Alternative",
    description:
      "Stop copying messy spreadsheets. Use a simple construction estimate tool that saves quotes, calculates totals, prints PDFs, and keeps jobs organized.",
    keywords:
      "construction estimate template, contractor estimate template, construction quote template, estimate template for contractors",
  },
};

export default function SeoLandingPage({ page }) {
  if (!page) return null;

  const fullTitle = `${page.title} | Construction Estimator`;
  const canonicalUrl = `https://www.constructionestimator.xyz/${page.slug}`;

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={page.description} />
        <meta name="keywords" content={page.keywords} />

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={page.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={page.description} />
      </Head>

      <main className="seo-page">
        <header className="seo-topbar">
          <Link href="/" className="seo-brand">
            <img
              src="/cee-logo.png"
              alt="Construction Estimator"
              className="seo-logo"
            />
            <span>Contractor Estimator</span>
          </Link>

          <nav className="seo-nav">
            <Link href="/login" className="seo-secondary-btn seo-nav-btn">
              Sign In
            </Link>

            <Link href="/signup" className="seo-primary-btn seo-nav-btn">
              Start Free
            </Link>
          </nav>
        </header>

        <section className="seo-hero">
          <div className="seo-badge">Construction Estimator</div>

          <h1>{page.headline}</h1>

          <p className="seo-subtitle">{page.description}</p>

          <div className="seo-actions">
            <Link href="/signup" className="seo-primary-btn">
              Start Free — 5 Estimates Included
            </Link>

            <Link href="/" className="seo-secondary-btn">
              See How It Works
            </Link>
          </div>

          <p className="seo-small-note">
            No credit card required. Upgrade to Pro when you are ready for
            unlimited estimates.
          </p>
        </section>

        <section className="seo-section">
          <h2>Built for {page.audience} who want faster estimates</h2>

          <p>
            Construction Estimator helps you move away from scattered notes,
            calculators, spreadsheets, and rewritten estimates. It gives you a
            simple place to build, save, edit, print, and send estimates.
          </p>

          <div className="seo-feature-grid">
            <div>
              <h3>Create estimates fast</h3>
              <p>
                Add client details, materials, labor, waste, overhead, profit,
                and tax.
              </p>
            </div>

            <div>
              <h3>Save and edit quotes</h3>
              <p>
                Keep estimates organized and update them when the job changes.
              </p>
            </div>

            <div>
              <h3>Use presets and templates</h3>
              <p>
                Save common materials and reusable estimate setups for faster
                quoting.
              </p>
            </div>

            <div>
              <h3>Print PDFs and send links</h3>
              <p>
                Give customers a cleaner, more professional estimate they can
                review.
              </p>
            </div>

            <div>
              <h3>Schedule job dates</h3>
              <p>
                Add start and due dates so your work stays easier to track.
              </p>
            </div>

            <div>
              <h3>Simple pricing</h3>
              <p>
                Start with 5 free estimates. Upgrade to Pro for unlimited
                estimates.
              </p>
            </div>
          </div>
        </section>

        <section className="seo-cta">
          <h2>Try Construction Estimator today</h2>

          <p>
            Create cleaner estimates, stay organized, and stop doing everything
            the hard way.
          </p>

          <Link href="/signup" className="seo-primary-btn">
            Start Free
          </Link>
        </section>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.keys(SEO_PAGES).map((slug) => ({
      params: { slug },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const page = SEO_PAGES[params.slug] || null;

  return {
    props: {
      page: {
        ...page,
        slug: params.slug,
      },
    },
  };
}