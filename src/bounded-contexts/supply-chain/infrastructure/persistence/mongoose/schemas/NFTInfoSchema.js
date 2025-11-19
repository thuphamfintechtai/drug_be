import mongoose from "mongoose";

const MetadataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
});

export const NFTInfoSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    contractAddress: {
      type: String,
      required: false,
    },
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugInfo",
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
    },
    batchNumber: {
      type: String,
      required: false,
    },
    mfgDate: {
      type: Date,
      required: false,
    },
    expDate: {
      type: Date,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
      default: 1,
    },
    unit: {
      type: String,
      required: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["minted", "transferred", "sold", "expired", "recalled"],
      default: "minted",
    },
    chainTxHash: {
      type: String,
      required: false,
    },
    ipfsUrl: {
      type: String,
      required: false,
    },
    ipfsHash: {
      type: String,
      required: false,
    },
    metadata: {
      type: MetadataSchema,
      required: false,
    },
    proofOfProduction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfProduction",
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
// Note: tokenId and serialNumber already have indexes from unique: true
NFTInfoSchema.index({ batchNumber: 1 });
NFTInfoSchema.index({ owner: 1 });
NFTInfoSchema.index({ drug: 1 });
NFTInfoSchema.index({ status: 1 });
NFTInfoSchema.index({ proofOfProduction: 1 });

export const NFTInfoModel = mongoose.model("NFTInfo", NFTInfoSchema);

