import React, { useState, useEffect } from 'react';
import { Package, RefreshCw, Save, RotateCcw } from 'lucide-react';
import { useSettings } from '../../store';
import { useToast } from '../../hooks/useToast';
import { generateSerialNumber, SERIAL_CONFIGS } from '../../utils/serialNumber';

const SerialNumberSettings: React.FC = () => {
  const { 
    serialNumberConfig, 
    updateSerialNumberConfig, 
    resetCategoryToDefaults,
    isLoading,
    error,
    clearError
  } = useSettings();
  
  const { notify } = useToast();
  
  const [localConfig, setLocalConfig] = useState(serialNumberConfig);
  const [previewSerial, setPreviewSerial] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local config when store config changes
  useEffect(() => {
    setLocalConfig(serialNumberConfig);
    setHasChanges(false);
  }, [serialNumberConfig]);

  // Generate preview when config changes
  useEffect(() => {
    try {
      const preview = generateSerialNumber(localConfig);
      setPreviewSerial(preview);
    } catch (error) {
      setPreviewSerial('Invalid Config');
    }
  }, [localConfig]);

  // Check for changes
  useEffect(() => {
    const hasChanged = JSON.stringify(localConfig) !== JSON.stringify(serialNumberConfig);
    setHasChanges(hasChanged);
  }, [localConfig, serialNumberConfig]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleConfigChange = (field: keyof typeof localConfig, value: string | number) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePresetChange = (presetName: string) => {
    if (presetName === 'CUSTOM') return;
    
    const config = SERIAL_CONFIGS[presetName as keyof typeof SERIAL_CONFIGS];
    if (config) {
      setLocalConfig({
        prefix: config.prefix,
        randomDigits: config.randomDigits,
        separator: config.separator || '',
        format: config.format || 'prefix+random'
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSerialNumberConfig(localConfig);
      notify.success('Serial number configuration saved successfully!');
    } catch (error: any) {
      notify.error(error.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset serial number settings to defaults?')) {
      try {
        await resetCategoryToDefaults('serial_numbers');
        notify.success('Serial number settings reset to defaults');
      } catch (error: any) {
        notify.error(error.message || 'Failed to reset settings');
      }
    }
  };

  const generateNewPreview = () => {
    try {
      const newPreview = generateSerialNumber(localConfig);
      setPreviewSerial(newPreview);
    } catch (error) {
      setPreviewSerial('Invalid Config');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Package Serial Number Configuration</h3>
            <p className="text-sm text-gray-600">Configure how package serial numbers are generated</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Configuration</h4>
          
          {/* Preset Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preset Configurations
            </label>
            <select
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CUSTOM">Custom Configuration</option>
              {Object.entries(SERIAL_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {key} ({config.prefix}{config.separator}{Array(config.randomDigits).fill('X').join('')})
                </option>
              ))}
            </select>
          </div>

          {/* Prefix */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prefix
            </label>
            <input
              type="text"
              value={localConfig.prefix}
              onChange={(e) => handleConfigChange('prefix', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., PKG, ORDER, etc."
            />
          </div>

          {/* Random Digits */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Random Digits
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={localConfig.randomDigits}
              onChange={(e) => handleConfigChange('randomDigits', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Separator */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Separator
            </label>
            <input
              type="text"
              value={localConfig.separator}
              onChange={(e) => handleConfigChange('separator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., -, _, or leave empty"
            />
          </div>

          {/* Format */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={localConfig.format}
              onChange={(e) => handleConfigChange('format', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="prefix+random">Prefix + Random</option>
              <option value="prefix+separator+random">Prefix + Separator + Random</option>
              <option value="random+separator+prefix">Random + Separator + Prefix</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Preview</h4>
          
          <div className="text-center">
            <div className="bg-white rounded-lg p-6 border-2 border-dashed border-blue-300">
              <div className="text-2xl font-mono font-bold text-blue-600 mb-2">
                {previewSerial}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Sample serial number with current configuration
              </p>
              <button
                onClick={generateNewPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h5 className="font-medium text-gray-900">Configuration Summary:</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Prefix: <span className="font-mono">{localConfig.prefix || 'None'}</span></div>
              <div>Digits: <span className="font-mono">{localConfig.randomDigits}</span></div>
              <div>Separator: <span className="font-mono">{localConfig.separator || 'None'}</span></div>
              <div>Format: <span className="font-mono">{localConfig.format}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 className="font-medium text-yellow-800 mb-2">Important Notes:</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Changes will apply to all new packages created after saving</li>
          <li>• Existing package serial numbers will not be affected</li>
          <li>• Make sure the configuration generates unique serial numbers</li>
          <li>• Test the preview before saving to ensure the format meets your needs</li>
        </ul>
      </div>
    </div>
  );
};

export default SerialNumberSettings;