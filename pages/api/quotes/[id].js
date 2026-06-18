import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { normalizeQuote } from "../../../lib/normalizeQuote";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!id) {
    return res.status(400).json({ error: "Missing quote id" });
  }

  try {
    const ref = doc(db, "quotes", String(id));
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return res.status(404).json({
        error: "Quote not found",
        id,
      });
    }

    const rawQuote = {
      id: snap.id,
      ...snap.data(),
    };

    const quote = normalizeQuote(rawQuote);

    return res.status(200).json(quote);
  } catch (err) {
    console.error("QUOTE API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Failed to load quote",
    });
  }
}
