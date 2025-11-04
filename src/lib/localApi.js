// Network-backed API client wired to the Render backend
// Use env var when provided, otherwise:
// - on localhost, use Vite's dev proxy at /api to avoid CORS
// - in production, fall back to the deployed backend URL
const isLocal = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.host);
const BASE = (import.meta?.env?.VITE_API_BASE)
  || (isLocal ? '/api' : 'https://pharmacy-proj-1.onrender.com');

function normalizeId(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && val._id) return val._id;
  return val;
}

function normalizeOrder(o) {
  if (!o) return o;
  const medicines = Array.isArray(o.medicines)
    ? o.medicines.map(mi => ({ medicine: normalizeId(mi.medicine), quantity: Number(mi.quantity || 0) }))
    : [];
  return {
    ...o,
    pharmacy: normalizeId(o.pharmacy),
    receivedFrom: normalizeId(o.receivedFrom),
    medicines,
  };
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const finalHeaders = { ...(headers || {}) };
  // Only set JSON content-type when we actually send a body
  if (body && method && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Medicines
export async function getMedicines() {
  const json = await request('/medicine');
  const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
  return list;
}

// ownerId here is pharmacyId as per backend route POST /medicine/:pharmaId
export async function createMedicine(ownerId, payload) {
  if (!ownerId) throw new Error('pharmacyId is required to create a medicine');
  const json = await request(`/medicine/${ownerId}`, { method: 'POST', body: payload });
  return json?.data || json;
}

export async function updateMedicine(id, update) {
  if (!id) throw new Error('id required');
  const json = await request(`/medicine/${id}`, { method: 'PUT', body: update });
  return json?.data || json;
}

// Pharmacies
export async function getPharmacies() {
  const json = await request('/pharmacy');
  return Array.isArray(json?.data) ? json.data : [];
}

export async function createPharmacy(payload) {
  const json = await request('/pharmacy', { method: 'POST', body: payload });
  return json?.data || json;
}

export async function getPharmacyHistory(pharmacyId) {
  const json = await request(`/pharmacy/${pharmacyId}/history`);
  const list = Array.isArray(json?.data) ? json.data : [];
  return list.map(normalizeOrder);
}

// Create order for a pharmacy. If payload.receivedFrom is provided, it will hit /order/placeOrder/:pharmacyId/:supplierId
// Otherwise, it will hit /pharmacy/:id/order to move stock internally.
export async function placePharmacyOrder(pharmacyId, payload) {
  if (!pharmacyId) throw new Error('pharmacyId required');
  const { receivedFrom, medicines } = payload || {};
  if (!Array.isArray(medicines) || medicines.length === 0) throw new Error('medicines array required');
  if (receivedFrom) {
    const json = await request(`/order/placeOrder/${pharmacyId}/${receivedFrom}`, { method: 'POST', body: { medicines } });
    return normalizeOrder(json?.data || json);
  }
  const json = await request(`/pharmacy/${pharmacyId}/order`, { method: 'POST', body: { medicines } });
  return normalizeOrder(json?.data || json);
}

// Suppliers
export async function getSuppliers() {
  const json = await request('/supplier');
  return Array.isArray(json?.data) ? json.data : [];
}

export async function createSupplier(payload) {
  const json = await request('/supplier', { method: 'POST', body: payload });
  return json?.data || json;
}

export async function getSupplierById(id) {
  const json = await request(`/supplier/${id}`);
  return json?.data || json;
}

export async function getSupplierHistory(supplierId) {
  const json = await request(`/supplier/${supplierId}/history`);
  const list = Array.isArray(json?.data) ? json.data : [];
  return list.map(normalizeOrder);
}

export async function processSupplierOrder(supplierId, { orderId, action, reason }) {
  const json = await request(`/supplier/${supplierId}/order`, { method: 'PUT', body: { orderId, action, reason } });
  return normalizeOrder(json?.data || json);
}

// Orders
export async function getOrders() {
  const json = await request('/order');
  const list = Array.isArray(json?.orders) ? json.orders : (Array.isArray(json?.data) ? json.data : []);
  return list.map(normalizeOrder);
}
