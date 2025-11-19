import mongoose from "mongoose";
import { ManufacturerInvoiceSchema } from "../../../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";

// Reuse PaymentInfoSchema and DeliveryInfoSchema from ManufacturerInvoice if needed
const PaymentInfoSchema = ManufacturerInvoiceSchema.obj.paymentInfo || new mongoose.Schema({
  method: { type: String, enum: ["cash", "bank_transfer", "credit_card", "other"], required: false },
  dueDate: { type: Date, required: false },
  paidDate: { type: Date, required: false },
  paidAmount: { type: Number, required: false },
});

const DeliveryInfoSchema = ManufacturerInvoiceSchema.obj.deliveryInfo || new mongoose.Schema({
  deliveredDate: Date,
  deliveredBy: String,
  deliveryAddress: mongoose.Schema.Types.Mixed,
  trackingNumber: String,
  carrier: String,
});

export const CommercialInvoiceSchema = new mongoose.Schema(
  {
    fromDistributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toPharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    proofOfPharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfPharmacy",
      required: false,
    },
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugInfo",
      required: false,
      index: true,
    },
    nftInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFTInfo",
      required: false,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
    unitPrice: {
      type: Number,
      required: false,
    },
    totalAmount: {
      type: Number,
      required: false,
    },
    vatRate: {
      type: Number,
      required: false,
    },
    vatAmount: {
      type: Number,
      required: false,
    },
    finalAmount: {
      type: Number,
      required: false,
    },
    paymentInfo: {
      type: PaymentInfoSchema,
      required: false,
    },
    deliveryInfo: {
      type: DeliveryInfoSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "sent", "paid", "cancelled"],
      default: "draft",
    },
    chainTxHash: {
      type: String,
      required: false,
    },
    verificationCode: {
      type: String,
      required: false,
    },
    verifiedAt: {
      type: Date,
      required: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    supplyChainCompleted: {
      type: Boolean,
      default: false,
    },
    batchNumber: {
      type: String,
      required: false,
      index: true,
    },
    tokenIds: {
      type: [String],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for performance
CommercialInvoiceSchema.index({ fromDistributor: 1 });
CommercialInvoiceSchema.index({ toPharmacy: 1 });
CommercialInvoiceSchema.index({ invoiceNumber: 1 });
CommercialInvoiceSchema.index({ status: 1 });
CommercialInvoiceSchema.index({ drug: 1 });
CommercialInvoiceSchema.index({ createdAt: -1 });

export const CommercialInvoiceModel = mongoose.model("CommercialInvoice", CommercialInvoiceSchema);

