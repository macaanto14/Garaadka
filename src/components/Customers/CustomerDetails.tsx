import React, { useState } from 'react';
import { X, Edit, Save, XCircle, User, Phone, MapPin, Calendar, Package, DollarSign, History } from 'lucide-react';
import { useTranslation } from '../../store';
import { useLanguage } from '../../contexts/LanguageContext';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  status: 'active' | 'inactive';
}

interface CustomerDetailsProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (customer: Customer) => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, isOpen, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);

  if (!isOpen || !customer) return null;

  const handleEdit = () => {
    setEditedCustomer({ ...customer });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedCustomer) {
      onUpdate(editedCustomer);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedCustomer(null);
    setIsEditing(false);
  };

  const currentCustomer = isEditing ? editedCustomer! : customer;

  // Mock order history
  const orderHistory = [
    { id: 1201, date: '2024-01-15', amount: 45, status: 'delivered' },
    { id: 1198, date: '2024-01-10', amount: 78, status: 'delivered' },
    { id: 1195, date: '2024-01-05', amount: 32, status: 'delivered' },
    { id: 1190, date: '2023-12-28', amount: 65, status: 'delivered' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg font-bold">
              {currentCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentCustomer.name}</h2>
              <p className="text-gray-600">Customer ID: #{currentCustomer.id}</p>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentCustomer.name}
                      onChange={(e) => setEditedCustomer({ ...currentCustomer, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{currentCustomer.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={currentCustomer.phone}
                      onChange={(e) => setEditedCustomer({ ...currentCustomer, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {currentCustomer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={currentCustomer.email || ''}
                      onChange={(e) => setEditedCustomer({ ...currentCustomer, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{currentCustomer.email || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  {isEditing ? (
                    <textarea
                      value={currentCustomer.address || ''}
                      onChange={(e) => setEditedCustomer({ ...currentCustomer, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 mr-1 mt-0.5" />
                      {currentCustomer.address || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Customer Statistics
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="text-2xl font-bold text-blue-600">{currentCustomer.totalOrders}</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="text-2xl font-bold text-green-600">ETB {currentCustomer.totalSpent}</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Order</span>
                    <span className="text-2xl font-bold text-purple-600">
                      ${(currentCustomer.totalSpent / currentCustomer.totalOrders).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-lg font-medium text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {currentCustomer.joinDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Recent Order History
            </h3>
            <div className="bg-white rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderHistory.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600">#{order.id}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{order.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-green-600">ETB {order.amount}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Status */}
          {isEditing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Status</h3>
              <select
                value={currentCustomer.status}
                onChange={(e) => setEditedCustomer({ ...currentCustomer, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;