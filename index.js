import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import registrationRoutes from "./routes/registrationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/drug_be";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/registration", registrationRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Drug Traceability Backend API" });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Đã kết nối MongoDB thành công");
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server đang chạy trên port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Lỗi kết nối MongoDB:", error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Lỗi:", err);
  res.status(500).json({
    success: false,
    message: "Lỗi server",
    error: err.message,
  });
});

export default app;

