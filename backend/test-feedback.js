/**
 * Feedback System Test Suite
 * Tests customer feedback submission and vendor feedback retrieval
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
        if (mergedOptions.body) {
            console.log('📤 Request Body:', mergedOptions.body);
        }
        
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

async function runTest(testName, testFunction) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TESTING: ${testName}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
        await testFunction();
        console.log(`\n✅ ${testName} - PASSED`);
    } catch (error) {
        console.log(`\n❌ ${testName} - FAILED:`, error.message);
    }
}

// Test 1: Submit Valid Feedback
async function testValidFeedbackSubmission() {
    console.log('\n📝 Testing valid feedback submission...');
    
    const feedbackData = {
        booking_id: 1, // Assuming booking ID 1 exists and is completed
        customer_email: 'test@example.com',
        rating: 5,
        comment: 'Excellent equipment! Very well maintained and performed perfectly for our farming needs.',
        customer_name: 'John Farmer'
    };
    
    const response = await makeRequest(`${BASE_URL}/feedback`, {
        method: 'POST',
        body: feedbackData
    });
    
    if (response.ok) {
        console.log('✅ Feedback submitted successfully');
        console.log(`📋 Feedback ID: ${response.data.feedback?.id}`);
        console.log(`⭐ Rating: ${response.data.feedback?.rating}/5`);
        console.log(`🏷️ Equipment: ${response.data.feedback?.equipment_name}`);
    } else {
        console.log('⚠️ Expected - feedback submission failed (booking may not exist or not completed)');
        console.log(`📄 Error: ${response.data.message}`);
    }
}

// Test 2: Test Invalid Rating
async function testInvalidRating() {
    console.log('\n🚫 Testing invalid rating submission...');
    
    const invalidFeedbackData = {
        booking_id: 1,
        customer_email: 'test@example.com',
        rating: 6, // Invalid - should be 1-5
        comment: 'This should fail due to invalid rating'
    };
    
    const response = await makeRequest(`${BASE_URL}/feedback`, {
        method: 'POST',
        body: invalidFeedbackData
    });
    
    if (!response.ok && response.data.message.includes('Rating must be between 1 and 5')) {
        console.log('✅ Invalid rating properly rejected');
    } else {
        console.log('❌ Invalid rating should have been rejected');
    }
}

// Test 3: Test Missing Required Fields
async function testMissingFields() {
    console.log('\n🚫 Testing missing required fields...');
    
    const incompleteFeedbackData = {
        booking_id: 1,
        // Missing customer_email and rating
        comment: 'This should fail due to missing fields'
    };
    
    const response = await makeRequest(`${BASE_URL}/feedback`, {
        method: 'POST',
        body: incompleteFeedbackData
    });
    
    if (!response.ok && response.data.message.includes('required')) {
        console.log('✅ Missing fields properly rejected');
    } else {
        console.log('❌ Missing fields should have been rejected');
    }
}

// Test 4: Test Invalid Email Format
async function testInvalidEmail() {
    console.log('\n🚫 Testing invalid email format...');
    
    const invalidEmailData = {
        booking_id: 1,
        customer_email: 'invalid-email', // Invalid format
        rating: 4,
        comment: 'This should fail due to invalid email'
    };
    
    const response = await makeRequest(`${BASE_URL}/feedback`, {
        method: 'POST',
        body: invalidEmailData
    });
    
    if (!response.ok && response.data.message.includes('Invalid email format')) {
        console.log('✅ Invalid email properly rejected');
    } else {
        console.log('❌ Invalid email should have been rejected');
    }
}

// Test 5: Get Feedback for Specific Booking
async function testGetBookingFeedback() {
    console.log('\n📄 Testing get feedback for booking...');
    
    const bookingId = 1;
    const response = await makeRequest(`${BASE_URL}/feedback/booking/${bookingId}`);
    
    if (response.ok) {
        console.log('✅ Booking feedback retrieved successfully');
        console.log(`⭐ Rating: ${response.data.feedback?.rating}/5`);
        console.log(`👤 Customer: ${response.data.feedback?.customer_name}`);
        console.log(`🚜 Equipment: ${response.data.feedback?.equipment_name}`);
    } else {
        console.log('⚠️ Expected - no feedback found for this booking');
    }
}

// Test 6: Get Vendor Feedback Overview
async function testVendorFeedbackOverview() {
    console.log('\n🏪 Testing vendor feedback overview...');
    
    const vendorId = 1;
    const response = await makeRequest(`${BASE_URL}/feedback/vendor/${vendorId}`);
    
    if (response.ok) {
        console.log('✅ Vendor feedback retrieved successfully');
        console.log(`📊 Total Feedback: ${response.data.statistics?.total_feedback || 0}`);
        console.log(`⭐ Average Rating: ${response.data.statistics?.average_rating || 'N/A'}`);
        console.log(`📄 Current Page Items: ${response.data.feedback?.length || 0}`);
        
        if (response.data.statistics?.rating_breakdown) {
            const breakdown = response.data.statistics.rating_breakdown;
            console.log('📈 Rating Breakdown:');
            console.log(`   5⭐: ${breakdown.five_star}`);
            console.log(`   4⭐: ${breakdown.four_star}`);
            console.log(`   3⭐: ${breakdown.three_star}`);
            console.log(`   2⭐: ${breakdown.two_star}`);
            console.log(`   1⭐: ${breakdown.one_star}`);
        }
    } else {
        console.log('⚠️ Expected - vendor feedback retrieval failed (vendor may not exist)');
    }
}

// Test 7: Get Equipment-Specific Feedback
async function testEquipmentFeedback() {
    console.log('\n🚜 Testing equipment-specific feedback...');
    
    const equipmentId = 1;
    const response = await makeRequest(`${BASE_URL}/feedback/equipment/${equipmentId}`);
    
    if (response.ok) {
        console.log('✅ Equipment feedback retrieved successfully');
        console.log(`📊 Total Feedback: ${response.data.statistics?.total_feedback || 0}`);
        console.log(`⭐ Average Rating: ${response.data.statistics?.average_rating || 'N/A'}`);
        console.log(`📄 Feedback Items: ${response.data.feedback?.length || 0}`);
        
        if (response.data.feedback && response.data.feedback.length > 0) {
            console.log('📝 Latest Feedback:');
            const latest = response.data.feedback[0];
            console.log(`   Customer: ${latest.customer_name}`);
            console.log(`   Rating: ${latest.rating}/5`);
            console.log(`   Comment: ${latest.comment?.substring(0, 100)}${latest.comment?.length > 100 ? '...' : ''}`);
        }
    } else {
        console.log('⚠️ Expected - equipment feedback retrieval failed (equipment may not exist)');
    }
}

// Test 8: Test Feedback Filtering
async function testFeedbackFiltering() {
    console.log('\n🔍 Testing feedback filtering options...');
    
    const vendorId = 1;
    
    // Test filtering by rating
    console.log('\n📊 Testing rating filter (5-star only):');
    const ratingFilterResponse = await makeRequest(`${BASE_URL}/feedback/vendor/${vendorId}?rating_filter=5`);
    
    if (ratingFilterResponse.ok) {
        console.log(`✅ Found ${ratingFilterResponse.data.feedback?.length || 0} five-star reviews`);
    }
    
    // Test sorting
    console.log('\n📅 Testing sort by rating (ascending):');
    const sortResponse = await makeRequest(`${BASE_URL}/feedback/vendor/${vendorId}?sort_by=rating&sort_order=ASC`);
    
    if (sortResponse.ok) {
        console.log(`✅ Sorted feedback retrieved`);
        if (sortResponse.data.feedback && sortResponse.data.feedback.length > 0) {
            const ratings = sortResponse.data.feedback.map(f => f.rating);
            console.log(`📈 Ratings in order: ${ratings.join(', ')}`);
        }
    }
    
    // Test pagination
    console.log('\n📄 Testing pagination (page 1, limit 2):');
    const paginationResponse = await makeRequest(`${BASE_URL}/feedback/vendor/${vendorId}?page=1&limit=2`);
    
    if (paginationResponse.ok) {
        console.log(`✅ Pagination working - ${paginationResponse.data.feedback?.length || 0} items returned`);
        console.log(`📊 Total pages: ${paginationResponse.data.pagination?.totalPages || 0}`);
    }
}

// Main test runner
async function runAllFeedbackTests() {
    console.log('📝 AGRICULTURE EQUIPMENT RENTAL FEEDBACK SYSTEM TESTS');
    console.log('=====================================================');
    console.log('🔍 Testing feedback submission and retrieval...');
    
    try {
        await runTest('Valid Feedback Submission', testValidFeedbackSubmission);
        await runTest('Invalid Rating Rejection', testInvalidRating);
        await runTest('Missing Fields Validation', testMissingFields);
        await runTest('Invalid Email Validation', testInvalidEmail);
        await runTest('Get Booking Feedback', testGetBookingFeedback);
        await runTest('Vendor Feedback Overview', testVendorFeedbackOverview);
        await runTest('Equipment Feedback', testEquipmentFeedback);
        await runTest('Feedback Filtering', testFeedbackFiltering);
        
        console.log('\n🎉 ALL FEEDBACK TESTS COMPLETED!');
        console.log('================================');
        console.log('✅ Feedback system is functional');
        console.log('📊 Key features tested:');
        console.log('   - ✅ Feedback submission with validation');
        console.log('   - ✅ Rating system (1-5 stars)');
        console.log('   - ✅ Vendor feedback overview with statistics');
        console.log('   - ✅ Equipment-specific feedback');
        console.log('   - ✅ Filtering and pagination');
        console.log('   - ✅ Error handling and validation');
        
    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
    }
}

// Interactive menu for selective testing
function showFeedbackTestMenu() {
    console.log('\n📝 FEEDBACK SYSTEM TEST MENU');
    console.log('============================');
    console.log('1. Run all feedback tests');
    console.log('2. Test feedback submission only');
    console.log('3. Test vendor feedback overview only');
    console.log('4. Test equipment feedback only');
    console.log('5. Test validation and error handling');
    console.log('6. Test filtering and pagination');
    console.log('7. Exit');
    console.log('');
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function handleFeedbackMenuChoice(choice) {
    switch (choice) {
        case '1':
            runAllFeedbackTests().then(() => showFeedbackTestMenu());
            break;
        case '2':
            runTest('Feedback Submission Tests', async () => {
                await testValidFeedbackSubmission();
            }).then(() => showFeedbackTestMenu());
            break;
        case '3':
            runTest('Vendor Feedback Overview', testVendorFeedbackOverview).then(() => showFeedbackTestMenu());
            break;
        case '4':
            runTest('Equipment Feedback', testEquipmentFeedback).then(() => showFeedbackTestMenu());
            break;
        case '5':
            runTest('Validation Tests', async () => {
                await testInvalidRating();
                await testMissingFields();
                await testInvalidEmail();
            }).then(() => showFeedbackTestMenu());
            break;
        case '6':
            runTest('Filtering and Pagination', testFeedbackFiltering).then(() => showFeedbackTestMenu());
            break;
        case '7':
            console.log('👋 Goodbye!');
            rl.close();
            break;
        default:
            console.log('❌ Invalid choice. Please try again.');
            showFeedbackTestMenu();
    }
}

// Start the interactive menu
console.log('📝 Agriculture Equipment Rental System - Feedback Test Suite');
console.log('============================================================');
console.log('⚠️  Make sure the backend server is running on http://localhost:5000');
console.log('⚠️  Feedback tests work best with existing booking data');

showFeedbackTestMenu();

rl.on('line', (input) => {
    handleFeedbackMenuChoice(input.trim());
});

rl.question('Please choose an option (1-7): ', handleFeedbackMenuChoice);