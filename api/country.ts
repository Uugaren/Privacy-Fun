import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support testing country via query parameter (e.g. /api/country?country=US)
  const country = (req.query.country as string) || (req.headers["x-vercel-ip-country"] as string | undefined) || "BR";
  res.json({ country });
}
