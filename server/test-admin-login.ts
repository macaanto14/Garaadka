import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testAdminLogin() {
  console.log('🔍 Testing admin login credentials...\n');

  try {
    // Create database connection
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'loundary',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('✅ Database connection established');

    // Check if admin user exists
    const [users] = await db.execute(
      'SELECT * FROM `user accounts` WHERE USERNAME = ?',
      ['admin']
    ) as any;

    if (users.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('📝 You need to create the admin user first.');
      
      // Show how to create admin user
      console.log('\n🔧 To create admin user, run this SQL:');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      console.log(`INSERT INTO \`user accounts\` (\`PERSONAL ID\`, fname, USERNAME, PASSWORD, CITY, PHONENO, POSITION, sec_que, answer) VALUES (1001, 'Administrator', 'admin', '${hashedPassword}', 'Mogadishu', '+252-61-1234567', 'admin', 'What is your favorite color?', 'blue');`);
      
      await db.end();
      return;
    }

    const user = users[0];
    console.log('✅ Admin user found in database');
    console.log(`   - Personal ID: ${user['PERSONAL ID']}`);
    console.log(`   - Name: ${user.fname}`);
    console.log(`   - Username: ${user.USERNAME}`);

    // Test password verification
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, user.PASSWORD);
    
    console.log(`\n🔐 Testing password "${testPassword}"`);
    console.log(`   - Stored hash: ${user.PASSWORD}`);
    console.log(`   - Password valid: ${isValidPassword ? '✅ YES' : '❌ NO'}`);

    if (!isValidPassword) {
      console.log('\n❌ Password verification failed!');
      console.log('🔧 The stored password hash doesn\'t match "admin123"');
      
      // Generate new hash
      const newHash = await bcrypt.hash('admin123', 10);
      console.log(`\n🔧 To fix this, update the password hash:`);
      console.log(`UPDATE \`user accounts\` SET PASSWORD = '${newHash}' WHERE USERNAME = 'admin';`);
    } else {
      console.log('\n✅ Admin login credentials are correct!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }

    await db.end();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminLogin().catch(console.error);