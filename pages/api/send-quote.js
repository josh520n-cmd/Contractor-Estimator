import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  console.log("BODY RECEIVED:", req.body);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const quote = req.body
    const customerEmail =
    quote.email ||
  quote.customerEmail ||
  quote.payload?.customerEmail ||
  ''
    console.log('SEND QUOTE API HIT')
    console.log('CustomerEmail:', customerEmail)

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Customer email is missing on this quote.'
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'Contractor Estimator <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Estimate ${quote.estimateNumber || quote.id || ''}`,
      html: `
        <h2>Your Estimate</h2>
        <p>Hello ${quote.client || 'Customer'},</p>
        <p>Your estimate is ready.</p>
        <p><b>Estimate #:</b> ${quote.estimateNumber || quote.id || ''}</p>
        <p><b>Job Address:</b> ${quote.jobAddress || ''}</p>
        <p><b>Total:</b> $${quote.totals?.grandTotal || 0}</p>
        <p>Thank you for choosing us!</p>
      `
    })

    console.log('Resend data:', data)
    console.log('Resend error:', error)

    if (error) {
      return res.status(400).json({ error: error.message || error })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
