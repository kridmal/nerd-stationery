import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import { initLowStockAlertScheduler } from "./services/stockAlertService.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/alerts", alertRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("�o. MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`dYs? Server running on port ${PORT}`);
      initLowStockAlertScheduler();
    });
  })
  .catch((err) => console.error("�?O MongoDB connection error:", err));
