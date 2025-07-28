import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'so' | 'om' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation keys and values
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.orders': 'Orders',
    'nav.customers': 'Customers',
    'nav.payments': 'Payments',
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
    
    // Status
    'status.received': 'Received',
    'status.washing': 'Washing',
    'status.drying': 'Drying',
    'status.ready': 'Ready',
    'status.delivered': 'Delivered',
    'status.paid': 'Paid',
    'status.pending': 'Pending',
    'status.partial': 'Partial',
    
    // Coming Soon
    'comingSoon.payments': 'Payment tracking and invoice management coming soon...',
    'comingSoon.audit': 'Staff activity tracking and audit logs coming soon...',
    'comingSoon.settings': 'System configuration and user management coming soon...',
  },
  
  so: {
    // Navigation
    'nav.dashboard': 'Shabakada',
    'nav.orders': 'Dalabka',
    'nav.customers': 'Macaamiisha',
    'nav.payments': 'Lacag Bixinta',
    'nav.audit': 'Diiwaanka',
    'nav.settings': 'Dejinta',
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
    
    // Dashboard
    'dashboard.title': 'Shabakada',
    'dashboard.subtitle': 'Si hufan u maamul hawlaha dharka',
    'dashboard.stats.totalOrders': 'Wadarta Dalabka',
    'dashboard.stats.activeCustomers': 'Macaamiisha Firfircoon',
    'dashboard.stats.monthlyRevenue': 'Dakhliga Bishii',
    'dashboard.stats.pendingOrders': 'Dalabka Sugaya',
    'dashboard.recentOrders': 'Dalabka Dhawaan',
    'dashboard.recentOrders.subtitle': 'Dalabka macaamiisha ugu dambeeyay iyo xaaladooda',
    'dashboard.quickActions': 'Ficillada Degdega ah',
    'dashboard.quickActions.subtitle': 'Hawlaha caadiga ah iyo shuruudaha',
    'dashboard.actions.newOrder': 'Dalab Cusub',
    'dashboard.actions.newOrder.desc': 'Samee dalab cusub oo dhar ah',
    'dashboard.actions.addCustomer': 'Ku Dar Macmiil',
    'dashboard.actions.addCustomer.desc': 'Diiwaangeli macmiil cusub',
    'dashboard.actions.processPayment': 'Lacag Bixin',
    'dashboard.actions.processPayment.desc': 'Diiwaangeli lacagta la helay',
    'dashboard.actions.viewReports': 'Eeg Warbixinnada',
    'dashboard.actions.viewReports.desc': 'Falanqaynta ganacsiga',
    
    // Orders
    'orders.title': 'Maamulka Dalabka',
    'orders.search': 'Raadi dalabka...',
    'orders.filter.all': 'Dhammaan Xaaladaha',
    'orders.filter.received': 'La Helay',
    'orders.filter.washing': 'Waa la Dhaqayaa',
    'orders.filter.drying': 'Waa la Qalajinayaa',
    'orders.filter.ready': 'Diyaar',
    'orders.filter.delivered': 'La Dhiibay',
    'orders.new': 'Dalab Cusub',
    'orders.table.orderNum': 'Dalab #',
    'orders.table.customer': 'Macmiil',
    'orders.table.items': 'Alaabta',
    'orders.table.dueDate': 'Taariikhda',
    'orders.table.amount': 'Qiimaha',
    'orders.table.payment': 'Lacag Bixinta',
    'orders.table.status': 'Xaalada',
    'orders.table.actions': 'Ficillada',
    'orders.items': 'alaab',
    
    // Customers
    'customers.title': 'Maamulka Macaamiisha',
    'customers.search': 'Raadi macaamiisha...',
    'customers.add': 'Ku Dar Macmiil',
    'customers.orders': 'Dalabka',
    'customers.spent': 'Kharashka',
    'customers.lastOrder': 'Dalabkii Dambe',
    'customers.viewDetails': 'Eeg Faahfaahinta',
    'customers.customer': 'Macmiil',
    
    // Common
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
    
    // Status
    'status.received': 'La Helay',
    'status.washing': 'Waa la Dhaqayaa',
    'status.drying': 'Waa la Qalajinayaa',
    'status.ready': 'Diyaar',
    'status.delivered': 'La Dhiibay',
    'status.paid': 'La Bixiyay',
    'status.pending': 'Sugaya',
    'status.partial': 'Qayb',
    
    // Coming Soon
    'comingSoon.payments': 'Raadraaca lacag bixinta iyo maamulka biilasha ayaa dhawaan imanaya...',
    'comingSoon.audit': 'Raadraaca hawlaha shaqaalaha iyo diiwaanka ayaa dhawaan imanaya...',
    'comingSoon.settings': 'Habaynta nidaamka iyo maamulka isticmaalayaasha ayaa dhawaan imanaya...',
  },
  
  om: {
    // Navigation
    'nav.dashboard': 'Gabatee',
    'nav.orders': 'Ajajawwan',
    'nav.customers': 'Maamiltoota',
    'nav.payments': 'Kaffaltii',
    'nav.audit': 'Galmee Sakatta\'ina',
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
    
    // Customers
    'customers.title': 'Bulchiinsa Maamilaa',
    'customers.search': 'Maamiltoota barbaadi...',
    'customers.add': 'Maamilaa Dabaluu',
    'customers.orders': 'Ajajawwan',
    'customers.spent': 'Baase',
    'customers.lastOrder': 'Ajaja Dhumaa',
    'customers.viewDetails': 'Bal\'ina Ilaaluu',
    'customers.customer': 'Maamilaa',
    
    // Common
    'common.search': 'Barbaadi...',
    'common.loading': 'Fe\'aa jira...',
    'common.save': 'Olkaa\'i',
    'common.cancel': 'Dhiisi',
    'common.edit': 'Fooyyessi',
    'common.delete': 'Haqi',
    'common.view': 'Ilaali',
    'common.close': 'Cufii',
    'common.confirm': 'Mirkaneessi',
    'common.yes': 'Eeyyee',
    'common.no': 'Lakki',
    
    // Status
    'status.received': 'Fudhatame',
    'status.washing': 'Dhiqamaa jira',
    'status.drying': 'Gogaa jira',
    'status.ready': 'Qophaa\'e',
    'status.delivered': 'Kenne',
    'status.paid': 'Kaffalame',
    'status.pending': 'Eegaa jira',
    'status.partial': 'Kutaa',
    
    // Coming Soon
    'comingSoon.payments': 'Hordoffii kaffaltii fi bulchiinsa biilii dhiyeenyaan dhufa...',
    'comingSoon.audit': 'Hordoffii sochii hojjettootaa fi galmee sakatta\'inaa dhiyeenyaan dhufa...',
    'comingSoon.settings': 'Qindaa\'ina sirnaa fi bulchiinsa fayyadamtootaa dhiyeenyaan dhufa...',
  },
  
  am: {
    // Navigation
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.orders': 'ትዕዛዞች',
    'nav.customers': 'ደንበኞች',
    'nav.payments': 'ክፍያዎች',
    'nav.audit': 'የኦዲት ሎጎች',
    'nav.settings': 'ቅንብሮች',
    'nav.logout': 'ውጣ',
    
    // Login
    'login.title': 'እንኳን ደህና መጡ',
    'login.subtitle': 'ወደ ጋራድ ዊል ዋል የልብስ ማጠቢያ አስተዳደር ይግቡ',
    'login.username': 'የተጠቃሚ ስም',
    'login.password': 'የይለፍ ቃል',
    'login.remember': 'አስታውሰኝ',
    'login.forgot': 'የይለፍ ቃልዎን ረሱት?',
    'login.signin': 'ግባ',
    'login.signing': 'እየገባ ነው...',
    'login.demo': 'የማሳያ ምስክርነቶች',
    'login.error.invalid': 'የተጠቃሚ ስም ወይም የይለፍ ቃል ትክክል አይደለም',
    'login.error.general': 'በመግባት ወቅት ስህተት ተከስቷል',
    
    // Dashboard
    'dashboard.title': 'ዳሽቦርድ',
    'dashboard.subtitle': 'የልብስ ማጠቢያ ስራዎችዎን በብቃት ያስተዳድሩ',
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
    'dashboard.actions.addCustomer': 'ደንበኛ ጨምር',
    'dashboard.actions.addCustomer.desc': 'አዲስ ደንበኛ ይመዝግቡ',
    'dashboard.actions.processPayment': 'ክፍያ ሂደት',
    'dashboard.actions.processPayment.desc': 'የተቀበለውን ክፍያ ይመዝግቡ',
    'dashboard.actions.viewReports': 'ሪፖርቶችን ይመልከቱ',
    'dashboard.actions.viewReports.desc': 'የንግድ ትንታኔዎች',
    
    // Orders
    'orders.title': 'የትዕዛዝ አስተዳደር',
    'orders.search': 'ትዕዛዞችን ይፈልጉ...',
    'orders.filter.all': 'ሁሉም ሁኔታዎች',
    'orders.filter.received': 'ተቀብሏል',
    'orders.filter.washing': 'እየታጠበ ነው',
    'orders.filter.drying': 'እየደረቀ ነው',
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
    
    // Customers
    'customers.title': 'የደንበኞች አስተዳደር',
    'customers.search': 'ደንበኞችን ይፈልጉ...',
    'customers.add': 'ደንበኛ ጨምር',
    'customers.orders': 'ትዕዛዞች',
    'customers.spent': 'ወጪ',
    'customers.lastOrder': 'የመጨረሻ ትዕዛዝ',
    'customers.viewDetails': 'ዝርዝሮችን ይመልከቱ',
    'customers.customer': 'ደንበኛ',
    
    // Common
    'common.search': 'ይፈልጉ...',
    'common.loading': 'እየጫነ ነው...',
    'common.save': 'አስቀምጥ',
    'common.cancel': 'ሰርዝ',
    'common.edit': 'አርትዕ',
    'common.delete': 'ሰርዝ',
    'common.view': 'ይመልከቱ',
    'common.close': 'ዝጋ',
    'common.confirm': 'አረጋግጥ',
    'common.yes': 'አዎ',
    'common.no': 'አይ',
    
    // Status
    'status.received': 'ተቀብሏል',
    'status.washing': 'እየታጠበ ነው',
    'status.drying': 'እየደረቀ ነው',
    'status.ready': 'ዝግጁ',
    'status.delivered': 'ተላልፏል',
    'status.paid': 'ተከፍሏል',
    'status.pending': 'በመጠባበቅ ላይ',
    'status.partial': 'ከፊል',
    
    // Coming Soon
    'comingSoon.payments': 'የክፍያ ክትትል እና የደረሰኝ አስተዳደር በቅርቡ ይመጣል...',
    'comingSoon.audit': 'የሰራተኞች እንቅስቃሴ ክትትል እና የኦዲት ሎጎች በቅርቡ ይመጣል...',
    'comingSoon.settings': 'የስርዓት ውቅር እና የተጠቃሚ አስተዳደር በቅርቡ ይመጣል...',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('laundry_language') as Language;
    if (savedLanguage && ['en', 'so', 'om', 'am'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('laundry_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};