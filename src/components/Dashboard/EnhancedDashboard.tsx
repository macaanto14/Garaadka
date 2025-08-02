import React, { useEffect } from 'react';
import { Package, Users, DollarSign, Clock, RefreshCw, Download } from 'lucide-react';
import { useDataManager } from '../../store/hooks/useDataManager';
import { useUI, useSettings } from '../../store';
import StatCard from './StatCard';

const EnhancedDashboard: React.FC = () => {
  const { language } = useSettings();
  const { isLoading } = useUI();
  const {
    stats,
    orders,
    customers,
    payments,
    loadStats,
    refreshAll,
    forceRefresh,
    exportData,
    isOnline,
    lastSync,
    manualSync,
  } = useDataManager();

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExportAll = () => {
    exportData('all');
  };

  const formatLastSync = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header with sync status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'en' ? 'Dashboard' : 'Shabakada'}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Last sync: {formatLastSync(lastSync)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={manualSync}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync</span>
          </button>
          
          <button
            onClick={forceRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExportAll}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={language === 'en' ? 'Total Orders' : 'Wadarta Dalabka'}
          value={stats?.totalOrders || orders.length}
          icon={Package}
          color="blue"
          loading={isLoading('stats') || isLoading('orders')}
        />
        
        <StatCard
          title={language === 'en' ? 'Active Customers' : 'Macaamiisha Firfircoon'}
          value={stats?.activeCustomers || customers.length}
          icon={Users}
          color="green"
          loading={isLoading('stats') || isLoading('customers')}
        />
        
        <StatCard
          title={language === 'en' ? 'Monthly Revenue' : 'Dakhliga Bishii'}
          value={`$${stats?.monthlyRevenue || 0}`}
          icon={DollarSign}
          color="yellow"
          loading={isLoading('stats') || isLoading('payments')}
        />
        
        <StatCard
          title={language === 'en' ? 'Pending Orders' : 'Dalabka Sugaya'}
          value={stats?.pendingOrders || 0}
          icon={Clock}
          color="red"
          loading={isLoading('stats')}
        />
      </div>

      {/* Real-time data indicators */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {language === 'en' ? 'Data Overview' : 'Dulmar Guud'}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-gray-500">Orders in Store</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{customers.length}</div>
            <div className="text-sm text-gray-500">Customers in Store</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{payments.length}</div>
            <div className="text-sm text-gray-500">Payments in Store</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(useUI().loading).filter(key => useUI().loading[key]).length}
            </div>
            <div className="text-sm text-gray-500">Active Operations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;