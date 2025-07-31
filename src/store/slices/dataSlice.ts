import { StateCreator } from 'zustand';
import { Order, Customer, Payment, RegisterRecord } from '../../types';

export interface Stats {
  totalOrders: number;
  activeCustomers: number;
  monthlyRevenue: number;
  pendingOrders: number;
  totalPayments: number;
  cashPayments: number;
  ebirrPayments: number;
  cbePayments: number;
  bankTransferPayments: number;
  todayPayments: number;
}

export interface DataSlice {
  orders: Order[];
  customers: Customer[];
  payments: Payment[];
  registerRecords: RegisterRecord[];
  stats: Stats | null;
  
  // Setters
  setOrders: (orders: Order[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setPayments: (payments: Payment[]) => void;
  setRegisterRecords: (records: RegisterRecord[]) => void;
  setStats: (stats: Stats) => void;
  
  // Individual item operations
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  removeOrder: (orderId: string) => void;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  removeCustomer: (customerId: string) => void;
  
  addPayment: (payment: Payment) => void;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => void;
  removePayment: (paymentId: string) => void;
  
  addRegisterRecord: (record: RegisterRecord) => void;
  updateRegisterRecord: (recordId: number, updates: Partial<RegisterRecord>) => void;
  removeRegisterRecord: (recordId: number) => void;
  
  // Utility functions
  getOrderById: (orderId: string) => Order | undefined;
  getCustomerById: (customerId: string) => Customer | undefined;
  getPaymentById: (paymentId: string) => Payment | undefined;
  getRegisterRecordById: (recordId: number) => RegisterRecord | undefined;
  
  // Clear all data
  clearData: () => void;
}

export const dataSlice: StateCreator<
  DataSlice,
  [["zustand/immer", never]],
  [],
  DataSlice
> = (set, get) => ({
  orders: [],
  customers: [],
  payments: [],
  registerRecords: [],
  stats: null,

  // Setters
  setOrders: (orders: Order[]) => {
    set((state) => {
      state.orders = orders;
    });
  },

  setCustomers: (customers: Customer[]) => {
    set((state) => {
      state.customers = customers;
    });
  },

  setPayments: (payments: Payment[]) => {
    set((state) => {
      state.payments = payments;
    });
  },

  setRegisterRecords: (records: RegisterRecord[]) => {
    set((state) => {
      state.registerRecords = records;
    });
  },

  setStats: (stats: Stats) => {
    set((state) => {
      state.stats = stats;
    });
  },

  // Order operations
  addOrder: (order: Order) => {
    set((state) => {
      state.orders.unshift(order);
    });
  },

  updateOrder: (orderId: string, updates: Partial<Order>) => {
    set((state) => {
      const index = state.orders.findIndex(order => order.order_number === orderId);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updates };
      }
    });
  },

  removeOrder: (orderId: string) => {
    set((state) => {
      state.orders = state.orders.filter(order => order.order_number !== orderId);
    });
  },

  // Customer operations
  addCustomer: (customer: Customer) => {
    set((state) => {
      state.customers.unshift(customer);
    });
  },

  updateCustomer: (customerId: string, updates: Partial<Customer>) => {
    set((state) => {
      const index = state.customers.findIndex(customer => customer.id === customerId);
      if (index !== -1) {
        state.customers[index] = { ...state.customers[index], ...updates };
      }
    });
  },

  removeCustomer: (customerId: string) => {
    set((state) => {
      state.customers = state.customers.filter(customer => customer.id !== customerId);
    });
  },

  // Payment operations
  addPayment: (payment: Payment) => {
    set((state) => {
      state.payments.unshift(payment);
    });
  },

  updatePayment: (paymentId: string, updates: Partial<Payment>) => {
    set((state) => {
      const index = state.payments.findIndex(payment => payment.id === paymentId);
      if (index !== -1) {
        state.payments[index] = { ...state.payments[index], ...updates };
      }
    });
  },

  removePayment: (paymentId: string) => {
    set((state) => {
      state.payments = state.payments.filter(payment => payment.id !== paymentId);
    });
  },

  // Register record operations
  addRegisterRecord: (record: RegisterRecord) => {
    set((state) => {
      state.registerRecords.unshift(record);
    });
  },

  updateRegisterRecord: (recordId: number, updates: Partial<RegisterRecord>) => {
    set((state) => {
      const index = state.registerRecords.findIndex(record => record.id === recordId);
      if (index !== -1) {
        state.registerRecords[index] = { ...state.registerRecords[index], ...updates };
      }
    });
  },

  removeRegisterRecord: (recordId: number) => {
    set((state) => {
      state.registerRecords = state.registerRecords.filter(record => record.id !== recordId);
    });
  },

  // Utility functions
  getOrderById: (orderId: string) => {
    return get().orders.find(order => order.order_number === orderId);
  },

  getCustomerById: (customerId: string) => {
    return get().customers.find(customer => customer.id === customerId);
  },

  getPaymentById: (paymentId: string) => {
    return get().payments.find(payment => payment.id === paymentId);
  },

  getRegisterRecordById: (recordId: number) => {
    return get().registerRecords.find(record => record.id === recordId);
  },

  // Clear all data
  clearData: () => {
    set((state) => {
      state.orders = [];
      state.customers = [];
      state.payments = [];
      state.registerRecords = [];
      state.stats = null;
    });
  },
});