# KAN Universal — PDF Design System & UI/UX Guidelines

This document outlines the visual structure, layout alignment, typography, and styling choices for the Sales Quotation PDF view.

---

## 🎨 Color Palette & Typography

- **Primary Color:** `#582f4c` (Wine/Plum) — Used for company branding, headers, borders, and accents.
- **Secondary Color:** `#8a6d81` (Rose-Mauve) — Used for secondary accents and gradients.
- **Accent Color:** `#ab97a5` (Soft Lilac Gray) — Used for highlights and border glows.
- **Dynamic Gradient:** `linear-gradient(90deg, #2c1726, #582f4c, #8a6d81, #ccc0c9, #eeeaed)` — Flowing horizontal animated gradient.
- **Alert Colors:** 
  - KAN Responsibility: Green (`#1a8c3c` / `#ecfdf5`)
  - BUYER Responsibility: Red (`#c0392b` / `#fef2f2`)
- **Fonts:** 
  - Headings: `'Space Grotesk'`, sans-serif
  - Body & Content: `'Inter'`, sans-serif
  - Numbers & Identifiers: `'JetBrains Mono'`, monospace

---

## 📐 Layout Grid & Sizing (A4 Target)

To guarantee that **Direct PDF Downloads** (via `html2pdf.js`) and **Browser Printing** (`Ctrl + P`) are **100% identical**, the page container uses a fixed width:
- Width is locked to **`800px`** for both viewport and print layouts.
- `overflow: visible;` is applied on the page wrapper to prevent any truncation or cutting off of overflowed table entries.

---

## 🏗 Section Alignment Details

### Corporate & Bank Header
- **Left Side:** Base64-inlined Company Logo, Address, and GST information (completely offline-compatible to prevent CORS loading blocks).
- **Right Side:** REF ID box with Date/Time parameters and designated **Bank Details** box.

### Section 1: Sales Representative
- Bordered 2-column grid.
- **Left Column:** Sales Representative Name, Email.
- **Right Column:** Mobile Contact No., Designation.

### Section 2: Client Information
- Bordered 2-column grid.
- **Left Column:** Client Name, Company Name, Email, Contact.
- **Right Column:** Client Address, Site Address, GST NO, ORG TYPE.

### Section 3: Project Details
- Bordered 3-column grid mapping the 18 parameters in a clean 3x6 layout.
- Rounding direction (UP/DOWN) is displayed inline with physical Millimeter values.

### Section 4: Scope of Work
- Bordered 3-column grid displaying all 9 scope parameters with color-coded responsibility tags.

### Section 5: Quotation Breakdown
- 10-column tabular grid listing all hardware components, pricing, and view specification links.
- Styled totals block displaying Subtotal, GST, Discount, and Grand Total.

### Section 6: Dynamic Remarks
- Displays the Remarks section only if remarks are filled. Adjusts spacing dynamically and skips the block entirely if no remarks are present.

### Section 7: Terms & Conditions
- Full list of KAN Universal standard terms.

### Closing Signature
- Bottom thank-you footer with validity timeline.
