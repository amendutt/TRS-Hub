# TRS Hub API Reference

This reference documents the HTTP API implemented by the Express server in `server/src/`. Examples use JSON unless stated otherwise. Replace `http://localhost:3002` with the deployed API origin.

## Conventions

- API paths start with `/api`.
- Send `Content-Type: application/json` with JSON request bodies.
- Protected endpoints use `Authorization: Bearer <session-token>`. Tokens are returned by registration and login.
- Unless stated otherwise, errors are JSON in the form `{ "error": "..." }`.
- Database-backed sessions expire after seven days. Signing out revokes the current token.
- Registration, login, profile lookup, and profile update share a rate limit of 30 requests per minute per client.
- The JSON request body limit is 4 MB; the Stripe webhook accepts Stripe's raw request body instead.
- Prices, discounts, tax, shipping, and stock for checkout are calculated by the server from saved store data, not trusted from the request.

## Endpoint index

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API/database health |
| `POST` | `/api/auth/register` | Public | Create a customer account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `POST` | `/api/auth/logout` | Public | Revoke the supplied session |
| `GET` | `/api/auth/me` | Customer or admin session | Get the current account and profile |
| `PUT` | `/api/auth/profile` | Customer or admin session | Save addresses and wishlist |
| `GET` | `/api/store/state` | Public | Get published storefront data |
| `GET` | `/api/admin/state` | Admin session | Load admin state filtered by permissions |
| `PUT` | `/api/admin/state` | Admin session | Save store state |
| `GET` | `/api/admin/backup` | Super Admin | Download a JSON backup |
| `GET` | `/api/admin/employees` | Super Admin | List employees |
| `POST` | `/api/admin/employees` | Super Admin | Create an employee |
| `PUT` | `/api/admin/employees/:id` | Super Admin | Update and activate an employee |
| `DELETE` | `/api/admin/employees/:id` | Super Admin | Deactivate an employee |
| `POST` | `/api/payments/checkout` | Customer or admin session | Create a COD order or Stripe Checkout session |
| `POST` | `/api/payments/confirm` | Customer or admin session | Verify a completed Stripe payment |
| `GET` | `/api/payments/orders` | Customer or admin session | List the signed-in account's orders |
| `POST` | `/api/payments/admin/refund` | Super Admin or `orders` permission | Refund a paid Stripe order |
| `POST` | `/api/webhooks/stripe` | Stripe signature | Process Stripe Checkout events |

## Health

### `GET /api/health`

No request body or authentication required.

MySQL-backed success:

```json
{ "status": "ok" }
```

Local demo mode success:

```json
{ "status": "demo", "database": "in-memory" }
```

Database unavailable: `503`

```json
{ "status": "unavailable" }
```

## Authentication and customer profile

### `POST /api/auth/register`

Create a customer account. Password must contain 12–128 characters; name must contain 1–160 characters; email must be valid and at most 254 characters. Email is stored in lowercase.

Request:

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "use-a-private-password"
}
```

Success: `201 Created`

```json
{
  "token": "<session-token>",
  "user": {
    "uid": "<account-uuid>",
    "email": "asha@example.com",
    "displayName": "Asha Sharma",
    "phoneNumber": null,
    "isAdmin": false,
    "isRootAdmin": false,
    "adminRole": null,
    "adminPermissions": [],
    "savedAddresses": [],
    "wishlist": []
  }
}
```

Errors: `400` invalid input, `409` email already registered, `503` account creation unavailable.

### `POST /api/auth/login`

Request:

```json
{
  "email": "asha@example.com",
  "password": "use-a-private-password"
}
```

Success:

```json
{
  "token": "<session-token>",
  "user": {
    "uid": "<account-uuid>",
    "email": "asha@example.com",
    "displayName": "Asha Sharma"
  }
}
```

Errors: `400` invalid input, `401` invalid credentials, `503` sign-in unavailable. In local demo mode, login accepts only the configured Super Admin credentials.

### `POST /api/auth/logout`

The server revokes the bearer token when one is supplied. The endpoint does not require a valid session to return success.

Request header:

```http
Authorization: Bearer <session-token>
```

Success:

```json
{ "signedOut": true }
```

### `GET /api/auth/me`

Requires a valid bearer token. Returns the current account, admin access (if applicable), and saved customer profile.

Success:

```json
{
  "uid": "<account-uuid>",
  "email": "asha@example.com",
  "displayName": "Asha Sharma",
  "phoneNumber": null,
  "isAdmin": false,
  "isRootAdmin": false,
  "adminRole": null,
  "adminPermissions": [],
  "savedAddresses": [],
  "wishlist": []
}
```

Errors: `401` missing, invalid, or expired session.

### `PUT /api/auth/profile`

Requires a valid bearer token and a database-backed account. Address list is limited to 20; wishlist to 100 product IDs. At most one address may have `isDefault: true`. Address strings are trimmed and length-limited by the API. Wishlist IDs are retained only when they match published products.

Request:

```json
{
  "savedAddresses": [
    {
      "id": "<address-uuid>",
      "label": "Home",
      "firstName": "Asha",
      "lastName": "Sharma",
      "address": "10 Example Road",
      "city": "Bengaluru",
      "pincode": "560001",
      "phone": "+910000000000",
      "isDefault": true
    }
  ],
  "wishlist": ["<published-product-id>"]
}
```

Success:

```json
{
  "savedAddresses": [
    {
      "id": "<address-uuid>",
      "label": "Home",
      "firstName": "Asha",
      "lastName": "Sharma",
      "address": "10 Example Road",
      "city": "Bengaluru",
      "pincode": "560001",
      "phone": "+910000000000",
      "isDefault": true
    }
  ],
  "wishlist": ["<published-product-id>"]
}
```

Errors: `400` invalid profile or more than one default address, `401` unauthorized or profile persistence unavailable.

## Storefront

### `GET /api/store/state`

No authentication or request body required. Only published products and approved reviews, active categories and banners, the active logo version, settings, site configuration, and static pages are exposed. Warehouse stock, low-stock thresholds, and review customer emails are omitted or redacted.

Success:

```json
{
  "state": {
    "versions": [],
    "settings": {},
    "products": [],
    "categories": [],
    "siteConfig": null,
    "banners": [],
    "staticPages": [],
    "reviews": []
  }
}
```

`state` is `null` if no public state is available or when the API runs in local demo mode. Errors: `503` store data is temporarily unavailable.

## Administration

Admin access requires a valid bearer token for a Super Admin or an active employee account. Employee access is checked on the server. Current module permission names are `dashboard`, `catalog`, `orders`, `customers`, `reviews`, `marketing`, `reports`, `logo_studio`, `settings`, `audit_logs`, and `inventory`; Super Admin access also includes `employees`.

### `GET /api/admin/state`

Requires admin access. Returns the store/admin state plus access metadata. For employees, data fields are filtered by granted permissions.

Success:

```json
{
  "state": {},
  "access": {
    "role": "Super Admin",
    "permissions": ["dashboard", "catalog", "orders", "employees"],
    "isRootAdmin": true
  }
}
```

`state` may be `null` before store data has been initialized. Errors: `401` invalid session, `403` account is not an admin.

### `PUT /api/admin/state`

Requires admin access. The request body must be a JSON object. Super Admins may save the full state; employee updates are merged only for fields their permissions authorize. This endpoint accepts the application's store-state object, not a partial patch document.

Request (illustrative subset; send the full state object used by the admin app):

```json
{
  "products": [],
  "categories": [],
  "orders": [],
  "customers": [],
  "settings": {}
}
```

Success:

```json
{ "saved": true }
```

Errors: `400` invalid state, `401` invalid session, `403` not an admin, `409` Super Admin must initialize the store before an employee can save.

### `GET /api/admin/backup`

Requires Super Admin access. No body. Returns a downloadable JSON file with a `Content-Disposition` filename. The backup includes store state, orders, accounts, and customer profiles. It contains sensitive customer data and excludes password hashes, sessions, and payment-provider IDs.

Success response shape:

```json
{
  "format": "trs-hub-backup",
  "version": 1,
  "exportedAt": "<ISO-8601 timestamp>",
  "includesSensitiveCustomerData": true,
  "excludes": [
    "password_hashes",
    "account_sessions",
    "payment_provider_ids"
  ],
  "data": {
    "storeState": {},
    "orders": [],
    "accounts": [],
    "customerProfiles": []
  }
}
```

Errors: `401` invalid session, `403` not a Super Admin, `503` backup could not be created.

### `GET /api/admin/employees`

Requires Super Admin access. No body.

Success:

```json
{
  "employees": [
    {
      "id": "<employee-uuid>",
      "email": "employee@example.com",
      "name": "Store Employee",
      "role": "Catalog Manager",
      "permissions": ["dashboard", "catalog"],
      "active": true,
      "createdAt": "<timestamp>"
    }
  ]
}
```

Local demo mode returns `{ "employees": [] }`. Errors: `401` invalid session, `403` not a Super Admin.

### `POST /api/admin/employees`

Requires Super Admin access and MySQL. Name is 1–160 characters, email must be valid and at most 254 characters, password is 12–128 characters. Role must be `Catalog Manager`, `Order Fulfillment`, or `Customer Support`. Permissions must contain at least one supported permission and must include `dashboard`.

Request:

```json
{
  "name": "Store Employee",
  "email": "employee@example.com",
  "password": "use-a-private-password",
  "role": "Catalog Manager",
  "permissions": ["dashboard", "catalog"]
}
```

Success: `201 Created`

```json
{
  "id": "<employee-uuid>",
  "email": "employee@example.com",
  "name": "Store Employee",
  "role": "Catalog Manager",
  "permissions": ["dashboard", "catalog"],
  "active": true
}
```

Errors: `400` invalid employee input, `403` not a Super Admin, `409` email already registered, `503` employee management requires MySQL.

### `PUT /api/admin/employees/:id`

Requires Super Admin access and MySQL. This operation also reactivates the employee. Request fields follow the same name, role, and permissions constraints as employee creation; email and password are not changed.

Request:

```json
{
  "name": "Store Employee",
  "role": "Order Fulfillment",
  "permissions": ["dashboard", "orders"]
}
```

Success:

```json
{ "saved": true }
```

Errors: `400` invalid input, `401` invalid session, `403` not a Super Admin, `404` employee not found, `503` employee management requires MySQL.

### `DELETE /api/admin/employees/:id`

Requires Super Admin access and MySQL. Deactivates an employee and deletes that account's sessions; it does not delete the account record.

Success:

```json
{ "deactivated": true }
```

Errors: `400` attempting to deactivate your own admin membership, `401` invalid session, `403` not a Super Admin, `404` employee not found, `503` employee management requires MySQL.

## Payments and orders

All payment endpoints require a valid bearer token. Checkout only accepts published products. The server validates stock and variants, calculates order totals, and reserves stock. Amounts are in USD. Stripe card checkout additionally requires `APP_URL`, `STRIPE_SECRET_KEY`, and a configured Stripe webhook secret.

Current checkout calculation: standard shipping is $12 when subtotal is $150 or less and free above $150; express shipping is $25; same-day shipping is $40. Tax is calculated as 18% of subtotal. The displayed standard-shipping option name does not mean every order qualifies for free shipping.

### `POST /api/payments/checkout`

Request constraints: 1–50 items, each quantity 1–50; shipping address fields are required. Shipping method must be `Standard Shipping (Free)`, `Express Courier ($25)`, or `Same-Day Metro Dispatch ($40)`. Payment method must be `Card` or `Cash on Delivery`.

Request:

```json
{
  "items": [
    {
      "productId": "<published-product-id>",
      "quantity": 2,
      "variantTitle": "Walnut"
    }
  ],
  "shippingMethod": "Standard Shipping (Free)",
  "paymentMethod": "Cash on Delivery",
  "shippingAddress": {
    "firstName": "Asha",
    "lastName": "Sharma",
    "address": "10 Example Road",
    "city": "Bengaluru",
    "pincode": "560001"
  }
}
```

Successful Cash on Delivery response:

```json
{
  "order": {
    "id": "<order-uuid>",
    "orderNumber": "HAVN-<generated-value>",
    "customerName": "Asha Sharma",
    "customerEmail": "asha@example.com",
    "date": "<YYYY-MM-DD>",
    "items": [
      {
        "productId": "<published-product-id>",
        "productName": "Example product",
        "price": 25,
        "quantity": 2,
        "variantTitle": "Walnut",
        "image": "<image-url>"
      }
    ],
    "subtotal": 50,
    "shipping": 12,
    "tax": 9,
    "discount": 0,
    "total": 71,
    "shippingMethod": "Standard Shipping (Free)",
    "paymentMethod": "Cash on Delivery",
    "paymentStatus": "Pending",
    "orderStatus": "Processing",
    "shippingAddress": {
      "firstName": "Asha",
      "lastName": "Sharma",
      "address": "10 Example Road",
      "city": "Bengaluru",
      "pincode": "560001"
    }
  }
}
```

Successful card response:

```json
{
  "checkoutUrl": "<Stripe Checkout URL>",
  "orderId": "<order-uuid>"
}
```

Errors: `400` invalid request, unavailable product/variant, insufficient stock, invalid coupon, or checkout setup failure; `401` invalid session; `503` store catalog is not initialized. A Stripe Checkout URL is returned only for card payments.

### `POST /api/payments/confirm`

Confirm a paid Stripe Checkout session. The session must belong to this account and its metadata must match the supplied order ID.

Request:

```json
{
  "orderId": "<order-uuid>",
  "sessionId": "<Stripe Checkout session ID>"
}
```

Success:

```json
{
  "order": {
    "id": "<order-uuid>",
    "orderNumber": "HAVN-<generated-value>",
    "customerName": "Asha Sharma",
    "customerEmail": "asha@example.com",
    "date": "<YYYY-MM-DD>",
    "items": [],
    "subtotal": 50,
    "shipping": 12,
    "tax": 9,
    "discount": 0,
    "total": 71,
    "shippingMethod": "Standard Shipping (Free)",
    "paymentMethod": "Card",
    "paymentStatus": "Paid",
    "orderStatus": "Processing",
    "shippingAddress": {
      "firstName": "Asha",
      "lastName": "Sharma",
      "address": "10 Example Road",
      "city": "Bengaluru",
      "pincode": "560001"
    }
  }
}
```

Errors: `400` invalid input or payment not verified, `401` invalid session, `404` order not found.

### `GET /api/payments/orders`

No body. Returns up to the latest 100 orders belonging to the authenticated account.

Success:

```json
{
  "orders": [
    {
      "id": "<order-uuid>",
      "orderNumber": "HAVN-<generated-value>",
      "customerName": "Asha Sharma",
      "customerEmail": "asha@example.com",
      "date": "<YYYY-MM-DD>",
      "items": [],
      "subtotal": 50,
      "shipping": 12,
      "tax": 9,
      "discount": 0,
      "total": 71,
      "shippingMethod": "Standard Shipping (Free)",
      "paymentMethod": "Card",
      "paymentStatus": "Paid",
      "orderStatus": "Processing",
      "shippingAddress": {
        "firstName": "Asha",
        "lastName": "Sharma",
        "address": "10 Example Road",
        "city": "Bengaluru",
        "pincode": "560001"
      }
    }
  ]
}
```

Errors: `401` missing, invalid, or expired session.

### `POST /api/payments/admin/refund`

Requires Super Admin access or the employee `orders` permission. `amount` is a positive number (maximum 1,000,000); `reason` must be 3–500 characters. Only settled Stripe orders can be refunded. Partial refunds are supported; the cumulative refund cannot exceed the paid total.

Request:

```json
{
  "orderId": "<order-uuid>",
  "amount": 25,
  "reason": "Customer requested a partial refund"
}
```

Success:

```json
{
  "refundId": "<Stripe refund ID>",
  "refundAmount": 25,
  "fullyRefunded": false
}
```

`refundAmount` is the cumulative refunded amount after this request.

Errors: `400` invalid request or refund exceeds the remaining balance, `401` invalid session, `403` missing admin/order permission, `404` order not found, `409` order is not an eligible paid Stripe order, `502` Stripe refund failed.

## Stripe webhook

### `POST /api/webhooks/stripe`

Stripe sends a raw JSON payload signed in the `Stripe-Signature` header. Configure `STRIPE_WEBHOOK_SECRET` and subscribe to `checkout.session.completed`, `checkout.session.expired`, and `checkout.session.async_payment_failed`. This endpoint is not called with the normal JSON API bearer token.

Request headers:

```http
Content-Type: application/json
Stripe-Signature: <Stripe signature>
```

Request body: the unmodified Stripe event JSON body. For example, Stripe supplies its standard event envelope with `type` and `data.object`; the session metadata must contain the order ID created by checkout.

Success:

```json
{ "received": true }
```

For completed paid sessions, the matching order is marked paid. Expired or asynchronously failed sessions are marked failed and reserved stock/coupon usage is released. Missing webhook configuration or an invalid signature returns `400` with a plain-text response rather than the JSON error format.

## Other API responses

Unknown `/api/*` routes return `404`:

```json
{ "error": "API route not found." }
```

The API does not define pagination or filtering query parameters for the endpoints in this reference.
