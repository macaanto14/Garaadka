import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import OrderList from './components/Orders/OrderList';
import CustomerList from './components/Customers/CustomerList';
import RegisterSearch from './components/Register/RegisterSearch';
import RegisterList from './components/Register/RegisterList';
import PaymentManagement from './components/Payments/PaymentManagement';
import AuditLogs from './components/Audit/AuditLogs';
import Settings from './components/Settings/Settings';

const RegisterManagement: React.FC = () => {
  const [activeRegisterTab, setActiveRegisterTab] = useState<'search' | 'list'>('search');
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('register.title')}</h2>
            <p className="text-gray-600 mt-1">{t('register.subtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveRegisterTab('search')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeRegisterTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('register.search').replace('...', '')}
            </button>
            <button
              onClick={() => setActiveRegisterTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeRegisterTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('register.viewAll')}
            </button>
          </div>
        </div>
        
        {activeRegisterTab === 'search' ? <RegisterSearch /> : <RegisterList />}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const { activeTab, setActiveTab } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderList />;
      case 'customers':
        return <CustomerList />;
      case 'register':
        return <RegisterManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      {/* React Toastify Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
        toastClassName="toast-item"
        bodyClassName="toast-body"
        progressClassName="toast-progress"
      />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;