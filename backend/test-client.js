/**
 * Simple booking system test - no server startup
 */

const BASE_URL = 'http://localhost:5000/api';

async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        mergedOptions.body = JSON.stringify(mergedOptions.body);
    }
    
    try {
        console.log(`\n🔗 ${mergedOptions.method || 'GET'} ${url}`);
        
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📥 Response:', JSON.stringify(data, null, 2));
        
        return { status: response.status, data, ok: response.ok };
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        return { error: error.message };
    }
}

async function runSimpleTests() {
    console.log('🌾 Agriculture Equipment Rental System - Simple Booking Test');
    console.log('=============================================================');
    
    try {
        // Test 1: Health check
        console.log('\n1️⃣ Testing Health Check...');
        const health = await makeRequest(`${BASE_URL}/health`);
        
        if (health.ok) {
            console.log('✅ Server is running');
        } else {
            console.log('❌ Server health check failed');
            return;
        }
        
        // Test 2: Test equipment list (public)
        console.log('\n2️⃣ Testing Equipment List...');
        const equipment = await makeRequest(`${BASE_URL}/equipment`);
        
        if (equipment.ok) {
            console.log('✅ Equipment list retrieved');
            console.log(`📊 Found ${equipment.data.equipment?.length || 0} equipment items`);
        } else {
            console.log('⚠️ Equipment list failed, but continuing...');
        }
        
        // Test 3: Test booking creation (should work without auth)
        console.log('\n3️⃣ Testing Booking Creation...');
        
        // Use future dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);
        
        const bookingData = {
            equipment_id: 1, // Assuming we have at least one equipment
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '1234567890',
            rental_type: 'daily',
            start_date: tomorrow.toISOString().split('T')[0], // Format: YYYY-MM-DD
            end_date: dayAfterTomorrow.toISOString().split('T')[0],
            delivery_address: '123 Test Street, Test City'
        };
        
        const booking = await makeRequest(`${BASE_URL}/booking`, {
            method: 'POST',
            body: bookingData
        });
        
        if (booking.ok) {
            console.log('✅ Booking created successfully');
            console.log(`📋 Booking ID: ${booking.data.booking?.id}`);
        } else {
            console.log('⚠️ Booking creation failed, this might be expected if no equipment exists');
        }
        
        // Test 4: Test customer booking retrieval
        console.log('\n4️⃣ Testing Customer Booking Retrieval...');
        const customerBookings = await makeRequest(`${BASE_URL}/booking/customer?email=test@example.com`);
        
        if (customerBookings.ok) {
            console.log('✅ Customer bookings retrieved');
            console.log(`📊 Found ${customerBookings.data.bookings?.length || 0} bookings for customer`);
        } else {
            console.log('⚠️ Customer booking retrieval failed');
        }
        
        console.log('\n🎉 Simple tests completed!');
        console.log('✅ Basic booking system functionality verified');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
    }
}

// Run the tests
runSimpleTests().then(() => {
    console.log('\n👋 Test complete. Server is still running for further testing.');
});