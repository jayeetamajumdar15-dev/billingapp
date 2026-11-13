import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
      index: true,
    },
    areaName: {
      type: String,
      default: "",
    },
    tableNo: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    shape: {
      type: String,
      enum: ["square", "round", "rectangle"],
      default: "square",
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "BILLED", "RESERVED"],
      default: "AVAILABLE",
      index: true,
    },
    // Live Order state for occupied / billed tables
    currentInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    currentInvoiceNumber: {
      type: String,
      default: "",
    },
    runningTotal: {
      type: Number,
      default: 0,
    },
    itemsCount: {
      type: Number,
      default: 0,
    },
    pax: {
      type: Number,
      default: 1,
    },
    customerName: {
      type: String,
      default: "",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    seatedAt: {
      type: Date,
      default: null,
    },
    reservationName: {
      type: String,
      default: "",
    },
    reservationPhone: {
      type: String,
      default: "",
    },
    reservationTime: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

tableSchema.index({ userId: 1, tableNo: 1 });
tableSchema.index({ userId: 1, areaId: 1, status: 1 });
tableSchema.index({ userId: 1, sortOrder: 1 });

const Table = mongoose.model("Table", tableSchema);
export default Table;

