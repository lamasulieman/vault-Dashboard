# Vault Dashboard App

This app turns Vault CSV exports into an interactive operational dashboard for management visibility, sales-team coaching, and visit planning , watch a live demo on : https://youtu.be/1FlHVLCouYM

## Core User Experience

The app is intentionally organized as four focused workspaces:

- `Management`: high-level business pulse with KPI cards and store performance tables.
- `Sales Team`: rep-level accountability metrics and coaching signals.
- `Store Analytics`: conversion and profitability analysis with status-based segmentation.
- `Visits`: practical planning tools for follow-up actions and sample inventory control.

The UI uses a dashboard-first layout with card sections, data tables, and charts so a user can move from summary to detail quickly.

## Functionality By View

### Management

- Consolidates key numbers: total samples, total sales, average profit, best store, and best-selling box.
- Provides store-level breakdowns for both sample mix and revenue composition.
- Supports detail popups to inspect distribution by product without leaving the table context.

### Sales Team

- Combines merged order/sample data into per-rep performance rows.
- Calculates visits, conversion rate, revenue contribution, and bonus potential.
- Highlights top performers and reps that need support.
- Shows sales vs sample activity in chart form for easy comparison.

### Store Analytics

- Measures conversion and average profit margin by store.
- Classifies store health into `Thriving`, `Growing`, or `Declining`.
- Visualizes store priority in a scatter chart and mirrors the same logic in a sortable table.

### Visits

- Shows personal monthly field stats and dynamic sample inventory.
- Suggests whether each store should receive a follow-up `Call` or an introductory `Visit`.
- Supports scheduling upcoming visits and reserving planned sample quantities.

## Data Inputs

CSV files are loaded from `public/data/`:

- `orders.csv`
- `samples.csv`
- `stores.csv`
- `users.csv`
- `products.csv`

The merge layer links store, product, and salesperson records to drive all KPIs and visualizations.

## Visual And Interaction Design

- Top tab navigation for fast context switching.
- Consistent color semantics for status and priority.
- Dialogs/tooltips for drill-down detail with minimal navigation overhead.
- Chart + table pairing for both quick trend reading and exact value lookup.

## Run The App

```bash
npm install
npm run dev
```

Open the URL printed by Vite (commonly `http://localhost:5173`).

## Notes

- Run through Vite dev server; opening `index.html` directly can cause asset 404s.
- Ensure CSV file names in `public/data/` match the paths referenced in source code.
