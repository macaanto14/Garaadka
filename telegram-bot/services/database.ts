import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'loundary',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Legacy register queries
export class LegacyRegisterService {
  static async searchByPhone(phone: string, limit: number = 5) {
    const cleanPhone = phone.replace(/\D/g, '');
    const searchPhone = cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-9);
    
    const [rows] = await db.execute(`
      SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        totalAmount,
        mobnum,
        payCheck,
        duedate,
        deliverdate,
        col,
        siz
      FROM register 
      WHERE mobnum LIKE ? 
        AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
      ORDER BY itemNum DESC 
      LIMIT ?
    `, [`%${searchPhone}%`, limit]);
    
    return rows as any[];
  }
  
  static async getCustomerSummary(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    const searchPhone = cleanPhone.length === 10 ? cleanPhone : cleanPhone.slice(-9);
    
    const [rows] = await db.execute(`
      SELECT 
        NAME,
        COUNT(*) as total_orders,
        SUM(totalAmount) as total_spent,
        SUM(CASE WHEN payCheck = 'Paid' THEN totalAmount ELSE 0 END) as total_paid,
        SUM(CASE WHEN payCheck != 'Paid' THEN totalAmount ELSE 0 END) as total_pending,
        MAX(itemNum) as latest_order,
        MIN(duedate) as first_order_date,
        MAX(duedate) as last_order_date
      FROM register 
      WHERE mobnum LIKE ?
        AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
      GROUP BY NAME
    `, [`%${searchPhone}%`]);
    
    return rows[0] as any;
  }
  
  static async getOrderById(itemNum: string) {
    const [rows] = await db.execute(`
      SELECT 
        itemNum,
        NAME,
        descr,
        quan,
        unitprice,
        amntword,
        totalAmount,
        mobnum,
        payCheck,
        duedate,
        deliverdate,
        col,
        siz
      FROM register 
      WHERE itemNum = ?
    `, [itemNum]);
    
    return rows[0] as any;
  }
  
  static async getRecentOrders(limit: number = 10) {
    const [rows] = await db.execute(`
      SELECT 
        itemNum,
        NAME,
        descr,
        totalAmount,
        payCheck,
        duedate
      FROM register 
      WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
      ORDER BY itemNum DESC 
      LIMIT ?
    `, [limit]);
    
    return rows as any[];
  }
  
  static async getUnpaidOrders(limit: number = 15) {
    const [rows] = await db.execute(`
      SELECT 
        itemNum,
        NAME,
        descr,
        totalAmount,
        duedate,
        mobnum
      FROM register 
      WHERE payCheck != 'Paid'
        AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
      ORDER BY duedate ASC 
      LIMIT ?
    `, [limit]);
    
    return rows as any[];
  }
  
  static async getBusinessStats() {
    const [statsRows] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(DISTINCT NAME) as total_customers,
        SUM(totalAmount) as total_revenue,
        SUM(CASE WHEN payCheck = 'Paid' THEN totalAmount ELSE 0 END) as total_collected,
        SUM(CASE WHEN payCheck != 'Paid' THEN totalAmount ELSE 0 END) as total_pending,
        AVG(totalAmount) as avg_order_value
      FROM register
      WHERE NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
    `);
    
    const [todayRows] = await db.execute(`
      SELECT 
        COUNT(*) as today_orders,
        SUM(totalAmount) as today_revenue
      FROM register 
      WHERE DATE(duedate) = CURDATE()
        AND NAME != 'HALKAN KU QOR MAGACA MACMIILKA' 
        AND NAME != 'Test'
    `);
    
    return {
      overall: statsRows[0] as any,
      today: todayRows[0] as any
    };
  }
}