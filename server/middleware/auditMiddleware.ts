import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        username?: string;
        fname?: string;
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
  // This assumes you have user information available in the request
  if (req.user) {
    req.auditUser = req.user.username || req.user.fname || req.user.id || 'system';
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