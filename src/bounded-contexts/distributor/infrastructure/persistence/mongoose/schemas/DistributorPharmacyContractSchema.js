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

// Compound unique index để tránh duplicate contract giữa distributor và pharmacy
// Chỉ cho phép 1 contract active (pending, approved, signed) giữa 1 distributor và 1 pharmacy
DistributorPharmacyContractSchema.index({ distributor: 1, pharmacy: 1 }, { unique: true });

export const DistributorPharmacyContractModel =
  mongoose.models.DistributorPharmacyContract ||
  mongoose.model("DistributorPharmacyContract", DistributorPharmacyContractSchema);

