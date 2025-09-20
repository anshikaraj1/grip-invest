import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import bcrypt from "bcrypt";

const router = Router();
const prisma = new PrismaClient();

// ✅ Get user profile
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        riskAppetite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile fetched successfully",
      user
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Update user profile
router.put("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, riskAppetite } = req.body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (riskAppetite) updateData.riskAppetite = riskAppetite;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        riskAppetite: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Change password
router.put("/password", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    res.json({
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get user statistics
router.get("/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;

    const [investmentCount, totalInvested, activeInvestments] = await Promise.all([
      prisma.investment.count({
        where: { userId }
      }),
      prisma.investment.aggregate({
        where: { userId },
        _sum: { amount: true }
      }),
      prisma.investment.count({
        where: { userId, status: 'ACTIVE' }
      })
    ]);

    res.json({
      message: "User statistics fetched successfully",
      stats: {
        totalInvestments: investmentCount,
        totalInvested: totalInvested._sum.amount || 0,
        activeInvestments,
        accountAge: Math.floor((Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24)) // Mock calculation
      }
    });
  } catch (error) {
    console.error("❌ Get user stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
