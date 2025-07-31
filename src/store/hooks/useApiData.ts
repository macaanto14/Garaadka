import { useEffect } from 'react';
import { useData, useUI } from '../index';
import { ordersAPI, customersAPI, paymentsAPI, registerAPI } from '../../services/api';

// Custom hook for managing API data with global state
export const useApiData = () => {
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

  // Load orders
  const loadOrders = async (filters?: any) => {
    try {
      setLoading('orders', true);
      const response = await ordersAPI.getAll(filters);
      setOrders(Array.isArray(response) ? response : response.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load orders',
      });
    } finally {
      setLoading('orders', false);
    }
  };

  // Load customers
  const loadCustomers = async (filters?: any) => {
    try {
      setLoading('customers', true);
      const response = await customersAPI.getAll(filters);
      setCustomers(Array.isArray(response) ? response : response.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load customers',
      });
    } finally {
      setLoading('customers', false);
    }
  };

  // Load payments
  const loadPayments = async (filters?: any) => {
    try {
      setLoading('payments', true);
      const response = await paymentsAPI.getAll(filters);
      setPayments(Array.isArray(response) ? response : response.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load payments',
      });
    } finally {
      setLoading('payments', false);
    }
  };

  // Load register records
  const loadRegisterRecords = async (filters?: any) => {
    try {
      setLoading('registerRecords', true);
      const response = await registerAPI.getAll(filters);
      setRegisterRecords(Array.isArray(response) ? response : response.records || []);
    } catch (error) {
      console.error('Error loading register records:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load register records',
      });
    } finally {
      setLoading('registerRecords', false);
    }
  };

  // Load dashboard stats
  const loadStats = async () => {
    try {
      setLoading('stats', true);
      // You can implement a stats API endpoint or calculate from existing data
      const [ordersResponse, paymentsResponse] = await Promise.all([
        ordersAPI.getStats?.() || Promise.resolve({}),
        paymentsAPI.getStats?.() || Promise.resolve({}),
      ]);
      
      setStats({
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
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load statistics',
      });
    } finally {
      setLoading('stats', false);
    }
  };

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
    
    // Refresh all data
    refreshAll: () => {
      loadOrders();
      loadCustomers();
      loadPayments();
      loadRegisterRecords();
      loadStats();
    },
  };
};