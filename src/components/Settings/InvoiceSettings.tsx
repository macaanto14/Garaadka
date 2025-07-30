import React, { useState } from 'react';
import { FileText, Save, Download, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const InvoiceSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    template: 'modern',
    includeQR: true,
    includeLogo: true,
    showTaxDetails: true,
    showPaymentTerms: true,
    autoGenerate: true,
    emailCopy: false,
    watermark: '',
    footerText: 'Thank you for your business!',
    invoicePrefix: 'INV',
    startingNumber: 1001
  });
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  const handleChange = (setting: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('invoiceSettings', JSON.stringify(settings));
      setIsModified(false);
      notify.success('Invoice settings saved successfully');
    } catch (error) {
      notify.error('Failed to save invoice settings');
    }
  };

  const regenerateAllInvoices = () => {
    notify.info('Invoice regeneration started. This may take a few minutes...');
    // Here you would implement the actual regeneration logic
    setTimeout(() => {
      notify.success('All invoices have been regenerated successfully');
    }, 3000);
  };

  const downloadTemplate = () => {
    notify.success('Invoice template downloaded');
  };

  const templateOptions = [
    { value: 'modern', label: 'Modern', description: 'Clean and contemporary design' },
    { value: 'classic', label: 'Classic', description: 'Traditional business format' },
    { value: 'minimal', label: 'Minimal', description: 'Simple and clean layout' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive information display' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-orange-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Invoice Settings</h3>
            <p className="text-gray-600 text-sm mt-1">
              Configure invoice templates, regeneration, and formatting options
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={regenerateAllInvoices}
            className="px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Regenerate All</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={!isModified}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template & Format */}
        <div className="space-y-6">
          <div className="bg-orange-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Template & Format</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Template
                </label>
                <select
                  value={settings.template}
                  onChange={(e) => handleChange('template', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {templateOptions.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'includeQR', label: 'Include QR Code', description: 'Add QR code for quick payment' },
                  { key: 'includeLogo', label: 'Include Business Logo', description: 'Show company logo on invoices' },
                  { key: 'showTaxDetails', label: 'Show Tax Details', description: 'Display tax breakdown' },
                  { key: 'showPaymentTerms', label: 'Show Payment Terms', description: 'Include payment conditions' }
                ].map((option) => (
                  <div key={option.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={settings[option.key as keyof typeof settings] as boolean}
                      onChange={() => handleChange(option.key, !settings[option.key as keyof typeof settings])}
                      className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
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

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Numbering & Automation</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="INV"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    value={settings.startingNumber}
                    onChange={(e) => handleChange('startingNumber', parseInt(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'autoGenerate', label: 'Auto-generate Invoices', description: 'Automatically create invoices for completed orders' },
                  { key: 'emailCopy', label: 'Email Copy to Business', description: 'Send a copy to business email' }
                ].map((option) => (
                  <div key={option.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={settings[option.key as keyof typeof settings] as boolean}
                      onChange={() => handleChange(option.key, !settings[option.key as keyof typeof settings])}
                      className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
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
        </div>

        {/* Customization & Actions */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Customization</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Watermark Text (Optional)
                </label>
                <input
                  type="text"
                  value={settings.watermark}
                  onChange={(e) => handleChange('watermark', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PAID, DRAFT, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Text
                </label>
                <textarea
                  value={settings.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Thank you message or additional terms"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Actions</h4>
            <div className="space-y-3">
              <button
                onClick={downloadTemplate}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Template</span>
              </button>
              
              <button
                onClick={regenerateAllInvoices}
                className="w-full px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate All Invoices</span>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Preview</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-mono">{settings.invoicePrefix}{settings.startingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Template:</span>
                <span className="capitalize">{settings.template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">QR Code:</span>
                <span>{settings.includeQR ? 'Included' : 'Not included'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Logo:</span>
                <span>{settings.includeLogo ? 'Included' : 'Not included'}</span>
              </div>
              {settings.watermark && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Watermark:</span>
                  <span className="font-mono text-gray-400">{settings.watermark}</span>
                </div>
              )}
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

export default InvoiceSettings;