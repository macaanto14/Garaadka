import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { useTranslation } from '../../store';
import { useToast } from '../../hooks/useToast';
import { registerAPI } from '../../services/api';
import RegisterSearch from './RegisterSearch';
import RegisterList from './RegisterList';

interface RegisterStats {
  totalRecords: number;
  pendingDeliveries: number;
  readyForPickup: number;
  deliveredToday: number;
  totalRevenue: number;
  pendingPayments: number;
}

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { notify } = useToast();
  
  const [activeTab, setActiveTab] = useState<'search' | 'list' | 'analytics'>('search');
  const [stats, setStats] = useState<RegisterStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await registerAPI.getStats();
      setStats({
        totalRecords: response.totalRecords || 0,
        pendingDeliveries: response.pendingDeliveries || 0,
        readyForPickup: response.readyForPickup || 0,
        deliveredToday: response.deliveredToday || 0,
        totalRevenue: response.totalRevenue || 0,
        pendingPayments: response.pendingPayments || 0,
      });
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Error fetching register stats:', error);
      notify.error('Failed to load register statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats();
  };

  const handleExportData = () => {
    // Export register data as JSON
    const exportData = {
      stats,
      exportDate: new Date().toISOString(),
      exportType: 'register_data'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `register-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return <RegisterSearch />;
      case 'list':
        return <RegisterList />;
      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register Analytics</h3>
              
              {/* Status Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Pending Deliveries</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats?.pendingDeliveries || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Ready for Pickup</p>
                      <p className="text-2xl font-bold text-blue-900">{stats?.readyForPickup || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 text-sm font-medium">Delivered Today</p>
                      <p className="text-2xl font-bold text-green-900">{stats?.deliveredToday || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-800 text-sm font-medium">Total Records</p>
                      <p className="text-2xl font-bold text-purple-900">{stats?.totalRecords || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Revenue Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Revenue</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Payments</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(stats?.pendingPayments || 0)}</p>
                    </div>
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('search')}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Search className="h-5 w-5" />
                  <span>Search Records</span>
                </button>

                <button
                  onClick={() => setActiveTab('list')}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span>View All Records</span>
                </button>

                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center space-x-2 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <RegisterSearch />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Register Management</h1>
          <p className="text-gray-600 mt-1">
            Manage customer records, deliveries, and tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Records</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRecords}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Deliveries</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingDeliveries}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ready for Pickup</p>
                <p className="text-3xl font-bold text-green-600">{stats.readyForPickup}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Delivered Today</p>
                <p className="text-3xl font-bold text-purple-600">{stats.deliveredToday}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Search Records</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>All Records</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
};

export default RegisterPage;