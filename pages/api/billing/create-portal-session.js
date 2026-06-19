import Stripe from "stripe";
import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in.",
      });
    }

    const userSnap = await adminDb.collection("users").doc(user.uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};

    if (!userData.stripeCustomerId) {
      return res.status(400).json({
        error: "No Stripe customer found for this account.",
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://constructionestimator.xyz";

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${baseUrl}/estimate`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (err) {
    console.error("CREATE PORTAL SESSION ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to open billing portal.",
    });
  }
}
