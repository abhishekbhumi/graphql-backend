import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {

    name: {
      type: String,
      required: true,
      trim: true,
      default: "Global Chat",
    },
    type: {
      type: String,
      enum: ["GLOBAL", "PRIVATE", "GROUP"],
      default: "GLOBAL",
      description: "Type of chat: GLOBAL, PRIVATE, or GROUP",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        description: "Users participating in the chat",
      },
    ],
    lastMessage: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        description: "Reference to the last message in the chat",
    },
    isActive: {
      type: Boolean,
      default: true,
      description: "Indicates if the chat is active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);