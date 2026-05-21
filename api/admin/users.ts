import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, usersTable } from "../lib/db";
import { requireAdmin } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
}

