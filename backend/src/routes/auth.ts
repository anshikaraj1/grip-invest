import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// ✅ Signup Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, riskAppetite } = req.body;

  try {
    if (!firstName || !email || !password) {
      return res.status(400).json({ error: "First name, email, and password are required." });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: { 
        firstName, 
        lastName: lastName || null, 
        email, 
        passwordHash: hashedPassword,
        riskAppetite: riskAppetite || 'MODERATE'
      },
    });

    return res.status(201).json({
      message: "User created successfully",
      userId: user.id,
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// ✅ Protected Route (Profile)
router.get("/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        riskAppetite: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (err) {
    console.error("❌ Profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Logout Route (for client-side token cleanup)
router.post("/logout", authenticateToken, async (req: AuthRequest, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    return res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;





