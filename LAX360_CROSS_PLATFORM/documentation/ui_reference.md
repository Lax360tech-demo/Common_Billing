# LAX360 – UI and UX Design Specification Reference

This document provides the authoritative design system, styling specifications, typography, layout rules, and complete 23-theme palette reverse-engineered from the reference application.

---

## 1. Typography & Global Styling
- **Primary Interface Font**: `Plus Jakarta Sans` (weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold).
- **Monospace Font (Figures, Codes, Slugs)**: `JetBrains Mono` (weights: 400, 500, 600) used for:
  - Currency values (e.g. `₹15,499.00`).
  - Invoice numbers (e.g. `TEX-2026-1001`).
  - Barcodes & SKUs (e.g. `890100100101`, `KPS-MRN-FS`).
  - GSTIN and HSN codes (e.g. `33AABCS8899K1ZM`, `5007`).
- **Base Border Radius**:
  - Small elements (buttons, inputs): `rounded-lg` (8px).
  - Cards, panels, modal dialogs: `rounded-2xl` (16px) or `rounded-xl` (12px).
  - Chips, badges: `rounded-full` (9999px).

---

## 2. Responsive Layout System
- **Desktop (>= 1024px)**:
  - Fixed left sidebar navigation (`w-64` / 256px) displaying store brand, user badge, all 8 module links with active highlight indicator, and collapse toggle.
  - Sticky top header with store selector, active theme indicator, notification bell, cashier info, and user profile avatar.
  - Multi-column dashboard grids (`grid-cols-4`, `grid-cols-3`).
  - Two-pane POS interface: catalog on left (60-65% width) and sticky active cart on right (35-40% width).
- **Tablet (768px – 1023px)**:
  - Collapsible slim sidebar (`w-20` / 80px) with icons and tooltips.
  - 2-column KPI cards and stacked invoice list view.
  - Adaptive cart pane with toggleable drawer or stacked layout.
- **Mobile (< 768px)**:
  - Bottom navigation bar or top hamburger app-bar.
  - Single column cards with full-width action buttons.
  - Floating action button (FAB) for Cart view / Checkout trigger in POS.

---

## 3. Complete 23 Themes Palette Specification

| # | Theme ID | Name | Category | Primary | Primary Light | Background | Card | Sidebar | Accent |
|---|----------|------|----------|---------|---------------|------------|------|---------|--------|
| 1 | `default` | Original Indigo Silk | Classic | `#4F46E5` | `#EEF2FF` | `#F8FAFC` | `#FFFFFF` | `#0F172A` | `#F59E0B` |
| 2 | `classic-dark` | Classic Dark Charcoal | Classic | `#6366F1` | `#1E1B4B` | `#0F172A` | `#1E293B` | `#090D16` | `#38BDF8` |
| 3 | `ivory-champagne-gold` | Ivory + Champagne Gold | Luxury | `#B99A65` | `#FBF8F2` | `#F8F5EF` | `#FFFFFF` | `#292929` | `#D4AF37` |
| 4 | `white-deep-teal` | White + Deep Teal | Luxury | `#0F5C5B` | `#E8F5F4` | `#F0F7F6` | `#FFFFFF` | `#183B3A` | `#20B2AA` |
| 5 | `white-copper` | White + Copper | Luxury | `#B85D3B` | `#FBF2EE` | `#F8F3EF` | `#FFFFFF` | `#2D231F` | `#E07A5F` |
| 6 | `cream-mocha` | Cream + Mocha | Luxury | `#78594E` | `#F7F3F0` | `#F5EFEB` | `#FFFFFF` | `#312724` | `#A68072` |
| 7 | `white-midnight-burgundy` | White + Midnight Burgundy | Luxury | `#6B213F` | `#F8EFF3` | `#F7EFF3` | `#FFFFFF` | `#2B131C` | `#9B335E` |
| 8 | `electric-violet` | White + Electric Violet | Tech | `#7C3AED` | `#F5F0FF` | `#F8FAFC` | `#FFFFFF` | `#160B2E` | `#A78BFA` |
| 9 | `cobalt-blue` | White + Cobalt Blue | Tech | `#1D4ED8` | `#EFF6FF` | `#F8FAFC` | `#FFFFFF` | `#0B1B3D` | `#60A5FA` |
| 10 | `aqua-teal` | White + Aqua Teal | Tech | `#0D9488` | `#F0FDFA` | `#F8FAFC` | `#FFFFFF` | `#082B27` | `#2DD4BF` |
| 11 | `neon-lime` | White + Neon Lime | Tech | `#4D7C0F` | `#F7FEE7` | `#F8FAFC` | `#FFFFFF` | `#182905` | `#84CC16` |
| 12 | `coral-orange` | White + Coral Orange | Tech | `#E11D48` | `#FFF1F2` | `#F8FAFC` | `#FFFFFF` | `#330A13` | `#FB7185` |
| 13 | `electric-cyan` | White + Electric Cyan | Tech | `#0284C7` | `#F0F9FF` | `#F8FAFC` | `#FFFFFF` | `#052033` | `#38BDF8` |
| 14 | `indigo-purple` | White + Indigo Purple | Tech | `#4F46E5` | `#EEF2FF` | `#F8FAFC` | `#FFFFFF` | `#131138` | `#818CF8` |
| 15 | `ocean-blue` | White + Ocean Blue | Tech | `#0284C7` | `#F0F9FF` | `#F8FAFC` | `#FFFFFF` | `#062136` | `#38BDF8` |
| 16 | `slate-grey` | Snow White + Slate Grey | Minimal | `#475569` | `#F1F5F9` | `#F8FAFC` | `#FFFFFF` | `#0F172A` | `#94A3B8` |
| 17 | `dusty-rose` | White + Dusty Rose | Minimal | `#9F5B72` | `#FAF0F3` | `#FAF4F6` | `#FFFFFF` | `#2F1A22` | `#C4849A` |
| 18 | `sage-green` | White + Sage Green | Minimal | `#4D7C6B` | `#EEF6F3` | `#F2F7F5` | `#FFFFFF` | `#142921` | `#74A896` |
| 19 | `sky-blue` | White + Sky Blue | Minimal | `#2563EB` | `#EFF6FF` | `#F4F8FC` | `#FFFFFF` | `#0F2147` | `#60A5FA` |
| 20 | `terracotta` | White + Terracotta | Minimal | `#A85338` | `#FAF0EC` | `#F7EFEB` | `#FFFFFF` | `#33180F` | `#CE7558` |
| 21 | `plum` | White + Plum | Minimal | `#733878` | `#F7EEF8` | `#F6EDF7` | `#FFFFFF` | `#290F2C` | `#9E59A4` |
| 22 | `mustard` | White + Mustard | Minimal | `#996800` | `#FEF9EE` | `#FAF6ED` | `#FFFFFF` | `#2B1F00` | `#D4A72C` |
| 23 | `deep-navy-beige` | Deep Navy Blue + Soft Beige | Corporate | `#082052` | `#EDE8E0` | `#F8F0E5` | `#FFFFFF` | `#082052` | `#C7A263` |

Each theme contains both `colors` (for Light Mode) and `dark` (for Dark Mode), with identical CSS and React Native style key structures.

---

## 4. Print & Receipt Templates
- **80mm Thermal Receipt**: Standard continuous receipt roll (384px wide), compact typography, centered store header, itemized list, GST tax breakdown table, cashier attribution, and barcode.
- **58mm Thermal Receipt**: Narrow thermal roll (280px wide), condensed fonts, single-line item summary.
- **A4 Full GST Tax Invoice**: Standard A4 portrait (800px wide), full store address, customer address, GSTIN, HSN codes, SAC codes, SGST/CGST rates and values, bank payment QR, authorized signature space, and formal terms & conditions.
