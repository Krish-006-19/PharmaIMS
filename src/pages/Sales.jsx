import React, { useState } from "react";
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
  const [sales, setSales] = useState([
    { item: "Paracetamol", qty: 2, customer: "Dr. Sharma" },
    { item: "Amoxicillin", qty: 1, customer: "Patient Gupta" },
  ]);
  const [form, setForm] = useState({ item: "", qty: "", customer: "" });

  const addSale = () => {
    if (!form.item || !form.qty || !form.customer) return;
    setSales([...sales, { ...form, qty: Number(form.qty) }]);
    setForm({ item: "", qty: "", customer: "" });
  };

  // Aggregate data for chart
  const itemSales = sales.reduce((acc, s) => {
    acc[s.item] = (acc[s.item] || 0) + s.qty;
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

      {/* Add Sale Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Medicine"
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
          className="border p-1 rounded"
        />
        <input
          type="number"
          placeholder="Qty"
          value={form.qty}
          onChange={(e) => setForm({ ...form, qty: e.target.value })}
          className="border p-1 rounded w-20"
        />
        <input
          type="text"
          placeholder="Customer"
          value={form.customer}
          onChange={(e) => setForm({ ...form, customer: e.target.value })}
          className="border p-1 rounded"
        />
        <button
          onClick={addSale}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          + Add
        </button>
      </div>

      {/* Sales List */}
      <ul className="space-y-2 mb-6">
        {sales.map((s, i) => (
          <li key={i} className="border p-2 rounded text-gray-700">
            {s.item} x {s.qty} → {s.customer}
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
