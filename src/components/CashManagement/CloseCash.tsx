import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Calendar, 
  FileText, 
  History,
  Save,
  AlertCircle
} from 'lucide-react';
import { useNotify } from '../../hooks/useNotify';
import { cashManagementAPI } from '../../services/api';

interface DailySummary {
  date: string;
  orders: {
    total_orders: number;
    total_order_value: number;
    total_paid_amount: number;
    total_unpaid_amount: number;
    fully_paid_orders: number;
    partially_paid_orders: number;
    unpaid_orders: number;
  };
  payments: Array<{
    payment_method: string;
    total_amount: number;
    transaction_count: number;
  }>;
  cashTransactions: {
    cash_received: number;
    cash_transaction_count: number;
  };
  expenses: {
    total_expenses: number;
    expense_count: number;
  };
  yesterdayClose: {
    cash_amount: number;
    total_amount: number;
  };
}

interface CloseCashData {
  close_date: string;
  cash_amount: number;
  card_amount: number;
  mobile_amount: number;
  bank_transfer_amount: number;
  total_amount: number;
  expenses_amount: number;
  notes: string;
}

const CloseCash: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [closeCashData, setCloseCashData] = useState<CloseCashData>({
    close_date: new Date().toISOString().split('T')[0],
    cash_amount: 0,
    card_amount: 0,
    mobile_amount: 0,
    bank_transfer_amount: 0,
    total_amount: 0,
    expenses_amount: 0,
    notes: ''
  });

  const notify = useNotify();

  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate]);

  useEffect(() => {
    // Auto-calculate total amount
    const total = closeCashData.cash_amount + closeCashData.card_amount + 
                  closeCashData.mobile_amount + closeCashData.bank_transfer_amount - 
                  closeCashData.expenses_amount;
    setCloseCashData(prev => ({ ...prev, total_amount: total }));
  }, [closeCashData.cash_amount, closeCashData.card_amount, closeCashData.mobile_amount, 
      closeCashData.bank_transfer_amount, closeCashData.expenses_amount]);

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const data = await cashManagementAPI.getDailySummary(selectedDate);
      setSummary(data);
      
      // Pre-populate close cash data with actual received amounts
      const paymentsByMethod = data.payments.reduce((acc: any, payment: any) => {
        acc[payment.payment_method] = payment.total_amount;
        return acc;
      }, {});

      setCloseCashData(prev => ({
        ...prev,
        close_date: selectedDate,
        cash_amount: paymentsByMethod.cash || 0,
        card_amount: paymentsByMethod.card || 0,
        mobile_amount: paymentsByMethod.mobile || 0,
        bank_transfer_amount: paymentsByMethod.bank_transfer || 0,
        expenses_amount: data.expenses.total_expenses || 0
      }));
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      notify.error('Error fetching daily summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async () => {
    if (!closeCashData.close_date) {
      notify.error('Please select a date');
      return;
    }

    setClosing(true);
    try {
      await cashManagementAPI.closeCash(closeCashData);
      notify.success('Cash closed successfully');
      fetchDailySummary(); // Refresh data
    } catch (error) {
      console.error('Error closing cash:', error);
      notify.error('Error closing cash');
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const value = amount || 0;
    return `ETB ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-5 h-5" />;
      case 'card': return <CreditCard className="w-5 h-5" />;
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'bank_transfer': return <Building2 className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'mobile': return 'Mobile Money';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Close Cash</h1>
          <p className="text-gray-600">End of day cash management and reconciliation</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {summary && (
        <>
          {/* Daily Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Orders Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders:</span>
                  <span className="font-medium">{summary.orders.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Value:</span>
                  <span className="font-medium">{formatCurrency(summary.orders.total_order_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(summary.orders.total_paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unpaid:</span>
                  <span className="font-medium text-red-600">{formatCurrency(summary.orders.total_unpaid_amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            {summary.payments.map((payment) => (
              <div key={payment.payment_method} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getPaymentMethodName(payment.payment_method)}
                  </h3>
                  {getPaymentMethodIcon(payment.payment_method)}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(payment.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transactions:</span>
                    <span className="font-medium">{payment.transaction_count}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Yesterday's Close */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Yesterday's Close</h3>
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash Amount:</span>
                  <span className="font-medium">{formatCurrency(summary.yesterdayClose.cash_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(summary.yesterdayClose.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Close Cash Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Close Cash for {selectedDate}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cash Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.cash_amount}
                    onChange={(e) => setCloseCashData(prev => ({ ...prev, cash_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Card Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Amount
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.card_amount}
                    onChange={(e) => setCloseCashData(prev => ({ ...prev, card_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Mobile Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Money Amount
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.mobile_amount}
                    onChange={(e) => setCloseCashData(prev => ({ ...prev, mobile_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Bank Transfer Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Transfer Amount
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.bank_transfer_amount}
                    onChange={(e) => setCloseCashData(prev => ({ ...prev, bank_transfer_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Expenses Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expenses Amount
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.expenses_amount}
                    onChange={(e) => setCloseCashData(prev => ({ ...prev, expenses_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Total Amount (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={closeCashData.total_amount}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={closeCashData.notes}
                onChange={(e) => setCloseCashData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about the day's cash operations..."
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleCloseCash}
                disabled={closing}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {closing ? 'Closing...' : 'Close Cash'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CloseCash;