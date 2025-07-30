import { toast, ToastOptions, ToastPosition } from 'react-toastify';

interface CustomToastOptions extends Omit<ToastOptions, 'position'> {
  position?: ToastPosition;
}

export const useToast = () => {
  const defaultOptions: CustomToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const notify = {
    success: (message: string, options?: CustomToastOptions) => {
      toast.success(message, { ...defaultOptions, ...options });
    },

    error: (message: string, options?: CustomToastOptions) => {
      toast.error(message, { ...defaultOptions, ...options });
    },

    warning: (message: string, options?: CustomToastOptions) => {
      toast.warning(message, { ...defaultOptions, ...options });
    },

    info: (message: string, options?: CustomToastOptions) => {
      toast.info(message, { ...defaultOptions, ...options });
    },

    // Server response handlers
    serverSuccess: (message?: string) => {
      toast.success(message || 'Operation completed successfully!', defaultOptions);
    },

    serverError: (message?: string) => {
      toast.error(message || 'Server error occurred. Please try again.', defaultOptions);
    },

    apiError: (status: number, message?: string) => {
      let errorMessage = message || 'An error occurred';
      
      switch (status) {
        case 400:
          errorMessage = message || 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = message || 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = message || 'Access denied.';
          break;
        case 404:
          errorMessage = message || 'Resource not found.';
          break;
        case 500:
          errorMessage = message || 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = message || `Error ${status}: Something went wrong.`;
      }
      
      toast.error(errorMessage, defaultOptions);
    },

    // Custom positions
    topRight: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[type](message, { ...defaultOptions, position: 'top-right' });
    },

    topLeft: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[type](message, { ...defaultOptions, position: 'top-left' });
    },

    bottomRight: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[type](message, { ...defaultOptions, position: 'bottom-right' });
    },

    bottomLeft: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[type](message, { ...defaultOptions, position: 'bottom-left' });
    },

    // Dismiss all toasts
    dismiss: () => {
      toast.dismiss();
    },

    // Custom toast with emoji
    withEmoji: (message: string, emoji: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      toast[type](`${emoji} ${message}`, defaultOptions);
    }
  };

  return { notify, toast };
};

// Example usage functions
export const toastExamples = {
  topRight: () => {
    toast.success('Hey 👋!', {
      position: 'top-right',
    });
  },

  withCustomOptions: () => {
    toast.success('Custom toast!', {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },

  differentTypes: () => {
    toast.success('Success message!');
    toast.error('Error message!');
    toast.warning('Warning message!');
    toast.info('Info message!');
  }
};