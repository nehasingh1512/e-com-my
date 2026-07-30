import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    change: { type: Number, required: true }, // positive = added, negative = removed
    reason: { type: String, default: "" }, // "manual_adjustment", "order_placed", "restock"
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("StockHistory", stockHistorySchema);
