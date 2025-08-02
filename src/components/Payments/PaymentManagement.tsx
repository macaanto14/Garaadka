import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, CreditCard, Calendar, TrendingUp, Download, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from '../../store';
import { formatCurrency } from '../../utils/currency';
import { paymentsAPI, ordersAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import PaymentRecordModal from './PaymentRecordModal';
import PaymentDetailsModal from './PaymentDetailsModal';

interface Payment {
  payment_id: number;
  order_id: number;
  order_number?: string;
  customer_name: string;
  phone_number?: string;
  amount: number;
  payment_method: 'cash' | 'ebirr' | 'cbe' | 'bank_transfer';
  reference_number?: string;
  notes?: string;
  payment_date: string;
  processed_by: string;
  created_at: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  cashPayments: number;
  ebirrPayments: number;
  cbePayments: number;
  bankTransferPayments: number;
  todayPayments: number;
}

const PaymentManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getAll();
      // Handle the API response structure: { payments: [...], pagination: {...} }
      const paymentsData = response.payments || response || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
      setPayments([]); // Ensure payments is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await paymentsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      cash: <DollarSign className="h-4 w-4" />,
      ebirr: <div className="h-4 w-4 bg-blue-500 rounded-full" />,
      cbe: <div className="h-4 w-4 bg-green-500 rounded-sm" />,
      bank_transfer: <CreditCard className="h-4 w-4" />
    };
    return icons[method] || <DollarSign className="h-4 w-4" />;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      ebirr: 'E-Birr',
      cbe: 'CBE',
      bank_transfer: 'Bank Transfer'
    };
    return labels[method] || method;
  };

  // Add safety check to ensure payments is always an array
  const filteredPayments = (Array.isArray(payments) ? payments : []).filter(payment => {
    const matchesSearch = payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.phone_number?.includes(searchTerm);
    const matchesMethod = selectedMethod === 'all' || payment.payment_method === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const handlePaymentRecorded = () => {
    loadPayments();
    loadStats();
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPayment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Payments</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.todayPayments || 0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.totalPayments || 0}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Cash Payments</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.cashPayments || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="ebirr">E-Birr</option>
              <option value="cbe">CBE</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsRecordModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Payment ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Reference</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span className="font-medium text-blue-600">#{payment.payment_id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">#{payment.order_number || payment.order_id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.customer_name}</p>
                      {payment.phone_number && (
                        <p className="text-sm text-gray-600">{payment.phone_number}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(payment.payment_method)}
                      <span className="text-gray-700">{getMethodLabel(payment.payment_method)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{new Date(payment.created_at).toLocaleDateString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600 text-sm">{payment.reference_number || '-'}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Record Modal */}
      <PaymentRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        payment={selectedPayment}
      />
    </div>
  );
};

export default PaymentManagement;