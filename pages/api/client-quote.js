import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default async function handler(req, res) {
  const { id, token } = req.query;

  if (!id || !token) {
    return res.status(400).json({ error: "Missing quote id or token" });
  }

  try {
    const quoteSnap = await getDoc(doc(db, "quotes", id));
    const linkSnap = await getDoc(doc(db, "quoteLinks", id));

    if (!quoteSnap.exists()) {
      return res.status(404).json({ error: "Quote not found" });
    }

    if (!linkSnap.exists()) {
      return res.status(403).json({ error: "Client link not found" });
    }

    const link = linkSnap.data();

    if (link.token !== token) {
      return res.status(403).json({ error: "Invalid client link" });
    }

    if (link.expiresAt && Date.now() > Number(link.expiresAt)) {
      return res.status(403).json({ error: "Client link expired" });
    }

    const quote = quoteSnap.data();

    return res.status(200).json({
      id: quoteSnap.id,
      ...quote,
      payload: quote.payload || quote,
    });
  } catch (err) {
    console.error("CLIENT QUOTE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Client quote failed",
    });
  }
}