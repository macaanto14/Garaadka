import React, { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    orderNotifications: true,
    paymentReminders: true,
    lowStockAlerts: false,
    customerUpdates: true,
    systemMaintenance: true,
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    autoClose: 5000,
    position: 'top-right'
  });
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  const handleToggle = (setting: string) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
    setIsModified(true);
  };

  const handleSelectChange = (setting: string, value: string | number) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      setIsModified(false);
      notify.success('Notification settings saved successfully');
    } catch (error) {
      notify.error('Failed to save notification settings');
    }
  };

  const testNotification = () => {
    notify.info('This is a test notification!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
            <p className="text-gray-600 text-sm mt-1">
              Configure alerts, reminders, and notification preferences
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={testNotification}
            className="px-4 py-2 text-yellow-600 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
          >
            Test Notification
          </button>
          <button
            onClick={saveSettings}
            disabled={!isModified}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notification Types */}
        <div className="space-y-6">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h4>
            <div className="space-y-4">
              {[
                { key: 'orderNotifications', label: 'Order Updates', description: 'New orders, status changes, completions' },
                { key: 'paymentReminders', label: 'Payment Reminders', description: 'Due dates, overdue payments' },
                { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Inventory warnings and restocking alerts' },
                { key: 'customerUpdates', label: 'Customer Updates', description: 'New registrations, profile changes' },
                { key: 'systemMaintenance', label: 'System Maintenance', description: 'Updates, maintenance windows' }
              ].map((item) => (
                <div key={item.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={() => handleToggle(item.key)}
                    className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Methods & Display Settings */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Delivery Methods</h4>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications' },
                { key: 'smsNotifications', label: 'SMS Notifications', description: 'Text message alerts (requires setup)' }
              ].map((item) => (
                <div key={item.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={() => handleToggle(item.key)}
                    className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-close Duration
                </label>
                <select
                  value={settings.autoClose}
                  onChange={(e) => handleSelectChange('autoClose', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={7000}>7 seconds</option>
                  <option value={10000}>10 seconds</option>
                  <option value={0}>Never auto-close</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Position
                </label>
                <select
                  value={settings.position}
                  onChange={(e) => handleSelectChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {isModified && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
            <span className="text-orange-800 text-sm font-medium">
              You have unsaved changes. Click "Save Changes" to apply your configuration.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;