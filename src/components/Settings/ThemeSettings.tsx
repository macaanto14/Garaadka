import React, { useState } from 'react';
import { Palette, Save, Sun, Moon, Monitor } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const ThemeSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    theme: 'light', // 'light', 'dark', 'auto'
    primaryColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    highContrast: false
  });
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  const handleChange = (setting: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('themeSettings', JSON.stringify(settings));
      setIsModified(false);
      notify.success('Theme settings saved successfully');
    } catch (error) {
      notify.error('Failed to save theme settings');
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'green', label: 'Green', color: 'bg-green-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'teal', label: 'Teal', color: 'bg-teal-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Palette className="h-6 w-6 text-indigo-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Theme & Appearance</h3>
            <p className="text-gray-600 text-sm mt-1">
              Customize the look and feel of your application
            </p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={!isModified}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Selection */}
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Theme Mode</h4>
            <div className="space-y-3">
              {[
                { value: 'light', label: 'Light Mode', icon: Sun, description: 'Clean and bright interface' },
                { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Easy on the eyes in low light' },
                { value: 'auto', label: 'Auto Mode', icon: Monitor, description: 'Follows system preference' }
              ].map((theme) => {
                const IconComponent = theme.icon;
                return (
                  <label key={theme.value} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-transparent hover:border-indigo-200 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) => handleChange('theme', e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{theme.label}</div>
                      <div className="text-xs text-gray-500">{theme.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Primary Color</h4>
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((color) => (
                <label key={color.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="primaryColor"
                    value={color.value}
                    checked={settings.primaryColor === color.value}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full ${color.color} ${settings.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}></div>
                  <span className="text-sm text-gray-700">{color.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Display Options</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => handleChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'compactMode', label: 'Compact Mode', description: 'Reduce spacing and padding' },
                  { key: 'animations', label: 'Enable Animations', description: 'Smooth transitions and effects' },
                  { key: 'highContrast', label: 'High Contrast', description: 'Improved accessibility' }
                ].map((option) => (
                  <div key={option.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={settings[option.key as keyof typeof settings] as boolean}
                      onChange={() => handleChange(option.key, !settings[option.key as keyof typeof settings])}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Preview</h4>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${settings.primaryColor === 'blue' ? 'bg-blue-100 text-blue-800' : 
                settings.primaryColor === 'green' ? 'bg-green-100 text-green-800' :
                settings.primaryColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                settings.primaryColor === 'red' ? 'bg-red-100 text-red-800' :
                settings.primaryColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-teal-100 text-teal-800'}`}>
                <div className={`font-medium ${settings.fontSize === 'small' ? 'text-sm' : 
                  settings.fontSize === 'large' ? 'text-lg' : 
                  settings.fontSize === 'extra-large' ? 'text-xl' : 'text-base'}`}>
                  Sample Header
                </div>
                <div className={`text-opacity-75 ${settings.fontSize === 'small' ? 'text-xs' : 
                  settings.fontSize === 'large' ? 'text-base' : 
                  settings.fontSize === 'extra-large' ? 'text-lg' : 'text-sm'}`}>
                  This is how your content will look with the selected theme settings.
                </div>
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

export default ThemeSettings;