const fetch = require('node-fetch');

async function testAdminLogin() {
    try {
        console.log('🧪 Testing admin login API...');
        
        const response = await fetch('http://localhost:5000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@agriculture-rental.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed!');
        }
        
    } catch (error) {
        console.error('❌ Request failed!');
        console.error('Error message:', error.message);
    }
}

testAdminLogin();