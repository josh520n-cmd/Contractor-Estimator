import EstimateForm from '../../src/components/EstimateForm'
import { useRouter } from 'next/router'

export default function EditQuotePage() {
  const router = useRouter()
  const { id } = router.query

  if (!id) return <main className="container"><p>Loading...</p></main>

  return (
    <main className="container">
      <h1>Edit Quote</h1>
      <EstimateForm existingQuoteId={id} />
    </main>
  )
}
