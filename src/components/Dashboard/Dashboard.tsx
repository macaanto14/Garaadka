import React from 'react';
import { ShoppingBag, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import StatCard from './StatCard';
import { useLanguage } from '../../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      title: t('dashboard.stats.totalOrders'),
      value: '1,247',
      icon: ShoppingBag,
      trend: { value: 12, isPositive: true },
      color: 'blue' as const
    },
    {
      title: t('dashboard.stats.activeCustomers'),
      value: '842',
      icon: Users,
      trend: { value: 8, isPositive: true },
      color: 'green' as const
    },
    {
      title: t('dashboard.stats.monthlyRevenue'),
      value: '$24,560',
      icon: DollarSign,
      trend: { value: 15, isPositive: true },
      color: 'orange' as const
    },
    {
      title: t('dashboard.stats.pendingOrders'),
      value: '38',
      icon: Clock,
      trend: { value: 5, isPositive: false },
      color: 'purple' as const
    }
  ];

  const recentOrders = [
    { id: '1201', customer: 'Ahmed Hassan', items: 'Shirts, Pants', status: 'ready', amount: '$45' },
    { id: '1202', customer: 'Fatima Ali', items: 'Dresses, Blouses', status: 'washing', amount: '$78' },
    { id: '1203', customer: 'Mohamed Omar', items: 'Suits, Ties', status: 'delivered', amount: '$120' },
    { id: '1204', customer: 'Sahra Ahmed', items: 'Curtains, Bedsheets', status: 'received', amount: '$65' },
    { id: '1205', customer: 'Yusuf Abdi', items: 'Jackets, Coats', status: 'drying', amount: '$95' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      washing: 'bg-yellow-100 text-yellow-800',
      drying: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      received: t('status.received'),
      washing: t('status.washing'),
      drying: t('status.drying'),
      ready: t('status.ready'),
      delivered: t('status.delivered')
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentOrders')}</h3>
            <p className="text-gray-600 text-sm">{t('dashboard.recentOrders.subtitle')}</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium">
                        {order.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.customer}</p>
                        <p className="text-gray-600 text-sm">#{order.id} • {order.items}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="font-semibold text-gray-900">{order.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h3>
            <p className="text-gray-600 text-sm">{t('dashboard.quickActions.subtitle')}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 text-left">
                <ShoppingBag className="h-8 w-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.actions.newOrder')}</p>
                <p className="text-gray-600 text-sm">{t('dashboard.actions.newOrder.desc')}</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 text-left">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.actions.addCustomer')}</p>
                <p className="text-gray-600 text-sm">{t('dashboard.actions.addCustomer.desc')}</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200 text-left">
                <DollarSign className="h-8 w-8 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.actions.processPayment')}</p>
                <p className="text-gray-600 text-sm">{t('dashboard.actions.processPayment.desc')}</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 text-left">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">{t('dashboard.actions.viewReports')}</p>
                <p className="text-gray-600 text-sm">{t('dashboard.actions.viewReports.desc')}</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;