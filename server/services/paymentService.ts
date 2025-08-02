import { db } from '../index.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface PaymentData {
  order_id: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  processed_by: string;
}

export interface PaymentFilter {
  search?: string;
  payment_method?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export class PaymentService {
  
  static async validatePayment(paymentData: PaymentData): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if order exists
      const [orders] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM orders WHERE order_id = ? AND deleted_at IS NULL',
        [paymentData.order_id]
      );

      if (orders.length === 0) {
        return { valid: false, error: 'Order not found' };
      }

      const order = orders[0];
      const orderTotal = parseFloat(order.total_amount);
      const currentPaid = parseFloat(order.paid_amount) || 0;
      const paymentAmount = parseFloat(paymentData.amount.toString());

      // Check if payment amount is valid
      if (paymentAmount <= 0) {
        return { valid: false, error: 'Payment amount must be greater than 0' };
      }

      // Check if payment doesn't exceed outstanding balance
      const outstanding = orderTotal - currentPaid;
      if (paymentAmount > outstanding) {
        return { valid: false, error: `Payment amount exceeds outstanding balance of $${outstanding}` };
      }

      // Validate payment method
      const [methods] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM payment_methods WHERE method_code = ? AND is_active = TRUE',
        [paymentData.payment_method]
      );

      if (methods.length === 0) {
        return { valid: false, error: 'Invalid or inactive payment method' };
      }

      return { valid: true };

    } catch (error) {
      console.error('Error validating payment:', error);
      return { valid: false, error: 'Validation error' };
    }
  }

  static async calculateOrderPaymentStatus(orderId: number): Promise<string> {
    try {
      const [orders] = await db.execute<RowDataPacket[]>(
        'SELECT total_amount, paid_amount FROM orders WHERE order_id = ?',
        [orderId]
      );

      if (orders.length === 0) {
        return 'unpaid';
      }

      const order = orders[0];
      const total = parseFloat(order.total_amount);
      const paid = parseFloat(order.paid_amount) || 0;

      if (paid >= total) {
        return 'paid';
      } else if (paid > 0) {
        return 'partial';
      } else {
        return 'unpaid';
      }

    } catch (error) {
      console.error('Error calculating payment status:', error);
      return 'unpaid';
    }
  }

  static async getOutstandingPayments(): Promise<any[]> {
    try {
      const [results] = await db.execute<RowDataPacket[]>(
        `SELECT 
          o.order_id,
          o.order_number,
          o.total_amount,
          o.paid_amount,
          (o.total_amount - o.paid_amount) as outstanding_amount,
          o.due_date,
          o.payment_status,
          c.customer_name,
          c.phone_number,
          DATEDIFF(CURDATE(), o.due_date) as days_overdue
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.payment_status IN ('unpaid', 'partial') 
         AND o.deleted_at IS NULL
         ORDER BY o.due_date ASC`
      );

      return results;

    } catch (error) {
      console.error('Error fetching outstanding payments:', error);
      return [];
    }
  }

  static async getPaymentAnalytics(dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      let dateFilter = '';
      const queryParams: any[] = [];

      if (dateFrom && dateTo) {
        dateFilter = 'WHERE date BETWEEN ? AND ?';
        queryParams.push(dateFrom, dateTo);
      } else if (dateFrom) {
        dateFilter = 'WHERE date >= ?';
        queryParams.push(dateFrom);
      } else if (dateTo) {
        dateFilter = 'WHERE date <= ?';
        queryParams.push(dateTo);
      }

      const [analytics] = await db.execute<RowDataPacket[]>(
        `SELECT 
          date,
          payment_method,
          total_amount,
          total_count,
          avg_amount
         FROM payment_analytics 
         ${dateFilter}
         ORDER BY date DESC, payment_method`,
        queryParams
      );

      return analytics;

    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      return [];
    }
  }

  static async searchCustomersByPhone(phone: string): Promise<any[]> {
    try {
      const [customers] = await db.execute<RowDataPacket[]>(
        `SELECT 
          c.*,
          COUNT(o.order_id) as total_orders,
          SUM(CASE WHEN o.payment_status IN ('unpaid', 'partial') THEN (o.total_amount - o.paid_amount) ELSE 0 END) as outstanding_amount
         FROM customers c
         LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.deleted_at IS NULL
         WHERE c.phone_number LIKE ? AND c.status = 'active'
         GROUP BY c.customer_id
         ORDER BY c.customer_name`,
        [`%${phone}%`]
      );

      return customers;

    } catch (error) {
      console.error('Error searching customers by phone:', error);
      return [];
    }
  }

  static async getCustomerOutstandingOrders(customerId: number): Promise<any[]> {
    try {
      const [orders] = await db.execute<RowDataPacket[]>(
        `SELECT 
          o.*,
          (o.total_amount - o.paid_amount) as outstanding_amount,
          DATEDIFF(CURDATE(), o.due_date) as days_overdue
         FROM orders o
         WHERE o.customer_id = ? 
         AND o.payment_status IN ('unpaid', 'partial')
         AND o.deleted_at IS NULL
         ORDER BY o.due_date ASC`,
        [customerId]
      );

      return orders;

    } catch (error) {
      console.error('Error fetching customer outstanding orders:', error);
      return [];
    }
  }
}