import { Router, type IRouter } from "express";
import { PaymentModel, UserModel, ConfigModel } from "@workspace/db";
import type { IPayment } from "@workspace/db";
import { CreatePaymentBody, GetPaymentsResponse, CreatePaymentResponse } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/authenticate";
import { Transaction } from "../fedapay";

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/pay — lance le paiement FedaPay et retourne l'URL checkout
// ─────────────────────────────────────────────────────────────────────────────
router.post("/payments/pay", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const user = await UserModel.findOne({ id: userId });
  if (!user) {
    res.status(401).json({ error: "Utilisateur introuvable" });
    return;
  }

  if (user.isPremium) {
    res.status(400).json({ error: "Vous êtes déjà Premium" });
    return;
  }

  // Récupère le prix premium depuis la config (défaut 10000 FCFA)
  const cfg = await ConfigModel.findOne({ key: "premium_price" });
  const amount = parseInt(cfg?.value ?? "10000", 10);

  const backendUrl = process.env["BACKEND_URL"] || "http://localhost:5000";
  const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:5173";

  try {
    // Crée la transaction FedaPay
    const transaction = await (Transaction as any).create({
      description: "Abonnement Premium PromptForge AI",
      amount,
      currency: { iso: "XOF" },
      callback_url: `${backendUrl}/api/payments/callback`,
      return_url: `${frontendUrl}/premium?status=success`,
      cancel_url: `${frontendUrl}/premium?status=cancel`,
      customer: {
        firstname: user.name.split(" ")[0] ?? user.name,
        lastname: user.name.split(" ").slice(1).join(" ") || undefined,
        email: user.email,
      },
    });

    // Stocke la transaction dans la DB (en attente)
    const payment = new PaymentModel({
      userId,
      transactionRef: String(transaction.id),
      amount,
      currency: "XOF",
      status: "pending",
      paymentMethod: "fedapay",
    });
    await payment.save();

    // Génère le token de paiement hosted checkout
    const token = await (transaction as any).generateToken();

    res.json({ url: token.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur FedaPay";
    res.status(500).json({ error: `Erreur lors de la création du paiement : ${message}` });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/callback — webhook FedaPay (appelé par FedaPay après paiement)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/payments/callback", async (req, res): Promise<void> => {
  const id = paramAsString(req.query["id"] as string);
  if (!id) {
    res.status(400).send("ID manquant");
    return;
  }

  try {
    const transaction = await (Transaction as any).retrieve(id);

    if (transaction.status === "approved") {
      const payment = await PaymentModel.findOneAndUpdate(
        { transactionRef: String(transaction.id) },
        { status: "approved" },
        { new: true }
      );
      if (payment) {
        await UserModel.findOneAndUpdate({ id: payment.userId }, { isPremium: true });
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Erreur callback");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments — liste des paiements (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/payments", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const payments = await PaymentModel.find().sort({ createdAt: -1 });
  const json = await Promise.all(payments.map(toPaymentJson));
  res.json(json);
});

// POST /api/payments — soumission manuelle (ancienne méthode, conservée)
router.post("/payments", authenticate, async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { transactionRef, amount, currency, phoneNumber, paymentMethod, notes } = parsed.data;
  const userId = req.user!.userId;

  const payment = new PaymentModel({
    userId, transactionRef, amount, currency,
    phoneNumber: phoneNumber ?? "", paymentMethod: paymentMethod ?? "",
    notes: notes ?? "", status: "pending",
  });
  await payment.save();
  res.status(201).json(CreatePaymentResponse.parse(await toPaymentJson(payment)));
});

// PUT /api/payments/:id/approve (admin)
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

// PUT /api/payments/:id/reject (admin)
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