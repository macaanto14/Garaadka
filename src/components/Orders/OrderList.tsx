import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, Package, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LaundryOrder } from '../../types';
import NewOrderForm from './NewOrderForm';
import OrderDetails from './OrderDetails';

const OrderList: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Mock data - in real app, this would come from API/database
  const [orders, setOrders] = useState<LaundryOrder[]>([
    {
      itemNum: 1201,
      name: 'Ahmed Hassan',
      descr: 'Formal shirts and pants cleaning',
      quan: 5,
      unitprice: 9,
      amntword: 'Forty-five dollars',
      duedate: '2024-01-20',
      deliverdate: '2024-01-22',
      totalAmount: 45,
      mobnum: '+252-61-234-5678',
      payCheck: 'paid',
      col: 'Blue, White',
      siz: 'Medium, Large',
      status: 'delivered'
    },
    {
      itemNum: 1202,
      name: 'Fatima Ali',
      descr: 'Wedding dress dry cleaning',
      quan: 1,
      unitprice: 78,
      amntword: 'Seventy-eight dollars',
      duedate: '2024-01-18',
      deliverdate: '2024-01-19',
      totalAmount: 78,
      mobnum: '+252-61-345-6789',
      payCheck: 'pending',
      col: 'White',
      siz: 'Small',
      status: 'ready'
    },
    {
      itemNum: 1203,
      name: 'Mohamed Omar',
      descr: 'Business suits and ties',
      quan: 8,
      unitprice: 15,
      amntword: 'One hundred twenty dollars',
      duedate: '2024-01-25',
      deliverdate: '2024-01-27',
      totalAmount: 120,
      mobnum: '+252-61-456-7890',
      payCheck: 'partial',
      col: 'Black, Navy',
      siz: 'Large',
      status: 'in-progress'
    },
    {
      itemNum: 1204,
      name: 'Khadija Yusuf',
      descr: 'Casual wear and jeans',
      quan: 12,
      unitprice: 4,
      amntword: 'Forty-eight dollars',
      duedate: '2024-01-16',
      deliverdate: '2024-01-18',
      totalAmount: 48,
      mobnum: '+252-61-567-8901',
      payCheck: 'paid',
      col: 'Various',
      siz: 'Medium',
      status: 'received'
    }
  ]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
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
                         order.descr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPayment = selectedPayment === 'all' || order.payCheck === selectedPayment;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleNewOrder = (orderData: any) => {
    const newOrder: LaundryOrder = {
      itemNum: Math.max(...orders.map(o => o.itemNum)) + 1,
      name: orderData.customerName,
      descr: orderData.items.map((item: any) => item.description).join(', '),
      quan: orderData.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      unitprice: orderData.totalAmount / orderData.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      amntword: `${orderData.totalAmount} Ethiopian Birr`,
      duedate: orderData.dueDate,
      deliverdate: orderData.deliveryDate,
      totalAmount: orderData.totalAmount,
      mobnum: orderData.customerPhone,
      payCheck: orderData.paymentStatus,
      col: orderData.items.map((item: any) => item.color).filter(Boolean).join(', ') || '',
      siz: orderData.items.map((item: any) => item.size).filter(Boolean).join(', ') || '',
      status: orderData.status
    };
    setOrders([newOrder, ...orders]);
  };

  const handleUpdateOrder = (updatedOrder: LaundryOrder) => {
    setOrders(orders.map(order => 
      order.itemNum === updatedOrder.itemNum ? updatedOrder : order
    ));
  };

  const handleViewOrder = (order: LaundryOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
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
                ${orders.reduce((sum, order) => sum + order.totalAmount, 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
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
              placeholder={t('orders.search')}
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
              <option value="all">{t('orders.allStatus')}</option>
              <option value="received">Received</option>
              <option value="in-progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
            </select>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
        
        <button
          onClick={() => setIsNewOrderOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t('orders.new')}</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">{t('orders.orderNumber')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">{t('customers.name')}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.itemNum} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <span className="font-medium text-blue-600">#{order.itemNum}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.name}</p>
                      <p className="text-sm text-gray-600">{order.mobnum}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-900 max-w-xs truncate">{order.descr}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">{order.quan}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-green-600">ETB {order.totalAmount}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{order.duedate}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(order.payCheck)}`}>
                      {order.payCheck}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
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

      {/* New Order Form Modal */}
      <NewOrderForm
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleNewOrder}
      />

      {/* Order Details Modal */}
      <OrderDetails
        order={selectedOrder}
        isOpen={isOrderDetailsOpen}
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onUpdate={handleUpdateOrder}
      />
    </div>
  );
};

export default OrderList;