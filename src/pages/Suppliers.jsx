import React, { useEffect, useState } from "react";
import * as localApi from '../lib/localApi';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    address: { street: "", city: "", state: "", pincode: "" },
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedSupplierOrders, setSelectedSupplierOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderAction, setOrderAction] = useState({ orderId: null, action: null, reason: '' });
  const [expandedSuppliers, setExpandedSuppliers] = useState({});

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    setLoading(true);
    setError("");
    try {
      const data = await localApi.getSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      console.error(err);
      setError("Could not load suppliers");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", phone: "", licenseNumber: "", address: { street: "", city: "", state: "", pincode: "" } });
  }

  function validate() {
    const errs = {};
    if (!form.name || String(form.name).trim().length < 2) errs.name = 'Name is required (min 2 chars)';
    if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Phone must be 10 digits';
    if (form.address.pincode && !/^\d{4,6}$/.test(form.address.pincode)) errs.pincode = 'Pincode should be 4-6 digits';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0 ? null : errs;
  }

  async function createSupplier() {
    const v = validate();
    if (v) return setError('Please fix form errors');
    setError("");
    try {
      const payload = await localApi.createSupplier(form);
      setSuppliers((p) => [payload, ...p]);
      resetForm();
      setFieldErrors({});
    } catch (err) {
      console.error(err);
      setError(err.message || "Server error");
    }
  }

  async function fetchSupplierOrders(supplierId) {
    setOrdersLoading(true);
    try {
      const payload = await localApi.getSupplierHistory(supplierId);
      setSelectedSupplierOrders(payload || []);
      setExpandedSuppliers(prev => ({ ...prev, [supplierId]: payload || [] }));
    } catch (err) {
      console.error(err);
      setSelectedSupplierOrders([]);
      setExpandedSuppliers(prev => ({ ...prev, [supplierId]: [] }));
    } finally { setOrdersLoading(false); }
  }

  async function processOrder() {
    const { orderId, action, reason } = orderAction;
    if (!orderId || !['accept','reject'].includes(action)) return alert('Invalid action');
    try {
      const payload = await localApi.processSupplierOrder(orderAction.supplierId, { orderId, action: action === 'accept' ? 'accept' : 'reject', reason });
      alert('Done');
      // refresh
      fetchSuppliers();
      if (orderAction.supplierId) fetchSupplierOrders(orderAction.supplierId);
      setOrderAction({ orderId: null, action: null, reason: '' });
    } catch (err) { console.error(err); alert(err.message || 'Server error'); }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🏭 Suppliers</h2>
        <div className="text-sm text-gray-500">{loading ? "Loading..." : `${suppliers.length} suppliers`}</div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
        <div className="md:col-span-2">
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border p-1 rounded w-full" />
          {fieldErrors.name && <div className="text-red-600 text-sm">{fieldErrors.name}</div>}
        </div>
        <div className="md:col-span-2">
          <input type="text" placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border p-1 rounded w-full" />
          {fieldErrors.phone && <div className="text-red-600 text-sm">{fieldErrors.phone}</div>}
        </div>
        <input type="text" placeholder="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="border p-1 rounded md:col-span-2" />

        <input type="text" placeholder="Street" value={form.address.street} onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="border p-1 rounded md:col-span-2" />
        <input type="text" placeholder="City" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="border p-1 rounded md:col-span-2" />
        <input type="text" placeholder="State" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="border p-1 rounded md:col-span-1" />
        <div className="md:col-span-1">
          <input type="text" placeholder="Pincode" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} className="border p-1 rounded w-full" />
          {fieldErrors.pincode && <div className="text-red-600 text-sm">{fieldErrors.pincode}</div>}
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button onClick={createSupplier} disabled={Boolean(Object.keys(fieldErrors).length)} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60">+ Add</button>
          <button onClick={resetForm} className="border px-3 py-1 rounded">Clear</button>
        </div>
      </div>

      <div>
        <ul className="divide-y">
          {suppliers.map((s) => (
            <li key={s._id} className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-gray-600">{s.phone} • {s.licenseNumber || "—"}</div>
                <div className="text-sm text-gray-500">{s.address?.street ? `${s.address.street}, ${s.address.city || ''}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard?.writeText(s._id)} className="px-2 py-1 border rounded text-sm">Copy ID</button>
                <button onClick={async () => { try { const payload = await localApi.getSupplierById(s._id); if (!payload) throw new Error('Failed to fetch'); alert(JSON.stringify(payload, null, 2)); } catch (err) { console.error(err); alert('Could not fetch supplier details'); } }} className="px-2 py-1 border rounded text-sm">View</button>
                <button onClick={() => {
                    // toggle
                    if (expandedSuppliers[s._id]) {
                      setExpandedSuppliers(prev => { const copy = { ...prev }; delete copy[s._id]; return copy; });
                    } else {
                      setOrderAction(prev => ({ ...prev, supplierId: s._id }));
                      fetchSupplierOrders(s._id);
                    }
                  }} className="px-2 py-1 border rounded text-sm">Orders</button>
              </div>
            </li>
          ))}
          {suppliers.length === 0 && <li className="p-3 text-center text-gray-500">No suppliers found</li>}
        </ul>
      </div>

      {/* Render expanded supplier order tables inline */}
      <div className="mt-6 space-y-4">
        {Object.keys(expandedSuppliers).map(sid => {
          const orders = expandedSuppliers[sid] || [];
          return (
            <div key={sid} className="bg-white border rounded">
              <div className="p-3 border-b flex justify-between items-center">
                <div className="font-medium">Orders for supplier {sid}</div>
                <div className="text-sm text-gray-500">{orders.length} orders</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">Order ID</th>
                      <th className="p-2 border">Pharmacy</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Date</th>
                      <th className="p-2 border">Items</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id} className="hover:bg-gray-50">
                        <td className="p-2 border break-all">{o._id}</td>
                        <td className="p-2 border">{o.pharmacy}</td>
                        <td className="p-2 border">{o.status}</td>
                        <td className="p-2 border">{o.orderDate ? new Date(o.orderDate).toLocaleString() : '-'}</td>
                        <td className="p-2 border">
                          <ul className="list-disc pl-4">
                            {o.medicines?.map(mi => <li key={mi.medicine}>{mi.medicine} — {mi.quantity}</li>)}
                          </ul>
                        </td>
                        <td className="p-2 border">
                          {o.status === 'pending' ? (
                            <div className="space-y-2">
                              <input placeholder="Reason (optional)" value={orderAction.orderId === o._id ? orderAction.reason : ''} onChange={(e) => setOrderAction(prev => ({ ...prev, orderId: o._id, supplierId: sid, reason: e.target.value }))} className="border p-1 rounded w-full mb-1" />
                              <div className="flex gap-2">
                                <button onClick={() => { setOrderAction(prev => ({ ...prev, orderId: o._id, action: 'accept', supplierId: sid })); processOrder(); }} className="px-2 py-1 bg-green-600 text-white rounded">Accept</button>
                                <button onClick={() => { setOrderAction(prev => ({ ...prev, orderId: o._id, action: 'reject', supplierId: sid })); processOrder(); }} className="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">No actions</div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-gray-500">No orders for this supplier</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
