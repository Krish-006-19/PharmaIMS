import React, { useEffect, useState } from "react";
import axios from 'axios';
import { demo } from '../lib/demoData';
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
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    function onPlaced() {
      fetchOrders(pharmacyId);
    }
    window.addEventListener('order:placed', onPlaced);
    return () => window.removeEventListener('order:placed', onPlaced);
  }, [pharmacyId]);

  async function fetchInitialData() {
    try {
      const [sRes, mRes] = await Promise.all([
        axios.get('https://pharmacy-proj-1.onrender.com/supplier'),
        axios.get('https://pharmacy-proj-1.onrender.com/medicine'),
      ]);
      setSuppliers(sRes.data?.data || []);
      const medicinesRaw = Array.isArray(mRes.data?.data) ? mRes.data.data : (Array.isArray(mRes.data) ? mRes.data : []);
      setMedicines(medicinesRaw || []);
    } catch (err) {
      console.warn('Failed to load suppliers/medicines, using demo if available', err);
      if (!suppliers?.length && demo?.suppliers) setSuppliers(demo.suppliers);
      if (!medicines?.length && demo?.medicines) setMedicines(demo.medicines);
    } finally {
      fetchOrders("");
    }
  }

  function normalizeOrders(raw) {
    const normalizeId = (v) => (typeof v === 'object' && v?._id) ? v._id : v;
    return (raw || []).map(o => ({
      ...o,
      pharmacy: normalizeId(o.pharmacy),
      receivedFrom: normalizeId(o.receivedFrom),
      medicines: (o.medicines || []).map(mi => ({ medicine: normalizeId(mi.medicine), quantity: Number(mi.quantity || 0) })),
    }));
  }

  async function fetchOrders(id) {
    setLoading(true);
    setError("");
    let ordersRaw = [];
    try {
      const isPharmacyView = !!id && /^([0-9a-fA-F]{24})$/.test(id);
      if (isPharmacyView) {
        const res = await axios.get(`https://pharmacy-proj-1.onrender.com/pharmacy/${id}/history`);
        ordersRaw = Array.isArray(res.data?.data) ? res.data.data : [];
      } else {
        const oRes = await axios.get('https://pharmacy-proj-1.onrender.com/order');
        ordersRaw = Array.isArray(oRes.data?.orders) ? oRes.data.orders : (Array.isArray(oRes.data?.data) ? oRes.data.data : []);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        ordersRaw = Array.isArray(demo?.orders) ? demo.orders : [];
        if (id) ordersRaw = ordersRaw.filter(o => o.pharmacy === id);
      } else {
        console.error(err);
        setError('Could not load orders');
      }
    } finally {
      setOrders(normalizeOrders(ordersRaw));
      setLoading(false);
    }
  }
  const baseOrders = (() => {
    if (pharmacyId && /^([0-9a-fA-F]{24})$/.test(pharmacyId)) {
      return orders.filter(o => o.pharmacy === pharmacyId);
    }
    return orders.filter(o => !selectedSupplier || o.receivedFrom === selectedSupplier);
  })();

  const salesRows = baseOrders
    .filter(o => {
      if (pharmacyId && /^([0-9a-fA-F]{24})$/.test(pharmacyId)) return true; 
      return o.status === 'confirmed' || o.orderType === 'supplierConfirmed' || o.orderType === 'sale';
    })
    .flatMap(o => (o.medicines || []).map(it => ({
      orderId: o._id,
      medicineId: it.medicine,
      quantity: Number(it.quantity || 0),
      pharmacy: o.pharmacy,
      supplier: o.receivedFrom,
      date: o.orderDate,
      status: o.status || o.orderType,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">View for pharmacy:</label>
          <input
            placeholder="Paste Pharmacy ID"
            value={pharmacyId}
            onChange={e => setPharmacyId(e.target.value)}
            className="border p-1 rounded flex-1"
          />
          <button onClick={() => fetchOrders(pharmacyId)} className="border px-3 py-1 rounded">Load</button>
          <button onClick={() => { setPharmacyId(""); fetchOrders(""); }} className="border px-3 py-1 rounded">Clear</button>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {loading && <div className="mb-2 text-sm text-gray-500">Loading orders…</div>}
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      <ul className="space-y-2 mb-6">
        {salesRows.length === 0 && (
          <li className="text-gray-500">
            {pharmacyId ? 'No orders found for this pharmacy.' : 'No sales/orders found for the selected supplier.'}
          </li>
        )}
        {salesRows.map((s, i) => (
          <li key={i} className="border p-2 rounded text-gray-700">
            {(medicines.find(m => m._id === s.medicineId) || {}).name || s.medicineId} x {s.quantity} → Pharmacy: {s.pharmacy}
            <div className="text-xs text-gray-500">Date: {s.date ? new Date(s.date).toLocaleString() : '-'}{s.status ? ` • Status: ${s.status}` : ''}</div>
          </li>
        ))}
      </ul>

      <div className="bg-gray-50 p-4 rounded">
        <h3 className="text-md font-semibold mb-2">📊 {pharmacyId ? 'Orders by Medicine (Pharmacy view)' : 'Sales by Medicine'}</h3>
        <Bar data={chartData} />
      </div>
    </section>
  );
}
