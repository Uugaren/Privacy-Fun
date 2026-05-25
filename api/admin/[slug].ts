import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, usersTable, contentsTable, userAccessTable } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { slug } = req.query;

  if (slug === "stats") {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const [orders, users, contents, accesses] = await Promise.all([
        db.select().from(ordersTable),
        db.select({ id: usersTable.id }).from(usersTable),
        db.select({ id: contentsTable.id }).from(contentsTable),
        db.select({ id: userAccessTable.id }).from(userAccessTable),
      ]);

      const paidOrders = orders.filter((o) => o.status === "paid");
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

      return res.json({
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalUsers: users.length,
        totalContents: contents.length,
        totalAccesses: accesses.length,
      });
    } catch (err: any) {
      console.error("Stats fetch error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (slug === "orders") {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const orders = await db
        .select()
        .from(ordersTable)
        .orderBy(desc(ordersTable.createdAt));

      return res.json(
        orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        }))
      );
    } catch (err: any) {
      console.error("Orders fetch error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (slug === "users") {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    try {
      const users = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .orderBy(desc(usersTable.createdAt));

      return res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
    } catch (err: any) {
      console.error("Users fetch error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (slug === "contents") {
    if (req.method === "GET") {
      try {
        const contents = await db
          .select()
          .from(contentsTable)
          .orderBy(desc(contentsTable.createdAt));

        return res.json(
          contents.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }))
        );
      } catch (err: any) {
        console.error("Admin contents fetch error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    if (req.method === "POST") {
      try {
        const { title, description, type, price, teaserUrl, privateFolderKey } = req.body as {
          title?: unknown;
          description?: unknown;
          type?: unknown;
          price?: unknown;
          teaserUrl?: unknown;
          privateFolderKey?: unknown;
        };

        if (!title || typeof title !== "string") {
          return res.status(400).json({ error: "Campo 'title' é obrigatório" });
        }

        const validTypes = ["album", "video"];
        const contentType = typeof type === "string" ? type : "album";
        if (!validTypes.includes(contentType)) {
          return res.status(400).json({ error: "Tipo inválido — use 'album' ou 'video'" });
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

        console.info(`admin: content created — contentId=${content!.id}`);
        return res.status(201).json(content);
      } catch (err: any) {
        console.error("Content creation error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    if (req.method === "PUT") {
      try {
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
          return res.status(400).json({ error: "Campo 'id' é obrigatório" });
        }

        const numericId = Number(id);
        if (isNaN(numericId)) {
          return res.status(400).json({ error: "ID inválido" });
        }

        if (!title || typeof title !== "string") {
          return res.status(400).json({ error: "Campo 'title' é obrigatório" });
        }

        const validTypes = ["album", "video"];
        const contentType = typeof type === "string" ? type : "album";
        if (!validTypes.includes(contentType)) {
          return res.status(400).json({ error: "Tipo inválido — use 'album' ou 'video'" });
        }

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
          return res.status(404).json({ error: "Conteúdo não encontrado" });
        }

        console.info(`admin: content updated — contentId=${updatedContent.id}`);
        return res.json(updatedContent);
      } catch (err: any) {
        console.error("Content update error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    if (req.method === "DELETE") {
      try {
        const id = req.query.id || req.body?.id;
        if (!id || (typeof id !== "number" && typeof id !== "string")) {
          return res.status(400).json({ error: "Campo 'id' é obrigatório" });
        }

        const numericId = Number(id);
        if (isNaN(numericId)) {
          return res.status(400).json({ error: "ID inválido" });
        }

        const [deletedContent] = await db
          .delete(contentsTable)
          .where(eq(contentsTable.id, numericId))
          .returning();

        if (!deletedContent) {
          return res.status(404).json({ error: "Conteúdo não encontrado" });
        }

        console.info(`admin: content deleted — contentId=${deletedContent.id}`);
        return res.json({ message: "Conteúdo deletado com sucesso", content: deletedContent });
      } catch (err: any) {
        console.error("Content deletion error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(404).json({ error: "Not found" });
}
