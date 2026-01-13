const http = require('http');

async function testVendorDashboard() {
    try {
        console.log('🧪 Testing Vendor Dashboard API...\n');
        
        // Step 1: Login as vendor
        console.log('1. Testing vendor login...');
        
        const loginData = JSON.stringify({
            email: 'john@greenfarm.com',
            password: 'admin123',
            userType: 'vendor'
        });
        
        const loginOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };
        
        const token = await new Promise((resolve, reject) => {
            const req = http.request(loginOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode === 200 && parsed.token) {
                            console.log('✅ Login successful!');
                            console.log('📋 User:', parsed.user.name);
                            console.log('🏪 Shop:', parsed.user.shop_name);
                            console.log('📊 Status:', parsed.user.status);
                            resolve(parsed.token);
                        } else {
                            reject(new Error(`Login failed: ${parsed.message || 'Unknown error'}`));
                        }
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(loginData);
            req.end();
        });
        
        // Step 2: Test vendor dashboard
        console.log('\n2. Testing vendor dashboard...');
        
        const dashboardOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/vendor/dashboard',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        await new Promise((resolve, reject) => {
            const req = http.request(dashboardOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode === 200) {
                            console.log('✅ Dashboard API working!');
                            console.log('📊 Dashboard summary:');
                            console.log('   - Total Equipment:', parsed.data?.summary?.totalEquipment || 0);
                            console.log('   - Total Bookings:', parsed.data?.summary?.totalBookings || 0);
                            console.log('   - Completed Bookings:', parsed.data?.summary?.completedBookings || 0);
                            console.log('   - Total Revenue:', parsed.data?.summary?.totalRevenue || 0);
                            resolve();
                        } else {
                            reject(new Error(`Dashboard failed: ${parsed.message || 'Unknown error'}`));
                        }
                    } catch (e) {
                        reject(new Error(`Parse error: ${e.message}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        });
        
        console.log('\n🎉 Vendor Module Core Features Working Successfully!');
        console.log('\n✅ Completed Features:');
        console.log('   1. ✅ Vendor authentication with pending status support');
        console.log('   2. ✅ Vendor dashboard with statistics');
        console.log('   3. ✅ Database schema fixes (categories→equipment_categories, total_amount→total_cost)');
        console.log('\n📋 Remaining Features to Implement:');
        console.log('   4. 🔄 Equipment management (add, edit, delete, upload images)');
        console.log('   5. 🔄 Booking management (approve/reject/complete)');
        console.log('   6. 🔄 Feedback system');
        console.log('   7. 🔄 Sales analytics');
        console.log('   8. 🔄 Chart.js visualizations');
        console.log('   9. 🔄 Frontend integration');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testVendorDashboard();