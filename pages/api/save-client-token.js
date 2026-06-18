import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default async function handler(req, res) {
  const { quoteId, token } = req.body;

  if (!quoteId || !token) {
    return res.status(400).json({ error: "Missing data" });
  }

  await setDoc(doc(db, "quoteLinks", quoteId), {
    token,
    createdAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true });
}
