import React from 'react';
import { X, DollarSign, CreditCard, Calendar, User, FileText, Hash, Phone } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Payment {
  payment_id: number;
  order_id: number;
  order_number?: string;
  customer_name: string;
  phone_number?: string;
  amount: number;
  payment_method: 'cash' | 'ebirr' | 'cbe' | 'bank_transfer';
  reference_number?: string;
  notes?: string;
  payment_date: string;
  processed_by: string;
  created_at: string;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  payment
}) => {
  if (!isOpen || !payment) return null;

  const getMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      cash: <DollarSign className="h-5 w-5" />,
      ebirr: <div className="h-5 w-5 bg-blue-500 rounded-full" />,
      cbe: <div className="h-5 w-5 bg-green-500 rounded-sm" />,
      bank_transfer: <CreditCard className="h-5 w-5" />
    };
    return icons[method] || <DollarSign className="h-5 w-5" />;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      ebirr: 'E-Birr',
      cbe: 'CBE',
      bank_transfer: 'Bank Transfer'
    };
    return labels[method] || method;
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      ebirr: 'bg-blue-100 text-blue-800',
      cbe: 'bg-purple-100 text-purple-800',
      bank_transfer: 'bg-gray-100 text-gray-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
              <p className="text-sm text-gray-600">Payment ID: #{payment.payment_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(payment.amount)}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Order Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-medium text-gray-900">#{payment.order_number || payment.order_id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">{payment.customer_name}</p>
                  </div>
                </div>

                {payment.phone_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{payment.phone_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Payment Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(payment.payment_method)}
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{getMethodLabel(payment.payment_method)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(payment.payment_method)}`}>
                          {getMethodLabel(payment.payment_method)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Payment Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {payment.reference_number && (
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Reference Number</p>
                      <p className="font-medium text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.reference_number}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Processed By</p>
                    <p className="font-medium text-gray-900">{payment.processed_by}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{payment.notes}</p>
              </div>
            </div>
          )}

          {/* Transaction Timeline */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Transaction Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="bg-green-500 rounded-full h-3 w-3"></div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Payment Completed</p>
                  <p className="text-sm text-green-600">
                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-green-600 font-semibold">{formatCurrency(payment.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;