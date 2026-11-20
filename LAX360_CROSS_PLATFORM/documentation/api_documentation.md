# LAX360 – Backend REST API Specification

This document details the complete FastAPI backend REST API architecture, request and response models, and endpoint behaviors for the LAX360 platform.

Base URL: `http://localhost:8000/api/v1` (with `/api` compatibility aliases).

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate using identifier and password; returns JWT token & user profile | No |
| `POST` | `/api/v1/auth/register` | Register new store and administrator account | No |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user profile | Yes (Bearer) |
| `POST` | `/api/v1/auth/forgot-password` | Generate reset token for specified account email | No |
| `POST` | `/api/v1/auth/reset-password` | Reset password using generated token | No |
| `GET` | `/api/v1/auth/oauth/google/url` | Retrieve Google OAuth consent URL | No |
| `GET` | `/api/v1/auth/oauth/microsoft/url` | Retrieve Microsoft OAuth consent URL | No |
| `POST` | `/api/v1/auth/oauth/callback` | Exchange OAuth code for JWT token | No |
| `POST` | `/api/v1/auth/oauth/complete-setup` | Finalize store details after initial social SSO | No |

---

## 2. Product Management Endpoints (`/api/v1/products`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/products` | List all catalog products; supports `category`, `fabric`, and `search` query params | Yes |
| `POST` | `/api/v1/products` | Create a new textile product with multi-variants | Yes |
| `GET` | `/api/v1/products/{product_id}` | Retrieve single product with full variant inventory | Yes |
| `PUT` | `/api/v1/products/{product_id}` | Update product fields and variants | Yes |
| `DELETE` | `/api/v1/products/{product_id}` | Remove product from store catalog | Yes |

---

## 3. Customer Directory Endpoints (`/api/v1/customers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/customers` | Search and filter customers by `search` query parameter | Yes |
| `POST` | `/api/v1/customers` | Register a new retail or B2B customer | Yes |
| `GET` | `/api/v1/customers/{customer_id}` | Get customer profile | Yes |
| `PUT` | `/api/v1/customers/{customer_id}` | Update customer details | Yes |
| `DELETE` | `/api/v1/customers/{customer_id}` | Remove customer | Yes |
| `GET` | `/api/v1/customers/{customer_id}/history` | Get complete invoice history, total spend, and bills count for customer | Yes |

---

## 4. Invoice & Billing Endpoints (`/api/v1/invoices`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/invoices` | List invoices with date filtering (`today`, `yesterday`, `7days`, `month`, `custom`) | Yes |
| `POST` | `/api/v1/invoices` | Create invoice: computes GST, applies coupons/offers, validates payment, generates sequence | Yes |
| `GET` | `/api/v1/invoices/{invoice_id}` | Retrieve invoice by ID for reprint or receipt view | Yes |

---

## 5. Coupons & Festival Offers (`/api/v1/coupons` & `/api/v1/festival-offers`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/coupons` | List all store coupons (optional `active_only=true`) | Yes |
| `POST` | `/api/v1/coupons` | Create promotional coupon | Yes |
| `POST` | `/api/v1/coupons/validate` | Validate coupon code against current cart items & total | Yes |
| `PUT` | `/api/v1/coupons/{coupon_id}` | Update coupon status or terms | Yes |
| `DELETE` | `/api/v1/coupons/{coupon_id}` | Remove coupon | Yes |
| `GET` | `/api/v1/festival-offers` | List festival campaigns | Yes |
| `POST` | `/api/v1/festival-offers` | Create festival campaign | Yes |
| `GET` | `/api/v1/festival-offers/active-check` | Check and return currently active festival offer | Yes |
| `PUT` | `/api/v1/festival-offers/{offer_id}` | Update festival campaign | Yes |
| `DELETE` | `/api/v1/festival-offers/{offer_id}` | Delete festival campaign | Yes |

---

## 6. Dashboard & Sales Reports (`/api/v1/dashboard` & `/api/v1/reports`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/metrics` | Retrieve today's sales, bill count, average bill, cash/UPI/card split, 7-day trend, top items | Yes |
| `GET` | `/api/v1/reports/sales` | Detailed sales reports by period (`today`, `yesterday`, `7days`, `this_month`, `custom`) with GST slab breakup | Yes |

---

## 7. Store Settings (`/api/v1/settings`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/settings` | Retrieve store profile, billing config, appearance preferences | Yes |
| `PUT` | `/api/v1/settings` | Update store configuration and billing parameters | Yes |
| `POST` | `/api/v1/settings/reset-demo` | Restore catalog to factory demo state (40 textile items + defaults) | Yes |
| `GET` | `/api/health` | Healthcheck endpoint (`{"status": "ok"}`) | No |
