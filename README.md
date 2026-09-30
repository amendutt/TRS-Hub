# TRS Hub 2

TRS Hub is a React storefront served by an Express API. The API stores store configuration and orders in MySQL, verifies Firebase identities, and creates Stripe Checkout sessions. Payment is confirmed by a signed Stripe webhook and server-side session verification.

## Local Setup

Prerequisites: Node.js 22 or newer, MySQL 8, a Firebase project, and a Stripe account for card checkout.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in the configuration below.
3. Create a MySQL database and user matching `MYSQL_URL`.
4. Run `npm run dev`; Vite serves on port 3000 (or the next available port) and proxies API requests to Express on port 3002. Set `APP_URL` to the actual Vite origin when testing Stripe redirects locally.
5. Sign in to the admin portal with an email listed in `ADMIN_EMAILS`. On first admin sign-in, the bundled catalog is saved as the initial store state.

The frontend remains viewable without credentials, but account sign-in, persistence, and checkout require the corresponding services to be configured.

## Configuration

`MYSQL_URL` is a MySQL connection URL. Use a managed database with TLS and backups for production. The API creates its tables on startup.

Create a Firebase project and web app. Enable Google, Email/Password, and Phone Authentication. Add localhost for development and your final domain to the Firebase authorized domains. Set the five `VITE_FIREBASE_*` values from the Firebase web app config. `FIREBASE_SERVICE_ACCOUNT_JSON` is the Firebase Admin service-account JSON on one line. Never expose that service account or payment secrets to browser variables.

Set `ADMIN_EMAILS` to a comma-separated list of verified Google account emails. The server checks this allowlist for every admin state read and write. Customer and admin sign-in share Firebase, but only allowlisted verified emails can access the admin API.

This checkout implementation supports USD Stripe card payments and Cash on Delivery. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; use test keys until the store is approved for live payments. Register `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.expired`, and `checkout.session.async_payment_failed`. Keep `APP_URL` equal to the public HTTPS origin. The server recomputes prices, shipping, tax, discounts, and stock from persisted store data; the browser's displayed total is not trusted.

`GEMINI_API_KEY` is optional and only needed for the existing AI feature.

## Production Deployment

Deploy as a Node.js web service with persistent HTTPS ingress and a managed MySQL database. Configure the environment variables above in the hosting provider's secret manager, set `APP_URL` to the final HTTPS domain, and set the Firebase authorized domain and Stripe webhook URL to that same domain.

Build with `npm run build`; start with `npm start`. The Express process serves both the API and the generated `dist` frontend. The hosting platform must route the root domain and `/api/*` paths to this process, and must support long-running Node.js services. Point the domain's DNS records to the hosting provider and enable its TLS certificate before accepting payments.

### Railway

The repository includes `railway.json` for the build command, start command, health check, and restart policy. To deploy, connect this GitHub repository to a Railway project and add a MySQL service. In the app service variables, set `MYSQL_URL` to the MySQL service's connection URL, then add the Firebase Admin service-account JSON, Firebase web app values, `ADMIN_EMAILS`, and Stripe keys from your own provider accounts. Do not commit secret values to the repository.

Generate a Railway HTTPS domain and set `APP_URL` to that exact origin. Add the domain to Firebase Authentication's authorized domains and configure Stripe's webhook URL as `https://YOUR_DOMAIN/api/webhooks/stripe`. For a custom domain, add it in Railway and apply the DNS records shown in Railway's domain settings; DNS targets differ by domain/host and cannot be prefilled here. After TLS is active, update `APP_URL`, the Firebase authorized domain list, and the Stripe webhook endpoint to the custom domain.

Before going live, test customer Google/email/phone sign-in, admin authorization with both allowed and disallowed accounts, COD orders, successful and abandoned Stripe test payments, webhook retries, inventory changes, and order fulfillment from the admin portal. Configure privacy, returns, tax, shipping, and customer support policies for the countries where you sell.

## Important Limits

The payment API supports USD Stripe card payments, partial/full Stripe refunds by an allowlisted admin, and COD. UPI, net banking, and non-USD settlement are not implemented. Saved customer addresses and wishlists are stored against Firebase accounts in MySQL. Transactional email notifications still require an email provider and are not yet dispatched by the API.
