import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, MapPin } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

const CustomerList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const customers: Customer[] = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      phone: '+252634567890',
      email: 'ahmed.hassan@email.com',
      address: 'Hargeisa, Somaliland',
      totalOrders: 15,
      totalSpent: 675,
      lastOrder: '2024-01-15'
    },
    {
      id: 2,
      name: 'Fatima Ali',
      phone: '+252634567891',
      email: 'fatima.ali@email.com',
      address: 'Burao, Somaliland',
      totalOrders: 8,
      totalSpent: 420,
      lastOrder: '2024-01-16'
    },
    {
      id: 3,
      name: 'Mohamed Omar',
      phone: '+252634567892',
      address: 'Berbera, Somaliland',
      totalOrders: 22,
      totalSpent: 1240,
      lastOrder: '2024-01-14'
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
          />
        </div>
        
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-medium">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-gray-600 text-sm">Customer #{customer.id}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{customer.phone}</span>
              </div>
              
              {customer.email && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              
              {customer.address && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{customer.totalOrders}</p>
                  <p className="text-gray-600 text-xs">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">${customer.totalSpent}</p>
                  <p className="text-gray-600 text-xs">Spent</p>
                </div>
                <div>
                  <p className="text-xs text-gray-900 font-medium">Last Order</p>
                  <p className="text-gray-600 text-xs">{new Date(customer.lastOrder).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;