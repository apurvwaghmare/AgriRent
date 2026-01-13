const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test configuration
const config = {
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testAuth() {
  console.log('🚀 Starting Authentication Tests...\n');

  try {
    // Test 1: Customer Registration
    console.log('1. Testing Customer Registration...');
    const customerData = {
      name: 'Test Customer',
      email: 'test@customer.com',
      phone: '+1111111111',
      address: '123 Test Street',
      password: 'testpass123'
    };

    const customerRegResponse = await axios.post(`${BASE_URL}/customer/register`, customerData, config);
    console.log('✅ Customer Registration Success:', customerRegResponse.data.message);
    const customerToken = customerRegResponse.data.data.token;

    // Test 2: Customer Login
    console.log('\n2. Testing Customer Login...');
    const customerLoginResponse = await axios.post(`${BASE_URL}/customer/login`, {
      email: customerData.email,
      password: customerData.password
    }, config);
    console.log('✅ Customer Login Success:', customerLoginResponse.data.message);

    // Test 3: Customer Profile
    console.log('\n3. Testing Customer Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    console.log('✅ Customer Profile Success:', profileResponse.data.data.name);

    // Test 4: Vendor Registration
    console.log('\n4. Testing Vendor Registration...');
    const vendorData = {
      shop_name: 'Test Farm Equipment',
      owner_name: 'Test Vendor',
      email: 'test@vendor.com',
      phone: '+2222222222',
      address: '456 Farm Street',
      city: 'Test City',
      password: 'vendorpass123'
    };

    const vendorRegResponse = await axios.post(`${BASE_URL}/vendor/register`, vendorData, config);
    console.log('✅ Vendor Registration Success:', vendorRegResponse.data.message);

    // Test 5: Vendor Login (should fail - pending approval)
    console.log('\n5. Testing Vendor Login (should be pending)...');
    try {
      await axios.post(`${BASE_URL}/vendor/login`, {
        email: vendorData.email,
        password: vendorData.password
      }, config);
    } catch (error) {
      if (error.response && error.response.data.message.includes('pending')) {
        console.log('✅ Vendor Login Correctly Blocked:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 6: Admin Login
    console.log('\n6. Testing Admin Login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/admin/login`, {
      email: 'admin@agriculture-rental.com',
      password: 'admin123'
    }, config);
    console.log('✅ Admin Login Success:', adminLoginResponse.data.message);

    console.log('\n🎉 All Authentication Tests Passed!');

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Helper function to test server health
async function testServerHealth() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first.');
    console.log('Run: cd backend && npm start');
    return false;
  }
}

async function main() {
  console.log('Agriculture Equipment Rental - Auth Test Suite\n');
  
  const serverRunning = await testServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }
  
  console.log('');
  await testAuth();
}

// Run tests
main().catch(console.error);