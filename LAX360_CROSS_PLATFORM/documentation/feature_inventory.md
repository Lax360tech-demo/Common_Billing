# LAX360 – Complete Feature Inventory

This document provides an exhaustive inventory of all accessible modules, screens, user flows, business logic, calculations, interactions, and keyboard shortcuts reverse-engineered from the authoritative reference web application at [https://textile-billing-chi.vercel.app/](https://textile-billing-chi.vercel.app/).

---

## 1. Authentication & Store Setup
- **Login (`/login`, `/signin`)**:
  - Email/username and password authentication.
  - Pre-filled demo credentials: `admin@gmail.com` / `admin`.
  - JWT Bearer token issuance stored securely in persistent storage (`texbill_token`, `texbill_user`).
  - Remember me checkbox.
  - "Forgot Password" modal with email token dispatch and password reset step.
  - OAuth integration buttons (Google & Microsoft SSO callback handlers).
- **Registration (`/register`, `/signup`)**:
  - Owner details: `owner_name`, `email`, `phone`, `password`.
  - Store details: `store_name`, `store_address`, `gstin`.
  - Smart Indian PIN Code auto-lookup: typing a 6-digit Indian PIN code queries `https://api.postalpincode.in/pincode/{pincode}` and auto-populates City and State.
- **Session Management**:
  - Auto-redirect to `/dashboard` on successful authentication.
  - Protected layout wrapping all internal business screens.
  - Logout clears token and redirects to `/login`.

---

## 2. Store Overview & Analytics Dashboard (`/dashboard`)
- **Key Metrics KPI Cards**:
  - **Today's Net Sales**: Total net bill amount collected for current day, subtitle "Net collected today".
  - **Completed Transactions**: Total invoice count for current day, subtitle "Completed transactions".
  - **Average Bill Value**: Total revenue divided by number of bills, subtitle "Per customer basket".
  - **Drawer Cash Collection**: Cash tendered minus change returned for the day.
  - **UPI / QR Sales**: Total digital payments received via QR / Soundbox.
  - **Card Sales**: Total POS swipe/tap credit and debit card collections.
- **Quick Actions**:
  - Primary button: **New Billing (F2)** linking directly to POS.
- **Interactive Visualizations**:
  - **7-Day Sales Trend**: Bar/line trend comparing sales volume across the past 7 days.
  - **Payment Mode Breakdown**: Donut / Segmented visualization (UPI, Cash, Card percentages).
  - **Top Selling Products**: Ranked list with item title, category, quantity sold, and gross revenue.
  - **Recent Invoices**: Quick preview table of the last 5 bills with date, customer, amount, and status.

---

## 3. Point of Sale & Billing Engine (`/pos`)
- **Dual-Pane POS Layout**:
  - **Left Pane (Catalog & Selection)**:
    - Search input: filters across title, brand, fabric, or variant SKU/barcode in real-time.
    - Category pills: `All`, `Sarees`, `Men's Ethnic`, `Men's Casual`, `Women's Kurtis`, `Salwar Sets`, `Kids Wear`, `Dhotis & Veshtis`, `Fabrics & Matching`, `Home Textiles`.
    - Fabric filters: `Pure Mulberry Silk`, `Kanchipuram Silk`, `Banarasi Silk`, `Chanderi Silk`, `100% Combed Cotton`, `Linen`, `Chiffon & Georgette`, `Rayon`, `Khadi Cotton`, `Velvet`.
    - Product Grid: Cards with pricing, MRP, fabric badges, stock indicator.
    - Single-click add to cart for single-variant products.
    - Variant Selection Modal: for multi-variant items (e.g. Size `M`/`L`/`XL`, Color swatches with HEX codes, SKU, Barcode, price override).
  - **Right Pane (Cart & Real-time Calculations)**:
    - Customer banner: Displays assigned customer (Defaults to `Walk-in Customer`, phone `9840000000`).
    - Customer Quick-Select Modal (**F4** shortcut): search registered customers by phone/name or register a new walk-in customer inline.
    - Cart Item Rows:
      - Title, variant details (size, color, fabric, SKU).
      - Quantity increment/decrement buttons (`+`, `-`, direct numeric input).
      - Unit price override.
      - Line Item Discount: Fixed (`₹`) or Percentage (`%`) discount per item.
      - Taxable amount, GST rate badge, and line total.
      - Trash / Delete line item button.
    - Bill-Level Discount: Fixed amount or percentage applied across the entire basket.
    - Coupon Code Input: Apply store coupon or auto-apply eligible festival discounts.
    - Price Mode Support:
      - **Inclusive Pricing**: MRP includes GST (Tax extracted backwards).
      - **Exclusive Pricing**: GST added on top of taxable rate.
    - Bill Summary Breakdown:
      - Gross Subtotal (`grossSubtotal`).
      - Item Discounts (`totalItemDiscount`).
      - Bill Discount (`billDiscountAmount`).
      - Coupon Discount (`couponDiscountAmount`).
      - Festival Discount (`festivalDiscountAmount`).
      - Total Discount (`totalDiscount`).
      - Taxable Subtotal (`taxableSubtotal`).
      - Central GST (`totalCGST`) & State GST (`totalSGST`).
      - Grand Total (`grandTotal`).
      - Round Off (`roundOff`) to nearest whole rupee.
      - Net Payable (`netPayable`).
- **Checkout Modal (**F8** shortcut)**:
  - Payment Mode Tabs:
    - **Cash**: Tendered cash input, real-time validation (cannot tender less than net payable), change returned calculator.
    - **UPI / QR**: Displays dynamic payment reference, Soundbox verification simulation.
    - **Card**: Approval code / transaction reference input.
    - **Split Pay**: Multi-tender split (Cash + UPI + Card) with validation that split sum equals net payable within 50 paise.
  - Bill Notes: Optional invoice remarks / notes field.
  - Process Bill button: Creates invoice in database, increments sequence, decrements stock, issues loyalty auto-coupons if threshold exceeded.
- **Receipt & Thermal Print Modal**:
  - Automatically pops up on successful checkout.
  - Format selector: **80mm Thermal Receipt**, **58mm Thermal Roll**, **A4 Full GST Tax Invoice**.
  - Includes store header, GSTIN, invoice number, cashier name, line items, GST slab summary table, payment mode, change returned, and store terms & conditions.
  - Print / PDF download triggers.

---

## 4. Invoice History & Management (`/invoices`)
- Date filters: `Today`, `Yesterday`, `Last 7 Days`, `This Month`, `Custom Date Range`.
- Search by invoice number, customer name, or customer mobile number.
- Invoices Table:
  - Invoice Number (e.g. `TEX-2026-1001`).
  - Date & Timestamp.
  - Customer Name & Phone.
  - Item Count & Total Quantity.
  - Payment Method (Cash, UPI, Card, Split).
  - Net Payable amount.
  - Action buttons: View Receipt Modal, Print, Export to CSV.

---

## 5. Product Catalog & Inventory (`/products`)
- Complete textile catalog containing 40 pre-seeded authentic Indian textile products.
- Category & Fabric dropdown filters.
- Search by product name, SKU, or barcode.
- Product Management Table:
  - Name & description.
  - Category, fabric, brand, and HSN code (e.g. `5007` for Silk, `6203` for Garments).
  - Variant pills displaying sizes, colors with color dots, SKU, and barcode.
  - Selling Price & MRP with discount percentage badge.
  - Actions: Edit Product Modal, Delete Product (with confirmation), Add Variant.
- Add / Edit Product Modal:
  - Name, Category, Fabric, Brand, HSN Code, GST Rate (0%, 5%, 12%, 18%, 28%).
  - Multi-variant builder: add sizes (`S`, `M`, `L`, `XL`, `Free Size`), colors with hex picker, SKU generator, barcode generator, custom price overrides.

---

## 6. Customer Directory (`/customers`)
- Customer listing with search by name, phone, city, or GSTIN.
- Category filter: `All`, `Retail`, `B2B / Wholesale`.
- Customer Table:
  - Customer Name, Contact details (phone, email).
  - Location (City, State, Address).
  - Type badge (Retail vs. B2B) and GSTIN.
  - Total bills generated and lifetime spending amount.
  - Actions: View Purchase History modal, Edit Customer, Delete Customer.
- Register / Edit Customer Modal:
  - Full details including address and PIN code lookup.
- Customer Purchase History Modal:
  - Displays all past invoices for the selected customer, total spend, average order value, and date of last visit.

---

## 7. Coupons & Festival Promotional Offers (`/coupons`)
- **Coupons Tab**:
  - Active & Inactive coupon cards.
  - Coupon properties: Code, Discount Type (`percent` or `fixed`), Value, Minimum Purchase Threshold, Maximum Discount Cap, Expiry Date, Usage Limit, Applicable Categories.
  - Create Coupon Modal & Status Toggle (Active / Inactive).
  - Automatic customer retention coupons (e.g. bills above ₹2,000 generate a 10% next-visit coupon).
- **Festival Offers Tab**:
  - Festival campaign cards: Deepavali Silk Carnival, Pongal Fest, Wedding Season Special, etc.
  - Date range validity (Start Date to End Date).
  - Priority ordering and automatic cart discount application when active.
  - Create / Edit Festival Offer Modal.

---

## 8. Sales & GST Tax Reports (`/reports`)
- Period Selector: `Today`, `Yesterday`, `Last 7 Days`, `This Month`, `Custom Range`.
- Summary KPIs: Total Gross Sales, Total Discounts Given, Total Taxable Turnover, Total GST Collected (CGST + SGST), Net Revenue.
- **GST Slab Breakdown Table**:
  - Slabs: 0%, 5%, 12%, 18%, 28%.
  - Taxable value per slab, CGST collected, SGST collected, Total Tax.
- Top Selling Products Leaderboard:
  - Rank, Product Title, Fabric, Quantity Sold, Total Revenue.
- CSV Export: One-click export of complete GST sales register for tax filing (GSTR-1 compatible).

---

## 9. Store & System Settings (`/settings`)
- **Appearance & Themes Tab**:
  - Interactive theme gallery featuring all **23 custom themes**:
    - *Classic*: Original Indigo Silk, Classic Dark Charcoal.
    - *Luxury*: Ivory + Champagne Gold, White + Deep Teal, White + Copper, Cream + Mocha, White + Midnight Burgundy.
    - *Modern Tech*: White + Electric Violet, White + Cobalt Blue, White + Aqua Teal, White + Neon Lime, White + Coral Orange, White + Electric Cyan, White + Indigo Purple, White + Ocean Blue.
    - *Minimal*: Snow White + Slate Grey, White + Dusty Rose, White + Sage Green, White + Sky Blue, White + Terracotta, White + Plum, White + Mustard.
    - *Corporate*: Deep Navy Blue + Soft Beige.
  - Light Mode and Dark Mode toggle.
  - Live preview without reloading.
- **Store Profile Tab**:
  - Store Name, Tagline, Address, City, State, State Code (`33` for TN), Pincode, Phone, Email, GSTIN, PAN.
- **Billing & Invoice Template Tab**:
  - Invoice Prefix (`TEX-2026-`), Next Sequence Number (`1001`).
  - Default GST Rate (`5.0%`), Pricing Mode (`inclusive` vs `exclusive`).
  - Default Paper Size (`80mm`, `A4`, `58mm`).
  - Default Payment Mode (`Cash`, `UPI`, `Card`, `Split`).
  - Rounding toggle (`enableRounding`).
  - Cashier name.
  - Auto-coupon settings (enable toggle, threshold, discount amount, min purchase).
  - Invoice Terms and Conditions text area.
- **Demo Data Management Tab**:
  - One-click "Reset to Factory Demo Data" button to restore all 40 textile products, sample customers, and demo configuration.
