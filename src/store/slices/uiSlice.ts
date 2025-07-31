import { StateCreator } from 'zustand';

export interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface UISlice {
  activeTab: string;
  modals: Record<string, Modal>;
  loading: LoadingState;
  notifications: Notification[];
  
  // Navigation
  setActiveTab: (tab: string) => void;
  navigateTo: (tab: string) => void;
  
  // Modals
  openModal: (id: string, data?: any) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => any;
  
  // Loading states
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const uiSlice: StateCreator<
  UISlice,
  [["zustand/immer", never]],
  [],
  UISlice
> = (set, get) => ({
  activeTab: 'dashboard',
  modals: {},
  loading: {},
  notifications: [],

  // Navigation
  setActiveTab: (tab: string) => {
    set((state) => {
      state.activeTab = tab;
    });
  },

  navigateTo: (tab: string) => {
    get().setActiveTab(tab);
  },

  // Modals
  openModal: (id: string, data?: any) => {
    set((state) => {
      state.modals[id] = { id, isOpen: true, data };
    });
  },

  closeModal: (id: string) => {
    set((state) => {
      if (state.modals[id]) {
        state.modals[id].isOpen = false;
      }
    });
  },

  isModalOpen: (id: string) => {
    return get().modals[id]?.isOpen || false;
  },

  getModalData: (id: string) => {
    return get().modals[id]?.data;
  },

  // Loading states
  setLoading: (key: string, isLoading: boolean) => {
    set((state) => {
      state.loading[key] = isLoading;
    });
  },

  isLoading: (key: string) => {
    return get().loading[key] || false;
  },

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    set((state) => {
      state.notifications.push(newNotification);
    });

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }

    return id;
  },

  removeNotification: (id: string) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
    });
  },
});