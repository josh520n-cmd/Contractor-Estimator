import Stripe from "stripe";
import { adminDb } from "../../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

async function markUserPaid(uid, data = {}) {
  if (!uid) return;

  await adminDb.collection("users").doc(uid).set(
    {
      plan: "paid",
      subscriptionStatus: "active",
      stripeCustomerId: data.stripeCustomerId || "",
      stripeSubscriptionId: data.stripeSubscriptionId || "",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function markUserFree(uid, data = {}) {
  if (!uid) return;

  await adminDb.collection("users").doc(uid).set(
    {
      plan: "free",
      subscriptionStatus: data.subscriptionStatus || "canceled",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function findUidByCustomer(customerId) {
  if (!customerId) return null;

  const snap = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return snap.docs[0].id;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).send("Missing STRIPE_SECRET_KEY");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const uid =
          session.client_reference_id ||
          session.metadata?.firebaseUID ||
          null;

        await markUserPaid(uid, {
          stripeCustomerId: session.customer || "",
          stripeSubscriptionId: session.subscription || "",
        });

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const uid =
          subscription.metadata?.firebaseUID ||
          (await findUidByCustomer(subscription.customer));

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          await markUserPaid(uid, {
            stripeCustomerId: subscription.customer || "",
            stripeSubscriptionId: subscription.id || "",
          });
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "incomplete_expired"
        ) {
          await markUserFree(uid, {
            subscriptionStatus: subscription.status,
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const uid =
          subscription.metadata?.firebaseUID ||
          (await findUidByCustomer(subscription.customer));

        await markUserFree(uid, {
          subscriptionStatus: "canceled",
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const uid = await findUidByCustomer(invoice.customer);

        if (uid) {
          await adminDb.collection("users").doc(uid).set(
            {
              subscriptionStatus: "payment_failed",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        break;
      }

      default:
        break;
    }

    return res.status(200).json({
      received: true,
    });
  } catch (err) {
    console.error("STRIPE WEBHOOK HANDLER ERROR:", err);

    return res.status(500).json({
      error: err.message || "Webhook handler failed",
    });
  }
}
