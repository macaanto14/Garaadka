import { db } from '../index';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AuditLogEntry {
  audit_id?: number;
  emp_id: string;
  date: string;
  status: string;
  table_name: string;
  record_id: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface AuditQueryOptions {
  table_name?: string;
  action_type?: string;
  emp_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: 'date' | 'emp_id' | 'table_name' | 'action_type';
  sort_order?: 'ASC' | 'DESC';
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  actionStats: Array<{ action_type: string; count: number }>;
  tableStats: Array<{ table_name: string; count: number }>;
  userStats: Array<{ emp_id: string; count: number }>;
  hourlyStats: Array<{ hour: number; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

export class AuditService {
  
  /**
   * Create a new audit log entry
   */
  static async createAuditLog(entry: AuditLogEntry): Promise<number> {
    try {
      const query = `
        INSERT INTO audit (
          emp_id, date, status, table_name, record_id, 
          action_type, old_values, new_values, ip_address, 
          user_agent, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute<ResultSetHeader>(query, [
        entry.emp_id,
        entry.date,
        entry.status,
        entry.table_name,
        entry.record_id,
        entry.action_type,
        entry.old_values || null,
        entry.new_values || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.session_id || null
      ]);
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Get audit logs with advanced filtering and pagination
   */
  static async getAuditLogs(options: AuditQueryOptions = {}): Promise<{
    audit_logs: AuditLogEntry[];
    total: number;
    limit: number;
    offset: number;
  }> {
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
        sort_by = 'date',
        sort_order = 'DESC'
      } = options;

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
          new_values,
          ip_address,
          user_agent,
          session_id
        FROM audit 
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let countQuery = 'SELECT COUNT(*) as total FROM audit WHERE 1=1';
      const countParams: any[] = [];

      // Apply filters
      if (table_name) {
        query += ' AND table_name = ?';
        countQuery += ' AND table_name = ?';
        params.push(table_name);
        countParams.push(table_name);
      }

      if (action_type) {
        query += ' AND action_type = ?';
        countQuery += ' AND action_type = ?';
        params.push(action_type);
        countParams.push(action_type);
      }

      if (emp_id) {
        query += ' AND emp_id = ?';
        countQuery += ' AND emp_id = ?';
        params.push(emp_id);
        countParams.push(emp_id);
      }

      if (start_date) {
        query += ' AND date >= ?';
        countQuery += ' AND date >= ?';
        params.push(start_date);
        countParams.push(start_date);
      }

      if (end_date) {
        query += ' AND date <= ?';
        countQuery += ' AND date <= ?';
        params.push(end_date);
        countParams.push(end_date);
      }

      if (search) {
        query += ' AND (emp_id LIKE ? OR status LIKE ? OR table_name LIKE ?)';
        countQuery += ' AND (emp_id LIKE ? OR status LIKE ? OR table_name LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Add sorting and pagination
      query += ` ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Execute queries
      const [auditLogs] = await db.execute<RowDataPacket[]>(query, params);
      const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);

      return {
        audit_logs: auditLogs as AuditLogEntry[],
        total: countResult[0].total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Get comprehensive audit statistics
   */
  static async getAuditStats(): Promise<AuditStats> {
    try {
      // Execute all stat queries in parallel
      const [
        [totalLogs],
        [todayLogs],
        [weekLogs],
        [monthLogs],
        actionStats,
        tableStats,
        userStats,
        hourlyStats,
        dailyStats
      ] = await Promise.all([
        db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM audit'),
        db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM audit WHERE DATE(date) = CURDATE()'),
        db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM audit WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
        db.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM audit WHERE date >= DATE_SUB(NOW(), INTERVAL 30 DAY)'),
        db.execute<RowDataPacket[]>('SELECT action_type, COUNT(*) as count FROM audit GROUP BY action_type ORDER BY count DESC'),
        db.execute<RowDataPacket[]>('SELECT table_name, COUNT(*) as count FROM audit GROUP BY table_name ORDER BY count DESC'),
        db.execute<RowDataPacket[]>('SELECT emp_id, COUNT(*) as count FROM audit GROUP BY emp_id ORDER BY count DESC LIMIT 10'),
        db.execute<RowDataPacket[]>(`
          SELECT HOUR(date) as hour, COUNT(*) as count 
          FROM audit 
          WHERE DATE(date) = CURDATE() 
          GROUP BY HOUR(date) 
          ORDER BY hour
        `),
        db.execute<RowDataPacket[]>(`
          SELECT DATE(date) as date, COUNT(*) as count 
          FROM audit 
          WHERE date >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
          GROUP BY DATE(date) 
          ORDER BY date
        `)
      ]);

      return {
        totalLogs: totalLogs[0].count,
        todayLogs: todayLogs[0].count,
        weekLogs: weekLogs[0].count,
        monthLogs: monthLogs[0].count,
        actionStats: actionStats as Array<{ action_type: string; count: number }>,
        tableStats: tableStats as Array<{ table_name: string; count: number }>,
        userStats: userStats as Array<{ emp_id: string; count: number }>,
        hourlyStats: hourlyStats as Array<{ hour: number; count: number }>,
        dailyStats: dailyStats as Array<{ date: string; count: number }>
      };
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      throw new Error('Failed to fetch audit statistics');
    }
  }

  /**
   * Get audit logs for a specific record
   */
  static async getRecordAuditHistory(tableName: string, recordId: string): Promise<AuditLogEntry[]> {
    try {
      const query = `
        SELECT 
          audit_id,
          emp_id,
          date,
          status,
          action_type,
          old_values,
          new_values,
          ip_address,
          user_agent
        FROM audit 
        WHERE table_name = ? AND record_id = ?
        ORDER BY date DESC
      `;
      
      const [auditLogs] = await db.execute<RowDataPacket[]>(query, [tableName, recordId]);
      return auditLogs as AuditLogEntry[];
    } catch (error) {
      console.error('Error fetching record audit history:', error);
      throw new Error('Failed to fetch record audit history');
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(username: string, limit: number = 50, offset: number = 0): Promise<{
    user_logs: AuditLogEntry[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const query = `
        SELECT 
          audit_id,
          date,
          status,
          table_name,
          record_id,
          action_type,
          ip_address
        FROM audit 
        WHERE emp_id = ?
        ORDER BY date DESC
        LIMIT ? OFFSET ?
      `;
      
      const [userLogs] = await db.execute<RowDataPacket[]>(query, [username, limit, offset]);
      
      const [countResult] = await db.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM audit WHERE emp_id = ?',
        [username]
      );

      return {
        user_logs: userLogs as AuditLogEntry[],
        total: countResult[0].total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  /**
   * Get audit logs by date range with aggregation
   */
  static async getAuditLogsByDateRange(
    startDate: string, 
    endDate: string, 
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ period: string; count: number; actions: any[] }>> {
    try {
      let dateFormat: string;
      let groupByClause: string;
      
      switch (groupBy) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00:00';
          groupByClause = 'DATE_FORMAT(date, "%Y-%m-%d %H:00:00")';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          groupByClause = 'YEARWEEK(date)';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          groupByClause = 'DATE_FORMAT(date, "%Y-%m")';
          break;
        default: // day
          dateFormat = '%Y-%m-%d';
          groupByClause = 'DATE(date)';
      }

      const query = `
        SELECT 
          ${groupByClause} as period,
          COUNT(*) as count,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'action_type', action_type,
              'table_name', table_name,
              'emp_id', emp_id
            )
          ) as actions
        FROM audit 
        WHERE date >= ? AND date <= ?
        GROUP BY ${groupByClause}
        ORDER BY period
      `;
      
      const [results] = await db.execute<RowDataPacket[]>(query, [startDate, endDate]);
      return results as Array<{ period: string; count: number; actions: any[] }>;
    } catch (error) {
      console.error('Error fetching audit logs by date range:', error);
      throw new Error('Failed to fetch audit logs by date range');
    }
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportAuditLogs(options: AuditQueryOptions = {}): Promise<string> {
    try {
      const { audit_logs } = await this.getAuditLogs({ ...options, limit: 10000, offset: 0 });
      
      const headers = [
        'Audit ID', 'Employee ID', 'Date', 'Status', 'Table Name', 
        'Record ID', 'Action Type', 'IP Address'
      ];
      
      const csvRows = [
        headers.join(','),
        ...audit_logs.map(log => [
          log.audit_id,
          log.emp_id,
          log.date,
          `"${log.status}"`,
          log.table_name,
          log.record_id,
          log.action_type,
          log.ip_address || ''
        ].join(','))
      ];
      
      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const query = `
        DELETE FROM audit 
        WHERE date < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [result] = await db.execute<ResultSetHeader>(query, [retentionDays]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw new Error('Failed to cleanup old audit logs');
    }
  }
}