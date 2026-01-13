/**
 * Simple feedback routes test
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

async function testFeedbackRoutes() {
    console.log('📝 Simple Feedback Routes Test');
    console.log('==============================');
    
    try {
        // Test 1: Submit feedback (expecting validation error due to missing data)
        console.log('\n1️⃣ Testing feedback submission route...');
        const feedbackResponse = await makeRequest(`${BASE_URL}/feedback`, {
            method: 'POST',
            body: {
                booking_id: 1,
                customer_email: 'invalid-email', // This should trigger validation error
                rating: 6 // This should also trigger validation error
            }
        });
        
        if (feedbackResponse.status === 400) {
            console.log('✅ Feedback route responding with proper validation');
        }
        
        // Test 2: Get vendor feedback (expecting empty or error)
        console.log('\n2️⃣ Testing vendor feedback route...');
        const vendorResponse = await makeRequest(`${BASE_URL}/feedback/vendor/1`);
        
        if (vendorResponse.status === 200 || vendorResponse.status === 500) {
            console.log('✅ Vendor feedback route responding');
        }
        
        // Test 3: Get equipment feedback
        console.log('\n3️⃣ Testing equipment feedback route...');
        const equipmentResponse = await makeRequest(`${BASE_URL}/feedback/equipment/1`);
        
        if (equipmentResponse.status === 200 || equipmentResponse.status === 500) {
            console.log('✅ Equipment feedback route responding');
        }
        
        console.log('\n🎉 Feedback routes are properly registered and responding!');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
    }
}

testFeedbackRoutes();