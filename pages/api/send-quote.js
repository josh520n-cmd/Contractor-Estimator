import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
export default async function handler(req, res) {
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      error: 'RESEND_API_KEY is missing'
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  try {
    const quote = req.body
    const estimateNumber = quote.estimateNumber || quote.id || quote.quoteId || ''
const jobAddress = quote.jobAddress || quote.address || ''

    const customerEmail =
      quote.email ||
      quote.customerEmail ||
      quote.payload?.customerEmail ||
      ''

    if (!customerEmail) {
      return res.status(400).json({
        error: 'Customer email is missing on this quote.'
      })
    }

    const attachments = []

    if (quote.pdfBase64) {
      const cleanBase64 = quote.pdfBase64
        .replace(/^data:application\/pdf;base64,/, '')
        .replace(/^data:application\/pdf;filename=.*;base64,/, '')

      attachments.push({
        filename: `${estimateNumber || 'estimate'}.pdf`,
        content: cleanBase64
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'Contractor Estimator <quotes@constructionestimator.xyz>',
      replyTo: 'josh520n@gmail.com',
      to: customerEmail,
      subject: `Estimate ${quote.estimateNumber || quote.id || ''}`,
      html: `
        <h2>Your Estimate</h2>
        <p>Hello ${quote.client || 'Customer'},</p>
        <p>Your estimate is attached as a PDF.</p>
       <p><b>Estimate #:</b> ${estimateNumber}</p>
<p><b>Job Address:</b> ${jobAddress}</p>
        <p><b>Total:</b> $${quote.totals?.grandTotal || 0}</p>
        <p>Thank you for choosing us!</p>
      `,
      attachments
    })

    if (error) {
      return res.status(400).json({
        error: error.message || error
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (err) {
    console.error('SEND QUOTE ERROR:', err)

    return res.status(500).json({
      error: err.message || 'Send quote failed'
    })
  }
}
