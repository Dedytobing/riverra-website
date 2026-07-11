import React from "react";
// 1. Tambahkan BrowserRouter di sini
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Homepage from "./pages/Homepage.jsx";
import FamilyTree from "./pages/FamilyTree.jsx"; // Sekalian impor halaman silsilah keluarga
import Admin from "./pages/Admin.jsx";

function AppContent() {
  const { pathname } = useLocation();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/family-tree" element={<FamilyTree />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}

function App() {
  return <Router><AppContent /></Router>;
}

export default App;
