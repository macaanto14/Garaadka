import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { customersAPI } from '../../services/api';
import CustomerRegistration from './CustomerRegistration';
import CustomerDetails from './CustomerDetails';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone_number: string;
  email?: string;
  address?: string;
  registration_date: string;
  status: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
}

const CustomerList: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getAll();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Search customers
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      try {
        const data = await customersAPI.search(term);
        setCustomers(data);
      } catch (err: any) {
        console.error('Search failed:', err);
        // Fall back to local filtering if search fails
        const filtered = customers.filter(customer =>
          customer.customer_name.toLowerCase().includes(term.toLowerCase()) ||
          customer.phone_number.includes(term)
        );
        setCustomers(filtered);
      }
    } else {
      loadCustomers();
    }
  };

  const filteredCustomers = searchTerm 
    ? customers 
    : customers.filter(customer =>
        customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number.includes(searchTerm)
      );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={t('customers.search')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
          />
        </div>
        
        <button 
          onClick={() => setShowRegistration(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t('customers.add')}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.customer_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-medium">
                  {customer.customer_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.customer_name}</h3>
                  <p className="text-gray-600 text-sm">{t('customers.customer')} #{customer.customer_id}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    customer.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{customer.phone_number}</span>
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
                  <p className="text-2xl font-bold text-blue-600">{customer.total_orders || 0}</p>
                  <p className="text-gray-600 text-xs">{t('customers.orders')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">${customer.total_spent || 0}</p>
                  <p className="text-gray-600 text-xs">{t('customers.spent')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-900 font-medium">{t('customers.lastOrder')}</p>
                  <p className="text-gray-600 text-xs">
                    {customer.last_order_date 
                      ? new Date(customer.last_order_date).toLocaleDateString()
                      : 'No orders'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setSelectedCustomer(customer)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>{t('customers.viewDetails')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No customers found</div>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by registering your first customer'}
          </p>
        </div>
      )}

      {/* Customer Registration Modal */}
      <CustomerRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={loadCustomers}
      />

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={loadCustomers}
        />
      )}
    </div>
  );
};

export default CustomerList;