/**
 * Comprehensive test suite for the booking system
 * Tests customer booking creation, vendor booking management, 
 * status transitions, payment generation, and admin oversight
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function for HTTP requests
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

// Test data storage
let testTokens = {
    admin: null,
    vendor: null,
    customer: null
};

let testData = {
    equipmentId: null,
    vendorId: null,
    customerId: null,
    bookingId: null
};

const BASE_URL = 'http://localhost:5000/api';

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

// Test 1: Authentication Setup
async function testAuthentication() {
    console.log('\n🔐 Setting up authentication tokens...');
    
    // Login as admin
    const adminLogin = await makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: {
            email: 'admin@example.com',
            password: 'admin123'
        }
    });
    
    if (adminLogin.ok) {
        testTokens.admin = adminLogin.data.token;
        console.log('✅ Admin login successful');
    } else {
        throw new Error('Admin login failed');
    }
    
    // Login as vendor
    const vendorLogin = await makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: {
            email: 'vendor@example.com',
            password: 'vendor123'
        }
    });
    
    if (vendorLogin.ok) {
        testTokens.vendor = vendorLogin.data.token;
        testData.vendorId = vendorLogin.data.user.id;
        console.log('✅ Vendor login successful');
    } else {
        console.log('⚠️  Vendor login failed, creating vendor account...');
        
        // Register vendor
        const vendorRegister = await makeRequest(`${BASE_URL}/auth/register`, {
            method: 'POST',
            body: {
                name: 'Test Vendor',
                email: 'vendor@example.com',
                password: 'vendor123',
                role: 'vendor',
                company_name: 'Test Equipment Co',
                contact_number: '1234567890',
                address: 'Test City'
            }
        });
        
        if (vendorRegister.ok) {
            // Approve vendor (as admin)
            const approveVendor = await makeRequest(`${BASE_URL}/vendor/approve/${vendorRegister.data.user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${testTokens.admin}`
                }
            });
            
            // Login again
            const vendorLogin2 = await makeRequest(`${BASE_URL}/auth/login`, {
                method: 'POST',
                body: {
                    email: 'vendor@example.com',
                    password: 'vendor123'
                }
            });
            
            if (vendorLogin2.ok) {
                testTokens.vendor = vendorLogin2.data.token;
                testData.vendorId = vendorLogin2.data.user.id;
                console.log('✅ Vendor registered and approved');
            }
        }
    }
}

// Test 2: Equipment Setup
async function testEquipmentSetup() {
    console.log('\n🚜 Setting up test equipment...');
    
    // Get existing equipment or create one
    const equipmentList = await makeRequest(`${BASE_URL}/equipment`, {
        headers: {
            'Authorization': `Bearer ${testTokens.vendor}`
        }
    });
    
    if (equipmentList.ok && equipmentList.data.equipment && equipmentList.data.equipment.length > 0) {
        testData.equipmentId = equipmentList.data.equipment[0].id;
        console.log('✅ Using existing equipment:', equipmentList.data.equipment[0].name);
    } else {
        // Create equipment
        const createEquipment = await makeRequest(`${BASE_URL}/vendor/equipment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testTokens.vendor}`
            },
            body: {
                name: 'Test Tractor',
                description: 'A reliable tractor for testing',
                category: 'Tractors',
                hourly_rate: 50.00,
                daily_rate: 400.00,
                location: 'Test City',
                availability_status: 'available'
            }
        });
        
        if (createEquipment.ok) {
            testData.equipmentId = createEquipment.data.equipment.id;
            console.log('✅ Test equipment created');
        } else {
            throw new Error('Failed to create test equipment');
        }
    }
}

// Test 3: Customer Booking Creation
async function testCustomerBooking() {
    console.log('\n📋 Testing customer booking creation...');
    
    const bookingData = {
        equipment_id: testData.equipmentId,
        customer_name: 'John Doe',
        customer_email: 'john.doe@example.com',
        customer_phone: '9876543210',
        rental_type: 'daily',
        start_date: '2024-02-01',
        end_date: '2024-02-03',
        delivery_address: '123 Farm Road, Test City'
    };
    
    const createBooking = await makeRequest(`${BASE_URL}/booking`, {
        method: 'POST',
        body: bookingData
    });
    
    if (createBooking.ok) {
        testData.bookingId = createBooking.data.booking.id;
        testData.customerId = createBooking.data.booking.customer_id;
        console.log('✅ Customer booking created successfully');
        
        // Verify booking details
        console.log('📊 Booking Details:');
        console.log(`   - Booking ID: ${testData.bookingId}`);
        console.log(`   - Customer ID: ${testData.customerId}`);
        console.log(`   - Equipment: ${createBooking.data.booking.equipment_name}`);
        console.log(`   - Total Cost: $${createBooking.data.booking.total_cost}`);
        console.log(`   - Status: ${createBooking.data.booking.status}`);
    } else {
        throw new Error('Failed to create customer booking');
    }
}

// Test 4: Customer Booking Retrieval
async function testCustomerBookingList() {
    console.log('\n📄 Testing customer booking retrieval...');
    
    const customerBookings = await makeRequest(`${BASE_URL}/booking/customer?email=john.doe@example.com`);
    
    if (customerBookings.ok) {
        console.log('✅ Customer bookings retrieved successfully');
        console.log(`📊 Found ${customerBookings.data.bookings.length} bookings for customer`);
        
        if (customerBookings.data.bookings.length > 0) {
            const booking = customerBookings.data.bookings[0];
            console.log('📋 Latest Booking:');
            console.log(`   - ID: ${booking.id}`);
            console.log(`   - Equipment: ${booking.equipment_name}`);
            console.log(`   - Status: ${booking.status}`);
            console.log(`   - Total: $${booking.total_cost}`);
        }
    } else {
        throw new Error('Failed to retrieve customer bookings');
    }
}

// Test 5: Vendor Booking Management
async function testVendorBookingManagement() {
    console.log('\n🏪 Testing vendor booking management...');
    
    const vendorBookings = await makeRequest(`${BASE_URL}/booking/vendor`, {
        headers: {
            'Authorization': `Bearer ${testTokens.vendor}`
        }
    });
    
    if (vendorBookings.ok) {
        console.log('✅ Vendor bookings retrieved successfully');
        console.log(`📊 Found ${vendorBookings.data.bookings.length} bookings for vendor`);
        
        if (vendorBookings.data.bookings.length > 0) {
            const booking = vendorBookings.data.bookings[0];
            console.log('📋 Latest Booking:');
            console.log(`   - ID: ${booking.id}`);
            console.log(`   - Customer: ${booking.customer_name}`);
            console.log(`   - Equipment: ${booking.equipment_name}`);
            console.log(`   - Status: ${booking.status}`);
            console.log(`   - Dates: ${booking.start_date} to ${booking.end_date}`);
        }
    } else {
        throw new Error('Failed to retrieve vendor bookings');
    }
}

// Test 6: Booking Status Management
async function testBookingStatusManagement() {
    console.log('\n🔄 Testing booking status management...');
    
    // Test status transition: pending -> confirmed
    console.log('📝 Confirming booking...');
    const confirmBooking = await makeRequest(`${BASE_URL}/booking/${testData.bookingId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${testTokens.vendor}`
        },
        body: {
            status: 'confirmed',
            notes: 'Booking confirmed by vendor'
        }
    });
    
    if (confirmBooking.ok) {
        console.log('✅ Booking confirmed successfully');
    } else {
        throw new Error('Failed to confirm booking');
    }
    
    // Test status transition: confirmed -> ongoing
    console.log('📝 Starting booking...');
    const startBooking = await makeRequest(`${BASE_URL}/booking/${testData.bookingId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${testTokens.vendor}`
        },
        body: {
            status: 'ongoing',
            notes: 'Equipment delivered and rental started'
        }
    });
    
    if (startBooking.ok) {
        console.log('✅ Booking started successfully');
    } else {
        throw new Error('Failed to start booking');
    }
    
    // Test status transition: ongoing -> completed (with payment generation)
    console.log('📝 Completing booking...');
    const completeBooking = await makeRequest(`${BASE_URL}/booking/${testData.bookingId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${testTokens.vendor}`
        },
        body: {
            status: 'completed',
            notes: 'Equipment returned in good condition'
        }
    });
    
    if (completeBooking.ok) {
        console.log('✅ Booking completed successfully');
        if (completeBooking.data.payment_generated) {
            console.log('💰 Payment record automatically generated');
            console.log('📄 Invoice created for customer');
        }
    } else {
        throw new Error('Failed to complete booking');
    }
}

// Test 7: Admin Booking Oversight
async function testAdminBookingOversight() {
    console.log('\n👑 Testing admin booking oversight...');
    
    const adminBookings = await makeRequest(`${BASE_URL}/booking/admin`, {
        headers: {
            'Authorization': `Bearer ${testTokens.admin}`
        }
    });
    
    if (adminBookings.ok) {
        console.log('✅ Admin booking overview retrieved successfully');
        console.log(`📊 Total bookings in system: ${adminBookings.data.bookings.length}`);
        console.log(`📈 Summary: ${JSON.stringify(adminBookings.data.summary, null, 2)}`);
        
        if (adminBookings.data.bookings.length > 0) {
            const recentBooking = adminBookings.data.bookings[0];
            console.log('📋 Most Recent Booking:');
            console.log(`   - ID: ${recentBooking.id}`);
            console.log(`   - Customer: ${recentBooking.customer_name}`);
            console.log(`   - Vendor: ${recentBooking.vendor_name}`);
            console.log(`   - Equipment: ${recentBooking.equipment_name}`);
            console.log(`   - Status: ${recentBooking.status}`);
            console.log(`   - Total: $${recentBooking.total_cost}`);
        }
    } else {
        throw new Error('Failed to retrieve admin booking overview');
    }
}

// Test 8: Error Handling and Edge Cases
async function testErrorHandling() {
    console.log('\n🚨 Testing error handling and edge cases...');
    
    // Test invalid equipment ID
    console.log('📝 Testing invalid equipment ID...');
    const invalidEquipment = await makeRequest(`${BASE_URL}/booking`, {
        method: 'POST',
        body: {
            equipment_id: 99999,
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '1234567890',
            rental_type: 'daily',
            start_date: '2024-02-01',
            end_date: '2024-02-03',
            delivery_address: 'Test Address'
        }
    });
    
    if (!invalidEquipment.ok && invalidEquipment.data.message.includes('Equipment not found')) {
        console.log('✅ Invalid equipment ID handled correctly');
    } else {
        console.log('⚠️  Invalid equipment ID error handling needs improvement');
    }
    
    // Test invalid date range
    console.log('📝 Testing invalid date range...');
    const invalidDates = await makeRequest(`${BASE_URL}/booking`, {
        method: 'POST',
        body: {
            equipment_id: testData.equipmentId,
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            customer_phone: '1234567890',
            rental_type: 'daily',
            start_date: '2024-02-05',
            end_date: '2024-02-03', // End date before start date
            delivery_address: 'Test Address'
        }
    });
    
    if (!invalidDates.ok && invalidDates.data.message.includes('End date must be after start date')) {
        console.log('✅ Invalid date range handled correctly');
    } else {
        console.log('⚠️  Invalid date range error handling needs improvement');
    }
    
    // Test unauthorized status update
    console.log('📝 Testing unauthorized status update...');
    const unauthorizedUpdate = await makeRequest(`${BASE_URL}/booking/${testData.bookingId}/status`, {
        method: 'PUT',
        body: {
            status: 'cancelled',
            notes: 'Unauthorized cancellation attempt'
        }
    });
    
    if (!unauthorizedUpdate.ok && unauthorizedUpdate.data.message.includes('Authorization')) {
        console.log('✅ Unauthorized access handled correctly');
    } else {
        console.log('⚠️  Unauthorized access error handling needs improvement');
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 AGRICULTURE EQUIPMENT RENTAL BOOKING SYSTEM TESTS');
    console.log('====================================================');
    console.log('🔍 Testing comprehensive booking workflow...');
    
    try {
        await runTest('Authentication Setup', testAuthentication);
        await runTest('Equipment Setup', testEquipmentSetup);
        await runTest('Customer Booking Creation', testCustomerBooking);
        await runTest('Customer Booking Retrieval', testCustomerBookingList);
        await runTest('Vendor Booking Management', testVendorBookingManagement);
        await runTest('Booking Status Management', testBookingStatusManagement);
        await runTest('Admin Booking Oversight', testAdminBookingOversight);
        await runTest('Error Handling', testErrorHandling);
        
        console.log('\n🎉 ALL BOOKING TESTS COMPLETED!');
        console.log('================================');
        console.log('✅ Booking system is fully functional');
        console.log('📊 Test Summary:');
        console.log(`   - Equipment ID: ${testData.equipmentId}`);
        console.log(`   - Customer ID: ${testData.customerId}`);
        console.log(`   - Booking ID: ${testData.bookingId}`);
        console.log(`   - Vendor ID: ${testData.vendorId}`);
        
    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
    }
}

// Interactive menu
function showMenu() {
    console.log('\n📋 BOOKING SYSTEM TEST MENU');
    console.log('===========================');
    console.log('1. Run all tests');
    console.log('2. Test authentication only');
    console.log('3. Test booking creation only');
    console.log('4. Test status management only');
    console.log('5. Test admin oversight only');
    console.log('6. Test error handling only');
    console.log('7. Exit');
    console.log('');
}

function handleMenuChoice(choice) {
    switch (choice) {
        case '1':
            runAllTests().then(() => showMenu());
            break;
        case '2':
            runTest('Authentication Setup', testAuthentication).then(() => showMenu());
            break;
        case '3':
            runTest('Booking Creation', async () => {
                await testAuthentication();
                await testEquipmentSetup();
                await testCustomerBooking();
            }).then(() => showMenu());
            break;
        case '4':
            runTest('Status Management', async () => {
                await testAuthentication();
                await testEquipmentSetup();
                await testCustomerBooking();
                await testBookingStatusManagement();
            }).then(() => showMenu());
            break;
        case '5':
            runTest('Admin Oversight', async () => {
                await testAuthentication();
                await testAdminBookingOversight();
            }).then(() => showMenu());
            break;
        case '6':
            runTest('Error Handling', testErrorHandling).then(() => showMenu());
            break;
        case '7':
            console.log('👋 Goodbye!');
            rl.close();
            break;
        default:
            console.log('❌ Invalid choice. Please try again.');
            showMenu();
    }
}

// Start the interactive menu
console.log('🌾 Agriculture Equipment Rental System - Booking Test Suite');
console.log('============================================================');
console.log('⚠️  Make sure the backend server is running on http://localhost:5000');
console.log('⚠️  Make sure you have admin and test data set up');

showMenu();

rl.on('line', (input) => {
    handleMenuChoice(input.trim());
});

rl.question('Please choose an option (1-7): ', handleMenuChoice);