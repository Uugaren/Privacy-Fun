import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db, ordersTable, usersTable } from "@workspace/db";

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
  const { email, password, amount, paymentMethod } = req.body as {
    email?: unknown;
    password?: unknown;
    amount?: unknown;
    paymentMethod?: "pix" | "stripe";
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Email inválido ou ausente" });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    return;
  }

  const parsedAmount = Number(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 1) {
    res.status(400).json({ error: "Valor inválido" });
    return;
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
    req.log.info({ email: normalizedEmail }, "checkout: new user created");
  } else {
    req.log.info({ email: normalizedEmail }, "checkout: existing user, skipping creation");
  }

  if (paymentMethod === "stripe") {
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      req.log.error("checkout: STRIPE_SECRET_KEY is not set");
      res.status(500).json({ error: "Server misconfiguration: Stripe key not set" });
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

    const appUrl = process.env["VERCEL_PROJECT_PRODUCTION_URL"]
      ? `https://${process.env["VERCEL_PROJECT_PRODUCTION_URL"]}`
      : "http://localhost:5173";

    try {
      req.log.info({ email: normalizedEmail, amount: parsedAmount }, "checkout: initiating Stripe session");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Sophie Rain - Premium Access",
                description: "Acesso Exclusivo à Área de Membros",
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

      req.log.info({ sessionId: session.id, amount: parsedAmount }, "checkout: Stripe session created");

      res.json({
        paymentMethod: "stripe",
        checkoutUrl: session.url,
      });
      return;
    } catch (err: any) {
      req.log.error({ err }, "checkout: failed to create Stripe session");
      res.status(502).json({ error: "Erro ao iniciar pagamento com Stripe" });
      return;
    }
  }

  const apiKey = process.env["NEXUS_WEBHOOK_SECRET"];

  if (!apiKey) {
    req.log.error("checkout: NEXUS_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Server misconfiguration: payment key not set" });
    return;
  }

  const externalId = crypto.randomUUID();
  const webhookUrl = `https://privacy-fun--arthur007rocha.replit.app/api/payments/nexus-webhook?token=${apiKey}`;

  req.log.info({ email: normalizedEmail, amount: parsedAmount, externalId }, "checkout: initiating Nexus Pag Pix");

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
      req.log.error({ status: nexusRes.status, body: raw }, "checkout: Nexus Pag returned error");
      res.status(502).json({ error: "Erro no gateway de pagamento — não foi possível gerar o Pix" });
      return;
    }

    nexusData = raw;
  } catch (err) {
    req.log.error({ err }, "checkout: network error calling Nexus Pag");
    res.status(502).json({ error: "Falha ao conectar com o gateway de pagamento" });
    return;
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

    req.log.info({ externalId, nexusId: transaction.id }, "checkout: order inserted as pending");
  } catch (err) {
    req.log.error({ err, externalId }, "checkout: failed to insert order");
  }

  // Normalize qr_code_base64: strip any data URI prefix so the client always
  // receives a raw base64 string it can prefix with data:image/png;base64,
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
});

export default router;
