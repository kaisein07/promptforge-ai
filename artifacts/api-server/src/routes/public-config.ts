import { Router, type IRouter } from "express";
import { ConfigModel } from "@workspace/db";

const router: IRouter = Router();

// GET /api/config — public route
router.get("/config", async (_req, res): Promise<void> => {
  const configs = await ConfigModel.find();
  const cfg: Record<string, string> = {};
  for (const row of configs) {
    cfg[row.key] = row.value;
  }
  res.json({
    premium_price: cfg["premium_price"] ?? "10000 FCFA",
    free_limit: cfg["free_limit"] ?? "5",
  });
});

export default router;
