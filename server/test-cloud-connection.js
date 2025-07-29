const axios = require('axios');

const CLOUD_BASE_URL = 'http://47.236.39.181:5000';

async function testCloudConnection() {
  console.log('🌐 Testing Cloud Server Connection...\n');
  console.log(`Base URL: ${CLOUD_BASE_URL}`);
  
  const tests = [
    {
      name: 'Health Check',
      url: `${CLOUD_BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Auth Endpoint',
      url: `${CLOUD_BASE_URL}/api/auth/login`,
      method: 'POST',
      data: { username: 'test', password: 'test' },
      expectError: true
    },
    {
      name: 'Customers Endpoint',
      url: `${CLOUD_BASE_URL}/api/customers`,
      method: 'GET',
      expectError: true // Might need auth
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const config = {
        method: test.method,
        url: test.url,
        timeout: 10000,
        ...(test.data && { data: test.data })
      };
      
      const response = await axios(config);
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (test.expectError) {
        console.log(`   ⚠️  Expected Error: ${error.response?.status || 'Network Error'}`);
        if (error.response?.data) {
          console.log(`   📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`   📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
        }
      }
    }
  }
  
  console.log('\n🏁 Cloud connection test completed!');
}

// Run the test
testCloudConnection().catch(console.error);