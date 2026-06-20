import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

const FREE_LIMIT = Number(process.env.FREE_QUOTE_LIMIT || 5);

const OWNER_EMAIL = String(
  process.env.OWNER_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    "josh520n@gmail.com"
).toLowerCase();

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

function isOwnerEmail(email) {
  return String(email || "").toLowerCase() === OWNER_EMAIL;
}

async function getUserQuoteCount(uid) {
  const snap = await adminDb
    .collection("quotes")
    .where("userId", "==", uid)
    .get();

  return snap.size;
}

async function getPlanStatus(user) {
  if (isOwnerEmail(user.email)) {
    return {
      plan: "owner",
      unlimited: true,
      isOwner: true,
      isPaid: true,
    };
  }

  const userSnap = await adminDb.collection("users").doc(user.uid).get();
  const data = userSnap.exists ? userSnap.data() : {};

  const plan = String(data.plan || "free").toLowerCase();
  const subscriptionStatus = String(
    data.subscriptionStatus ||
      data.stripeSubscriptionStatus ||
      ""
  ).toLowerCase();

  const isPaid =
    plan === "paid" ||
    plan === "pro" ||
    plan === "unlimited" ||
    subscriptionStatus === "active";

  return {
    plan: isPaid ? plan || "paid" : "free",
    unlimited: isPaid,
    isOwner: false,
    isPaid,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
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

    const planStatus = await getPlanStatus(user);
    const usageRef = adminDb.collection("usage").doc(user.uid);
    const usageSnap = await usageRef.get();

    const quoteCount = await getUserQuoteCount(user.uid);
    const storedCount = usageSnap.exists
      ? Number(usageSnap.data().count || 0)
      : 0;

    const count = Math.max(storedCount, quoteCount);

    const remaining = planStatus.unlimited
      ? null
      : Math.max(FREE_LIMIT - count, 0);

    return res.status(200).json({
      uid: user.uid,
      email: user.email || "",
      count,
      freeLimit: FREE_LIMIT,
      remaining,
      canCreate: planStatus.unlimited || count < FREE_LIMIT,
      unlimited: planStatus.unlimited,
      plan: planStatus.plan,
      isOwner: planStatus.isOwner,
      isPaid: planStatus.isPaid,
    });
  } catch (err) {
    console.error("USAGE STATUS ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to load usage status",
    });
  }
}
