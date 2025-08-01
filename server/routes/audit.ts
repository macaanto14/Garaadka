import express from 'express';
import { db } from '../index.js';
import { RowDataPacket } from 'mysql2';
import { auditMiddleware, AuditableRequest } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Apply audit middleware
router.use(auditMiddleware);

// Interface for audit log record
interface AuditLog {
  audit_id: number;
  emp_id: string;
  date: string;
  status: string;
  table_name: string;
  record_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  old_values: string | null;
  new_values: string | null;
}

// Helper function to build WHERE clause for filtering
function buildWhereClause(filters: any): { whereClause: string; params: any[] } {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filters.table_name) {
    whereClause += ' AND table_name = ?';
    params.push(filters.table_name);
  }

  if (filters.action_type) {
    whereClause += ' AND action_type = ?';
    params.push(filters.action_type);
  }

  if (filters.emp_id) {
    whereClause += ' AND emp_id = ?';
    params.push(filters.emp_id);
  }

  if (filters.start_date) {
    whereClause += ' AND STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    whereClause += ' AND STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") <= ?';
    params.push(filters.end_date);
  }

  if (filters.search) {
    whereClause += ' AND (emp_id LIKE ? OR status LIKE ? OR table_name LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  return { whereClause, params };
}

// Helper function to format CSV data
function formatCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// 1. GET /api/audit - Get audit logs with filtering
router.get('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      action_type, 
      emp_id, 
      start_date, 
      end_date, 
      limit = 100, 
      offset = 0,
      search,
      sort_by = 'audit_id',
      sort_order = 'DESC'
    } = req.query;

    const filters = { table_name, action_type, emp_id, start_date, end_date, search };
    const { whereClause, params } = buildWhereClause(filters);

    // Validate sort parameters
    const validSortColumns = ['audit_id', 'emp_id', 'date', 'status', 'table_name', 'action_type'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'audit_id';
    const sortDirection = validSortOrders.includes((sort_order as string).toUpperCase()) ? 
      (sort_order as string).toUpperCase() : 'DESC';

    const query = `
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
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit as string), parseInt(offset as string));
    const [auditLogs] = await db.execute<RowDataPacket[]>(query, params);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM audit ${whereClause}`;
    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, params.slice(0, -2));

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit as string));

    res.json({
      audit_logs: auditLogs,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        current_page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        total_pages: totalPages,
        has_next: parseInt(offset as string) + parseInt(limit as string) < totalRecords,
        has_prev: parseInt(offset as string) > 0
      },
      filters: {
        table_name: table_name || null,
        action_type: action_type || null,
        emp_id: emp_id || null,
        start_date: start_date || null,
        end_date: end_date || null,
        search: search || null,
        sort_by: sortColumn,
        sort_order: sortDirection
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// 2. GET /api/audit/stats - Get comprehensive statistics (IMPROVED)
router.get('/stats', async (req: AuditableRequest, res) => {
  try {
    // Total logs
    const [totalLogs] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit'
    );

    // Today's logs - using proper date comparison
    const [todayLogs] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM audit 
       WHERE DATE(STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y')) = CURDATE()`
    );

    // Weekly logs (last 7 days) - improved calculation
    const [weekLogs] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM audit 
       WHERE STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y') >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Active users today (not all-time users)
    const [activeUsersToday] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT emp_id) as count FROM audit 
       WHERE DATE(STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y')) = CURDATE()`
    );

    // Active users this week
    const [activeUsersWeek] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT emp_id) as count FROM audit 
       WHERE STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y') >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Action statistics
    const [actionStats] = await db.execute<RowDataPacket[]>(
      'SELECT action_type, COUNT(*) as count FROM audit GROUP BY action_type ORDER BY count DESC'
    );

    // Table statistics
    const [tableStats] = await db.execute<RowDataPacket[]>(
      'SELECT table_name, COUNT(*) as count FROM audit WHERE table_name IS NOT NULL GROUP BY table_name ORDER BY count DESC'
    );

    // User statistics (all-time activity)
    const [userStats] = await db.execute<RowDataPacket[]>(
      'SELECT emp_id, COUNT(*) as count FROM audit GROUP BY emp_id ORDER BY count DESC LIMIT 10'
    );

    res.json({
      total_logs: totalLogs[0].count,
      today_logs: todayLogs[0].count,
      weekly_logs: weekLogs[0].count,
      active_users_today: activeUsersToday[0].count,
      active_users_week: activeUsersWeek[0].count,
      action_stats: actionStats,
      table_stats: tableStats,
      user_stats: userStats
    });

  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// 3. GET /api/audit/record/:table/:id - Get audit history for specific record
router.get('/record/:table/:id', async (req: AuditableRequest, res) => {
  try {
    const { table, id } = req.params;

    if (!table || !id) {
      return res.status(400).json({ error: 'Table name and record ID are required' });
    }

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
       ORDER BY audit_id DESC`,
      [table, id]
    );

    res.json({
      table_name: table,
      record_id: id,
      audit_history: auditLogs,
      total_entries: auditLogs.length
    });

  } catch (error) {
    console.error('Error fetching record audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch record audit history' });
  }
});

// 4. GET /api/audit/user/:username - Get user activity logs
router.get('/user/:username', async (req: AuditableRequest, res) => {
  try {
    const { username } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

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
       ORDER BY audit_id DESC
       LIMIT ? OFFSET ?`,
      [username, parseInt(limit as string), parseInt(offset as string)]
    );

    const [countResult] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM audit WHERE emp_id = ?',
      [username]
    );

    const totalRecords = countResult[0].total;

    res.json({
      username: username,
      user_logs: userLogs,
      pagination: {
        total: totalRecords,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        current_page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        total_pages: Math.ceil(totalRecords / parseInt(limit as string)),
        has_next: parseInt(offset as string) + parseInt(limit as string) < totalRecords,
        has_prev: parseInt(offset as string) > 0
      }
    });

  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch user activity logs' });
  }
});

// 5. GET /api/audit/analytics/timeline - Get audit logs with time-based aggregation
router.get('/analytics/timeline', async (req: AuditableRequest, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      group_by = 'day' 
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        error: 'start_date and end_date are required',
        example: '?start_date=2024-01-01&end_date=2024-01-31&group_by=day'
      });
    }

    // For the legacy date format, we'll group by date patterns
    const [timelineData] = await db.execute<RowDataPacket[]>(
      `SELECT 
        DATE(STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y')) as time_period,
        COUNT(*) as total_logs,
        COUNT(CASE WHEN action_type = 'CREATE' THEN 1 END) as create_count,
        COUNT(CASE WHEN action_type = 'UPDATE' THEN 1 END) as update_count,
        COUNT(CASE WHEN action_type = 'DELETE' THEN 1 END) as delete_count,
        COUNT(CASE WHEN action_type = 'LOGIN' THEN 1 END) as login_count,
        COUNT(CASE WHEN action_type = 'LOGOUT' THEN 1 END) as logout_count,
        COUNT(DISTINCT emp_id) as unique_users,
        COUNT(DISTINCT table_name) as unique_tables
       FROM audit 
       WHERE STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y') >= ? 
         AND STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y') <= ?
       GROUP BY DATE(STR_TO_DATE(date, '%H:%i:%s / %b %d, %Y'))
       ORDER BY time_period`,
      [start_date, end_date]
    );

    res.json({
      timeline_data: timelineData,
      parameters: {
        start_date,
        end_date,
        group_by,
        total_periods: timelineData.length
      }
    });

  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    res.status(500).json({ error: 'Failed to fetch timeline analytics' });
  }
});

// 6. GET /api/audit/export - Export audit logs as CSV
router.get('/export', async (req: AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      action_type, 
      emp_id, 
      start_date, 
      end_date,
      search
    } = req.query;

    const filters = { table_name, action_type, emp_id, start_date, end_date, search };
    const { whereClause, params } = buildWhereClause(filters);

    const query = `
      SELECT 
        audit_id,
        emp_id,
        date,
        status,
        table_name,
        record_id,
        action_type
      FROM audit 
      ${whereClause}
      ORDER BY audit_id DESC
      LIMIT 10000
    `;
    
    const [auditLogs] = await db.execute<RowDataPacket[]>(query, params);

    if (auditLogs.length === 0) {
      return res.status(404).json({ error: 'No audit logs found for export' });
    }

    const csvData = formatCSV(auditLogs);
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// 7. POST /api/audit - Create manual audit log entry
router.post('/', async (req: AuditableRequest, res) => {
  try {
    const { 
      table_name, 
      record_id, 
      action_type, 
      status, 
      old_values, 
      new_values 
    } = req.body;

    // Validate required fields
    if (!table_name || !record_id || !action_type || !status) {
      return res.status(400).json({ 
        error: 'Required fields are missing',
        required_fields: ['table_name', 'record_id', 'action_type', 'status']
      });
    }

    // Validate action_type
    const validActionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    if (!validActionTypes.includes(action_type)) {
      return res.status(400).json({ 
        error: 'Invalid action_type',
        valid_values: validActionTypes
      });
    }

    // Validate JSON fields if provided
    if (old_values) {
      try {
        JSON.parse(old_values);
      } catch (e) {
        return res.status(400).json({ error: 'old_values must be valid JSON' });
      }
    }

    if (new_values) {
      try {
        JSON.parse(new_values);
      } catch (e) {
        return res.status(400).json({ error: 'new_values must be valid JSON' });
      }
    }

    const emp_id = req.user?.username || 'system';
    const date = new Date().toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour12: false
    }).replace(',', ' /');

    const query = `
      INSERT INTO audit (
        emp_id, date, status, table_name, record_id, 
        action_type, old_values, new_values
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      emp_id,
      date,
      status,
      table_name,
      record_id,
      action_type,
      old_values || null,
      new_values || null
    ]);

    const insertId = (result as any).insertId;

    // Fetch the created audit log
    const [newAuditLog] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM audit WHERE audit_id = ?',
      [insertId]
    );

    res.status(201).json({
      message: 'Audit log entry created successfully',
      audit_log: newAuditLog[0]
    });

  } catch (error) {
    console.error('Error creating audit log entry:', error);
    res.status(500).json({ error: 'Failed to create audit log entry' });
  }
});

// 8. DELETE /api/audit/cleanup - Clean up old audit logs
router.delete('/cleanup', async (req: AuditableRequest, res) => {
  try {
    const { retention_days = 365 } = req.query;

    const retentionDays = parseInt(retention_days as string);
    
    if (isNaN(retentionDays) || retentionDays < 1) {
      return res.status(400).json({ 
        error: 'retention_days must be a positive number',
        example: '?retention_days=365'
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // First, get count of logs to be deleted
    const [countResult] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit WHERE STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") < ?',
      [cutoffDate.toISOString().split('T')[0]]
    );

    const logsToDelete = countResult[0].count;

    if (logsToDelete === 0) {
      return res.json({
        message: 'No audit logs found older than the retention period',
        retention_days: retentionDays,
        logs_deleted: 0
      });
    }

    // Delete old audit logs
    const [deleteResult] = await db.execute(
      'DELETE FROM audit WHERE STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") < ?',
      [cutoffDate.toISOString().split('T')[0]]
    );

    const logsDeleted = (deleteResult as any).affectedRows;

    res.json({
      message: 'Audit logs cleanup completed successfully',
      retention_days: retentionDays,
      logs_deleted: logsDeleted,
      cleanup_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ error: 'Failed to cleanup audit logs' });
  }
});

// 8b. POST /api/audit/cleanup - Clean up old audit logs (alternative method)
router.post('/cleanup', async (req: AuditableRequest, res) => {
  try {
    // Get retention_days from query params or request body
    const retention_days = req.query.retention_days || req.body.retention_days || 365;

    const retentionDays = parseInt(retention_days as string);
    
    if (isNaN(retentionDays) || retentionDays < 1) {
      return res.status(400).json({ 
        error: 'retention_days must be a positive number',
        example: 'Send retention_days in query params or request body'
      });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // First, get count of logs to be deleted
    const [countResult] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM audit WHERE STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") < ?',
      [cutoffDate.toISOString().split('T')[0]]
    );

    const logsToDelete = countResult[0].count;

    if (logsToDelete === 0) {
      return res.json({
        message: 'No audit logs found older than the retention period',
        retention_days: retentionDays,
        logs_deleted: 0
      });
    }

    // Delete old audit logs
    const [deleteResult] = await db.execute(
      'DELETE FROM audit WHERE STR_TO_DATE(date, "%H:%i:%s / %b %d, %Y") < ?',
      [cutoffDate.toISOString().split('T')[0]]
    );

    const logsDeleted = (deleteResult as any).affectedRows;

    res.json({
      message: 'Audit logs cleanup completed successfully',
      retention_days: retentionDays,
      logs_deleted: logsDeleted,
      cleanup_date: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ error: 'Failed to cleanup audit logs' });
  }
});

export default router;