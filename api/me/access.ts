import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db, userAccessTable } from "../lib/db";
import { requireAuth } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAuth(req, res);
  if (!payload) return;

  const items = await db
    .select({
      id: userAccessTable.id,
      externalOrderId: userAccessTable.externalOrderId,
      grantedAt: userAccessTable.grantedAt,
    })
    .from(userAccessTable)
    .where(eq(userAccessTable.email, payload.email));

  res.json({
    hasAccess: items.length > 0,
    items: items.map((i) => ({
      ...i,
      grantedAt: i.grantedAt.toISOString(),
    })),
  });
}

