import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, AlertCircle, CheckCircle, Search, Phone, FileText } from 'lucide-react';
import { paymentsAPI, ordersAPI, customersAPI, receiptsAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/currency';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  orderData?: any;
  onPaymentRecorded?: () => void;
}

interface PaymentFormData {
  order_id: number;
  amount: number;
  payment_method: 'cash' | 'ebirr' | 'cbe' | 'bank_transfer';
  reference_number?: string;
  notes?: string;
}

interface CustomerOrder {
  itemNum: number;
  name: string;
  mobnum: string;
  totalAmount: number;
  payment_status: 'paid' | 'unpaid' | 'partial';
  status: string;
  descr: string;
  duedate: string;
  paid_amount?: number;
}

const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderData,
  onPaymentRecorded
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [showOrderSelection, setShowOrderSelection] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    order_id: orderId || 0,
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && orderData) {
      // If opened with specific order data
      setSelectedOrder(orderData);
      setFormData(prev => ({
        ...prev,
        order_id: orderData.itemNum,
        amount: calculateOutstandingAmount(orderData)
      }));
      setShowOrderSelection(false);
    } else if (isOpen && !orderData) {
      // If opened for general payment recording
      resetForm();
      setShowOrderSelection(true);
    }
  }, [isOpen, orderData]);

  const calculateOutstandingAmount = (order: CustomerOrder) => {
    if (!order) return 0;
    const totalAmount = order.totalAmount || 0;
    const paidAmount = order.paid_amount || 0;
    return Math.max(0, totalAmount - paidAmount);
  };

  const searchCustomerByPhone = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await customersAPI.search.byPhone(phoneNumber);
      
      if (!response || !response.customer) {
        toast.error('No customer found with this phone number');
        setCustomerOrders([]);
        return;
      }

      const customer = response.customer;
      try {
        const orders = await ordersAPI.getByCustomer(customer.customer_id.toString());
        
        // Map API response to CustomerOrder interface and filter for outstanding orders
        const mappedOrders: CustomerOrder[] = orders
          .filter((order: any) => 
            order.payment_status === 'unpaid' || order.payment_status === 'partial'
          )
          .map((order: any) => ({
            itemNum: order.order_id,
            name: order.customer_name,
            mobnum: order.phone_number,
            totalAmount: order.total_amount,
            payment_status: order.payment_status,
            status: order.status,
            descr: order.items_summary || 'No description',
            duedate: order.due_date || order.created_at,
            paid_amount: order.paid_amount || 0
          }));

        if (mappedOrders.length === 0) {
          toast.success('No outstanding payments found for this customer');
          setCustomerOrders([]);
        } else {
          setCustomerOrders(mappedOrders);
          toast.success(`Found ${mappedOrders.length} order(s) with outstanding payments`);
        }
      } catch (error) {
        console.error('Error fetching orders for customer:', customer.customer_id, error);
        toast.error('Failed to fetch customer orders');
        setCustomerOrders([]);
      }
    } catch (error: any) {
      console.error('Error searching customer:', error);
      if (error.message?.includes('No customer found')) {
        toast.error('No customer found with this phone number');
      } else {
        toast.error(error.message || 'Failed to search customer');
      }
      setCustomerOrders([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    const outstandingAmount = calculateOutstandingAmount(order);
    setFormData(prev => ({
      ...prev,
      order_id: order.itemNum,
      amount: outstandingAmount
    }));
    setShowOrderSelection(false);
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      cash: <DollarSign className="h-5 w-5" />,
      ebirr: <Smartphone className="h-5 w-5" />,
      cbe: <Building className="h-5 w-5" />,
      bank_transfer: <CreditCard className="h-5 w-5" />
    };
    return icons[method as keyof typeof icons] || <DollarSign className="h-5 w-5" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !formData.order_id || formData.amount <= 0) {
      toast.error('Please select an order and enter a valid payment amount');
      return;
    }

    const outstandingAmount = calculateOutstandingAmount(selectedOrder);
    if (formData.amount > outstandingAmount) {
      toast.error(`Payment amount cannot exceed outstanding amount of ${formatCurrency(outstandingAmount)}`);
      return;
    }

    try {
      setLoading(true);
      await paymentsAPI.create(formData);
      
      // Generate receipt
      try {
        await receiptsAPI.getOrderReceipt(formData.order_id);
        toast.success('Payment recorded successfully and receipt generated');
      } catch (receiptError) {
        console.error('Receipt generation failed:', receiptError);
        toast.success('Payment recorded successfully (receipt generation failed)');
      }
      
      onPaymentRecorded?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: 0,
      amount: 0,
      payment_method: 'cash',
      reference_number: '',
      notes: ''
    });
    setSelectedOrder(null);
    setCustomerOrders([]);
    setPhoneNumber('');
    setShowOrderSelection(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      paid: 'text-green-600 bg-green-100',
      unpaid: 'text-red-600 bg-red-100',
      partial: 'text-yellow-600 bg-yellow-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  const outstandingAmount = selectedOrder ? calculateOutstandingAmount(selectedOrder) : 0;
  const totalAmount = selectedOrder?.totalAmount || 0;
  const paidAmount = selectedOrder?.paid_amount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Customer Search Section */}
        {showOrderSelection && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Search Customer</h3>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Enter customer phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomerByPhone()}
                />
              </div>
              <button
                onClick={searchCustomerByPhone}
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Outstanding Orders List */}
            {customerOrders.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Outstanding Orders</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {customerOrders.map((order) => {
                    const outstanding = calculateOutstandingAmount(order);
                    const orderPaidAmount = order.paid_amount || 0;
                    return (
                      <div
                        key={order.itemNum}
                        onClick={() => selectOrder(order)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-blue-600">#{order.itemNum}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{order.name} - {order.mobnum}</p>
                            <p className="text-sm text-gray-500 truncate">{order.descr}</p>
                            <p className="text-xs text-gray-400">Due: {order.duedate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total: {formatCurrency(order.totalAmount)}</p>
                            <p className="text-sm text-green-600">Paid: {formatCurrency(orderPaidAmount)}</p>
                            <p className="text-lg font-bold text-red-600">Outstanding: {formatCurrency(outstanding)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Order Summary */}
        {selectedOrder && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-gray-900">Selected Order</h3>
              {showOrderSelection && (
                <button
                  onClick={() => setShowOrderSelection(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Change Order
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order #:</span>
                  <span className="font-medium">#{selectedOrder.itemNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedOrder.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{selectedOrder.mobnum}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-900 font-medium">Outstanding:</span>
                  <span className="font-bold text-red-600">{formatCurrency(outstandingAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {selectedOrder && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={outstandingAmount || undefined}
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              {outstandingAmount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(outstandingAmount)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: 'cash' },
                  { value: 'ebirr', label: 'E-Birr', icon: 'ebirr' },
                  { value: 'cbe', label: 'CBE', icon: 'cbe' },
                  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'bank_transfer' }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value as any }))}
                    className={`p-3 border rounded-lg flex items-center space-x-2 transition-colors ${
                      formData.payment_method === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {getPaymentMethodIcon(method.icon)}
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Transaction reference (optional)"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes (optional)"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.amount <= 0 || !selectedOrder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Record Payment & Generate Receipt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* No Order Selected State */}
        {!selectedOrder && !showOrderSelection && (
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please search for a customer to record payment</p>
            <button
              onClick={() => setShowOrderSelection(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRecordModal;