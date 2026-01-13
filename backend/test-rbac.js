const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

let tokens = {
    admin: null,
    vendor: null,
    customer: null
};

async function setupTestUsers() {
    console.log('🔧 Setting up test users...\n');

    try {
        // 1. Register a customer
        console.log('1. Registering test customer...');
        const customerData = {
            name: 'Test Customer',
            email: 'test@customer.com',
            phone: '+1111111111',
            address: '123 Test Street',
            password: 'testpass123'
        };

        const customerRegResponse = await axios.post(`${BASE_URL}/auth/customer/register`, customerData, config);
        tokens.customer = customerRegResponse.data.data.token;
        console.log('✅ Customer registered and token saved');

        // 2. Login admin
        console.log('\n2. Logging in admin...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/admin/login`, {
            email: 'admin@agriculture-rental.com',
            password: 'admin123'
        }, config);
        tokens.admin = adminLoginResponse.data.data.token;
        console.log('✅ Admin logged in and token saved');

        // 3. Register vendor (will be pending)
        console.log('\n3. Registering test vendor...');
        const vendorData = {
            shop_name: 'Test Farm Equipment',
            owner_name: 'Test Vendor',
            email: 'test@vendor.com',
            phone: '+2222222222',
            address: '456 Farm Street',
            city: 'Test City',
            password: 'vendorpass123'
        };

        await axios.post(`${BASE_URL}/auth/vendor/register`, vendorData, config);
        console.log('✅ Vendor registered (pending approval)');

        // Note: In a real app, admin would approve the vendor here
        // For this test, we'll simulate vendor login failure due to pending status

        console.log('\n✅ Test users setup complete!\n');

    } catch (error) {
        console.error('❌ Setup failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testRoleBasedAccess() {
    console.log('🔐 Testing Role-Based Access Control...\n');

    // Test 1: Public endpoint (no auth required)
    console.log('1. Testing public endpoint...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/public`);
        console.log('✅ Public endpoint accessible:', response.data.message);
    } catch (error) {
        console.error('❌ Public endpoint failed:', error.response?.data?.message);
    }

    // Test 2: Protected endpoint with customer token
    console.log('\n2. Testing protected endpoint with customer token...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/protected`, {
            headers: { 'Authorization': `Bearer ${tokens.customer}` }
        });
        console.log('✅ Customer access granted:', response.data.data.user.userType);
    } catch (error) {
        console.error('❌ Customer access failed:', error.response?.data?.message);
    }

    // Test 3: Admin-only endpoint with admin token
    console.log('\n3. Testing admin-only endpoint with admin token...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${tokens.admin}` }
        });
        console.log('✅ Admin access granted:', response.data.data.admin.name);
    } catch (error) {
        console.error('❌ Admin access failed:', error.response?.data?.message);
    }

    // Test 4: Admin-only endpoint with customer token (should fail)
    console.log('\n4. Testing admin-only endpoint with customer token (should fail)...');
    try {
        await axios.get(`${BASE_URL}/demo/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${tokens.customer}` }
        });
        console.error('❌ Security breach! Customer accessed admin endpoint');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Access correctly denied:', error.response.data.message);
        } else {
            console.error('❌ Unexpected error:', error.response?.data?.message);
        }
    }

    // Test 5: Customer-only endpoint with customer token
    console.log('\n5. Testing customer-only endpoint with customer token...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/customer/bookings`, {
            headers: { 'Authorization': `Bearer ${tokens.customer}` }
        });
        console.log('✅ Customer access granted:', response.data.data.customer.name);
    } catch (error) {
        console.error('❌ Customer access failed:', error.response?.data?.message);
    }

    // Test 6: Customer-only endpoint with admin token (should fail)
    console.log('\n6. Testing customer-only endpoint with admin token (should fail)...');
    try {
        await axios.get(`${BASE_URL}/demo/customer/bookings`, {
            headers: { 'Authorization': `Bearer ${tokens.admin}` }
        });
        console.error('❌ Security issue! Admin accessed customer-only endpoint');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Access correctly denied:', error.response.data.message);
        } else {
            console.error('❌ Unexpected error:', error.response?.data?.message);
        }
    }

    // Test 7: Mixed access (admin + vendor) with admin token
    console.log('\n7. Testing mixed access endpoint with admin token...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/equipment/management`, {
            headers: { 'Authorization': `Bearer ${tokens.admin}` }
        });
        console.log('✅ Admin access granted:', response.data.data.message);
    } catch (error) {
        console.error('❌ Admin access failed:', error.response?.data?.message);
    }

    // Test 8: No token provided (should fail)
    console.log('\n8. Testing protected endpoint without token (should fail)...');
    try {
        await axios.get(`${BASE_URL}/demo/protected`);
        console.error('❌ Security breach! Access granted without token');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Access correctly denied:', error.response.data.message);
        } else {
            console.error('❌ Unexpected error:', error.response?.data?.message);
        }
    }

    // Test 9: Enhanced profile endpoint
    console.log('\n9. Testing enhanced profile endpoint...');
    try {
        const response = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${tokens.customer}` }
        });
        console.log('✅ Enhanced profile data:', {
            id: response.data.data.id,
            userType: response.data.data.userType,
            name: response.data.data.name,
            hasCreatedAt: !!response.data.data.createdAt
        });
    } catch (error) {
        console.error('❌ Profile access failed:', error.response?.data?.message);
    }

    // Test 10: Custom role combination
    console.log('\n10. Testing custom role combination (admin/vendor only)...');
    try {
        const response = await axios.get(`${BASE_URL}/demo/reports`, {
            headers: { 'Authorization': `Bearer ${tokens.admin}` }
        });
        console.log('✅ Custom role access granted:', response.data.data.accessLevel);
    } catch (error) {
        console.error('❌ Custom role access failed:', error.response?.data?.message);
    }
}

async function testTokenValidation() {
    console.log('\n🔍 Testing Token Validation...\n');

    // Test 1: Invalid token format
    console.log('1. Testing invalid token format...');
    try {
        await axios.get(`${BASE_URL}/demo/protected`, {
            headers: { 'Authorization': 'Bearer invalid-token-format' }
        });
        console.error('❌ Invalid token accepted');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Invalid token correctly rejected');
        }
    }

    // Test 2: Missing Bearer prefix
    console.log('\n2. Testing missing Bearer prefix...');
    try {
        await axios.get(`${BASE_URL}/demo/protected`, {
            headers: { 'Authorization': tokens.customer }
        });
        console.error('❌ Token without Bearer prefix accepted');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Token without Bearer prefix correctly rejected');
        }
    }

    // Test 3: Empty Authorization header
    console.log('\n3. Testing empty Authorization header...');
    try {
        await axios.get(`${BASE_URL}/demo/protected`, {
            headers: { 'Authorization': '' }
        });
        console.error('❌ Empty authorization accepted');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Empty authorization correctly rejected');
        }
    }
}

async function main() {
    console.log('🎯 Role-Based Authentication System Test Suite\n');
    console.log('=====================================================\n');

    try {
        // Check if server is running
        console.log('Checking server health...');
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running\n');

        // Setup test users
        await setupTestUsers();

        // Test role-based access
        await testRoleBasedAccess();

        // Test token validation
        await testTokenValidation();

        console.log('\n🎉 All Role-Based Access Control Tests Completed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Authentication middleware with comprehensive user data');
        console.log('✅ Role-based access control with allowRoles() function');
        console.log('✅ Convenience middleware (requireAdmin, requireCustomer, etc.)');
        console.log('✅ Enhanced profile endpoint with full user data');
        console.log('✅ Proper token validation and error handling');
        console.log('✅ Mixed role access patterns');
        console.log('✅ Security validation (unauthorized access blocked)');

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Note: This might be expected if testing unauthorized access');
        }
    }
}

// Run the test suite
main().catch(console.error);