import React, { useState } from 'react';
import { Search, Phone, Calendar, Package, DollarSign, User, FileText, Receipt, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotify } from '../../hooks/useNotify';
import { registerAPI } from '../../services/api';

interface LaundryItem {
  type: string;
  quantity: number;
  price: number;
}

interface RegisterRecord {
  id: number;
  phone: string;
  customer_name: string;
  laundry_items: LaundryItem[];
  drop_off_date: string;
  pickup_date: string | null;
  delivery_status: 'pending' | 'in_progress' | 'ready' | 'delivered';
  total_amount: number;
  paid_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string | null;
  receipt_number: string;
  created_at: string;
  updated_at: string;
}

const RegisterSearch: React.FC = () => {
  const { t } = useLanguage();
  const notify = useNotify();
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<RegisterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      notify.warning(t('register.enterPhoneNumber'));
      return;
    }

    setIsLoading(true);
    try {
      const results = await registerAPI.searchByPhone(searchPhone.trim());
      setSearchResults(results);
      setHasSearched(true);
      
      if (results.length === 0) {
        notify.info(t('register.noRecordsFound'));
      } else {
        notify.success(t('register.foundRecords'), `Found ${results.length} records`);
      }
    } catch (error) {
      console.error('Search error:', error);
      notify.error(t('register.searchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (recordId: number, newStatus: string) => {
    try {
      await registerAPI.updateDeliveryStatus(recordId, newStatus);
      notify.success(t('register.statusUpdated'));
      
      // Update the local state
      setSearchResults(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, delivery_status: newStatus as any }
            : record
        )
      );
    } catch (error) {
      console.error('Status update error:', error);
      notify.error(t('register.statusUpdateError'));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <Truck className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2 text-blue-600" />
          {t('register.phoneNumber')}
        </h2>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder={t('register.phoneNumberPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {t('common.search')}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('register.searchResults')} ({searchResults.length})
            </h3>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('register.noRecordsFound')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{record.customer_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{record.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Receipt className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{record.receipt_number}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(record.delivery_status)}`}>
                          {getStatusIcon(record.delivery_status)}
                          <span>{t(`register.status.${record.delivery_status}`) || record.delivery_status}</span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{t('register.dropOffDate')}: {formatDate(record.drop_off_date)}</span>
                        </div>
                        {record.pickup_date && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{t('register.pickupDate')}: {formatDate(record.pickup_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Laundry Items */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{t('register.laundryItems')}:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                          {record.laundry_items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                              {item.type} × {item.quantity} - {formatCurrency(item.price)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {t('register.totalAmount')}: <span className="font-medium">{formatCurrency(record.total_amount)}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">
                            Paid: <span className="font-medium">{formatCurrency(record.paid_amount)}</span>
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          record.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : record.payment_status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t(`status.${record.payment_status}`) || record.payment_status}
                        </div>
                      </div>

                      {/* Notes */}
                      {record.notes && (
                        <div className="flex items-start space-x-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600">{record.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Update */}
                    {record.delivery_status !== 'delivered' && (
                      <div className="ml-4">
                        <select
                          value={record.delivery_status}
                          onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pending">{t('status.pending')}</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready">{t('status.ready')}</option>
                          <option value="delivered">{t('status.delivered')}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterSearch;