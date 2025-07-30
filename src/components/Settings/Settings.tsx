import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Package, 
  Building, 
  Bell, 
  Palette, 
  FileText,
  Hash,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import SerialNumberSettings from './SerialNumberSettings';
import BusinessSettings from './BusinessSettings';
import NotificationSettings from './NotificationSettings';
import ThemeSettings from './ThemeSettings';
import InvoiceSettings from './InvoiceSettings';
import OrderIdSettings from './OrderIdSettings';

type SettingsTab = 
  | 'overview' 
  | 'serial-numbers' 
  | 'order-ids'
  | 'business' 
  | 'notifications' 
  | 'theme' 
  | 'invoices';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');
  const { t } = useLanguage();

  const settingsMenuItems = [
    {
      id: 'serial-numbers' as SettingsTab,
      title: 'Package Serial Numbers',
      description: 'Configure serial number generation for packages',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'order-ids' as SettingsTab,
      title: 'Order ID Customization',
      description: 'Customize order ID format and generation',
      icon: Hash,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'business' as SettingsTab,
      title: 'Business Information',
      description: 'Company details, logo, address, and contact info',
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'invoices' as SettingsTab,
      title: 'Invoice Settings',
      description: 'Invoice templates, regeneration, and formatting',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'notifications' as SettingsTab,
      title: 'Notification Settings',
      description: 'Configure alerts, reminders, and notifications',
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'theme' as SettingsTab,
      title: 'Theme & Appearance',
      description: 'Dark/light mode, colors, and UI preferences',
      icon: Palette,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'serial-numbers':
        return <SerialNumberSettings />;
      case 'order-ids':
        return <OrderIdSettings />;
      case 'business':
        return <BusinessSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'invoices':
        return <InvoiceSettings />;
      default:
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Settings</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Configure and customize your application settings. Select a category from the menu to get started.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settingsMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`${item.bgColor} ${item.borderColor} border-2 rounded-xl p-6 text-left hover:shadow-md transition-all duration-200 group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <IconComponent className={`h-6 w-6 ${item.color} mr-3`} />
                          <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {activeTab !== 'overview' && (
              <button
                onClick={() => setActiveTab('overview')}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <SettingsIcon className="h-7 w-7 mr-3 text-gray-700" />
                {activeTab === 'overview' ? 'Settings' : 
                 settingsMenuItems.find(item => item.id === activeTab)?.title || 'Settings'}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeTab === 'overview' ? 'Manage your application settings and preferences' :
                 settingsMenuItems.find(item => item.id === activeTab)?.description || ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings;