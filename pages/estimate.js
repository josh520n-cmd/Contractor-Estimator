import Head from 'next/head'
import dynamic from 'next/dynamic'

const EstimateForm = dynamic(() => import('../src/components/EstimateForm'), {
  ssr: false
})

export default function EstimatePage() {
  return (
    <>
      <Head>
        <title>New Estimate | Contractor Estimator</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <main className="container">
        <div className="page-header">
          <div>
            <h1>New Estimate</h1>
            <p>Build estimates faster with a clean contractor workflow.</p>
          </div>
        </div>

        <EstimateForm />
      </main>
    </>
  )
}
