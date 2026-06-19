import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { normalizeQuote } from "../../../lib/normalizeQuote";

const FREE_LIMIT = Number(process.env.FREE_QUOTE_LIMIT || 5);

const OWNER_EMAIL = String(
  process.env.OWNER_EMAIL ||
    process.env.NEXT_PUBLIC_OWNER_EMAIL ||
    "josh520n@gmail.com"
).toLowerCase();

function parseEstimateNumber(value) {
  if (!value) return null;
  const match = /^est[-.](\d{4,6})$/i.exec(value);
  return match ? Number(match[1]) : null;
}

function getNextEstimateNumberFromQuotes(quotes) {
  let maxNumber = 1000;

  for (const quote of quotes) {
    const current = parseEstimateNumber(quote.estimateNumber);
    if (current != null && current > maxNumber) {
      maxNumber = current;
    }
  }

  return `Est-${maxNumber + 1}`;
}

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

async function getUserQuoteCount(uid) {
  const snap = await adminDb
    .collection("quotes")
    .where("userId", "==", uid)
    .get();

  return snap.size;
}

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in to access quotes.",
      });
    }

    const planStatus = await getPlanStatus(user);
    const isOwner = planStatus.isOwner;

    if (req.method === "GET") {
      const snap = await adminDb
        .collection("quotes")
        .orderBy("createdAt", "desc")
        .get();

      let quotes = snap.docs.map((docSnap) => {
        const data = docSnap.data();

        const quote = normalizeQuote({
          id: docSnap.id,
          ...data,
        });

        return {
          id: docSnap.id,
          quoteId: docSnap.id,
          ...quote,
          userId: data.userId || "",
          ownerEmail: data.ownerEmail || "",
          created_at: quote.createdAt || data.created_at || "",
          createdAt: quote.createdAt || data.createdAt || "",
          updatedAt: quote.updatedAt || data.updatedAt || "",
          status: quote.status || "",
          estimateNumber: quote.estimateNumber || "",
          total: Number(quote.totals?.grandTotal || 0),
          startDate: quote.startDate || "",
          dueDate: quote.dueDate || "",
        };
      });

      if (!isOwner) {
        quotes = quotes.filter((quote) => quote.userId === user.uid);
      }

      return res.status(200).json(quotes);
    }

    if (req.method === "POST") {
      const payload = req.body || {};
      const createdAt = new Date().toISOString();

      const userQuotesSnap = await adminDb
        .collection("quotes")
        .where("userId", "==", user.uid)
        .get();

      const userQuotes = userQuotesSnap.docs.map((docSnap) => docSnap.data());

      const usageRef = adminDb.collection("usage").doc(user.uid);
      const quoteRef = adminDb.collection("quotes").doc();

      let savedPayload = null;

      await adminDb.runTransaction(async (transaction) => {
        const usageSnap = await transaction.get(usageRef);
        const usageData = usageSnap.exists ? usageSnap.data() : {};

        const storedCount = Number(usageData.count || 0);
        const currentQuoteCount = userQuotes.length;
        const currentCount = Math.max(storedCount, currentQuoteCount);

        if (!planStatus.unlimited && currentCount >= FREE_LIMIT) {
          const error = new Error("FREE_LIMIT_REACHED");
          error.statusCode = 402;
          error.currentCount = currentCount;
          throw error;
        }

        savedPayload = {
          ...payload,
          id: quoteRef.id,
          quoteId: quoteRef.id,
          userId: user.uid,
          ownerEmail: user.email || "",
          estimateNumber:
            payload.estimateNumber ||
            getNextEstimateNumberFromQuotes(userQuotes),
          createdAt,
          updatedAt: createdAt,
        };

        transaction.set(quoteRef, savedPayload);

        transaction.set(
          usageRef,
          {
            email: user.email || "",
            count: planStatus.unlimited ? currentCount : currentCount + 1,
            freeLimit: FREE_LIMIT,
            plan: planStatus.plan,
            unlimited: planStatus.unlimited,
            isOwner: planStatus.isOwner,
            updatedAt: createdAt,
            createdAt: usageData.createdAt || createdAt,
          },
          { merge: true }
        );
      });

      return res.status(201).json(savedPayload);
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("QUOTES API ERROR:", err);

    if (err.message === "FREE_LIMIT_REACHED" || err.statusCode === 402) {
      return res.status(402).json({
        error: `Free quote limit reached. You can create ${FREE_LIMIT} free quotes before upgrading.`,
        code: "FREE_LIMIT_REACHED",
        freeLimit: FREE_LIMIT,
        currentCount: err.currentCount || FREE_LIMIT,
      });
    }

    return res.status(500).json({
      error: err.message || "Quotes API failed",
    });
  }
}
