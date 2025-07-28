const API_BASE_URL = 'http://localhost:5000/api';

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
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && token) {
        removeToken();
        localStorage.removeItem('user');
        window.location.reload(); // Redirect to login
        return Promise.reject(new Error('Session expired'));
      }
      
      const errorData = await response.json().catch(() => ({}));
      
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
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Dispatch custom event for success notifications (for POST, PUT, DELETE operations)
    if (showNotifications && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      window.dispatchEvent(new CustomEvent('api-success', {
        detail: {
          data,
          method: config.method,
          url: endpoint
        }
      }));
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
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
  getAll: () => apiRequest('/customers', {}, false),
  
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
  
  search: (query: string) => apiRequest(`/customers/search/${query}`, {}, false),
};

// Orders API
export const ordersAPI = {
  getAll: () => apiRequest('/orders', {}, false),
  
  getById: (id: number) => apiRequest(`/orders/${id}`, {}, false),
  
  create: (orderData: any) =>
    apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  
  updateStatus: (id: number, status: string, updatedBy?: string) =>
    apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updated_by: updatedBy }),
    }),
  
  getStats: () => apiRequest('/orders/stats/dashboard', {}, false),
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

// Export token management functions
export { getToken, setToken, removeToken };