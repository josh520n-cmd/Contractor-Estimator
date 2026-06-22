import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

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

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Missing template id." });
    }

    const docRef = adminDb.collection("templates").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Template not found." });
    }

    const existing = docSnap.data();

    if (existing.userId !== user.uid) {
      return res.status(403).json({ error: "Not allowed." });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        id: docSnap.id,
        ...existing,
      });
    }

    if (req.method === "PUT") {
      const payload = req.body || {};

      const update = {
        name: String(payload.name || existing.name || "Template").trim(),
        data: payload.data || existing.data || {},
        updatedAt: new Date().toISOString(),
      };

      await docRef.set(update, { merge: true });

      return res.status(200).json({
        id,
        ...existing,
        ...update,
      });
    }

    if (req.method === "DELETE") {
      await docRef.delete();

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error("TEMPLATE ID API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Template request failed.",
    });
  }
}
