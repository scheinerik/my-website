import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Schedule from "./components/Schedule.jsx";
import Layout from "./components/Layout";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><App /></Layout>} />
        <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);