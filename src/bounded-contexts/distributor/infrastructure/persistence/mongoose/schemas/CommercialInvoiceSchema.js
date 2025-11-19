import mongoose from "mongoose";
import { ManufacturerInvoiceSchema } from "../../../../../supply-chain/infrastructure/persistence/mongoose/schemas/ManufacturerInvoiceSchema.js";

// Reuse PaymentInfoSchema and DeliveryInfoSchema from ManufacturerInvoice if needed
const PaymentInfoSchema = ManufacturerInvoiceSchema.obj?.paymentInfo || new mongoose.Schema({
  method: { type: String, enum: ["cash", "bank_transfer", "credit_card", "other"] },
  dueDate: { type: Date },
  paidDate: { type: Date },
  paidAmount: { type: Number },
}, { _id: false });

const DeliveryInfoSchema = ManufacturerInvoiceSchema.obj?.deliveryInfo || new mongoose.Schema({
  deliveredDate: Date,
  deliveredBy: String,
  deliveryAddress: mongoose.Schema.Types.Mixed,
  trackingNumber: String,
  carrier: String,
}, { _id: false });

export const CommercialInvoiceSchema = new mongoose.Schema(
  {
    fromDistributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toPharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proofOfPharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfPharmacy",
    },
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugInfo",
    },
    nftInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFTInfo",
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
    },
    quantity: {
      type: Number,
    },
    unitPrice: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    vatRate: {
      type: Number,
    },
    vatAmount: {
      type: Number,
    },
    finalAmount: {
      type: Number,
    },
    paymentInfo: {
      type: PaymentInfoSchema,
    },
    deliveryInfo: {
      type: DeliveryInfoSchema,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "sent", "paid", "cancelled"],
      default: "draft",
    },
    chainTxHash: {
      type: String,
    },
    verificationCode: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    supplyChainCompleted: {
      type: Boolean,
      default: false,
    },
    batchNumber: {
      type: String,
    },
    tokenIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for performance
// Note: invoiceNumber already has index from unique: true
CommercialInvoiceSchema.index({ fromDistributor: 1 });
CommercialInvoiceSchema.index({ toPharmacy: 1 });
CommercialInvoiceSchema.index({ status: 1 });
CommercialInvoiceSchema.index({ drug: 1 });
CommercialInvoiceSchema.index({ batchNumber: 1 });
CommercialInvoiceSchema.index({ createdAt: -1 });

export const CommercialInvoiceModel = mongoose.model("CommercialInvoice", CommercialInvoiceSchema);

