import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.replace("Bearer ", "").trim();
  if (!token) return null;

  return await adminAuth.verifyIdToken(token);
}

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "You must be signed in." });
    }

    const collectionRef = adminDb.collection("materialPresets");

    if (req.method === "GET") {
      const snap = await collectionRef
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get();

      const presets = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json(presets);
    }

    if (req.method === "POST") {
      const payload = req.body || {};

      const preset = {
        userId: user.uid,
        name: String(payload.name || "Material").trim(),
        description: String(payload.description || "").trim(),
        qty: Number(payload.qty) || 1,
        unit_price: Number(payload.unit_price) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await collectionRef.add(preset);

      return res.status(201).json({
        id: docRef.id,
        ...preset,
      });
    }

    if (req.method === "PUT") {
      const payload = req.body || {};
      const id = payload.id;

      if (!id) {
        return res.status(400).json({ error: "Missing preset id." });
      }

      const docRef = collectionRef.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: "Preset not found." });
      }

      const existing = docSnap.data();

      if (existing.userId !== user.uid) {
        return res.status(403).json({ error: "Not allowed." });
      }

      const update = {
        name: String(payload.name || "Material").trim(),
        description: String(payload.description || "").trim(),
        qty: Number(payload.qty) || 1,
        unit_price: Number(payload.unit_price) || 0,
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
      const id = req.query.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ error: "Missing preset id." });
      }

      const docRef = collectionRef.doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: "Preset not found." });
      }

      const existing = docSnap.data();

      if (existing.userId !== user.uid) {
        return res.status(403).json({ error: "Not allowed." });
      }

      await docRef.delete();

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error("MATERIAL PRESETS API ERROR:", err);
    return res.status(500).json({
      error: err.message || "Material preset request failed.",
    });
  }
}
