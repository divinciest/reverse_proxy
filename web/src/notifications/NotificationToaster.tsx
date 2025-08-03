import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationToaster = () => {
  const { notifications } = useNotifications();

  useEffect(() => {
    if (notifications.length > 0) {
      const lastNotification = notifications[notifications.length - 1];
      if (lastNotification && lastNotification.data) {
        toast(lastNotification.data.message, {
          id: lastNotification._id
        });
      }
    }
  }, [notifications]);

  return null;
};

export default NotificationToaster; 