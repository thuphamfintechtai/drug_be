import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    console.log("MongoDB đã được kết nối");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("Đã kết nối MongoDB thành công");
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Đã ngắt kết nối MongoDB");
  } catch (error) {
    console.error("Lỗi khi ngắt kết nối MongoDB:", error);
    throw error;
  }
};

export const getDatabase = () => {
  return mongoose.connection;
};

