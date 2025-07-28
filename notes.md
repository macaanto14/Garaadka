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





<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "7e9774dd-626b-48c2-81b8-a0833fbff196",
      safari_web_id: "web.onesignal.auto.54eebb47-16d1-4f2f-8c9e-9bb7522bb051",
      notifyButton: {
        enable: true,
      },
    });
  });
</script>

Toast.success('Operation completed', { 
  duration: 3000,  // 3 seconds
  closable: true   // Allow manual close
});

import Toast from '../utils/Toast';

// In any component or function
Toast.success('Customer created successfully!');
Toast.error('Failed to save customer data');
Toast.info('Loading customer information...');


// Usage examples:
Toast.success('Any success message to be displayed');
Toast.error('Any error message to be displayed');
Toast.info('Any informative message to be displayed');
Toast.warning('Any warning message to be displayed'); // Bonus!