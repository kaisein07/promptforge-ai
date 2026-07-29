import { Router, type IRouter } from "express";
import { UserModel, PromptModel, PaymentModel, ConfigModel } from "@workspace/db";
import type { IUser } from "@workspace/db";
import {
  UpdateAdminUserParams, UpdateAdminUserBody, UpdateAdminConfigBody,
  GetAdminUsersResponse, UpdateAdminUserResponse, GetAdminStatsResponse,
  GetAdminConfigResponse, UpdateAdminConfigResponse,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/authenticate";

const router: IRouter = Router();

function toUserJson(u: IUser & { id: number }) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    isPremium: u.isPremium, promptsUsed: u.promptsUsed, createdAt: u.createdAt,
  };
}

// GET /api/admin/users
router.get("/admin/users", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const users = await UserModel.find().sort({ createdAt: 1 });
  res.json(GetAdminUsersResponse.parse(users.map(toUserJson)));
});

// PATCH /api/admin/users/:id
router.patch("/admin/users/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminUserParams.safeParse(req.params);
  const body = UpdateAdminUserBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  const updates: Partial<IUser> = {};
  if (body.data.isPremium !== undefined) updates.isPremium = body.data.isPremium;
  if (body.data.role !== undefined) updates.role = body.data.role;

  const updated = await UserModel.findOneAndUpdate(
    { id: params.data.id },
    updates,
    { new: true }
  );
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(UpdateAdminUserResponse.parse(toUserJson(updated)));
});

// GET /api/admin/stats
router.get("/admin/stats", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsers, premiumUsers, totalPrompts] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isPremium: true }),
    PromptModel.countDocuments(),
  ]);

  const conversionRate = totalUsers > 0
    ? Math.round((premiumUsers / totalUsers) * 10000) / 100
    : 0;

  // Revenue: sum of completed payments
  const revenueAgg = await PaymentModel.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const revenue: number = revenueAgg[0]?.total ?? 0;

  // Category counts by niche
  const categoryRows = await PromptModel.aggregate([
    { $group: { _id: "$niche", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json(GetAdminStatsResponse.parse({
    totalUsers, premiumUsers, totalPrompts, conversionRate, revenue,
    categoryCounts: categoryRows.map((r: { _id: string; count: number }) => ({
      category: r._id, count: r.count,
    })),
  }));
});

// GET /api/admin/config
router.get("/admin/config", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const cfg = await ConfigModel.find().sort({ key: 1 });
  res.json(GetAdminConfigResponse.parse(cfg.map(c => ({ key: c.key, value: c.value }))));
});

// PUT /api/admin/config
router.put("/admin/config", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  for (const entry of parsed.data.entries) {
    await ConfigModel.findOneAndUpdate(
      { key: entry.key },
      { value: entry.value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }
  const cfg = await ConfigModel.find().sort({ key: 1 });
  res.json(UpdateAdminConfigResponse.parse(cfg.map(c => ({ key: c.key, value: c.value }))));
});

export default router;
