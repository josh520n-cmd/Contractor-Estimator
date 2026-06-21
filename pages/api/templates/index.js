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

function normalizeTemplate(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    name: data.name || "Untitled Template",
    userId: data.userId || "",
    ownerEmail: data.ownerEmail || "",
    data: data.data || {},
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || "",
  };
}

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req).catch(() => null);

    if (!user) {
      return res.status(401).json({
        error: "You must be signed in to use templates.",
      });
    }

    const isOwner = isOwnerEmail(user.email);

    if (req.method === "GET") {
      const snap = await adminDb
        .collection("templates")
        .orderBy("createdAt", "desc")
        .get();

      let templates = snap.docs.map(normalizeTemplate);

      if (!isOwner) {
        templates = templates.filter((template) => {
          return template.userId === user.uid;
        });
      }

      return res.status(200).json(templates);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const now = new Date().toISOString();

      const payload = {
        name: body.name || "Untitled Template",
        userId: user.uid,
        ownerEmail: user.email || "",
        data: body.data || {},
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await adminDb.collection("templates").add(payload);

      return res.status(201).json({
        id: docRef.id,
        ...payload,
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("TEMPLATES API ERROR:", err);

    return res.status(500).json({
      error: err.message || "Templates API failed",
    });
  }
}
