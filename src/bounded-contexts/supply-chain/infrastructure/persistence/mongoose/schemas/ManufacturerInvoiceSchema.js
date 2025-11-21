import mongoose from "mongoose";

const PaymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["cash", "bank_transfer", "credit_card", "other"],
    required: false,
  },
  dueDate: {
    type: Date,
    required: false,
  },
  paidDate: {
    type: Date,
    required: false,
  },
  paidAmount: {
    type: Number,
    required: false,
  },
});

const DeliveryAddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

const DeliveryInfoSchema = new mongoose.Schema({
  deliveredDate: Date,
  deliveredBy: String,
  deliveryAddress: DeliveryAddressSchema,
  trackingNumber: String,
  carrier: String,
});

export const ManufacturerInvoiceSchema = new mongoose.Schema(
  {
    fromManufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toDistributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proofOfProduction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfProduction",
      required: false,
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
    transactionId: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    deliveryInfo: {
      type: DeliveryInfoSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "issued", "sent", "paid", "cancelled"],
      default: "pending",
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
    batchNumber: {
      type: String,
      required: false,
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
// Note: invoiceNumber already has index from unique: true
ManufacturerInvoiceSchema.index({ fromManufacturer: 1 });
ManufacturerInvoiceSchema.index({ toDistributor: 1 });
ManufacturerInvoiceSchema.index({ status: 1 });
ManufacturerInvoiceSchema.index({ batchNumber: 1 });
ManufacturerInvoiceSchema.index({ createdAt: -1 });

export const ManufacturerInvoiceModel = mongoose.model("ManufacturerInvoice", ManufacturerInvoiceSchema);

