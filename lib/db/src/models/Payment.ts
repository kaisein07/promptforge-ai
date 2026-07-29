import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { getNextId } from "./Counter";

const paymentSchema = new Schema(
  {
    id:             { type: Number, unique: true, index: true },
    userId:         { type: Number, required: true, index: true },
    transactionRef: { type: String, required: true },
    amount:         { type: Number, required: true },
    currency:       { type: String, default: "FCFA" },
    status:         { type: String, default: "pending" },
    phoneNumber:    { type: String, default: "" },
    paymentMethod:  { type: String, default: "" },
    notes:          { type: String, default: "" },
    createdAt:      { type: Date, default: () => new Date() },
  },
  { id: false, versionKey: false }
);

paymentSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextId("payments");
  }
  next();
});

export type IPayment = {
  id: number;
  userId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  status: string;
  phoneNumber: string;
  paymentMethod: string;
  notes: string;
  createdAt: Date;
};

export type PaymentDoc = HydratedDocument<IPayment>;

export const PaymentModel =
  (mongoose.models["Payment"] as mongoose.Model<IPayment>) ||
  mongoose.model<IPayment>("Payment", paymentSchema);
