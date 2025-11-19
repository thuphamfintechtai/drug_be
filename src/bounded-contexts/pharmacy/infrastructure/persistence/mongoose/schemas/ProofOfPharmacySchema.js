import mongoose from "mongoose";

const ReceiptAddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

const ReceivedBySchema = new mongoose.Schema({
  name: String,
  signature: String,
  idNumber: String,
  position: String,
});

const QualityCheckSchema = new mongoose.Schema({
  checkedBy: String,
  checkDate: Date,
  temperature: Number,
  humidity: Number,
  condition: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
  },
});

export const ProofOfPharmacySchema = new mongoose.Schema(
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
    proofOfDistribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfDistribution",
      required: false,
    },
    nftInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFTInfo",
      required: false,
    },
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugInfo",
      required: false,
    },
    commercialInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommercialInvoice",
      required: false,
    },
    receiptDate: {
      type: Date,
      required: false,
    },
    receivedQuantity: {
      type: Number,
      required: false,
    },
    unit: {
      type: String,
      required: false,
    },
    receivedBy: {
      type: ReceivedBySchema,
      required: false,
    },
    receiptAddress: {
      type: ReceiptAddressSchema,
      required: false,
    },
    qualityCheck: {
      type: QualityCheckSchema,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "received", "confirmed", "rejected"],
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
    supplyChainCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
ProofOfPharmacySchema.index({ fromDistributor: 1 });
ProofOfPharmacySchema.index({ toPharmacy: 1 });
ProofOfPharmacySchema.index({ commercialInvoice: 1 });
ProofOfPharmacySchema.index({ drug: 1 });
ProofOfPharmacySchema.index({ status: 1 });
ProofOfPharmacySchema.index({ batchNumber: 1 });
ProofOfPharmacySchema.index({ createdAt: -1 });

export const ProofOfPharmacyModel = mongoose.model("ProofOfPharmacy", ProofOfPharmacySchema);

