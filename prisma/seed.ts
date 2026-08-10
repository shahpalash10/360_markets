import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Stock Trading platform database...");

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.webinar.deleteMany();
  await prisma.material.deleteMany();
  await prisma.course.deleteMany();
  await prisma.certificationApplication.deleteMany();
  await prisma.traderProfile.deleteMany();
  await prisma.investorProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alexUser = await prisma.user.create({
    data: {
      email: "alex.morgan@trader.io",
      name: "Alex Morgan",
      passwordHash: "hashed_password_123",
      role: "TRADER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      bio: "Ex-Hedge Fund Quantitative Stock Trader specializing in US equity order execution, algorithmic momentum strategies, and market microstructure.",
      title: "Stock Quant Trader",
      traderProfile: {
        create: {
          isCertified: true,
          certificationId: "TRD-928184",
          certifiedAt: new Date("2025-01-15"),
          grossRevenue: 24840.0,
          netRevenue: 19872.0,
          rating: 4.9,
          expertise: "Quantitative Stock Trading",
        },
      },
    },
    include: { traderProfile: true },
  });

  const danielUser = await prisma.user.create({
    data: {
      email: "daniel.wright@trader.io",
      name: "Daniel Wright",
      passwordHash: "hashed_password_123",
      role: "TRADER",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      bio: "High-frequency stock trading architect with 12+ years experience in C++ order matching engines and options volatility arbitrage.",
      title: "High-Frequency Equity Strategist",
      traderProfile: {
        create: {
          isCertified: true,
          certificationId: "TRD-773912",
          certifiedAt: new Date("2024-11-20"),
          grossRevenue: 42150.0,
          netRevenue: 33720.0,
          rating: 4.95,
          expertise: "High-Frequency Stock Execution",
        },
      },
    },
  });

  const sophiaUser = await prisma.user.create({
    data: {
      email: "sophia.chen@trader.io",
      name: "Sophia Chen",
      passwordHash: "hashed_password_123",
      role: "TRADER",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      bio: "Equity Portfolio Manager & Financial Analyst who has managed over $120M in tech stocks and equity derivatives.",
      title: "Equity Portfolio Manager",
      traderProfile: {
        create: {
          isCertified: true,
          certificationId: "TRD-482019",
          certifiedAt: new Date("2025-03-10"),
          grossRevenue: 18900.0,
          netRevenue: 15120.0,
          rating: 4.85,
          expertise: "Equity Research & DCF Valuation",
        },
      },
    },
  });

  const investorUser = await prisma.user.create({
    data: {
      email: "palash@investor.io",
      name: "Palash Shah",
      passwordHash: "hashed_password_123",
      role: "INVESTOR",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      investorProfile: {
        create: {
          totalHoursLearned: 27.5,
          activeCoursesCount: 12,
          learningProgressPercent: 48.0,
          totalCertificatesCount: 8,
        },
      },
    },
  });

  // Create Stock Courses
  const c1 = await prisma.course.create({
    data: {
      title: "QUANTITATIVE STOCK TRADING & ALGORITHMS",
      slug: "quantitative-stock-trading",
      description: "Learn how to build automated stock trading algorithms from scratch. Covers market microstructure, Level-2 order book execution, and Python backtesting.",
      category: "Stock Trading",
      price: 49.0,
      isSubscription: true,
      published: true,
      rating: 4.9,
      level: "Advanced",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      traderId: alexUser.traderProfile!.id,
    },
  });

  const c2 = await prisma.course.create({
    data: {
      title: "OPTIONS STRATEGIES & VOLATILITY SURFACES",
      slug: "options-strategies-volatility",
      description: "Master institutional options pricing, Greeks, volatility arbitrage, and risk-neutral hedging strategies.",
      category: "Options",
      price: 79.0,
      isSubscription: false,
      published: true,
      rating: 4.95,
      level: "Intermediate",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
      traderId: alexUser.traderProfile!.id,
    },
  });

  // Create Stock Digital Materials
  await prisma.material.create({
    data: {
      title: "Stock Market Backtesting Python Engine & Order Book Code",
      description: "Institutional-grade Python framework featuring Monte Carlo stock simulations, Sharpe ratio calculators, and Level-2 order book execution scripts.",
      category: "Stock Trading",
      price: 29.0,
      fileType: "ZIP Archive",
      downloadUrl: "/downloads/stock-backtest-engine.zip",
      fileSizeMb: 14.2,
      downloadsCount: 842,
      traderId: alexUser.traderProfile!.id,
    },
  });

  await prisma.material.create({
    data: {
      title: "Options Pricing & Black-Scholes Model Excel Workbook",
      description: "Complete options valuation spreadsheet with dynamic volatility surface charts, Delta/Gamma risk meters, and earnings straddle models.",
      category: "Options",
      price: 39.0,
      fileType: "XLSX Workbook",
      downloadUrl: "/downloads/options-pricing-model.xlsx",
      fileSizeMb: 19.5,
      downloadsCount: 930,
      traderId: alexUser.traderProfile!.id,
    },
  });

  // Create Live Stock Webinars
  await prisma.webinar.create({
    data: {
      title: "Live US Stock Market Open Trading Session",
      description: "Watch Alex Morgan trade the US stock market open live. Real-time order book execution, equity breakouts, and voice Q&A.",
      date: "TODAY",
      startTime: "19:30 UTC",
      durationMinutes: 90,
      price: 15.0,
      maxAttendees: 500,
      filledSeats: 124,
      status: "LIVE",
      meetingUrl: "https://stream.markets.io/w1",
      thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
      traderId: alexUser.traderProfile!.id,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
