import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable, userAccessTable } from "@workspace/db";

const router: IRouter = Router();

function jwtSecret(): string {
  const secret = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"];
  if (!secret) throw new Error("JWT_SECRET or SESSION_SECRET must be set");
  return secret;
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Email ou senha inválidos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou senha inválidos" });
    return;
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret(),
    { expiresIn: "30d" }
  );

  req.log.info({ userId: user.id }, "auth: login successful");

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers["authorization"];
  const token = header?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ error: "Token de autenticação ausente" });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret()) as unknown as JwtPayload;
    (req as Request & { jwtPayload: JwtPayload }).jwtPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

router.get("/me/access", requireAuth, async (req, res) => {
  const payload = (req as Request & { jwtPayload: JwtPayload }).jwtPayload;

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
});

export default router;
