# Skillora

Skillora is a production-style digital-products marketplace for selling downloadable resources with secure customer access and automated payments.

## Current build

- Premium responsive storefront with custom high-tech visual system
- Customer registration, login, logout and persistent purchase library
- PostgreSQL + Prisma commerce schema
- Product catalogue and admin product management API
- Admin workspace for creating products and uploading PDFs
- Private PDF storage with entitlement-checked downloads
- Razorpay test-mode order creation, signature verification and webhook fulfillment
- Server-side order/payment records and automatic entitlements
- Helmet, CORS, rate limiting and environment validation
- GitHub Actions typecheck/build pipeline

## Architecture

```text
apps/web  -> React + TypeScript + Vite
apps/api  -> Fastify + TypeScript
Database  -> PostgreSQL + Prisma
Payments  -> Razorpay
Files     -> private local storage in development; object storage can be swapped in for production
```

## Run on Windows

Requirements: Node.js 22+ and PostgreSQL.

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
npm run db:generate --workspace apps/api
npm run db:push --workspace apps/api
npm run db:seed --workspace apps/api
npm run dev
```

The web app runs on `http://localhost:5173` and the API on `http://localhost:4000` by default.

The seed creates a development admin account:

- Email: `admin@skillora.local`
- Password: `ChangeMe123!`

Change the development password before using any shared environment.

## Razorpay setup

Development uses Razorpay Test Mode. Add the test credentials to `apps/api/.env`. Never commit the `.env` file or live keys.

Live payments require the account owner's Razorpay onboarding/KYC, bank verification and live API credentials. The application itself is designed to switch from test to live credentials without changing the checkout architecture.

## Security rules

- Never commit API keys, database passwords, JWT secrets or paid PDFs.
- Payment fulfillment is server-side and protected by signature verification.
- Webhook signatures are verified before granting entitlements.
- Paid PDF downloads require an authenticated account with a matching entitlement.
- Production should use private object storage rather than a local filesystem.
