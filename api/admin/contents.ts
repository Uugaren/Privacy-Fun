import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, contentsTable } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { title, description, type, price, teaserUrl, privateFolderKey } = req.body as {
    title?: unknown;
    description?: unknown;
    type?: unknown;
    price?: unknown;
    teaserUrl?: unknown;
    privateFolderKey?: unknown;
  };

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Campo 'title' é obrigatório" });
  }

  const validTypes = ["album", "video"];
  const contentType = typeof type === "string" ? type : "album";
  if (!validTypes.includes(contentType)) {
    return res.status(400).json({ error: "Tipo inválido — use 'album' ou 'video'" });
  }

  const [content] = await db
    .insert(contentsTable)
    .values({
      title,
      description: typeof description === "string" ? description : null,
      type: contentType,
      price: typeof price === "number" ? Math.round(price * 100) : null,
      teaserUrl: typeof teaserUrl === "string" ? teaserUrl : null,
      privateFolderKey: typeof privateFolderKey === "string" ? privateFolderKey : null,
    })
    .returning();

  console.info(`admin: content created — contentId=${content!.id}`);
  res.status(201).json(content);
}
