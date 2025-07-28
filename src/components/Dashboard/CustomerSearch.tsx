import React, { useState } from 'react';
import { Search, Phone, Package, CheckCircle, Clock } from 'lucide-react';
import { customersAPI, ordersAPI } from '../../services/api';
import Toast from '../../utils/Toast';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: string;
  last_order_date?: string;
}

interface Order {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  due_date?: string;
  created_at: string;
  items_summary: string;
  item_count: number;
}

const CustomerSearch: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      Toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    setError('');
    setCustomer(null);
    setOrders([]);

    try {
      console.log('Searching for customer with phone:', phoneNumber.trim());
      
      // Search for customer by phone number
      const customerResponse = await customersAPI.search.byPhone(phoneNumber.trim());
      console.log('Customer search response:', customerResponse);
      
      // Check if response has customer property (new format)
      if (customerResponse && customerResponse.customer) {
        const foundCustomer = customerResponse.customer;
        console.log('Found customer:', foundCustomer);
        setCustomer(foundCustomer);
        Toast.success(`Customer found: ${foundCustomer.customer_name}`);
        
        // Get customer orders
        console.log('Fetching orders for customer ID:', foundCustomer.customer_id);
        const ordersResponse = await ordersAPI.getByCustomer(foundCustomer.customer_id.toString());
        console.log('Orders response:', ordersResponse);
        setOrders(ordersResponse || []);
        
        if (ordersResponse && ordersResponse.length > 0) {
          Toast.info(`Found ${ordersResponse.length} order(s) for this customer`);
        } else {
          Toast.info('No orders found for this customer');
        }
      } 
      // Fallback for array format (legacy compatibility)
      else if (customerResponse && Array.isArray(customerResponse) && customerResponse.length > 0) {
        const foundCustomer = customerResponse[0];
        console.log('Found customer (legacy format):', foundCustomer);
        setCustomer(foundCustomer);
        Toast.success(`Customer found: ${foundCustomer.customer_name}`);
        
        // Get customer orders
        console.log('Fetching orders for customer ID:', foundCustomer.customer_id);
        const ordersResponse = await ordersAPI.getByCustomer(foundCustomer.customer_id.toString());
        console.log('Orders response:', ordersResponse);
        setOrders(ordersResponse || []);
        
        if (ordersResponse && ordersResponse.length > 0) {
          Toast.info(`Found ${ordersResponse.length} order(s) for this customer`);
        } else {
          Toast.info('No orders found for this customer');
        }
      } else {
        setError('No customer found with this phone number');
        Toast.error('No customer found with this phone number');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      // Handle 404 errors specifically
      if (err.response?.status === 404) {
        const errorMessage = 'No customer found with this phone number';
        setError(errorMessage);
        Toast.error(errorMessage);
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Error searching for customer';
        setError(errorMessage);
        Toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      await ordersAPI.updateStatus(orderId.toString(), 'delivered');
      
      // Update the local state
      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, status: 'delivered' }
          : order
      ));
      
      Toast.success('Order marked as delivered successfully');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      const errorMessage = 'Failed to update order status';
      setError(errorMessage);
      Toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      washing: 'bg-blue-100 text-blue-800',
      drying: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-blue-600" />
          Customer Lookup
        </h3>
        <p className="text-gray-600 text-sm">Search customer by phone number and manage orders</p>
      </div>
      
      <div className="p-6">
        {/* Search Bar */}
        <div className="flex space-x-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter customer phone number..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Customer Info */}
        {customer && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {customer.customer_name}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {customer.phone_number}
              </div>
              {customer.email && (
                <div>
                  <span className="font-medium">Email:</span> {customer.email}
                </div>
              )}
              {customer.address && (
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {customer.address}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Customer Orders ({orders.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border-b font-medium text-gray-700">Order #</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Items</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Status</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Payment</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Amount</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Due Date</th>
                    <th className="text-left p-3 border-b font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        <div className="font-medium text-blue-600">#{order.order_number}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3 border-b">
                        <div className="text-sm">{order.items_summary}</div>
                        <div className="text-xs text-gray-500">{order.item_count} items</div>
                      </td>
                      <td className="p-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="p-3 border-b font-medium">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="p-3 border-b text-sm">
                        {order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 border-b">
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleMarkDelivered(order.order_id)}
                            className="flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Delivered
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <span className="flex items-center text-green-600 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Delivered
                          </span>
                        )}
                        {!['ready', 'delivered'].includes(order.status) && (
                          <span className="flex items-center text-gray-500 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Orders Message */}
        {customer && orders.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found for this customer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearch;