import mongoose from "mongoose";

const ActiveIngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  concentration: {
    type: String,
    required: false,
  },
});

export const DrugInfoSchema = new mongoose.Schema(
  {
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompany",
      required: true,
    },
    tradeName: {
      type: String,
      required: true,
    },
    genericName: {
      type: String,
      required: false,
    },
    atcCode: {
      type: String,
      required: true,
      unique: true,
    },
    dosageForm: {
      type: String,
      required: false,
    },
    strength: {
      type: String,
      required: false,
    },
    route: {
      type: String,
      required: false,
    },
    packaging: {
      type: String,
      required: false,
    },
    storage: {
      type: String,
      required: false,
    },
    warnings: {
      type: String,
      required: false,
    },
    activeIngredients: {
      type: [ActiveIngredientSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "recalled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Check if model already exists to avoid OverwriteModelError
export const DrugInfoModel = mongoose.models.DrugInfo || mongoose.model("DrugInfo", DrugInfoSchema);

