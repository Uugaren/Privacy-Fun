import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, contentsTable, userAccessTable } from "../../lib/db";
import { requireAuth } from "../../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAuth(req, res);
  if (!payload) return;

  const contentId = Number(req.query.id);

  if (isNaN(contentId)) {
    return res.status(400).json({ error: "ID de conteúdo inválido" });
  }

  const [content] = await db
    .select()
    .from(contentsTable)
    .where(eq(contentsTable.id, contentId))
    .limit(1);

  if (!content) {
    return res.status(404).json({ error: "Conteúdo não encontrado" });
  }

  // Admins always have access
  if (payload.role !== "admin") {
    const access = await db
      .select({ id: userAccessTable.id })
      .from(userAccessTable)
      .where(eq(userAccessTable.email, payload.email))
      .limit(1);

    if (access.length === 0) {
      return res.status(403).json({ error: "Sem acesso a este conteúdo — assine para desbloquear" });
    }
  }

  // Generate a time-limited signed URL token (valid 1 hour)
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${contentId}:${payload.sub}:${expiresAt}`)
    .digest("hex");

  const streamUrl = content.privateFolderKey
    ? `${content.privateFolderKey}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`
    : null;

  console.info(`contents: secure stream URL generated — contentId=${contentId} userId=${payload.sub}`);

  res.json({
    contentId,
    streamUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    signature,
  });
}
