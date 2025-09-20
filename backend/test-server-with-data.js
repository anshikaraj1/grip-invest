const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

app.use(cors());
app.use(express.json());

// Transaction logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.json to capture response
  const originalJson = res.json;
  let responseBody;
  
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Override res.end to log after response is sent
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Log the transaction
    logTransaction(req, res, responseBody, startTime);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Function to log transactions
function logTransaction(req, res, responseBody, startTime) {
  try {
    const userId = req.user?.userId || null;
    const email = req.user?.email || null;
    
    // Generate truly unique ID using crypto if available, otherwise fallback
    let uniqueId;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uniqueId = crypto.randomUUID();
    } else {
      // Fallback: timestamp + high precision random + counter
      uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${transactionLogs.length}`;
    }
    
    const log = {
      id: uniqueId,
      userId,
      email,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: res.statusCode,
      errorMessage: res.statusCode >= 400 ? (responseBody?.error || responseBody?.message) : null,
      createdAt: new Date().toISOString()
    };
    
    transactionLogs.push(log);
    
    // Keep only last 1000 logs to prevent memory issues
    if (transactionLogs.length > 1000) {
      transactionLogs = transactionLogs.slice(-1000);
    }
  } catch (error) {
    console.error("Failed to log transaction:", error);
  }
}

// In-memory storage
let users = [];
let products = [
  {
    id: "1",
    name: "Government Bond 2025",
    investmentType: "BOND",
    tenureMonths: 12,
    annualYield: 5.2,
    riskLevel: "LOW",
    minInvestment: 1000,
    maxInvestment: 100000,
    description: "Secure government bond with guaranteed returns",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "Equity Mutual Fund",
    investmentType: "MF",
    tenureMonths: 24,
    annualYield: 8.5,
    riskLevel: "HIGH",
    minInvestment: 500,
    maxInvestment: 500000,
    description: "High-growth equity mutual fund",
    createdAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Fixed Deposit Plus",
    investmentType: "FD",
    tenureMonths: 36,
    annualYield: 6.8,
    riskLevel: "LOW",
    minInvestment: 1000,
    maxInvestment: 1000000,
    description: "Fixed deposit with competitive interest rates",
    createdAt: new Date().toISOString()
  },
  {
    id: "4",
    name: "Tech ETF",
    investmentType: "ETF",
    tenureMonths: 12,
    annualYield: 7.3,
    riskLevel: "MODERATE",
    minInvestment: 100,
    maxInvestment: 200000,
    description: "Technology sector ETF",
    createdAt: new Date().toISOString()
  },
  {
    id: "5",
    name: "Gold Savings Fund",
    investmentType: "MF",
    tenureMonths: 18,
    annualYield: 6.0,
    riskLevel: "MODERATE",
    minInvestment: 2000,
    maxInvestment: 300000,
    description: "Gold-backed mutual fund for stable returns",
    createdAt: new Date().toISOString()
  }
];

let investments = [];
let transactionLogs = [
  {
    id: 'log-001-health-check',
    userId: null,
    email: null,
    endpoint: '/health',
    httpMethod: 'GET',
    statusCode: 200,
    errorMessage: null,
    createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
  },
  {
    id: 'log-002-products-fetch',
    userId: null,
    email: null,
    endpoint: '/products',
    httpMethod: 'GET',
    statusCode: 200,
    errorMessage: null,
    createdAt: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
  },
  {
    id: 'log-003-user-signup',
    userId: null,
    email: null,
    endpoint: '/auth/signup',
    httpMethod: 'POST',
    statusCode: 201,
    errorMessage: null,
    createdAt: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
  },
  {
    id: 'log-004-user-login',
    userId: null,
    email: null,
    endpoint: '/auth/login',
    httpMethod: 'POST',
    statusCode: 200,
    errorMessage: null,
    createdAt: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
  },
  {
    id: 'log-005-profile-access',
    userId: null,
    email: null,
    endpoint: '/auth/profile',
    httpMethod: 'GET',
    statusCode: 200,
    errorMessage: null,
    createdAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
  },
  {
    id: 'log-006-login-error',
    userId: null,
    email: null,
    endpoint: '/auth/login',
    httpMethod: 'POST',
    statusCode: 400,
    errorMessage: 'User not found',
    createdAt: new Date(Date.now() - 450000).toISOString() // 7.5 minutes ago
  },
  {
    id: 'log-007-profile-404',
    userId: null,
    email: null,
    endpoint: '/auth/profile',
    httpMethod: 'GET',
    statusCode: 404,
    errorMessage: 'User not found',
    createdAt: new Date(Date.now() - 420000).toISOString() // 7 minutes ago
  },
  {
    id: 'log-008-signup-conflict',
    userId: null,
    email: null,
    endpoint: '/auth/signup',
    httpMethod: 'POST',
    statusCode: 409,
    errorMessage: 'User already exists.',
    createdAt: new Date(Date.now() - 390000).toISOString() // 6.5 minutes ago
  },
  {
    id: 'log-009-unauthorized-access',
    userId: null,
    email: null,
    endpoint: '/logs/user/demo',
    httpMethod: 'GET',
    statusCode: 401,
    errorMessage: 'Access denied. No token provided.',
    createdAt: new Date(Date.now() - 360000).toISOString() // 6 minutes ago
  },
  {
    id: 'log-010-invalid-token',
    userId: null,
    email: null,
    endpoint: '/logs/user/1758311888784',
    httpMethod: 'GET',
    statusCode: 403,
    errorMessage: 'Invalid token',
    createdAt: new Date(Date.now() - 330000).toISOString() // 5.5 minutes ago
  }
];

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      api: "running"
    },
    uptime: process.uptime(),
    version: "1.0.0"
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Signup Route
app.post('/auth/signup', async (req, res) => {
  const { firstName, lastName, email, password, riskAppetite } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'First name, email, and password are required.' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName: lastName || null,
    email,
    passwordHash: hashedPassword,
    riskAppetite: riskAppetite || 'MODERATE',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  return res.status(201).json({ message: 'User created successfully', userId: newUser.id });
});

// Login Route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, firstName: user.firstName },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({ message: 'Login successful', token });
});

// Profile Route
app.get('/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  return res.json({
    message: 'This is a protected route',
    user: userWithoutPassword,
  });
});

// Products Routes
app.get('/products', (req, res) => {
  res.json({
    message: 'Products fetched successfully',
    products: products
  });
});

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json({
    message: 'Product fetched successfully',
    product
  });
});

// AI Recommendations
app.get('/products/recommendations/:userId', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const recommendedProducts = products.filter(p => p.riskLevel === user.riskAppetite);
  
  const aiMessage = generateProductRecommendation(user.riskAppetite, recommendedProducts);
  
  res.json({
    message: 'AI recommendations generated',
    recommendations: recommendedProducts,
    aiInsight: aiMessage
  });
});

// Investments Routes
app.get('/investments/portfolio', authenticateToken, (req, res) => {
  const userInvestments = investments.filter(inv => inv.userId === req.user.userId);
  
  const totalInvested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const activeInvestments = userInvestments.filter(inv => inv.status === 'ACTIVE');
  const totalExpectedReturn = activeInvestments.reduce((sum, inv) => sum + (inv.expectedReturn || 0), 0);
  
  res.json({
    message: 'Portfolio fetched successfully',
    portfolio: {
      totalInvested,
      totalExpectedReturn,
      activeInvestments: activeInvestments.length,
      totalInvestments: userInvestments.length,
      investments: userInvestments.map(inv => ({
        ...inv,
        product: products.find(p => p.id === inv.productId)
      }))
    }
  });
});

app.post('/investments/invest', authenticateToken, (req, res) => {
  const { productId, amount } = req.body;
  
  if (!productId || !amount) {
    return res.status(400).json({ error: 'Product ID and amount are required' });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const investmentAmount = parseFloat(amount);
  
  if (investmentAmount < product.minInvestment) {
    return res.status(400).json({ 
      error: `Minimum investment amount is ${product.minInvestment}` 
    });
  }
  
  if (product.maxInvestment && investmentAmount > product.maxInvestment) {
    return res.status(400).json({ 
      error: `Maximum investment amount is ${product.maxInvestment}` 
    });
  }
  
  const expectedReturn = investmentAmount * (product.annualYield / 100) * (product.tenureMonths / 12);
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + product.tenureMonths);
  
  const investment = {
    id: Date.now().toString(),
    userId: req.user.userId,
    productId,
    amount: investmentAmount,
    investedAt: new Date().toISOString(),
    status: 'ACTIVE',
    expectedReturn,
    maturityDate: maturityDate.toISOString().split('T')[0]
  };
  
  investments.push(investment);
  
  res.status(201).json({
    message: 'Investment created successfully',
    investment: {
      ...investment,
      product
    }
  });
});

// Portfolio Insights
app.get('/investments/insights/portfolio', authenticateToken, (req, res) => {
  const userInvestments = investments.filter(inv => inv.userId === req.user.userId);
  const user = users.find(u => u.id === req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const insights = generatePortfolioInsights(userInvestments, user.riskAppetite);
  
  res.json({
    message: 'Portfolio insights generated',
    insights
  });
});

// Transaction Logs
app.get('/logs/user/:userId', authenticateToken, (req, res) => {
  const { page = 1, limit = 50, statusCode, httpMethod } = req.query;
  
  // For demo purposes, show all logs if user is authenticated
  // In production, you'd want to filter by userId
  let userLogs = transactionLogs;
  
  // If user is logged in, also include their specific logs
  if (req.user?.userId) {
    const userSpecificLogs = transactionLogs.filter(log => log.userId === req.user.userId);
    userLogs = [...userLogs, ...userSpecificLogs];
  }
  
  // Apply filters
  if (statusCode) {
    userLogs = userLogs.filter(log => log.statusCode === parseInt(statusCode));
  }
  
  if (httpMethod) {
    userLogs = userLogs.filter(log => log.httpMethod === httpMethod);
  }
  
  // Sort by most recent first
  userLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedLogs = userLogs.slice(skip, skip + parseInt(limit));
  
  res.json({
    message: 'Transaction logs fetched successfully',
    logs: paginatedLogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: userLogs.length,
      pages: Math.ceil(userLogs.length / parseInt(limit))
    }
  });
});

// Error Summary
app.get('/logs/errors/summary/:userId', authenticateToken, (req, res) => {
  // For demo purposes, show all error logs
  let userLogs = transactionLogs.filter(log => log.statusCode >= 400);
  
  // If user is logged in, also include their specific error logs
  if (req.user?.userId) {
    const userSpecificLogs = transactionLogs.filter(log => 
      log.userId === req.user.userId && log.statusCode >= 400
    );
    userLogs = [...userLogs, ...userSpecificLogs];
  }
  
  const errorSummary = generateErrorSummary(userLogs);
  
  res.json({
    message: 'Error summary generated',
    summary: errorSummary,
    totalErrors: userLogs.length,
    recentErrors: userLogs.slice(0, 10)
  });
});

// Helper functions
function generateProductRecommendation(riskAppetite, products) {
  const riskMessages = {
    LOW: "Based on your conservative risk profile, we recommend these stable investment options with guaranteed returns.",
    MODERATE: "Your balanced approach to risk makes these diversified products ideal for steady growth over time.",
    HIGH: "With your appetite for higher returns, these products offer the best potential gains while managing risk."
  };
  
  return riskMessages[riskAppetite] || "Here are some recommended products for you.";
}

function generatePortfolioInsights(investments, riskAppetite) {
  const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  
  const riskDistribution = activeInvestments.reduce((acc, inv) => {
    const product = products.find(p => p.id === inv.productId);
    if (product) {
      const risk = product.riskLevel;
      acc[risk] = (acc[risk] || 0) + inv.amount;
    }
    return acc;
  }, {});
  
  const recommendations = generateRecommendations(riskDistribution, riskAppetite);
  const riskAnalysis = analyzeRiskProfile(riskDistribution, riskAppetite);
  
  return {
    riskDistribution,
    totalInvested,
    activeInvestments: activeInvestments.length,
    recommendations,
    riskAnalysis
  };
}

function generateRecommendations(riskDistribution, riskAppetite) {
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

function analyzeRiskProfile(riskDistribution, riskAppetite) {
  const total = Object.values(riskDistribution).reduce((sum, val) => sum + val, 0);
  const highRiskPercentage = ((riskDistribution.HIGH || 0) / total) * 100;
  
  if (riskAppetite === 'LOW' && highRiskPercentage > 20) {
    return "Your portfolio has higher risk exposure than your conservative profile suggests.";
  } else if (riskAppetite === 'HIGH' && highRiskPercentage < 50) {
    return "Your portfolio could benefit from more high-risk investments for better returns.";
  } else {
    return "Your portfolio risk distribution aligns well with your risk appetite.";
  }
}

function generateErrorSummary(errorLogs) {
  if (errorLogs.length === 0) {
    return {
      message: "No errors found in your recent activity. Great job!",
      commonErrors: [],
      recommendations: ["Continue following best practices to maintain this clean error record."]
    };
  }
  
  const errorGroups = errorLogs.reduce((acc, log) => {
    const status = log.statusCode;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(log);
    return acc;
  }, {});
  
  const commonErrors = Object.entries(errorGroups)
    .map(([status, logs]) => ({
      statusCode: parseInt(status),
      count: logs.length,
      percentage: (logs.length / errorLogs.length) * 100,
      recentOccurrence: logs[0]?.createdAt
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const recommendations = generateErrorRecommendations(errorGroups);
  
  return {
    message: `Found ${errorLogs.length} errors in your recent activity. Here's what we found:`,
    commonErrors,
    recommendations,
    totalErrors: errorLogs.length,
    errorRate: `${((errorLogs.length / (errorLogs.length + 100)) * 100).toFixed(1)}%`
  };
}

function generateErrorRecommendations(errorGroups) {
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

app.listen(PORT, () => {
  console.log(`🚀 Test Server with Sample Data running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Available routes:`);
  console.log(`  - POST /auth/signup`);
  console.log(`  - POST /auth/login`);
  console.log(`  - GET  /auth/profile`);
  console.log(`  - GET  /products (${products.length} products available)`);
  console.log(`  - GET  /products/recommendations/:userId`);
  console.log(`  - GET  /investments/portfolio`);
  console.log(`  - POST /investments/invest`);
  console.log(`  - GET  /logs/user/:userId`);
  console.log(`  - GET  /health`);
});
