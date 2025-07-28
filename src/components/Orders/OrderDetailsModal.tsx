import React from 'react';
import { X, User, Phone, Calendar, DollarSign, Package, Palette, Ruler } from 'lucide-react';
import { LaundryOrder } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LaundryOrder;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Order Details #{order.itemNum}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{order.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">+252{order.mobnum}</span>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{order.descr}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="text-gray-700 font-medium">{order.quan} items</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{order.col}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{order.siz}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates & Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">Due Date:</span>
                  <span className="text-gray-700">{new Date(order.duedate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">Delivery Date:</span>
                  <span className="text-gray-700">{new Date(order.deliverdate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status || 'received')}`}>
                    {order.status || 'received'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Unit Price:</span>
                <span className="text-gray-700 font-medium">${order.unitprice}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">${order.totalAmount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentColor(order.payCheck)}`}>
                  {order.payCheck}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Edit Order
            </button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;