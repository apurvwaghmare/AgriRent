const fetch = require('node-fetch');

async function testAdminEndpoints() {
    console.log('🔍 Testing Admin Endpoints...\n');
    
    try {
        // Test bookings endpoint
        console.log('📅 Testing /api/admin/bookings...');
        const bookingsResponse = await fetch('http://localhost:5000/api/admin/bookings');
        const bookingsData = await bookingsResponse.json();
        console.log('Bookings Response:', JSON.stringify(bookingsData, null, 2));
        console.log(`✅ Found ${bookingsData.data ? bookingsData.data.length : 0} bookings\n`);
        
        // Test feedback endpoint
        console.log('💬 Testing /api/admin/feedback...');
        const feedbackResponse = await fetch('http://localhost:5000/api/admin/feedback');
        const feedbackData = await feedbackResponse.json();
        console.log('Feedback Response:', JSON.stringify(feedbackData, null, 2));
        console.log(`✅ Found ${feedbackData.data ? feedbackData.data.length : 0} feedback entries\n`);
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error.message);
    }
}

testAdminEndpoints();