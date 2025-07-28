import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="flex flex-col items-end space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Notification notification={notification} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;