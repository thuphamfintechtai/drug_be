import mongoose from "mongoose";

export const ProofOfProductionSchema = new mongoose.Schema(
  {
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompany",
      required: true,
    },
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DrugInfo",
      required: true,
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
    batchNumber: {
      type: String,
      required: false,
      unique: false, // Can have multiple productions with same batch number
    },
    qaInspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    qaReportUri: {
      type: String,
      required: false,
    },
    chainTxHash: {
      type: String,
      required: false,
    },
    remainFrom: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes for performance
ProofOfProductionSchema.index({ manufacturer: 1 });
ProofOfProductionSchema.index({ drug: 1 });
ProofOfProductionSchema.index({ batchNumber: 1 });
ProofOfProductionSchema.index({ status: 1 });
ProofOfProductionSchema.index({ createdAt: -1 });

export const ProofOfProductionModel = mongoose.model("ProofOfProduction", ProofOfProductionSchema);

