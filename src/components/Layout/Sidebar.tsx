import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut,
  Shirt,
  Database,
  DollarSign
} from 'lucide-react';
import { useAuth, useTranslation, useUI } from '../../store';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useUI();

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingBag },
    { id: 'customers', label: t('nav.customers'), icon: Users },
    { id: 'register', label: t('nav.register'), icon: Database },
    { id: 'payments', label: t('nav.payments'), icon: CreditCard },
    { id: 'cashManagement', label: t('nav.cashManagement'), icon: DollarSign },
    { id: 'audit', label: t('nav.audit'), icon: FileText },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shirt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Garaad wil waal</h1>
            <p className="text-blue-200 text-sm">Laundry Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-200 hover:bg-blue-700 ${
              activeTab === item.id ? 'bg-blue-700 border-r-4 border-blue-300' : ''
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-blue-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-full">
            <div className="h-6 w-6 bg-blue-300 rounded-full flex items-center justify-center">
              <span className="text-blue-900 text-sm font-bold">
                {user?.fname.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium">{user?.fname}</p>
            <p className="text-blue-200 text-sm capitalize">{user?.position}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-left text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;