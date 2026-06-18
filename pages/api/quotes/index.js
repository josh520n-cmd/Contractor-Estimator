import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { normalizeQuote } from "../../../lib/normalizeQuote";

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
    if (current != null && current > maxNumber) maxNumber = current;
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

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in to view quotes.",
      });
    }

    const isOwner = isOwnerEmail(user.email);

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

      const existingSnap = await adminDb.collection("quotes").get();
      const existingQuotes = existingSnap.docs.map((docSnap) => docSnap.data());

      const createdAt = new Date().toISOString();

      const savedPayload = {
        ...payload,
        userId: user.uid,
        ownerEmail: user.email || "",
        estimateNumber:
          payload.estimateNumber || getNextEstimateNumberFromQuotes(existingQuotes),
        createdAt,
        updatedAt: createdAt,
      };

      const docRef = await adminDb.collection("quotes").add(savedPayload);

      return res.status(201).json({
        id: docRef.id,
        quoteId: docRef.id,
        ...savedPayload,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("QUOTES API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Quotes API failed",
    });
  }
}
