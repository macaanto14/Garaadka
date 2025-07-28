import { useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const ToastListener: React.FC = () => {
  const { addNotification } = useNotification();

  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const { type, title, message, duration, closable } = event.detail;
      
      addNotification({
        type,
        title,
        message,
        duration,
        closable,
      });
    };

    // Add event listener for toast notifications
    window.addEventListener('toast-notification', handleToastEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('toast-notification', handleToastEvent as EventListener);
    };
  }, [addNotification]);

  return null; // This component doesn't render anything
};

export default ToastListener;