import mongoose from "mongoose";

const CompanyInfoSchema = new mongoose.Schema({
  name: { type: String, required: false },
  licenseNo: { type: String, required: false },
  taxCode: { type: String, required: false },
  address: { type: String, required: false },
  country: { type: String, required: false },
  contactEmail: { type: String, required: false },
  contactPhone: { type: String, required: false },
});

export const RegistrationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["pharma_company", "distributor", "pharmacy"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved_pending_blockchain",
        "approved",
        "blockchain_failed",
        "rejected",
      ],
      default: "pending",
    },
    companyInfo: {
      type: CompanyInfoSchema,
      required: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    contractAddress: {
      type: String,
      required: false,
    },
    transactionHash: {
      type: String,
      required: false,
    },
    blockchainRetryCount: {
      type: Number,
      default: 0,
    },
    blockchainLastAttempt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

export const RegistrationRequestModel = mongoose.model("RegistrationRequest", RegistrationRequestSchema);

