import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, ordersTable, userAccessTable } from "@workspace/db";

const router: IRouter = Router();

const stripeSecretKey = process.env["STRIPE_SECRET_KEY"] || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
});

router.post("/payments/stripe-webhook", async (req, res) => {
  const payload = req.body;
  const eventType = payload?.type;

  req.log.info({ eventType }, "stripe-webhook: received event");

  if (eventType === "checkout.session.completed") {
    const sessionObj = payload.data?.object;
    const sessionId = sessionObj?.id;

    if (!sessionId) {
      req.log.warn("stripe-webhook: missing session ID in event data");
      res.status(400).json({ error: "Missing session ID" });
      return;
    }

    try {
      // Fetch session from Stripe directly to ensure validity
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        const email = session.customer_email || session.customer_details?.email;
        if (!email) {
          req.log.warn({ sessionId }, "stripe-webhook: paid session has no customer email");
          res.json({ received: true, processed: false });
          return;
        }

        const normalizedEmail = email.toLowerCase();

        // Check if order already exists in database
        const [existingOrder] = await db
          .select({ id: ordersTable.id })
          .from(ordersTable)
          .where(eq(ordersTable.externalId, sessionId))
          .limit(1);

        let orderId: number;

        if (existingOrder) {
          await db
            .update(ordersTable)
            .set({ status: "paid", updatedAt: new Date() })
            .where(eq(ordersTable.externalId, sessionId));
          orderId = existingOrder.id;
          req.log.info({ sessionId }, "stripe-webhook: existing order updated to paid");
        } else {
          // If the order wasn't created yet for some reason, create it now
          const inserted = await db
            .insert(ordersTable)
            .values({
              externalId: sessionId,
              email: normalizedEmail,
              status: "paid",
              amount: session.amount_total ?? null,
              rawPayload: JSON.stringify(session),
            })
            .returning({ id: ordersTable.id });
          orderId = inserted[0]!.id;
          req.log.info({ sessionId }, "stripe-webhook: new order created as paid");
        }

        // Grant access
        const [existingAccess] = await db
          .select()
          .from(userAccessTable)
          .where(eq(userAccessTable.externalOrderId, sessionId))
          .limit(1);

        if (!existingAccess) {
          await db.insert(userAccessTable).values({
            orderId,
            email: normalizedEmail,
            externalOrderId: sessionId,
          });
          req.log.info({ email: normalizedEmail, orderId }, "stripe-webhook: access granted");
        } else {
          req.log.info({ sessionId }, "stripe-webhook: access already granted for order");
        }
      } else {
        req.log.info({ status: session.payment_status }, "stripe-webhook: session is not fully paid");
      }
    } catch (err) {
      req.log.error({ err, sessionId }, "stripe-webhook: error processing webhook event");
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  res.json({ received: true });
});

export default router;
