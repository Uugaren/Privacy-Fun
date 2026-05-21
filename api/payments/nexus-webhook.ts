import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db, ordersTable, userAccessTable } from "../lib/db.js";

const SUCCESS_STATUSES = new Set(["pago", "approved", "paid", "completed"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.NEXUS_WEBHOOK_SECRET;

  const tokenFromQuery = req.query.token as string | undefined;
  const tokenFromHeader =
    (req.headers["x-nexus-token"] as string | undefined) ??
    (req.headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, "");

  const receivedToken = tokenFromQuery ?? tokenFromHeader;

  if (!secret || receivedToken !== secret) {
    console.warn("nexus-webhook: unauthorized request");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.info("nexus-webhook: payload received", JSON.stringify(req.body));

  const payload = req.body as Record<string, unknown>;
  const externalId = String(payload.id ?? "");
  const status = String(payload.status ?? "").toLowerCase();
  const email = String(payload.email ?? "");
  const amount = typeof payload.amount === "number" ? payload.amount : undefined;

  if (!externalId) {
    console.warn("nexus-webhook: missing id field in payload");
    return res.json({ received: true, processed: false });
  }

  let processed = false;

  try {
    if (SUCCESS_STATUSES.has(status) && email) {
      const existing = await db
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.externalId, externalId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(ordersTable)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(ordersTable.externalId, externalId));

        const orderId = existing[0]!.id;

        await db.insert(userAccessTable).values({
          orderId,
          email,
          externalOrderId: externalId,
        });

        console.info(`nexus-webhook: order marked as paid and access granted — externalId=${externalId} email=${email}`);
      } else {
        const inserted = await db
          .insert(ordersTable)
          .values({
            externalId,
            email,
            status: "paid",
            amount: amount ?? null,
            rawPayload: JSON.stringify(payload),
          })
          .returning({ id: ordersTable.id });

        const orderId = inserted[0]!.id;

        await db.insert(userAccessTable).values({
          orderId,
          email,
          externalOrderId: externalId,
        });

        console.info(`nexus-webhook: new order created as paid — externalId=${externalId} email=${email} orderId=${orderId}`);
      }

      processed = true;
    } else {
      await db
        .insert(ordersTable)
        .values({
          externalId,
          email: email || "unknown",
          status: status || "pending",
          amount: amount ?? null,
          rawPayload: JSON.stringify(payload),
        })
        .onConflictDoUpdate({
          target: ordersTable.externalId,
          set: { status: status || "pending", updatedAt: new Date() },
        });

      console.info(`nexus-webhook: non-success status recorded — externalId=${externalId} status=${status}`);
    }
  } catch (err) {
    console.error(`nexus-webhook: database error — externalId=${externalId}`, err);
    return res.status(500).json({ error: "Internal server error" });
  }

  res.json({ received: true, processed });
}
