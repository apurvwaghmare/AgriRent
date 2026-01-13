const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('🧪 Testing Vendor Dashboard API...\n');
        
        // Step 1: Login as vendor
        console.log('1. Logging in as vendor...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'john@greenfarm.com',
            password: 'admin123',
            userType: 'vendor'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('📋 Vendor Info:', loginResponse.data.user);
        
        // Step 2: Test vendor dashboard
        console.log('\n2. Fetching vendor dashboard...');
        const dashboardResponse = await axios.get(`${BASE_URL}/vendor/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        console.log('✅ Dashboard API working!');
        console.log('📊 Dashboard Data:', JSON.stringify(dashboardResponse.data, null, 2));
        
        console.log('\n🎉 Vendor Module Implementation Status:');
        console.log('✅ 1. Vendor authentication - WORKING');
        console.log('✅ 2. Vendor dashboard backend - WORKING');
        console.log('🔄 3. Equipment management - Backend exists, needs testing');
        console.log('🔄 4. Booking management - Backend exists, needs testing');
        console.log('🔄 5. Feedback system - Backend exists, needs testing');
        console.log('🔄 6. Sales analytics - Backend exists, needs testing');
        console.log('🔄 7. Chart.js analytics - Backend exists, needs testing');
        console.log('🔄 8. Frontend integration - Needs implementation');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
})();