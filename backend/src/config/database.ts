import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export const connectDB = async () => {
  try {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongodbUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown MongoDB connection error";
    console.error("MongoDB connection error:", message);
    throw error;
  }
};
