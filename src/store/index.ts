import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authSlice, AuthSlice } from './slices/authSlice';
import { uiSlice, UISlice } from './slices/uiSlice';
import { dataSlice, DataSlice } from './slices/dataSlice';
import { settingsSlice, SettingsSlice } from './slices/settingsSlice';

// Combined store interface
export interface AppStore extends AuthSlice, UISlice, DataSlice, SettingsSlice {}

// Create the main store with all slices
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((...args) => ({
        ...authSlice(...args),
        ...uiSlice(...args),
        ...dataSlice(...args),
        ...settingsSlice(...args),
      })),
      {
        name: 'garaadka-store',
        partialize: (state) => ({
          // Persist only specific parts of the state
          user: state.user,
          language: state.language,
          businessSettings: state.businessSettings,
          notificationSettings: state.notificationSettings,
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'Garaadka Store',
    }
  )
);

// Export individual slice hooks with proper memoization using shallow comparison
export const useAuth = () => {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.authLoading);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const refreshToken = useAppStore((state) => state.refreshToken);
  const updateUser = useAppStore((state) => state.updateUser);
  const initializeAuth = useAppStore((state) => state.initializeAuth);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser,
    initializeAuth,
  };
};

export const useUI = () => {
  const activeTab = useAppStore((state) => state.activeTab);
  const modals = useAppStore((state) => state.modals);
  const loading = useAppStore((state) => state.loading);
  const notifications = useAppStore((state) => state.notifications);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const openModal = useAppStore((state) => state.openModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const setLoading = useAppStore((state) => state.setLoading);
  const addNotification = useAppStore((state) => state.addNotification);
  const removeNotification = useAppStore((state) => state.removeNotification);
  const navigateTo = useAppStore((state) => state.navigateTo);

  return {
    activeTab,
    modals,
    loading,
    notifications,
    setActiveTab,
    openModal,
    closeModal,
    setLoading,
    addNotification,
    removeNotification,
    navigateTo,
  };
};

export const useData = () => {
  const orders = useAppStore((state) => state.orders);
  const customers = useAppStore((state) => state.customers);
  const payments = useAppStore((state) => state.payments);
  const registerRecords = useAppStore((state) => state.registerRecords);
  const stats = useAppStore((state) => state.stats);
  const setOrders = useAppStore((state) => state.setOrders);
  const setCustomers = useAppStore((state) => state.setCustomers);
  const setPayments = useAppStore((state) => state.setPayments);
  const setRegisterRecords = useAppStore((state) => state.setRegisterRecords);
  const setStats = useAppStore((state) => state.setStats);
  const addOrder = useAppStore((state) => state.addOrder);
  const updateOrder = useAppStore((state) => state.updateOrder);
  const addCustomer = useAppStore((state) => state.addCustomer);
  const updateCustomer = useAppStore((state) => state.updateCustomer);
  const addPayment = useAppStore((state) => state.addPayment);
  const updatePayment = useAppStore((state) => state.updatePayment);
  const clearData = useAppStore((state) => state.clearData);

  return {
    orders,
    customers,
    payments,
    registerRecords,
    stats,
    setOrders,
    setCustomers,
    setPayments,
    setRegisterRecords,
    setStats,
    addOrder,
    updateOrder,
    addCustomer,
    updateCustomer,
    addPayment,
    updatePayment,
    clearData,
  };
};

export const useSettings = () => {
  const language = useAppStore((state) => state.language);
  const serialNumberConfig = useAppStore((state) => state.serialNumberConfig);
  const orderIdConfig = useAppStore((state) => state.orderIdConfig);
  const businessSettings = useAppStore((state) => state.businessSettings);
  const invoiceSettings = useAppStore((state) => state.invoiceSettings);
  const notificationSettings = useAppStore((state) => state.notificationSettings);
  const theme = useAppStore((state) => state.theme);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  
  const setLanguage = useAppStore((state) => state.setLanguage);
  const loadSettings = useAppStore((state) => state.loadSettings);
  const updateSerialNumberConfig = useAppStore((state) => state.updateSerialNumberConfig);
  const updateOrderIdConfig = useAppStore((state) => state.updateOrderIdConfig);
  const updateBusinessSettings = useAppStore((state) => state.updateBusinessSettings);
  const updateInvoiceSettings = useAppStore((state) => state.updateInvoiceSettings);
  const updateNotificationSettings = useAppStore((state) => state.updateNotificationSettings);
  const updateTheme = useAppStore((state) => state.updateTheme);
  const resetCategoryToDefaults = useAppStore((state) => state.resetCategoryToDefaults);
  const clearError = useAppStore((state) => state.clearError);

  return {
    language,
    serialNumberConfig,
    orderIdConfig,
    businessSettings,
    invoiceSettings,
    notificationSettings,
    theme,
    isLoading,
    error,
    setLanguage,
    loadSettings,
    updateSerialNumberConfig,
    updateOrderIdConfig,
    updateBusinessSettings,
    updateInvoiceSettings,
    updateNotificationSettings,
    updateTheme,
    resetCategoryToDefaults,
    clearError
  };
};

// Translation utility function with proper memoization
export const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  
  // Translation keys and values
  const translations = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.orders': 'Orders',
      'nav.customers': 'Customers',
      'nav.register': 'Register',
      'nav.payments': 'Payments',
      'nav.cashManagement': 'Cash Management',
      'nav.audit': 'Audit Logs',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      
      // Login
      'login.title': 'Welcome Back',
      'login.subtitle': 'Sign in to Garaad wil waal Laundry Management',
      'login.username': 'Username',
      'login.password': 'Password',
      'login.remember': 'Remember me',
      'login.forgot': 'Forgot password?',
      'login.signin': 'Sign in',
      'login.signing': 'Signing in...',
      'login.demo': 'Demo credentials',
      'login.error.invalid': 'Invalid username or password',
      'login.error.general': 'An error occurred during login',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Manage your laundry operations efficiently',
      'dashboard.stats.totalOrders': 'Total Orders',
      'dashboard.stats.activeCustomers': 'Active Customers',
      'dashboard.stats.monthlyRevenue': 'Monthly Revenue',
      'dashboard.stats.pendingOrders': 'Pending Orders',
      'dashboard.recentOrders': 'Recent Orders',
      'dashboard.recentOrders.subtitle': 'Latest customer orders and their status',
      'dashboard.quickActions': 'Quick Actions',
      'dashboard.quickActions.subtitle': 'Common tasks and shortcuts',
      'dashboard.actions.newOrder': 'New Order',
      'dashboard.actions.newOrder.desc': 'Create new laundry order',
      'dashboard.actions.addCustomer': 'Add Customer',
      'dashboard.actions.addCustomer.desc': 'Register new customer',
      'dashboard.actions.processPayment': 'Process Payment',
      'dashboard.actions.processPayment.desc': 'Record payment received',
      'dashboard.actions.viewReports': 'View Reports',
      'dashboard.actions.viewReports.desc': 'Business analytics',
      
      // Orders
      'orders.title': 'Order Management',
      'orders.search': 'Search orders...',
      'orders.filter.all': 'All Status',
      'orders.filter.received': 'Received',
      'orders.filter.washing': 'Washing',
      'orders.filter.drying': 'Drying',
      'orders.filter.ready': 'Ready',
      'orders.filter.delivered': 'Delivered',
      'orders.new': 'New Order',
      'orders.table.orderNum': 'Order #',
      'orders.table.customer': 'Customer',
      'orders.table.items': 'Items',
      'orders.table.dueDate': 'Due Date',
      'orders.table.amount': 'Amount',
      'orders.table.payment': 'Payment',
      'orders.table.status': 'Status',
      'orders.table.actions': 'Actions',
      'orders.items': 'items',
      
      // Customers
      'customers.title': 'Customer Management',
      'customers.search': 'Search customers...',
      'customers.add': 'Add Customer',
      'customers.orders': 'Orders',
      'customers.spent': 'Spent',
      'customers.lastOrder': 'Last Order',
      'customers.viewDetails': 'View Details',
      'customers.customer': 'Customer',
      
      // Common
      'common.search': 'Search...',
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.view': 'View',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.of': 'of',
      'common.searching': 'Searching...',
      'common.updating': 'Updating...',
      'common.notSet': 'Not Set',
      
      // Status
      'status.received': 'Received',
      'status.washing': 'Washing',
      'status.drying': 'Drying',
      'status.ready': 'Ready',
      'status.delivered': 'Delivered',
      'status.paid': 'Paid',
      'status.pending': 'Pending',
      'status.partial': 'Partial',
      'status.cancelled': 'Cancelled',
      
      // Coming Soon
      'comingSoon.payments': 'Payment tracking and invoice management coming soon...',
      'comingSoon.audit': 'Staff activity tracking and audit logs coming soon...',
      'comingSoon.settings': 'System configuration and user management coming soon...',
      
      // Register
      'register.title': 'Register Management',
      'register.subtitle': 'Search and manage laundry register records',
      'register.search': 'Search Records',
      'register.viewAll': 'View All Records',
      'register.phoneNumber': 'Phone Number',
      'register.phoneNumberPlaceholder': 'Enter phone number to search',
      'register.searchResults': 'Search Results',
      'register.noRecordsFound': 'No records found',
      'register.enterPhoneNumber': 'Please enter a phone number',
      'register.foundRecords': 'Found records',
      'register.searchError': 'Error searching records',
      'register.statusUpdated': 'Status updated successfully',
      'register.statusUpdateError': 'Error updating status',
      'register.fetchError': 'Error fetching records',
      'register.customer': 'Customer',
      'register.contact': 'Contact',
      'register.dropOffDate': 'Drop-off Date',
      'register.pickupDate': 'Pickup Date',
      'register.amount': 'Amount',
      'register.totalAmount': 'Total Amount',
      'register.balance': 'Balance',
      'register.status': 'Status',
      'register.actions': 'Actions',
      'register.laundryItems': 'Laundry Items',
      'register.notes': 'Notes',
      'register.updateStatus': 'Update Status',
      'register.filterByStatus': 'Filter by Status',
      'register.allStatuses': 'All Statuses',
      'register.showingRecords': 'Showing',
      'register.page': 'Page',
    },
    
    so: {
      // Navigation
      'nav.dashboard': 'Shabakada',
      'nav.orders': 'Dalabka',
      'nav.customers': 'Macaamiisha',
      'nav.register': 'Diiwaanka',
      'nav.payments': 'Lacag Bixinta',
      'nav.audit': 'Diiwaanka Hawlaha',
      'nav.settings': 'Habaynta',
      'nav.logout': 'Ka Bax',
      
      // Login
      'login.title': 'Ku Soo Dhawoow',
      'login.subtitle': 'Gal Nidaamka Maamulka Dharka Garaad wil waal',
      'login.username': 'Magaca Isticmaalaha',
      'login.password': 'Sirta',
      'login.remember': 'I xasuuso',
      'login.forgot': 'Ma ilowday sirta?',
      'login.signin': 'Gal',
      'login.signing': 'Waa la galayaa...',
      'login.demo': 'Xogta tijaabada',
      'login.error.invalid': 'Magaca ama sirta waa khalad',
      'login.error.general': 'Khalad ayaa dhacay galitaanka',
      
      // Common translations for Somali
      'common.search': 'Raadi...',
      'common.loading': 'Waa la rarayo...',
      'common.save': 'Kaydi',
      'common.cancel': 'Jooji',
      'common.edit': 'Wax ka Beddel',
      'common.delete': 'Tirtir',
      'common.view': 'Eeg',
      'common.close': 'Xir',
      'common.confirm': 'Xaqiiji',
      'common.yes': 'Haa',
      'common.no': 'Maya',
    },
    
    om: {
      // Navigation
      'nav.dashboard': 'Gabatee',
      'nav.orders': 'Ajajawwan',
      'nav.customers': 'Maamiltoota',
      'nav.register': 'Galmee',
      'nav.payments': 'Kaffaltii',
      'nav.audit': 'Galmee Hojii',
      'nav.settings': 'Qindaa\'ina',
      'nav.logout': 'Ba\'i',
      
      // Login
      'login.title': 'Baga Nagaa Deebi\'tan',
      'login.subtitle': 'Sirna Bulchiinsa Uffata Garaad wil waal keessa gali',
      'login.username': 'Maqaa Fayyadamaa',
      'login.password': 'Jecha Icciitii',
      'login.remember': 'Na yaadadhu',
      'login.forgot': 'Jecha icciitii irraanfatte?',
      'login.signin': 'Gali',
      'login.signing': 'Galaa jira...',
      'login.demo': 'Ragaa qormaataa',
      'login.error.invalid': 'Maqaan ykn jecha icciitii dogoggora',
      'login.error.general': 'Dogoggorri galuu keessatti uumame',
      
      // Dashboard
      'dashboard.title': 'Gabatee',
      'dashboard.subtitle': 'Hojii uffata keessan bu\'a qabeessa ta\'een bulchaa',
      'dashboard.stats.totalOrders': 'Ajajawwan Waliigalaa',
      'dashboard.stats.activeCustomers': 'Maamiltoota Sochii',
      'dashboard.stats.monthlyRevenue': 'Galii Ji\'aa',
      'dashboard.stats.pendingOrders': 'Ajajawwan Eegaa jiran',
      'dashboard.recentOrders': 'Ajajawwan Dhiyeenyaa',
      'dashboard.recentOrders.subtitle': 'Ajajawwan maamilaa haaraa fi haala isaanii',
      'dashboard.quickActions': 'Gochaalee Saffisaa',
      'dashboard.quickActions.subtitle': 'Hojiiwwan beekamoo fi karaalee gabaabaa',
      'dashboard.actions.newOrder': 'Ajaja Haaraa',
      'dashboard.actions.newOrder.desc': 'Ajaja uffataa haaraa uumi',
      'dashboard.actions.addCustomer': 'Maamilaa Dabaluu',
      'dashboard.actions.addCustomer.desc': 'Maamilaa haaraa galmeessi',
      'dashboard.actions.processPayment': 'Kaffaltii Adeemsisuu',
      'dashboard.actions.processPayment.desc': 'Maallaqa argame galmeessi',
      'dashboard.actions.viewReports': 'Gabaasawwan Ilaaluu',
      'dashboard.actions.viewReports.desc': 'Xiinxala daldalaa',
      
      // Orders
      'orders.title': 'Bulchiinsa Ajajaa',
      'orders.search': 'Ajajawwan barbaadi...',
      'orders.filter.all': 'Haala Hundaa',
      'orders.filter.received': 'Fudhatame',
      'orders.filter.washing': 'Dhiqamaa jira',
      'orders.filter.drying': 'Gogaa jira',
      'orders.filter.ready': 'Qophaa\'e',
      'orders.filter.delivered': 'Kenne',
      'orders.new': 'Ajaja Haaraa',
      'orders.table.orderNum': 'Ajaja #',
      'orders.table.customer': 'Maamilaa',
      'orders.table.items': 'Meeshaalee',
      'orders.table.dueDate': 'Guyyaa Xumuraa',
      'orders.table.amount': 'Hanga',
      'orders.table.payment': 'Kaffaltii',
      'orders.table.status': 'Haala',
      'orders.table.actions': 'Gochaalee',
      'orders.items': 'meeshaalee',
    },
    
    am: {
      // Navigation
      'nav.dashboard': 'ዳሽቦርድ',
      'nav.orders': 'ትዕዛዞች',
      'nav.customers': 'ደንበኞች',
      'nav.register': 'መዝገብ',
      'nav.payments': 'ክፍያዎች',
      'nav.audit': 'የሥራ መዝገብ',
      'nav.settings': 'ቅንብሮች',
      'nav.logout': 'ውጣ',
      
      // Login
      'login.title': 'እንኳን ደህና መጡ',
      'login.subtitle': 'ወደ ጋራድ ዊል ዋል የልብስ ማጠቢያ አስተዳደር ይግቡ',
      'login.username': 'የተጠቃሚ ስም',
      'login.password': 'የይለፍ ቃል',
      'login.remember': 'አስታውሰኝ',
      'login.forgot': 'የይለፍ ቃል ረሳሁ?',
      'login.signin': 'ግባ',
      'login.signing': 'እየገባ ነው...',
      'login.demo': 'የሙከራ መረጃ',
      'login.error.invalid': 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም',
      'login.error.general': 'በመግቢያ ወቅት ስህተት ተከስቷል',
      
      // Dashboard
      'dashboard.title': 'ዳሽቦርድ',
      'dashboard.subtitle': 'የልብስ ማጠቢያ ሥራዎችዎን በብቃት ያስተዳድሩ',
      'dashboard.stats.totalOrders': 'ጠቅላላ ትዕዛዞች',
      'dashboard.stats.activeCustomers': 'ንቁ ደንበኞች',
      'dashboard.stats.monthlyRevenue': 'ወርሃዊ ገቢ',
      'dashboard.stats.pendingOrders': 'በመጠባበቅ ላይ ያሉ ትዕዛዞች',
      'dashboard.recentOrders': 'የቅርብ ጊዜ ትዕዛዞች',
      'dashboard.recentOrders.subtitle': 'የቅርብ ጊዜ የደንበኞች ትዕዛዞች እና ሁኔታቸው',
      'dashboard.quickActions': 'ፈጣን እርምጃዎች',
      'dashboard.quickActions.subtitle': 'የተለመዱ ተግባራት እና አቋራጮች',
      'dashboard.actions.newOrder': 'አዲስ ትዕዛዝ',
      'dashboard.actions.newOrder.desc': 'አዲስ የልብስ ማጠቢያ ትዕዛዝ ይፍጠሩ',
      'dashboard.actions.addCustomer': 'ደንበኛ ይጨምሩ',
      'dashboard.actions.addCustomer.desc': 'አዲስ ደንበኛ ይመዝግቡ',
      'dashboard.actions.processPayment': 'ክፍያ ያስኬዱ',
      'dashboard.actions.processPayment.desc': 'የተቀበሉትን ክፍያ ይመዝግቡ',
      'dashboard.actions.viewReports': 'ሪፖርቶችን ይመልከቱ',
      'dashboard.actions.viewReports.desc': 'የንግድ ትንታኔ',
      
      // Orders
      'orders.title': 'የትዕዛዝ አስተዳደር',
      'orders.search': 'ትዕዛዞችን ይፈልጉ...',
      'orders.filter.all': 'ሁሉም ሁኔታ',
      'orders.filter.received': 'ተቀብሏል',
      'orders.filter.washing': 'እየታጠበ',
      'orders.filter.drying': 'እየደረቀ',
      'orders.filter.ready': 'ዝግጁ',
      'orders.filter.delivered': 'ተላልፏል',
      'orders.new': 'አዲስ ትዕዛዝ',
      'orders.table.orderNum': 'ትዕዛዝ #',
      'orders.table.customer': 'ደንበኛ',
      'orders.table.items': 'እቃዎች',
      'orders.table.dueDate': 'የመጨረሻ ቀን',
      'orders.table.amount': 'መጠን',
      'orders.table.payment': 'ክፍያ',
      'orders.table.status': 'ሁኔታ',
      'orders.table.actions': 'እርምጃዎች',
      'orders.items': 'እቃዎች',
    },
  };

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key] || key;
  };

  return { t, language };
};

// Individual selector hooks for better performance and cleaner imports
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAppStore((state) => state.authLoading);
export const useCurrentUser = () => useAppStore((state) => state.user);
export const useLanguage = () => useAppStore((state) => state.language);
export const useTheme = () => useAppStore((state) => state.theme);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useModals = () => useAppStore((state) => state.modals);
export const useLoading = () => useAppStore((state) => state.loading);
export const useOrders = () => useAppStore((state) => state.orders);
export const useCustomers = () => useAppStore((state) => state.customers);
export const usePayments = () => useAppStore((state) => state.payments);
export const useStats = () => useAppStore((state) => state.stats);