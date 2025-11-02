import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "../../routes/authRoutes.js";
import userRoutes from "../../routes/userRoutes.js";
import pharmaCompanyRoutes from "../../routes/pharmaCompanyRoutes.js";
import distributorRoutes from "../../routes/distributorRoutes.js";

dotenv.config();
dotenv.config({ path: ".env.test" });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pharma-company", pharmaCompanyRoutes);
app.use("/api/distributor", distributorRoutes);

app.use((err, req, res, next) => {
  console.error("Lỗi:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server",
  });
});

export default app;

