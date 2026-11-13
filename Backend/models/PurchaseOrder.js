import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierPhone: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["SUPPLIER", "CENTRAL_KITCHEN"],
      default: "SUPPLIER",
      index: true,
    },
    outletZone: {
      type: String,
      default: "Main Kitchen",
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
        unitPrice: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          default: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "RAISED", "ACCEPTED", "RECEIVED", "CANCELLED"],
      default: "RAISED",
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ userId: 1, status: 1 });
purchaseOrderSchema.index({ userId: 1, supplierName: 1 });
purchaseOrderSchema.index({ userId: 1, createdAt: -1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;

