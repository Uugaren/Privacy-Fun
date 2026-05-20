import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, contentsTable, userAccessTable, ordersTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// POST /admin/contents — create content (admin only)
router.post("/admin/contents", requireAdmin, async (req, res) => {
  const { title, description, type, price, teaserUrl, privateFolderKey } = req.body as {
    title?: unknown;
    description?: unknown;
    type?: unknown;
    price?: unknown;
    teaserUrl?: unknown;
    privateFolderKey?: unknown;
  };

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Campo 'title' é obrigatório" });
    return;
  }

  const validTypes = ["album", "video"];
  const contentType = typeof type === "string" ? type : "album";
  if (!validTypes.includes(contentType)) {
    res.status(400).json({ error: "Tipo inválido — use 'album' ou 'video'" });
    return;
  }

  const [content] = await db
    .insert(contentsTable)
    .values({
      title,
      description: typeof description === "string" ? description : null,
      type: contentType,
      price: typeof price === "number" ? Math.round(price * 100) : null,
      teaserUrl: typeof teaserUrl === "string" ? teaserUrl : null,
      privateFolderKey: typeof privateFolderKey === "string" ? privateFolderKey : null,
    })
    .returning();

  req.log.info({ contentId: content!.id }, "admin: content created");
  res.status(201).json(content);
});

// GET /contents — list all contents (public metadata, no private keys)
router.get("/contents", async (req, res) => {
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
});

// GET /contents/:id/secure-stream — time-limited access URL (authenticated)
router.get("/contents/:id/secure-stream", requireAuth, async (req, res) => {
  const payload = (req as AuthedRequest).jwtPayload;
  const contentId = Number(req.params["id"]);

  if (isNaN(contentId)) {
    res.status(400).json({ error: "ID de conteúdo inválido" });
    return;
  }

  const [content] = await db
    .select()
    .from(contentsTable)
    .where(eq(contentsTable.id, contentId))
    .limit(1);

  if (!content) {
    res.status(404).json({ error: "Conteúdo não encontrado" });
    return;
  }

  // Admins always have access
  if (payload.role !== "admin") {
    const access = await db
      .select({ id: userAccessTable.id })
      .from(userAccessTable)
      .where(eq(userAccessTable.email, payload.email))
      .limit(1);

    if (access.length === 0) {
      res.status(403).json({ error: "Sem acesso a este conteúdo — assine para desbloquear" });
      return;
    }
  }

  // Generate a time-limited signed URL token (valid 1 hour)
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const secret = process.env["JWT_SECRET"] ?? process.env["SESSION_SECRET"] ?? "secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${contentId}:${payload.sub}:${expiresAt}`)
    .digest("hex");

  const streamUrl = content.privateFolderKey
    ? `${content.privateFolderKey}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`
    : null;

  req.log.info({ contentId, userId: payload.sub }, "contents: secure stream URL generated");

  res.json({
    contentId,
    streamUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    signature,
  });
});

// GET /admin/orders — list all orders (admin only)
router.get("/admin/orders", requireAdmin, async (req, res) => {
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
});

// GET /admin/users — list all users (admin only)
router.get("/admin/users", requireAdmin, async (req, res) => {
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
});

// GET /admin/stats — dashboard summary (admin only)
router.get("/admin/stats", requireAdmin, async (req, res) => {
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
});

export default router;
