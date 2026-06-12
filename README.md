# Vault Dashboard

Vault Dashboard is a multi-view analytics web app for tracking retail sample distribution, sales performance, and store follow-up planning from Vault CSV exports.

Watch a recorded demo on : https://youtu.be/1FlHVLCouYM 

## What The App Does

The interface is built around four working views that support day-to-day field and management decisions:

- `Management`: executive snapshot cards for total samples, total sales, average profit, best store, and best-selling box, plus a store table with drill-down popups.
- `Sales Team`: rep-by-rep performance with visits, samples, sales, conversion rate, revenue, and bonus, including top-performer and needs-attention sections.
- `Store Analytics`: store health classification (`Thriving`, `Growing`, `Declining`) using conversion and profit-margin behavior, shown in both chart and table form.
- `Visits`: action-oriented planning space with suggested calls/visits, monthly personal stats, live sample inventory, and scheduled visit tracking.

## Product Experience And Visual Style

- Tabbed top navigation keeps workflows separated but fast to switch.
- KPI cards surface priority metrics first so users can scan performance quickly.
- Interactive dialogs and tooltips provide breakdown detail without leaving the page.
- Charts (bar, pie, scatter) are used to compare trends, not just display raw numbers.
- Color coding is meaningful and consistent:
  `Blue` for informational/sample activity, `Green` for strong outcomes, `Red` for risk/attention.
- Layout is dashboard-first with clear table hierarchy, card grouping, and decision-focused labels.

## Functional Highlights

- CSV-driven data model that merges orders, samples, stores, products, and users.
- Store-level and rep-level aggregation logic for operational KPIs.
- Conversion and profitability signals used to prioritize outreach.
- Visit planning workflow that reserves sample quantities from inventory.
- Follow-up recommendation logic to separate visited stores (`Call`) from unvisited stores (`Visit`).

## Tech Stack

- React 18
- Vite
- Material UI (`@mui/material`, `@mui/icons-material`)
- Recharts
- Papa Parse

## Why This Project Exists

This project demonstrates how raw commercial activity data can be converted into practical sales operations tooling:

- managers get fast performance visibility,
- reps get clear next actions,
- teams get a shared view of where profit and growth are coming from.

## Repository Layout

The app source is located in `vault-dashboard/`.

- Main app README: `vault-dashboard/README.md`
- App entry: `vault-dashboard/src/App.jsx`
- Primary views: `vault-dashboard/src/components/`

## Quick Start Demo
watch a demo on : https://youtu.be/1FlHVLCouYM 
OR 
1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open the local URL printed by Vite, commonly http://localhost:5173

The root package delegates commands to the app in `vault-dashboard/`, so the same commands work from the repository root:

```bash
npm install
npm run dev
npm run build
npm run lint
```
