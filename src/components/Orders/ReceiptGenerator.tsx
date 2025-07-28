import React from 'react';
import jsPDF from 'jspdf';
import { Download, Printer } from 'lucide-react';

interface ReceiptData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  orderNumber: string;
  orderDate: string;
  dueDate: string;
  deliveryDate?: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    color?: string;
    size?: string;
  }>;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  discount: number;
  notes?: string;
  generatedAt: string;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ receiptData, onClose }) => {
  
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(receiptData.businessName, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.businessAddress, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.text(receiptData.businessPhone, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Order Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Order Details
    doc.text(`Order Number: ${receiptData.orderNumber}`, 10, yPosition);
    doc.text(`Date: ${new Date(receiptData.orderDate).toLocaleDateString()}`, pageWidth - 60, yPosition);
    
    yPosition += 8;
    doc.text(`Due Date: ${new Date(receiptData.dueDate).toLocaleDateString()}`, 10, yPosition);
    doc.text(`Status: ${receiptData.status.toUpperCase()}`, pageWidth - 60, yPosition);
    
    if (receiptData.deliveryDate) {
      yPosition += 8;
      doc.text(`Delivery Date: ${new Date(receiptData.deliveryDate).toLocaleDateString()}`, 10, yPosition);
    }

    yPosition += 15;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Customer Information
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${receiptData.customerName}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Phone: ${receiptData.customerPhone}`, 10, yPosition);
    
    if (receiptData.customerEmail) {
      yPosition += 6;
      doc.text(`Email: ${receiptData.customerEmail}`, 10, yPosition);
    }
    
    if (receiptData.customerAddress) {
      yPosition += 6;
      doc.text(`Address: ${receiptData.customerAddress}`, 10, yPosition);
    }

    yPosition += 15;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Items Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('ITEMS', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Item', 10, yPosition);
    doc.text('Qty', 80, yPosition);
    doc.text('Price', 110, yPosition);
    doc.text('Total', 150, yPosition);
    
    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 8;

    // Items
    receiptData.items.forEach((item) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(item.name, 10, yPosition);
      if (item.description) {
        yPosition += 5;
        doc.setFontSize(8);
        doc.text(`  ${item.description}`, 10, yPosition);
        doc.setFontSize(10);
      }
      
      doc.text(item.quantity.toString(), 80, yPosition);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 110, yPosition);
      doc.text(`$${item.totalPrice.toFixed(2)}`, 150, yPosition);
      
      if (item.color || item.size) {
        yPosition += 5;
        doc.setFontSize(8);
        doc.text(`  Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}`, 10, yPosition);
        doc.setFontSize(10);
      }
      
      yPosition += 10;
    });

    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;

    // Payment Summary
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', 10, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: $${receiptData.totalAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    if (receiptData.discount > 0) {
      doc.text(`Discount: -$${receiptData.discount.toFixed(2)}`, 120, yPosition);
      yPosition += 6;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: $${receiptData.totalAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid Amount: $${receiptData.paidAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    if (receiptData.remainingAmount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Remaining: $${receiptData.remainingAmount.toFixed(2)}`, 120, yPosition);
    }
    
    yPosition += 10;
    doc.text(`Payment Method: ${receiptData.paymentMethod.toUpperCase()}`, 10, yPosition);
    yPosition += 6;
    doc.text(`Payment Status: ${receiptData.paymentStatus.toUpperCase()}`, 10, yPosition);

    // Notes
    if (receiptData.notes) {
      yPosition += 15;
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', 10, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(receiptData.notes, pageWidth - 20);
      doc.text(splitNotes, 10, yPosition);
    }

    // Footer
    yPosition = doc.internal.pageSize.height - 30;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.text('Thank you for choosing Garaad wil waal Laundry!', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Generated on: ${new Date(receiptData.generatedAt).toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    // Save the PDF
    doc.save(`Receipt-${receiptData.orderNumber}.pdf`);
  };

  const printReceipt = () => {
    generatePDF();
    // You can also implement direct printing functionality here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Receipt</h2>
          
          {/* Receipt Preview */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{receiptData.businessName}</h3>
              <p className="text-gray-600">{receiptData.businessAddress}</p>
              <p className="text-gray-600">{receiptData.businessPhone}</p>
            </div>
            
            <div className="border-t border-gray-300 pt-4 mb-4">
              <h4 className="font-bold text-center mb-2">ORDER RECEIPT</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Order:</strong> {receiptData.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date(receiptData.orderDate).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {receiptData.status}</p>
                </div>
                <div>
                  <p><strong>Customer:</strong> {receiptData.customerName}</p>
                  <p><strong>Phone:</strong> {receiptData.customerPhone}</p>
                  <p><strong>Payment:</strong> {receiptData.paymentStatus}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-300 pt-4">
              <h5 className="font-bold mb-2">Items:</h5>
              {receiptData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-1">
                  <span>{item.name} ({item.quantity}x)</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${receiptData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={printReceipt}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={generatePDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;