const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING E-COMMERCE MVP API AUTOMATED TESTS');
  console.log('====================================================');

  await new Promise((r) => setTimeout(r, 1000));

  // 1. Healthcheck
  console.log('\n[1/5] Testing GET /health ...');
  const healthRes = await request('GET', '/health');
  console.log('Response:', healthRes.data);
  if (healthRes.status !== 200 || healthRes.data.database !== 'connected') {
    throw new Error('Healthcheck test failed: database not connected');
  }

  // 2. Auth: Login Admin & Get JWT
  console.log('\n[2/5] Testing POST /api/auth/login (Admin account) ...');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  console.log('Response status:', loginRes.status, '| User:', loginRes.data.user);
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Admin login failed');
  }
  const adminToken = loginRes.data.token;

  // 2b. Auth: Register New Customer
  console.log('\n[2b/5] Testing POST /api/auth/register (New Customer) ...');
  const testUsername = `user_${Date.now()}`;
  const registerRes = await request('POST', '/api/auth/register', {
    username: testUsername,
    fullname: 'Test Customer',
    password: 'password123',
    roleid: 2,
    mid: 1
  });
  console.log('Registered User:', registerRes.data.user);
  if (registerRes.status !== 201) {
    throw new Error('Customer registration failed');
  }

  // Login as Customer
  const customerLoginRes = await request('POST', '/api/auth/login', {
    username: testUsername,
    password: 'password123'
  });
  const customerToken = customerLoginRes.data.token;

  // 3. Products CRUD
  console.log('\n[3/5] Testing Products CRUD ...');
  // 3a. Create Product (with JWT)
  const createProdRes = await request(
    'POST',
    '/api/products',
    { pname: 'Smart Noise-Cancelling Headphones', price: 199.99, quantity: 30 },
    adminToken
  );
  console.log('Created Product:', createProdRes.data);
  if (createProdRes.status !== 201) {
    throw new Error('Create product failed');
  }
  const createdPid = createProdRes.data.pid;

  // 3b. Read all products
  const listProdRes = await request('GET', '/api/products');
  console.log(`Found ${listProdRes.data.length} products`);
  if (listProdRes.status !== 200 || listProdRes.data.length === 0) {
    throw new Error('List products failed');
  }

  // 3c. Update product
  const updateProdRes = await request(
    'PUT',
    `/api/products/${createdPid}`,
    { price: 179.99, quantity: 25 },
    adminToken
  );
  console.log('Updated Product Price & Quantity:', updateProdRes.data);
  if (updateProdRes.status !== 200) {
    throw new Error('Update product failed');
  }

  // 4. Order & Shipment placement
  console.log('\n[4/5] Testing POST /api/orders (Place Order) ...');
  const orderRes = await request(
    'POST',
    '/api/orders',
    {
      items: [
        { pid: createdPid, qty: 2 }
      ]
    },
    customerToken
  );
  console.log('Order created successfully:');
  console.log('- Order ID:', orderRes.data.order.oid);
  console.log('- Items count:', orderRes.data.order.orderDetails.length);
  console.log('- Shipment Status:', orderRes.data.order.shipments[0].status);

  if (
    orderRes.status !== 201 ||
    !orderRes.data.order.shipments ||
    orderRes.data.order.shipments.length === 0
  ) {
    throw new Error('Order creation test failed');
  }

  // 4b. Get Orders list
  const getOrdersRes = await request('GET', '/api/orders', null, customerToken);
  console.log(`Customer retrieved ${getOrdersRes.data.length} orders`);
  if (getOrdersRes.status !== 200 || getOrdersRes.data.length === 0) {
    throw new Error('Get orders failed');
  }

  // 5. Clean up created product (Testing DELETE)
  console.log('\n[5/5] Testing DELETE /api/products/:pid ...');
  // First delete order details or create another temp product to delete
  const tempProdRes = await request(
    'POST',
    '/api/products',
    { pname: 'Temporary Product to Delete', price: 10.0, quantity: 5 },
    adminToken
  );
  const deleteRes = await request('DELETE', `/api/products/${tempProdRes.data.pid}`, null, adminToken);
  console.log('Delete Product response:', deleteRes.data.message);
  if (deleteRes.status !== 200) {
    throw new Error('Delete product failed');
  }

  console.log('\n====================================================');
  console.log('  ALL E-COMMERCE MVP TESTS PASSED SUCCESSFULLY! 🚀');
  console.log('====================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err.message);
  process.exit(1);
});
