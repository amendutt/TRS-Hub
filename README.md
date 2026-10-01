# TRS Hub 2

TRS Hub is a React and TypeScript storefront with an Express API, MySQL persistence, role-based administration, and optional Stripe Checkout. Customer and employee accounts authenticate against the application database; local development also supports a temporary in-memory Super Admin mode. Firebase Authentication is not used.

## Features

- Storefront accounts with email/password registration and sign-in.
- Scrypt password hashing and random, expiring database sessions.
- Customer profiles with saved addresses and wishlists.
- Super Admin provisioning of employees, operational roles, and per-module permissions.
- Server-side authorization for admin reads, writes, refunds, and employee management.
- Product, inventory, order, review, promotion, and store-content management.
- Product image upload with previews and JPG, PNG, and WebP validation.
- Cash on Delivery and USD Stripe Checkout, with server-side price calculation and webhook verification.

## Requirements

- Node.js 22 or newer and npm.
- MySQL 8 with a database and user that can create and alter tables.
- Stripe account and webhook secret only if enabling card checkout.

## Local Setup

1. Install packages:

	```powershell
	npm install
	```

2. Create a MySQL database and a user with access to it.
3. Copy the example environment file and edit the values. In PowerShell:

	```powershell
	Copy-Item .env.example .env
	```

4. Set `MYSQL_URL`, `SUPER_ADMIN_EMAIL`, and a unique `SUPER_ADMIN_PASSWORD` of at least 12 characters. The API creates its tables when it starts; the seed command also creates the tables if needed.
5. Create the first Super Admin once:

	```powershell
	npm run seed:demo-admin
	```

	The command will not replace an existing account and does not print the password.
6. Start the API and Vite development server:

	```powershell
	npm run dev
	```

	Open `http://localhost:3000`. Vite proxies `/api` requests to the Express API on port `3002`. Sign in to the admin portal with the Super Admin credentials. On its first successful sign-in, the bundled initial store data is persisted to MySQL.

	For a quick local UI run, the API supports a development-only fallback when `MYSQL_URL` is empty or still contains `change-me`. In that mode, the Super Admin credentials from `.env` authenticate in memory and admin state lasts until the API restarts. Production and any local setup with a real `MYSQL_URL` remain database-only.

	If the admin screen shows `Request failed (502)`, the API is not running. The most common cause is the example `MYSQL_URL` still pointing to `havn_user:change-me@127.0.0.1`. Create the MySQL database and user first, replace that URL in `.env`, then restart `npm run dev`. A 502 is a backend connection problem, not an invalid admin password.

For local development, set `APP_URL=http://localhost:3000`. It is needed for Stripe redirect URLs when testing card checkout. A real `MYSQL_URL` enables persistent database-backed authentication; without it or with the example URL, local development uses the temporary demo Super Admin mode.

## Admin Sign-In

Open the Admin Portal and use the email and password configured as `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in your private `.env` file. The example email is `admin@example.com`; choose your own unique password in `.env`. No reusable admin password is shipped in this repository. In local demo mode, these values authenticate the temporary in-memory Super Admin. With MySQL configured, run `npm run seed:demo-admin` once to create the database-backed Super Admin. The seed command will not overwrite an existing account or recover its password.

## Environment Variables

Copy `.env.example` to `.env`. Keep `.env` and `.env.local` private; both are ignored by Git. `.env.example` is the only environment file intended for GitHub, and it must contain placeholders only.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Express port; defaults to `3002`. |
| `APP_URL` | For Stripe | Public storefront origin used to form Checkout return URLs. |
| `MYSQL_URL` | Yes | MySQL connection URL, for example `mysql://user:password@host:3306/database`. |
| `SUPER_ADMIN_EMAIL` | For initial setup | Email address for the first Super Admin account. |
| `SUPER_ADMIN_PASSWORD` | For initial setup | Unique initial password, 12 to 128 characters. Do not reuse an example value. |
| `SUPER_ADMIN_NAME` | No | Initial account display name; defaults to `Super Admin`. |
| `STRIPE_SECRET_KEY` | For card checkout | Stripe secret API key. Use a test key during development. |
| `STRIPE_WEBHOOK_SECRET` | For card checkout | Signing secret for the Stripe webhook endpoint. |
| `GEMINI_API_KEY` | No | Optional key for any enabled Gemini integration. |

Do not add secrets to `VITE_*` variables: values prefixed with `VITE_` are exposed to browser code.

## Accounts And Access

With MySQL configured, customer and employee authentication uses database accounts. In local demo mode, the configured Super Admin signs in using in-memory sessions. Passwords for database accounts are hashed with Node.js `scrypt`; database session tokens are random, expire after seven days, and are stored in MySQL as hashes. Authentication endpoints are rate-limited. Third-party sign-in, phone OTP, and email-based password reset are not configured.

The first database-backed Super Admin is created by `npm run seed:demo-admin`. Only a Super Admin can create or manage employee accounts. Employee setup includes a name, email, initial password, and one of these roles: `Catalog Manager`, `Order Fulfillment`, or `Customer Support`. The Super Admin can grant individual module permissions: dashboard, catalog, inventory, orders, customers, reviews, marketing, reports, settings, and audit logs. Authorization is checked by the API; hiding a module in the UI is not the security boundary. Deactivating an employee disables the account and revokes its active sessions. Local demo mode supports only the configured Super Admin; employee management requires MySQL.

## Database And Existing Accounts

The API creates the account, session, customer profile, store state, and order tables at startup. It adds an `account_id` column to an existing `store_orders` table when needed.

Accounts and passwords from the previous authentication provider cannot be converted into database accounts. Customers and employees must register or be recreated by the Super Admin. Existing saved addresses and wishlists are not automatically linked to newly created accounts. Back up MySQL before deploying schema changes; retain legacy tables until their data has been reviewed and migrated separately.

## Payments

Cash on Delivery works without Stripe. Card checkout requires `APP_URL`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`. Register this webhook endpoint in Stripe:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

Subscribe it to `checkout.session.completed`, `checkout.session.expired`, and `checkout.session.async_payment_failed`. The server recalculates prices, shipping, tax, discounts, and stock from persisted store data; it does not trust the browser's displayed total. The current payment implementation supports USD, Stripe card checkout, partial or full Stripe refunds by an authorized admin, and Cash on Delivery. UPI, net banking, and other settlement currencies are not implemented.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API and Vite development server. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Build the production frontend into `dist/`. |
| `npm start` | Start Express; serves the API and built frontend. |
| `npm run seed:demo-admin` | Create the initial Super Admin using `.env` values. |

## Production Deployment

Deploy the Node.js service with a managed MySQL database and HTTPS. Configure environment variables in the hosting provider's secret manager, build with `npm run build`, and start with `npm start`. The service must route `/api/*` and the site root to Express. Run `npm run seed:demo-admin` once against the production database before first admin sign-in. Do not expose the seed password in build logs or commit it to the repository.

The included `railway.json` configures the build command, start command, health check, and restart policy for Railway. Set `MYSQL_URL`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and `APP_URL` in Railway variables. Add Stripe secrets and configure the webhook only when card checkout is enabled. For a custom domain, use the DNS records provided by Railway, enable TLS, then update `APP_URL` and the Stripe webhook URL.

## Before Pushing To GitHub

- Confirm `.env`, `.env.local`, credentials, and Stripe secrets are not staged.
- Keep `.env.example` limited to safe placeholders.
- Run `npm run lint` and `npm run build`.
- Review `git status --short` and the staged diff before pushing.

## Operational Notes

- Require HTTPS in production and use a unique database password with TLS and backups.
- Choose a unique Super Admin password and rotate it if it has been exposed.
- Password recovery and transactional email require an email provider; this API does not send those messages.
- Before going live, test customer sign-in, admin authorization with allowed and disallowed accounts, COD orders, successful and abandoned Stripe test payments, webhook retries, inventory changes, and order fulfillment.
- Configure privacy, returns, tax, shipping, and customer support policies for the regions where the store operates.

## Important Limits

The payment API supports USD Stripe card payments, partial or full Stripe refunds, and Cash on Delivery. UPI, net banking, and non-USD settlement are not implemented. Saved addresses and wishlists require database-backed accounts. Transactional email notifications require an email provider and are not dispatched by the API.
