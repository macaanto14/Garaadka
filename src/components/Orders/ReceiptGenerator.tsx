import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Printer, Smartphone } from 'lucide-react';
import ThermalReceiptGenerator from './ThermalReceiptGenerator';

interface ReceiptData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  orderNumber: string;
  orderId?: string;        // Auto-generated order ID
  serialNumber?: string;   // Package serial number
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
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  
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
    if (receiptData.orderId) {
      doc.text(`Order ID: ${receiptData.orderId}`, 10, yPosition);
      doc.text(`Status: ${receiptData.status.toUpperCase()}`, pageWidth - 60, yPosition);
      yPosition += 8;
    }
    
    if (receiptData.serialNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Package Serial: ${receiptData.serialNumber}`, 10, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 8;
    }
    
    doc.text(`Due Date: ${new Date(receiptData.dueDate).toLocaleDateString()}`, 10, yPosition);
    
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
      doc.text(`ETB ${item.unitPrice.toFixed(2)}`, 110, yPosition);
      doc.text(`ETB ${item.totalPrice.toFixed(2)}`, 150, yPosition);
      
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
    doc.text(`Subtotal: ETB ${receiptData.totalAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    if (receiptData.discount > 0) {
      doc.text(`Discount: -ETB ${receiptData.discount.toFixed(2)}`, 120, yPosition);
      yPosition += 6;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ETB ${receiptData.totalAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid Amount: ETB ${receiptData.paidAmount.toFixed(2)}`, 120, yPosition);
    yPosition += 6;
    
    if (receiptData.remainingAmount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Remaining: ETB ${receiptData.remainingAmount.toFixed(2)}`, 120, yPosition);
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
      const noteLines = doc.splitTextToSize(receiptData.notes, pageWidth - 20);
      doc.text(noteLines, 10, yPosition);
      yPosition += noteLines.length * 6;
    }

    // Footer
    yPosition += 15;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date(receiptData.generatedAt).toLocaleString()}`, 10, yPosition);
    
    // Package Serial Number prominently displayed at bottom
    if (receiptData.serialNumber) {
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`PACKAGE SERIAL: ${receiptData.serialNumber}`, pageWidth / 2, yPosition, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Please keep this serial number for package identification', pageWidth / 2, yPosition + 6, { align: 'center' });
    }

    doc.save(`receipt-${receiptData.orderNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleThermalReceipt = () => {
    setShowThermalReceipt(true);
  };

  const handleCloseThermalReceipt = () => {
    setShowThermalReceipt(false);
  };

  if (showThermalReceipt) {
    return (
      <ThermalReceiptGenerator
        receiptData={receiptData}
        onClose={handleCloseThermalReceipt}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Order Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Receipt Preview */}
          <div className="bg-white border border-gray-300 rounded-lg p-8 mb-6 font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold">{receiptData.businessName}</h1>
              <p>{receiptData.businessAddress}</p>
              <p>{receiptData.businessPhone}</p>
            </div>

            <div className="border-t border-b border-gray-300 py-4 mb-6">
              <h2 className="text-lg font-bold text-center">ORDER RECEIPT</h2>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p><strong>Order Number:</strong> {receiptData.orderNumber}</p>
                {receiptData.orderId && <p><strong>Order ID:</strong> {receiptData.orderId}</p>}
                {receiptData.serialNumber && (
                  <p className="text-green-600 font-bold">
                    <strong>Package Serial:</strong> {receiptData.serialNumber}
                  </p>
                )}
                <p><strong>Date:</strong> {new Date(receiptData.orderDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> {new Date(receiptData.dueDate).toLocaleDateString()}</p>
                {receiptData.deliveryDate && (
                  <p><strong>Delivery Date:</strong> {new Date(receiptData.deliveryDate).toLocaleDateString()}</p>
                )}
              </div>
              <div>
                <p><strong>Status:</strong> {receiptData.status.toUpperCase()}</p>
                <p><strong>Payment Status:</strong> {receiptData.paymentStatus.toUpperCase()}</p>
                <p><strong>Payment Method:</strong> {receiptData.paymentMethod.toUpperCase()}</p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t border-gray-300 pt-4 mb-6">
              <h3 className="font-bold mb-2">CUSTOMER INFORMATION</h3>
              <p><strong>Name:</strong> {receiptData.customerName}</p>
              <p><strong>Phone:</strong> {receiptData.customerPhone}</p>
              {receiptData.customerEmail && <p><strong>Email:</strong> {receiptData.customerEmail}</p>}
              {receiptData.customerAddress && <p><strong>Address:</strong> {receiptData.customerAddress}</p>}
            </div>

            {/* Items */}
            <div className="border-t border-gray-300 pt-4 mb-6">
              <h3 className="font-bold mb-2">ITEMS</h3>
              <div className="space-y-2">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span>ETB {item.totalPrice.toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <p className="text-gray-600 text-xs">{item.description}</p>
                    )}
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Qty: {item.quantity} × ETB {item.unitPrice.toFixed(2)}</span>
                      <span>Color: {item.color || 'N/A'}, Size: {item.size || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-300 pt-4 mb-6">
              <h3 className="font-bold mb-2">PAYMENT SUMMARY</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>ETB {receiptData.totalAmount.toFixed(2)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-ETB {receiptData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                  <span>Total Amount:</span>
                  <span>ETB {receiptData.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span>ETB {receiptData.paidAmount.toFixed(2)}</span>
                </div>
                {receiptData.remainingAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Remaining:</span>
                    <span>ETB {receiptData.remainingAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {receiptData.notes && (
              <div className="border-t border-gray-300 pt-4 mb-6">
                <h3 className="font-bold mb-2">NOTES</h3>
                <p className="text-gray-700">{receiptData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
              <p>Generated on: {new Date(receiptData.generatedAt).toLocaleString()}</p>
              {receiptData.serialNumber && (
                <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="font-bold text-green-800">PACKAGE SERIAL: {receiptData.serialNumber}</p>
                  <p className="text-green-600">Please keep this serial number for package identification</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={generatePDF}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleThermalReceipt}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Smartphone className="h-4 w-4" />
              <span>Thermal Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptGenerator;