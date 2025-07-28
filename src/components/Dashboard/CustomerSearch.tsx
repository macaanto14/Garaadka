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
  customer_name?: string;
  phone_number?: string;
  customer_id?: number;
  email?: string;
  address?: string;
}

// Comprehensive API response type definitions
interface CustomerSearchResponse {
  customer?: Customer;
  customers?: Customer[];
  message?: string;
  total_results?: number;
}

// Union type for all possible API responses
type ApiResponse = CustomerSearchResponse | Order[] | Customer | null;

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
      
      // Search for customer by phone number with proper typing
      const customerResponse: ApiResponse = await customersAPI.search.byPhone(phoneNumber.trim());
      console.log('Customer search response:', customerResponse);
      
      // Type guard function to check if response has customer property
      const hasCustomerProperty = (obj: any): obj is CustomerSearchResponse => {
        return obj && typeof obj === 'object' && 'customer' in obj;
      };

      // Type guard function to check if response is an array of orders
      const isOrderArray = (obj: any): obj is Order[] => {
        return Array.isArray(obj) && obj.length > 0 && 'order_id' in obj[0];
      };

      // Type guard function to check if response is a single customer
      const isCustomerObject = (obj: any): obj is Customer => {
        return obj && typeof obj === 'object' && 'customer_name' in obj && 'customer_id' in obj;
      };

      // Check if response has customer property (expected format)
      if (hasCustomerProperty(customerResponse) && customerResponse.customer) {
        const foundCustomer = customerResponse.customer;
        console.log('Found customer:', foundCustomer);
        setCustomer(foundCustomer);
        Toast.success(`Customer found: ${foundCustomer.customer_name}`);
        
        // Get customer orders
        console.log('Fetching orders for customer ID:', foundCustomer.customer_id);
        const ordersResponse: Order[] = await ordersAPI.getByCustomer(foundCustomer.customer_id.toString()) as Order[];
        console.log('Orders response:', ordersResponse);
        setOrders(ordersResponse || []);
        
        if (ordersResponse && ordersResponse.length > 0) {
          Toast.info(`Found ${ordersResponse.length} order(s) for this customer`);
        } else {
          Toast.info('No orders found for this customer');
        }
      } 
      // Handle case where orders are returned directly
      else if (isOrderArray(customerResponse)) {
        console.log('Received orders directly:', customerResponse);
        const ordersData = customerResponse;
        
        // Extract customer info from the first order
        const firstOrder = ordersData[0];
        if (firstOrder.customer_name && firstOrder.phone_number) {
          const extractedCustomer: Customer = {
            customer_id: firstOrder.customer_id || 0,
            customer_name: firstOrder.customer_name,
            phone_number: firstOrder.phone_number,
            email: firstOrder.email,
            address: firstOrder.address,
            total_orders: ordersData.length,
            total_spent: ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0).toFixed(2),
            last_order_date: ordersData[0].created_at
          };
          
          setCustomer(extractedCustomer);
          setOrders(ordersData);
          
          Toast.success(`Customer found: ${extractedCustomer.customer_name}`);
          Toast.info(`Found ${ordersData.length} order(s) for this customer`);
        } else {
          setError('Invalid order data received');
          Toast.error('Invalid order data received');
        }
      }
      // Handle single customer object response
      else if (isCustomerObject(customerResponse)) {
        const foundCustomer = customerResponse;
        console.log('Found customer (direct object):', foundCustomer);
        setCustomer(foundCustomer);
        Toast.success(`Customer found: ${foundCustomer.customer_name}`);
        
        // Get customer orders
        console.log('Fetching orders for customer ID:', foundCustomer.customer_id);
        const ordersResponse: Order[] = await ordersAPI.getByCustomer(foundCustomer.customer_id.toString()) as Order[];
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

  const handleMarkReady = async (orderId: number) => {
    try {
      await ordersAPI.updateStatus(orderId.toString(), 'ready');
      
      // Update the local state
      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, status: 'ready' }
          : order
      ));
      
      Toast.success('Order marked as ready successfully');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      const errorMessage = 'Failed to update order status';
      setError(errorMessage);
      Toast.error(errorMessage);
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

        {/* Customer Information */}
        {customer && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Name:</span>
                <span className="ml-2 text-blue-700">{customer.customer_name}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Phone:</span>
                <span className="ml-2 text-blue-700">{customer.phone_number}</span>
              </div>
              {customer.email && (
                <div>
                  <span className="font-medium text-blue-800">Email:</span>
                  <span className="ml-2 text-blue-700">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div>
                  <span className="font-medium text-blue-800">Address:</span>
                  <span className="ml-2 text-blue-700">{customer.address}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-blue-800">Total Orders:</span>
                <span className="ml-2 text-blue-700">{customer.total_orders}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Total Spent:</span>
                <span className="ml-2 text-blue-700">ETB {customer.total_spent}</span>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {order.items_summary}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.item_count} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {order.status === 'washing' && (
                        <button
                          onClick={() => handleMarkReady(order.order_id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleMarkDelivered(order.order_id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No Orders Message */}
        {customer && orders.length === 0 && !loading && (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              This customer doesn't have any orders yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearch;