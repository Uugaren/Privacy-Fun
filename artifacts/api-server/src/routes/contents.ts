import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
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

// GET /admin/contents — list all contents with private keys (admin only)
router.get("/admin/contents", requireAdmin, async (req, res) => {
  try {
    const contents = await db
      .select()
      .from(contentsTable)
      .orderBy(contentsTable.createdAt);

    res.json(
      contents.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    );
  } catch (error: any) {
    req.log.error(error, "Admin list contents error");
    res.status(500).json({ error: "Erro interno ao listar conteúdos" });
  }
});

// PUT /admin/contents — update content (admin only)
router.put("/admin/contents", requireAdmin, async (req, res) => {
  const { id, title, description, type, price, teaserUrl, privateFolderKey } = req.body as {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    type?: unknown;
    price?: unknown;
    teaserUrl?: unknown;
    privateFolderKey?: unknown;
  };

  if (!id || (typeof id !== "number" && typeof id !== "string")) {
    res.status(400).json({ error: "Campo 'id' é obrigatório" });
    return;
  }

  const numericId = Number(id);
  if (isNaN(numericId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

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

  try {
    const [updatedContent] = await db
      .update(contentsTable)
      .set({
        title,
        description: typeof description === "string" ? description : null,
        type: contentType,
        price: typeof price === "number" ? Math.round(price * 100) : null,
        teaserUrl: typeof teaserUrl === "string" ? teaserUrl : null,
        privateFolderKey: typeof privateFolderKey === "string" ? privateFolderKey : null,
        updatedAt: new Date(),
      })
      .where(eq(contentsTable.id, numericId))
      .returning();

    if (!updatedContent) {
      res.status(404).json({ error: "Conteúdo não encontrado" });
      return;
    }

    req.log.info({ contentId: updatedContent.id }, "admin: content updated");
    res.json(updatedContent);
  } catch (error: any) {
    req.log.error(error, "Content update error");
    res.status(500).json({ error: "Erro interno ao atualizar conteúdo" });
  }
});

// DELETE /admin/contents — delete content (admin only)
router.delete("/admin/contents", requireAdmin, async (req, res) => {
  const id = req.query.id || req.body?.id;

  if (!id || (typeof id !== "number" && typeof id !== "string")) {
    res.status(400).json({ error: "Campo 'id' é obrigatório" });
    return;
  }

  const numericId = Number(id);
  if (isNaN(numericId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [deletedContent] = await db
      .delete(contentsTable)
      .where(eq(contentsTable.id, numericId))
      .returning();

    if (!deletedContent) {
      res.status(404).json({ error: "Conteúdo não encontrado" });
      return;
    }

    req.log.info({ contentId: deletedContent.id }, "admin: content deleted");
    res.json({ message: "Conteúdo deletado com sucesso", content: deletedContent });
  } catch (error: any) {
    req.log.error(error, "Content deletion error");
    res.status(500).json({ error: "Erro interno ao deletar conteúdo" });
  }
});

// POST /admin/upload — upload file as base64 (admin only)
router.post("/admin/upload", requireAdmin, async (req, res) => {
  const { fileName, fileData } = req.body as {
    fileName?: string;
    fileData?: string; // base64-encoded string
  };

  if (!fileName || !fileData) {
    res.status(400).json({ error: "Nome do arquivo e dados do arquivo são obrigatórios" });
    return;
  }

  try {
    // Decode base64
    const base64Data = fileData.replace(/^data:[a-zA-Z0-9-\/]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Extract file extension or use a generic one
    const ext = path.extname(fileName) || ".bin";
    const uniqueName = `${crypto.randomUUID()}${ext}`;

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    req.log.info({ fileUrl }, "admin: uploaded file saved");
    res.status(200).json({ url: fileUrl });
  } catch (error: any) {
    req.log.error(error, "Upload error");
    res.status(500).json({ error: "Erro interno ao salvar arquivo" });
  }
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

  let streamUrl = null;
  if (content.privateFolderKey) {
    if (content.privateFolderKey.trim().startsWith("[")) {
      try {
        const urls = JSON.parse(content.privateFolderKey) as string[];
        const signedUrls = await Promise.all(
          urls.map(async (url) => {
            if (url.startsWith("http")) {
              return await getSupabaseSignedUrl(url);
            }
            return `${url}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`;
          })
        );
        streamUrl = JSON.stringify(signedUrls);
      } catch (e) {
        if (content.privateFolderKey.startsWith("http")) {
          streamUrl = await getSupabaseSignedUrl(content.privateFolderKey);
        } else {
          streamUrl = `${content.privateFolderKey}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`;
        }
      }
    } else {
      if (content.privateFolderKey.startsWith("http")) {
        streamUrl = await getSupabaseSignedUrl(content.privateFolderKey);
      } else {
        streamUrl = `${content.privateFolderKey}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`;
      }
    }
  }

  req.log.info({ contentId, userId: payload.sub }, "contents: secure stream URL generated");

  res.json({
    contentId,
    streamUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    signature,
  });
});

async function getSupabaseSignedUrl(url: string): Promise<string> {
  const supabaseUrl = "https://tswqkbfetbsayjcavuoc.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3FrYmZldGJzYXlqY2F2dW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTE3MjksImV4cCI6MjA5NDk2NzcyOX0.CqCDzFEg_3Blgf-0nTHSMDnuNwzsKK65LNZsjJ7rnec";
  const bucketName = "Duda-bucket";

  if (url.includes(supabaseUrl) && url.includes(bucketName)) {
    const bucketSearchStr = `/object/public/${bucketName}/`;
    const altBucketSearchStr = `/object/${bucketName}/`;
    
    let filePath = "";
    if (url.includes(bucketSearchStr)) {
      filePath = url.split(bucketSearchStr)[1];
    } else if (url.includes(altBucketSearchStr)) {
      filePath = url.split(altBucketSearchStr)[1];
    }

    if (filePath) {
      filePath = filePath.split('?')[0];
      const signUrl = `${supabaseUrl}/storage/v1/object/sign/${bucketName}/${filePath}`;
      try {
        const response = await fetch(signUrl, {
          method: "POST",
          headers: {
            "apikey": anonKey,
            "Authorization": `Bearer ${anonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        });
        
        if (response.ok) {
          const data: any = await response.json();
          const signedUrl = data.signedURL || data.signedUrl;
          if (signedUrl) {
            if (signedUrl.startsWith("/")) {
              if (signedUrl.startsWith("/storage/v1/")) {
                return `${supabaseUrl}${signedUrl}`;
              }
              return `${supabaseUrl}/storage/v1${signedUrl}`;
            }
            return signedUrl;
          }
        } else {
          console.error(`Supabase sign URL failed: ${response.status} ${await response.text()}`);
        }
      } catch (err) {
        console.error("Error signing Supabase URL:", err);
      }
    }
  }
  return url;
}

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
