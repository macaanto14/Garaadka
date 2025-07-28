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

interface ThermalReceiptGeneratorProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

const ThermalReceiptGenerator: React.FC<ThermalReceiptGeneratorProps> = ({ receiptData, onClose }) => {
  
  const generateThermalPDF = () => {
    // Create a custom page size for thermal printer (58mm width)
    // 58mm = 164.4 points, but we'll use a bit more for margins
    const pageWidth = 58; // 58mm in mm units
    const doc = new jsPDF({
      unit: 'mm',
      format: [pageWidth, 200], // Start with 200mm height, will auto-extend
      orientation: 'portrait'
    });

    let yPosition = 5;
    const leftMargin = 2;
    const rightMargin = pageWidth - 2;
    const contentWidth = pageWidth - 4;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, x, y, options);
      return y + (lines.length * (options.lineHeight || 3));
    };

    // Helper function to add centered text
    const addCenteredText = (text: string, y: number, fontSize: number = 8, bold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(text, pageWidth / 2, y, { align: 'center' });
      return y + 4;
    };

    // Helper function to add line
    const addLine = (y: number) => {
      doc.line(leftMargin, y, rightMargin, y);
      return y + 2;
    };

    // Header
    yPosition = addCenteredText(receiptData.businessName, yPosition, 10, true);
    yPosition = addCenteredText(receiptData.businessAddress, yPosition, 7);
    yPosition = addCenteredText(receiptData.businessPhone, yPosition, 7);
    yPosition = addLine(yPosition + 1);

    // Receipt title
    yPosition = addCenteredText('ORDER RECEIPT', yPosition, 9, true);
    yPosition += 2;

    // Order info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Order: ${receiptData.orderNumber}`, leftMargin, yPosition);
    yPosition = addText(`Date: ${new Date(receiptData.orderDate).toLocaleDateString()}`, leftMargin, yPosition);
    yPosition = addText(`Status: ${receiptData.status.toUpperCase()}`, leftMargin, yPosition);
    
    if (receiptData.deliveryDate) {
      yPosition = addText(`Delivery: ${new Date(receiptData.deliveryDate).toLocaleDateString()}`, leftMargin, yPosition);
    }

    yPosition = addLine(yPosition + 1);

    // Customer info
    doc.setFont('helvetica', 'bold');
    yPosition = addText('CUSTOMER:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(receiptData.customerName, leftMargin, yPosition);
    yPosition = addText(receiptData.customerPhone, leftMargin, yPosition);

    yPosition = addLine(yPosition + 1);

    // Items header
    doc.setFont('helvetica', 'bold');
    yPosition = addText('ITEMS:', leftMargin, yPosition);
    yPosition = addLine(yPosition);

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    
    receiptData.items.forEach((item) => {
      // Item name and quantity
      yPosition = addText(`${item.name} x${item.quantity}`, leftMargin, yPosition);
      
      // Price line
      const priceText = `ETB ${item.unitPrice.toFixed(2)} = ETB ${item.totalPrice.toFixed(2)}`;
      yPosition = addText(priceText, leftMargin, yPosition);
      
      // Item details (color, size) if available
      if (item.color || item.size) {
        const details = [];
        if (item.color) details.push(`Color: ${item.color}`);
        if (item.size) details.push(`Size: ${item.size}`);
        yPosition = addText(details.join(', '), leftMargin, yPosition);
      }
      
      yPosition += 1; // Small gap between items
    });

    yPosition = addLine(yPosition);

    // Payment summary
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Subtotal
    yPosition = addText(`Subtotal: ETB ${receiptData.totalAmount.toFixed(2)}`, leftMargin, yPosition);
    
    // Discount if any
    if (receiptData.discount > 0) {
      yPosition = addText(`Discount: -ETB ${receiptData.discount.toFixed(2)}`, leftMargin, yPosition);
    }
    
    // Total
    doc.setFont('helvetica', 'bold');
    yPosition = addText(`TOTAL: ETB ${receiptData.totalAmount.toFixed(2)}`, leftMargin, yPosition);
    
    // Payment info
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Paid: ETB ${receiptData.paidAmount.toFixed(2)}`, leftMargin, yPosition);
    
    if (receiptData.remainingAmount > 0) {
      doc.setFont('helvetica', 'bold');
      yPosition = addText(`Balance: ETB ${receiptData.remainingAmount.toFixed(2)}`, leftMargin, yPosition);
    }
    
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Payment: ${receiptData.paymentMethod.toUpperCase()}`, leftMargin, yPosition);
    yPosition = addText(`Status: ${receiptData.paymentStatus.toUpperCase()}`, leftMargin, yPosition);

    yPosition = addLine(yPosition + 1);

    // Notes if any
    if (receiptData.notes) {
      doc.setFont('helvetica', 'bold');
      yPosition = addText('NOTES:', leftMargin, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition = addText(receiptData.notes, leftMargin, yPosition);
      yPosition = addLine(yPosition + 1);
    }

    // Footer
    yPosition += 2;
    yPosition = addCenteredText('Thank you for choosing', yPosition, 6);
    yPosition = addCenteredText('Garaad wil waal Laundry!', yPosition, 7, true);
    yPosition += 2;
    yPosition = addCenteredText(new Date(receiptData.generatedAt).toLocaleString(), yPosition, 5);

    // Add some bottom margin
    yPosition += 5;

    // Save the PDF
    doc.save(`Thermal-Receipt-${receiptData.orderNumber}.pdf`);
  };

  const printThermalReceipt = () => {
    generateThermalPDF();
    // You can also implement direct printing functionality here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Thermal Receipt</h2>
          
          {/* Thermal Receipt Preview */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 font-mono text-xs">
            <div className="text-center mb-3 border-b pb-2">
              <div className="font-bold text-sm">{receiptData.businessName}</div>
              <div className="text-xs">{receiptData.businessAddress}</div>
              <div className="text-xs">{receiptData.businessPhone}</div>
            </div>
            
            <div className="text-center font-bold mb-2">ORDER RECEIPT</div>
            
            <div className="mb-2 text-xs">
              <div>Order: {receiptData.orderNumber}</div>
              <div>Date: {new Date(receiptData.orderDate).toLocaleDateString()}</div>
              <div>Status: {receiptData.status.toUpperCase()}</div>
            </div>
            
            <div className="border-t border-gray-300 pt-2 mb-2">
              <div className="font-bold">CUSTOMER:</div>
              <div>{receiptData.customerName}</div>
              <div>{receiptData.customerPhone}</div>
            </div>
            
            <div className="border-t border-gray-300 pt-2 mb-2">
              <div className="font-bold mb-1">ITEMS:</div>
              {receiptData.items.map((item, index) => (
                <div key={index} className="mb-1">
                  <div>{item.name} x{item.quantity}</div>
                  <div>ETB {item.unitPrice.toFixed(2)} = ETB {item.totalPrice.toFixed(2)}</div>
                  {(item.color || item.size) && (
                    <div className="text-xs text-gray-600">
                      {item.color && `Color: ${item.color}`}
                      {item.color && item.size && ', '}
                      {item.size && `Size: ${item.size}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-300 pt-2 mb-2">
              <div>Subtotal: ETB {receiptData.totalAmount.toFixed(2)}</div>
              {receiptData.discount > 0 && (
                <div>Discount: -ETB {receiptData.discount.toFixed(2)}</div>
              )}
              <div className="font-bold">TOTAL: ETB {receiptData.totalAmount.toFixed(2)}</div>
              <div>Paid: ETB {receiptData.paidAmount.toFixed(2)}</div>
              {receiptData.remainingAmount > 0 && (
                <div className="font-bold">Balance: ETB {receiptData.remainingAmount.toFixed(2)}</div>
              )}
              <div>Payment: {receiptData.paymentMethod.toUpperCase()}</div>
              <div>Status: {receiptData.paymentStatus.toUpperCase()}</div>
            </div>
            
            <div className="border-t border-gray-300 pt-2 text-center">
              <div className="text-xs">Thank you for choosing</div>
              <div className="font-bold">Garaad wil waal Laundry!</div>
              <div className="text-xs mt-1">{new Date(receiptData.generatedAt).toLocaleString()}</div>
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
              onClick={printThermalReceipt}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print Thermal</span>
            </button>
            <button
              onClick={generateThermalPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Thermal PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptGenerator;