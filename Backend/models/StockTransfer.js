import mongoose from "mongoose";

const stockTransferSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transferNumber: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["INDENT_REQUEST", "SUPPLY_DISPATCH", "DAMAGED_RETURN"],
      default: "INDENT_REQUEST",
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["CENTRAL_KITCHEN", "OUTLET", "SUPPLIER"],
      default: "OUTLET",
    },
    sourceName: {
      type: String,
      required: true,
      default: "Main Outlet",
      trim: true,
    },
    destinationType: {
      type: String,
      enum: ["CENTRAL_KITCHEN", "OUTLET", "SUPPLIER"],
      default: "CENTRAL_KITCHEN",
    },
    destinationName: {
      type: String,
      required: true,
      default: "Central Kitchen Hub",
      trim: true,
    },
    outletZone: {
      type: String,
      default: "Main Floor",
      trim: true,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0.01,
        },
        unit: {
          type: String,
          default: "KG",
        },
        costPrice: {
          type: Number,
          default: 0,
        },
        reason: {
          type: String,
          default: "", // for damaged return e.g. "Expired", "Packaging Leak", "Spoiled"
        },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DISPATCHED", "RECEIVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    dispatchedAt: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

stockTransferSchema.index({ userId: 1, type: 1, status: 1 });
stockTransferSchema.index({ userId: 1, createdAt: -1 });

const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);
export default StockTransfer;

