// Static demo data to display when backend endpoints are unavailable (e.g., 404)
export const demo = {
  suppliers: [
    {
      _id: '64a1a1a1a1a1a1a1a1a1a1a1',
      name: 'Acme Med Supplies',
      phone: '9998887777',
      licenseNumber: 'LIC-ACME-001',
      address: { street: '42 Health Park', city: 'MedCity', state: 'MH', pincode: '400001' },
      suppliedMedicines: [],
    },
  ],
  pharmacies: [
    {
      _id: '64b2b2b2b2b2b2b2b2b2b2b2',
      name: 'City Care Pharmacy',
      phone: '8887776666',
      address: { street: '7 Wellness Ave', city: 'HealTown', state: 'DL', pincode: '110001' },
      medicine_data: [],
    },
  ],
  medicines: [
    {
      _id: '64c3c3c3c3c3c3c3c3c3c3c3',
      name: 'Paracetamol 500mg',
      price: 30,
      stockAvailable: 120,
      manufactureDate: new Date(Date.now() - 1000*60*60*24*120).toISOString(),
      expiryDate: new Date(Date.now() + 1000*60*60*24*240).toISOString(),
    },
    {
      _id: '64d4d4d4d4d4d4d4d4d4d4d4',
      name: 'Amoxicillin 250mg',
      price: 85,
      stockAvailable: 60,
      manufactureDate: new Date(Date.now() - 1000*60*60*24*90).toISOString(),
      expiryDate: new Date(Date.now() + 1000*60*60*24*180).toISOString(),
    },
  ],
  orders: [
    {
      _id: '64e5e5e5e5e5e5e5e5e5e5e5',
      pharmacy: '64b2b2b2b2b2b2b2b2b2b2b2',
      receivedFrom: '64a1a1a1a1a1a1a1a1a1a1a1',
      medicines: [
        { medicine: '64c3c3c3c3c3c3c3c3c3c3c3', quantity: 15 },
        { medicine: '64d4d4d4d4d4d4d4d4d4d4d4', quantity: 10 },
      ],
      orderType: 'supplierConfirmed',
      status: 'confirmed',
      orderDate: new Date(Date.now() - 1000*60*60*24*2).toISOString(),
    },
  ],
};
