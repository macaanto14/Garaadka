import React, { useState } from 'react';
import { Search, Filter, DollarSign, CreditCard, Calendar, TrendingUp, Download, Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Payment {
  id: number;
  orderId: number;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'bank';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference?: string;
}

const PaymentManagement: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  // Mock data
  const payments: Payment[] = [
    {
      id: 1,
      orderId: 1201,
      customerName: 'Ahmed Hassan',
      amount: 45,
      paymentMethod: 'cash',
      status: 'completed',
      date: '2024-01-15',
      reference: 'CASH-001'
    },
    {
      id: 2,
      orderId: 1202,
      customerName: 'Fatima Ali',
      amount: 78,
      paymentMethod: 'mobile',
      status: 'pending',
      date: '2024-01-16',
      reference: 'MOB-002'
    },
    {
      id: 3,
      orderId: 1203,
      customerName: 'Mohamed Omar',
      amount: 120,
      paymentMethod: 'card',
      status: 'completed',
      date: '2024-01-14',
      reference: 'CARD-003'
    }
  ];

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
      card: <CreditCard className="h-4 w-4" />,
      mobile: <div className="h-4 w-4 bg-blue-500 rounded-full" />,
      bank: <div className="h-4 w-4 bg-green-500 rounded-sm" />
    };
    return icons[method] || <DollarSign className="h-4 w-4" />;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderId.toString().includes(searchTerm) ||
                         payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">${totalRevenue}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">${pendingAmount}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100)}%
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">%</span>
            </div>
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
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
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span className="font-medium text-blue-600">#{payment.id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">#{payment.orderId}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{payment.customerName}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-900">${payment.amount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(payment.paymentMethod)}
                      <span className="capitalize text-gray-700">{payment.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{new Date(payment.date).toLocaleDateString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600 text-sm">{payment.reference}</span>
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

export default PaymentManagement;