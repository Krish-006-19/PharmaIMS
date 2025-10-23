// Simple localStorage-backed API to replace network fetches for development
// Data keys
const KEYS = {
  medicines: 'pharma_medicines',
  pharmacies: 'pharma_pharmacies',
  suppliers: 'pharma_suppliers',
  orders: 'pharma_orders'
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function write(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function genId() {
  // generate 24 hex chars similar to Mongo ObjectId
  let s = '';
  const hex = '0123456789abcdef';
  for (let i = 0; i < 24; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

function ensure() {
  if (!read(KEYS.medicines)) write(KEYS.medicines, []);
  if (!read(KEYS.pharmacies)) write(KEYS.pharmacies, []);
  if (!read(KEYS.suppliers)) write(KEYS.suppliers, []);
  if (!read(KEYS.orders)) write(KEYS.orders, []);
}

ensure();

export async function getMedicines() {
  return Promise.resolve(read(KEYS.medicines) || []);
}

export async function createMedicine(ownerId, payload) {
  const medicines = read(KEYS.medicines) || [];
  const pharmacies = read(KEYS.pharmacies) || [];
  const suppliers = read(KEYS.suppliers) || [];
  const _id = genId();
  const doc = { _id, ...payload };
  medicines.unshift(doc);
  write(KEYS.medicines, medicines);
  // attach to pharmacy if ownerId matches a pharmacy
  const p = pharmacies.find(p => p._id === ownerId);
  if (p) {
    if (!Array.isArray(p.medicine_data)) p.medicine_data = [];
    p.medicine_data.push(_id);
    write(KEYS.pharmacies, pharmacies);
    return Promise.resolve(doc);
  }
  // attach to supplier if ownerId matches a supplier
  const s = suppliers.find(s => s._id === ownerId);
  if (s) {
    if (!Array.isArray(s.suppliedMedicines)) s.suppliedMedicines = [];
    s.suppliedMedicines.push(_id);
    write(KEYS.suppliers, suppliers);
    return Promise.resolve(doc);
  }
  return Promise.resolve(doc);
}

export async function updateMedicine(id, update) {
  const medicines = read(KEYS.medicines) || [];
  const idx = medicines.findIndex(m => m._id === id);
  if (idx === -1) return Promise.resolve(null);
  medicines[idx] = { ...medicines[idx], ...update };
  write(KEYS.medicines, medicines);
  return Promise.resolve(medicines[idx]);
}

export async function getPharmacies() {
  return Promise.resolve(read(KEYS.pharmacies) || []);
}

export async function createPharmacy(payload) {
  const pharmacies = read(KEYS.pharmacies) || [];
  const _id = genId();
  const doc = { _id, ...payload, medicine_data: [] };
  pharmacies.unshift(doc);
  write(KEYS.pharmacies, pharmacies);
  return Promise.resolve(doc);
}

export async function getPharmacyHistory(pharmacyId) {
  const orders = read(KEYS.orders) || [];
  const list = (orders.filter(o => o.pharmacy === pharmacyId) || []).sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate));
  return Promise.resolve(list);
}

export async function placePharmacyOrder(pharmacyId, payload) {
  const orders = read(KEYS.orders) || [];
  const _id = genId();
  const doc = { _id, pharmacy: pharmacyId, receivedFrom: payload.receivedFrom, medicines: payload.medicines, orderType: payload.orderType || 'supplierRequest', status: 'pending', orderDate: new Date().toISOString() };
  orders.unshift(doc);
  write(KEYS.orders, orders);
  return Promise.resolve(doc);
}

export async function getSuppliers() {
  return Promise.resolve(read(KEYS.suppliers) || []);
}

export async function createSupplier(payload) {
  const suppliers = read(KEYS.suppliers) || [];
  const _id = genId();
  const doc = { _id, ...payload };
  suppliers.unshift(doc);
  write(KEYS.suppliers, suppliers);
  return Promise.resolve(doc);
}

export async function getSupplierById(id) {
  const suppliers = read(KEYS.suppliers) || [];
  return Promise.resolve(suppliers.find(s => s._id === id) || null);
}

export async function getSupplierHistory(supplierId) {
  const orders = read(KEYS.orders) || [];
  const list = (orders.filter(o => o.receivedFrom === supplierId) || []).sort((a,b)=>new Date(b.orderDate)-new Date(a.orderDate));
  return Promise.resolve(list);
}

export async function processSupplierOrder(supplierId, { orderId, action, reason }) {
  const orders = read(KEYS.orders) || [];
  const medicines = read(KEYS.medicines) || [];
  const idx = orders.findIndex(o => o._id === orderId);
  if (idx === -1) return Promise.reject(new Error('Order not found'));
  const order = orders[idx];
  if (order.receivedFrom && order.receivedFrom !== supplierId) return Promise.reject(new Error('Not authorized'));
  if (order.status && order.status !== 'pending') return Promise.reject(new Error('Order already processed'));
  if (action === 'reject') {
    order.status = 'rejected';
    order.rejectionReason = reason || '';
    order.orderType = 'supplierRejected';
    orders[idx] = order;
    write(KEYS.orders, orders);
    return Promise.resolve(order);
  }
  // accept
  for (const item of order.medicines || []) {
    const m = medicines.find(mm => mm._id === item.medicine);
    if (m) {
      m.stockAvailable = (m.stockAvailable || 0) + Number(item.quantity || 0);
    }
  }
  order.status = 'confirmed';
  order.orderType = 'supplierConfirmed';
  orders[idx] = order;
  write(KEYS.orders, orders);
  write(KEYS.medicines, medicines);
  return Promise.resolve(order);
}

export async function getOrders() {
  return Promise.resolve(read(KEYS.orders) || []);
}
