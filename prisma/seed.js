/**
 * Database Seed Script
 * 
 * This script populates the database with initial data after a reset.
 * It creates essential records like admin users, default stocks, and system settings.
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        balance: 100000,
        isActive: true,
        createdAt: new Date(),
      },
    });
    console.log(`Admin user created with ID: ${adminUser.id}`);
    
    // Create demo user
    console.log('Creating demo user...');
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'USER',
        balance: 10000,
        isActive: true,
        createdAt: new Date(),
      },
    });
    console.log(`Demo user created with ID: ${demoUser.id}`);
    
    // Create some sample stocks
    console.log('Creating sample stocks...');
    const stocksData = [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        currentPrice: 2500.50,
        previousClose: 2480.75,
        change: 19.75,
        changePercent: 0.80,
        volume: 5000000,
        marketCap: 1690000000000,
        sector: 'Oil & Gas',
        exchange: 'NSE',
        isF_O_Available: true,
        lotSize: 250,
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Ltd',
        currentPrice: 3450.25,
        previousClose: 3420.50,
        change: 29.75,
        changePercent: 0.87,
        volume: 1200000,
        marketCap: 1260000000000,
        sector: 'IT',
        exchange: 'NSE',
        isF_O_Available: true,
        lotSize: 150,
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd',
        currentPrice: 1650.75,
        previousClose: 1645.25,
        change: 5.50,
        changePercent: 0.33,
        volume: 3500000,
        marketCap: 920000000000,
        sector: 'Banking',
        exchange: 'NSE',
        isF_O_Available: true,
        lotSize: 500,
      },
      {
        symbol: 'INFY',
        name: 'Infosys Ltd',
        currentPrice: 1450.50,
        previousClose: 1440.25,
        change: 10.25,
        changePercent: 0.71,
        volume: 2800000,
        marketCap: 610000000000,
        sector: 'IT',
        exchange: 'NSE',
        isF_O_Available: true,
        lotSize: 300,
      },
      {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors Ltd',
        currentPrice: 520.75,
        previousClose: 515.50,
        change: 5.25,
        changePercent: 1.02,
        volume: 8500000,
        marketCap: 175000000000,
        sector: 'Automobile',
        exchange: 'NSE',
        isF_O_Available: true,
        lotSize: 1425,
      },
    ];
    
    for (const stockData of stocksData) {
      const stock = await prisma.stock.upsert({
        where: { symbol: stockData.symbol },
        update: stockData,
        create: {
          ...stockData,
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      });
      console.log(`Stock created: ${stock.symbol}`);
    }
    
    // Create a default watchlist for the demo user
    console.log('Creating default watchlist...');
    const watchlist = await prisma.watchlist.create({
      data: {
        id: crypto.randomUUID(),
        name: 'My Watchlist',
        userId: demoUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Default watchlist created with ID: ${watchlist.id}`);
    
    // Add stocks to the watchlist
    console.log('Adding stocks to watchlist...');
    const stocks = await prisma.stock.findMany({
      take: 3, // Add first 3 stocks to watchlist
    });
    
    for (const stock of stocks) {
      await prisma.watchlistItem.create({
        data: {
          id: crypto.randomUUID(),
          watchlistId: watchlist.id,
          stockId: stock.id,
          addedAt: new Date(),
        },
      });
      console.log(`Added ${stock.symbol} to watchlist`);
    }
    
    // Create a portfolio for the demo user
    console.log('Creating default portfolio...');
    const portfolio = await prisma.portfolio.create({
      data: {
        id: crypto.randomUUID(),
        name: 'My Portfolio',
        userId: demoUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`Default portfolio created with ID: ${portfolio.id}`);
    
    // Add some stocks to the portfolio
    console.log('Adding stocks to portfolio...');
    const portfolioStocks = await prisma.stock.findMany({
      take: 2, // Add first 2 stocks to portfolio
    });
    
    for (const stock of portfolioStocks) {
      const quantity = Math.floor(Math.random() * 10) + 1;
      await prisma.portfolioItem.create({
        data: {
          id: crypto.randomUUID(),
          portfolioId: portfolio.id,
          stockId: stock.id,
          quantity: quantity,
          avgBuyPrice: stock.currentPrice * 0.95, // Bought at 5% less than current price
        },
      });
      
      // Create corresponding buy transactions
      await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          userId: demoUser.id,
          stockId: stock.id,
          type: 'BUY',
          orderType: 'MARKET',
          quantity: quantity,
          price: stock.currentPrice * 0.95,
          total: stock.currentPrice * 0.95 * quantity,
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      });
      
      console.log(`Added ${quantity} shares of ${stock.symbol} to portfolio`);
    }
    
    // Create system settings
    console.log('Creating system settings...');
    const settings = [
      {
        key: 'TRADING_HOURS_START',
        value: '09:15',
        description: 'Trading hours start time (24-hour format)',
      },
      {
        key: 'TRADING_HOURS_END',
        value: '15:30',
        description: 'Trading hours end time (24-hour format)',
      },
      {
        key: 'MAINTENANCE_MODE',
        value: 'false',
        description: 'Whether the system is in maintenance mode',
      },
      {
        key: 'MAX_ORDER_VALUE',
        value: '1000000',
        description: 'Maximum order value allowed per transaction',
      },
      {
        key: 'DEFAULT_COMMISSION',
        value: '0.05',
        description: 'Default commission percentage for trades',
      },
    ];
    
    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: setting,
        create: {
          id: crypto.randomUUID(),
          ...setting,
          updatedAt: new Date(),
        },
      });
      console.log(`System setting created: ${setting.key}`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });