import Papa from "papaparse";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [samples, setSamples] = useState([]);
  const [openSamples, setOpenSamples] = useState(false);
  const [openRevenue, setOpenRevenue] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [sampleBreakdown, setSampleBreakdown] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);

  // Load CSV files
  useEffect(() => {
    const loadCSV = (path, setter) => {
      Papa.parse(path, {
        download: true,
        header: true,
        complete: (results) => {
          const clean = results.data.filter((r) => Object.values(r).some((v) => v));
          setter(clean);
        },
      });
    };

    loadCSV("/data/orders.csv", setOrders);
    loadCSV("/data/samples.csv", setSamples);
  }, []);

  // Merge logic and compute metrics
  const metrics = useMemo(() => {
    if (orders.length === 0 || samples.length === 0) {
      return {
        stores: [],
        totalSamples: 0,
        totalSales: 0,
        avgProfit: 0,
        bestStore: "—",
        bestBox: "—",
        bestBoxPercent: 0,
      };
    }

    const storeMap = {};
    const productRevenueTotals = {}; 


    // Combine samples + orders by store and product
    orders.forEach((o) => {
      const store = o["store__c.name__v"];
      const product = o["product__c.name__v"];
      const sales = parseFloat(o["total_price__c"]) || 0;
      const profit = parseFloat(o["profit__c"]) || 0;

      if (!storeMap[store])
        storeMap[store] = {
          name: store,
          totalSamples: 0,
          totalSales: 0,
          profit: 0,
          products: {},
        };

      storeMap[store].totalSales += sales;
      storeMap[store].profit += profit;
      storeMap[store].products[product] = storeMap[store].products[product] || { samples: 0, revenue: 0 };
      storeMap[store].products[product].revenue += sales;
      productRevenueTotals[product] = (productRevenueTotals[product] || 0) + sales;

    });

    samples.forEach((s) => {
      const store = s["store__c.name__v"];
      const product = s["product__c.name__v"];
      const qty = parseInt(s["quantity__c"]) || 0;

      if (!storeMap[store])
        storeMap[store] = {
          name: store,
          totalSamples: 0,
          totalSales: 0,
          profit: 0,
          products: {},
        };

      storeMap[store].totalSamples += qty;
      storeMap[store].products[product] = storeMap[store].products[product] || { samples: 0, revenue: 0 };
      storeMap[store].products[product].samples += qty;

    });

    const stores = Object.values(storeMap);
    const totalSamples = stores.reduce((sum, s) => sum + s.totalSamples, 0);
    const totalSales = stores.reduce((sum, s) => sum + s.totalSales, 0);
    const avgProfit = (stores.reduce((sum, s) => sum + s.profit, 0) / stores.length).toFixed(2);
    const bestStore = stores.sort((a, b) => b.profit - a.profit)[0]?.name || "—";

    // Best-selling box is based on total sales revenue.
    const [bestBox, bestRevenue] =
      Object.entries(productRevenueTotals).sort((a, b) => b[1] - a[1])[0] || [];

    const totalRevenue = Object.values(productRevenueTotals).reduce((sum, val) => sum + val, 0);
    const bestBoxPercent = bestRevenue
      ? ((bestRevenue / totalRevenue) * 100).toFixed(1)
      : 0;


    return {
      stores,
      totalSamples,
      totalSales,
      avgProfit,
      bestStore,
      bestBox,
      bestBoxPercent,
    };
  }, [orders, samples]);

  const COLORS = {
    "Red Box": "#ef5350",
    "Blue Box": "#42a5f5",
    "Green Box": "#66bb6a",
  };

  // Popup handlers
  const handleOpenSamples = (store) => {
    setSelectedStore(store);
    const s = metrics.stores.find((x) => x.name === store);
    if (!s) return;
    const breakdown = Object.entries(s.products).map(([product, val]) => ({
      product,
      quantity: val.samples || 0,
    }));
    setSampleBreakdown(breakdown);
    setOpenSamples(true);
  };

  const handleOpenRevenue = (store) => {
    setSelectedStore(store);
    const s = metrics.stores.find((x) => x.name === store);
    if (!s) return;
    const breakdown = Object.entries(s.products).map(([product, val]) => ({
      product,
      revenue: val.revenue || 0,
    }));
    setRevenueBreakdown(breakdown);
    setOpenRevenue(true);
  };

  const handleClose = () => {
    setOpenSamples(false);
    setOpenRevenue(false);
    setSelectedStore(null);
  };

  const summaryCards = [
    { label: "Total Samples Given", value: metrics.totalSamples },
    { label: "Total Sales", value: `$${metrics.totalSales.toFixed(2)}` },
    { label: "Average Profit %", value: `${metrics.avgProfit}%` },
    { label: "Best Store", value: metrics.bestStore },
    {
      label: "Best Selling Box",
      value: `${metrics.bestBox} (${metrics.bestBoxPercent}%)`,
      color:
        metrics.bestBox?.includes("Blue")
          ? "primary"
          : metrics.bestBox?.includes("Red")
          ? "error"
          : "success",
    },
  ];

  return (
    <Box sx={{ backgroundColor: "#f7f9fc", minHeight: "100vh", p: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="#1a237e">
        Gift Box Sales Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} marginBottom={3}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.label}>
            <Card elevation={3} sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={card.color || "inherit"}
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Store Table */}
      <Card elevation={3} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Store Sample & Sales Performance
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Store</strong></TableCell>
                  <TableCell><strong>Samples</strong></TableCell>
                  <TableCell><strong>Total Sales ($)</strong></TableCell>
                  <TableCell><strong>Profit ($)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.stores.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      {s.totalSamples}
                      <Tooltip title="View sample breakdown by color">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenSamples(s.name)}
                          sx={{ ml: 1 }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      ${s.totalSales.toFixed(2)}
                      <Tooltip title="View revenue contribution breakdown">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenRevenue(s.name)}
                          sx={{ ml: 1 }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>${s.profit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Sample Breakdown Popup */}
      <Dialog open={openSamples} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedStore ? `Samples Breakdown — ${selectedStore}` : ""}
        </DialogTitle>
        <DialogContent>
          {sampleBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleBreakdown}
                  dataKey="quantity"
                  nameKey="product"
                  outerRadius={100}
                  label
                >
                  {sampleBreakdown.map((entry) => (
                    <Cell key={entry.product} fill={COLORS[entry.product]} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Typography>No sample data available.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Revenue Breakdown Popup */}
      <Dialog open={openRevenue} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedStore ? `Revenue Breakdown — ${selectedStore}` : ""}
        </DialogTitle>
        <DialogContent>
          {revenueBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  dataKey="revenue"
                  nameKey="product"
                  outerRadius={100}
                  label
                >
                  {revenueBreakdown.map((entry) => (
                    <Cell key={entry.product} fill={COLORS[entry.product]} />
                  ))}
                </Pie>
                <ChartTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Typography>No revenue data available.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
