import { Resend } from "resend";
import crypto from "crypto";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const { email, quoteId } = req.body || {};

  if (!email || !quoteId) {
    return res.status(400).json({
      error: "Missing email or quoteId",
    });
  }

  try {
    const token = crypto.randomBytes(24).toString("hex");

    await setDoc(doc(db, "quoteLinks", quoteId), {
      token,
      quoteId,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    const clientLink = `${process.env.NEXT_PUBLIC_BASE_URL}/quotes/client/${quoteId}?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "Contractor Estimator <quotes@constructionestimator.xyz>",
      to: email,
      subject: "Your Estimate is Ready",
      html: `
        <h2>Your Contractor Estimate</h2>
        <p>Click below to view your quote:</p>
        <p>
          <a href="${clientLink}" target="_blank">
            View Estimate
          </a>
        </p>
        <p>This link expires in 7 days.</p>
      `,
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
    console.error("SEND CLIENT LINK ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to send client link",
    });
  }
}
