import { StateCreator } from 'zustand';

export type Language = 'en' | 'so' | 'om' | 'am';

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logo: string | null;
}

export interface NotificationSettings {
  orderNotifications: boolean;
  paymentReminders: boolean;
  lowStockAlerts: boolean;
  customerUpdates: boolean;
  systemMaintenance: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  autoClose: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface SettingsSlice {
  language: Language;
  businessSettings: BusinessSettings;
  notificationSettings: NotificationSettings;
  theme: ThemeSettings;
  
  // Language
  setLanguage: (language: Language) => void;
  
  // Business settings
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  
  // Notification settings
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Theme settings
  updateTheme: (theme: Partial<ThemeSettings>) => void;
}

export const settingsSlice: StateCreator<
  SettingsSlice,
  [["zustand/immer", never]],
  [],
  SettingsSlice
> = (set) => ({
  language: 'en',
  businessSettings: {
    name: 'Garaad wil waal Laundry',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    logo: null,
  },
  notificationSettings: {
    orderNotifications: true,
    paymentReminders: true,
    lowStockAlerts: false,
    customerUpdates: true,
    systemMaintenance: true,
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    autoClose: 5000,
    position: 'top-right',
  },
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    compactMode: false,
  },

  setLanguage: (language: Language) => {
    set((state) => {
      state.language = language;
    });
  },

  updateBusinessSettings: (settings: Partial<BusinessSettings>) => {
    set((state) => {
      state.businessSettings = { ...state.businessSettings, ...settings };
    });
  },

  updateNotificationSettings: (settings: Partial<NotificationSettings>) => {
    set((state) => {
      state.notificationSettings = { ...state.notificationSettings, ...settings };
    });
  },

  updateTheme: (theme: Partial<ThemeSettings>) => {
    set((state) => {
      state.theme = { ...state.theme, ...theme };
    });
  },
});