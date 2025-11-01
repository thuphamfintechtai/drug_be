import mongoose from "mongoose";

const DistributorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    licenseNo: {
      type: String,
      required: true,
      unique: true,
    },
    taxCode: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    contactEmail: {
      type: String,
      required: false,
    },
    contactPhone: {
      type: String,
      required: false,
    },
    walletAddress: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Distributor", DistributorSchema);

