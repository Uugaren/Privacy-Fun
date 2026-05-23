import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, contentsTable, userAccessTable } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAuth(req, res);
  if (!payload) return;

  const contentId = Number(req.query.id);

  if (isNaN(contentId)) {
    return res.status(400).json({ error: "ID de conteúdo inválido" });
  }

  const [content] = await db
    .select()
    .from(contentsTable)
    .where(eq(contentsTable.id, contentId))
    .limit(1);

  if (!content) {
    return res.status(404).json({ error: "Conteúdo não encontrado" });
  }

  // Admins always have access
  if (payload.role !== "admin") {
    const access = await db
      .select({ id: userAccessTable.id })
      .from(userAccessTable)
      .where(eq(userAccessTable.email, payload.email))
      .limit(1);

    if (access.length === 0) {
      return res.status(403).json({ error: "Sem acesso a este conteúdo — assine para desbloquear" });
    }
  }

  // Generate a time-limited signed URL token (valid 1 hour)
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${contentId}:${payload.sub}:${expiresAt}`)
    .digest("hex");

  let streamUrl = null;
  if (content.privateFolderKey) {
    if (content.privateFolderKey.startsWith("http")) {
      streamUrl = await getSupabaseSignedUrl(content.privateFolderKey);
    } else {
      streamUrl = `${content.privateFolderKey}?token=${signature}&expires=${expiresAt}&uid=${payload.sub}`;
    }
  }

  console.info(`contents: secure stream URL generated — contentId=${contentId} userId=${payload.sub}`);

  res.json({
    contentId,
    streamUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    signature,
  });
}

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
              return `${supabaseUrl}${signedUrl}`;
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
