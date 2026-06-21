import { Resend } from "resend";
import { adminAuth } from "../../lib/firebaseAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = process.env.OWNER_EMAIL || "josh520n@gmail.com";

async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  return await adminAuth.verifyIdToken(token);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const user = await getUserFromRequest(req).catch(() => null);

    const {
      type = "Feedback",
      message = "",
      email = "",
      pageUrl = "",
      userAgent = "",
    } = req.body || {};

    if (!String(message).trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    const submitterEmail = email || user?.email || "Not provided";

    await resend.emails.send({
      from: "Contractor Estimator <onboarding@resend.dev>",
      to: OWNER_EMAIL,
      subject: `[Contractor Estimator] ${type}`,
      text: `
Type: ${type}

Submitted by: ${submitterEmail}
Firebase user: ${user?.uid || "Not signed in"}
Account email: ${user?.email || "Not signed in"}

Page URL:
${pageUrl}

Message:
${message}

User Agent:
${userAgent}
      `.trim(),
    });

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error("FEEDBACK API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to send feedback.",
    });
  }
}
