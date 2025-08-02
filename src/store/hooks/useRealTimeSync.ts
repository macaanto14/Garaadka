import { useEffect, useRef, useCallback } from 'react';
import { useData, useUI, useAuth } from '../index';

interface RealTimeSyncOptions {
  enabled?: boolean;
  syncInterval?: number;
  conflictResolution?: 'client' | 'server' | 'merge';
}

export const useRealTimeSync = (options: RealTimeSyncOptions = {}) => {
  const {
    enabled = true,
    syncInterval = 10000, // 10 seconds
    conflictResolution = 'server',
  } = options;

  const { isAuthenticated } = useAuth();
  const { addNotification } = useUI();
  const {
    orders,
    customers,
    payments,
    registerRecords,
    updateOrder,
    updateCustomer,
    updatePayment,
    updateRegisterRecord,
  } = useData();

  const lastSyncRef = useRef<number>(Date.now());
  const syncInProgressRef = useRef<boolean>(false);

  // Simulate real-time sync (in a real app, this would use WebSockets or Server-Sent Events)
  const syncData = useCallback(async () => {
    if (!enabled || !isAuthenticated || syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    
    try {
      // In a real implementation, you would:
      // 1. Send a request with the last sync timestamp
      // 2. Receive only changed records since that timestamp
      // 3. Apply conflict resolution strategies
      
      const syncTimestamp = lastSyncRef.current;
      
      // Example: Check for updates since last sync
      // const updates = await api.getUpdatesSince(syncTimestamp);
      
      // For demonstration, we'll simulate some updates
      const hasUpdates = Math.random() > 0.8; // 20% chance of updates
      
      if (hasUpdates) {
        addNotification({
          type: 'info',
          title: 'Data Synchronized',
          message: 'Your data has been updated with the latest changes',
          duration: 3000,
        });
      }
      
      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error('Sync error:', error);
      addNotification({
        type: 'warning',
        title: 'Sync Warning',
        message: 'Unable to sync latest changes. Working offline.',
        duration: 5000,
      });
    } finally {
      syncInProgressRef.current = false;
    }
  }, [enabled, isAuthenticated, addNotification]);

  // Handle conflict resolution
  const resolveConflict = useCallback((localData: any, serverData: any, type: string) => {
    switch (conflictResolution) {
      case 'client':
        return localData;
      case 'server':
        return serverData;
      case 'merge':
        // Simple merge strategy - in practice, this would be more sophisticated
        return {
          ...localData,
          ...serverData,
          updated_at: Math.max(
            new Date(localData.updated_at || 0).getTime(),
            new Date(serverData.updated_at || 0).getTime()
          ),
        };
      default:
        return serverData;
    }
  }, [conflictResolution]);

  // Set up sync interval
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const interval = setInterval(syncData, syncInterval);
    return () => clearInterval(interval);
  }, [enabled, isAuthenticated, syncData, syncInterval]);

  // Manual sync trigger
  const manualSync = useCallback(() => {
    syncData();
  }, [syncData]);

  return {
    manualSync,
    isOnline: navigator.onLine,
    lastSync: lastSyncRef.current,
  };
};