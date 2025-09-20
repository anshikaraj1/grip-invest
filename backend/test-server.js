const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Mock user storage (in memory)
const users = [];
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Signup route
app.post('/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Signup request:', { name, email, password: '***' });
  
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    res.status(201).json({
      message: 'User created successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email, password: '***' });
  
  try {
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      message: 'Login successful', 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Profile route
app.get('/auth/profile', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(user => user.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'This is a protected route',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📝 Available routes:');
  console.log('  GET  /test');
  console.log('  POST /auth/signup');
  console.log('  POST /auth/login');
  console.log('  GET  /auth/profile (requires Authorization header)');
  console.log('💡 This is a test server without database - perfect for testing!');
});
