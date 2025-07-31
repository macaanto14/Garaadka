import React from 'react';
import { useUI } from '../../store';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications } = useUI();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-full">
      {/* Mobile responsive container */}
      <div className="flex flex-col items-end space-y-3 pointer-events-none px-4 sm:px-0">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto w-full sm:w-auto">
            <Notification notification={notification} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;