import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const quote = req.body

    await resend.emails.send({
      from: 'Contractor Estimator <onboarding@resend.dev>',
      to: quote.email,
      subject: `Estimate ${quote.estimateNumber}`,
      html: `
        <h2>Your Estimate</h2>

        <p>Hello ${quote.client},</p>

        <p>Your estimate is ready.</p>

        <p><b>Estimate #:</b> ${quote.estimateNumber}</p>
        <p><b>Job Address:</b> ${quote.jobAddress}</p>
        <p><b>Total:</b> $${quote.totals.grandTotal}</p>

        <p>Thank you for choosing us!</p>
      `
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}
