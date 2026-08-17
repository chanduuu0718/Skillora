# Skillora

A premium digital-products marketplace for selling downloadable resources with secure user access and automated payments.

## Product vision

Skillora is being built as a production-style platform with:

- Premium, high-tech, accessible UI
- Customer accounts and authentication
- Product catalogue and product details
- Secure digital-product delivery
- Orders and purchase history
- Razorpay payment integration (test mode first)
- Webhook-driven payment confirmation
- Admin dashboard for products, files, orders and customers
- Responsive desktop/mobile experience
- SEO-ready public pages

## Planned architecture

- Web app: React + TypeScript + Vite
- API: Node.js + TypeScript
- Database: PostgreSQL + Prisma
- Authentication: secure session/JWT-based auth with server-side authorization
- Payments: Razorpay
- Digital files: private object/file storage; never committed to Git
- Validation: Zod
- UI: custom design system with Tailwind CSS and accessible primitives

## Security principles

- Never commit API keys, database passwords, JWT secrets, or paid PDFs.
- Payment confirmation is performed server-side and must not trust frontend success alone.
- Paid files are only accessible to authorized purchasers.
- Razorpay webhook signatures are verified before fulfilling orders.

## Environment variables

Keep secrets in local `.env` files or the deployment platform's secret manager. See the `.env.example` files when they are added.

## Development status

Initial repository foundation created. Feature implementation will proceed incrementally so each layer can be tested before moving to the next.
