import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useActiveTab, useIsAuthenticated, useAuthLoading, useAppStore } from './store';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import InteractiveDashboard from './components/Dashboard/InteractiveDashboard';
import OrderList from './components/Orders/OrderList';
import CustomerList from './components/Customers/CustomerList';
import RegisterPage from './components/Register/RegisterPage';
import PaymentManagement from './components/Payments/PaymentManagement';
import AuditLogs from './components/Audit/AuditLogs';
import Settings from './components/Settings/Settings';
import GlobalNotifications from './components/Common/GlobalNotifications';

// Main App Content Component
const AppContent: React.FC = () => {
  const activeTab = useActiveTab();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InteractiveDashboard />;
      case 'orders':
        return <OrderList />;
      case 'customers':
        return <CustomerList />;
      case 'register':
        return <RegisterPage />;
      case 'payments':
        return <PaymentManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      default:
        return <InteractiveDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
      <GlobalNotifications />
    </div>
  );
};

// Auth Initializer Component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the store directly to avoid selector issues
  const initializeAuth = useAppStore((state) => state.initializeAuth);

  useEffect(() => {
    // Call initializeAuth only once on mount
    if (initializeAuth) {
      initializeAuth();
    }
  }, [initializeAuth]); // Include initializeAuth in dependencies but it should be stable

  return <>{children}</>;
};

// Root App Component
const App: React.FC = () => {
  return (
    <AuthInitializer>
      <AppContent />
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
      />
    </AuthInitializer>
  );
};

export default App;