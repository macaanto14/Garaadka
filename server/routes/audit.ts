import express from 'express';
import { db } from '../index';
import { RowDataPacket } from 'mysql2';
import { auditMiddleware, AuditableRequest } from '../middleware/auditMiddleware';

const router = express.Router();

// Apply audit middleware
router.use(auditMiddleware);

// Get all audit logs with filtering
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      action_type, 
      emp_id, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        audit_id,
        emp_id,
        date,
        status,
        table_name,
        record_id,
        action_type,
        old_values,
        new_values
      FROM audit 
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (table_name) {
      query += ' AND table_name = ?';
      params.push(table_name);
    }

    if (action_type) {
      query += ' AND action_type = ?';
      params.push(action_type);
    }

    if (emp_id) {
      query += ' AND emp_id = ?';
      params.push(emp_id);
    }

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [auditLogs] = await db.execute<RowDataPacket[]>(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM audit WHERE 1=1';
    const countParams: any[] = [];

    if (table_name) {
      countQuery += ' AND table_name = ?';
      countParams.push(table_name);
    }

    if (action_type) {
      countQuery += ' AND action_type = ?';
      countParams.push(action_type);
    }

    if (emp_id) {
      countQuery += ' AND emp_id = ?';
      countParams.push(emp_id);
    }

    if (start_date) {
      countQuery += ' AND date >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND date <= ?';
      countParams.push(end_date);
    }

    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);

    res.json({
      audit_logs: auditLogs,
      total: countResult[0].total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit statistics
router.get('/stats', async (req: AuditableRequest, res) => {
  try {
    const [totalLogs] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit'
    );

    const [actionStats] = await db.execute<RowDataPacket[]>(
      'SELECT action_type, COUNT(*) as count FROM audit GROUP BY action_type'
    );

    const [tableStats] = await db.execute<RowDataPacket[]>(
      'SELECT table_name, COUNT(*) as count FROM audit GROUP BY table_name'
    );

    const [userStats] = await db.execute<RowDataPacket[]>(
      'SELECT emp_id, COUNT(*) as count FROM audit GROUP BY emp_id ORDER BY count DESC LIMIT 10'
    );

    const [todayLogs] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit WHERE DATE(date) = CURDATE()'
    );

    const [weekLogs] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    res.json({
      totalLogs: totalLogs[0].count,
      todayLogs: todayLogs[0].count,
      weekLogs: weekLogs[0].count,
      actionStats,
      tableStats,
      userStats
    });

  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs for specific record
router.get('/record/:table/:id', async (req: AuditableRequest, res) => {
  try {
    const { table, id } = req.params;

    const [auditLogs] = await db.execute<RowDataPacket[]>(
      `SELECT 
        audit_id,
        emp_id,
        date,
        status,
        action_type,
        old_values,
        new_values
       FROM audit 
       WHERE table_name = ? AND record_id = ?
       ORDER BY date DESC`,
      [table, id]
    );

    res.json(auditLogs);

  } catch (error) {
    console.error('Error fetching record audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity logs
router.get('/user/:username', async (req: AuditableRequest, res) => {
  try {
    const { username } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [userLogs] = await db.execute<RowDataPacket[]>(
      `SELECT 
        audit_id,
        date,
        status,
        table_name,
        record_id,
        action_type
       FROM audit 
       WHERE emp_id = ?
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [username, parseInt(limit as string), parseInt(offset as string)]
    );

    const [countResult] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM audit WHERE emp_id = ?',
      [username]
    );

    res.json({
      user_logs: userLogs,
      total: countResult[0].total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;