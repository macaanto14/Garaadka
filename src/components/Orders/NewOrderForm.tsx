// Force reload - timestamp: 1753718500000
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, UserPlus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ordersAPI, customersAPI } from '../../services/api';
import { Toast } from '../../utils/Toast';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone_number: string;
  email?: string;
}

interface OrderItem {
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  color: string;
  size: string;
  special_instructions: string;
}

interface NewOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerSuggestion, setShowAddCustomerSuggestion] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [dueDate, setDueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ebirr' | 'cbe' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  
  const [items, setItems] = useState<OrderItem[]>([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      color: '',
      size: '',
      special_instructions: ''
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Use the latest customers endpoint for better performance
        const data = await customersAPI.getLatest();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setCustomers([]);
      }
    };
    
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  // Search customers by phone number
  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) {
      Toast.info('Enter Phone Number', 'Please enter a phone number to search for customers.');
      return;
    }

    setIsSearching(true);
    setShowAddCustomerSuggestion(false);
    setShowCustomerDropdown(false);
    
    try {
      const trimmedTerm = customerSearch.trim();
      
      // Only search by phone number for new orders
      const response = await customersAPI.search.byPhone(trimmedTerm);
      
      // Handle the response format - check if it's an array or object with customer property
      let customerData;
      if (Array.isArray(response)) {
        customerData = response;
      } else if (response.customer) {
        // If response has a customer property, wrap it in an array
        customerData = [response.customer];
      } else if (response.customers) {
        // If response has a customers property
        customerData = response.customers;
      } else {
        // Fallback - assume response is a single customer object
        customerData = [response];
      }
      
      setCustomers(customerData);
      
      if (customerData.length === 0) {
        setShowAddCustomerSuggestion(true);
        setShowCustomerDropdown(false);
        Toast.info('No customers found', `No customers found with phone number "${trimmedTerm}"`);
      } else {
        setShowCustomerDropdown(true);
        setShowAddCustomerSuggestion(false);
        Toast.success('Customers Found', `Found ${customerData.length} customer(s) with this phone number`);
      }
    } catch (err) {
      console.error('Customer search failed:', err);
      Toast.error('Search Failed', 'Failed to search for customers by phone number. Please try again.');
      setCustomers([]);
      setShowCustomerDropdown(false);
      setShowAddCustomerSuggestion(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding new customer
  const handleAddNewCustomer = () => {
    const phoneNumber = customerSearch.trim();
    if (!phoneNumber) {
      Toast.error('Invalid Phone Number', 'Please enter a valid phone number.');
      return;
    }
    
    // Here you would typically open a new customer form or navigate to add customer page
    // For now, we'll show a toast with instructions
    Toast.info('Add New Customer', `To add a customer with phone number "${phoneNumber}", please go to the Customers section and create a new customer record.`);
    
    // You could also implement a quick add customer modal here
    // or call a function passed as prop to open the customer form
  };

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone_number); // Show phone number instead of name
    setShowCustomerDropdown(false);
    setShowAddCustomerSuggestion(false);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      color: '',
      size: '',
      special_instructions: ''
    }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal - discount;

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedCustomer) {
        throw new Error('Please select a customer');
      }
      if (!dueDate) {
        throw new Error('Due date is required');
      }
      if (items.some(item => !item.item_name.trim())) {
        throw new Error('All items must have a name');
      }

      const orderData = {
        customer_id: selectedCustomer.customer_id,
        due_date: dueDate,
        delivery_date: deliveryDate || null,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        discount: discount,
        notes: notes,
        items: items.filter(item => item.item_name.trim())
      };

      await ordersAPI.create(orderData);
      
      // Reset form
      setSelectedCustomer(null);
      setCustomerSearch('');
      setDueDate('');
      setDeliveryDate('');
      setPaymentStatus('unpaid');
      setPaymentMethod('cash');
      setNotes('');
      setDiscount(0);
      setItems([{
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        color: '',
        size: '',
        special_instructions: ''
      }]);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Phone Number *
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  placeholder="Enter phone number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomerSearch}
                disabled={isSearching || !customerSearch.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            
            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.customer_id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{customer.customer_name}</div>
                    <div className="text-sm text-gray-600">{customer.phone_number}</div>
                  </button>
                ))}
              </div>
            )}

            {showAddCustomerSuggestion && customerSearch.trim() && (
              <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Customer not found
                    </p>
                    <p className="text-sm text-yellow-700">
                      No customer found with phone number "{customerSearch.trim()}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewCustomer}
                    className="ml-4 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2 text-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Customer</span>
                  </button>
                </div>
              </div>
            )}
            
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-900">{selectedCustomer.customer_name}</div>
                <div className="text-sm text-green-700">{selectedCustomer.phone_number}</div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Order Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., Shirt, Pants"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Additional details"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={item.color}
                        onChange={(e) => updateItem(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., Blue, Red"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => updateItem(index, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., M, L, XL"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      value={item.special_instructions}
                      onChange={(e) => updateItem(index, 'special_instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Any special handling instructions"
                    />
                  </div>

                  <div className="mt-2 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      Subtotal: ${(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="ebirr">Ebirr</option>
                <option value="cbe">CBE</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes for this order"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrderForm;