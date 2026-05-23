import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../lib/auth.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = requireAdmin(req, res);
  if (!payload) return;

  const { fileName, fileData } = req.body as {
    fileName?: string;
    fileData?: string; // base64-encoded string
  };

  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Nome do arquivo e dados do arquivo são obrigatórios" });
  }

  try {
    // Decode base64 string
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

    console.info(`admin: uploaded file saved — path=${fileUrl}`);
    res.status(200).json({ url: fileUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Erro interno ao salvar arquivo" });
  }
}
