import React, { useState } from 'react';
import { Building, Save, Upload, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const BusinessSettings: React.FC = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    logo: null as File | null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const { notify } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        notify.error('Logo file size must be less than 5MB');
        return;
      }
      
      setBusinessInfo(prev => ({ ...prev, logo: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setIsModified(true);
    }
  };

  const removeLogo = () => {
    setBusinessInfo(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
    setIsModified(true);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('businessSettings', JSON.stringify(businessInfo));
      setIsModified(false);
      notify.success('Business settings saved successfully');
    } catch (error) {
      notify.error('Failed to save business settings');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Building className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Business Information</h3>
            <p className="text-gray-600 text-sm mt-1">
              Configure your business details for invoices and receipts
            </p>
          </div>
        </div>
        <button
          onClick={saveSettings}
          disabled={!isModified}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Details */}
        <div className="space-y-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Company Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your Business Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  value={businessInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Street Address, City, State, ZIP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="business@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={businessInfo.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://www.example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID / Registration Number
                </label>
                <input
                  type="text"
                  value={businessInfo.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tax ID or Business Registration Number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Business Logo</h4>
            
            {logoPreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Business Logo Preview"
                    className="w-full max-w-xs h-32 object-contain bg-white border border-gray-300 rounded-lg p-4"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Change Logo
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload your business logo</p>
                <button
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Choose File
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG up to 5MB. Recommended: 300x100px
                </p>
              </div>
            )}
            
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Preview</h4>
            <div className="bg-white p-4 rounded border text-sm">
              {logoPreview && (
                <img src={logoPreview} alt="Logo" className="h-12 mb-3" />
              )}
              <div className="font-bold text-lg">{businessInfo.name || 'Your Business Name'}</div>
              {businessInfo.address && (
                <div className="text-gray-600 mt-1">{businessInfo.address}</div>
              )}
              <div className="flex space-x-4 mt-2 text-gray-600">
                {businessInfo.phone && <span>{businessInfo.phone}</span>}
                {businessInfo.email && <span>{businessInfo.email}</span>}
              </div>
              {businessInfo.website && (
                <div className="text-blue-600 mt-1">{businessInfo.website}</div>
              )}
              {businessInfo.taxId && (
                <div className="text-gray-500 text-xs mt-2">Tax ID: {businessInfo.taxId}</div>
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

export default BusinessSettings;