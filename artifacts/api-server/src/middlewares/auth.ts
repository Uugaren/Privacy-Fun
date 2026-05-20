import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export type AuthedRequest = Request & { jwtPayload: JwtPayload };

function jwtSecret(): string {
  const secret = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"];
  if (!secret) throw new Error("JWT_SECRET or SESSION_SECRET must be set");
  return secret;
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
    (req as AuthedRequest).jwtPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const payload = (req as AuthedRequest).jwtPayload;
    if (payload.role !== "admin") {
      res.status(403).json({ error: "Acesso negado — perfil de administrador necessário" });
      return;
    }
    next();
  });
}
