import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, userAccessTable } from "@workspace/db";

const router: IRouter = Router();

const SUCCESS_STATUSES = new Set(["pago", "approved", "paid", "completed"]);

router.post("/payments/nexus-webhook", async (req, res) => {
  const secret = process.env["NEXUS_WEBHOOK_SECRET"];

  const tokenFromQuery = req.query["token"] as string | undefined;
  const tokenFromHeader =
    (req.headers["x-nexus-token"] as string | undefined) ??
    (req.headers["authorization"] as string | undefined)?.replace(/^Bearer\s+/i, "");

  const receivedToken = tokenFromQuery ?? tokenFromHeader;

  if (!secret || receivedToken !== secret) {
    req.log.warn({ receivedToken: receivedToken ? "[redacted]" : undefined }, "nexus-webhook: unauthorized request");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.log.info({ body: req.body }, "nexus-webhook: payload received");

  const payload = req.body as Record<string, unknown>;
  const externalId = String(payload["id"] ?? "");
  const status = String(payload["status"] ?? "").toLowerCase();
  const email = String(payload["email"] ?? "");
  const amount = typeof payload["amount"] === "number" ? payload["amount"] : undefined;

  if (!externalId) {
    req.log.warn({ body: payload }, "nexus-webhook: missing id field in payload");
    res.json({ received: true, processed: false });
    return;
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

        req.log.info({ externalId, email }, "nexus-webhook: order marked as paid and access granted");
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

        req.log.info({ externalId, email, orderId }, "nexus-webhook: new order created as paid and access granted");
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

      req.log.info({ externalId, status }, "nexus-webhook: non-success status recorded");
    }
  } catch (err) {
    req.log.error({ err, externalId }, "nexus-webhook: database error processing payload");
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.json({ received: true, processed });
});

export default router;
