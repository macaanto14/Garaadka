const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
    );

    if (users.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('📝 You need to create the admin user first.');
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
    console.log(`   - Password valid: ${isValidPassword ? '✅ YES' : '❌ NO'}`);

    if (!isValidPassword) {
      console.log('\n❌ Password verification failed!');
      const newHash = await bcrypt.hash('admin123', 10);
      console.log(`\n🔧 To fix this, run this SQL:`);
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