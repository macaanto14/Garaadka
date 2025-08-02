import React, { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, AlertCircle, Eye, Edit } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useTranslation, useLanguage } from '../../store';
import { formatCurrency } from '../../utils/currency';
import { LaundryOrder } from '../../types';
import OrderDetailsModal from '../Orders/OrderDetailsModal';
import OrderDetails from '../Orders/OrderDetails';

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  phone_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  due_date: string;
  created_at: string;
  items_summary: string;
  item_count: number;
}

interface RecentOrdersProps {
  limit?: number;
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ limit = 10 }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const language = useLanguage();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.getAll();
      // Extract orders array from response object and take only the specified limit
      const ordersArray = data.orders || data;
      setOrders(ordersArray.slice(0, limit));
    } catch (err) {
      console.error('Error loading recent orders:', err);
      setError(language === 'so' ? 'Qalad ayaa dhacay markii la raadinayay dalabka' : 'Error loading recent orders');
    } finally {
      setLoading(false);
    }
  };

  // Convert Order to LaundryOrder format for the modals
  const convertToLaundryOrder = (order: Order): LaundryOrder => {
    return {
      itemNum: order.order_id,
      name: order.customer_name,
      descr: order.items_summary || 'Laundry Service',
      quan: order.item_count || 1,
      unitprice: Number(order.total_amount) / (order.item_count || 1),
      amntword: '', // This would need to be calculated if needed
      duedate: order.due_date,
      deliverdate: order.due_date, // Using due_date as delivery date for now
      totalAmount: Number(order.total_amount),
      mobnum: parseInt(order.phone_number.replace(/\D/g, '')) || 0,
      payCheck: order.payment_status === 'paid' ? 'paid' : 
                order.payment_status === 'partial' ? 'partial' : 'pending',
      col: '', // Default values for optional fields
      siz: '',
      status: order.status as 'received' | 'washing' | 'drying' | 'ready' | 'delivered',
      orderId: order.order_number,
    };
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(convertToLaundryOrder(order));
    setShowViewModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(convertToLaundryOrder(order));
    setShowEditModal(true);
  };

  const handleOrderUpdate = (updatedOrder: LaundryOrder) => {
    // Here you would typically call an API to update the order
    // For now, we'll just close the modal and refresh the orders
    setShowEditModal(false);
    setSelectedOrder(null);
    loadRecentOrders(); // Refresh the orders list
  };

  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'washing':
      case 'on progress':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'washing':
      case 'on progress':
        return <Package className="w-4 h-4" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string): string => {
    if (language === 'so') {
      switch (status.toLowerCase()) {
        case 'pending':
          return 'Sugaya';
        case 'washing':
        case 'on progress':
          return 'Socda';
        case 'ready':
          return 'Diyaar';
        case 'delivered':
          return 'La dhiibay';
        case 'cancelled':
          return 'La joojiyay';
        default:
          return status;
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getPaymentStatusColor = (paymentStatus: string): string => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (paymentStatus: string): string => {
    if (language === 'so') {
      switch (paymentStatus.toLowerCase()) {
        case 'paid':
          return 'La bixiyay';
        case 'partial':
          return 'Qayb';
        case 'unpaid':
          return 'Lama bixin';
        default:
          return paymentStatus;
      }
    }
    return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'so' ? 'so-SO' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return 'ETB 0.00';
    }
    
    return `ETB ${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'so' ? 'Dalabka Dhawaan' : 'Recent Orders'}
        </h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'so' ? 'Dalabka Dhawaan' : 'Recent Orders'}
        </h3>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadRecentOrders}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'so' ? 'Isku day mar kale' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {language === 'so' ? 'Dalabka Dhawaan' : 'Recent Orders'}
          </h3>
          <button
            onClick={loadRecentOrders}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {language === 'so' ? 'Cusboonaysii' : 'Refresh'}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {language === 'so' ? 'Wax dalab ah ma jiraan' : 'No orders found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-blue-600">
                        {order.order_number}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {getPaymentStatusText(order.payment_status)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="mx-2">•</span>
                      <span>{order.phone_number}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      {order.items_summary && order.items_summary.length > 60
                        ? `${order.items_summary.substring(0, 60)}...`
                        : order.items_summary}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={language === 'so' ? 'Eeg' : 'View'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={language === 'so' ? 'Wax ka beddel' : 'Edit'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Order Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showViewModal}
          onClose={handleCloseModals}
          order={selectedOrder}
        />
      )}

      {/* Edit Order Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          isOpen={showEditModal}
          onClose={handleCloseModals}
          onUpdate={handleOrderUpdate}
        />
      )}
    </>
  );
};

export default RecentOrders;