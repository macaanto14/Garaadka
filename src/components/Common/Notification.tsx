import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { NotificationData, useNotification } from '../../contexts/NotificationContext';

interface NotificationProps {
  notification: NotificationData;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss effect
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id]);

  const handleClose = () => {
    if (isLeaving) return; // Prevent multiple close calls
    
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  const getIcon = () => {
    const iconClass = "h-6 w-6 sm:h-7 sm:w-7 text-white flex-shrink-0";
    switch (notification.type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        return <Info className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-4
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <div className={`
        w-full sm:max-w-md shadow-2xl rounded-xl border-0 pointer-events-auto overflow-hidden
        ${getBackgroundColor()}
      `}>
        <div className="p-4 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
              <p className="text-lg sm:text-xl font-bold text-white leading-tight break-words">
                {notification.title}
              </p>
              {notification.message && (
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-white opacity-95 leading-relaxed break-words">
                  {notification.message}
                </p>
              )}
            </div>
            {notification.closable && (
              <div className="ml-3 sm:ml-4 flex-shrink-0 flex">
                <button
                  onClick={handleClose}
                  className="inline-flex rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors duration-200 p-1"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;