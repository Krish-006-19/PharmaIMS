import React, { useState } from "react";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(["ABC Pharma", "XYZ Distributors"]);
  const [newSupplier, setNewSupplier] = useState("");

  const addSupplier = () => {
    if (!newSupplier) return;
    setSuppliers([...suppliers, newSupplier]);
    setNewSupplier("");
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">🏭 Suppliers</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newSupplier}
          onChange={(e) => setNewSupplier(e.target.value)}
          placeholder="New Supplier"
          className="border p-1 rounded flex-1"
        />
        <button onClick={addSupplier} className="bg-blue-600 text-white px-3 py-1 rounded">
          + Add
        </button>
      </div>

      <ul className="list-disc ml-6 text-gray-700">
        {suppliers.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </section>
  );
}
