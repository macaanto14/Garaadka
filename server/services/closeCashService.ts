import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface DailySummaryData {
  date: string;
  orders: {
    total_orders: number;
    total_order_value: number;
    total_paid_amount: number;
    total_unpaid_amount: number;
    fully_paid_orders: number;
    partially_paid_orders: number;
    unpaid_orders: number;
  };
  payments: Array<{
    payment_method: string;
    total_amount: number;
    transaction_count: number;
  }>;
  cashTransactions: {
    cash_received: number;
    cash_transaction_count: number;
  };
  expenses: {
    total_expenses: number;
    expense_count: number;
  };
  yesterdayClose: {
    cash_amount: number;
    total_amount: number;
  };
}

export interface CashCloseData {
  close_date: string;
  cash_amount: number;
  card_amount: number;
  mobile_amount: number;
  bank_transfer_amount: number;
  total_amount: number;
  expenses_amount?: number;
  notes?: string;
}

export interface CashCloseRecord extends CashCloseData {
  close_id: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface CashCloseHistoryOptions {
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
}

export interface CashCloseHistoryResult {
  records: CashCloseRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CloseCashService {
  
  /**
   * Get daily financial summary for cash close
   */
  static async getDailySummary(date?: string): Promise<DailySummaryData> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Get today's orders summary
      const [ordersStats] = await db.execute<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_order_value,
          SUM(paid_amount) as total_paid_amount,
          SUM(total_amount - paid_amount) as total_unpaid_amount,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as fully_paid_orders,
          COUNT(CASE WHEN payment_status = 'partial' THEN 1 END) as partially_paid_orders,
          COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_orders
         FROM orders 
         WHERE DATE(order_date) = ? AND deleted_at IS NULL`,
        [targetDate]
      );

      // Get today's payments by method
      const [paymentsStats] = await db.execute<RowDataPacket[]>(
        `SELECT 
          payment_method,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
         FROM payments 
         WHERE DATE(payment_date) = ? AND deleted_at IS NULL AND status = 'completed'
         GROUP BY payment_method`,
        [targetDate]
      );

      // Get yesterday's close cash amount
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [yesterdayClose] = await db.execute<RowDataPacket[]>(
        `SELECT cash_amount, total_amount FROM daily_cash_close 
         WHERE close_date = ? ORDER BY created_at DESC LIMIT 1`,
        [yesterdayStr]
      );

      // Get cash transactions for today
      const [cashTransactions] = await db.execute<RowDataPacket[]>(
        `SELECT 
          SUM(amount) as cash_received,
          COUNT(*) as cash_transaction_count
         FROM payments 
         WHERE DATE(payment_date) = ? AND payment_method = 'cash' 
         AND deleted_at IS NULL AND status = 'completed'`,
        [targetDate]
      );

      // Get expenses for today (if expenses table exists)
      const [expensesStats] = await db.execute<RowDataPacket[]>(
        `SELECT 
          COALESCE(SUM(amount), 0) as total_expenses,
          COUNT(*) as expense_count
         FROM expenses 
         WHERE DATE(expense_date) = ? AND deleted_at IS NULL`,
        [targetDate]
      ).catch(() => [{ total_expenses: 0, expense_count: 0 }]);

      return {
        date: targetDate,
        orders: ordersStats[0] as any,
        payments: paymentsStats as any,
        cashTransactions: cashTransactions[0] as any,
        expenses: expensesStats[0] || { total_expenses: 0, expense_count: 0 },
        yesterdayClose: yesterdayClose[0] || { cash_amount: 0, total_amount: 0 }
      };

    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw new Error('Failed to fetch daily summary');
    }
  }

  /**
   * Validate cash close data before processing
   */
  static async validateCashClose(data: CashCloseData): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check required fields
      if (!data.close_date || data.total_amount === undefined) {
        return { valid: false, error: 'Close date and total amount are required' };
      }

      // Check if cash has already been closed for this date
      const [existingClose] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM daily_cash_close WHERE close_date = ?',
        [data.close_date]
      );

      if (existingClose.length > 0) {
        return { valid: false, error: 'Cash has already been closed for this date' };
      }

      // Validate amounts are non-negative
      const amounts = [
        data.cash_amount,
        data.card_amount,
        data.mobile_amount,
        data.bank_transfer_amount,
        data.total_amount,
        data.expenses_amount || 0
      ];

      if (amounts.some(amount => amount < 0)) {
        return { valid: false, error: 'Amounts cannot be negative' };
      }

      // Validate total amount calculation
      const calculatedTotal = (data.cash_amount || 0) + 
                             (data.card_amount || 0) + 
                             (data.mobile_amount || 0) + 
                             (data.bank_transfer_amount || 0);

      if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
        return { 
          valid: false, 
          error: `Total amount (${data.total_amount}) does not match sum of payment methods (${calculatedTotal})` 
        };
      }

      return { valid: true };

    } catch (error) {
      console.error('Error validating cash close:', error);
      return { valid: false, error: 'Validation error' };
    }
  }

  /**
   * Close cash for the day
   */
  static async closeCash(data: CashCloseData, auditFields: any): Promise<{ success: boolean; close_id?: number; error?: string }> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validate the data first
      const validation = await this.validateCashClose(data);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create the daily cash close record
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO daily_cash_close 
         (close_date, cash_amount, card_amount, mobile_amount, bank_transfer_amount, 
          total_amount, expenses_amount, notes, ${Object.keys(auditFields).join(', ')})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${Object.values(auditFields).map(() => '?').join(', ')})`,
        [
          data.close_date,
          data.cash_amount || 0,
          data.card_amount || 0,
          data.mobile_amount || 0,
          data.bank_transfer_amount || 0,
          data.total_amount,
          data.expenses_amount || 0,
          data.notes || '',
          ...Object.values(auditFields)
        ]
      );

      await connection.commit();

      return {
        success: true,
        close_id: result.insertId
      };

    } catch (error) {
      await connection.rollback();
      console.error('Error closing cash:', error);
      return { success: false, error: 'Failed to close cash' };
    } finally {
      connection.release();
    }
  }

  /**
   * Get cash close history with pagination and filtering
   */
  static async getCashCloseHistory(options: CashCloseHistoryOptions = {}): Promise<CashCloseHistoryResult> {
    try {
      const {
        page = 1,
        limit = 10,
        date_from,
        date_to
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      if (date_from) {
        whereClause += ' AND close_date >= ?';
        queryParams.push(date_from);
      }

      if (date_to) {
        whereClause += ' AND close_date <= ?';
        queryParams.push(date_to);
      }

      // Get total count
      const [countResult] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM daily_cash_close ${whereClause}`,
        queryParams
      );

      // Get cash close records
      const [records] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM daily_cash_close 
         ${whereClause}
         ORDER BY close_date DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      return {
        records: records as CashCloseRecord[],
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

    } catch (error) {
      console.error('Error fetching cash close history:', error);
      throw new Error('Failed to fetch cash close history');
    }
  }

  /**
   * Get specific cash close record by ID
   */
  static async getCashCloseById(id: number): Promise<CashCloseRecord | null> {
    try {
      const [records] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM daily_cash_close WHERE close_id = ?',
        [id]
      );

      return records.length > 0 ? records[0] as CashCloseRecord : null;

    } catch (error) {
      console.error('Error fetching cash close record:', error);
      throw new Error('Failed to fetch cash close record');
    }
  }

  /**
   * Update cash close record
   */
  static async updateCashClose(
    id: number, 
    data: Partial<CashCloseData>, 
    auditFields: any
  ): Promise<{ success: boolean; error?: string }> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if record exists
      const existing = await this.getCashCloseById(id);
      if (!existing) {
        return { success: false, error: 'Cash close record not found' };
      }

      // If total_amount is being updated, validate the calculation
      if (data.total_amount !== undefined) {
        const cash_amount = data.cash_amount ?? existing.cash_amount;
        const card_amount = data.card_amount ?? existing.card_amount;
        const mobile_amount = data.mobile_amount ?? existing.mobile_amount;
        const bank_transfer_amount = data.bank_transfer_amount ?? existing.bank_transfer_amount;
        
        const calculatedTotal = cash_amount + card_amount + mobile_amount + bank_transfer_amount;
        
        if (Math.abs(calculatedTotal - data.total_amount) > 0.01) {
          return { 
            success: false, 
            error: `Total amount (${data.total_amount}) does not match sum of payment methods (${calculatedTotal})` 
          };
        }
      }

      // Update the record
      await connection.execute(
        `UPDATE daily_cash_close 
         SET cash_amount = ?, card_amount = ?, mobile_amount = ?, 
             bank_transfer_amount = ?, total_amount = ?, expenses_amount = ?, 
             notes = ?, ${Object.keys(auditFields).map(key => `${key} = ?`).join(', ')}
         WHERE close_id = ?`,
        [
          data.cash_amount ?? existing.cash_amount,
          data.card_amount ?? existing.card_amount,
          data.mobile_amount ?? existing.mobile_amount,
          data.bank_transfer_amount ?? existing.bank_transfer_amount,
          data.total_amount ?? existing.total_amount,
          data.expenses_amount ?? existing.expenses_amount,
          data.notes ?? existing.notes,
          ...Object.values(auditFields),
          id
        ]
      );

      await connection.commit();

      return { success: true };

    } catch (error) {
      await connection.rollback();
      console.error('Error updating cash close record:', error);
      return { success: false, error: 'Failed to update cash close record' };
    } finally {
      connection.release();
    }
  }

  /**
   * Get cash close analytics for a date range
   */
  static async getCashCloseAnalytics(dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      let whereClause = 'WHERE 1=1';
      const queryParams: any[] = [];

      if (dateFrom) {
        whereClause += ' AND close_date >= ?';
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        whereClause += ' AND close_date <= ?';
        queryParams.push(dateTo);
      }

      const [analytics] = await db.execute<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_closes,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_daily_revenue,
          SUM(cash_amount) as total_cash,
          SUM(card_amount) as total_card,
          SUM(mobile_amount) as total_mobile,
          SUM(bank_transfer_amount) as total_bank_transfer,
          SUM(expenses_amount) as total_expenses,
          MIN(close_date) as first_close_date,
          MAX(close_date) as last_close_date
         FROM daily_cash_close 
         ${whereClause}`,
        queryParams
      );

      // Get daily breakdown
      const [dailyBreakdown] = await db.execute<RowDataPacket[]>(
        `SELECT 
          close_date,
          total_amount,
          cash_amount,
          card_amount,
          mobile_amount,
          bank_transfer_amount,
          expenses_amount
         FROM daily_cash_close 
         ${whereClause}
         ORDER BY close_date DESC`,
        queryParams
      );

      return {
        summary: analytics[0],
        dailyBreakdown
      };

    } catch (error) {
      console.error('Error fetching cash close analytics:', error);
      throw new Error('Failed to fetch cash close analytics');
    }
  }

  /**
   * Check if cash has been closed for a specific date
   */
  static async isCashClosed(date: string): Promise<boolean> {
    try {
      const [result] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM daily_cash_close WHERE close_date = ?',
        [date]
      );

      return result[0].count > 0;

    } catch (error) {
      console.error('Error checking if cash is closed:', error);
      return false;
    }
  }

  /**
   * Get unclosed dates within a range
   */
  static async getUnclosedDates(dateFrom: string, dateTo: string): Promise<string[]> {
    try {
      // Generate all dates in range
      const dates: string[] = [];
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Get closed dates
      const [closedDates] = await db.execute<RowDataPacket[]>(
        'SELECT close_date FROM daily_cash_close WHERE close_date BETWEEN ? AND ?',
        [dateFrom, dateTo]
      );

      const closedDateStrings = closedDates.map(row => row.close_date);
      
      // Return unclosed dates
      return dates.filter(date => !closedDateStrings.includes(date));

    } catch (error) {
      console.error('Error getting unclosed dates:', error);
      return [];
    }
  }
}