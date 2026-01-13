const bcrypt = require('bcrypt');

async function testPassword() {
    // Hash from database
    const storedHash = '$2b$10$rQl2WzKz1e/JQqKTQGgMaO1qJ5M6zYv4a3sK8eB9xC7h2Lk5mN3oP';
    const plainPassword = 'admin123';
    
    console.log('🔐 Testing password comparison...');
    console.log('Plain password:', plainPassword);
    console.log('Stored hash:', storedHash);
    
    try {
        const isMatch = await bcrypt.compare(plainPassword, storedHash);
        console.log('Password match result:', isMatch);
        
        if (isMatch) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does not match!');
            
            // Let's try creating a new hash for comparison
            const newHash = await bcrypt.hash(plainPassword, 10);
            console.log('New hash for comparison:', newHash);
            
            const newMatch = await bcrypt.compare(plainPassword, newHash);
            console.log('New hash matches:', newMatch);
        }
        
    } catch (error) {
        console.error('Error testing password:', error);
    }
}

testPassword();