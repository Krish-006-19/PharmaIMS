import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Sales() {
  importLocalApi: true;
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const localApi = await import('../lib/localApi');
    const [os, ss, ms] = await Promise.all([localApi.getOrders(), localApi.getSuppliers(), localApi.getMedicines()]);
    setOrders(os || []);
    setSuppliers(ss || []);
    setMedicines(ms || []);
  }

  // Build viewable sales rows from orders. We treat supplier-related confirmed orders as sales for that supplier.
  const visibleOrders = orders.filter(o => {
    if (!selectedSupplier) return true;
    // treat orders where receivedFrom === supplierId as supplier's sales/orders
    return o.receivedFrom === selectedSupplier;
  });

  const salesRows = visibleOrders
    .filter(o => o.status === 'confirmed' || o.orderType === 'supplierConfirmed' || o.orderType === 'sale')
    .flatMap(o => (o.medicines || []).map(it => ({
      orderId: o._id,
      medicineId: it.medicine,
      quantity: Number(it.quantity || 0),
      pharmacy: o.pharmacy,
      supplier: o.receivedFrom,
      date: o.orderDate,
    })));

  const itemSales = salesRows.reduce((acc, s) => {
    const name = (medicines.find(m => m._id === s.medicineId) || {}).name || s.medicineId;
    acc[name] = (acc[name] || 0) + (s.quantity || 0);
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(itemSales),
    datasets: [
      {
        label: "Units Sold",
        data: Object.values(itemSales),
        backgroundColor: "rgba(37, 99, 235, 0.7)",
      },
    ],
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">🧾 Sales & Billing Dashboard</h2>

      {/* Supplier filter */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">View as supplier:</label>
        {suppliers.length > 0 ? (
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="border p-1 rounded">
            <option value="">All suppliers / admin view</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} — {s._id}</option>)}
          </select>
        ) : (
          <input placeholder="Supplier id (optional)" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="border p-1 rounded" />
        )}
      </div>

      {/* Sales List (derived from confirmed supplier orders) */}
      <ul className="space-y-2 mb-6">
        {salesRows.length === 0 && <li className="text-gray-500">No sales/orders found for the selected supplier.</li>}
        {salesRows.map((s, i) => (
          <li key={i} className="border p-2 rounded text-gray-700">
            {(medicines.find(m => m._id === s.medicineId) || {}).name || s.medicineId} x {s.quantity} → Pharmacy: {s.pharmacy}
            <div className="text-xs text-gray-500">Date: {s.date ? new Date(s.date).toLocaleString() : '-'}</div>
          </li>
        ))}
      </ul>

      {/* Chart */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-md font-semibold mb-2">📊 Sales by Medicine</h3>
        <Bar data={chartData} />
      </div>
    </section>
  );
}
