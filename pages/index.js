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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <h1>Contractor Estimator</h1>
          <Link href="/quotes" className="primary">
            View Saved Quotes
          </Link>
        </div>
        <EstimateForm />
      </main>
    </>
  )
}
