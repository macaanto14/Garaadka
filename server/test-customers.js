import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5000/api/customers';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Test data
const testCustomer = {
  customer_name: 'Ahmed Mohamed Ali',
  phone_number: '0912345678',
  email: 'ahmed@example.com',
  address: 'Jigjiga, Ethiopia',
  notes: 'Test customer for API testing'
};

const updatedCustomer = {
  customer_name: 'Ahmed Mohamed Hassan',
  phone_number: '0912345679',
  email: 'ahmed.hassan@example.com',
  address: 'Addis Ababa, Ethiopia',
  notes: 'Updated test customer',
  status: 'active'
};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test functions
const testGetLatestCustomers = async () => {
  console.log('\n🧪 Testing GET /customers (latest 5 customers)');
  const result = await makeRequest('GET', BASE_URL);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Customers count:', result.data.customers?.length || 0);
    console.log('Message:', result.data.message);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testGetAllCustomers = async () => {
  console.log('\n🧪 Testing GET /customers/all');
  const result = await makeRequest('GET', `${BASE_URL}/all`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Total customers:', result.data.length);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testGetPaginatedCustomers = async () => {
  console.log('\n🧪 Testing GET /customers/paginated');
  const result = await makeRequest('GET', `${BASE_URL}/paginated?page=1&limit=5`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Customers count:', result.data.customers?.length || 0);
    console.log('Pagination:', result.data.pagination);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testCreateCustomer = async () => {
  console.log('\n🧪 Testing POST /customers (create customer)');
  const result = await makeRequest('POST', BASE_URL, testCustomer);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Created customer ID:', result.data.customer_id);
    console.log('Message:', result.data.message);
    return result.data.customer_id;
  } else {
    console.log('Error:', result.error);
    return null;
  }
};

const testGetCustomerById = async (customerId) => {
  console.log(`\n🧪 Testing GET /customers/${customerId}`);
  const result = await makeRequest('GET', `${BASE_URL}/${customerId}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Customer name:', result.data.customer_name);
    console.log('Phone:', result.data.phone_number);
    console.log('Total orders:', result.data.total_orders);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testUpdateCustomer = async (customerId) => {
  console.log(`\n🧪 Testing PUT /customers/${customerId}`);
  const result = await makeRequest('PUT', `${BASE_URL}/${customerId}`, updatedCustomer);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Message:', result.data.message);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testSearchCustomers = async () => {
  console.log('\n🧪 Testing GET /customers/search (multi-criteria)');
  const searchParams = {
    query: 'Ahmed',
    search_type: 'any'
  };
  const queryString = new URLSearchParams(searchParams).toString();
  const result = await makeRequest('GET', `${BASE_URL}/search?${queryString}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Search results:', result.data.total_results);
    console.log('Search criteria:', result.data.search_criteria);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testSearchByPhone = async () => {
  console.log('\n🧪 Testing GET /customers/search/phone/:phone');
  const phoneNumber = '927802065'; // Test the phone number from your previous issue
  const result = await makeRequest('GET', `${BASE_URL}/search/phone/${phoneNumber}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Found customer:', result.data.customer.customer_name);
    console.log('Phone searched:', result.data.phone_searched);
    console.log('Phone found:', result.data.phone_found);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testSearchByOrderId = async () => {
  console.log('\n🧪 Testing GET /customers/search/order/:order_id');
  const orderId = '1'; // Test with order ID 1
  const result = await makeRequest('GET', `${BASE_URL}/search/order/${orderId}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Search results:', result.data.results?.length || 0);
    console.log('Message:', result.data.message);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testSearchByQuery = async () => {
  console.log('\n🧪 Testing GET /customers/search/:query');
  const query = 'ISMAIL'; // Test with existing customer name
  const result = await makeRequest('GET', `${BASE_URL}/search/${query}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Search results:', result.data.total_results);
    console.log('Search term:', result.data.search_term);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

const testDeleteCustomer = async (customerId) => {
  console.log(`\n🧪 Testing DELETE /customers/${customerId}`);
  const result = await makeRequest('DELETE', `${BASE_URL}/${customerId}`);
  console.log('Status:', result.status);
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Message:', result.data.message);
  } else {
    console.log('Error:', result.error);
  }
  return result;
};

// Validation tests
const testCreateCustomerValidation = async () => {
  console.log('\n🧪 Testing POST /customers (validation errors)');
  
  // Test missing required fields
  console.log('\n  📝 Testing missing required fields...');
  const invalidCustomer1 = { customer_name: 'Test' }; // Missing phone
  const result1 = await makeRequest('POST', BASE_URL, invalidCustomer1);
  console.log('  Missing phone - Status:', result1.status, 'Success:', result1.success);
  
  // Test invalid name format
  console.log('\n  📝 Testing invalid name format...');
  const invalidCustomer2 = { customer_name: 'Test', phone_number: '0912345678' }; // Single name
  const result2 = await makeRequest('POST', BASE_URL, invalidCustomer2);
  console.log('  Single name - Status:', result2.status, 'Success:', result2.success);
  
  // Test invalid phone format
  console.log('\n  📝 Testing invalid phone format...');
  const invalidCustomer3 = { customer_name: 'Test User', phone_number: '123' }; // Too short
  const result3 = await makeRequest('POST', BASE_URL, invalidCustomer3);
  console.log('  Short phone - Status:', result3.status, 'Success:', result3.success);
  
  return { result1, result2, result3 };
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Customer API Tests');
  console.log('================================');
  
  try {
    // Basic CRUD operations
    await testGetLatestCustomers();
    await testGetAllCustomers();
    await testGetPaginatedCustomers();
    
    // Create a test customer
    const customerId = await testCreateCustomer();
    
    if (customerId) {
      // Test operations with the created customer
      await testGetCustomerById(customerId);
      await testUpdateCustomer(customerId);
      await testGetCustomerById(customerId); // Verify update
    }
    
    // Search operations
    await testSearchCustomers();
    await testSearchByPhone();
    await testSearchByOrderId();
    await testSearchByQuery();
    
    // Validation tests
    await testCreateCustomerValidation();
    
    // Clean up - delete test customer
    if (customerId) {
      await testDeleteCustomer(customerId);
    }
    
    console.log('\n✅ All tests completed!');
    console.log('================================');
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
};

// Export for use in other files
export {
  runAllTests,
  testGetLatestCustomers,
  testGetAllCustomers,
  testGetPaginatedCustomers,
  testCreateCustomer,
  testGetCustomerById,
  testUpdateCustomer,
  testSearchCustomers,
  testSearchByPhone,
  testSearchByOrderId,
  testSearchByQuery,
  testDeleteCustomer,
  testCreateCustomerValidation
};

// Run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAllTests();
}