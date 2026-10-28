import mongoose from "mongoose";

const WhatsAppSessionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("WhatsAppSession", WhatsAppSessionSchema);
