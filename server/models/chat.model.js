import mongoose from "mongoose";
const schema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    users: Array,
    
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const model = mongoose.model("Chats", schema);
export default model;
