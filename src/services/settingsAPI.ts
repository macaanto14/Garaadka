import { config } from '../config/environment';

const API_BASE_URL = config.apiBaseUrl;

export interface AppSetting {
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'object';
  category: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface SettingUpdate {
  setting_key: string;
  setting_value: any;
  setting_type?: 'string' | 'number' | 'boolean' | 'json' | 'object';
  category?: string;
  description?: string;
}

class SettingsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all settings or by category
  async getAll(category?: string): Promise<AppSetting[]> {
    const url = category 
      ? `${API_BASE_URL}/settings?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/settings`;
      
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    return response.json();
  }

  // Get specific setting by key
  async getByKey(key: string): Promise<AppSetting> {
    const response = await fetch(`${API_BASE_URL}/settings/${encodeURIComponent(key)}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Setting not found');
      }
      throw new Error(`Failed to fetch setting: ${response.statusText}`);
    }

    return response.json();
  }

  // Update or create a single setting
  async updateSetting(key: string, data: Omit<SettingUpdate, 'setting_key'>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update setting: ${response.statusText}`);
    }
  }

  // Update multiple settings at once
  async updateMultiple(settings: SettingUpdate[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ settings })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update settings: ${response.statusText}`);
    }
  }

  // Delete a setting
  async deleteSetting(key: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete setting: ${response.statusText}`);
    }
  }

  // Reset category to defaults
  async resetCategory(category: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/settings/reset/${encodeURIComponent(category)}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to reset settings: ${response.statusText}`);
    }
  }

  // Convenience methods for specific setting types
  async getSerialNumberConfig() {
    try {
      const setting = await this.getByKey('serial_number_config');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        prefix: "PKG",
        randomDigits: 4,
        separator: "",
        format: "prefix+random"
      };
    }
  }

  async getOrderIdConfig() {
    try {
      const setting = await this.getByKey('order_id_config');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        prefix: "ORD",
        randomDigits: 6,
        separator: "-",
        format: "prefix+separator+random",
        includeDate: false,
        dateFormat: "YYYYMMDD"
      };
    }
  }

  async getBusinessInfo() {
    try {
      const setting = await this.getByKey('business_info');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        name: "Garaad wil waal Laundry",
        address: "",
        phone: "",
        email: "",
        website: "",
        taxId: "",
        logo: null,
        description: "",
        workingHours: "Mon-Sat: 8:00 AM - 8:00 PM",
        currency: "USD",
        timezone: "UTC"
      };
    }
  }

  async getInvoiceSettings() {
    try {
      const setting = await this.getByKey('invoice_settings');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        template: "default",
        showLogo: true,
        showBusinessInfo: true,
        showTaxInfo: false,
        footerText: "Thank you for your business!",
        termsAndConditions: "",
        autoGenerate: true,
        numberFormat: "INV-{number}",
        startingNumber: 1000,
        includeQRCode: false
      };
    }
  }

  async getNotificationSettings() {
    try {
      const setting = await this.getByKey('notification_settings');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        orderNotifications: true,
        paymentReminders: true,
        lowStockAlerts: false,
        customerUpdates: true,
        systemMaintenance: true,
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        autoClose: 5000,
        position: "top-right",
        sound: true
      };
    }
  }

  async getThemeSettings() {
    try {
      const setting = await this.getByKey('theme_settings');
      return setting.setting_value;
    } catch (error) {
      // Return default if not found
      return {
        mode: "light",
        primaryColor: "#3b82f6",
        fontSize: "medium",
        compactMode: false,
        sidebarCollapsed: false,
        showAnimations: true,
        customCSS: ""
      };
    }
  }
}

export const settingsAPI = new SettingsAPI();