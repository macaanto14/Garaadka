import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Search, UserPlus } from 'lucide-react';
import { customersAPI, ordersAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { generateSerialNumber } from '../../utils/serialNumber';
import { useSettings } from '../../store';
import InvoiceManager from './InvoiceManager';

interface Customer {
  customer_id: number;
  customer_name: string;
  phone_number: string;
  email?: string;
  address?: string;
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
  onSuccess: (orderData: any) => void;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerSuggestion, setShowAddCustomerSuggestion] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([{
    item_name: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    color: '',
    size: '',
    special_instructions: ''
  }]);
  const [dueDate, setDueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ebirr' | 'cbe' | 'bank_transfer'>('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  
  // Invoice Manager
  const [showInvoiceManager, setShowInvoiceManager] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<any>(null);

  const { notify } = useToast();
  const { serialNumberConfig } = useSettings();

  // Calculate subtotal and total
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal - discount;

  // Generate new order ID using settings from backend
  const generateNewOrderId = () => {
    try {
      const newOrderId = generateSerialNumber(serialNumberConfig);
      setGeneratedOrderId(newOrderId);
    } catch (error) {
      console.error('Error generating order ID:', error);
      notify.error('Error generating order ID');
    }
  };

  // Generate initial order ID when modal opens
  useEffect(() => {
    if (isOpen) {
      generateNewOrderId();
    }
  }, [isOpen, serialNumberConfig]);

  // Load customers when modal opens
  useEffect(() => {
    const loadCustomers = async () => {
      if (!isOpen) return;
      
      try {
        const response = await customersAPI.getLatest();
        setCustomers(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Error loading customers:', err);
        setCustomers([]);
      }
    };

    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const handleCustomerSearch = async () => {
    if (!customerSearch.trim()) {
      setShowCustomerDropdown(false);
      setShowAddCustomerSuggestion(false);
      return;
    }

    setIsSearching(true);
    setShowCustomerDropdown(false);
    setShowAddCustomerSuggestion(false);

    try {
      const response = await customersAPI.search.smart(customerSearch.trim());
      
      let customerData: Customer[] = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        customerData = response;
      } else if (response && typeof response === 'object') {
        if ('customer' in response) {
          customerData = [response.customer as Customer];
        } else if ('customers' in response) {
          customerData = response.customers as Customer[];
        } else if ('data' in response) {
          customerData = Array.isArray(response.data) ? response.data : [];
        }
      }

      // Ensure customerData is an array
      if (!Array.isArray(customerData)) {
        customerData = [];
      }

      if (customerData.length === 0) {
        setShowAddCustomerSuggestion(true);
        setCustomers([]);
      } else {
        setCustomers(customerData);
        setShowCustomerDropdown(true);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setShowAddCustomerSuggestion(true);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddNewCustomer = () => {
    const phoneNumber = customerSearch.trim();
    if (!phoneNumber) {
      notify.error('Please enter a phone number');
      return;
    }

    // Create a temporary customer object
    const tempCustomer: Customer = {
      customer_id: 0, // Temporary ID
      customer_name: `Customer (${phoneNumber})`,
      phone_number: phoneNumber
    };
    
    setSelectedCustomer(tempCustomer);
    setShowAddCustomerSuggestion(false);
    setShowCustomerDropdown(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone_number);
    setShowCustomerDropdown(false);
    setShowAddCustomerSuggestion(false);
  };

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

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const updateSerialConfig = () => {
    try {
      const config = {
        prefix: customPrefix,
        randomDigits: customDigits,
        separator: customSeparator
      };
      const newSerial = generateSerialNumber(config);
      setPreviewSerial(newSerial);
      setGeneratedOrderId(newSerial);
    } catch (error) {
      console.error('Error updating serial config:', error);
      notify.error('Invalid serial number configuration');
    }
  };

  const handlePresetConfigChange = (presetName: string) => {
    try {
      if (presetName === 'CUSTOM') return;
      
      const config = SERIAL_CONFIGS[presetName as keyof typeof SERIAL_CONFIGS];
      if (config) {
        setCustomPrefix(config.prefix);
        setCustomDigits(config.randomDigits);
        setCustomSeparator(config.separator || '');
        const newSerial = generateSerialNumber(config);
        setPreviewSerial(newSerial);
        setGeneratedOrderId(newSerial);
      }
    } catch (error) {
      console.error('Error applying preset config:', error);
      notify.error('Error applying preset configuration');
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomers([]);
    setShowCustomerDropdown(false);
    setShowAddCustomerSuggestion(false);
    setItems([{
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      color: '',
      size: '',
      special_instructions: ''
    }]);
    setDueDate('');
    setDeliveryDate('');
    setPaymentStatus('unpaid');
    setPaymentMethod('cash');
    setDiscount(0);
    setNotes('');
    setError('');
    setShowInvoiceManager(false);
    setCreatedOrderData(null);
    generateNewOrderId();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form
      if (!selectedCustomer) {
        throw new Error('Please select a customer');
      }

      if (items.some(item => !item.item_name.trim())) {
        throw new Error('Please fill in all item names');
      }

      // Prepare order data to match server expectations
      const orderData = {
        customer_id: selectedCustomer.customer_id,
        due_date: dueDate || null,
        delivery_date: deliveryDate || null,
        items: items.map(item => ({
          item_name: item.item_name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          color: item.color || '',
          size: item.size || '',
          special_instructions: item.special_instructions || ''
        })),
        payment_method: paymentMethod,
        notes: notes || ''
      };

      const response = await ordersAPI.create(orderData);
      
      // Prepare data for InvoiceManager with the correct structure
      const invoiceData = {
        orderId: response.order_id,
        orderNumber: response.order_number,
        customerData: selectedCustomer,
        items: items,
        totalAmount: total,
        discount: discount,
        dueDate: dueDate,
        deliveryDate: deliveryDate,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        notes: notes
      };
      
      notify.success('Order created successfully!');
      setCreatedOrderData(invoiceData);
      setShowInvoiceManager(true);
      onSuccess(response);
      
      // Reset form
      resetForm();
      
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      notify.error(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add missing function for closing invoice manager
  const handleInvoiceManagerClose = () => {
    setShowInvoiceManager(false);
    setCreatedOrderData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Order ID Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generated Order ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedOrderId}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono"
                  />
                  <button
                    type="button"
                    onClick={generateNewOrderId}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Configure serial number format in Settings → Package Serial Numbers
                </p>
              </div>
            </div>

            {/* Remove the entire Serial Number Configuration section */}
            {/* The section from line ~420 to ~490 should be removed */}

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Enter customer phone number..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedCustomer && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-green-600 text-sm font-medium">
                        {selectedCustomer.customer_name}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCustomerSearch}
                  disabled={isSearching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
              </div>

              {/* Customer dropdown */}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.customer_name}</div>
                      <div className="text-sm text-gray-600">{customer.phone_number}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Add customer suggestion */}
              {showAddCustomerSuggestion && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    No customer found with this phone number.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddNewCustomer}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Add Customer</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., Shirt, Pants"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Detailed description"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unit Price (ETB) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">
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

                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Special Instructions
                      </label>
                      <textarea
                        value={item.special_instructions}
                        onChange={(e) => updateItem(index, 'special_instructions', e.target.value)}
                        placeholder="Any special handling instructions..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div className="mt-3 text-right">
                      <span className="text-sm font-medium text-gray-700">
                        Subtotal: ETB {(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates and Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'unpaid' | 'partial' | 'paid')}
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
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'ebirr' | 'cbe' | 'bank_transfer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="ebirr">E-Birr</option>
                    <option value="cbe">CBE</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">ETB {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-500">ETB</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">ETB {total.toFixed(2)}</span>
                  </div>
                </div>
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
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCustomer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Creating...' : 'Create Order'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Invoice Manager */}
      {showInvoiceManager && createdOrderData && (
        <InvoiceManager
          isOpen={showInvoiceManager}
          onClose={handleInvoiceManagerClose}
          orderData={createdOrderData}
        />
      )}
    </div>
  );
};

export default NewOrderForm;
