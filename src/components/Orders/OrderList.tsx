import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Eye, Edit, Package, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../store';
import { LaundryOrder } from '../../types';
import { ordersAPI } from '../../services/api';
import { useNotify } from '../../hooks/useNotify';
import NewOrderForm from './NewOrderForm';
import OrderDetails from './OrderDetails';
import PaymentRecordModal from '../Payments/PaymentRecordModal';

// Interface for the API response
interface OrderFromAPI {
  order_id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  phone_number: string;
  due_date: string | null;
  delivery_date: string | null;
  total_amount: number;
  payment_method: string | null;
  notes: string | null;
  status: 'pending' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  items_summary: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

const OrderList: React.FC = () => {
  const { t } = useTranslation();
  const { notify } = useNotify();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<LaundryOrder | null>(null);
  
  // State for real data
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert API response to LaundryOrder format
  const convertAPIOrderToLaundryOrder = (apiOrder: OrderFromAPI): LaundryOrder => {
    return {
      itemNum: apiOrder.order_id,
      name: apiOrder.customer_name,
      descr: apiOrder.items_summary || 'No items description',
      quan: apiOrder.item_count,
      unitprice: apiOrder.item_count > 0 ? apiOrder.total_amount / apiOrder.item_count : 0,
      amntword: `${apiOrder.total_amount} Ethiopian Birr`,
      duedate: apiOrder.due_date || '',
      deliverdate: apiOrder.delivery_date || '',
      totalAmount: apiOrder.total_amount,
      mobnum: apiOrder.phone_number,
      payCheck: apiOrder.payment_status === 'unpaid' ? 'pending' : 
                apiOrder.payment_status === 'partial' ? 'partial' : 'paid',
      col: '', // Will be extracted from items if needed
      siz: '', // Will be extracted from items if needed
      status: apiOrder.status === 'pending' ? 'received' : 
              apiOrder.status === 'cancelled' ? 'delivered' : apiOrder.status,
      orderId: apiOrder.order_number,
      serialNumber: apiOrder.order_number
    };
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getAll();
      
      // Convert API response to LaundryOrder format
      const convertedOrders = response.map(convertAPIOrderToLaundryOrder);
      
      // Sort by creation date (latest first)
      convertedOrders.sort((a, b) => {
        const dateA = new Date(a.duedate || 0).getTime();
        const dateB = new Date(b.duedate || 0).getTime();
        return dateB - dateA;
      });
      
      setOrders(convertedOrders);
      
      if (convertedOrders.length === 0) {
        notify.info('No orders found in the database');
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to fetch orders');
      notify.error('Failed to fetch orders from database');
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Refresh orders
  const handleRefresh = () => {
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (payment: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800'
    };
    return colors[payment] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.itemNum.toString().includes(searchTerm) ||
                         order.descr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.orderId && order.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPayment = selectedPayment === 'all' || order.payCheck === selectedPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleNewOrder = async (orderData: any) => {
    try {
      // Create order via API
      await ordersAPI.create(orderData);
      notify.success('Order created successfully!');
      
      // Refresh orders list to show the new order
      await fetchOrders();
      
      setIsNewOrderOpen(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
      notify.error('Failed to create order: ' + error.message);
    }
  };

  const handleUpdateOrder = async (updatedOrder: LaundryOrder) => {
    try {
      // Update order via API
      await ordersAPI.update(updatedOrder.itemNum.toString(), {
        status: updatedOrder.status,
        payment_status: updatedOrder.payCheck === 'pending' ? 'unpaid' : 
                       updatedOrder.payCheck === 'partial' ? 'partial' : 'paid',
        due_date: updatedOrder.duedate,
        delivery_date: updatedOrder.deliverdate,
        total_amount: updatedOrder.totalAmount
      });
      
      notify.success('Order updated successfully!');
      
      // Refresh orders list
      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating order:', error);
      notify.error('Failed to update order: ' + error.message);
    }
  };

  const handleViewOrder = (order: LaundryOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleRecordPayment = (order: LaundryOrder) => {
    setSelectedOrderForPayment(order);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentRecorded = async () => {
    // Refresh orders to show updated payment status
    setIsPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
    await fetchOrders();
    notify.success('Payment recorded successfully!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">Failed to load orders</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('dashboard.totalOrders')}</p>
              <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'in-progress').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ready for Pickup</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.status === 'ready').length}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                ETB {orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders by customer name, order ID, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="in-progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">
            {orders.length === 0 
              ? "No orders have been created yet." 
              : "No orders match your current search criteria."}
          </p>
          {orders.length === 0 && (
            <button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Create First Order
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.itemNum} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.itemNum}
                          </div>
                          {order.orderId && (
                            <div className="text-sm text-gray-500">
                              {order.orderId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                      <div className="text-sm text-gray-500">{order.mobnum}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={order.descr}>
                        {order.descr}
                      </div>
                      <div className="text-sm text-gray-500">Qty: {order.quan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ETB {order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        @ ETB {order.unitprice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status || 'received')}`}>
                        {order.status || 'received'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(order.payCheck)}`}>
                        {order.payCheck}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.duedate ? new Date(order.duedate).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRecordPayment(order)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          title="Record Payment"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewOrderForm
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleNewOrder}
      />

      <OrderDetails
        order={selectedOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        onUpdate={handleUpdateOrder}
      />

      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        order={selectedOrderForPayment}
        onPaymentRecorded={handlePaymentRecorded}
      />
    </div>
  );
};

export default OrderList;