import mongoose from "mongoose";

const DeliveryAddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

const ShippingInfoSchema = new mongoose.Schema({
  carrier: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
});

const ReceivedBySchema = new mongoose.Schema({
  name: String,
  signature: String,
  idNumber: String,
});

export const ProofOfDistributionSchema = new mongoose.Schema(
  {
    fromManufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompany",
      required: true,
    },
    toDistributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    manufacturerInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManufacturerInvoice",
      required: false,
    },
    proofOfProduction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfProduction",
      required: false,
    },
    nftInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NFTInfo",
      required: false,
    },
    distributionDate: {
      type: Date,
      required: false,
    },
    distributedQuantity: {
      type: Number,
      required: false,
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: false,
    },
    shippingInfo: {
      type: ShippingInfoSchema,
      required: false,
    },
    receivedBy: {
      type: ReceivedBySchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "in_transit", "delivered", "confirmed", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      required: false,
    },
    chainTxHash: {
      type: String,
      required: false,
    },
    transferTxHash: {
      type: String,
      required: false,
    },
    verificationCode: {
      type: String,
      required: false,
    },
    verifiedAt: {
      type: Date,
      required: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    batchNumber: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
ProofOfDistributionSchema.index({ fromManufacturer: 1 });
ProofOfDistributionSchema.index({ toDistributor: 1 });
ProofOfDistributionSchema.index({ manufacturerInvoice: 1 });
ProofOfDistributionSchema.index({ status: 1 });
ProofOfDistributionSchema.index({ batchNumber: 1 });
ProofOfDistributionSchema.index({ createdAt: -1 });

export const ProofOfDistributionModel = mongoose.model("ProofOfDistribution", ProofOfDistributionSchema);

