import mongoose from "mongoose";

const commentsSchema = new mongoose.Schema(
  {
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentsSchema);
   
