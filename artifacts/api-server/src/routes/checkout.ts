import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { db, ordersTable } from "@workspace/db";

const router: IRouter = Router();

interface NexusPixResponse {
  success: boolean;
  transaction: {
    id: string;
    txid: string;
    external_id: string | null;
    amount: number;
    fee: number;
    net_amount: number;
    status: string;
    pix_copia_cola: string;
    qr_code_base64: string;
    expires_at: string;
  };
}

router.post("/checkout", async (req, res) => {
  const apiKey = process.env["NEXUS_WEBHOOK_SECRET"];

  if (!apiKey) {
    req.log.error("checkout: NEXUS_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Server misconfiguration: payment key not set" });
    return;
  }

  const { email, amount } = req.body as { email?: unknown; amount?: unknown };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Invalid or missing email" });
    return;
  }

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
    res.status(400).json({ error: "Invalid amount — minimum is R$ 1.00" });
    return;
  }

  const externalId = crypto.randomUUID();
  const webhookUrl = `https://privacy-fun--arthur007rocha.replit.app/api/payments/nexus-webhook?token=${apiKey}`;

  req.log.info({ email, amount: parsedAmount, externalId }, "checkout: initiating Nexus Pag Pix creation");

  let nexusData: NexusPixResponse;

  try {
    const nexusRes = await fetch("https://nexuspag.com/api/pix/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        amount: parsedAmount,
        description: `Assinatura Privacy - ${email}`,
        external_id: externalId,
        webhook_url: webhookUrl,
        expiration: 1800,
      }),
    });

    const raw = await nexusRes.json() as NexusPixResponse;

    if (!nexusRes.ok || !raw.success) {
      req.log.error({ status: nexusRes.status, body: raw }, "checkout: Nexus Pag returned error");
      res.status(502).json({ error: "Payment gateway error — could not generate Pix" });
      return;
    }

    nexusData = raw;
  } catch (err) {
    req.log.error({ err }, "checkout: network error calling Nexus Pag");
    res.status(502).json({ error: "Failed to reach payment gateway" });
    return;
  }

  const { transaction } = nexusData;

  try {
    await db.insert(ordersTable).values({
      externalId,
      email,
      status: "pending",
      amount: Math.round(parsedAmount * 100),
      rawPayload: JSON.stringify(transaction),
    });

    req.log.info({ externalId, nexusId: transaction.id }, "checkout: order inserted as pending");
  } catch (err) {
    req.log.error({ err, externalId }, "checkout: failed to insert order in database");
  }

  res.json({
    order_id: externalId,
    status: transaction.status,
    pix_copy_paste: transaction.pix_copia_cola,
    pix_qr_code: transaction.qr_code_base64,
    expires_at: transaction.expires_at,
    amount: transaction.amount,
  });
});

export default router;
