import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../lib/db";
import { signToken } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  console.info(`auth: login successful — userId=${user.id}`);

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

