import { adminDb } from "../../lib/firebaseAdmin";
import { normalizeQuote } from "../../lib/normalizeQuote";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { id, token } = req.query;

    if (!id || !token) {
      return res.status(400).json({
        error: "Missing quote id or token",
      });
    }

    const linkSnap = await adminDb
      .collection("quoteLinks")
      .doc(String(id))
      .get();

    if (!linkSnap.exists) {
      return res.status(404).json({
        error: "This estimate is not available.",
      });
    }

    const linkData = linkSnap.data();

    if (String(linkData.token || "") !== String(token)) {
      return res.status(403).json({
        error: "Invalid estimate link.",
      });
    }

    if (linkData.expiresAt && Date.now() > Number(linkData.expiresAt)) {
      return res.status(410).json({
        error: "This estimate link has expired.",
      });
    }

    const quoteId = linkData.quoteId || id;

    const quoteSnap = await adminDb
      .collection("quotes")
      .doc(String(quoteId))
      .get();

    if (!quoteSnap.exists) {
      return res.status(404).json({
        error: "Quote not found.",
      });
    }

    const quote = normalizeQuote({
      id: quoteSnap.id,
      quoteId: quoteSnap.id,
      ...quoteSnap.data(),
    });

    return res.status(200).json(quote);
  } catch (err) {
    console.error("CLIENT QUOTE API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Client quote failed to load",
    });
  }
}
