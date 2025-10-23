import React from "react";

export default function Reports() {
  // Normally you'd pull these numbers from state or backend
  const totalMedicines = 15;
  const totalSuppliers = 4;
  const totalPharmacies = 20;
  const totalSales = 57;

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-6">📊 Reports Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded shadow text-center">
          <h3 className="text-gray-600 text-sm">Medicines</h3>
          <p className="text-2xl font-bold text-blue-700">{totalMedicines}</p>
        </div>
        <div className="bg-green-50 p-4 rounded shadow text-center">
          <h3 className="text-gray-600 text-sm">Suppliers</h3>
          <p className="text-2xl font-bold text-green-700">{totalSuppliers}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded shadow text-center">
          <h3 className="text-gray-600 text-sm">Pharmacies</h3>
          <p className="text-2xl font-bold text-yellow-700">{totalPharmacies}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded shadow text-center">
          <h3 className="text-gray-600 text-sm">Total Sales</h3>
          <p className="text-2xl font-bold text-purple-700">{totalSales}</p>
        </div>
      </div>

      {/* Placeholder for charts/analytics */}
      <div className="bg-gray-50 p-6 rounded">
        <h3 className="text-md font-semibold mb-2">📈 Analytics</h3>
        <p className="text-gray-600">
          Future enhancement: Show sales trends, monthly revenue charts,
          supplier performance, and expiry trends.
        </p>
      </div>
    </section>
  );
}
