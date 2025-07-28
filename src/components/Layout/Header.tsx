import React from 'react';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      orders: 'Order Management',
      customers: 'Customer Management',
      payments: 'Payment Tracking',
      audit: 'Audit Logs',
      settings: 'Settings'
    };
    return titles[tab] || 'Dashboard';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{getPageTitle(activeTab)}</h2>
          <p className="text-gray-600 text-sm">Manage your laundry operations efficiently</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 text-xs flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;