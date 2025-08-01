import { StateCreator } from 'zustand';
import { settingsAPI } from '../../services/settingsAPI';

export type Language = 'en' | 'so' | 'om' | 'am';

export interface SerialNumberConfig {
  prefix: string;
  randomDigits: number;
  separator: string;
  format: string;
}

export interface OrderIdConfig {
  prefix: string;
  randomDigits: number;
  separator: string;
  format: string;
  includeDate: boolean;
  dateFormat: string;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logo: string | null;
  description: string;
  workingHours: string;
  currency: string;
  timezone: string;
}

export interface InvoiceSettings {
  template: string;
  showLogo: boolean;
  showBusinessInfo: boolean;
  showTaxInfo: boolean;
  footerText: string;
  termsAndConditions: string;
  autoGenerate: boolean;
  numberFormat: string;
  startingNumber: number;
  includeQRCode: boolean;
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
  sound: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  sidebarCollapsed: boolean;
  showAnimations: boolean;
  customCSS: string;
}

export interface SettingsSlice {
  language: Language;
  serialNumberConfig: SerialNumberConfig;
  orderIdConfig: OrderIdConfig;
  businessSettings: BusinessSettings;
  invoiceSettings: InvoiceSettings;
  notificationSettings: NotificationSettings;
  theme: ThemeSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLanguage: (language: Language) => void;
  loadSettings: () => Promise<void>;
  updateSerialNumberConfig: (config: Partial<SerialNumberConfig>) => Promise<void>;
  updateOrderIdConfig: (config: Partial<OrderIdConfig>) => Promise<void>;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateTheme: (theme: Partial<ThemeSettings>) => Promise<void>;
  resetCategoryToDefaults: (category: string) => Promise<void>;
  clearError: () => void;
}

export const settingsSlice: StateCreator<
  SettingsSlice,
  [["zustand/immer", never]],
  [],
  SettingsSlice
> = (set, get) => ({
  language: 'en',
  serialNumberConfig: {
    prefix: 'PKG',
    randomDigits: 4,
    separator: '',
    format: 'prefix+random'
  },
  orderIdConfig: {
    prefix: 'ORD',
    randomDigits: 6,
    separator: '-',
    format: 'prefix+separator+random',
    includeDate: false,
    dateFormat: 'YYYYMMDD'
  },
  businessSettings: {
    name: 'Garaad wil waal Laundry',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    logo: null,
    description: '',
    workingHours: 'Mon-Sat: 8:00 AM - 8:00 PM',
    currency: 'USD',
    timezone: 'UTC'
  },
  invoiceSettings: {
    template: 'default',
    showLogo: true,
    showBusinessInfo: true,
    showTaxInfo: false,
    footerText: 'Thank you for your business!',
    termsAndConditions: '',
    autoGenerate: true,
    numberFormat: 'INV-{number}',
    startingNumber: 1000,
    includeQRCode: false
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
    sound: true
  },
  theme: {
    mode: 'light',
    primaryColor: '#3b82f6',
    fontSize: 'medium',
    compactMode: false,
    sidebarCollapsed: false,
    showAnimations: true,
    customCSS: ''
  },
  isLoading: false,
  error: null,

  setLanguage: (language: Language) => {
    set((state) => {
      state.language = language;
    });
    
    // Save language to backend
    settingsAPI.updateSetting('app_language', {
      setting_value: language,
      setting_type: 'string',
      category: 'general',
      description: 'Default application language'
    }).catch(console.error);
  },

  loadSettings: async () => {
    set((state) => {
      state.isLoading = true;
      state.error = null;
    });

    try {
      // Load all settings from backend
      const [
        serialConfig,
        orderConfig,
        businessInfo,
        invoiceSettings,
        notificationSettings,
        themeSettings
      ] = await Promise.all([
        settingsAPI.getSerialNumberConfig(),
        settingsAPI.getOrderIdConfig(),
        settingsAPI.getBusinessInfo(),
        settingsAPI.getInvoiceSettings(),
        settingsAPI.getNotificationSettings(),
        settingsAPI.getThemeSettings()
      ]);

      // Try to get language setting
      let language = 'en';
      try {
        const langSetting = await settingsAPI.getByKey('app_language');
        language = langSetting.setting_value;
      } catch (error) {
        // Use default if not found
      }

      set((state) => {
        state.language = language as Language;
        state.serialNumberConfig = serialConfig;
        state.orderIdConfig = orderConfig;
        state.businessSettings = businessInfo;
        state.invoiceSettings = invoiceSettings;
        state.notificationSettings = notificationSettings;
        state.theme = themeSettings;
        state.isLoading = false;
      });
    } catch (error: any) {
      set((state) => {
        state.error = error.message || 'Failed to load settings';
        state.isLoading = false;
      });
    }
  },

  updateSerialNumberConfig: async (config: Partial<SerialNumberConfig>) => {
    const currentConfig = get().serialNumberConfig;
    const newConfig = { ...currentConfig, ...config };

    set((state) => {
      state.serialNumberConfig = newConfig;
    });

    try {
      await settingsAPI.updateSetting('serial_number_config', {
        setting_value: newConfig,
        setting_type: 'json',
        category: 'serial_numbers',
        description: 'Package serial number generation configuration'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.serialNumberConfig = currentConfig;
        state.error = error.message || 'Failed to update serial number config';
      });
      throw error;
    }
  },

  updateOrderIdConfig: async (config: Partial<OrderIdConfig>) => {
    const currentConfig = get().orderIdConfig;
    const newConfig = { ...currentConfig, ...config };

    set((state) => {
      state.orderIdConfig = newConfig;
    });

    try {
      await settingsAPI.updateSetting('order_id_config', {
        setting_value: newConfig,
        setting_type: 'json',
        category: 'order_ids',
        description: 'Order ID generation configuration'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.orderIdConfig = currentConfig;
        state.error = error.message || 'Failed to update order ID config';
      });
      throw error;
    }
  },

  updateBusinessSettings: async (settings: Partial<BusinessSettings>) => {
    const currentSettings = get().businessSettings;
    const newSettings = { ...currentSettings, ...settings };

    set((state) => {
      state.businessSettings = newSettings;
    });

    try {
      await settingsAPI.updateSetting('business_info', {
        setting_value: newSettings,
        setting_type: 'json',
        category: 'business',
        description: 'Business information and contact details'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.businessSettings = currentSettings;
        state.error = error.message || 'Failed to update business settings';
      });
      throw error;
    }
  },

  updateInvoiceSettings: async (settings: Partial<InvoiceSettings>) => {
    const currentSettings = get().invoiceSettings;
    const newSettings = { ...currentSettings, ...settings };

    set((state) => {
      state.invoiceSettings = newSettings;
    });

    try {
      await settingsAPI.updateSetting('invoice_settings', {
        setting_value: newSettings,
        setting_type: 'json',
        category: 'invoices',
        description: 'Invoice generation and formatting settings'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.invoiceSettings = currentSettings;
        state.error = error.message || 'Failed to update invoice settings';
      });
      throw error;
    }
  },

  updateNotificationSettings: async (settings: Partial<NotificationSettings>) => {
    const currentSettings = get().notificationSettings;
    const newSettings = { ...currentSettings, ...settings };

    set((state) => {
      state.notificationSettings = newSettings;
    });

    try {
      await settingsAPI.updateSetting('notification_settings', {
        setting_value: newSettings,
        setting_type: 'json',
        category: 'notifications',
        description: 'Notification preferences and settings'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.notificationSettings = currentSettings;
        state.error = error.message || 'Failed to update notification settings';
      });
      throw error;
    }
  },

  updateTheme: async (theme: Partial<ThemeSettings>) => {
    const currentTheme = get().theme;
    const newTheme = { ...currentTheme, ...theme };

    set((state) => {
      state.theme = newTheme;
    });

    try {
      await settingsAPI.updateSetting('theme_settings', {
        setting_value: newTheme,
        setting_type: 'json',
        category: 'theme',
        description: 'Theme and appearance customization'
      });
    } catch (error: any) {
      // Revert on error
      set((state) => {
        state.theme = currentTheme;
        state.error = error.message || 'Failed to update theme settings';
      });
      throw error;
    }
  },

  resetCategoryToDefaults: async (category: string) => {
    set((state) => {
      state.isLoading = true;
      state.error = null;
    });

    try {
      await settingsAPI.resetCategory(category);
      
      // Reload settings after reset
      await get().loadSettings();
    } catch (error: any) {
      set((state) => {
        state.error = error.message || 'Failed to reset settings';
        state.isLoading = false;
      });
      throw error;
    }
  },

  clearError: () => {
    set((state) => {
      state.error = null;
    });
  }
});