import express from 'express';
import { db } from '../index';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT 
        itemNum as orderId,
        NAME as customerName,
        totalAmount as amount,
        payCheck as status,
        duedate as date,
        mobnum as customerPhone
       FROM qaatayaal 
       ORDER BY itemNum DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalRevenue] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(totalAmount) as total FROM qaatayaal WHERE payCheck = "paid"'
    );

    const [pendingAmount] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(totalAmount) as total FROM qaatayaal WHERE payCheck = "pending"'
    );

    const [partialAmount] = await db.execute<RowDataPacket[]>(
      'SELECT SUM(totalAmount) as total FROM qaatayaal WHERE payCheck = "partial"'
    );

    const [totalTransactions] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM qaatayaal'
    );

    const [completedTransactions] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM qaatayaal WHERE payCheck = "paid"'
    );

    const successRate = totalTransactions[0].count > 0 
      ? Math.round((completedTransactions[0].count / totalTransactions[0].count) * 100)
      : 0;

    res.json({
      totalRevenue: totalRevenue[0].total || 0,
      pendingAmount: pendingAmount[0].total || 0,
      partialAmount: partialAmount[0].total || 0,
      totalTransactions: totalTransactions[0].count,
      successRate
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;