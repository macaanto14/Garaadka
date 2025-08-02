import React, { useState } from 'react';
import { Search, Phone, Calendar, Package, DollarSign, User, FileText, Receipt, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../store';
import { useToast } from '../../hooks/useToast';
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
  name: string;
  laundry_items: LaundryItem[] | string;
  drop_off_date: string;
  pickup_date: string | null;
  delivery_status: 'pending' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string | null;
  receipt_number: string;
  created_at: string;
  updated_at: string;
}

const RegisterSearch: React.FC = () => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<RegisterRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      notify.warning(t('register.enterPhoneNumber') || 'Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerAPI.searchByPhone(searchPhone.trim());
      // Extract records array from the response object
      const results = response.records || [];
      setSearchResults(results);
      setHasSearched(true);
      
      if (results.length === 0) {
        notify.info(t('register.noRecordsFound') || 'No records found');
      } else {
        notify.success(`Found ${results.length} records 📋`, {
          position: 'top-right'
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchResults([]); // Set empty array on error
      setHasSearched(true);
      notify.apiError(error.response?.status || 500, error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (recordId: number, newStatus: string) => {
    try {
      await registerAPI.updateStatus(recordId, newStatus);
      notify.success('Status updated successfully! ✅', {
        position: 'top-right'
      });
      
      // Update the local state
      setSearchResults(prev => 
        prev.map(record => 
          record.id === recordId 
            ? { ...record, delivery_status: newStatus as any }
            : record
        )
      );
    } catch (error: any) {
      console.error('Status update error:', error);
      notify.apiError(error.response?.status || 500, error.response?.data?.error || error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <Truck className="w-4 h-4 text-gray-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
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

  const parseLaundryItems = (items: LaundryItem[] | string | null): LaundryItem[] => {
    if (!items) return [];
    
    try {
      if (typeof items === 'string') {
        return JSON.parse(items);
      }
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.error('Error parsing laundry items:', e);
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2 text-blue-600" />
          {t('register.searchByPhone')}
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
              {searchResults.map((record) => {
                const laundryItems = parseLaundryItems(record.laundry_items);
                
                return (
                  <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <User className="w-5 h-5 text-gray-400" />
                              <span className="font-semibold text-gray-900">
                                {record.customer_name || record.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{record.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record.delivery_status)}`}>
                              {getStatusIcon(record.delivery_status)}
                              <span className="ml-1 capitalize">
                                {t(`register.status.${record.delivery_status}`) || record.delivery_status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Receipt className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{record.receipt_number}</span>
                            </div>
                          </div>
                        </div>

                        {/* Laundry Items */}
                        {laundryItems.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Laundry Items
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {laundryItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">{item.type}</span>
                                  <span className="text-gray-500">
                                    {item.quantity}x @ {formatCurrency(item.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dates and Financial Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Drop-off</p>
                              <p className="text-sm text-gray-900">{formatDate(record.drop_off_date)}</p>
                            </div>
                          </div>
                          
                          {record.pickup_date && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Pickup</p>
                                <p className="text-sm text-gray-900">{formatDate(record.pickup_date)}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Total Amount</p>
                              <p className="text-sm font-semibold text-gray-900">{formatCurrency(record.total_amount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Balance</p>
                              <p className={`text-sm font-semibold ${record.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(record.balance)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {record.notes && (
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Notes</p>
                              <p className="text-sm text-gray-700">{record.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                          <span className="text-sm text-gray-600">Update Status:</span>
                          <select
                            value={record.delivery_status}
                            onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">{t('register.status.pending') || 'Pending'}</option>
                            <option value="ready">{t('register.status.ready') || 'Ready'}</option>
                            <option value="delivered">{t('register.status.delivered') || 'Delivered'}</option>
                            <option value="cancelled">{t('register.status.cancelled') || 'Cancelled'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterSearch;