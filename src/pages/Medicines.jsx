import React, { useState } from "react";

export default function Medicines() {
  const [medicines, setMedicines] = useState([
    { name: "Paracetamol", qty: 120, expiry: "2025-12-31", price: 20 },
    { name: "Amoxicillin", qty: 45, expiry: "2024-09-10", price: 35 },
  ]);
  const [form, setForm] = useState({ name: "", qty: "", expiry: "", price: "" });

  const handleAdd = () => {
    if (!form.name || !form.qty || !form.expiry || !form.price) return;
    setMedicines([...medicines, { ...form, qty: Number(form.qty), price: Number(form.price) }]);
    setForm({ name: "", qty: "", expiry: "", price: "" });
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">📦 Stock of Medicines</h2>
      </div>

      {/* Add form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
          type="date"
          value={form.expiry}
          onChange={(e) => setForm({ ...form, expiry: e.target.value })}
          className="border p-1 rounded"
        />
        <input
          type="number"
          placeholder="₹ Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-1 rounded w-24"
        />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded">
          + Add
        </button>
      </div>

      {/* Medicines table */}
      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">Expiry Date</th>
            <th className="p-2 border">Price</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m, i) => (
            <tr key={i} className={new Date(m.expiry) < new Date() ? "bg-red-100" : "hover:bg-gray-50"}>
              <td className="p-2 border">{m.name}</td>
              <td className="p-2 border">{m.qty}</td>
              <td className={`p-2 border ${new Date(m.expiry) < new Date() ? "text-red-600" : ""}`}>
                {m.expiry}
              </td>
              <td className="p-2 border">₹{m.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
