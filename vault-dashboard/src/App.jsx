import { useState } from "react";
import { AppBar, Tabs, Tab, Box } from "@mui/material";
import Dashboard from "./components/Dashboard";
import SalesTeam from "./components/SalesTeam";
import StoreAnalytics from "./components/StoreAnalytics";
import Visits from "./components/Visits";

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1} sx={{ backgroundColor: "lightblue" }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Management" />
          <Tab label="Sales Team" />
          <Tab label="Store Analytics" />
          <Tab label="Visits" />
        </Tabs>
      </AppBar>

      {tab === 0 && <Dashboard />}
      {tab === 1 && <SalesTeam />}
      {tab === 2 && <StoreAnalytics />}
      {tab === 3 && <Visits />}
    </Box>
  );
}
