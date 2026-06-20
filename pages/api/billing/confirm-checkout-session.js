import Stripe from "stripe";
import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) return null;

  const token = header.replace("Bearer ", "").trim();

  if (!token) return null;

  return await adminAuth.verifyIdToken(token);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in.",
      });
    }

    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing checkout session ID.",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionUid =
      session.client_reference_id ||
      session.metadata?.firebaseUID ||
      "";

    if (sessionUid !== user.uid) {
      return res.status(403).json({
        error: "This checkout session does not belong to this account.",
      });
    }

    const subscription =
      typeof session.subscription === "object"
        ? session.subscription
        : null;

    const subscriptionStatus = subscription?.status || "active";

    const isPaid =
      session.payment_status === "paid" ||
      subscriptionStatus === "active" ||
      subscriptionStatus === "trialing";

    if (!isPaid) {
      return res.status(400).json({
        error: "Checkout has not completed payment yet.",
        paymentStatus: session.payment_status,
        subscriptionStatus,
      });
    }

    await adminDb.collection("users").doc(user.uid).set(
      {
        email: user.email || "",
        plan: "paid",
        subscriptionStatus: subscriptionStatus || "active",
        stripeCustomerId: session.customer || "",
        stripeSubscriptionId: subscription?.id || session.subscription || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      plan: "paid",
      subscriptionStatus,
    });
  } catch (err) {
    console.error("CONFIRM CHECKOUT SESSION ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to confirm checkout session.",
    });
  }
}
