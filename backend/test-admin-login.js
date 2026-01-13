const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('🔐 Testing admin login endpoint...');
        
        const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
            email: 'admin@agriculture-rental.com',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Login successful!');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response data:', response.data);
        
    } catch (error) {
        console.error('❌ Login failed!');
        console.error('📡 Error status:', error.response?.status);
        console.error('📡 Error data:', error.response?.data);
        console.error('📡 Error message:', error.message);
    }
}

testAdminLogin();