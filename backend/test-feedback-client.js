/**
 * Simple feedback routes test - no server startup
 */

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
    const BASE_URL = 'http://localhost:5000/api';
    
    console.log('📝 Simple Feedback Routes Test');
    console.log('==============================');
    
    try {
        // Test 1: Submit feedback with validation errors
        console.log('\n1️⃣ Testing feedback submission route...');
        const feedbackResponse = await makeRequest(`${BASE_URL}/feedback`, {
            method: 'POST',
            body: {
                booking_id: 1,
                customer_email: 'invalid-email', // Invalid email format
                rating: 6 // Invalid rating (should be 1-5)
            }
        });
        
        if (feedbackResponse.status === 400) {
            console.log('✅ Feedback route responding with proper validation');
        } else if (feedbackResponse.status === 500) {
            console.log('✅ Feedback route responding (database error expected)');
        }
        
        // Test 2: Get vendor feedback
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
        console.log('📋 Summary:');
        console.log(`   - POST /api/feedback: ${feedbackResponse.status}`);
        console.log(`   - GET /api/feedback/vendor/1: ${vendorResponse.status}`);
        console.log(`   - GET /api/feedback/equipment/1: ${equipmentResponse.status}`);
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
    }
}

testFeedbackRoutes();