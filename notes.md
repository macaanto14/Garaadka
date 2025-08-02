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


# Test health endpoint
curl http://47.236.39.181:5000/api/health

# Or run the batch file
test-cloud.bat

# Development with cloud backend
npm run dev:cloud

# Build for production with cloud backend  
npm run build:cloud


Best Way to Use Zustand

1) Selective State Access (Avoid Re-Renders)

Always select only what you need from the store to prevent unnecessary re-renders.

2) Use Immer for Immutability

Zustand works great with Immer, especially for deep state updates.

3) Persist State with Middleware

Persist user preferences or auth tokens using zustand/middleware.

4) Split Stores for Better Modularity

Avoid monolithic stores. Split by domain, feature, or responsibility.

5) Avoid React Context Unless Needed

Zustand works independently of React context. Only use context if you need to scope stores (e.g., per-user sessions in multi-tab apps).

6) Use Zustand Outside React
You can use the store even in utility functions or event handlers outside React components.

7) Subscribe to Store Changes

For non-component logic (e.g., analytics, localStorage sync):




Avoid Common Mistakes 

- Accessing full state ( Why It’s Bad - Triggers unnecessary re-renders - Fix = Use selector functions)

- Single giant store (Why It’s Bad - Hard to maintain and debug - Fix = Split by domain )

- Updating nested objects without Immer (	Why It’s Bad - Can lead to bugs - fix = Use immer middleware)

- Using Zustand as local state - (	Why It’s Bad - Overkill for local component state - fix = Use useState or useReducer instead)


| Mistake                               | Why It’s Bad                       | Fix                                    |
| ------------------------------------- | ---------------------------------- | -------------------------------------- |
| Accessing full state                  | Triggers unnecessary re-renders    | Use selector functions                 |
| Single giant store                    | Hard to maintain and debug         | Split by domain                        |
| Updating nested objects without Immer | Can lead to bugs                   | Use `immer` middleware                 |
| Using Zustand as local state          | Overkill for local component state | Use `useState` or `useReducer` instead |
