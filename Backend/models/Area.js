import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: "",
    },
    serviceChargeRate: {
      type: Number,
      default: 0, // e.g. 5 for 5% service tax / service charge
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#2563EB",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

areaSchema.index({ userId: 1, name: 1 });
areaSchema.index({ userId: 1, sortOrder: 1 });

const Area = mongoose.model("Area", areaSchema);
export default Area;

