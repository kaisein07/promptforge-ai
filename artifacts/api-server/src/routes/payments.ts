import { Router, type IRouter } from "express";
import { PaymentModel, UserModel } from "@workspace/db";
import type { IPayment } from "@workspace/db";
import { CreatePaymentBody, GetPaymentsResponse, CreatePaymentResponse } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/authenticate";

const router: IRouter = Router();

function paramAsString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

async function toPaymentJson(p: IPayment & { id: number }) {
  const user = await UserModel.findOne({ id: p.userId }).lean();
  return {
    id: p.id,
    userId: p.userId,
    userName: user?.name ?? "",
    userEmail: user?.email ?? "",
    transactionRef: p.transactionRef,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    phoneNumber: p.phoneNumber ?? "",
    paymentMethod: p.paymentMethod ?? "",
    notes: p.notes ?? "",
    createdAt: p.createdAt,
  };
}

// GET /api/payments (admin only)
router.get("/payments", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const payments = await PaymentModel.find().sort({ createdAt: -1 });
  const json = await Promise.all(payments.map(toPaymentJson));
  res.json(json);
});

// POST /api/payments — user submits a payment request (stays pending until admin approves)
router.post("/payments", authenticate, async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { transactionRef, amount, currency, phoneNumber, paymentMethod, notes } = parsed.data;
  const userId = req.user!.userId;

  const payment = new PaymentModel({
    userId,
    transactionRef,
    amount,
    currency,
    phoneNumber: phoneNumber ?? "",
    paymentMethod: paymentMethod ?? "",
    notes: notes ?? "",
    status: "pending",
  });
  await payment.save();

  res.status(201).json(CreatePaymentResponse.parse(await toPaymentJson(payment)));
});

// PUT /api/payments/:id/approve (admin only) — approve and upgrade user to premium
router.put("/payments/:id/approve", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(paramAsString(req.params["id"]), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const payment = await PaymentModel.findOne({ id });
  if (!payment) { res.status(404).json({ error: "Paiement introuvable" }); return; }

  payment.status = "approved";
  await payment.save();

  await UserModel.findOneAndUpdate({ id: payment.userId }, { isPremium: true });

  res.json(await toPaymentJson(payment));
});

// PUT /api/payments/:id/reject (admin only)
router.put("/payments/:id/reject", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(paramAsString(req.params["id"]), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const payment = await PaymentModel.findOne({ id });
  if (!payment) { res.status(404).json({ error: "Paiement introuvable" }); return; }

  payment.status = "rejected";
  await payment.save();

  res.json(await toPaymentJson(payment));
});

export default router;