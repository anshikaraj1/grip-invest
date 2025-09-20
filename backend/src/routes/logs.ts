import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// ✅ Get transaction logs by user ID
router.get("/user/:userId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, statusCode, httpMethod } = req.query;
    
    // Ensure user can only access their own logs
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { userId };
    
    if (statusCode) {
      where.statusCode = parseInt(statusCode as string);
    }
    
    if (httpMethod) {
      where.httpMethod = httpMethod;
    }
    
    const [logs, total] = await Promise.all([
      prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transactionLog.count({ where })
    ]);
    
    res.json({
      message: "Transaction logs fetched successfully",
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get user logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get transaction logs by email
router.get("/email/:email", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Ensure user can only access their own logs
    if (req.user?.email !== email) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [logs, total] = await Promise.all([
      prisma.transactionLog.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transactionLog.count({ where: { email } })
    ]);
    
    res.json({
      message: "Transaction logs fetched successfully",
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get email logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get error summary for user
router.get("/errors/summary/:userId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own logs
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const errorLogs = await prisma.transactionLog.findMany({
      where: {
        userId,
        statusCode: { gte: 400 }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // AI-generated error summary
    const errorSummary = generateErrorSummary(errorLogs);
    
    res.json({
      message: "Error summary generated",
      summary: errorSummary,
      totalErrors: errorLogs.length,
      recentErrors: errorLogs.slice(0, 10)
    });
  } catch (error) {
    console.error("❌ Get error summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get all logs (admin only - for now, any authenticated user)
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 100, userId, email, statusCode, httpMethod } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (email) {
      where.email = email;
    }
    
    if (statusCode) {
      where.statusCode = parseInt(statusCode as string);
    }
    
    if (httpMethod) {
      where.httpMethod = httpMethod;
    }
    
    const [logs, total] = await Promise.all([
      prisma.transactionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.transactionLog.count({ where })
    ]);
    
    res.json({
      message: "Transaction logs fetched successfully",
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("❌ Get all logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateErrorSummary(errorLogs: any[]): any {
  if (errorLogs.length === 0) {
    return {
      message: "No errors found in your recent activity. Great job!",
      commonErrors: [],
      recommendations: ["Continue following best practices to maintain this clean error record."]
    };
  }
  
  // Group errors by status code
  const errorGroups = errorLogs.reduce((acc, log) => {
    const status = log.statusCode;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(log);
    return acc;
  }, {});
  
  // Find most common errors
  const commonErrors = Object.entries(errorGroups)
    .map(([status, logs]: [string, any]) => ({
      statusCode: parseInt(status),
      count: logs.length,
      percentage: (logs.length / errorLogs.length) * 100,
      recentOccurrence: logs[0]?.createdAt
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Generate AI recommendations
  const recommendations = generateErrorRecommendations(errorGroups);
  
  return {
    message: `Found ${errorLogs.length} errors in your recent activity. Here's what we found:`,
    commonErrors,
    recommendations,
    totalErrors: errorLogs.length,
    errorRate: `${((errorLogs.length / (errorLogs.length + 100)) * 100).toFixed(1)}%` // Mock calculation
  };
}

function generateErrorRecommendations(errorGroups: any): string[] {
  const recommendations = [];
  
  if (errorGroups[400]) {
    recommendations.push("Review your input validation - many 400 errors suggest data format issues.");
  }
  
  if (errorGroups[401]) {
    recommendations.push("Check your authentication flow - 401 errors indicate login/session issues.");
  }
  
  if (errorGroups[403]) {
    recommendations.push("Review your authorization logic - 403 errors suggest permission problems.");
  }
  
  if (errorGroups[500]) {
    recommendations.push("Investigate server-side issues - 500 errors need immediate attention.");
  }
  
  if (Object.keys(errorGroups).length > 3) {
    recommendations.push("Consider implementing better error handling and user feedback mechanisms.");
  }
  
  return recommendations;
}

export default router;
