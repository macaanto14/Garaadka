import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Eye, FileText, Calendar, DollarSign, User, Phone, Mail, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import { ordersAPI } from '../../services/api';
import { Toast } from '../../utils/Toast';

interface InvoiceData {
  // Order Information
  orderId: number;
  orderNumber: string;
  orderDate: string;
  dueDate: string;
  deliveryDate?: string;
  status: string;
  
  // Customer Information
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  
  // Business Information
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail?: string;
  
  // Items
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    color?: string;
    size?: string;
    specialInstructions?: string;
  }>;
  
  // Financial
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  
  // Additional
  notes?: string;
  generatedAt: string;
}

interface InvoiceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: number;
    orderNumber: string;
    customerData: any;
    items: any[];
    totalAmount: number;
    discount?: number;
    paymentStatus: string;
    paymentMethod: string;
    dueDate: string;
    deliveryDate?: string;
    notes?: string;
  };
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ isOpen, onClose, orderData }) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [customizations, setCustomizations] = useState({
    includeBusinessLogo: true,
    includeCustomerAddress: true,
    includeItemDetails: true,
    includePaymentTerms: true,
    includeNotes: true,
    headerColor: '#2563eb',
    fontSize: 'medium'
  });

  useEffect(() => {
    if (isOpen && orderData) {
      loadInvoiceData();
    }
  }, [isOpen, orderData]);

  const loadInvoiceData = async () => {
    setIsLoading(true);
    try {
      // Fetch complete order details
      const orderDetails = await ordersAPI.getById(orderData.orderId.toString());
      
      const invoice: InvoiceData = {
        // Order Information
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        orderDate: new Date().toISOString(),
        dueDate: orderData.dueDate,
        deliveryDate: orderData.deliveryDate,
        status: orderDetails.status || 'pending',
        
        // Customer Information
        customerName: orderData.customerData.customer_name || orderData.customerData.name,
        customerPhone: orderData.customerData.phone_number || orderData.customerData.phone,
        customerEmail: orderData.customerData.email,
        customerAddress: orderData.customerData.address,
        
        // Business Information
        businessName: 'Garaad wil waal Laundry',
        businessAddress: 'Addis Ababa, Ethiopia',
        businessPhone: '+251-911-123456',
        businessEmail: 'info@garaadlaundry.com',
        
        // Items
        items: orderData.items.map(item => ({
          name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.quantity * item.unit_price,
          color: item.color,
          size: item.size,
          specialInstructions: item.special_instructions
        })),
        
        // Financial
        subtotal: orderData.totalAmount + (orderData.discount || 0),
        discount: orderData.discount || 0,
        totalAmount: orderData.totalAmount,
        paidAmount: orderData.paymentStatus === 'paid' ? orderData.totalAmount : 0,
        remainingAmount: orderData.paymentStatus === 'paid' ? 0 : orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        
        // Additional
        notes: orderData.notes,
        generatedAt: new Date().toISOString()
      };
      
      setInvoiceData(invoice);
    } catch (error) {
      console.error('Failed to load invoice data:', error);
      Toast.error('Error', 'Failed to load invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    if (!invoiceData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header with business info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text(invoiceData.businessName, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceData.businessAddress, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text(`Phone: ${invoiceData.businessPhone}`, pageWidth / 2, yPosition, { align: 'center' });
    
    if (invoiceData.businessEmail) {
      yPosition += 5;
      doc.text(`Email: ${invoiceData.businessEmail}`, pageWidth / 2, yPosition, { align: 'center' });
    }

    yPosition += 20;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 15;

    // Invoice title and details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 10, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceData.orderNumber}`, pageWidth - 60, yPosition);
    
    yPosition += 8;
    doc.text(`Date: ${new Date(invoiceData.orderDate).toLocaleDateString()}`, pageWidth - 60, yPosition);
    
    yPosition += 5;
    doc.text(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, pageWidth - 60, yPosition);
    
    if (invoiceData.deliveryDate) {
      yPosition += 5;
      doc.text(`Delivery: ${new Date(invoiceData.deliveryDate).toLocaleDateString()}`, pageWidth - 60, yPosition);
    }

    // Customer information
    yPosition += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 10, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.customerName, 10, yPosition);
    
    yPosition += 5;
    doc.text(`Phone: ${invoiceData.customerPhone}`, 10, yPosition);
    
    if (invoiceData.customerEmail) {
      yPosition += 5;
      doc.text(`Email: ${invoiceData.customerEmail}`, 10, yPosition);
    }
    
    if (invoiceData.customerAddress) {
      yPosition += 5;
      doc.text(`Address: ${invoiceData.customerAddress}`, 10, yPosition);
    }

    yPosition += 15;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Items table header
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS & SERVICES', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Description', 10, yPosition);
    doc.text('Qty', 120, yPosition);
    doc.text('Rate', 140, yPosition);
    doc.text('Amount', 170, yPosition);
    
    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 8;

    // Items
    invoiceData.items.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.name, 10, yPosition);
      if (item.description) {
        yPosition += 4;
        doc.setFontSize(8);
        doc.text(`  ${item.description}`, 10, yPosition);
        doc.setFontSize(10);
      }
      
      if (item.color || item.size) {
        yPosition += 4;
        doc.setFontSize(8);
        doc.text(`  Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}`, 10, yPosition);
        doc.setFontSize(10);
      }
      
      if (item.specialInstructions) {
        yPosition += 4;
        doc.setFontSize(8);
        doc.text(`  Special: ${item.specialInstructions}`, 10, yPosition);
        doc.setFontSize(10);
      }
      
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(`ETB ${item.unitPrice.toFixed(2)}`, 140, yPosition);
      doc.text(`ETB ${item.totalPrice.toFixed(2)}`, 170, yPosition);
      
      yPosition += 12;
    });

    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: ETB ${invoiceData.subtotal.toFixed(2)}`, 140, yPosition);
    yPosition += 6;
    
    if (invoiceData.discount > 0) {
      doc.text(`Discount: -ETB ${invoiceData.discount.toFixed(2)}`, 140, yPosition);
      yPosition += 6;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL: ETB ${invoiceData.totalAmount.toFixed(2)}`, 140, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${invoiceData.paymentMethod.toUpperCase()}`, 140, yPosition);
    yPosition += 5;
    doc.text(`Payment Status: ${invoiceData.paymentStatus.toUpperCase()}`, 140, yPosition);
    
    if (invoiceData.remainingAmount > 0) {
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`Amount Due: ETB ${invoiceData.remainingAmount.toFixed(2)}`, 140, yPosition);
    }

    // Notes
    if (invoiceData.notes && customizations.includeNotes) {
      yPosition += 15;
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES:', 10, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoiceData.notes, pageWidth - 20);
      doc.text(splitNotes, 10, yPosition);
    }

    // Footer
    yPosition = doc.internal.pageSize.height - 30;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.text('Thank you for choosing Garaad wil waal Laundry!', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Generated on: ${new Date(invoiceData.generatedAt).toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save the PDF
    doc.save(`Invoice-${invoiceData.orderNumber}.pdf`);
    Toast.success('Success', 'Invoice PDF downloaded successfully');
  };

  const printInvoice = () => {
    generatePDF();
    Toast.info('Print', 'Invoice has been prepared for printing');
  };

  const emailInvoice = () => {
    if (!invoiceData?.customerEmail) {
      Toast.error('Error', 'Customer email not available');
      return;
    }
    Toast.info('Email', 'Email functionality will be implemented soon');
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Loading invoice data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <div className="text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Invoice</h3>
            <p className="text-gray-600 mb-4">Unable to load invoice data</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Invoice Manager</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {invoiceData.orderNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Customization Panel */}
          <div className="w-80 border-r border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customizations.includeBusinessLogo}
                    onChange={(e) => setCustomizations({...customizations, includeBusinessLogo: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Business Logo</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customizations.includeCustomerAddress}
                    onChange={(e) => setCustomizations({...customizations, includeCustomerAddress: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Customer Address</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customizations.includeItemDetails}
                    onChange={(e) => setCustomizations({...customizations, includeItemDetails: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Item Details</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customizations.includeNotes}
                    onChange={(e) => setCustomizations({...customizations, includeNotes: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include Notes</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Color</label>
                <input
                  type="color"
                  value={customizations.headerColor}
                  onChange={(e) => setCustomizations({...customizations, headerColor: e.target.value})}
                  className="w-full h-8 rounded border border-gray-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <select
                  value={customizations.fontSize}
                  onChange={(e) => setCustomizations({...customizations, fontSize: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={generatePDF}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              
              <button
                onClick={printInvoice}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              
              {invoiceData.customerEmail && (
                <button
                  onClick={emailInvoice}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email to Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Invoice Preview */}
          {showPreview && (
            <div className="flex-1 p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                {/* Business Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-blue-600 mb-2">{invoiceData.businessName}</h1>
                  <p className="text-gray-600">{invoiceData.businessAddress}</p>
                  <p className="text-gray-600">Phone: {invoiceData.businessPhone}</p>
                  {invoiceData.businessEmail && (
                    <p className="text-gray-600">Email: {invoiceData.businessEmail}</p>
                  )}
                </div>

                <hr className="border-gray-300 mb-8" />

                {/* Invoice Details */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">INVOICE</h2>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{invoiceData.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{invoiceData.customerPhone}</span>
                      </div>
                      {invoiceData.customerEmail && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{invoiceData.customerEmail}</span>
                        </div>
                      )}
                      {invoiceData.customerAddress && customizations.includeCustomerAddress && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{invoiceData.customerAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="space-y-1 text-sm">
                      <p><strong>Invoice #:</strong> {invoiceData.orderNumber}</p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(invoiceData.orderDate).toLocaleDateString()}</span>
                      </div>
                      <p><strong>Due Date:</strong> {new Date(invoiceData.dueDate).toLocaleDateString()}</p>
                      {invoiceData.deliveryDate && (
                        <p><strong>Delivery:</strong> {new Date(invoiceData.deliveryDate).toLocaleDateString()}</p>
                      )}
                      <p><strong>Status:</strong> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          invoiceData.status === 'completed' ? 'bg-green-100 text-green-800' :
                          invoiceData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoiceData.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items & Services</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2">
                              <div className="font-medium">{item.name}</div>
                              {item.description && customizations.includeItemDetails && (
                                <div className="text-sm text-gray-600">{item.description}</div>
                              )}
                              {(item.color || item.size) && customizations.includeItemDetails && (
                                <div className="text-xs text-gray-500">
                                  Color: {item.color || 'N/A'}, Size: {item.size || 'N/A'}
                                </div>
                              )}
                              {item.specialInstructions && customizations.includeItemDetails && (
                                <div className="text-xs text-blue-600">Special: {item.specialInstructions}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">ETB {item.unitPrice.toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">ETB {item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${invoiceData.subtotal.toFixed(2)}</span>
                      </div>
                      {invoiceData.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>-${invoiceData.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <hr className="border-gray-300" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL:</span>
                        <span>${invoiceData.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="capitalize">{invoiceData.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Status:</span>
                          <span className={`capitalize ${
                            invoiceData.paymentStatus === 'paid' ? 'text-green-600' :
                            invoiceData.paymentStatus === 'partial' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {invoiceData.paymentStatus}
                          </span>
                        </div>
                        {invoiceData.remainingAmount > 0 && (
                          <div className="flex justify-between font-semibold text-red-600">
                            <span>Amount Due:</span>
                            <span>${invoiceData.remainingAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoiceData.notes && customizations.includeNotes && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{invoiceData.notes}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <hr className="border-gray-300 mb-4" />
                <div className="text-center text-sm text-gray-600">
                  <p className="font-medium">Thank you for choosing Garaad wil waal Laundry!</p>
                  <p>Generated on: {new Date(invoiceData.generatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;