import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';

// Unified user interface that matches auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        position: string;
      };
    }
  }
}

export interface AuditableRequest extends Request {
  auditUser?: string;
}

// Middleware to extract user information for audit logging
export const auditMiddleware = (req: AuditableRequest, res: Response, next: NextFunction) => {
  // Extract user information from session, token, or request
  if (req.user) {
    req.auditUser = req.user.username || req.user.id?.toString() || 'system';
  } else {
    // Fallback to extracting from headers or session
    req.auditUser = req.headers['x-user-id'] as string || 'anonymous';
  }
  
  next();
};

// Helper function to get current timestamp
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to add audit fields to INSERT queries
export const addAuditFieldsForInsert = (data: any, username: string) => {
  return {
    ...data,
    created_by: username,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
    updated_by: username
  };
};

// Helper function to add audit fields to UPDATE queries
export const addAuditFieldsForUpdate = (data: any, username: string) => {
  return {
    ...data,
    updated_at: getCurrentTimestamp(),
    updated_by: username
  };
};

// Helper function to add audit fields for soft delete
export const addAuditFieldsForDelete = (username: string) => {
  return {
    deleted_at: getCurrentTimestamp(),
    deleted_by: username
  };
};

// Automatic audit logging helper
export const logAuditEvent = async (
  req: AuditableRequest,
  tableName: string,
  recordId: string,
  actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT',
  status: string,
  oldValues?: any,
  newValues?: any
) => {
  try {
    await AuditService.createAuditLog({
      emp_id: req.auditUser || 'system',
      date: getCurrentTimestamp(),
      status,
      table_name: tableName,
      record_id: recordId.toString(),
      action_type: actionType,
      old_values: oldValues ? JSON.stringify(oldValues) : undefined,
      new_values: newValues ? JSON.stringify(newValues) : undefined,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      session_id: req.ip || 'unknown' // Use IP as session identifier since sessionID is not available
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking the main operation
  }
};