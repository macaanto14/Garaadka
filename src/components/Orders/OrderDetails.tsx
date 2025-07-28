import React, { useState } from 'react';
import { X, Edit, Save, XCircle, Package, Calendar, DollarSign, User, Phone, MapPin, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LaundryOrder } from '../../types';

interface OrderDetailsProps {
  order: LaundryOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (order: LaundryOrder) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isOpen, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<LaundryOrder | null>(null);

  if (!isOpen || !order) return null;

  const handleEdit = () => {
    setEditedOrder({ ...order });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedOrder) {
      onUpdate(editedOrder);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedOrder(null);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const currentOrder = isEditing ? editedOrder! : order;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Order #{currentOrder.itemNum}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrder.status)}`}>
              {currentOrder.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentOrder.name}
                    onChange={(e) => setEditedOrder({ ...currentOrder, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{currentOrder.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={currentOrder.mobnum}
                    onChange={(e) => setEditedOrder({ ...currentOrder, mobnum: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {currentOrder.mobnum}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={currentOrder.descr}
                    onChange={(e) => setEditedOrder({ ...currentOrder, descr: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{currentOrder.descr}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={currentOrder.quan}
                    onChange={(e) => setEditedOrder({ ...currentOrder, quan: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{currentOrder.quan} items</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={currentOrder.unitprice}
                    onChange={(e) => setEditedOrder({ ...currentOrder, unitprice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">${currentOrder.unitprice}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentOrder.col}
                    onChange={(e) => setEditedOrder({ ...currentOrder, col: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{currentOrder.col || 'Not specified'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentOrder.siz}
                    onChange={(e) => setEditedOrder({ ...currentOrder, siz: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{currentOrder.siz || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dates and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Important Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={currentOrder.duedate}
                      onChange={(e) => setEditedOrder({ ...currentOrder, duedate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentOrder.duedate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={currentOrder.deliverdate}
                      onChange={(e) => setEditedOrder({ ...currentOrder, deliverdate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {currentOrder.deliverdate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <p className="text-2xl font-bold text-green-600">${currentOrder.totalAmount}</p>
                  <p className="text-sm text-gray-600">{currentOrder.amntword}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                  {isEditing ? (
                    <select
                      value={currentOrder.payCheck}
                      onChange={(e) => setEditedOrder({ ...currentOrder, payCheck: e.target.value as 'paid' | 'pending' | 'partial' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(currentOrder.payCheck)}`}>
                      {currentOrder.payCheck}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Status */}
          {isEditing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Order Status
              </h3>
              <select
                value={currentOrder.status}
                onChange={(e) => setEditedOrder({ ...currentOrder, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="received">Received</option>
                <option value="in-progress">In Progress</option>
                <option value="ready">Ready for Pickup</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;