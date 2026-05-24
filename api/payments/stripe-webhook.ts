import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, ordersTable, userAccessTable } from "../lib/db.js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;
  const eventType = payload?.type;

  console.info(`stripe-webhook: received event of type ${eventType}`);

  if (eventType === "checkout.session.completed") {
    const sessionObj = payload.data?.object;
    const sessionId = sessionObj?.id;

    if (!sessionId) {
      console.warn("stripe-webhook: missing session ID in event data");
      return res.status(400).json({ error: "Missing session ID" });
    }

    try {
      // Securely retrieve the session from Stripe to verify it is real and paid
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        const email = session.customer_email || session.customer_details?.email;
        if (!email) {
          console.warn(`stripe-webhook: paid session has no customer email — sessionId=${sessionId}`);
          return res.json({ received: true, processed: false });
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
          console.info(`stripe-webhook: existing order updated to paid — sessionId=${sessionId}`);
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
          console.info(`stripe-webhook: new order created as paid — sessionId=${sessionId}`);
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
          console.info(`stripe-webhook: access granted — email=${normalizedEmail} orderId=${orderId}`);
        } else {
          console.info(`stripe-webhook: access already granted for order — sessionId=${sessionId}`);
        }
      } else {
        console.info(`stripe-webhook: session is not fully paid — status=${session.payment_status}`);
      }
    } catch (err) {
      console.error(`stripe-webhook: error processing webhook event — sessionId=${sessionId}`, err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.json({ received: true });
}
