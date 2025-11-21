import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: [
        "system_admin",
        "pharma_company",
        "distributor",
        "pharmacy",
        "user",
      ],
      default: "user",
    },
    phone: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    address: {
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
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    pharmaCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompany",
      required: false,
    },
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distributor",
      required: false,
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: false,
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model("User", UserSchema);

