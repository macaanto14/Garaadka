import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Check\n');

// Required variables
const requiredVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

// Optional variables
const optionalVars = [
  'PORT',
  'DB_PORT',
  'JWT_EXPIRES_IN',
  'NODE_ENV',
  'CORS_ORIGIN'
];

console.log('✅ Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Hide sensitive data
    const displayValue = ['DB_PASSWORD', 'JWT_SECRET'].includes(varName) 
      ? '***HIDDEN***' 
      : value;
    console.log(`   ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value || 'Using default'}`);
});

console.log('\n🔧 Database Connection String:');
console.log(`   mysql://${process.env.DB_USER}:***@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);

// Check for common issues
console.log('\n⚠️  Security Warnings:');
if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  console.log('   🚨 Please change the default JWT_SECRET!');
}
if (process.env.DB_PASSWORD === 'your_database_password') {
  console.log('   🚨 Please set a real database password!');
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.log('   🚨 JWT_SECRET should be at least 32 characters in production!');
}

console.log('\n✨ Environment setup complete!');