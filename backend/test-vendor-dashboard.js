const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testVendorDashboard() {
    try {
        console.log('🧪 Testing Vendor Dashboard API...\n');
        
        // Step 1: Login as vendor
        console.log('1. Logging in as vendor...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'john@greenfarm.com',
                password: 'admin123',
                userType: 'vendor'
            })
        });
        
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        
        const token = loginData.token;
        console.log('✅ Login successful!');
        console.log('📋 Vendor Info:', loginData.user);
        
        // Step 2: Test vendor dashboard
        console.log('\n2. Fetching vendor dashboard...');
        const dashboardResponse = await fetch(`${BASE_URL}/vendor/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const dashboardData = await dashboardResponse.json();
        if (!dashboardResponse.ok) {
            throw new Error(`Dashboard failed: ${dashboardData.message}`);
        }
        
        console.log('✅ Dashboard API working!');
        console.log('📊 Dashboard Data:', JSON.stringify(dashboardData, null, 2));
        
        // Step 3: Test equipment listing
        console.log('\n3. Fetching vendor equipment...');
        const equipmentResponse = await fetch(`${BASE_URL}/vendor/equipment`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const equipmentData = await equipmentResponse.json();
        if (!equipmentResponse.ok) {
            throw new Error(`Equipment failed: ${equipmentData.message}`);
        }
        
        console.log('✅ Equipment API working!');
        console.log('� Equipment Count:', equipmentData.data?.length || 0);
        
        console.log('\n🎉 Vendor API core features are working successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testVendorDashboard();