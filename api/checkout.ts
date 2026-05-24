import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, ordersTable, usersTable } from "./lib/db.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, amount, paymentMethod } = req.body as {
    email?: unknown;
    password?: unknown;
    amount?: unknown;
    paymentMethod?: "pix" | "stripe";
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido ou ausente" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
  }

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  const normalizedEmail = email.toLowerCase();

  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(usersTable).values({
      email: normalizedEmail,
      passwordHash,
      role: "customer",
    });
    console.info(`checkout: new user created — ${normalizedEmail}`);
  }

  if (paymentMethod === "stripe") {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("checkout: STRIPE_SECRET_KEY is not set");
      return res.status(500).json({ error: "Server misconfiguration: Stripe key not set" });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

    const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000";

    try {
      console.info(`checkout: initiating Stripe session — email=${normalizedEmail} amount=${parsedAmount}`);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Duda Wolfram - Premium Access",
                description: "Exclusive Access to Members Area",
              },
              unit_amount: Math.round(parsedAmount * 100), // convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: normalizedEmail,
        success_url: `${appUrl}/login?status=paid&email=${encodeURIComponent(normalizedEmail)}`,
        cancel_url: `${appUrl}/`,
      });

      // Insert pending order in db
      await db.insert(ordersTable).values({
        externalId: session.id, // Store stripe session ID as externalId
        email: normalizedEmail,
        status: "pending",
        amount: Math.round(parsedAmount * 100),
        rawPayload: JSON.stringify(session),
      });

      console.info(`checkout: Stripe session created — id=${session.id} amount=${parsedAmount}`);

      return res.json({
        paymentMethod: "stripe",
        checkoutUrl: session.url,
      });
    } catch (err: any) {
      console.error("checkout: failed to create Stripe session", err);
      return res.status(502).json({ error: "Erro ao iniciar pagamento com Stripe" });
    }
  }

  const apiKey = process.env.NEXUS_WEBHOOK_SECRET;

  if (!apiKey) {
    console.error("checkout: NEXUS_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Server misconfiguration: payment key not set" });
  }

  const externalId = crypto.randomUUID();
  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
  const webhookUrl = `${appUrl}/api/payments/nexus-webhook?token=${apiKey}`;

  console.info(`checkout: initiating Nexus Pag Pix — email=${normalizedEmail} amount=${parsedAmount} externalId=${externalId}`);

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
        description: `Assinatura Privacy - ${normalizedEmail}`,
        external_id: externalId,
        webhook_url: webhookUrl,
        expiration: 1800,
      }),
    });

    const raw = (await nexusRes.json()) as NexusPixResponse;

    if (!nexusRes.ok || !raw.success) {
      console.error(`checkout: Nexus Pag returned error — status=${nexusRes.status}`, raw);
      return res.status(502).json({ error: "Erro no gateway de pagamento — não foi possível gerar o Pix" });
    }

    nexusData = raw;
  } catch (err) {
    console.error("checkout: network error calling Nexus Pag", err);
    return res.status(502).json({ error: "Falha ao conectar com o gateway de pagamento" });
  }

  const { transaction } = nexusData;

  try {
    await db.insert(ordersTable).values({
      externalId,
      email: normalizedEmail,
      status: "pending",
      amount: Math.round(parsedAmount * 100),
      rawPayload: JSON.stringify(transaction),
    });
    console.info(`checkout: order inserted as pending — externalId=${externalId} nexusId=${transaction.id}`);
  } catch (err) {
    console.error(`checkout: failed to insert order — externalId=${externalId}`, err);
  }

  const rawQr = transaction.qr_code_base64 ?? "";
  const pureBase64 = rawQr.replace(/^data:[^;]+;base64,/, "");

  res.json({
    order_id: externalId,
    status: transaction.status,
    pix_copy_paste: transaction.pix_copia_cola,
    pix_qr_code: pureBase64,
    expires_at: transaction.expires_at,
    amount: transaction.amount,
  });
}
