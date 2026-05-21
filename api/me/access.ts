import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db, userAccessTable, ordersTable } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

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
      amount: ordersTable.amount,
    })
    .from(userAccessTable)
    .leftJoin(ordersTable, eq(userAccessTable.orderId, ordersTable.id))
    .where(eq(userAccessTable.email, payload.email));

  res.json({
    hasAccess: items.length > 0,
    items: items.map((i) => ({
      id: i.id,
      externalOrderId: i.externalOrderId,
      grantedAt: i.grantedAt.toISOString(),
      amount: i.amount ? i.amount / 100 : 0,
    })),
  });
}

