import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testEverything() {
  console.log('🔍 Testing server dependencies and connections...\n');

  // Test environment variables
  console.log('📋 Environment Variables:');
  console.log(`- DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`- DB_USER: ${process.env.DB_USER || 'root'}`);
  console.log(`- DB_NAME: ${process.env.DB_NAME || 'loundary'}`);
  console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}\n`);

  // Test database connection
  try {
    console.log('🔌 Testing database connection...');
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'loundary',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    const connection = await db.getConnection();
    console.log('✅ Database connection successful!');
    
    // Test user accounts table
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM `user accounts`');
    console.log(`✅ User accounts table accessible, ${(rows as any)[0].count} users found`);
    
    connection.release();
    await db.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  // Test JWT
  try {
    console.log('\n🔐 Testing JWT...');
    const secret = process.env.JWT_SECRET || 'test-secret';
    const token = jwt.sign({ test: 'data' }, secret);
    const decoded = jwt.verify(token, secret);
    console.log('✅ JWT working correctly!');
  } catch (error) {
    console.error('❌ JWT test failed:', error);
  }

  // Test bcrypt
  try {
    console.log('\n🔒 Testing bcrypt...');
    const password = 'test123';
    const hashed = await bcrypt.hash(password, 12);
    const isValid = await bcrypt.compare(password, hashed);
    console.log(`✅ bcrypt working correctly! Hash validation: ${isValid}`);
  } catch (error) {
    console.error('❌ bcrypt test failed:', error);
  }

  console.log('\n🎉 Testing complete!');
}

testEverything().catch(console.error);