import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/country", async (req, res) => {
  // Support testing country via query parameter (e.g. /api/country?country=US)
  const country = (req.query.country as string) || (req.headers["x-vercel-ip-country"] as string | undefined) || "BR";
  res.json({ country });
});

export default router;
