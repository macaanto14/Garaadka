import React, { useState, useEffect } from 'react';
import { Package, User, Calendar, DollarSign, Filter, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../store';
import { useToast } from '../../hooks/useToast';
import { registerAPI } from '../../services/api';

interface RegisterRecord {
  id: number;
  name: string;
  customer_name?: string;
  phone: string;
  email?: string;
  laundry_items?: any;
  drop_off_date?: string;
  pickup_date?: string;
  delivery_status: 'pending' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const RegisterList: React.FC = () => {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [records, setRecords] = useState<RegisterRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const fetchRecords = async (page: number = 1, status: string = 'all') => {
    setIsLoading(true);
    try {
      const response = await registerAPI.getAll(page, 10, status === 'all' ? undefined : status);
      setRecords(response.records || []);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Fetch records error:', error);
      notify.apiError(error.response?.status || 500, error.response?.data?.error || error.message);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  const handleStatusUpdate = async (recordId: number, newStatus: string, notes?: string) => {
    setUpdatingStatus(recordId);
    try {
      await registerAPI.updateStatus(recordId, newStatus, notes);
      
      // Refresh the current page
      await fetchRecords(currentPage, statusFilter);
      
      notify.success('Status updated successfully! ✅', {
        position: 'top-right'
      });
    } catch (error: any) {
      console.error('Status update error:', error);
      notify.apiError(error.response?.status || 500, error.response?.data?.error || error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{t('register.filterByStatus')}</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('register.allStatuses')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="ready">{t('status.ready')}</option>
              <option value="delivered">{t('status.delivered')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
            </select>
          </div>
          
          {pagination && (
            <div className="text-sm text-gray-600">
              {t('register.showingRecords')} {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t('common.of')} {pagination.total}
            </div>
          )}
        </div>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('register.noRecordsFound')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.customer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.dropOffDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('register.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.customer_name || record.name}
                          </div>
                          {record.receipt_number && (
                            <div className="text-sm text-gray-500">
                              #{record.receipt_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.phone}</div>
                      {record.email && (
                        <div className="text-sm text-gray-500">{record.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {record.drop_off_date ? formatDate(record.drop_off_date) : formatDate(record.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(record.total_amount)}
                          </div>
                          {record.balance > 0 && (
                            <div className="text-sm text-red-600">
                              Balance: {formatCurrency(record.balance)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.delivery_status)}`}>
                        {getStatusIcon(record.delivery_status)}
                        <span className="ml-1 capitalize">
                          {t(`status.${record.delivery_status}`) || record.delivery_status}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={record.delivery_status}
                        onChange={(e) => handleStatusUpdate(record.id, e.target.value)}
                        disabled={updatingStatus === record.id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="pending">{t('status.pending') || 'Pending'}</option>
                        <option value="ready">{t('status.ready') || 'Ready'}</option>
                        <option value="delivered">{t('status.delivered') || 'Delivered'}</option>
                        <option value="cancelled">{t('status.cancelled') || 'Cancelled'}</option>
                      </select>
                      {updatingStatus === record.id && (
                        <div className="inline-block ml-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              {t('register.showingRecords')} <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> {t('common.to')} <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> {t('common.of')} <span className="font-medium">{pagination.total}</span> {t('register.results')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={!pagination.has_prev}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-700">
              {t('common.page')} {pagination.current_page} {t('common.of')} {pagination.total_pages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterList;