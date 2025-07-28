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
}

export interface AuditLog {
  auditId: number;
  empId: string;
  date: string;
  status: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeCustomers: number;
}