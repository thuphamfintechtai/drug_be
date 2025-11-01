import mongoose from "mongoose";

const ReceiptAddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  postalCode: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
});

const ReceivedBySchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  signature: {
    type: String,
    required: false,
  },
  idNumber: {
    type: String,
    required: false,
  },
  position: {
    type: String,
    required: false,
  },
});

const QualityCheckSchema = new mongoose.Schema({
  checkedBy: {
    type: String,
    required: false,
  },
  checkDate: {
    type: Date,
    required: false,
  },
  temperature: {
    type: Number,
    required: false,
  },
  humidity: {
    type: Number,
    required: false,
  },
  condition: {
    type: String,
    enum: ["excellent", "good", "fair", "poor"],
    required: false,
  },
});

const ProofOfPharmacySchema = new mongoose.Schema(
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
    receiptDate: {
      type: Date,
      required: false,
    },
    receivedQuantity: {
      type: Number,
      required: false,
    },
    receiptAddress: {
      type: ReceiptAddressSchema,
      required: false,
    },
    receivedBy: {
      type: ReceivedBySchema,
      required: false,
    },
    qualityCheck: {
      type: QualityCheckSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "received", "verified", "completed", "rejected"],
      default: "pending",
    },
    chainTxHash: {
      type: String,
      required: false,
    },
    receiptTxHash: {
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
    commercialInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommercialInvoice",
      required: false,
    },
    supplyChainCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProofOfPharmacy", ProofOfPharmacySchema);

