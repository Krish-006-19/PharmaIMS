import React from "react";

export default function Layout({ setCurrentPage, children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 text-center font-bold text-xl text-blue-700 border-b">
          PharmaIMS
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setCurrentPage("medicines")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">📦 Medicines</button>
          <button onClick={() => setCurrentPage("suppliers")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">🏭 Suppliers</button>
          <button onClick={() => setCurrentPage("pharmacies")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">🏥 Pharmacies</button>
          <button onClick={() => setCurrentPage("sales")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">🧾 Sales</button>
          <button onClick={() => setCurrentPage("alerts")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">⚠️ Alerts</button>
          <button onClick={() => setCurrentPage("reports")} className="w-full px-4 py-2 text-left hover:bg-blue-50 rounded-lg">📊 Reports</button>
        </nav>
        <div className="p-4 border-t text-sm text-gray-500">© 2025 PharmaIMS</div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Pharmaceutical Inventory Management
          </h1>
          <div className="text-gray-600 text-sm">Admin</div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
