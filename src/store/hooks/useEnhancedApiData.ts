import { useEffect, useCallback, useRef } from 'react';
import { useData, useUI, useAuth } from '../index';
import { ordersAPI, customersAPI, paymentsAPI, registerAPI } from '../../services/api';

interface ApiOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  retryAttempts?: number;
  cacheTimeout?: number;
}

export const useEnhancedApiData = (options: ApiOptions = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    retryAttempts = 3,
    cacheTimeout = 300000, // 5 minutes
  } = options;

  const {
    orders,
    customers,
    payments,
    registerRecords,
    stats,
    setOrders,
    setCustomers,
    setPayments,
    setRegisterRecords,
    setStats,
  } = useData();

  const { setLoading, addNotification } = useUI();
  const { isAuthenticated } = useAuth();
  
  const lastFetchRef = useRef<Record<string, number>>({});
  const retryCountRef = useRef<Record<string, number>>({});

  // Generic API call with retry logic and error handling
  const apiCall = useCallback(async <T>(
    apiFunction: () => Promise<T>,
    dataKey: string,
    setter: (data: any) => void,
    transform?: (data: T) => any
  ) => {
    if (!isAuthenticated) return;

    // Check cache timeout
    const lastFetch = lastFetchRef.current[dataKey];
    if (lastFetch && Date.now() - lastFetch < cacheTimeout) {
      return;
    }

    const retryCount = retryCountRef.current[dataKey] || 0;
    
    try {
      setLoading(dataKey, true);
      const response = await apiFunction();
      const data = transform ? transform(response) : response;
      setter(data);
      
      // Update cache timestamp and reset retry count
      lastFetchRef.current[dataKey] = Date.now();
      retryCountRef.current[dataKey] = 0;
      
    } catch (error) {
      console.error(`Error loading ${dataKey}:`, error);
      
      // Retry logic
      if (retryCount < retryAttempts) {
        retryCountRef.current[dataKey] = retryCount + 1;
        setTimeout(() => {
          apiCall(apiFunction, dataKey, setter, transform);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        addNotification({
          type: 'error',
          title: 'Data Loading Error',
          message: `Failed to load ${dataKey} after ${retryAttempts} attempts`,
          duration: 8000,
        });
        retryCountRef.current[dataKey] = 0;
      }
    } finally {
      setLoading(dataKey, false);
    }
  }, [isAuthenticated, cacheTimeout, retryAttempts, setLoading, addNotification]);

  // Load functions with enhanced error handling
  const loadOrders = useCallback(async (filters?: any) => {
    await apiCall(
      () => ordersAPI.getAll(filters),
      'orders',
      setOrders,
      (response) => Array.isArray(response) ? response : response.orders || []
    );
  }, [apiCall, setOrders]);

  const loadCustomers = useCallback(async (filters?: any) => {
    await apiCall(
      () => customersAPI.getAll(filters),
      'customers',
      setCustomers,
      (response) => Array.isArray(response) ? response : response.customers || []
    );
  }, [apiCall, setCustomers]);

  const loadPayments = useCallback(async (filters?: any) => {
    await apiCall(
      () => paymentsAPI.getAll(filters),
      'payments',
      setPayments,
      (response) => Array.isArray(response) ? response : response.payments || []
    );
  }, [apiCall, setPayments]);

  const loadRegisterRecords = useCallback(async (filters?: any) => {
    await apiCall(
      () => registerAPI.getAll(filters),
      'registerRecords',
      setRegisterRecords,
      (response) => Array.isArray(response) ? response : response.records || []
    );
  }, [apiCall, setRegisterRecords]);

  const loadStats = useCallback(async () => {
    await apiCall(
      async () => {
        const [ordersResponse, paymentsResponse] = await Promise.all([
          ordersAPI.getStats?.() || Promise.resolve({}),
          paymentsAPI.getStats?.() || Promise.resolve({}),
        ]);
        return { ordersResponse, paymentsResponse };
      },
      'stats',
      setStats,
      ({ ordersResponse, paymentsResponse }) => ({
        totalOrders: ordersResponse.total || orders.length,
        activeCustomers: ordersResponse.activeCustomers || customers.length,
        monthlyRevenue: paymentsResponse.monthlyRevenue || 0,
        pendingOrders: ordersResponse.pending || 0,
        totalPayments: paymentsResponse.total || payments.length,
        cashPayments: paymentsResponse.cash || 0,
        ebirrPayments: paymentsResponse.ebirr || 0,
        cbePayments: paymentsResponse.cbe || 0,
        bankTransferPayments: paymentsResponse.bankTransfer || 0,
        todayPayments: paymentsResponse.today || 0,
      })
    );
  }, [apiCall, setStats, orders.length, customers.length, payments.length]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    // Clear cache to force refresh
    lastFetchRef.current = {};
    loadOrders();
    loadCustomers();
    loadPayments();
    loadRegisterRecords();
    loadStats();
  }, [loadOrders, loadCustomers, loadPayments, loadRegisterRecords, loadStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(refreshAll, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshAll, isAuthenticated]);

  // Initial data load
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated, refreshAll]);

  return {
    // Data
    orders,
    customers,
    payments,
    registerRecords,
    stats,
    
    // Loading functions
    loadOrders,
    loadCustomers,
    loadPayments,
    loadRegisterRecords,
    loadStats,
    refreshAll,
    
    // Cache management
    clearCache: () => {
      lastFetchRef.current = {};
    },
    
    // Force refresh (ignores cache)
    forceRefresh: () => {
      lastFetchRef.current = {};
      refreshAll();
    },
  };
};