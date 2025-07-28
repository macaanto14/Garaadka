// In any component
import { useNotify } from '../hooks/useNotify';

const MyComponent = () => {
  const notify = useNotify();

  const handleSomething = () => {
    // Manual notifications
    notify.success('Success!', 'Operation completed successfully');
    notify.error('Error!', 'Something went wrong');
    notify.warning('Warning!', 'Please check your input');
    notify.info('Info', 'This is an informational message');
  };

  // API calls will automatically show notifications
  const createCustomer = async () => {
    try {
      await customersAPI.create(customerData);
      // Success notification will be shown automatically
    } catch (error) {
      // Error notification will be shown automatically
    }
  };
};