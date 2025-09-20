import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// ✅ Get user's portfolio
router.get("/portfolio", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: { investedAt: 'desc' }
    });
    
    // Calculate portfolio summary
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
    const totalExpectedReturn = activeInvestments.reduce((sum, inv) => {
      return sum + (Number(inv.expectedReturn) || 0);
    }, 0);
    
    res.json({
      message: "Portfolio fetched successfully",
      portfolio: {
        totalInvested,
        totalExpectedReturn,
        activeInvestments: activeInvestments.length,
        totalInvestments: investments.length,
        investments
      }
    });
  } catch (error) {
    console.error("❌ Get portfolio error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Make an investment
router.post("/invest", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, amount } = req.body;
    
    if (!productId || !amount) {
      return res.status(400).json({ error: "Product ID and amount are required" });
    }
    
    // Get product details
    const product = await prisma.investmentProduct.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const investmentAmount = parseFloat(amount);
    
    // Business rules validation
    if (investmentAmount < Number(product.minInvestment)) {
      return res.status(400).json({ 
        error: `Minimum investment amount is ${product.minInvestment}` 
      });
    }
    
    if (product.maxInvestment && investmentAmount > Number(product.maxInvestment)) {
      return res.status(400).json({ 
        error: `Maximum investment amount is ${product.maxInvestment}` 
      });
    }
    
    // Calculate expected return and maturity date
    const expectedReturn = investmentAmount * (Number(product.annualYield) / 100) * (product.tenureMonths / 12);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + product.tenureMonths);
    
    // Create investment
    const investment = await prisma.investment.create({
      data: {
        userId,
        productId,
        amount: investmentAmount,
        expectedReturn,
        maturityDate
      },
      include: {
        product: true
      }
    });
    
    res.status(201).json({
      message: "Investment created successfully",
      investment
    });
  } catch (error) {
    console.error("❌ Create investment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get investment by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const investment = await prisma.investment.findFirst({
      where: { 
        id,
        userId // Ensure user can only access their own investments
      },
      include: {
        product: true
      }
    });
    
    if (!investment) {
      return res.status(404).json({ error: "Investment not found" });
    }
    
    res.json({
      message: "Investment fetched successfully",
      investment
    });
  } catch (error) {
    console.error("❌ Get investment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Cancel investment
router.put("/:id/cancel", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const investment = await prisma.investment.findFirst({
      where: { 
        id,
        userId,
        status: 'ACTIVE'
      }
    });
    
    if (!investment) {
      return res.status(404).json({ error: "Active investment not found" });
    }
    
    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    
    res.json({
      message: "Investment cancelled successfully",
      investment: updatedInvestment
    });
  } catch (error) {
    console.error("❌ Cancel investment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ AI Portfolio Insights
router.get("/insights/portfolio", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        product: true
      }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Generate AI insights
    const insights = generatePortfolioInsights(investments, user.riskAppetite);
    
    res.json({
      message: "Portfolio insights generated",
      insights
    });
  } catch (error) {
    console.error("❌ Portfolio insights error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generatePortfolioInsights(investments: any[], riskAppetite: string): any {
  const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  
  // Risk distribution analysis
  const riskDistribution = activeInvestments.reduce((acc, inv) => {
    const risk = inv.product.riskLevel;
    acc[risk] = (acc[risk] || 0) + Number(inv.amount);
    return acc;
  }, {});
  
  // Investment type distribution
  const typeDistribution = activeInvestments.reduce((acc, inv) => {
    const type = inv.product.investmentType;
    acc[type] = (acc[type] || 0) + Number(inv.amount);
    return acc;
  }, {});
  
  // AI-generated insights
  const insights = {
    riskDistribution,
    typeDistribution,
    totalInvested,
    activeInvestments: activeInvestments.length,
    recommendations: generateRecommendations(riskDistribution, riskAppetite),
    riskAnalysis: analyzeRiskProfile(riskDistribution, riskAppetite)
  };
  
  return insights;
}

function generateRecommendations(riskDistribution: any, riskAppetite: string): string[] {
  const recommendations = [];
  
  if (riskAppetite === 'LOW' && riskDistribution.HIGH > 0) {
    recommendations.push("Consider reducing high-risk investments to align with your conservative profile.");
  }
  
  if (riskAppetite === 'HIGH' && riskDistribution.LOW > riskDistribution.HIGH) {
    recommendations.push("You might want to increase high-risk investments for better returns.");
  }
  
  if (Object.keys(riskDistribution).length < 2) {
    recommendations.push("Consider diversifying your portfolio across different risk levels.");
  }
  
  return recommendations;
}

function analyzeRiskProfile(riskDistribution: any, riskAppetite: string): string {
  const total = Object.values(riskDistribution).reduce((sum: number, val: any) => sum + val, 0);
  const highRiskPercentage = ((riskDistribution.HIGH || 0) / total) * 100;
  
  if (riskAppetite === 'LOW' && highRiskPercentage > 20) {
    return "Your portfolio has higher risk exposure than your conservative profile suggests.";
  } else if (riskAppetite === 'HIGH' && highRiskPercentage < 50) {
    return "Your portfolio could benefit from more high-risk investments for better returns.";
  } else {
    return "Your portfolio risk distribution aligns well with your risk appetite.";
  }
}

export default router;
