import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const transactionLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for health checks to reduce noise
  if (req.originalUrl === '/health') {
    return next();
  }

  const startTime = Date.now();
  
  // Store original res.json to capture response
  const originalJson = res.json;
  let responseBody: any;
  
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Override res.end to log after response is sent
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    // Log the transaction asynchronously
    setTimeout(() => {
      logTransaction(req, res, responseBody, startTime);
    }, 0);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

async function logTransaction(
  req: Request,
  res: Response,
  responseBody: any,
  startTime: number
) {
  try {
    const userId = (req as any).user?.userId || null;
    const email = (req as any).user?.email || null;
    
    // Skip logging for health checks to reduce noise
    if (req.originalUrl === '/health') {
      return;
    }
    
    const logData = {
      userId,
      email,
      endpoint: req.originalUrl,
      httpMethod: req.method as any,
      statusCode: res.statusCode,
      errorMessage: res.statusCode >= 400 ? responseBody?.error || responseBody?.message : null,
    };
    
    console.log("📝 Logging transaction:", logData);
    
    await prisma.transactionLog.create({
      data: logData,
    });
    
    console.log("✅ Transaction logged successfully");
  } catch (error) {
    console.error("❌ Failed to log transaction:", error);
  }
}
