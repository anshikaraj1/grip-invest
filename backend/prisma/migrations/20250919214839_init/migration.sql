-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "risk_appetite" TEXT NOT NULL DEFAULT 'MODERATE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investment_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "investment_type" TEXT NOT NULL,
    "tenure_months" INTEGER NOT NULL,
    "annual_yield" REAL NOT NULL,
    "risk_level" TEXT NOT NULL,
    "min_investment" REAL NOT NULL DEFAULT 1000.00,
    "max_investment" REAL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "invested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expected_return" REAL,
    "maturity_date" DATETIME,
    CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "investments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "investment_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_logs" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "email" TEXT,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
