# Crypto Wallet Backend Service

## Overview
This service provides functionality for:
- Fetching cryptocurrency statistics from Binance.
- Creating and managing personal crypto wallets.
- Internal transfers and transactions.
- Wallet top-ups.
- User authentication, including registration, password reset, and login.

## Core Technologies
- **Fastify**: High-performance backend framework.
- **PostgreSQL**: Relational database for storing application data.
- **Prisma**: ORM for database interaction.
- **Pino**: Logging library for structured logs.
- **SendGrid**: Email service for password recovery and notifications.
- **JWT**: Authentication mechanism.
- **Axios**: HTTP client for external API communication
- **TypeScript**: Strongly-typed language for safer code.

## Prerequisites
- Node.js >= 16.x
- pnpm (Package Manager)
- PostgreSQL database instance

## Installation
1. Clone the repository:
   ```bash
   git clone <https://github.com/nstxwallet/api.git>
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables in a `.env` file:
   ```env
   SENDGRID_API_KEY=<your-sendgrid-api-key>
   DATABASE_URL=<your-database-url>
   JWT_SECRET=<your-jwt-secret>
   ```

4. Generate Prisma client and sync database:
   ```bash
    npx prisma format
    npx prisma generate
    npx prisma db push
   ```

## Usage
### Development
Start the development server:
```bash
pnpm run dev
```

## API Endpoints
### User Management
- **POST /login**: Log in with email and password.
- **POST /sign-up**: Log in with email and password.
- **POST /users/me**: Get user token.
- **POST /reset-password/request**: Request password reset.
- **POST /reset-password/confirm**: Confirm password reset.

### Wallet Management
- **GET /balances**: Get all wallet balances.
- **GET /balances/:id**: Get wallet balance by ID.
- **POST /balances/create**: Create a new wallet.

### Transactions
- **GET /transactions**: Retrieve all transactions.
- **GET /transaction/:id**: Get details of a specific transaction.
- **GET /transactions/currency/:currency**: Update a transaction.
- **POST /transactions/transfer**: Create a new transaction.

### Binance Integration
- **GET /prices**: Get current prices of cryptocurrencies.



## Environment Variables
Ensure the following environment variables are set:
- `SENDGRID_API_KEY`: API key for SendGrid.
- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: Secret key for JWT authentication.

## Logging
Logs are handled by **Pino**, which outputs structured and readable logs for debugging and production monitoring.


