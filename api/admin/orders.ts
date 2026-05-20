import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, ordersTable } from "../_lib/db";
import { requireAdmin } from "../_lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt);

  res.json(
    orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }))
  );
}
