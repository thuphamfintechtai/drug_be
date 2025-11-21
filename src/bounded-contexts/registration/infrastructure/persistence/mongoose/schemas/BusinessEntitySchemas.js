import mongoose from "mongoose";

// PharmaCompany Schema
const PharmaCompanySchema = new mongoose.Schema(
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
      index: true,
    },
    taxCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    walletAddress: {
      type: String,
    },
    gmpCertNo: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    contractAddress: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
  },
  { timestamps: true }
);

// Distributor Schema
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
      index: true,
    },
    taxCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    walletAddress: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    contractAddress: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pharmacy Schema
const PharmacySchema = new mongoose.Schema(
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
      index: true,
    },
    taxCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    walletAddress: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    contractAddress: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
  },
  { timestamps: true }
);

// Export models (check if already exists to avoid OverwriteModelError)
export const PharmaCompanyModel =
  mongoose.models.PharmaCompany || mongoose.model("PharmaCompany", PharmaCompanySchema);

export const DistributorModel =
  mongoose.models.Distributor || mongoose.model("Distributor", DistributorSchema);

export const PharmacyModel =
  mongoose.models.Pharmacy || mongoose.model("Pharmacy", PharmacySchema);

