import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import authRouter from "./auth";
import webhookRouter from "./webhook";
import contentsRouter from "./contents";
import countryRouter from "./country";
import stripeWebhookRouter from "./stripe-webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkoutRouter);
router.use(authRouter);
router.use(webhookRouter);
router.use(contentsRouter);
router.use(countryRouter);
router.use(stripeWebhookRouter);

export default router;
