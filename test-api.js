const axios = require('axios');

const baseURL = 'http://localhost:3000';
let authToken = '';
let sessionId = '';
let orderId = '';
let billId = '';

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 5000,
});

// Test data
const testData = {
  user: {
    name: "Test Admin",
    email: "test@restaurant.com",
    password: "password123"
  },
  tables: [
    { tableNumber: 1, capacity: 4 },
    { tableNumber: 2, capacity: 6 }
  ],
  menuItems: [
    {
      name: "Pad Thai",
      price: 12.99,
      description: "Traditional Thai stir-fried noodles",
      foodtype: "Main Course"
    },
    {
      name: "Tom Yum Soup",
      price: 8.99,
      description: "Spicy and sour Thai soup",
      foodtype: "Appetizer"
    },
    {
      name: "Mango Sticky Rice",
      price: 6.99,
      description: "Sweet Thai dessert",
      foodtype: "Dessert"
    }
  ]
};

async function testAPI() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // 1. Health Check
    console.log('1. Testing Health Check...');
    const health = await api.get('/');
    console.log('✅ Health Check:', health.data);

    // 2. Create Staff User
    console.log('\n2. Creating Staff User...');
    try {
      const user = await api.post('/users/staff', testData.user);
      console.log('✅ Staff User Created:', user.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  User already exists, continuing...');
      } else {
        throw error;
      }
    }

    // 3. Login
    console.log('\n3. Testing Login...');
    const login = await api.post('/auth/login', {
      email: testData.user.email,
      password: testData.user.password
    });
    authToken = login.data.access_token;
    console.log('✅ Login successful, token received');

    // Set auth header for protected routes
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 4. Create Tables
    console.log('\n4. Creating Tables...');
    for (const table of testData.tables) {
      try {
        const tableResult = await api.post('/tables', table);
        console.log(`✅ Table ${table.tableNumber} created:`, tableResult.data);
      } catch (error) {
        console.log(`⚠️  Table ${table.tableNumber} might already exist`);
      }
    }

    // 5. Get All Tables
    console.log('\n5. Getting All Tables...');
    const tables = await api.get('/tables');
    console.log('✅ Tables:', tables.data);

    // 6. Create Menu Items
    console.log('\n6. Creating Menu Items...');
    for (const item of testData.menuItems) {
      try {
        const menuResult = await api.post('/menu', item);
        console.log(`✅ Menu item "${item.name}" created:`, menuResult.data);
      } catch (error) {
        console.log(`⚠️  Menu item "${item.name}" might already exist`);
      }
    }

    // 7. Get Menu
    console.log('\n7. Getting Menu...');
    const menu = await api.get('/menu');
    console.log('✅ Menu Items:', menu.data);

    // 8. Create Session
    console.log('\n8. Creating Session...');
    const session = await api.post('/sessions', {
      qrCodeToken: 'table-1-token-test123',
      meta: { deviceType: 'test', customerName: 'Test Customer' }
    });
    sessionId = session.data.id;
    console.log('✅ Session created:', session.data);

    // 9. Create Order
    console.log('\n9. Creating Order...');
    const order = await api.post('/orders', {
      sessionId: sessionId,
      items: [
        { menuItemId: 1, quantity: 2, note: 'Test order' },
        { menuItemId: 2, quantity: 1 }
      ]
    });
    orderId = order.data.id;
    console.log('✅ Order created:', order.data);

    // 10. Get Orders Queue
    console.log('\n10. Getting Orders Queue...');
    const queue = await api.get('/orders/queue');
    console.log('✅ Orders Queue:', queue.data);

    // 11. Update Order Status
    console.log('\n11. Updating Order Status...');
    const statusUpdate = await api.patch(`/orders/${orderId}/status`, {
      status: 'IN_PROGRESS'
    });
    console.log('✅ Order status updated:', statusUpdate.data);

    // 12. Create Bill
    console.log('\n12. Creating Bill...');
    const bill = await api.post('/bills', { tableId: 1 });
    billId = bill.data.id;
    console.log('✅ Bill created:', bill.data);

    // 13. Get Bill
    console.log('\n13. Getting Bill...');
    const billDetails = await api.get(`/bills/${billId}`);
    console.log('✅ Bill details:', billDetails.data);

    // 14. Pay Bill
    console.log('\n14. Paying Bill...');
    const payment = await api.patch(`/bills/${billId}/pay`);
    console.log('✅ Bill paid:', payment.data);

    // 15. Test Error Cases
    console.log('\n15. Testing Error Cases...');

    // Invalid login
    try {
      await api.post('/auth/login', {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid login correctly rejected:', error.response.status);
    }

    // Non-existent resource
    try {
      await api.get('/orders/999');
    } catch (error) {
      console.log('✅ Non-existent order correctly rejected:', error.response.status);
    }

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();