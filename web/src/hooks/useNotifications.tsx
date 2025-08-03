import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { useAuth } from './useAuthHook';

interface Notification {
  _id: string;
  data: {
    message: string;
    type: string;
  };
  createdAt: string;
  status: 'read' | 'unread';
}

interface NotificationContextType {
  notifications: Notification[];
  dismissNotification: (id: string) => Promise<void>;
  markNotificationsAsRead: (ids: string[]) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      return;
    }

    console.log('Setting up comprehensive SSE debugging...');
    
    const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/notifications/stream`);
    url.searchParams.append('token', token);
    
    console.log('SSE URL:', url.toString());
    
    const eventSource = new EventSource(url.toString());

    // Track connection state
    console.log('Initial EventSource readyState:', eventSource.readyState);

    const handleMessage = (data: string, source: string) => {
      console.log(`[SSE] handleMessage called from ${source} with data:`, data);
      
      // Skip heartbeat messages or empty data
      if (!data || data.trim() === '' || data.includes('heartbeat')) {
        console.log('[SSE] Skipping heartbeat or empty message');
        return;
      }
      
      try {
        const parsed = JSON.parse(data);
        console.log('[SSE] Parsed notification:', parsed);
        
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === parsed._id);
          if (exists) {
            console.log('[SSE] Notification already exists:', parsed._id);
            return prev;
          }
          console.log('[SSE] Adding new notification:', parsed._id);
          return [...prev, parsed];
        });
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err);
        console.error('[SSE] Raw data that failed to parse:', data);
      }
    };

    eventSource.onopen = (event) => {
      console.log('[SSE] Connection opened:', event);
      console.log('[SSE] ReadyState after open:', eventSource.readyState);
    };

    eventSource.onmessage = (event) => {
      console.log('[SSE] onmessage triggered:', event);
      console.log('[SSE] onmessage - Event data:', event.data);
      console.log('[SSE] onmessage - Event type:', event.type);
      console.log('[SSE] onmessage - Event lastEventId:', event.lastEventId);
      console.log('[SSE] onmessage - Event origin:', event.origin);
      handleMessage(event.data, 'onmessage');
    };

    // Listen for all possible event types
    ['message', 'data', 'notification', 'event'].forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        console.log(`[SSE] addEventListener ${eventType} triggered:`, event);
        if (event instanceof MessageEvent) {
          console.log(`[SSE] ${eventType} - Event data:`, event.data);
          handleMessage(event.data, `addEventListener-${eventType}`);
        }
      });
    });

    eventSource.onerror = (error) => {
      console.error('[SSE] EventSource error:', error);
      console.error('[SSE] ReadyState:', eventSource.readyState);
      console.error('[SSE] URL:', eventSource.url);
      
      // Log the specific error state
      switch (eventSource.readyState) {
        case 0:
          console.log('[SSE] State: CONNECTING');
          break;
        case 1:
          console.log('[SSE] State: OPEN');
          break;
        case 2:
          console.log('[SSE] State: CLOSED');
          break;
      }
    };

    // Manual polling to check if data is being received
    const pollInterval = setInterval(() => {
      console.log('[SSE] Polling - ReadyState:', eventSource.readyState);
      console.log('[SSE] Polling - Current notifications count:', notifications.length);
    }, 5000);

    // Alternative approach: Use fetch to manually check the stream
    const testFetch = async () => {
      try {
        console.log('[SSE] Testing fetch to same endpoint...');
        const response = await fetch(url.toString());
        console.log('[SSE] Fetch response status:', response.status);
        console.log('[SSE] Fetch response headers:', response.headers);
        
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          // Read first chunk to see if data is flowing
          const { done, value } = await reader.read();
          if (!done && value) {
            const chunk = decoder.decode(value);
            console.log('[SSE] First chunk via fetch:', chunk);
          }
          reader.releaseLock();
        }
      } catch (error) {
        console.error('[SSE] Fetch test error:', error);
      }
    };

    // Test after 2 seconds
    setTimeout(testFetch, 2000);

    return () => {
      console.log('[SSE] Cleaning up connection');
      clearInterval(pollInterval);
      eventSource.close();
    };
  }, [isAuthenticated, token]);

  const dismissNotification = useCallback(async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark_read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [id] }),
      });

      if (response.ok) {
        setNotifications((prevNotifications) => prevNotifications.filter((n) => n._id !== id));
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [token]);

  const markNotificationsAsRead = useCallback(async (ids: string[]) => {
    if (!token || !ids.length) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark_read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });
      if (response.ok) {
        setNotifications((prevNotifications) => prevNotifications.filter((n) => !ids.includes(n._id)));
      } else {
        console.error('Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [token]);

  const markAllNotificationsAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n._id);
    if (!token || unreadIds.length === 0) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark_read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (response.ok) {
        setNotifications((prevNotifications) => prevNotifications.filter((n) => !unreadIds.includes(n._id)));
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [token, notifications]);

  const value = {
    notifications,
    dismissNotification,
    markNotificationsAsRead,
    markAllNotificationsAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};