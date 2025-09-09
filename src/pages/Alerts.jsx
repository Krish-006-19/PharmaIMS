import React, { useState } from "react";

export default function Alerts() {
  const [alerts, setAlerts] = useState(["Amoxicillin has expired (2024-09-10)!"]);
  const [newAlert, setNewAlert] = useState("");

  const addAlert = () => {
    if (!newAlert) return;
    setAlerts([...alerts, newAlert]);
    setNewAlert("");
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">⚠️ Expiry Alerts</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newAlert}
          onChange={(e) => setNewAlert(e.target.value)}
          placeholder="New Alert"
          className="border p-1 rounded flex-1"
        />
        <button onClick={addAlert} className="bg-blue-600 text-white px-3 py-1 rounded">
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="p-3 bg-red-100 text-red-700 rounded">
            {a}
          </div>
        ))}
      </div>
    </section>
  );
}
