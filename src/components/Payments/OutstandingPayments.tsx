import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, Clock, User, Phone } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import PaymentRecordModal from './PaymentRecordModal';

interface OutstandingOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'pending' | 'partial';
  due_date: string;
  days_overdue: number;
}

const OutstandingPayments: React.FC = () => {
  const [outstandingOrders, setOutstandingOrders] = useState<OutstandingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OutstandingOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    loadOutstandingPayments();
  }, []);

  const loadOutstandingPayments = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the backend
      const orders = await ordersAPI.getAll();
      const outstanding = orders.filter((order: any) => 
        order.payment_status === 'pending' || order.payment_status === 'partial'
      ).map((order: any) => ({
        ...order,
        outstanding_amount: order.total_amount - (order.paid_amount || 0),
        days_overdue: Math.max(0, Math.floor((new Date().getTime() - new Date(order.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      }));
      setOutstandingOrders(outstanding);
    } catch (error) {
      console.error('Error loading outstanding payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (order: OutstandingOrder) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentRecorded = () => {
    loadOutstandingPayments();
    setIsPaymentModalOpen(false);
    setSelectedOrder(null);
  };

  const getPriorityColor = (daysOverdue: number) => {
    if (daysOverdue > 30) return 'text-red-600 bg-red-50';
    if (daysOverdue > 7) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(outstandingOrders.reduce((sum, order) => sum + order.outstanding_amount, 0))}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overdue Orders</p>
              <p className="text-2xl font-bold text-orange-600">
                {outstandingOrders.filter(order => order.days_overdue > 0).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-600">
                {outstandingOrders.filter(order => order.payment_status === 'pending').length}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Outstanding Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Outstanding Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Order</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Paid</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Outstanding</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {outstandingOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span className="font-medium text-blue-600">#{order.order_number}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {order.phone_number}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-green-600">{formatCurrency(order.paid_amount)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-red-600">{formatCurrency(order.outstanding_amount)}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-gray-900">{new Date(order.due_date).toLocaleDateString()}</p>
                      {order.days_overdue > 0 && (
                        <p className={`text-xs font-medium ${getPriorityColor(order.days_overdue)}`}>
                          {order.days_overdue} days overdue
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'pending' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleRecordPayment(order)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs">Pay</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Record Modal */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderData={selectedOrder}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default OutstandingPayments;