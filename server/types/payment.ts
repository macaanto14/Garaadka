export interface Payment {
  payment_id: number;
  order_id: number;
  payment_date: Date;
  amount: number;
  payment_method: string;
  reference_number?: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  notes?: string;
  processed_by: string;
  receipt_number: string;
  refund_amount: number;
  refund_reason?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  deleted_at?: Date;
  deleted_by?: string;
}

export interface PaymentMethod {
  method_id: number;
  method_code: string;
  method_name: string;
  description?: string;
  is_active: boolean;
  requires_reference: boolean;
  icon?: string;
  sort_order: number;
}

export interface PaymentReceipt {
  receipt_id: number;
  payment_id: number;
  receipt_number: string;
  receipt_data: any;
  generated_at: Date;
  generated_by: string;
  printed_at?: Date;
  email_sent_at?: Date;
  sms_sent_at?: Date;
}

export interface PaymentRefund {
  refund_id: number;
  payment_id: number;
  refund_amount: number;
  refund_reason: string;
  refund_method: string;
  refund_reference?: string;
  status: 'pending' | 'completed' | 'failed';
  processed_by: string;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  avgPayment: number;
  todayRevenue: number;
  todayPayments: number;
  outstandingOrders: number;
  outstandingAmount: number;
  paymentMethods: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
}