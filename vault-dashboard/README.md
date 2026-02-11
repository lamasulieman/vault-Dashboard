# Vault Dashboard

Vault Dashboard is a React + Vite analytics app for tracking store performance, sales team activity, and visit planning using CSV data exports.

## Overview

The app is organized into four tabs:

- `Management`: high-level KPIs (sales, samples, profit, best store, best-selling box) and store-level breakdowns.
- `Sales Team`: rep-level performance metrics, conversion rates, bonus calculation, and sample distribution insights.
- `Store Analytics`: conversion vs. profit visualization and store prioritization status.
- `Visits`: visit/call suggestions, personal monthly stats, sample inventory, and a visit planner workflow.

## Tech Stack

- React 18
- Vite
- Material UI (`@mui/material`, `@mui/icons-material`)
- Recharts
- Papa Parse (CSV parsing)

## Data Sources

CSV files are read from `public/data/` at runtime:

- `orders.csv`
- `samples.csv`
- `stores.csv`
- `users.csv`
- `products.csv`

The dashboard logic merges records by store, product, and salesperson to compute KPIs and performance metrics.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Open in browser

Use the local URL printed by Vite (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev`: start local dev server
- `npm run build`: create production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint checks

## Project Structure

```text
vault-dashboard/
  public/
    data/
      orders.csv
      samples.csv
      stores.csv
      users.csv
      products.csv
  src/
    components/
      Dashboard.jsx
      SalesTeam.jsx
      StoreAnalytics.jsx
      Visits.jsx
    utils/
      loadVaultData.js
    App.jsx
    main.jsx
    index.css
```

## Troubleshooting

- `404 (Not Found)` on assets:
  Run with `npm run dev` instead of opening `index.html` directly in the browser.
- `404` on CSV files:
  Confirm filenames in `public/data/` match requested paths in code.
  Example: if code references `/data/products.csv`, the file in `public/data/` must be named `products.csv`.

## Future Improvements

- Add TypeScript and stricter typing for CSV schemas.
- Add unit tests for data merge and metric calculation logic.
- Add filters for time range, store, product, and salesperson.
- Add CSV upload support from the UI.
