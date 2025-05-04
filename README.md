# Paper Stock Trading PWA

A Progressive Web App (PWA) for paper stock trading, designed to be installable on Android devices. This application allows users to practice stock trading with virtual money in a realistic environment.

## Features

- **Next.js Pages Router**: Utilizes the traditional routing system of Next.js for easy navigation and page management.
- **Tailwind CSS**: A utility-first CSS framework that provides low-level utility classes to build custom designs quickly and efficiently.
- **Context API**: Implements React's Context API for efficient global state management.
- **PWA Configuration**: Configured as a Progressive Web App for installation on Android devices.
- **Supabase Authentication**: User authentication with email/password, magic link, and Google OAuth.
- **Prisma ORM**: Database management with Prisma for stocks, watchlists, portfolios, and transactions.
- **Paper Trading**: Virtual stock trading with real-time price simulation.
- **Demo Account**: Quick access demo account for trying the app without registration.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `pages/`: Contains all the pages of the application
- `components/`: Reusable React components
- `contexts/`: Global state management using Context API
- `hooks/`: Custom React hooks
- `styles/`: Global style (global.css)
- `utils/`: Utility functions and helpers

## Demo User

For quick access to the application without registration, you can use the demo account:

- **Email**: demo@papertrader.app
- **Password**: demo1234

Alternatively, click the "Try Demo Account" button on the login page for automatic login.

The demo account comes pre-configured with:
- Initial balance of 10,000 virtual currency
- A default watchlist with sample stocks
- Sample portfolio with stock holdings
- Transaction history showing previous trades

For more details about the demo user implementation, see [README-DEMO.md](README-DEMO.md).

## Learn More

To learn more about the technologies used in this application, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Context API](https://reactjs.org/docs/context.html)
- [Supabase Documentation](https://supabase.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
