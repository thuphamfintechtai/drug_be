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

const NFTInfoSchema = new mongoose.Schema(
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

export default mongoose.model("NFTInfo", NFTInfoSchema);

