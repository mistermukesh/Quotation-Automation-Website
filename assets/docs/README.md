# KAN Universal — Sales Quotation System

A professional, self-contained **Single Page Application (SPA)** designed for the sales team at KAN Universal to dynamically configure, compute, manage, and export quotation documents for LED display systems.

The entire application runs entirely in the browser using client-side routing, offline state management, and an on-the-fly sizing calculation engine.

---

## 📂 Project Architecture

The codebase has been refactored into exactly three core files:

```
c:/Users/mis/Desktop/QUOATATION-Gsheet/
├── index.html   # Unified views layout (Login, Dashboard, Create Form, PDF View)
├── style.css    # Unified style system (Theme colors, grid layouts, print media overrides)
└── script.js    # Consolidated logic (Product specs, credentials, calculations, router, and view controllers)
```

---

## 🚀 Key Features

### 1. Sizing & Dimension Calculation Engine
- Converts customer requests in feet directly into precise millimeters.
- Supports **6 distinct LED module/cabinet scenarios**:
  1. `192 × 192 mm` Module
  2. `320 × 160 mm` Module
  3. `288 × 288 mm` Module
  4. `600 × 337.5 mm` COB Cabinet
  5. `576 × 576 mm` Cabinet (2×2 arrangement of 288mm modules)
  6. `Diecast 192` Cabinet (3×3 arrangement of 192mm modules, 576×576mm total)
- **Rounding Policy & Steppers**: Default configuration utilizes industry-standard ceiling calculations (`UP`). Allows manual step overrides (`DOWN` or stepper custom increments) per axis with real-time recalculation of total area (SQFT) and module breakdown.

### 2. Client-Side Hash Router
- Navigates fluidly between `#login`, `#dashboard`, `#create`, and `#pdf` hash routes.
- An **Authentication Guard** intercepts unauthorized route navigation and forces users back to the secure login template if no valid session is found.

### 3. Comprehensive Quotation Builder
- **Scope of Work Mapping**: Radios for transportation, scaffolding, stabilizers, fabrication, wiring, and crane. Selecting `KAN` dynamically appends lot-pricing lines to the quote breakdown.
- **Dynamic Breakdown Grid**: Live item entries with catalog auto-complete. Row 1 (the LED screen itself) is locked and automatically updated in quantity/area via the sizing engine.
- **Standardized Clauses Manager**: Distinguishes between locked `ADMIN` clauses and editable `USER` terms & conditions.

### 4. Offline State Manager
- Full CRUD operations stored under the `kan_quotations` local storage key.
- Includes draft saving, revision control (`QT-XXXX-L1`, `QT-XXXX-L2`), quotation duplication, and deletion.

### 5. Document Exporter
- Integrated styles render a professional, print-ready document format.
- Uses `html2canvas` and `jsPDF` for **one-click local PDF generation** natively compiled inside the browser.

---

## 🔑 Demo Credentials

Test the application using one of the predefined user credentials below:

| User ID | Password | Access Level | Role |
| :--- | :--- | :--- | :--- |
| **MOHIT** | mohit123 | User | Business Development Executive |
| **KOMAL** | komal123 | User | Business Development Executive |
| **RAMESH** | ramesh123 | Admin | Business Development Head |

*Note: Admins can view and manage quotes raised by all team members and modify restricted T&C clauses. Users can only view, edit, and duplicate their own raised quotations.*

---

## 🛠️ How to Run & Test

1. Launch a local web server (such as the VS Code **Live Server** extension) pointing to the project directory.
2. Navigate to `http://127.0.0.1:5500/index.html` (or your local equivalent).
3. Log in using one of the demo accounts listed above.
