-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "avatarUrl" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousClose" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION,
    "sector" TEXT,
    "exchange" TEXT NOT NULL DEFAULT 'NSE',
    "isF_O_Available" BOOLEAN NOT NULL DEFAULT false,
    "lotSize" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL DEFAULT '',
    "stockId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgBuyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orderType" TEXT NOT NULL DEFAULT 'MARKET',
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "limitPrice" DOUBLE PRECISION,
    "stopPrice" DOUBLE PRECISION,
    "expiryDate" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuturesContract" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "contractPrice" DOUBLE PRECISION NOT NULL,
    "marginRequired" DOUBLE PRECISION NOT NULL,
    "openInterest" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuturesContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionsContract" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strikePrice" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "premiumPrice" DOUBLE PRECISION NOT NULL,
    "openInterest" INTEGER NOT NULL,
    "impliedVolatility" DOUBLE PRECISION NOT NULL,
    "delta" DOUBLE PRECISION,
    "gamma" DOUBLE PRECISION,
    "theta" DOUBLE PRECISION,
    "vega" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionsContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuturesPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "futuresContractId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuturesPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionsPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionsContractId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionsPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxPositionSize" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION,
    "riskPerTrade" DOUBLE PRECISION,
    "stopLossDefault" DOUBLE PRECISION,
    "takeProfitDefault" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BracketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDetail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "panNumber" TEXT,
    "aadharNumber" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "documentType" TEXT NOT NULL,
    "documentFront" TEXT NOT NULL,
    "documentBack" TEXT,
    "selfie" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReport" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "totalExposure" DOUBLE PRECISION NOT NULL,
    "equityExposure" DOUBLE PRECISION NOT NULL,
    "fnoExposure" DOUBLE PRECISION NOT NULL,
    "marginUtilized" DOUBLE PRECISION NOT NULL,
    "riskRatio" DOUBLE PRECISION NOT NULL,
    "details" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "userId" TEXT,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketHours" (
    "id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MarketHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketHoliday" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MarketHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_stockId_key" ON "WatchlistItem"("watchlistId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_portfolioId_stockId_key" ON "PortfolioItem"("portfolioId", "stockId");

-- CreateIndex
CREATE UNIQUE INDEX "FuturesPosition_userId_futuresContractId_key" ON "FuturesPosition"("userId", "futuresContractId");

-- CreateIndex
CREATE UNIQUE INDEX "OptionsPosition_userId_optionsContractId_key" ON "OptionsPosition"("userId", "optionsContractId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskProfile_userId_key" ON "RiskProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KycDetail_userId_key" ON "KycDetail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketHours_exchange_key" ON "MarketHours"("exchange");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_type_key" ON "NotificationTemplate"("type");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuturesContract" ADD CONSTRAINT "FuturesContract_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionsContract" ADD CONSTRAINT "OptionsContract_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuturesPosition" ADD CONSTRAINT "FuturesPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuturesPosition" ADD CONSTRAINT "FuturesPosition_futuresContractId_fkey" FOREIGN KEY ("futuresContractId") REFERENCES "FuturesContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionsPosition" ADD CONSTRAINT "OptionsPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionsPosition" ADD CONSTRAINT "OptionsPosition_optionsContractId_fkey" FOREIGN KEY ("optionsContractId") REFERENCES "OptionsContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskProfile" ADD CONSTRAINT "RiskProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAlert" ADD CONSTRAINT "OrderAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAlert" ADD CONSTRAINT "OrderAlert_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketOrder" ADD CONSTRAINT "BracketOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketOrder" ADD CONSTRAINT "BracketOrder_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDetail" ADD CONSTRAINT "KycDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketHoliday" ADD CONSTRAINT "MarketHoliday_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MarketHours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;