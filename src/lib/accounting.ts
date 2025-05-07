/**
 * Utility functions for accounting and financial calculations
 */

/**
 * Rounds a number to 2 decimal places to avoid floating point issues
 * @param value The number to round
 * @returns The rounded number
 */
export function roundCurrency(value: number): number {
  return parseFloat(value.toFixed(2));
}

/**
 * Calculates the total value of a stock transaction
 * @param price The price per share
 * @param quantity The number of shares
 * @returns The total value of the transaction
 */
export function calculateTransactionTotal(price: number, quantity: number): number {
  return roundCurrency(price * quantity);
}

/**
 * Calculates the new average buy price when adding to an existing position
 * @param currentAvgPrice Current average price
 * @param currentQuantity Current quantity
 * @param newPrice Price of new shares
 * @param newQuantity Quantity of new shares
 * @returns The new average buy price
 */
export function calculateNewAverageBuyPrice(
  currentAvgPrice: number,
  currentQuantity: number,
  newPrice: number,
  newQuantity: number
): number {
  const totalValue = roundCurrency(currentAvgPrice * currentQuantity + newPrice * newQuantity);
  const totalQuantity = currentQuantity + newQuantity;
  return roundCurrency(totalValue / totalQuantity);
}

/**
 * Calculates the profit/loss for a stock transaction
 * @param buyPrice The price at which the stock was bought
 * @param sellPrice The price at which the stock was sold
 * @param quantity The number of shares
 * @returns The profit/loss amount
 */
export function calculateProfitLoss(buyPrice: number, sellPrice: number, quantity: number): number {
  return roundCurrency((sellPrice - buyPrice) * quantity);
}

/**
 * Calculates the required margin for a futures contract
 * @param contractPrice The price of the futures contract
 * @param lotSize The lot size of the contract
 * @param marginPercentage The margin percentage required (e.g., 0.2 for 20%)
 * @returns The margin required
 */
export function calculateFuturesMargin(
  contractPrice: number,
  lotSize: number,
  marginPercentage: number
): number {
  return roundCurrency(contractPrice * lotSize * marginPercentage);
}

/**
 * Calculates the total premium for an options contract
 * @param premiumPrice The premium price per share
 * @param lotSize The lot size of the contract
 * @param quantity The number of lots
 * @returns The total premium
 */
export function calculateOptionsPremium(
  premiumPrice: number,
  lotSize: number,
  quantity: number
): number {
  return roundCurrency(premiumPrice * lotSize * quantity);
}

/**
 * Calculates the profit/loss for a futures position
 * @param entryPrice The price at which the position was entered
 * @param currentPrice The current price of the contract
 * @param lotSize The lot size of the contract
 * @param quantity The number of lots
 * @returns The profit/loss amount
 */
export function calculateFuturesPnL(
  entryPrice: number,
  currentPrice: number,
  lotSize: number,
  quantity: number
): number {
  return roundCurrency((currentPrice - entryPrice) * lotSize * quantity);
}

/**
 * Calculates the profit/loss for an options position
 * @param entryPrice The premium at which the position was entered
 * @param currentPrice The current premium of the contract
 * @param lotSize The lot size of the contract
 * @param quantity The number of lots
 * @returns The profit/loss amount
 */
export function calculateOptionsPnL(
  entryPrice: number,
  currentPrice: number,
  lotSize: number,
  quantity: number
): number {
  return roundCurrency((currentPrice - entryPrice) * lotSize * quantity);
}

/**
 * Validates if a user has sufficient balance for a transaction
 * @param userBalance The user's current balance
 * @param transactionAmount The amount of the transaction
 * @returns True if the user has sufficient balance, false otherwise
 */
export function hasSufficientBalance(userBalance: number, transactionAmount: number): boolean {
  return userBalance >= transactionAmount;
}

/**
 * Validates if a user has sufficient shares for a sell transaction
 * @param sharesOwned The number of shares owned
 * @param sharesToSell The number of shares to sell
 * @returns True if the user has sufficient shares, false otherwise
 */
export function hasSufficientShares(sharesOwned: number, sharesToSell: number): boolean {
  return sharesOwned >= sharesToSell;
}

/**
 * Calculates the portfolio value based on current stock prices
 * @param portfolioItems Array of portfolio items with quantity and current price
 * @returns The total portfolio value
 */
export function calculatePortfolioValue(
  portfolioItems: Array<{ quantity: number; stock: { currentPrice: number } }>
): number {
  return roundCurrency(
    portfolioItems.reduce((total, item) => {
      return total + item.quantity * item.stock.currentPrice;
    }, 0)
  );
}

/**
 * Calculates the total margin used for all futures positions
 * @param futuresPositions Array of futures positions
 * @returns The total margin used
 */
export function calculateTotalMarginUsed(
  futuresPositions: Array<{ margin: number }>
): number {
  return roundCurrency(
    futuresPositions.reduce((total, position) => {
      return total + position.margin;
    }, 0)
  );
}

/**
 * Calculates the total profit/loss for all positions
 * @param positions Array of positions with pnl values
 * @returns The total profit/loss
 */
export function calculateTotalPnL(positions: Array<{ pnl: number }>): number {
  return roundCurrency(
    positions.reduce((total, position) => {
      return total + position.pnl;
    }, 0)
  );
}

/**
 * Validates a transaction input
 * @param stockId The stock ID
 * @param type The transaction type (BUY/SELL)
 * @param quantity The quantity
 * @returns An error message if validation fails, null otherwise
 */
export function validateTransactionInput(
  stockId: string | undefined,
  type: string | undefined,
  quantity: number | undefined
): string | null {
  if (!stockId) {
    return 'Stock ID is required';
  }

  if (!type || !['BUY', 'SELL'].includes(type)) {
    return 'Type must be BUY or SELL';
  }

  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return 'Quantity must be a positive integer';
  }

  return null;
}