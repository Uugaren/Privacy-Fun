import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, ordersTable, usersTable, contentsTable, userAccessTable } from "../lib/db";
import { requireAdmin } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  const [orders, users, contents, accesses] = await Promise.all([
    db.select().from(ordersTable),
    db.select({ id: usersTable.id }).from(usersTable),
    db.select({ id: contentsTable.id }).from(contentsTable),
    db.select({ id: userAccessTable.id }).from(userAccessTable),
  ]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  res.json({
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    totalRevenue,
    totalUsers: users.length,
    totalContents: contents.length,
    totalAccesses: accesses.length,
  });
}

