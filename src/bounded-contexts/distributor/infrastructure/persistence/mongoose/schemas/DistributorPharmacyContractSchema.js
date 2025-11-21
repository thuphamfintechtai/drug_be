import mongoose from "mongoose";

const DistributorPharmacyContractSchema = new mongoose.Schema(
  {
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: true,
      index: true,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
    },
    contractFileUrl: {
      type: String,
    },
    contractFileName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["not_created", "pending", "approved", "signed", "rejected"],
      default: "pending",
      index: true,
    },
    distributorWalletAddress: {
      type: String,
    },
    pharmacyWalletAddress: {
      type: String,
    },
    blockchainTxHash: {
      type: String,
    },
    blockchainStatus: {
      type: String,
    },
    tokenId: {
      type: Number,
    },
    distributorSignedAt: {
      type: Date,
    },
    pharmacySignedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index để tìm nhanh contract giữa distributor và pharmacy
DistributorPharmacyContractSchema.index({ distributor: 1, pharmacy: 1 });

export const DistributorPharmacyContractModel =
  mongoose.models.DistributorPharmacyContract ||
  mongoose.model("DistributorPharmacyContract", DistributorPharmacyContractSchema);

