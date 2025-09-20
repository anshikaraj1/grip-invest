# gripinvest_winter_internship_Backend

# Grip Invest - Full Stack Application

A full-stack investment platform built with **Next.js (frontend)**, **Node.js + Express + Prisma (backend)**, and **MySQL (database)**.  
This project demonstrates user authentication (signup/login), protected routes with JWT, and frontend integration with a backend API.

---

## Tech Stack

**Frontend**
- Next.js (React + TypeScript)
- TailwindCSS (UI styling)

**Backend**
- Node.js + Express
- Prisma ORM
- JWT (JSON Web Token) for authentication
- Bcrypt for password hashing

**Database**
- MySQL (via Docker + phpMyAdmin)

**Dev Tools**
- Docker & Docker Compose
- Postman / Thunder Client (API testing)
- Git & GitHub

---

### Features
🔐 Authentication & Users
Signup, Login with JWT-based authentication
Password reset (OTP/email)
AI-powered password strength suggestions


📈 Investment Products
CRUD operations for investment products (admin only)
Product listing & filtering by type, yield, and risk
AI-generated product descriptions & recommendations


💰 Investments & Portfolio
Users can invest in available products
Portfolio dashboard with investments, returns, and insights
AI-driven portfolio risk distribution analysis


📝 Transaction Logs
API request/response logging
Filter logs by user ID or email
AI summarizer for error trends


🖥️ Frontend (React/Next.js)
Responsive & user-friendly UI
Dashboard with portfolio insights
Product pages, investment forms, portfolio charts
Transaction logs table with AI error summarizer
AI-powered recommendations embedded into UI


⚙️ DevOps & Deployment
Dockerized setup (backend, frontend, MySQL)
docker-compose.yml for local orchestration
Health checks (/health endpoint)
Centralized logging with docker logs

---
## 📂 Project Structure
grip-invest/
│── backend/ # Express + Prisma backend
│ ├── src/ # Routes, middleware, controllers
│ ├── prisma/ # Prisma schema
│ ├── .env # Backend environment variables
│
│── frontend/ # Next.js frontend
│ ├── app/ # Pages (login, signup, protected, etc.)
│ ├── services/ # API service functions
│ ├── .env.local # Frontend environment variables
│
│── docker-compose.yml
│── README.md


---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/anshikaraj1/grip-invest.git
cd grip-invest

### 2️⃣ Setup Environment Variables
Backend (backend/.env)
DATABASE_URL="mysql://gripuser:grippass@127.0.0.1:3306/grip_invest"
JWT_SECRET="mysecretkey"

Frontend (frontend/.env.local)
NEXT_PUBLIC_API_URL="http://localhost:4000"

### 3️⃣ Run MySQL & phpMyAdmin with Docker
docker-compose up -d

MySQL → localhost:3306

phpMyAdmin → localhost:8080

### 4️⃣ Backend Setup
cd backend
npm install
npx prisma migrate dev --name init
npx ts-node src/index.ts

Backend runs at → http://localhost:4000


### 5️⃣ Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs at → http://localhost:3000

### Features
1. User Signup & Login
2. Password hashing (Bcrypt)
3. JWT Authentication
4. Protected routes (only accessible with token)
5. MySQL + Prisma ORM
6. Frontend integration (Next.js + API calls)
7. Dockerized database setup
