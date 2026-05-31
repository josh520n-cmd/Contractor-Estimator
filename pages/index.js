import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const EstimateForm = dynamic(() => import('../src/components/EstimateForm'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>Contractor Estimator</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <main className="container">
        <div className="page-header">
          <div>
            <h1>Contractor Estimator</h1>
            <p>Build estimates faster with a clean contractor workflow.</p>
          </div>
          <Link href="/quotes" className="secondary nav-action">
            Saved Quotes
          </Link>
          <Link href="/calendar" className="primary nav-action">
            Scheduler
          </Link>
        </div>
        <EstimateForm />
      </main>
    </>
  )
}
