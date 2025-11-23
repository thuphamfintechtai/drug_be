import mongoose from "mongoose";

export const ManufactureIPFSStatusSchema = new mongoose.Schema(
  {
    manufacture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompany",
      required: true,
    },
    timespan: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "SuccessFully", "Failed"],
      default: "Pending",
    },
    quantity: {
      type: Number,
      required: false,
    },
    IPFSUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
ManufactureIPFSStatusSchema.index({ manufacture: 1 });
ManufactureIPFSStatusSchema.index({ status: 1 });
ManufactureIPFSStatusSchema.index({ IPFSUrl: 1 });
ManufactureIPFSStatusSchema.index({ createdAt: -1 });

export const ManufactureIPFSStatusModel = mongoose.model(
  "ManufactureIPFSStatus",
  ManufactureIPFSStatusSchema
);

