import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Medicines from "./pages/Medicines";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 text-center font-bold text-xl text-blue-700 border-b">
          PharmaIMS
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            📦 Medicines
          </Link>
          <Link
            to="/suppliers"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            🏭 Suppliers
          </Link>
          <Link
            to="/customers"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            👨‍⚕️ Customers
          </Link>
          <Link
            to="/sales"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            🧾 Sales
          </Link>
          <Link
            to="/alerts"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            ⚠️ Alerts
          </Link>
          <Link
            to="/reports"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            📊 Reports
          </Link>
        </nav>
        <div className="p-4 border-t text-sm text-gray-500">© 2025 PharmaIMS</div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Pharmaceutical Inventory Management
          </h1>
          <div className="text-gray-600 text-sm">Admin</div>
        </header>

        {/* Page content changes with route */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Medicines />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
