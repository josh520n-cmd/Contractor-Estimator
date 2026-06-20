import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";
import { normalizeQuote } from "../../../lib/normalizeQuote";

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

function quoteBelongsToUser(quote, user) {
  if (!quote || !user) return false;

  if (isOwnerEmail(user.email)) return true;

  return (
    quote.userId === user.uid ||
    quote.ownerEmail === user.email ||
    quote.payload?.userId === user.uid ||
    quote.payload?.ownerEmail === user.email
  );
}

function payloadBelongsToUser(payload, user) {
  if (!payload || !user) return false;

  if (isOwnerEmail(user.email)) return true;

  return (
    payload.userId === user.uid ||
    payload.ownerEmail === user.email ||
    payload.payload?.userId === user.uid ||
    payload.payload?.ownerEmail === user.email
  );
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Missing quote id",
      });
    }

    const user = await getUserFromRequest(req).catch(() => null);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in.",
      });
    }

    const quoteRef = adminDb.collection("quotes").doc(String(id));
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return res.status(404).json({
        error: "Quote not found",
      });
    }

    const existingQuote = {
      id: quoteSnap.id,
      quoteId: quoteSnap.id,
      ...quoteSnap.data(),
    };

    if (!quoteBelongsToUser(existingQuote, user)) {
      return res.status(403).json({
        error: "You do not have permission to access this quote.",
      });
    }

    if (req.method === "GET") {
      const normalized = normalizeQuote(existingQuote);

      return res.status(200).json({
        id: quoteSnap.id,
        quoteId: quoteSnap.id,
        ...normalized,
      });
    }

    if (req.method === "PUT") {
      const payload = req.body || {};

      const updatePayload = {
        ...payload,
        userId: existingQuote.userId || payload.userId || user.uid,
        ownerEmail: existingQuote.ownerEmail || payload.ownerEmail || user.email || "",
        updatedAt: new Date().toISOString(),
      };

      if (!payloadBelongsToUser(updatePayload, user)) {
        return res.status(403).json({
          error: "You do not have permission to update this quote.",
        });
      }

      await quoteRef.set(updatePayload, { merge: true });

      const updatedSnap = await quoteRef.get();
      const updatedQuote = {
        id: updatedSnap.id,
        quoteId: updatedSnap.id,
        ...updatedSnap.data(),
      };

      return res.status(200).json(normalizeQuote(updatedQuote));
    }

    if (req.method === "PATCH") {
      const payload = req.body || {};

      const updatePayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      await quoteRef.set(updatePayload, { merge: true });

      const updatedSnap = await quoteRef.get();
      const updatedQuote = {
        id: updatedSnap.id,
        quoteId: updatedSnap.id,
        ...updatedSnap.data(),
      };

      return res.status(200).json(normalizeQuote(updatedQuote));
    }

    if (req.method === "DELETE") {
      await quoteRef.delete();

      return res.status(200).json({
        success: true,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("QUOTE ID API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Quote API failed",
    });
  }
}
