import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { LaundryOrder } from '../../types';

const OrderList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data - in real app this would come from API
  const orders: LaundryOrder[] = [
    {
      itemNum: 1201,
      name: 'Ahmed Hassan',
      descr: 'Shirts (3), Pants (2)',
      quan: 5,
      unitprice: 9,
      amntword: 'Forty Five Dollars',
      duedate: '2024-01-15',
      deliverdate: '2024-01-17',
      totalAmount: 45,
      mobnum: 634567890,
      payCheck: 'paid',
      col: 'Mixed',
      siz: 'Various',
      status: 'ready'
    },
    {
      itemNum: 1202,
      name: 'Fatima Ali',
      descr: 'Dresses (2), Blouses (3)',
      quan: 5,
      unitprice: 15.6,
      amntword: 'Seventy Eight Dollars',
      duedate: '2024-01-16',
      deliverdate: '2024-01-18',
      totalAmount: 78,
      mobnum: 634567891,
      payCheck: 'pending',
      col: 'Colored',
      siz: 'Medium',
      status: 'washing'
    },
    {
      itemNum: 1203,
      name: 'Mohamed Omar',
      descr: 'Business Suits (2), Ties (4)',
      quan: 6,
      unitprice: 20,
      amntword: 'One Hundred Twenty Dollars',
      duedate: '2024-01-14',
      deliverdate: '2024-01-16',
      totalAmount: 120,
      mobnum: 634567892,
      payCheck: 'paid',
      col: 'Dark',
      siz: 'Large',
      status: 'delivered'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      washing: 'bg-yellow-100 text-yellow-800',
      drying: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.descr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.itemNum.toString().includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
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
              <option value="received">Received</option>
              <option value="washing">Washing</option>
              <option value="drying">Drying</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Order #</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Items</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Payment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
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
                      <p className="text-gray-600 text-sm">+252{order.mobnum}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-900">{order.descr}</p>
                    <p className="text-gray-600 text-sm">{order.quan} items</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-900">{new Date(order.duedate).toLocaleDateString()}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900">${order.totalAmount}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentColor(order.payCheck)}`}>
                      {order.payCheck}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status || 'received')}`}>
                      {order.status || 'received'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

export default OrderList;