import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut,
  Shirt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
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
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;