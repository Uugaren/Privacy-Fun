import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret) throw new Error("JWT_SECRET or SESSION_SECRET must be set");
  return secret;
}

export function signToken(payload: { sub: number; email: string; role: string }): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, jwtSecret()) as unknown as JwtPayload;
}

/**
 * Extract and verify JWT from the Authorization header.
 * Returns the payload on success, or sends a 401 and returns null.
 */
export function requireAuth(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const header = req.headers.authorization;
  const token = header?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ error: "Token de autenticação ausente" });
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return null;
  }
}

/**
 * Require admin role. Returns the payload on success, or sends 401/403 and returns null.
 */
export function requireAdmin(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const payload = requireAuth(req, res);
  if (!payload) return null;

  if (payload.role !== "admin") {
    res.status(403).json({ error: "Acesso negado — perfil de administrador necessário" });
    return null;
  }

  return payload;
}
