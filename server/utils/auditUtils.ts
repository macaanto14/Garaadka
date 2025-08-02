/**
 * Utility functions for audit logging
 */

/**
 * Format date for audit table (matching the expected format)
 * Returns format: "HH:mm:ss / MMM dd, yyyy" (e.g., "14:30:25 / Jan 15, 2024")
 */
export const formatAuditDate = (): string => {
  return new Date().toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour12: false
  }).replace(',', ' /');
};

/**
 * Helper function to insert audit log with proper formatting
 */
export const insertAuditLog = async (
  db: any,
  emp_id: string,
  status: string,
  table_name: string,
  record_id: string | number,
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT',
  old_values?: any,
  new_values?: any
): Promise<void> => {
  const auditQuery = `
    INSERT INTO audit (emp_id, date, status, table_name, record_id, action_type, old_values, new_values)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  await db.execute(auditQuery, [
    emp_id,
    formatAuditDate(),
    status,
    table_name,
    record_id.toString(),
    action_type,
    old_values ? JSON.stringify(old_values) : null,
    new_values ? JSON.stringify(new_values) : null
  ]);
};