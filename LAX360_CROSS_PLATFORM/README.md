# LAX360 – Cross-Platform Desktop & Mobile Software Application

**LAX360** is an enterprise-grade, standalone cross-platform software application reproducing the interface, business logic, calculations, animations, and user experience of the authoritative reference web application at [https://textile-billing-chi.vercel.app/](https://textile-billing-chi.vercel.app/).

---

## Architecture Overview
- **Frontend**: React Native, NativeWind (Tailwind CSS styling), Lucide Icons, React Navigation. Supports Windows Desktop, macOS Desktop, Android Tablets/Phones, iOS iPads/iPhones, and Web.
- **Backend**: Python 3, FastAPI, Pydantic validation, JWT Authentication, Motor / PyMongo asynchronous database driver.
- **Database**: MongoDB Atlas with secure environment-based credentials and automatic seeding.
- **Packaging**: Windows Desktop installer (`.exe`), Android APK configuration, iOS project structure.

## Core Modules Replicated
1. **Authentication & Store Onboarding**: Secure login, PIN code autofill lookup, forgot-password token flow.
2. **Overview Dashboard**: Real-time sales metrics, drawer cash tracking, UPI/Card breakdowns, 7-day sales trend charts.
3. **Point of Sale (POS)**: Dual-pane catalog & cart layout, barcode/SKU scanning, multi-variant selectors, GST inclusive/exclusive calculation, hotkeys (`F2`, `F4`, `F8`), Cash/UPI/Card/Split checkout, 80mm/58mm/A4 thermal receipts.
4. **All Invoices**: Searchable billing register with date filtering and thermal print reprint.
5. **Product Catalogue**: 40 authentic seeded Indian textile products across 10 categories and 10 fabrics, variant builders.
6. **Customer Directory**: Retail and B2B customer records, GSTIN lookup, purchase history logs.
7. **Coupons & Festival Offers**: Promotional campaign engine, cart validation, threshold discounts.
8. **Sales Reports**: GST tax slab breakdown (0%, 5%, 12%, 18%, 28%) and GSTR-1 compliant CSV export.
9. **Showroom Settings**: Interactive 23-theme palette gallery with light/dark modes, store profile, and invoice sequencing.

---

## Documentation
- [Feature Inventory](documentation/feature_inventory.md)
- [UI & Theme Reference](documentation/ui_reference.md)
- [REST API Documentation](documentation/api_documentation.md)
- [Installation Guide](documentation/installation_guide.md)
