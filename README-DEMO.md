# Demo User Credentials

This application includes a demo user feature that allows anyone to quickly try out the paper stock trading functionality without creating an account.

## Demo User Details

- **Email**: demo@papertrader.app
- **Password**: demo1234

## How to Access the Demo Account

1. Navigate to the login page
2. Click the "Try Demo Account" button (amber/yellow button)
3. You will be automatically logged in with the demo credentials

## Demo Account Features

The demo account comes pre-configured with:

- Initial balance of 10,000 virtual currency
- A default watchlist with at least one stock
- Sample portfolio with holdings in 1-2 stocks
- Transaction history showing previous purchases

## Implementation Details

The demo user is created through the `/api/demo/create-demo-user` endpoint, which:

1. Checks if the demo user already exists in the database
2. If not, creates a new user in Supabase Auth
3. Creates corresponding records in the database (User, Watchlist, Portfolio)
4. Adds sample data (watchlist items, transactions, portfolio items)

This ensures that the demo account is always available and has consistent data for demonstration purposes.

## Security Considerations

The demo account is intended for demonstration purposes only. While the credentials are publicly available, the account only has access to its own data and cannot affect other users' data.