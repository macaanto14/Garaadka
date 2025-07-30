export interface User {
  personalId: number;
  fname: string;
  username: string;
  password: string;
  city: string;
  phoneNo: string;
  position: 'admin' | 'staff' | 'manager';
  secQue: string;
  answer: string;
  image?: string;
}

export interface LaundryOrder {
  itemNum: number;
  name: string;
  descr: string;
  quan: number;
  unitprice: number;
  amntword: string;
  duedate: string;
  deliverdate: string;
  totalAmount: number;
  mobnum: number;
  payCheck: 'paid' | 'pending' | 'partial';
  col?: string;
  siz?: string;
  status?: 'received' | 'washing' | 'drying' | 'ready' | 'delivered';
  // New serial number fields
  serialNumber?: string;    // Package serial number for customer delivery
  orderId?: string;         // Auto-generated order ID (3 digits + string)
}

export interface AuditLog {
  audit_id: number;
  emp_id: string;
  date: string;
  status: string;
  table_name?: string;
  record_id?: string;
  action_type?: string;
  old_values?: string;
  new_values?: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  actionStats: Array<{ action_type: string; count: number }>;
  tableStats: Array<{ table_name: string; count: number }>;
  userStats: Array<{ emp_id: string; count: number }>;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeCustomers: number;
}