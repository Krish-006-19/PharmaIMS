import React, { useState } from "react";

export default function Customers() {
  const [customers, setCustomers] = useState(["Dr. Sharma", "Patient Gupta"]);
  const [newCustomer, setNewCustomer] = useState("");

  const addCustomer = () => {
    if (!newCustomer) return;
    setCustomers([...customers, newCustomer]);
    setNewCustomer("");
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">👨‍⚕️ Customers</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newCustomer}
          onChange={(e) => setNewCustomer(e.target.value)}
          placeholder="New Customer"
          className="border p-1 rounded flex-1"
        />
        <button onClick={addCustomer} className="bg-blue-600 text-white px-3 py-1 rounded">
          + Add
        </button>
      </div>

      <ul className="list-disc ml-6 text-gray-700">
        {customers.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </section>
  );
}
