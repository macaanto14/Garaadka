// Global Toast utility that provides a simple API for showing notifications
// This works by dispatching custom events that are handled by the notification system

export interface ToastOptions {
  duration?: number;
  closable?: boolean;
}

class ToastManager {
  private static instance: ToastManager;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private dispatchToastEvent(type: 'success' | 'error' | 'info' | 'warning', message: string, options?: ToastOptions) {
    const event = new CustomEvent('toast-notification', {
      detail: {
        type,
        title: this.getDefaultTitle(type),
        message,
        duration: options?.duration || 5000,
        closable: options?.closable !== false,
      }
    });
    window.dispatchEvent(event);
  }

  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error!';
      case 'info':
        return 'Info!';
      case 'warning':
        return 'Warning!';
      default:
        return 'Notification';
    }
  }

  public success(message: string, options?: ToastOptions): void {
    this.dispatchToastEvent('success', message, options);
  }

  public error(message: string, options?: ToastOptions): void {
    this.dispatchToastEvent('error', message, options);
  }

  public info(message: string, options?: ToastOptions): void {
    this.dispatchToastEvent('info', message, options);
  }

  public warning(message: string, options?: ToastOptions): void {
    this.dispatchToastEvent('warning', message, options);
  }
}

// Export singleton instance
export const Toast = ToastManager.getInstance();

// Default export for convenience
export default Toast;