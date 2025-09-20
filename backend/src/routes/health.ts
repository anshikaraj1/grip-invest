import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ✅ Health check endpoint
router.get("/", async (req, res) => {
  try {
    // Test database connection
    await prisma.user.findFirst();
    
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "running"
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0"
    };
    
    res.json(healthStatus);
  } catch (error) {
    console.error("❌ Health check error:", error);
    
    const healthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        api: "running"
      },
      error: "Database connection failed",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0"
    };
    
    res.status(503).json(healthStatus);
  }
});

export default router;
