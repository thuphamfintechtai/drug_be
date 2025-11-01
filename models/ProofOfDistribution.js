import mongoose from "mongoose";

const DeliveryAddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  postalCode: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
});

const ShippingInfoSchema = new mongoose.Schema({
  carrier: {
    type: String,
    required: false,
  },
  trackingNumber: {
    type: String,
    required: false,
  },
  estimatedDelivery: {
    type: Date,
    required: false,
  },
  actualDelivery: {
    type: Date,
    required: false,
  },
});

const ReceivedBySchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  signature: {
    type: String,
    required: false,
  },
  idNumber: {
    type: String,
    required: false,
  },
});

const ProofOfDistributionSchema = new mongoose.Schema(
  {
    fromManufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

export default mongoose.model("ProofOfDistribution", ProofOfDistributionSchema);

