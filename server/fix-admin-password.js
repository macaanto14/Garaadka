const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdminPassword() {
  console.log('🔧 Fixing admin password...\n');

  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'loundary',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    // Generate proper bcrypt hash for "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log(`Generated hash: ${hashedPassword}`);

    // Update the admin password
    const [result] = await db.execute(
      'UPDATE `user accounts` SET PASSWORD = ? WHERE USERNAME = ?',
      [hashedPassword, 'admin']
    );

    console.log(`✅ Password updated successfully! Affected rows: ${result.affectedRows}`);
    
    // Verify the fix
    const [users] = await db.execute(
      'SELECT USERNAME, PASSWORD FROM `user accounts` WHERE USERNAME = ?',
      ['admin']
    );

    if (users.length > 0) {
      const user = users[0];
      const isValid = await bcrypt.compare('admin123', user.PASSWORD);
      console.log(`✅ Verification: Password "admin123" is now ${isValid ? 'VALID' : 'INVALID'}`);
    }

    await db.end();
    console.log('\n🎉 Admin password fixed! You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Failed to fix password:', error);
  }
}

fixAdminPassword().catch(console.error);