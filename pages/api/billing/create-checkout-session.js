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

    if (!process.env.STRIPE_PRICE_ID) {
      throw new Error("Missing STRIPE_PRICE_ID");
    }

    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in to upgrade.",
      });
    }

    let baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.constructionestimator.xyz";

if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
  baseUrl = `https://${baseUrl}`;
}

baseUrl = baseUrl.replace(/\/$/, "");

    const userRef = adminDb.collection("users").doc(user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    let stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          firebaseUID: user.uid,
        },
      });

      stripeCustomerId = customer.id;

      await userRef.set(
        {
          email: user.email || "",
          stripeCustomerId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user.uid,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        firebaseUID: user.uid,
        email: user.email || "",
      },
      subscription_data: {
        metadata: {
          firebaseUID: user.uid,
          email: user.email || "",
        },
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing/cancel`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (err) {
    console.error("CREATE CHECKOUT SESSION ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to start checkout.",
    });
  }
}
