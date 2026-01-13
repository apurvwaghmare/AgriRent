const bcrypt = require('bcrypt');

async function generateCorrectHash() {
    const password = 'admin123';
    
    console.log('🔧 Generating correct hash for admin123...');
    
    try {
        const hash = await bcrypt.hash(password, 10);
        console.log('Generated hash:', hash);
        
        // Test the hash
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash validation:', isValid);
        
        console.log('\n📝 SQL command to update the database:');
        console.log(`UPDATE admins SET password = '${hash}' WHERE email = 'admin@agriculture-rental.com';`);
        
    } catch (error) {
        console.error('Error generating hash:', error);
    }
}

generateCorrectHash();