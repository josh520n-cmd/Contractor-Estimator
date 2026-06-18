import { Resend } from "resend";
import crypto from "crypto";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { normalizeQuote, formatMoney } from "../../lib/normalizeQuote";

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      error: "RESEND_API_KEY is missing",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const quote = normalizeQuote(req.body || {});

    const customerEmail = quote.customerEmail;

    if (!customerEmail) {
      return res.status(400).json({
        error: "Customer email is missing on this quote.",
      });
    }

    const quoteId = quote.id || quote.quoteId || "";
    let clientLink = "";

    if (quoteId) {
      const token = crypto.randomBytes(24).toString("hex");

      await setDoc(doc(db, "quoteLinks", quoteId), {
        token,
        quoteId,
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
      });

      clientLink = `${process.env.NEXT_PUBLIC_BASE_URL}/quotes/client/${quoteId}?token=${token}`;
    }

    const attachments = [];

    if (req.body?.pdfBase64) {
      const cleanBase64 = req.body.pdfBase64
        .replace(/^data:application\/pdf;base64,/, "")
        .replace(/^data:application\/pdf;filename=.*;base64,/, "");

      attachments.push({
        filename: `${quote.estimateNumber || "estimate"}.pdf`,
        content: cleanBase64,
      });
    }

    const contractorEmail =
      req.body?.contractorEmail ||
      req.body?.companyEmail ||
      req.body?.userEmail ||
      "josh520n@gmail.com";

    const linkHtml = clientLink
      ? `
        <p><b>View Your Estimate Online:</b></p>
        <p>
          <a href="${clientLink}" target="_blank">
            Open Live Estimate
          </a>
        </p>
      `
      : "";

    const { data, error } = await resend.emails.send({
      from: "Contractor Estimator <quotes@constructionestimator.xyz>",
      replyTo: contractorEmail,
      to: customerEmail,
      subject: `Estimate ${quote.estimateNumber || quote.id || ""}`,
      html: `
        <h2>Your Estimate</h2>

        <p>Hello ${quote.client || "Customer"},</p>
        <p>Your estimate is attached as a PDF.</p>

        <p><b>Estimate #:</b> ${quote.estimateNumber || ""}</p>
        <p><b>Job Address:</b> ${quote.jobAddress || ""}</p>
        <p><b>Total:</b> ${formatMoney(quote.totals.grandTotal)}</p>

        ${linkHtml}

        <p>Thank you for choosing us!</p>
      `,
      attachments,
    });

    if (error) {
      return res.status(400).json({
        error: error.message || error,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      clientLink,
    });
  } catch (err) {
    console.error("SEND QUOTE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Send quote failed",
    });
  }
}
