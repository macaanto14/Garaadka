import React, { useState } from 'react';
import { Plus, Users, CreditCard, FileText, Package, DollarSign, Clock, CheckCircle } from 'lucide-react';
import StatCard from './StatCard';
import CustomerSearch from './CustomerSearch';
import RecentOrders from './RecentOrders';
import { useTranslation, useLanguage, useUI } from '../../store';
import NewOrderForm from '../Orders/NewOrderForm';
import CustomerRegistration from '../Customers/CustomerRegistration';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage();
  const { navigateTo } = useUI();
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showCustomerRegistration, setShowCustomerRegistration] = useState(false);

  const stats = [
    {
      title: language === 'so' ? 'Tirada Dalabka' : 'Total Orders',
      value: '156',
      icon: Package,
      color: 'blue',
      change: '+12%'
    },
    {
      title: language === 'so' ? 'Dakhliga Bisha' : 'Monthly Revenue',
      value: 'ETB 12,450',
      icon: DollarSign,
      color: 'green',
      change: '+8%'
    },
    {
      title: language === 'so' ? 'Dalabka Sugaya' : 'Pending Orders',
      value: '23',
      icon: Clock,
      color: 'yellow',
      change: '-5%'
    },
    {
      title: language === 'so' ? 'Dalabka Diyaar' : 'Ready Orders',
      value: '8',
      icon: CheckCircle,
      color: 'purple',
      change: '+15%'
    }
  ];

  const handleNewOrder = () => {
    setShowNewOrderForm(true);
  };

  const handleAddCustomer = () => {
    setShowCustomerRegistration(true);
  };

  const handleProcessPayment = () => {
    navigateTo('payments');
  };

  const handleViewReports = () => {
    // For now, navigate to orders as reports aren't implemented yet
    navigateTo('orders');
  };

  const handleNewOrderSuccess = () => {
    setShowNewOrderForm(false);
    // Optionally refresh dashboard data or show success message
  };

  const handleCustomerRegistrationSuccess = () => {
    setShowCustomerRegistration(false);
    // Optionally refresh dashboard data or show success message
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
    <>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Customer Search */}
        <CustomerSearch />

        {/* Recent Orders */}
        <RecentOrders limit={10} />

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            {language === 'so' ? 'Ficillada Degdega' : 'Quick Actions'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={handleNewOrder}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">
                {language === 'so' ? 'Dalab Cusub' : 'New Order'}
              </span>
            </button>
            <button 
              onClick={handleAddCustomer}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">
                {language === 'so' ? 'Macmiil Cusub' : 'Add Customer'}
              </span>
            </button>
            <button 
              onClick={handleProcessPayment}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">
                {language === 'so' ? 'Lacag Bixinta' : 'Process Payment'}
              </span>
            </button>
            <button 
              onClick={handleViewReports}
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">
                {language === 'so' ? 'Warbixinta' : 'View Reports'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewOrderForm && (
        <NewOrderForm
          isOpen={showNewOrderForm}
          onClose={() => setShowNewOrderForm(false)}
          onSuccess={handleNewOrderSuccess}
        />
      )}

      {showCustomerRegistration && (
        <CustomerRegistration
          isOpen={showCustomerRegistration}
          onClose={() => setShowCustomerRegistration(false)}
          onSuccess={handleCustomerRegistrationSuccess}
        />
      )}
    </>
  );
};

export default Dashboard;