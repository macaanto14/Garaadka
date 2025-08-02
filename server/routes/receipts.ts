import express from 'express';
import { db } from '../index';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Generate receipt data for PDF
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Get order with customer info (around line 12-19)
    const [orderRows] = await db.execute<RowDataPacket[]>(
      `SELECT 
        o.*,
        c.customer_name,
        c.phone_number
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const [items] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // Get payments
    const [payments] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC',
      [orderId]
    );

    const order = orderRows[0];
    const receiptData = {
      // Business Info
      businessName: 'Garaad wil waal Laundry',
      businessAddress: 'Mogadishu, Somalia',
      businessPhone: '+252-XX-XXX-XXXX',
      
      // Order Info
      orderNumber: order.order_number,
      orderDate: order.order_date,
      dueDate: order.due_date,
      deliveryDate: order.delivery_date,
      status: order.status,
      
      // Customer Info (around line 58-60)
      customerName: order.customer_name,
      customerPhone: order.phone_number,
      customerEmail: null, // Not available in current schema
      customerAddress: null, // Not available in current schema
      
      // Items
      items: items.map(item => ({
        name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        color: item.color,
        size: item.size,
        specialInstructions: item.special_instructions
      })),
      
      // Payment Info
      totalAmount: order.total_amount,
      paidAmount: order.paid_amount,
      remainingAmount: order.total_amount - order.paid_amount,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      discount: order.discount,
      
      // Payments History
      payments: payments.map(payment => ({
        date: payment.payment_date,
        amount: payment.amount,
        method: payment.payment_method,
        reference: payment.reference_number
      })),
      
      // Additional Info
      notes: order.notes,
      generatedAt: new Date().toISOString(),
      generatedBy: 'System'
    };

    res.json(receiptData);

  } catch (error) {
    console.error('Error generating receipt data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;