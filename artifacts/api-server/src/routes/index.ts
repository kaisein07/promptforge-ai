import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import promptsRouter from "./prompts";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import publicConfigRouter from "./public-config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicConfigRouter);
router.use(authRouter);
router.use(promptsRouter);
router.use(adminRouter);
router.use(paymentsRouter);

export default router;
