import React, { useEffect, useState } from "react";
import axios from 'axios';
import { demo } from '../lib/demoData';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stockAvailable: "",
    manufactureDate: "",
    expiryDate: "",
    supplierId: "", 
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [defaultPharmacyId, setDefaultPharmacyId] = useState("");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  async function fetchMedicines() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get('https://pharmacy-proj-1.onrender.com/medicine');
      const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setMedicines(data || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setMedicines(demo.medicines);
      } else {
        console.error(err);
        setError("Could not load medicines");
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuppliersList() {
    try {
      const res = await axios.get('https://pharmacy-proj-1.onrender.com/supplier');
      setSuppliers(res.data?.data || []);
    } catch (err) {
      if (err?.response?.status === 404) setSuppliers(demo.suppliers); else console.warn('Could not load suppliers for selection', err);
    }
  }

  async function fetchDefaultPharmacy() {
    try {
      const res = await axios.get('https://pharmacy-proj-1.onrender.com/pharmacy');
      const list = res.data?.data || [];
      if (list.length > 0) setDefaultPharmacyId(list[0]._id);
    } catch (err) {
      if (err?.response?.status === 404) {
        if ((demo.pharmacies || []).length > 0) setDefaultPharmacyId(demo.pharmacies[0]._id);
      } else {
        console.warn('Could not determine default pharmacy', err);
      }
    }
  }

  useEffect(() => { fetchSuppliersList(); fetchDefaultPharmacy(); }, []);

  useEffect(() => {
    fetchOrders();
    function onPlaced() { fetchOrders(); }
    window.addEventListener('order:placed', onPlaced);
    return () => window.removeEventListener('order:placed', onPlaced);
  }, []);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const res = await axios.get('https://pharmacy-proj-1.onrender.com/order');
      const raw = Array.isArray(res.data?.orders) ? res.data.orders : (Array.isArray(res.data?.data) ? res.data.data : []);
      const normalizeId = (v) => (typeof v === 'object' && v?._id) ? v._id : v;
      const flat = (raw || []).map(o => ({
        ...o,
        pharmacy: normalizeId(o.pharmacy),
        receivedFrom: normalizeId(o.receivedFrom),
        medicines: (o.medicines||[]).map(mi => ({ medicine: normalizeId(mi.medicine), quantity: Number(mi.quantity||0) }))
      }));
      setOrders(flat);
    } catch (err) {
      if (err?.response?.status === 404) {
        setOrders(demo.orders || []);
      } else {
        console.warn('Failed to load orders', err);
        setOrders([]);
      }
    } finally {
      setOrdersLoading(false);
    }
  }

  function resetForm() {
  setForm({ name: "", price: "", stockAvailable: "", manufactureDate: "", expiryDate: "", supplierId: "" });
    setEditingId(null);
  }

  function validateForm() {
    const errors = {};
    if (!form.name || String(form.name).trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) errors.price = 'Price must be a non-negative number.';
    if (form.stockAvailable === '' || isNaN(Number(form.stockAvailable)) || Number(form.stockAvailable) < 0) errors.stockAvailable = 'Stock must be a non-negative integer.';
    if (form.manufactureDate && form.expiryDate) {
      const m = new Date(form.manufactureDate);
      const e = new Date(form.expiryDate);
      if (m > e) errors.expiryDate = 'Expiry must be after manufacture date.';
    }
  if (!editingId && (!form.supplierId || !/^[0-9a-fA-F]{24}$/.test(form.supplierId))) errors.supplierId = 'Valid supplier id is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0 ? null : errors;
  }

  async function handleSubmit() {
    const validation = validateForm();
    if (validation) return setError('Please fix form errors');
    setError("");

    const payload = {
      name: form.name,
      price: Number(form.price),
      stockAvailable: Number(form.stockAvailable),
      manufactureDate: form.manufactureDate || undefined,
      expiryDate: form.expiryDate || undefined,
    };

    try {
      if (editingId) {
        const res = await axios.put(`https://pharmacy-proj-1.onrender.com/medicine/${editingId}`, payload);
        const result = res.data?.data || res.data;
        if (result) setMedicines(prev => prev.map(m => m._id === result._id ? result : m));
        resetForm();
      } else {
        const pharmacyIdToUse = defaultPharmacyId;
        if (!pharmacyIdToUse) {
          setError('Please create a Pharmacy first from the Pharmacies page to add medicines.');
          return;
        }
        const res = await axios.post(`https://pharmacy-proj-1.onrender.com/medicine/${pharmacyIdToUse}` , payload);
        const result = res.data?.data || res.data;
        setMedicines(prev => [result, ...prev]);
        resetForm();
      }
      setFieldErrors({});
    } catch (err) {
      console.error(err);
      setError(err.message || "Server error");
    }
  }

  function startEdit(med) {
    setEditingId(med._id);
    setForm({
      name: med.name || "",
      price: med.price ?? "",
      stockAvailable: med.stockAvailable ?? "",
      manufactureDate: med.manufactureDate ? med.manufactureDate.split("T")[0] : "",
      expiryDate: med.expiryDate ? med.expiryDate.split("T")[0] : "",
  supplierId: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">📦 Stock of Medicines</h2>
        <div className="text-sm text-gray-500">{loading ? "Loading..." : `${medicines.length} items`}</div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-1 rounded w-full"
          />
          {fieldErrors.name && <div className="text-red-600 text-sm">{fieldErrors.name}</div>}
        </div>
        <div className="md:col-span-1">
          <input
            type="number"
            placeholder="Stock"
            value={form.stockAvailable}
            onChange={(e) => setForm({ ...form, stockAvailable: e.target.value })}
            className="border p-1 rounded w-full"
          />
          {fieldErrors.stockAvailable && <div className="text-red-600 text-sm">{fieldErrors.stockAvailable}</div>}
        </div>
        <input
          type="date"
          value={form.manufactureDate}
          onChange={(e) => setForm({ ...form, manufactureDate: e.target.value })}
          className="border p-1 rounded md:col-span-1"
        />
        <div className="md:col-span-1">
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="border p-1 rounded w-full"
          />
          {fieldErrors.expiryDate && <div className="text-red-600 text-sm">{fieldErrors.expiryDate}</div>}
        </div>
        <div className="md:col-span-1">
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-1 rounded w-full"
          />
          {fieldErrors.price && <div className="text-red-600 text-sm">{fieldErrors.price}</div>}
        </div>

        {!editingId && (
          <div className="md:col-span-2 space-y-1">
            {suppliers.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="border p-1 rounded flex-1"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <button type="button" onClick={fetchSuppliersList} className="px-2 py-1 border rounded text-sm">Refresh</button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Supplier Id (select after registering supplier)"
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="border p-1 rounded w-full"
              />
            )}
            {form.supplierId && (
              <div className="text-xs text-gray-600 break-all">Selected Supplier ID: {form.supplierId} <button type="button" className="ml-2 underline" onClick={() => navigator.clipboard?.writeText(form.supplierId)}>Copy</button></div>
            )}
            {fieldErrors.supplierId && <div className="text-red-600 text-sm">{fieldErrors.supplierId}</div>}
          </div>
        )}

        <div className="md:col-span-2 ml-6 flex gap-2">
          <button onClick={handleSubmit} disabled={Boolean(Object.keys(fieldErrors).length)} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60">
            {editingId ? "Save changes" : "+ Add"}
          </button>
          <button onClick={resetForm} className="border px-3 py-1 rounded">
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border">Manufacture</th>
              <th className="p-2 border">Expiry Date</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m._id} className={m.expiryDate && new Date(m.expiryDate) < new Date() ? "bg-red-100" : "hover:bg-gray-50"}>
                <td className="p-2 border">{m.name}</td>
                <td className="p-2 border">{m.stockAvailable ?? 0}</td>
                <td className="p-2 border">{m.manufactureDate ? m.manufactureDate.split("T")[0] : "-"}</td>
                <td className={`p-2 border ${m.expiryDate && new Date(m.expiryDate) < new Date() ? "text-red-600" : ""}`}>
                  {m.expiryDate ? m.expiryDate.split("T")[0] : "-"}
                </td>
                <td className="p-2 border">₹{m.price}</td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(m)} className="text-sm px-2 py-1 border rounded">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {medicines.length === 0 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">No medicines found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Recent Orders</h3>
        {ordersLoading && <div className="text-sm text-gray-500">Loading orders…</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border">Order ID</th>
                <th className="p-2 border">Supplier</th>
                <th className="p-2 border">Pharmacy</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="p-2 border break-all">{o._id}</td>
                  <td className="p-2 border">{(suppliers.find(s => s._id === o.receivedFrom)?.name) || o.receivedFrom || '-'}</td>
                  <td className="p-2 border">{o.pharmacy}</td>
                  <td className="p-2 border">{o.status || o.orderType || '-'}</td>
                  <td className="p-2 border">{o.orderDate ? new Date(o.orderDate).toLocaleString() : '-'}</td>
                  <td className="p-2 border">
                    <ul className="list-disc pl-4">
                      {o.medicines?.map(mi => <li key={mi.medicine}>{mi.medicine} — {mi.quantity}</li>)}
                    </ul>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-gray-500">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
