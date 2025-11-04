import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import axios from 'axios';

import Medicines from "./pages/Medicines";
import Suppliers from "./pages/Suppliers";
import Pharmacies from "./pages/Pharmacies";
import Sales from "./pages/Sales";

export default function App() {
  const [seeding, setSeeding] = useState(false);

  async function seedDemo() {
    if (seeding) return;
    setSeeding(true);
    try {
      const supRes = await axios.post('https://pharmacy-proj-1.onrender.com/supplier', {
        name: 'Demo Supplier',
        phone: '9998887777',
        licenseNumber: 'LIC-DEMO-001',
        address: { street: '1 Demo Street', city: 'Demo City', state: 'DL', pincode: '110001' },
      });
      const supplier = supRes.data?.data || supRes.data;

      const phRes = await axios.post('https://pharmacy-proj-1.onrender.com/pharmacy', {
        name: 'Demo Pharmacy',
        phone: '8887776666',
        address: { street: '2 Health Ave', city: 'Health City', state: 'MH', pincode: '400001' },
      });
      const pharmacy = phRes.data?.data || phRes.data;

      const m1Res = await axios.post(`https://pharmacy-proj-1.onrender.com/medicine/${pharmacy._id}`, {
        name: 'Paracetamol 500mg', price: 30, stockAvailable: 100,
        manufactureDate: new Date(Date.now() - 1000*60*60*24*60).toISOString(),
        expiryDate: new Date(Date.now() + 1000*60*60*24*300).toISOString(),
      });
      const m2Res = await axios.post(`https://pharmacy-proj-1.onrender.com/medicine/${pharmacy._id}`, {
        name: 'Amoxicillin 250mg', price: 85, stockAvailable: 50,
        manufactureDate: new Date(Date.now() - 1000*60*60*24*90).toISOString(),
        expiryDate: new Date(Date.now() + 1000*60*60*24*200).toISOString(),
      });
      const med1 = m1Res.data?.data || m1Res.data;
      const med2 = m2Res.data?.data || m2Res.data;

      const orderRes = await axios.post(`https://pharmacy-proj-1.onrender.com/order/placeOrder/${pharmacy._id}/${supplier._id}`, {
        medicines: [
          { medicine: med1._id, quantity: 15 },
          { medicine: med2._id, quantity: 10 },
        ],
      });
      const order = orderRes.data?.data || orderRes.data;

      await axios.put(`https://pharmacy-proj-1.onrender.com/supplier/${supplier._id}/order`, {
        orderId: order._id,
        action: 'accept',
      });

      alert('Seeded demo data: supplier, pharmacy, medicines, one confirmed order. Refresh lists to see it.');
    } catch (err) {
      console.error('Seeding failed', err);
      alert('Seeding failed. If you see 404 on /pharmacy, deploy backend with /pharmacy route mounted.');
    } finally {
      setSeeding(false);
    }
  }
  return (
    <div className="flex h-screen bg-gray-100">
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
            to="/pharmacies"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            🏥 Pharmacies
          </Link>
          <Link
            to="/sales"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
          >
            🧾 Sales
          </Link>
        </nav>
        <div className="p-4 border-t text-sm text-gray-500">© 2025 PharmaIMS</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Pharmaceutical Inventory Management
          </h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Medicines />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/sales" element={<Sales />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
