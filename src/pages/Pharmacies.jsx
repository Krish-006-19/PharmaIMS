import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { demo } from '../lib/demoData';

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const [orderModal, setOrderModal] = useState({ open: false, pharmacyId: null });
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [orderRows, setOrderRows] = useState([]); 
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pharmacyHistory, setPharmacyHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPharmacyId, setHistoryPharmacyId] = useState(null);

  useEffect(() => { fetchList(); fetchSuppliers(); fetchMedicines(); }, []);

  async function fetchList() {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('https://pharmacy-proj-1.onrender.com/pharmacy');
      setPharmacies(res.data?.data || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        setPharmacies(demo.pharmacies);
      } else {
        console.error(err);
        setError('Could not load pharmacies');
      }
    } finally { setLoading(false); }
  }

  async function fetchSuppliers() {
    try { const res = await axios.get('https://pharmacy-proj-1.onrender.com/supplier'); setSuppliers(res.data?.data || []); } catch (err) { if (err?.response?.status === 404) setSuppliers(demo.suppliers); else console.warn('Failed to load suppliers', err); }
  }

  async function fetchMedicines() {
    try { const res = await axios.get('https://pharmacy-proj-1.onrender.com/medicine'); const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []); setMedicines(list || []); } catch (err) { if (err?.response?.status === 404) setMedicines(demo.medicines); else console.warn('Failed to load medicines', err); }
  }

  function validateForm() {
    const errs = {};
    if (!form.name || String(form.name).trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!/^\d{10}$/.test(String(form.phone || ''))) errs.phone = 'Phone must be 10 digits';
    if (!form.address || String(form.address).trim().length < 3) errs.address = 'Address is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function createPharmacy() {
    if (!validateForm()) return setError('Please fix form errors');
    setError('');
    try {
      const res = await axios.post('https://pharmacy-proj-1.onrender.com/pharmacy', form);
      const p = res.data?.data || res.data;
      setPharmacies((s) => [p, ...s]);
      setForm({ name: '', phone: '', address: '' });
      setFieldErrors({});
    } catch (err) { console.error(err); setError(err.message || 'Server error'); }
  }

  function openOrder(pharmacyId) {
    setOrderRows([]);
    setSelectedSupplier('');
    setOrderModal({ open: true, pharmacyId });
  }

  function addOrderRow() { setOrderRows((r) => [...r, { medicine: '', quantity: '' }]); }
  function updateOrderRow(idx, key, value) { setOrderRows((r) => r.map((row, i) => i === idx ? { ...row, [key]: value } : row)); }
  function removeOrderRow(idx) { setOrderRows((r) => r.filter((_, i) => i !== idx)); }

  function validateOrder() {
    if (!orderModal.pharmacyId) return 'Invalid pharmacy';
    if (!selectedSupplier || !/^\w+$/.test(selectedSupplier)) return 'Select supplier';
    if (!Array.isArray(orderRows) || orderRows.length === 0) return 'Add at least one medicine';
    for (const r of orderRows) {
      if (!r.medicine || !/^([0-9a-fA-F]{24})$/.test(r.medicine)) return 'Select valid medicine in each row';
      if (!r.quantity || isNaN(Number(r.quantity)) || Number(r.quantity) < 1) return 'Quantity must be >= 1';
    }
    return null;
  }

  async function placeOrder() {
    const v = validateOrder();
    if (v) return alert(v);
    setPlacingOrder(true);
    try {
      const payload = { medicines: orderRows.map(r => ({ medicine: r.medicine, quantity: Number(r.quantity) })) };
      if (selectedSupplier) {
        await axios.post(`https://pharmacy-proj-1.onrender.com/order/placeOrder/${orderModal.pharmacyId}/${selectedSupplier}`, payload);
      } else {
        await axios.post(`https://pharmacy-proj-1.onrender.com/pharmacy/${orderModal.pharmacyId}/order`, payload);
      }
      alert('Order placed');
      try {
        window.dispatchEvent(new CustomEvent('order:placed', { detail: { pharmacyId: orderModal.pharmacyId, supplierId: selectedSupplier || null } }));
      } catch {}
      setOrderModal({ open: false, pharmacyId: null });
      if (orderModal.pharmacyId) fetchPharmacyHistory(orderModal.pharmacyId);
    } catch (err) { console.error(err); alert(err.message || 'Server error'); }
    finally { setPlacingOrder(false); }
  }

  async function fetchPharmacyHistory(pharmacyId) {
    if (!pharmacyId) return;
    setHistoryLoading(true);
    setHistoryPharmacyId(pharmacyId);
    try {
      const res = await axios.get(`https://pharmacy-proj-1.onrender.com/pharmacy/${pharmacyId}/history`);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const flat = list.map(o => ({
        ...o,
        pharmacy: typeof o.pharmacy === 'object' ? o.pharmacy?._id : o.pharmacy,
        receivedFrom: typeof o.receivedFrom === 'object' ? o.receivedFrom?._id : o.receivedFrom,
        medicines: (o.medicines||[]).map(mi => ({ medicine: typeof mi.medicine === 'object' ? mi.medicine?._id : mi.medicine, quantity: mi.quantity }))
      }));
      setPharmacyHistory(flat || []);
    } catch (err) {
      if (err?.response?.status === 404) {
        const flat = (demo.orders || []).filter(o => o.pharmacy === pharmacyId);
        setPharmacyHistory(flat);
      } else {
        console.error(err);
        setPharmacyHistory([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🏥 Pharmacies</h2>
        <div className="text-sm text-gray-500">{loading ? 'Loading...' : `${pharmacies.length} listed`}</div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
        <div className="md:col-span-2">
          <input className="border p-1 rounded w-full" placeholder="Pharmacy name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <div className="text-red-600 text-sm">{fieldErrors.name}</div>}
        </div>
        <div className="md:col-span-2">
          <input className="border p-1 rounded w-full" placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {fieldErrors.phone && <div className="text-red-600 text-sm">{fieldErrors.phone}</div>}
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button onClick={createPharmacy} className="bg-blue-600 text-white px-3 py-1 rounded">+ Add</button>
          <button onClick={() => setForm({ name: '', phone: '', address: '' })} className="border px-3 py-1 rounded">Clear</button>
        </div>
        <div className="md:col-span-4">
          <input className="border p-1 rounded w-full" placeholder="Address (single line)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {fieldErrors.address && <div className="text-red-600 text-sm">{fieldErrors.address}</div>}
        </div>
      </div>

      <div>
        <ul className="divide-y">
          {pharmacies.map((p) => (
            <li key={p._id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">{p.phone} • {typeof p.address === 'string' ? p.address : ''}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openOrder(p._id)} className="px-2 py-1 border rounded text-sm">Place demand</button>
                <button onClick={() => navigator.clipboard?.writeText(p._id)} className="px-2 py-1 border rounded text-sm">Copy ID</button>
                <button onClick={() => fetchPharmacyHistory(p._id)} className="px-2 py-1 border rounded text-sm">History</button>
              </div>
            </li>
          ))}
          {pharmacies.length === 0 && <li className="p-3 text-center text-gray-500">No pharmacies found</li>}
        </ul>
      </div>

      {orderModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6">
          <div className="bg-white rounded-lg shadow p-4 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Place demand for pharmacy</h3>
              <button onClick={() => setOrderModal({ open: false, pharmacyId: null })} className="px-2 py-1">Close</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div className="md:col-span-2">
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="border p-1 rounded w-full">
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-1 text-sm text-gray-500">Supplier will receive this demand</div>
            </div>

            <div className="space-y-2">
              {orderRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={row.medicine} onChange={(e) => updateOrderRow(i, 'medicine', e.target.value)} className="border p-1 rounded flex-1">
                    <option value="">Select medicine...</option>
                    {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <input type="number" min="1" placeholder="Qty" value={row.quantity} onChange={(e) => updateOrderRow(i, 'quantity', e.target.value)} className="border p-1 rounded w-28" />
                  <button onClick={() => removeOrderRow(i)} className="px-2 py-1 border rounded">Remove</button>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={addOrderRow} className="px-3 py-1 border rounded">+ Add medicine</button>
                <button onClick={placeOrder} disabled={placingOrder} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60">{placingOrder ? 'Placing...' : 'Send demand'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Pharmacy Order History</h3>
        {historyLoading && <div>Loading history...</div>}
        {!historyLoading && historyPharmacyId && (
          <div className="overflow-x-auto bg-white border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Order ID</th>
                  <th className="p-2 border">Supplier</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Items</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyHistory.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="p-2 border break-all">{o._id}</td>
                    <td className="p-2 border">{o.receivedFrom || '-'}</td>
                    <td className="p-2 border">{o.status}</td>
                    <td className="p-2 border">{o.orderDate ? new Date(o.orderDate).toLocaleString() : '-'}</td>
                    <td className="p-2 border">
                      <ul className="list-disc pl-4">
                        {o.medicines?.map(mi => <li key={mi.medicine}>{mi.medicine} — {mi.quantity}</li>)}
                      </ul>
                    </td>
                  </tr>
                ))}
                {pharmacyHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">No history for selected pharmacy</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
