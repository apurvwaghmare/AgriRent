const axios = require('axios');

async function testAdminAPIs() {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🔧 Testing Admin API endpoints...');
    
    try {
        // Test admin bookings endpoint
        console.log('\n📋 Testing GET /admin/bookings...');
        const bookingsResponse = await axios.get(`${baseURL}/admin/bookings`);
        console.log('✅ Bookings Response Status:', bookingsResponse.status);
        console.log('📊 Bookings Count:', bookingsResponse.data.data?.length || 0);
        if (bookingsResponse.data.data?.length > 0) {
            console.log('📋 Sample Booking:', bookingsResponse.data.data[0]);
        }
        
        // Test admin feedback endpoint
        console.log('\n💬 Testing GET /admin/feedback...');
        const feedbackResponse = await axios.get(`${baseURL}/admin/feedback`);
        console.log('✅ Feedback Response Status:', feedbackResponse.status);
        console.log('📊 Feedback Count:', feedbackResponse.data.data?.length || 0);
        if (feedbackResponse.data.data?.length > 0) {
            console.log('💬 Sample Feedback:', feedbackResponse.data.data[0]);
        }
        
        console.log('\n✅ Admin APIs are working correctly!');
        
    } catch (error) {
        console.error('❌ Admin API Test Failed:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('Full Error:', error.response?.data || error.message);
    }
}

testAdminAPIs();