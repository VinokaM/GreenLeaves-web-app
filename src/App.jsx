import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./page/Login";
import Register from "./page/Register";
import DashboardScreen from "./page/Dashboard";
import BuyerManagement from "./page/Buyer/BuyerManagement";
import BuyerOrderScreen from "./page/Buyer/BuyerOrderScreen";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<DashboardScreen />} />

        <Route
          path="/dashboard/BuyerManagement"
          element={<BuyerManagement />}
        />
        <Route path="/dashboard/BuyerOrder" element={<BuyerOrderScreen />} />

        {/* 404 fallback */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
