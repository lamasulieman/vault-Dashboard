import { useEffect, useMemo, useState } from "react";
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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Box,
} from "@mui/material";

export default function Visits() {
  const [merged, setMerged] = useState([]);
  const [stores, setStores] = useState([]);
  const [samples, setSamples] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Planner states
  const [openPlan, setOpenPlan] = useState(false);
  const [plannedVisits, setPlannedVisits] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [plannedSamples, setPlannedSamples] = useState({});
  const [formError, setFormError] = useState("");
  const [inventory, setInventory] = useState([
    { product: "Blue Box", color: "primary", available: 80 },
    { product: "Red Box", color: "error", available: 60 },
    { product: "Green Box", color: "success", available: 70 },
  ]);

  useEffect(() => {
    (async () => {
      const unified = await loadVaultData();
      setMerged(unified);

      // Load both CSVs from /data/
      const parseCSV = (path, callback) => {
        Papa.parse(path, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => callback(res.data),
        });
      };

      parseCSV("/data/users.csv", (userData) => {
        setUsers(userData.filter((user) => user["name__v"]));
        parseCSV("/data/stores.csv", (storeData) => {
          setStores(storeData);
          parseCSV("/data/samples.csv", (sampleData) => {
            setSamples(sampleData.filter((r) => r["store__c.name__v"]));
            setLoading(false);
          });
        });
      });
    })();
  }, []);

  const currentUser = useMemo(() => {
    const sampleReps = new Set(
      samples.map((sample) => sample["salesperson__c.name__v"]).filter(Boolean)
    );

    return (
      users.find((user) => sampleReps.has(user["name__v"]))?.["name__v"] ||
      samples.find((sample) => sample["salesperson__c.name__v"])?.["salesperson__c.name__v"] ||
      "Current User"
    );
  }, [samples, users]);

  const metrics = useMemo(() => {
    if (stores.length === 0) {
      return {
        myStats: { visits: 0, samplesGiven: 0, salesClosed: 0, bonus: "0.00" },
        best: { box: "N/A", store: "N/A" },
        actions: [],
      };
    }

    const mine = merged.filter((d) => d.salesperson === currentUser);
    const visitSet = new Set();

    samples.forEach((s) => {
      const rep = s["salesperson__c.name__v"] || s["salesperson__c"] || "";
      const store = s["store__c.name__v"]?.trim() || "";
      const created = s["created_date__v"];
      if (rep === currentUser && store && created) {
        const day = new Date(created).toISOString().split("T")[0];
        visitSet.add(`${rep}-${store}-${day}`);
      }
    });

    const totalVisits = visitSet.size;
    const totalSamples = mine.reduce((s, d) => s + (d.samplesGiven || 0), 0);
    const totalSales = mine.reduce((s, d) => s + (d.quantitySold || 0), 0);
    const totalProfit = mine.reduce((s, d) => s + (d.profit || 0), 0);

    const myStats = {
      visits: totalVisits,
      samplesGiven: totalSamples,
      salesClosed: totalSales,
      bonus: (totalProfit * 0.2).toFixed(2),
    };

    // --- VISIT / CALL LOGIC ---
    const visitedNames = new Set(
      samples.map((s) => s["store__c.name__v"]?.trim()).filter(Boolean)
    );

    const actions = stores.map((store) => {
      const storeName = store["name__v"]?.trim();
      const hasSample = visitedNames.has(storeName);

      const lastSampleRecord = hasSample
        ? samples
            .filter((s) => s["store__c.name__v"] === storeName)
            .sort((a, b) => new Date(b["created_date__v"]) - new Date(a["created_date__v"]))[0]
        : null;

      const lastSample = lastSampleRecord
        ? new Date(lastSampleRecord["created_date__v"]).toISOString().split("T")[0]
        : "—";

      const focus = hasSample
        ? lastSampleRecord?.["product__c.name__v"] || "Mixed Boxes"
        : "Intro Set";

      const suggestionType = hasSample ? "Call" : "Visit";
      const suggestionText = hasSample
        ? "Previously visited — follow up to ask if they liked the products or want to order."
        : "Unvisited store — plan an introductory visit.";

      return {
        store: storeName,
        contact: store["ownerid__v.name__v"] || "—",
        location: store["primary_parent__v.name__v"] || "—",
        lastSample,
        focus,
        suggestionType,
        suggestionText,
      };
    });

    actions.sort((a, b) => {
      if (a.suggestionType === b.suggestionType) return 0;
      return a.suggestionType === "Call" ? -1 : 1;
    });

    return {
      myStats,
      best: { box: "N/A", store: "N/A" },
      actions,
    };
  }, [stores, samples, merged, currentUser]);

  // --- Planner Logic ---
  const handlePlanSampleChange = (product, value) => {
    const item = inventory.find((stock) => stock.product === product);
    const available = item?.available ?? 0;
    const val = Math.min(available, Math.max(0, parseInt(value || 0, 10)));

    setPlannedSamples((prev) => ({ ...prev, [product]: val }));
  };

  const handleSchedule = () => {
    if (!selectedStore || !selectedDate) {
      setFormError("Please choose a store and date before confirming your visit.");
      return;
    }

    const overReserved = inventory.find(
      (item) => (plannedSamples[item.product] || 0) > item.available
    );

    if (overReserved) {
      setFormError(`Only ${overReserved.available} ${overReserved.product} samples are available.`);
      return;
    }

    setFormError("");
    const selectedStoreData = stores.find(
      (s) => s["name__v"] === selectedStore
    );

    const newVisit = {
      store: selectedStore,
      date: selectedDate,
      samples: { ...plannedSamples },
      contact: selectedStoreData?.["ownerid__v.name__v"] || "—",
      location: selectedStoreData?.["primary_parent__v.name__v"] || "—",
    };

    setPlannedVisits((prev) => [...prev, newVisit]);

    setInventory((prev) =>
      prev.map((i) => ({
        ...i,
        available: i.available - (plannedSamples[i.product] || 0),
      }))
    );

    // Reset form state and close modal
    setSelectedStore("");
    setSelectedDate("");
    setPlannedSamples({});
    setOpenPlan(false);
  };

  if (loading)
    return (
      <Typography color="text.secondary" sx={{ p: 4 }}>
        Loading data...
      </Typography>
    );

  return (
    <Box sx={{ backgroundColor: "#f7f9fc", minHeight: "100vh", p: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700} color="#1a237e">
        Upcoming Visits Preparation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Plan your visits and manage sample stock
      </Typography>

      {/* Overview Row */}
      <Grid container spacing={2} marginBottom={3}>
        {/* My Stats */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                My Stats This Month
              </Typography>
              <Typography>Visits: <strong>{metrics.myStats.visits}</strong></Typography>
              <Typography>Samples Given: <strong>{metrics.myStats.samplesGiven}</strong></Typography>
              <Typography>Sales Closed: <strong>{metrics.myStats.salesClosed}</strong></Typography>
              <Typography mt={1}>
                Bonus: <span style={{ color: "green", fontWeight: 600 }}>${metrics.myStats.bonus}</span>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Sample Inventory
              </Typography>
              {inventory.map((item) => (
                <Typography key={item.product} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <Chip size="small" color={item.color} sx={{ mr: 1 }} />
                  {item.product}:{" "}
                  <strong style={{ marginLeft: 4, color: item.available < 10 ? "red" : "inherit" }}>
                    {item.available} available
                  </strong>
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Visit */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Plan Next Visit
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Schedule a store visit and reserve your samples
              </Typography>
              <Button variant="contained" color="primary" onClick={() => setOpenPlan(true)}>
                + Schedule Visit
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Planned Visits FIRST */}
      <Card elevation={3} sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Planned Visits
          </Typography>
          <TableContainer component={Paper}>
            <Table
              sx={{
                "& th": { backgroundColor: "#f0f2fa", color: "#1a237e", fontWeight: 600 },
                "& td": { color: "#333" },
                "& tr:hover": { backgroundColor: "#f1f5ff" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Store</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Samples Planned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plannedVisits.map((v, i) => (
                  <TableRow key={`${v.store}-${i}`}>
                    <TableCell>{v.store}</TableCell>
                    <TableCell>{v.contact}</TableCell>
                    <TableCell>{v.location}</TableCell>
                    <TableCell>{v.date}</TableCell>
                    <TableCell>
                      {Object.entries(v.samples)
                        .filter(([, qty]) => qty > 0)
                        .map(([product, qty]) => (
                          <Chip
                            key={product}
                            label={`${product}: ${qty}`}
                            color={
                              product.includes("Blue")
                                ? "primary"
                                : product.includes("Red")
                                ? "error"
                                : "success"
                            }
                            size="small"
                            sx={{ mr: 0.5 }}
                          />
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
                {plannedVisits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                      No planned visits yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Suggested Actions BELOW */}
      <Card elevation={3} sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Suggested Next Actions
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table
              sx={{
                "& th": { backgroundColor: "#f0f2fa", color: "#1a237e", fontWeight: 600 },
                "& td": { color: "#333" },
                "& tr:hover": { backgroundColor: "#f1f5ff" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Store</TableCell>
                  <TableCell>Parent Location</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Last Sample</TableCell>
                  <TableCell>Focus Box</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.actions.map((a) => (
                  <TableRow key={a.store}>
                    <TableCell>{a.store}</TableCell>
                    <TableCell>{a.location}</TableCell>
                    <TableCell>{a.contact}</TableCell>
                    <TableCell>{a.lastSample}</TableCell>
                    <TableCell>
                      <Chip
                        label={a.focus}
                        color={
                          a.focus.includes("Blue")
                            ? "primary"
                            : a.focus.includes("Green")
                            ? "success"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.suggestionType}
                        color={a.suggestionType === "Visit" ? "primary" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{a.suggestionText}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Schedule Visit Modal */}
      <Dialog
        open={openPlan}
        onClose={() => {
          setOpenPlan(false);
          setFormError("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Schedule New Visit</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Store"
            fullWidth
            margin="normal"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            {stores.map((s) => (
              <MenuItem key={s["name__v"]} value={s["name__v"]}>
                {s["name__v"]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="normal"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Typography variant="subtitle1" fontWeight={600} mt={3} mb={1}>
            Samples to Bring
          </Typography>
          <Grid container spacing={1}>
            {inventory.map((i) => (
              <Grid item xs={4} key={i.product}>
                <TextField
                  type="number"
                  label={i.product}
                  fullWidth
                  value={plannedSamples[i.product] ?? ""}
                  inputProps={{ min: 0, max: i.available }}
                  onChange={(e) => handlePlanSampleChange(i.product, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>

          {formError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {formError}
            </Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            fullWidth
            disabled={!selectedStore || !selectedDate}
            onClick={handleSchedule}
          >
            Confirm Visit
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
