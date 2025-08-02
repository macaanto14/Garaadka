import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Bell, 
  Clock, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Users, 
  Calendar,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';
import { useTranslation } from '../../store';
import { useToast } from '../../hooks/useToast';
import { ordersAPI, paymentsAPI, registerAPI, auditAPI } from '../../services/api';

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    ready: number;
    delivered: number;
    todayOrders: number;
    weeklyOrders: number;
    monthlyRevenue: number;
  };
  payments: {
    totalRevenue: number;
    totalPayments: number;
    todayRevenue: number;
    todayPayments: number;
    outstandingAmount: number;
    outstandingOrders: number;
    paymentMethods: Array<{ method: string; count: number; total_amount: number }>;
  };
  register: {
    totalRecords: number;
    pendingDeliveries: number;
    readyForPickup: number;
    deliveredToday: number;
  };
  audit: {
    totalLogs: number;
    todayLogs: number;
    activeUsers: number;
  };
}

interface RecentOrder {
  itemNum: number;
  name: string;
  customer_name?: string;
  mobnum: number;
  duedate: string;
  deliverdate: string;
  status: string;
  payCheck: string;
  totalAmount: number;
}

interface Notification {
  id: string;
  type: 'overdue' | 'reminder' | 'delivery' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

const InteractiveDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { notify } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [todayDeliveries, setTodayDeliveries] = useState<RecentOrder[]>([]);
  const [overdueOrders, setOverdueOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Chart data states
  const [chartData, setChartData] = useState({
    ordersByStatus: [] as Array<{ status: string; count: number }>,
    revenueByMonth: [] as Array<{ month: string; revenue: number }>,
    paymentMethods: [] as Array<{ method: string; amount: number }>,
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [ordersStats, paymentsStats, registerStats, auditStats, ordersData] = await Promise.all([
        ordersAPI.getStats(),
        paymentsAPI.getStats(),
        registerAPI.getStats(),
        auditAPI.getStats(),
        ordersAPI.getAll({ limit: 10, sort_by: 'order_id', sort_order: 'DESC' })
      ]);

      // Combine all stats
      const combinedStats: DashboardStats = {
        orders: {
          total: ordersStats.totalOrders || 0,
          pending: ordersStats.pendingOrders || 0,
          ready: ordersStats.readyOrders || 0,
          delivered: ordersStats.deliveredOrders || 0,
          todayOrders: ordersStats.todayOrders || 0,
          weeklyOrders: ordersStats.weeklyOrders || 0,
          monthlyRevenue: ordersStats.monthlyRevenue || 0,
        },
        payments: paymentsStats,
        register: {
          totalRecords: registerStats.totalRecords || 0,
          pendingDeliveries: registerStats.pendingDeliveries || 0,
          readyForPickup: registerStats.readyForPickup || 0,
          deliveredToday: registerStats.deliveredToday || 0,
        },
        audit: {
          totalLogs: auditStats.total_logs || 0,
          todayLogs: auditStats.today_logs || 0,
          activeUsers: auditStats.user_stats?.length || 0,
        }
      };

      setStats(combinedStats);
      setRecentOrders(ordersData.orders || []);

      // Generate chart data
      setChartData({
        ordersByStatus: [
          { status: 'Pending', count: combinedStats.orders.pending },
          { status: 'Ready', count: combinedStats.orders.ready },
          { status: 'Delivered', count: combinedStats.orders.delivered },
        ],
        revenueByMonth: generateMonthlyRevenue(combinedStats.orders.monthlyRevenue),
        paymentMethods: combinedStats.payments.paymentMethods || [],
      });

      // Generate notifications and alerts
      generateNotifications(combinedStats, ordersData.orders || []);
      
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      notify.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyRevenue = (monthlyRevenue: number) => {
    // Generate sample monthly data (in real app, this would come from API)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      revenue: monthlyRevenue * (0.7 + Math.random() * 0.6) // Sample variation
    }));
  };

  const generateNotifications = (stats: any, orders: any[]) => {
    const notifications: Notification[] = [];
    
    // Outstanding payments notification
    const outstandingAmount = Number(stats?.payments?.outstandingAmount) || 0;
    if (outstandingAmount > 0) {
      notifications.push({
        id: 'outstanding-payments',
        type: 'payment',
        priority: 'medium',
        title: 'Outstanding Payments',
        message: `${formatCurrency(outstandingAmount)} in outstanding payments need attention`,
        timestamp: new Date().toISOString()
      });
    }

    // Overdue orders notification
    const overdueCount = orders.filter(order => 
      new Date(order.duedate) < new Date() && order.status !== 'delivered'
    ).length;
    
    if (overdueCount > 0) {
      notifications.push({
        id: 'overdue-orders',
        type: 'overdue',
        priority: 'high',
        title: 'Overdue Orders',
        message: `${overdueCount} orders are overdue and need immediate attention`,
        timestamp: new Date().toISOString()
      });
    }

    // Today's deliveries notification
    const todayDeliveries = orders.filter(order => {
      const dueDate = new Date(order.duedate);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString() && 
             (order.status === 'ready' || order.status === 'pending');
    });

    if (todayDeliveries.length > 0) {
      notifications.push({
        id: 'today-deliveries',
        type: 'delivery',
        priority: 'medium',
        title: 'Today\'s Deliveries',
        message: `${todayDeliveries.length} orders scheduled for delivery today`,
        timestamp: new Date().toISOString()
      });
    }

    // Low inventory or high pending orders
    const pendingCount = stats?.orders?.pending || 0;
    if (pendingCount > 10) {
      notifications.push({
        id: 'high-pending',
        type: 'overdue',
        priority: 'medium',
        title: 'High Pending Orders',
        message: `${pendingCount} orders are pending processing`,
        timestamp: new Date().toISOString()
      });
    }

    return notifications;
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExportData = () => {
    // Export dashboard data as JSON
    const exportData = {
      stats,
      recentOrders,
      notifications,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'ready': return 'text-blue-600 bg-blue-100';
      case 'washing': case 'drying': return 'text-yellow-600 bg-yellow-100';
      case 'received': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string | null | undefined) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    switch (status.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.orders.total || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats?.orders.todayOrders || 0} today
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats?.payments.totalRevenue || 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{formatCurrency(stats?.payments.todayRevenue || 0)} today
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.orders.pending || 0}</p>
              <p className="text-xs text-gray-600 mt-1">
                {stats?.orders.ready || 0} ready for pickup
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.audit.activeUsers || 0}</p>
              <p className="text-xs text-gray-600 mt-1">
                {stats?.audit.todayLogs || 0} actions today
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Orders by Status</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {chartData.ordersByStatus.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-24 h-2 rounded-full bg-gray-200 overflow-hidden`}>
                    <div 
                      className={`h-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.max(10, (item.count / (stats?.orders.total || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {chartData.paymentMethods.slice(0, 4).map((method, index) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 
                    index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700 capitalize">{method.method}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{method.count}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(method.total_amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications and Alerts */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Notifications & Alerts</h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  notification.priority === 'high' ? 'border-red-500 bg-red-50' :
                  notification.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {notification.type === 'overdue' && <AlertTriangle key="overdue-icon" className="h-5 w-5 text-red-600 mt-0.5" />}
                    {notification.type === 'delivery' && <Truck key="delivery-icon" className="h-5 w-5 text-blue-600 mt-0.5" />}
                    {notification.type === 'payment' && <DollarSign key="payment-icon" className="h-5 w-5 text-yellow-600 mt-0.5" />}
                    <div>
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Deliveries and Overdue Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Deliveries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Deliveries</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {todayDeliveries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No deliveries scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayDeliveries.slice(0, 5).map((order) => (
                <div key={order.itemNum} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{order.itemNum}</p>
                    <p className="text-sm text-gray-600">{order.customer_name || order.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Orders</h3>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          {overdueOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No overdue orders</p>
          ) : (
            <div className="space-y-3">
              {overdueOrders.slice(0, 5).map((order) => (
                <div key={order.itemNum} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">#{order.itemNum}</p>
                    <p className="text-sm text-gray-600">{order.customer_name || order.name}</p>
                    <p className="text-xs text-red-600">Due: {formatDate(order.duedate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payCheck)}`}>
                      {order.payCheck}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Latest Orders</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Order #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Payment</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 8).map((order) => (
                <tr key={order.itemNum} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">#{order.itemNum}</td>
                  <td className="py-3 px-4 text-gray-900">{order.customer_name || order.name}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(order.duedate)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payCheck)}`}>
                      {order.payCheck}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;