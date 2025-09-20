import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// ✅ Get all products (public)
router.get("/", async (req, res) => {
  try {
    const products = await prisma.investmentProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      message: "Products fetched successfully",
      products
    });
  } catch (error) {
    console.error("❌ Get products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get product by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.investmentProduct.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({
      message: "Product fetched successfully",
      product
    });
  } catch (error) {
    console.error("❌ Get product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Create product (admin only - for now, any authenticated user)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, investmentType, tenureMonths, annualYield, riskLevel, minInvestment, maxInvestment, description } = req.body;
    
    if (!name || !investmentType || !tenureMonths || !annualYield || !riskLevel) {
      return res.status(400).json({ error: "Required fields: name, investmentType, tenureMonths, annualYield, riskLevel" });
    }
    
    const product = await prisma.investmentProduct.create({
      data: {
        name,
        investmentType,
        tenureMonths: parseInt(tenureMonths),
        annualYield: parseFloat(annualYield),
        riskLevel,
        minInvestment: minInvestment ? parseFloat(minInvestment) : 1000.00,
        maxInvestment: maxInvestment ? parseFloat(maxInvestment) : null,
        description
      }
    });
    
    res.status(201).json({
      message: "Product created successfully",
      product
    });
  } catch (error) {
    console.error("❌ Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Update product (admin only)
router.put("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const product = await prisma.investmentProduct.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    console.error("❌ Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Delete product (admin only)
router.delete("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.investmentProduct.delete({
      where: { id }
    });
    
    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("❌ Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ AI Product Recommendations
router.get("/recommendations/:userId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's risk appetite
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get products matching user's risk appetite
    const recommendedProducts = await prisma.investmentProduct.findMany({
      where: {
        riskLevel: user.riskAppetite
      },
      orderBy: { annualYield: 'desc' },
      take: 5
    });
    
    // AI-generated recommendation message
    const aiMessage = generateProductRecommendation(user.riskAppetite, recommendedProducts);
    
    res.json({
      message: "AI recommendations generated",
      recommendations: recommendedProducts,
      aiInsight: aiMessage
    });
  } catch (error) {
    console.error("❌ AI recommendations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateProductRecommendation(riskAppetite: string, products: any[]): string {
  const riskMessages = {
    LOW: "Based on your conservative risk profile, we recommend these stable investment options with guaranteed returns.",
    MODERATE: "Your balanced approach to risk makes these diversified products ideal for steady growth over time.",
    HIGH: "With your appetite for higher returns, these products offer the best potential gains while managing risk."
  };
  
  return riskMessages[riskAppetite as keyof typeof riskMessages] || "Here are some recommended products for you.";
}

export default router;
