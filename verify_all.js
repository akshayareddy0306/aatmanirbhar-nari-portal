const fs = require('fs');
const path = require('path');

// Mock localStorage and window
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; }
};

global.window = {
  localStorage: global.localStorage,
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  unescape: (str) => decodeURIComponent(str),
  addEventListener: () => {}
};

// Mock IndexedDB
global.indexedDB = null;

// Load db.js
const dbCode = fs.readFileSync(path.join(__dirname, 'js', 'db.js'), 'utf8');
const vm = require('vm');
const context = {
  console,
  localStorage: global.localStorage,
  window: global.window,
  Buffer: global.Buffer,
  indexedDB: null
};
vm.createContext(context);
vm.runInContext(dbCode + '\nwindow.ANN_DB = ANN_DB;', context);
const ANN_DB = context.window.ANN_DB;

async function run() {
  console.log('--- 1. Testing DB Initialization ---');
  await ANN_DB.init();
  const users = ANN_DB.getAllUsers ? ANN_DB.getAllUsers() : JSON.parse(store['ann_users']);
  console.log('Total users seeded:', users.length);
  const akshaya = users.find(u => u.email === 'pattiakshayareddy03@gmail.com');
  console.log('Akshaya Reddy seeded:', !!akshaya);
  if (!akshaya) throw new Error('Akshaya Reddy not found in seeded users');

  console.log('--- 2. Testing Image Rendering ---');
  const jhumkaImg = await ANN_DB.getImage('img-seed-jhumka');
  console.log('Jhumka image prefix:', jhumkaImg.substring(0, 30));
  if (!jhumkaImg.startsWith('data:image/svg+xml;base64,')) {
    throw new Error('Jhumka image is not a valid base64 data url');
  }

  const sakhiCover = await ANN_DB.getImage('img-seed-biz-sakhi');
  console.log('Sakhi cover prefix:', sakhiCover.substring(0, 30));
  if (!sakhiCover.startsWith('data:image/svg+xml;base64,')) {
    throw new Error('Sakhi cover is not a valid base64 data url');
  }

  console.log('--- 3. Testing Akshaya Login ---');
  const loginRes = ANN_DB.login('entrepreneur', 'pattiakshayareddy03@gmail.com', 'password123');
  console.log('Login success:', loginRes.success, 'User:', loginRes.user.name);
  if (!loginRes.success) throw new Error('Failed to login with Akshaya credentials');

  console.log('--- 4. Testing Resilient Registration (Repeated Register) ---');
  const regRes = ANN_DB.registerSeller({
    fullName: 'Akshaya Reddy',
    email: 'pattiakshayareddy03@gmail.com',
    phone: '+91 98765 12345',
    password: 'password123',
    businessName: 'Akshaya Handcrafted Jewels & Studio',
    category: 'Jewelry & Accessories',
    description: 'Updated description during live pitch',
    state: 'Telangana',
    city: 'Hyderabad',
    locality: 'Banjara Hills',
    pincode: '500034',
    serviceArea: 'Pan-India Delivery'
  });
  console.log('Registration success:', regRes.success, 'Business:', regRes.business.name);
  if (!regRes.success) throw new Error('Registration should succeed resiliently');

  console.log('--- 5. Testing Approved Businesses & Cover Images ---');
  const approvedBiz = ANN_DB.getApprovedBusinesses();
  console.log('Approved businesses count:', approvedBiz.length);
  for (const b of approvedBiz) {
    console.log(`- ${b.name}: coverImageId = ${b.coverImageId}`);
    if (!b.coverImageId) throw new Error(`Business ${b.name} missing coverImageId`);
  }

  console.log('--- 6. Testing Approved Products & Product Photos ---');
  const approvedProds = ANN_DB.getApprovedProducts();
  console.log('Approved products count:', approvedProds.length);
  for (const p of approvedProds) {
    console.log(`- ${p.name}: price = ₹${p.price}, images = ${p.imageIds.join(', ')}`);
    const pImg = await ANN_DB.getImage(p.imageIds[0]);
    if (!pImg.startsWith('data:image/svg+xml;base64,')) {
      throw new Error(`Product ${p.name} image is not valid Base64`);
    }
  }

  console.log('\n========================================');
  console.log('ALL VERIFICATION ASSERTIONS PASSED 100%!');
  console.log('========================================');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
