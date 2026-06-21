import { adminAuth, adminDb } from "../../../lib/firebaseAdmin";

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

function canAccessTemplate(user, templateData) {
  if (!user) return false;
  if (isOwnerEmail(user.email)) return true;
  return templateData.userId === user.uid;
}

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in to use templates.",
      });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        error: "Missing template id.",
      });
    }

    const ref = adminDb.collection("templates").doc(String(id));
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({
        error: "Template not found.",
      });
    }

    const data = snap.data() || {};

    if (!canAccessTemplate(user, data)) {
      return res.status(403).json({
        error: "You do not have access to this template.",
      });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        id: snap.id,
        name: data.name || "Untitled Template",
        userId: data.userId || "",
        ownerEmail: data.ownerEmail || "",
        data: data.data || {},
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
      });
    }

    if (req.method === "DELETE") {
      await ref.delete();

      return res.status(200).json({
        ok: true,
        id: snap.id,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("TEMPLATE DETAIL API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Template API failed",
    });
  }
}
