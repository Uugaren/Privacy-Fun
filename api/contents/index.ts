import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, contentsTable } from "../lib/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contents = await db
    .select({
      id: contentsTable.id,
      title: contentsTable.title,
      description: contentsTable.description,
      type: contentsTable.type,
      price: contentsTable.price,
      teaserUrl: contentsTable.teaserUrl,
      createdAt: contentsTable.createdAt,
    })
    .from(contentsTable)
    .orderBy(contentsTable.createdAt);

  res.json(contents.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
}
