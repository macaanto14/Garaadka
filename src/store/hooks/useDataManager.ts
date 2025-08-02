import { useCallback } from 'react';
import { useData, useUI } from '../index';
import { useEnhancedApiData } from './useEnhancedApiData';
import { useRealTimeSync } from './useRealTimeSync';
import { Order, Customer, Payment, RegisterRecord } from '../../types';

export const useDataManager = () => {
  const { addNotification } = useUI();
  const {
    addOrder,
    updateOrder,
    removeOrder,
    addCustomer,
    updateCustomer,
    removeCustomer,
    addPayment,
    updatePayment,
    removePayment,
    addRegisterRecord,
    updateRegisterRecord,
    removeRegisterRecord,
    clearData,
  } = useData();

  // Enhanced API data management
  const apiData = useEnhancedApiData({
    autoRefresh: true,
    refreshInterval: 30000,
    retryAttempts: 3,
    cacheTimeout: 300000,
  });

  // Real-time synchronization
  const realTimeSync = useRealTimeSync({
    enabled: true,
    syncInterval: 10000,
    conflictResolution: 'server',
  });

  // Optimistic updates with rollback capability
  const optimisticUpdate = useCallback(async <T>(
    operation: () => Promise<T>,
    optimisticAction: () => void,
    rollbackAction: () => void,
    successMessage?: string,
    errorMessage?: string
  ) => {
    // Apply optimistic update
    optimisticAction();

    try {
      const result = await operation();
      
      if (successMessage) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: successMessage,
          duration: 3000,
        });
      }
      
      return result;
    } catch (error) {
      // Rollback on error
      rollbackAction();
      
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage || 'Operation failed',
        duration: 5000,
      });
      
      throw error;
    }
  }, [addNotification]);

  // Enhanced CRUD operations with optimistic updates
  const createOrder = useCallback(async (orderData: Omit<Order, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const tempOrder = { ...orderData, id: tempId } as Order;

    return optimisticUpdate(
      async () => {
        // API call would go here
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
        return response.json();
      },
      () => addOrder(tempOrder),
      () => removeOrder(tempId),
      'Order created successfully',
      'Failed to create order'
    );
  }, [optimisticUpdate, addOrder, removeOrder]);

  const updateOrderData = useCallback(async (orderId: string, updates: Partial<Order>) => {
    const originalOrder = apiData.orders.find(o => o.order_number === orderId);
    
    return optimisticUpdate(
      async () => {
        // API call would go here
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        return response.json();
      },
      () => updateOrder(orderId, updates),
      () => originalOrder && updateOrder(orderId, originalOrder),
      'Order updated successfully',
      'Failed to update order'
    );
  }, [optimisticUpdate, updateOrder, apiData.orders]);

  // Batch operations
  const batchUpdate = useCallback(async (operations: Array<() => Promise<any>>) => {
    const results = [];
    const errors = [];

    for (const operation of operations) {
      try {
        const result = await operation();
        results.push(result);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      addNotification({
        type: 'warning',
        title: 'Batch Operation',
        message: `${results.length} operations succeeded, ${errors.length} failed`,
        duration: 5000,
      });
    } else {
      addNotification({
        type: 'success',
        title: 'Batch Operation',
        message: `All ${results.length} operations completed successfully`,
        duration: 3000,
      });
    }

    return { results, errors };
  }, [addNotification]);

  // Data export functionality
  const exportData = useCallback((dataType: 'orders' | 'customers' | 'payments' | 'all') => {
    const data = {
      orders: apiData.orders,
      customers: apiData.customers,
      payments: apiData.payments,
      registerRecords: apiData.registerRecords,
    };

    const exportData = dataType === 'all' ? data : { [dataType]: data[dataType] };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `garaadka-${dataType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Export Complete',
      message: `${dataType} data exported successfully`,
      duration: 3000,
    });
  }, [apiData, addNotification]);

  return {
    // Data access
    ...apiData,
    
    // Real-time sync
    ...realTimeSync,
    
    // Enhanced CRUD operations
    createOrder,
    updateOrderData,
    batchUpdate,
    
    // Utility functions
    exportData,
    clearAllData: clearData,
    
    // Direct access to store actions for advanced use cases
    storeActions: {
      addOrder,
      updateOrder,
      removeOrder,
      addCustomer,
      updateCustomer,
      removeCustomer,
      addPayment,
      updatePayment,
      removePayment,
      addRegisterRecord,
      updateRegisterRecord,
      removeRegisterRecord,
    },
  };
};