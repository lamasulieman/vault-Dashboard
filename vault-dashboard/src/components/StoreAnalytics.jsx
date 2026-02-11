import { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Box, Grid
} from "@mui/material";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, Legend, Cell
} from "recharts";

export default function StoreAnalytics() {
  const [stores, setStores] = useState([]);
  const [samples, setSamples] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseCSV = (path, setter) => {
      Papa.parse(path, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: res => setter(res.data)
      });
    };

    parseCSV("/data/stores.csv", setStores);
    parseCSV("/data/samples.csv", setSamples);
    parseCSV("/data/orders.csv", data => {
      setOrders(data.filter(r => r["store__c.name__v"]));
      setLoading(false);
    });
  }, []);

  const metrics = useMemo(() => {
    if (!stores.length) return [];

    return stores.map(store => {
      const name = store["name__v"];

      const storeSamples = samples.filter(s => s["store__c.name__v"] === name);
      const storeOrders = orders.filter(o => o["store__c.name__v"] === name);

      const samplesGiven = storeSamples.reduce(
        (sum, item) => sum + (parseInt(item["quantity__c"]) || 0),
        0
      );

      const orderCount = storeOrders.length;

      const conversion = samplesGiven > 0
        ? (orderCount / samplesGiven) * 100
        : 0;

      const profitMargins = storeOrders.map(o => parseFloat(o["profitpercentage__c"] || 0));
      const profitMargin = profitMargins.length > 0
        ? (profitMargins.reduce((a, b) => a + b, 0) / profitMargins.length)
        : 0;

      // Status and Priority rules
      let status, priority, color;

      if (conversion >= 40) {
        status = "Thriving"; 
        priority = "Top Priority"; 
        color = "#4caf50"; // green
      } else if (conversion >= 20) {
        status = "Growing"; 
        priority = "Opportunity"; 
        color = "#ff9800"; // yellowish gold
      } else {
        status = "Declining"; 
        priority = "Needs Attention"; 
        color = "#e53935"; // red
      }

      return {
        store: name,
        samplesGiven,
        orderCount,
        conversion: parseFloat(conversion.toFixed(1)),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        status,
        priority,
        color
      };
    }).filter(s => s.samplesGiven > 0 && s.orderCount > 0);
  }, [stores, samples, orders]);

  const chartData = metrics.map(s => ({
    store: s.store,
    conversion: s.conversion,
    profitMargin: s.profitMargin,
    color: s.color
  }));

  if (loading) return <Typography p={4}>Loading analytics...</Typography>;

  return (
    <Box sx={{ backgroundColor: "#f7f9fc", minHeight: "100vh", p: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={2} color="#1a237e">
        Store Analytics
      </Typography>

      {/* Chart */}
      <Card elevation={3} sx={{ borderRadius: 4, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Store Priority vs Conversion Rate
          </Typography>

          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="conversion" name="Conversion (%)" domain={[0, 100]} />
              <YAxis type="number" dataKey="profitMargin" name="Profit Margin (%)" domain={[0, 20]} />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <Paper sx={{ p: 1 }}>
                      <Typography fontWeight={600}>{payload[0].payload.store}</Typography>
                      <Typography>Conversion: {payload[0].payload.conversion}%</Typography>
                      <Typography>Profit Margin: {payload[0].payload.profitMargin}%</Typography>
                    </Paper>
                  ) : null
                }
              />
              <Legend />
              <Scatter data={chartData}>
                {chartData.map((p, i) => (
                  <Cell key={i} fill={p.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={3} sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Store Engagement Overview
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Store</TableCell>
                  <TableCell>Samples Given</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Conversion (%)</TableCell>
                  <TableCell>Profit Margin (%)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {metrics.map(s => (
                  <TableRow key={s.store}>
                    <TableCell>{s.store}</TableCell>
                    <TableCell>{s.samplesGiven}</TableCell>
                    <TableCell>{s.orderCount}</TableCell>
                    <TableCell>{s.conversion}</TableCell>
                    <TableCell>{s.profitMargin}</TableCell>
                    <TableCell>
                      <Chip label={s.status} sx={{ backgroundColor: s.color + "33", color: s.color }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={s.priority} sx={{ backgroundColor: s.color + "33", color: s.color }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
