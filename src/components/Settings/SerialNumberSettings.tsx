import React, { useState, useEffect } from 'react';
import { Package, Save, RotateCcw, Eye, Copy, Check } from 'lucide-react';
import { generateSerialNumber, SERIAL_CONFIGS, SerialNumberConfig } from '../../utils/serialNumber';
import { useToast } from '../../hooks/useToast';

const SerialNumberSettings: React.FC = () => {
  const [customPrefix, setCustomPrefix] = useState('PKG');
  const [customDigits, setCustomDigits] = useState(4);
  const [customSeparator, setCustomSeparator] = useState('');
  const [previewSerial, setPreviewSerial] = useState('PKG1234');
  const [selectedPreset, setSelectedPreset] = useState('PACKAGE');
  const [copied, setCopied] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  // Initialize with default configuration
  useEffect(() => {
    try {
      const config = SERIAL_CONFIGS.PACKAGE;
      setCustomPrefix(config.prefix);
      setCustomDigits(config.randomDigits);
      setCustomSeparator(config.separator || '');
      const newSerial = generateSerialNumber(config);
      setPreviewSerial(newSerial);
    } catch (error) {
      console.error('Error initializing serial config:', error);
      notify.error('Error initializing serial number configuration');
    }
  }, [notify]);

  // Update preview when configuration changes
  useEffect(() => {
    updatePreview();
    setIsModified(true);
  }, [customPrefix, customDigits, customSeparator]);

  const updatePreview = () => {
    try {
      const config = {
        prefix: customPrefix,
        randomDigits: customDigits,
        separator: customSeparator
      };
      const newSerial = generateSerialNumber(config);
      setPreviewSerial(newSerial);
    } catch (error) {
      console.error('Error updating preview:', error);
      setPreviewSerial('Invalid Config');
    }
  };

  const handlePresetChange = (presetName: string) => {
    try {
      setSelectedPreset(presetName);
      
      if (presetName === 'CUSTOM') {
        setIsModified(true);
        return;
      }
      
      const config = SERIAL_CONFIGS[presetName as keyof typeof SERIAL_CONFIGS];
      if (config) {
        setCustomPrefix(config.prefix);
        setCustomDigits(config.randomDigits);
        setCustomSeparator(config.separator || '');
        const newSerial = generateSerialNumber(config);
        setPreviewSerial(newSerial);
        setIsModified(false);
      }
    } catch (error) {
      console.error('Error changing preset:', error);
      notify.error('Error applying preset configuration');
    }
  };

  const generateNewPreview = () => {
    updatePreview();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewSerial);
      setCopied(true);
      notify.success('Serial number copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notify.error('Failed to copy to clipboard');
    }
  };

  const saveConfiguration = () => {
    try {
      // Here you would typically save to localStorage or send to backend
      const config = {
        prefix: customPrefix,
        randomDigits: customDigits,
        separator: customSeparator,
        preset: selectedPreset
      };
      
      localStorage.setItem('serialNumberConfig', JSON.stringify(config));
      setIsModified(false);
      notify.success('Serial number configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      notify.error('Failed to save configuration');
    }
  };

  const resetToDefault = () => {
    const config = SERIAL_CONFIGS.PACKAGE;
    setCustomPrefix(config.prefix);
    setCustomDigits(config.randomDigits);
    setCustomSeparator(config.separator || '');
    setSelectedPreset('PACKAGE');
    setIsModified(false);
    notify.info('Configuration reset to default');
  };

  const presetOptions = [
    { value: 'PACKAGE', label: 'Package (PKG1234)', example: 'PKG1234' },
    { value: 'LAUNDRY', label: 'Laundry (LAU-123)', example: 'LAU-123' },
    { value: 'ORDER', label: 'Order (ORD12345)', example: 'ORD12345' },
    { value: 'DELIVERY', label: 'Delivery (DEL-1234)', example: 'DEL-1234' },
    { value: 'CUSTOM', label: 'Custom Configuration', example: 'Custom' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Package Serial Number Configuration</h3>
            <p className="text-gray-600 text-sm mt-1">
              Configure how package serial numbers are generated for your orders
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveConfiguration}
            disabled={!isModified}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Preset Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Preset Configurations</h4>
            <div className="space-y-3">
              {presetOptions.map((preset) => (
                <label key={preset.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="preset"
                    value={preset.value}
                    checked={selectedPreset === preset.value}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{preset.label}</div>
                    {preset.example !== 'Custom' && (
                      <div className="text-xs text-gray-500 font-mono">{preset.example}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Configuration */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Custom Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix
                </label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PKG"
                />
                <p className="text-xs text-gray-500 mt-1">Max 5 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digits
                </label>
                <select
                  value={customDigits}
                  onChange={(e) => setCustomDigits(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 digit</option>
                  <option value={2}>2 digits</option>
                  <option value={3}>3 digits</option>
                  <option value={4}>4 digits</option>
                  <option value={5}>5 digits</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Separator
                </label>
                <input
                  type="text"
                  value={customSeparator}
                  onChange={(e) => setCustomSeparator(e.target.value)}
                  maxLength={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="- or _"
                />
                <p className="text-xs text-gray-500 mt-1">Optional</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-green-600" />
              Live Preview
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Serial Number
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={previewSerial}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-lg font-bold"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <button
                onClick={generateNewPreview}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate New Preview
              </button>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Configuration Summary</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Preset:</span>
                <span className="font-medium">{selectedPreset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prefix:</span>
                <span className="font-mono font-medium">{customPrefix}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Random Digits:</span>
                <span className="font-medium">{customDigits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Separator:</span>
                <span className="font-mono font-medium">{customSeparator || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-mono font-medium">
                  {customPrefix}{customSeparator}{'X'.repeat(customDigits)}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Usage Examples</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Package 1:</span>
                <span className="font-mono">{generateSerialNumber({ prefix: customPrefix, randomDigits: customDigits, separator: customSeparator })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Package 2:</span>
                <span className="font-mono">{generateSerialNumber({ prefix: customPrefix, randomDigits: customDigits, separator: customSeparator })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Package 3:</span>
                <span className="font-mono">{generateSerialNumber({ prefix: customPrefix, randomDigits: customDigits, separator: customSeparator })}</span>
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

export default SerialNumberSettings;