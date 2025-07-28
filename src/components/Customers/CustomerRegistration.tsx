import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Save, AlertCircle } from 'lucide-react';
import { customersAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface CustomerRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerFormData {
  customer_name: string;
  phone_number: string;
  email: string;
  address: string;
  notes: string;
}

interface ValidationErrors {
  customer_name?: string;
  phone_number?: string;
  email?: string;
}

const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_name: '',
    phone_number: '',
    email: '',
    address: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Enhanced validation functions
  const validateFullName = (name: string): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return 'Customer name is required';
    }
    
    const nameParts = trimmedName.split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) {
      return 'Please provide both first and last name (e.g., "Ahmed Hassan")';
    }
    
    if (trimmedName.length < 3) {
      return 'Name must be at least 3 characters long';
    }
    
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      return 'Phone number is required';
    }
    
    // Basic Somali phone number validation
    const phoneRegex = /^(\+252|252|0)?[1-9]\d{7,8}$/;
    if (!phoneRegex.test(trimmedPhone.replace(/\s+/g, ''))) {
      return 'Please enter a valid phone number (e.g., +252 61 234 5678 or 061 234 5678)';
    }
    
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return null; // Email is optional
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., customer@email.com)';
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const nameError = validateFullName(formData.customer_name);
    if (nameError) errors.customer_name = nameError;
    
    const phoneError = validatePhoneNumber(formData.phone_number);
    if (phoneError) errors.phone_number = phoneError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await customersAPI.create(formData);
      
      // Reset form
      setFormData({
        customer_name: '',
        phone_number: '',
        email: '',
        address: '',
        notes: '',
      });
      setValidationErrors({});
      
      onSuccess();
      onClose();
    } catch (err: any) {
      // Handle specific backend validation errors
      if (err.message.includes('phone number already exists')) {
        setValidationErrors({ phone_number: 'This phone number is already registered with another customer' });
      } else if (err.message.includes('validation')) {
        setError('Please check your input and try again');
      } else {
        setError(err.message || 'Failed to register customer');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('customers.register')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              {t('customers.name')} *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter full name (e.g., Ahmed Hassan)"
            />
            {validationErrors.customer_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{validationErrors.customer_name}</span>
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              {t('customers.phone')} *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+252 61 234 5678 or 061 234 5678"
            />
            {validationErrors.phone_number && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{validationErrors.phone_number}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              {t('customers.email')} (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="customer@email.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{validationErrors.email}</span>
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              {t('customers.address')} (Optional)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer address"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the customer"
            />
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
              <span>{isSubmitting ? 'Registering...' : 'Register Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegistration;