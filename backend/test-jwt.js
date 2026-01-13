const jwt = require('jsonwebtoken');

// Test JWT functionality
const testJWT = () => {
    console.log('🔧 Testing JWT functionality...');
    
    const JWT_SECRET = 'agriculture_rental_system_secret_key_2024';
    
    // Create a test token
    const testPayload = {
        userId: 1,
        userType: 'customer',
        email: 'test@example.com'
    };
    
    try {
        // Sign a token
        const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ Token created successfully:', token.substring(0, 50) + '...');
        
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified successfully:', decoded);
        
        // Test invalid token
        try {
            jwt.verify('invalid.token.here', JWT_SECRET);
        } catch (error) {
            console.log('✅ Invalid token correctly rejected:', error.message);
        }
        
        console.log('✅ JWT functionality is working correctly!');
        
    } catch (error) {
        console.error('❌ JWT test failed:', error);
    }
};

testJWT();