import { useState, useEffect, useMemo } from "react";
import { loadVaultData } from "../utils/loadVaultData";
import Papa from "papaparse";
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
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Box,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function SalesTeam() {
  const [data, setData] = useState([]);
  const [samples, setSamples] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Load merged data + sample CSV ---
  useEffect(() => {
    const loadData = async () => {
      const merged = await loadVaultData();
      setData(merged);

      // Load samples separately to access created_date__v
      Papa.parse("/data/samples.csv", {
        download: true,
        header: true,
        complete: (res) => {
          const clean = res.data.filter(
            (r) => r["salesperson__c.name__v"] && r["created_date__v"]
          );
          setSamples(clean);
          setLoading(false);
        },
      });
    };
    loadData();
  }, []);

  // --- Compute Metrics ---
  const metrics = useMemo(() => {
    if (data.length === 0 || samples.length === 0)
      return { team: [], sampleBreakdown: {} };

    const repMap = {};
    const repVisitDates = {};

    // ✅ Count unique visit days from samples.csv
    samples.forEach((s) => {
      const rep = s["salesperson__c.name__v"] || "Unknown";
      const date = s["created_date__v"]
        ? new Date(s["created_date__v"]).toISOString().split("T")[0]
        : null;
      if (!date) return;
      if (!repVisitDates[rep]) repVisitDates[rep] = new Set();
      repVisitDates[rep].add(date);
    });

    // Aggregate sales data
    data.forEach((entry) => {
      const rep = entry.salesperson || "Unknown";
      if (!repMap[rep]) {
        repMap[rep] = {
          name: rep,
          visits: 0,
          samples: 0,
          sales: 0,
          revenue: 0,
          profit: 0,
          products: {},
        };
      }

      repMap[rep].samples += entry.samplesGiven || 0;
      repMap[rep].sales += entry.quantitySold || 0;
      repMap[rep].revenue += entry.totalSales || 0;
      repMap[rep].profit += entry.profit || 0;

      const prod = entry.product;
      repMap[rep].products[prod] =
        (repMap[rep].products[prod] || 0) + (entry.samplesGiven || 0);
    });

    // Merge everything
    const team = Object.values(repMap).map((rep) => {
      const visits = repVisitDates[rep.name]?.size || 0; // ✅ Actual unique day visits
      const bonus = rep.profit > 0 ? (rep.profit * 0.2).toFixed(2) : 0;
      const conversion =
        rep.samples > 0 ? ((rep.sales / rep.samples) * 100).toFixed(1) : 0;
      return { ...rep, visits, bonus, conversion };
    });

    const sampleBreakdown = {};
    team.forEach((rep) => {
      sampleBreakdown[rep.name] = Object.entries(rep.products).map(
        ([product, qty]) => ({ product, quantity: qty })
      );
    });

    return { team, sampleBreakdown };
  }, [data, samples]);

  // --- UI Handlers ---
  const handleOpen = (repName) => {
    setSelectedRep(repName);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRep(null);
  };

  if (loading)
    return (
      <Typography color="text.secondary" sx={{ p: 4 }}>
        Loading Vault data...
      </Typography>
    );

  const topPerformers = metrics.team.filter((t) => t.sales >= 5);
  const needsAttention = metrics.team.filter((t) => t.sales < 4);

  return (
    <Box sx={{ backgroundColor: "#f7f9fc", minHeight: "100vh", p: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="#1a237e">
        Sales Team Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Performance overview of field reps based on Vault activity data
      </Typography>

      {/* ===== Summary Chart ===== */}
      <Card elevation={3} sx={{ borderRadius: 4, mb: 3, background: "#fff" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Sales vs Samples
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.team}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip />
              <Legend />
              <Bar dataKey="samples" fill="#42a5f5" name="Samples Given" />
              <Bar dataKey="sales" fill="#66bb6a" name="Sales Made" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===== Summary Cards ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                🏆 Top Performers
              </Typography>
              {topPerformers.map((t, idx) => (
                <Typography key={t.name} sx={{ mb: 1.2 }}>
                  <strong>#{idx + 1}</strong> {t.name} — ${t.revenue.toFixed(2)}{" "}
                  (+${t.bonus})
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                📚 Needs Attention
              </Typography>
              {needsAttention.map((t) => (
                <Typography key={t.name} sx={{ mb: 1.2 }}>
                  {t.name} — {t.visits} visits, {t.sales} sales{" "}
                  <Chip
                    label="Training Needed"
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ===== Detailed Table ===== */}
      <Card elevation={3} sx={{ borderRadius: 4, background: "#fff" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Team Performance Metrics
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Sales Person</strong></TableCell>
                  <TableCell><strong>Visits</strong></TableCell>
                  <TableCell><strong>Samples</strong></TableCell>
                  <TableCell><strong>Sales</strong></TableCell>
                  <TableCell><strong>Conversion %</strong></TableCell>
                  <TableCell><strong>Revenue ($)</strong></TableCell>
                  <TableCell><strong>Bonus ($)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.team.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.visits}</TableCell>
                    <TableCell>
                      {t.samples}
                      <Tooltip title="View sample breakdown">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpen(t.name)}
                          sx={{ ml: 1 }}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{t.sales}</TableCell>
                    <TableCell>{t.conversion}%</TableCell>
                    <TableCell>${t.revenue.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: "green", fontWeight: 600 }}>
                      ${t.bonus}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ===== Modal Breakdown ===== */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>
          {selectedRep ? `Samples given by ${selectedRep}` : ""}
        </DialogTitle>
        <DialogContent>
          {selectedRep && metrics.sampleBreakdown[selectedRep] ? (
            <List>
              {metrics.sampleBreakdown[selectedRep].map((sample, idx) => (
                <ListItem key={idx}>
                  <Chip
                    label={sample.product}
                    color={
                      sample.product.includes("Blue")
                        ? "primary"
                        : sample.product.includes("Red")
                        ? "error"
                        : "success"
                    }
                    sx={{ mr: 2 }}
                  />
                  <ListItemText primary={`Quantity: ${sample.quantity}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No sample data available.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
