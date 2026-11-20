import { PrismaClient, Currency, TransactionStatus, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const passwordHash = bcrypt.hashSync("password123", SALT_ROUNDS);

  // Users
  const user1 = await prisma.user.upsert({
    where: { email: "demo@nstx.com" },
    update: {},
    create: {
      email: "demo@nstx.com",
      passwordHash,
      firstName: "Demo",
      lastName: "User",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      passwordHash,
      firstName: "Alice",
      lastName: "Smith",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      passwordHash,
      firstName: "Bob",
      lastName: "Jones",
    },
  });

  const users = [user1, user2, user3];

  // Balances for each user (USD, BTC, ETH, USDT)
  const currencies: Currency[] = [Currency.USD, Currency.BTC, Currency.ETH, Currency.USDT];
  for (const user of users) {
    const existing = await prisma.balance.findMany({ where: { userId: user.id } });
    if (existing.length > 0) continue;
    await prisma.balance.createMany({
      data: [
        { userId: user.id, currency: Currency.USD, value: 10_000 + Math.random() * 5_000 },
        { userId: user.id, currency: Currency.BTC, value: 0.05 + Math.random() * 0.2 },
        { userId: user.id, currency: Currency.ETH, value: 0.5 + Math.random() * 2 },
        { userId: user.id, currency: Currency.USDT, value: 2_000 + Math.random() * 3_000 },
      ],
    });
  }

  // Transactions (deposits, withdrawals, a few per user)
  for (const user of users) {
    const count = await prisma.transaction.count({ where: { userId: user.id } });
    if (count > 0) continue;
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, status: TransactionStatus.completed, type: TransactionType.deposit, amount: 5000, currency: Currency.USD },
        { userId: user.id, status: TransactionStatus.completed, type: TransactionType.deposit, amount: 0.1, currency: Currency.BTC },
        { userId: user.id, status: TransactionStatus.completed, type: TransactionType.withdrawal, amount: 500, currency: Currency.USD },
        { userId: user.id, status: TransactionStatus.completed, type: TransactionType.trade, amount: 0.01, currency: Currency.BTC },
        { userId: user.id, status: TransactionStatus.pending, type: TransactionType.deposit, amount: 1000, currency: Currency.USDT },
      ],
    });
  }

  // Price (currency rates against the USD equivalent)
  const priceData: { currency: Currency; value: number }[] = [
    { currency: Currency.USD, value: 1 },
    { currency: Currency.BTC, value: 43_000 },
    { currency: Currency.ETH, value: 2_300 },
    { currency: Currency.USDT, value: 1 },
    { currency: Currency.BNB, value: 310 },
    { currency: Currency.SOL, value: 98 },
    { currency: Currency.XRP, value: 0.52 },
    { currency: Currency.LTC, value: 68 },
  ];

  for (const { currency, value } of priceData) {
    const existing = await prisma.price.findFirst({ where: { currency } });
    if (existing) {
      await prisma.price.update({ where: { id: existing.id }, data: { value } });
    } else {
      await prisma.price.create({ data: { currency, value } });
    }
  }

  // TickerPrice (used to render tickers)
  const tickers = [
    { symbol: "BTCUSDT", price: 43_000 },
    { symbol: "ETHUSDT", price: 2_300 },
    { symbol: "BNBUSDT", price: 310 },
    { symbol: "SOLUSDT", price: 98 },
  ];
  for (const t of tickers) {
    await prisma.tickerPrice.upsert({
      where: { symbol: t.symbol },
      update: { price: t.price },
      create: t,
    });
  }

  console.log("Seed completed: users, balances, transactions, prices, tickers.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
