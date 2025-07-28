import { useNotification, NotificationType } from '../contexts/NotificationContext';

export const useNotify = () => {
  const { addNotification } = useNotification();

  const notify = {
    success: (title: string, message?: string, duration?: number) => {
      addNotification({
        type: 'success' as NotificationType,
        title,
        message,
        duration,
      });
    },
    
    error: (title: string, message?: string, duration?: number) => {
      addNotification({
        type: 'error' as NotificationType,
        title,
        message,
        duration,
      });
    },
    
    warning: (title: string, message?: string, duration?: number) => {
      addNotification({
        type: 'warning' as NotificationType,
        title,
        message,
        duration,
      });
    },
    
    info: (title: string, message?: string, duration?: number) => {
      addNotification({
        type: 'info' as NotificationType,
        title,
        message,
        duration,
      });
    },

    // Server response handlers
    serverSuccess: (response: any) => {
      addNotification({
        type: 'success' as NotificationType,
        title: 'Success',
        message: response?.message || 'Operation completed successfully',
        duration: 4000,
      });
    },

    serverError: (error: any) => {
      addNotification({
        type: 'error' as NotificationType,
        title: 'Error',
        message: error?.message || error?.error || 'An error occurred',
        duration: 6000,
      });
    },

    apiError: (status: number, message?: string) => {
      let title = 'Error';
      let defaultMessage = 'An error occurred';

      switch (status) {
        case 400:
          title = 'Bad Request';
          defaultMessage = 'Invalid request data';
          break;
        case 401:
          title = 'Unauthorized';
          defaultMessage = 'Please log in to continue';
          break;
        case 403:
          title = 'Forbidden';
          defaultMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          title = 'Not Found';
          defaultMessage = 'The requested resource was not found';
          break;
        case 500:
          title = 'Server Error';
          defaultMessage = 'Internal server error occurred';
          break;
      }

      addNotification({
        type: 'error' as NotificationType,
        title,
        message: message || defaultMessage,
        duration: 6000,
      });
    }
  };

  return notify;
};