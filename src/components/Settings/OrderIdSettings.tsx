import React, { useState, useEffect } from 'react';
import { Hash, Save, RotateCcw, Eye, Copy, Check } from 'lucide-react';
import { generateOrderId } from '../../utils/serialNumber';
import { useToast } from '../../hooks/useToast';

const OrderIdSettings: React.FC = () => {
  const [orderIdFormat, setOrderIdFormat] = useState('number-suffix'); // 'number-suffix' or 'prefix-number'
  const [prefix, setPrefix] = useState('ORD');
  const [suffix, setSuffix] = useState('ORD');
  const [digitCount, setDigitCount] = useState(3);
  const [separator, setSeparator] = useState('');
  const [previewOrderId, setPreviewOrderId] = useState('123ORD');
  const [copied, setCopied] = useState(false);
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  // Initialize with default configuration
  useEffect(() => {
    updatePreview();
  }, [orderIdFormat, prefix, suffix, digitCount, separator]);

  const updatePreview = () => {
    try {
      let newOrderId = '';
      const randomNum = Math.floor(Math.random() * Math.pow(10, digitCount - 1)) + Math.pow(10, digitCount - 1);
      
      if (orderIdFormat === 'number-suffix') {
        newOrderId = `${randomNum}${separator}${suffix}`;
      } else {
        newOrderId = `${prefix}${separator}${randomNum}`;
      }
      
      setPreviewOrderId(newOrderId);
      setIsModified(true);
    } catch (error) {
      console.error('Error updating preview:', error);
      setPreviewOrderId('Invalid Config');
    }
  };

  const generateNewPreview = () => {
    updatePreview();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewOrderId);
      setCopied(true);
      notify.success('Order ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notify.error('Failed to copy to clipboard');
    }
  };

  const saveConfiguration = () => {
    try {
      const config = {
        format: orderIdFormat,
        prefix,
        suffix,
        digitCount,
        separator
      };
      
      localStorage.setItem('orderIdConfig', JSON.stringify(config));
      setIsModified(false);
      notify.success('Order ID configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      notify.error('Failed to save configuration');
    }
  };

  const resetToDefault = () => {
    setOrderIdFormat('number-suffix');
    setPrefix('ORD');
    setSuffix('ORD');
    setDigitCount(3);
    setSeparator('');
    setIsModified(false);
    notify.info('Configuration reset to default');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Hash className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Order ID Configuration</h3>
            <p className="text-gray-600 text-sm mt-1">
              Customize how order IDs are generated and formatted
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Order ID Format</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="number-suffix"
                  checked={orderIdFormat === 'number-suffix'}
                  onChange={(e) => setOrderIdFormat(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Number + Suffix</div>
                  <div className="text-xs text-gray-500 font-mono">123ORD, 456LAU</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="prefix-number"
                  checked={orderIdFormat === 'prefix-number'}
                  onChange={(e) => setOrderIdFormat(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Prefix + Number</div>
                  <div className="text-xs text-gray-500 font-mono">ORD123, LAU456</div>
                </div>
              </label>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Configuration Options</h4>
            <div className="space-y-4">
              {orderIdFormat === 'prefix-number' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ORD"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 5 characters</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ORD"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 5 characters</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Digits
                </label>
                <select
                  value={digitCount}
                  onChange={(e) => setDigitCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={2}>2 digits (10-99)</option>
                  <option value={3}>3 digits (100-999)</option>
                  <option value={4}>4 digits (1000-9999)</option>
                  <option value={5}>5 digits (10000-99999)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Separator (Optional)
                </label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  maxLength={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="- or _"
                />
                <p className="text-xs text-gray-500 mt-1">Optional separator character</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-600" />
              Live Preview
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Order ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={previewOrderId}
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
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">{orderIdFormat === 'number-suffix' ? 'Number + Suffix' : 'Prefix + Number'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{orderIdFormat === 'prefix-number' ? 'Prefix:' : 'Suffix:'}</span>
                <span className="font-mono font-medium">{orderIdFormat === 'prefix-number' ? prefix : suffix}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Digits:</span>
                <span className="font-medium">{digitCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Separator:</span>
                <span className="font-mono font-medium">{separator || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Usage Examples</h4>
            <div className="space-y-2 text-sm">
              {[1, 2, 3].map((i) => {
                const randomNum = Math.floor(Math.random() * Math.pow(10, digitCount - 1)) + Math.pow(10, digitCount - 1);
                const exampleId = orderIdFormat === 'number-suffix' 
                  ? `${randomNum}${separator}${suffix}`
                  : `${prefix}${separator}${randomNum}`;
                
                return (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600">Order {i}:</span>
                    <span className="font-mono">{exampleId}</span>
                  </div>
                );
              })}
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

export default OrderIdSettings;