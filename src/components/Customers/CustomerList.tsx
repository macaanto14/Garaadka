import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Mail, MapPin, Eye, ChevronLeft, ChevronRight, Users, Filter, X } from 'lucide-react';
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

interface PaginatedResponse {
  customers: Customer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
    limit: number;
  };
}

const CustomerList: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    name: '',
    phone: '',
    order_id: '',
    search_type: 'any' as 'any' | 'all'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'latest' | 'all' | 'paginated'>('latest');

  // Load customers based on view mode
  const loadCustomers = async (page: number = 1, resetPage: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (resetPage) {
        setCurrentPage(1);
        page = 1;
      }

      let data;
      
      if (viewMode === 'latest') {
        // Load latest 5 customers (optimized) - returns { customers: [...], message: "...", total_shown: 5 }
        const response = await customersAPI.getLatest();
        console.log('Latest customers response:', response); // Debug log
        const customers = response.customers || response; // Handle both response formats
        setCustomers(Array.isArray(customers) ? customers : []);
        setTotalPages(1);
        setTotalCustomers(Array.isArray(customers) ? customers.length : 0);
      } else if (viewMode === 'all') {
        // Load all customers (admin use) - returns direct array
        data = await customersAPI.getAll();
        console.log('All customers response:', data); // Debug log
        setCustomers(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalCustomers(Array.isArray(data) ? data.length : 0);
      } else {
        // Load paginated customers - returns { customers: [...], pagination: {...} }
        const response: PaginatedResponse = await customersAPI.getPaginated(page, pageSize);
        console.log('Paginated customers response:', response); // Debug log
        setCustomers(Array.isArray(response.customers) ? response.customers : []);
        setCurrentPage(response.pagination?.currentPage || response.pagination?.current_page || 1);
        setTotalPages(response.pagination?.totalPages || response.pagination?.total_pages || 1);
        setTotalCustomers(response.pagination?.totalCustomers || response.pagination?.total || 0);
      }
    } catch (err: any) {
      console.error('Load customers error:', err); // Debug log
      setError(err.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1, true);
  }, [viewMode, pageSize]);

  // Search customers
  // Enhanced search function with smart detection and fallback
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      try {
        setLoading(true);
        setError(null);
        console.log('Smart searching for:', term);
        
        // Use smart search that auto-detects search type
        let data;
        try {
          data = await customersAPI.search.smart(term);
        } catch (smartSearchError: any) {
          // If smart search fails with 404 (no order found), try general search as fallback
          if (smartSearchError.message?.includes('No customer found with this order ID') || 
              smartSearchError.message?.includes('404')) {
            console.log(`Smart search failed for "${term}", trying general search as fallback`);
            data = await customersAPI.search.general(term);
          } else {
            // Re-throw other errors
            throw smartSearchError;
          }
        }
        
        console.log('Search response:', data);
        setCustomers(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalCustomers(Array.isArray(data) ? data.length : 0);
      } catch (err: any) {
        console.error('Search failed:', err);
        // More user-friendly error message for server errors
        let errorMessage = 'Search failed. Please try again.';
        if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
          errorMessage = 'Search temporarily unavailable. Please a different search term or try again later.';
        } else if (err.message) {
          errorMessage = `Search failed: ${err.message}`;
        }
        setError(errorMessage);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    } else {
      setError(null);
      loadCustomers(1, true);
    }
  };

  // Advanced search function
  const handleAdvancedSearch = async () => {
    const { name, phone, order_id, search_type } = advancedSearch;
    
    // Check if at least one field is filled
    if (!name.trim() && !phone.trim() && !order_id.trim()) {
      setError('Please fill at least one search field');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Advanced searching with:', advancedSearch);
      
      const searchParams: any = { search_type };
      if (name.trim()) searchParams.name = name.trim();
      if (phone.trim()) searchParams.phone = phone.trim();
      if (order_id.trim()) searchParams.order_id = order_id.trim();
      
      const data = await customersAPI.search.advanced(searchParams);
      console.log('Advanced search response:', data);
      setCustomers(Array.isArray(data) ? data : []);
      setTotalPages(1);
      setTotalCustomers(Array.isArray(data) ? data.length : 0);
      setShowAdvancedSearch(false);
    } catch (err: any) {
      console.error('Advanced search failed:', err);
      setError(`Advanced search failed: ${err.message || 'Please try again.'}`);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear advanced search
  const clearAdvancedSearch = () => {
    setAdvancedSearch({
      name: '',
      phone: '',
      order_id: '',
      search_type: 'any'
    });
    setShowAdvancedSearch(false);
    setSearchTerm('');
    setError(null);
    loadCustomers(1, true);
  };

  // Manual phone search function
  // Manual phone search function
  const handlePhoneSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a phone number to search');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('Searching by phone:', searchTerm);
      
      // Use phone search API
      const data = await customersAPI.search.byPhone(searchTerm.trim());
      console.log('Phone search response:', data);
      
      // Handle single customer response from phone search
      if (data && data.customer) {
        setCustomers([data.customer]);
        setTotalPages(1);
        setTotalCustomers(1);
      } else {
        setCustomers([]);
        setTotalPages(1);
        setTotalCustomers(0);
      }
    } catch (err: any) {
      console.error('Phone search failed:', err);
      // More user-friendly error message
      let errorMessage = 'Phone search failed. Please try again.';
      if (err.message?.includes('No customer found with this phone number') || 
          err.message?.includes('404')) {
        errorMessage = 'No customer found with this phone number.';
      } else if (err.message?.includes('500') || err.message?.includes('Internal Server Error')) {
        errorMessage = 'Search temporarily unavailable. Please try again later.';
      } else if (err.message) {
        errorMessage = `Search failed: ${err.message}`;
      }
      setError(errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchTerm('');
    setError(null);
    loadCustomers(1, true);
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePhoneSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && viewMode === 'paginated') {
      setCurrentPage(newPage);
      loadCustomers(newPage);
    }
  };

  const handleViewModeChange = (mode: 'latest' | 'all' | 'paginated') => {
    setViewMode(mode);
    setSearchTerm('');
  };

  // Ensure customers is always an array for filtering
  const safeCustomers = Array.isArray(customers) ? customers : [];

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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Enter customer phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
              />
            </div>
            
            {/* Search Button */}
            <button
              onClick={handlePhoneSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200 flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
            
            {/* Clear Button */}
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
          
          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              showAdvancedSearch 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm">Advanced</span>
          </button>
          
          {/* View Mode Selector */}
          {!searchTerm && !showAdvancedSearch && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('latest')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'latest' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Latest 5
              </button>
              <button
                onClick={() => handleViewModeChange('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleViewModeChange('paginated')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'paginated' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paginated
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Customer Count */}
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm">
              {viewMode === 'paginated' && !searchTerm
                ? `${totalCustomers} total customers`
                : `${safeCustomers.length} customers`
              }
            </span>
          </div>
          
          {/* Page Size Selector for Paginated View */}
          {viewMode === 'paginated' && !searchTerm && (
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          )}
          
          <button 
            onClick={() => setShowRegistration(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('customers.add')}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeCustomers.map((customer) => (
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
                  <p className="text-2xl font-bold text-green-600">ETB {customer.total_spent || 0}</p>
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

      {/* Pagination */}
      {viewMode === 'paginated' && !searchTerm && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({totalCustomers} total customers)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {safeCustomers.length === 0 && !loading && (
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
        onSuccess={() => loadCustomers(1, true)}
      />

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={() => loadCustomers(currentPage)}
        />
      )}
    </div>
  );
};

export default CustomerList;