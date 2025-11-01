import mongoose from "mongoose";

const PaymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["cash", "bank_transfer", "credit_card", "other"],
    required: false,
  },
  dueDate: {
    type: Date,
    required: false,
  },
  paidDate: {
    type: Date,
    required: false,
  },
  paidAmount: {
    type: Number,
    required: false,
  },
});

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

const DeliveryInfoSchema = new mongoose.Schema({
  deliveredDate: {
    type: Date,
    required: false,
  },
  deliveredBy: {
    type: String,
    required: false,
  },
  deliveryAddress: {
    type: DeliveryAddressSchema,
    required: false,
  },
  trackingNumber: {
    type: String,
    required: false,
  },
  carrier: {
    type: String,
    required: false,
  },
});

const ManufacturerInvoiceSchema = new mongoose.Schema(
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
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
    unitPrice: {
      type: Number,
      required: false,
    },
    totalAmount: {
      type: Number,
      required: false,
    },
    vatRate: {
      type: Number,
      required: false,
    },
    vatAmount: {
      type: Number,
      required: false,
    },
    finalAmount: {
      type: Number,
      required: false,
    },
    paymentInfo: {
      type: PaymentInfoSchema,
      required: false,
    },
    transactionId: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    deliveryInfo: {
      type: DeliveryInfoSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "sent", "paid", "cancelled"],
      default: "draft",
    },
    chainTxHash: {
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

export default mongoose.model("ManufacturerInvoice", ManufacturerInvoiceSchema);

