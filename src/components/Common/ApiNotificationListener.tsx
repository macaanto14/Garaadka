import { useEffect } from 'react';
import { useToast } from '../../hooks/useToast';

const ApiNotificationListener: React.FC = () => {
  const { notify } = useToast();

  useEffect(() => {
    const handleApiSuccess = (event: CustomEvent) => {
      const { data, method, url } = event.detail;
      
      // Customize messages based on the endpoint
      let message = 'Operation completed successfully';
      
      if (url.includes('/customers')) {
        if (method === 'POST') message = 'Customer created successfully';
        if (method === 'PUT') message = 'Customer updated successfully';
        if (method === 'DELETE') message = 'Customer deleted successfully';
      } else if (url.includes('/orders')) {
        if (method === 'POST') message = 'Order created successfully';
        if (method === 'PUT' || method === 'PATCH') message = 'Order updated successfully';
        if (method === 'DELETE') message = 'Order deleted successfully';
      } else if (url.includes('/payments')) {
        if (method === 'POST') message = 'Payment recorded successfully';
        if (method === 'PUT') message = 'Payment updated successfully';
      }
      
      notify.success(message);
    };

    const handleApiError = (event: CustomEvent) => {
      const { status, message, url } = event.detail;
      notify.apiError(status, message);
    };

    // Add event listeners
    window.addEventListener('api-success', handleApiSuccess as EventListener);
    window.addEventListener('api-error', handleApiError as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('api-success', handleApiSuccess as EventListener);
      window.removeEventListener('api-error', handleApiError as EventListener);
    };
  }, [notify]);

  return null; // This component doesn't render anything
};

export default ApiNotificationListener;