import React, { useEffect, useState } from 'react';
import * as localApi from '../lib/localApi';

// Pharmacies UI — replaces former Customers page
// - list pharmacies (GET /api/pharmacies)
// - create pharmacy (POST /api/pharmacies)
// - place demand/order to supplier (POST /api/pharmacies/:id/order)

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: { street: '', city: '', state: '', pincode: '' },
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // order modal state
  const [orderModal, setOrderModal] = useState({ open: false, pharmacyId: null });
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [orderRows, setOrderRows] = useState([]); // { medicine: id, quantity }
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
      const data = await localApi.getPharmacies();
      setPharmacies(data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load pharmacies');
    } finally { setLoading(false); }
  }

  async function fetchSuppliers() {
    try { const p = await localApi.getSuppliers(); setSuppliers(p || []); } catch (e) { }
  }

  async function fetchMedicines() {
    try { const p = await localApi.getMedicines(); setMedicines(p || []); } catch (e) { }
  }

  function validateForm() {
    const errs = {};
    if (!form.name || String(form.name).trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!/^\d{10}$/.test(String(form.phone || ''))) errs.phone = 'Phone must be 10 digits';
    if (form.address.pincode && !/^\d{4,6}$/.test(form.address.pincode)) errs.pincode = 'Pincode should be 4-6 digits';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function createPharmacy() {
    if (!validateForm()) return setError('Please fix form errors');
    setError('');
    try {
      const p = await localApi.createPharmacy(form);
      setPharmacies((s) => [p, ...s]);
      setForm({ name: '', phone: '', address: { street: '', city: '', state: '', pincode: '' } });
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
      const payload = { receivedFrom: selectedSupplier, medicines: orderRows.map(r => ({ medicine: r.medicine, quantity: Number(r.quantity) })) };
      const result = await localApi.placePharmacyOrder(orderModal.pharmacyId, payload);
      alert('Order placed');
      setOrderModal({ open: false, pharmacyId: null });
      // refresh history for this pharmacy if visible
      if (orderModal.pharmacyId) fetchPharmacyHistory(orderModal.pharmacyId);
    } catch (err) { console.error(err); alert(err.message || 'Server error'); }
    finally { setPlacingOrder(false); }
  }

  async function fetchPharmacyHistory(pharmacyId) {
    if (!pharmacyId) return;
    setHistoryLoading(true);
    setHistoryPharmacyId(pharmacyId);
    try {
      const data = await localApi.getPharmacyHistory(pharmacyId);
      setPharmacyHistory(data || []);
    } catch (err) {
      console.error(err);
      setPharmacyHistory([]);
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
          <button onClick={() => setForm({ name: '', phone: '', address: { street: '', city: '', state: '', pincode: '' } })} className="border px-3 py-1 rounded">Clear</button>
        </div>

        <input className="border p-1 rounded md:col-span-3" placeholder="Street" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} />
        <input className="border p-1 rounded md:col-span-2" placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
        <input className="border p-1 rounded md:col-span-1" placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
        <div className="md:col-span-1">
          <input className="border p-1 rounded w-full" placeholder="Pincode" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} />
          {fieldErrors.pincode && <div className="text-red-600 text-sm">{fieldErrors.pincode}</div>}
        </div>
      </div>

      <div>
        <ul className="divide-y">
          {pharmacies.map((p) => (
            <li key={p._id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-gray-600">{p.phone} • {p.address?.city || ''}</div>
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

      {/* Order modal (simple inline panel) */}
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

      {/* Pharmacy History table */}
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
