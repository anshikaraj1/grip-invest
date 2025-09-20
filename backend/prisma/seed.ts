import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample investment products
  const products = await Promise.all([
    prisma.investmentProduct.create({
      data: {
        name: "Government Bond 2025",
        investmentType: "BOND",
        tenureMonths: 12,
        annualYield: 5.2,
        riskLevel: "LOW",
        minInvestment: 1000,
        maxInvestment: 100000,
        description: "Secure government bond with guaranteed returns"
      }
    }),
    prisma.investmentProduct.create({
      data: {
        name: "Equity Mutual Fund",
        investmentType: "MF",
        tenureMonths: 24,
        annualYield: 8.5,
        riskLevel: "HIGH",
        minInvestment: 500,
        maxInvestment: 500000,
        description: "High-growth equity mutual fund"
      }
    }),
    prisma.investmentProduct.create({
      data: {
        name: "Fixed Deposit Plus",
        investmentType: "FD",
        tenureMonths: 36,
        annualYield: 6.8,
        riskLevel: "LOW",
        minInvestment: 1000,
        maxInvestment: 1000000,
        description: "Fixed deposit with competitive interest rates"
      }
    }),
    prisma.investmentProduct.create({
      data: {
        name: "Tech ETF",
        investmentType: "ETF",
        tenureMonths: 12,
        annualYield: 7.3,
        riskLevel: "MODERATE",
        minInvestment: 100,
        maxInvestment: 200000,
        description: "Technology sector ETF"
      }
    })
  ]);

  console.log('✅ Sample products created:', products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
