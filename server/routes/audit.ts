import express from 'express';
import { db } from '../index';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Get all audit logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM audit ORDER BY audit_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalActivities] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit'
    );

    const [activeUsers] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(DISTINCT emp_id) as count FROM audit WHERE DATE(STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y")) = CURDATE()'
    );

    const [todayActions] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit WHERE DATE(STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y")) = CURDATE()'
    );

    res.json({
      totalActivities: totalActivities[0].count,
      activeUsers: activeUsers[0].count,
      todayActions: todayActions[0].count,
      systemHealth: 98 // Mock value
    });

  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;