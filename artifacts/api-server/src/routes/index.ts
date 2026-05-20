import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import authRouter from "./auth";
import webhookRouter from "./webhook";
import contentsRouter from "./contents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkoutRouter);
router.use(authRouter);
router.use(webhookRouter);
router.use(contentsRouter);

export default router;
