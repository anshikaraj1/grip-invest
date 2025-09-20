import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import investmentRoutes from "./routes/investments";
import logRoutes from "./routes/logs";
import profileRoutes from "./routes/profile";
import healthRoutes from "./routes/health";
import { transactionLogger } from "./middleware/transactionLogger";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ✅ Middleware
app.use(transactionLogger);

// ✅ Routes
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/investments", investmentRoutes);
app.use("/logs", logRoutes);
app.use("/profile", profileRoutes);

// ✅ Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Available routes:`);
  console.log(`  - POST /auth/signup`);
  console.log(`  - POST /auth/login`);
  console.log(`  - GET  /auth/profile`);
  console.log(`  - GET  /products`);
  console.log(`  - POST /products (admin)`);
  console.log(`  - GET  /investments/portfolio`);
  console.log(`  - POST /investments/invest`);
  console.log(`  - GET  /logs/user/:userId`);
  console.log(`  - GET  /health`);
});





