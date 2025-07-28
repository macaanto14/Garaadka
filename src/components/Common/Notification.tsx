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
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <div className={`
        max-w-sm w-full shadow-lg rounded-lg border pointer-events-auto
        ${getBackgroundColor()}
      `}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className={`text-sm font-medium ${getTextColor()}`}>
                {notification.title}
              </p>
              {notification.message && (
                <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
                  {notification.message}
                </p>
              )}
            </div>
            {notification.closable && (
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={handleClose}
                  className={`
                    inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${notification.type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' : ''}
                    ${notification.type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' : ''}
                    ${notification.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500' : ''}
                    ${notification.type === 'info' ? 'text-blue-400 hover:text-blue-500 focus:ring-blue-500' : ''}
                  `}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
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