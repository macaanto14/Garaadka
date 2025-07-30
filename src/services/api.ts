import { config } from '../config/environment';

// Use environment configuration with proper fallbacks
const API_BASE_URL = config.apiBaseUrl;

// Token management
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// Generic API request function with JWT support
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, showNotifications = true): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  // Log API requests in development
  if (config.isDevelopment && config.debug) {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  }
  
  const requestConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && token) {
        removeToken();
        localStorage.removeItem('user');
        window.location.reload(); // Redirect to login
        return Promise.reject(new Error('Session expired'));
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      // Log API errors in development
      if (config.isDevelopment) {
        console.error(`❌ API Error: ${response.status} ${url}`, errorData);
      }
      
      // Dispatch custom event for error notifications
      if (showNotifications) {
        window.dispatchEvent(new CustomEvent('api-error', {
          detail: {
            status: response.status,
            message: errorData.error || errorData.message,
            url: endpoint
          }
        }));
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log successful API responses in development
    if (config.isDevelopment && config.debug) {
      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`, data);
    }
    
    // Dispatch custom event for success notifications (for POST, PUT, DELETE operations)
    if (showNotifications && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(requestConfig.method?.toUpperCase() || '')) {
      window.dispatchEvent(new CustomEvent('api-success', {
        detail: {
          data,
          method: requestConfig.method,
          url: endpoint
        }
      }));
    }
    
    return data;
  } catch (error) {
    // Enhanced error logging in development
    if (config.isDevelopment) {
      console.error('💥 API request failed:', {
        url,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : error
      });
    }
    throw error;
  }
}

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false);
    
    if (response.token) {
      setToken(response.token);
    }
    
    return response;
  },
  
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' }, false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      localStorage.removeItem('user');
    }
  },
  
  refreshToken: () => apiRequest('/auth/refresh', { method: 'POST' }, false),
  
  getProfile: () => apiRequest('/auth/profile', {}, false),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Customers API
export const customersAPI = {
  // Latest 5 customers (default, optimized)
  getLatest: () => apiRequest('/customers', {}, false),
  
  // All customers (admin use)
  getAll: () => apiRequest('/customers/all', {}, false),
  
  // Paginated customers
  getPaginated: (page: number = 1, limit: number = 10) => 
    apiRequest(`/customers/paginated?page=${page}&limit=${limit}`, {}, false),
  
  getById: (id: number) => apiRequest(`/customers/${id}`, {}, false),
  
  create: (customerData: any) =>
    apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),
  
  update: (id: number, customerData: any) =>
    apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),
  
  delete: (id: number) =>
    apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    }),
  
  // Enhanced search capabilities
  search: {
    // General search (backwards compatible)
    general: (query: string) => {
      const encodedQuery = encodeURIComponent(query.trim());
      return apiRequest(`/customers/search/${encodedQuery}`, {}, false);
    },
    
    // Search by phone number
    byPhone: (phone: string) => {
      const encodedPhone = encodeURIComponent(phone.trim());
      return apiRequest(`/customers/search/phone/${encodedPhone}`, {}, false);
    },
    
    // Search by order ID
    byOrderId: (orderId: string) => {
      const encodedOrderId = encodeURIComponent(orderId.trim());
      return apiRequest(`/customers/search/order/${encodedOrderId}`, {}, false);
    },
    
    // Advanced search with query parameters
    advanced: (params: {
      phone?: string;
      order_id?: string;
      name?: string;
      query?: string;
      search_type?: 'any' | 'all';
    }) => {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim()) {
          searchParams.append(key, value.trim());
        }
      });
      
      return apiRequest(`/customers/search?${searchParams.toString()}`, {}, false);
    },
    
    // Smart search - automatically detects search type
    smart: async (input: string) => {
      const trimmedInput = input.trim();
      
      // Don't process empty inputs
      if (trimmedInput.length === 0) {
        return customersAPI.getLatest(); // Return latest customers instead of empty search
      }
      
      // Handle very short inputs (1-2 characters) more carefully
      if (trimmedInput.length <= 2) {
        // For single digits like "0", "1", etc., be more cautious
        if (/^\d$/.test(trimmedInput)) {
          // Single digit - could be problematic, but still search
          return customersAPI.search.general(trimmedInput);
        } else if (/^[a-zA-Z]+$/.test(trimmedInput)) {
          // Letters only - search by name
          return customersAPI.search.general(trimmedInput);
        }
        // For other short inputs, default to general search
        return customersAPI.search.general(trimmedInput);
      }
      
      // Phone number pattern - must be at least 7 digits and contain mostly numbers
      const phonePattern = /^[0-9+\-\s()]{7,15}$/;
      const digitCount = (trimmedInput.match(/\d/g) || []).length;
      
      // Order ID pattern - more specific patterns (excluding pure long numbers that could be phone numbers)
      const orderIdPatterns = [
        /^ORD-\d{4}-\d{3,}$/i,           // ORD-2024-001 format
        /^#\d{3,}$/,                     // #123 format (at least 3 digits)
      ];
      
      // Check if it's a phone number FIRST (at least 7 digits, mostly numeric, and reasonable length for phone)
      if (phonePattern.test(trimmedInput) && digitCount >= 7 && digitCount <= 15) {
        return customersAPI.search.byPhone(trimmedInput);
      }
      
      // Check if it matches specific order ID patterns (but not pure numbers that could be phone numbers)
      const isOrderId = orderIdPatterns.some(pattern => pattern.test(trimmedInput));
      if (isOrderId) {
        return customersAPI.search.byOrderId(trimmedInput);
      }
      
      // For pure numbers, if it's short (3-6 digits), try order ID first, then fallback to general
      if (/^\d+$/.test(trimmedInput)) {
        if (trimmedInput.length >= 3 && trimmedInput.length <= 6) {
          try {
            return await customersAPI.search.byOrderId(trimmedInput);
          } catch (error: any) {
            // If order ID search fails (404), fallback to general search
            if (error.message?.includes('No customer found with this order ID') || 
                error.message?.includes('404')) {
              console.log(`Order ID search failed for "${trimmedInput}", falling back to general search`);
              return customersAPI.search.general(trimmedInput);
            }
            // Re-throw other errors
            throw error;
          }
        } else if (trimmedInput.length >= 7) {
          return customersAPI.search.byPhone(trimmedInput);
        }
      }
      
      // Default to general search for names and other text
      return customersAPI.search.general(trimmedInput);
    }
  },
  
  // Legacy search method for backwards compatibility
  searchLegacy: (query: string) => customersAPI.search.smart(query),
};

// Orders API
export const ordersAPI = {
  getAll: () => apiRequest('/orders', {}, false),
  getById: (id: string) => apiRequest(`/orders/${id}`, {}, false),
  getByCustomer: (customerId: string) => apiRequest(`/orders/customer/${customerId}`, {}, false),
  create: (orderData: any) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  updateStatus: (id: string, status: string) => apiRequest(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  update: (id: string, orderData: any) => apiRequest(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(orderData),
  }),
  delete: (id: string) => apiRequest(`/orders/${id}`, {
    method: 'DELETE',
  }),
  getStats: () => apiRequest('/orders/stats/dashboard', {}, false)
};

// Payments API
export const paymentsAPI = {
  getAll: () => apiRequest('/payments', {}, false),
  
  getStats: () => apiRequest('/payments/stats', {}, false),
  
  create: (paymentData: any) =>
    apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
};

// Audit API
export const auditAPI = {
  getAll: () => apiRequest('/audit', {}, false),
  
  getStats: () => apiRequest('/audit/stats', {}, false),
};

// Receipts API
export const receiptsAPI = {
  getOrderReceipt: (orderId: number) => apiRequest(`/receipts/order/${orderId}`, {}, false),
};

// Register API
export const registerAPI = {
  // Search by phone number
  searchByPhone: (phone: string) => {
    const encodedPhone = encodeURIComponent(phone.trim());
    return apiRequest(`/register/search/${encodedPhone}`, {}, false);
  },
  
  // Get all records with pagination and filtering
  getAll: (page: number = 1, limit: number = 10, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    return apiRequest(`/register?${params.toString()}`, {}, false);
  },
  
  // Get single record by ID
  getById: (id: number) => apiRequest(`/register/${id}`, {}, false),
  
  // Create new register entry
  create: (registerData: any) =>
    apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    }),
  
  // Update register entry
  update: (id: number, registerData: any) =>
    apiRequest(`/register/${id}`, {
      method: 'PUT',
      body: JSON.stringify(registerData),
    }),
  
  // Update delivery status
  updateStatus: (id: number, status: string, notes?: string) =>
    apiRequest(`/register/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ delivery_status: status, notes }),
    }),
  
  // Soft delete register entry
  delete: (id: number) =>
    apiRequest(`/register/${id}`, {
      method: 'DELETE',
    }),
  
  // Get register statistics
  getStats: () => apiRequest('/register/stats/summary', {}, false),
};

// Export token management functions
export { getToken, setToken, removeToken };