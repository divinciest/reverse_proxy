import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // seconds
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleString();
}

const NotificationIcon = () => {
    const { notifications, dismissNotification, markNotificationsAsRead, markAllNotificationsAsRead } = useNotifications();
    
    console.log('[Debug] NotificationIcon: Received notifications state:', notifications);

    const unreadNotifications = notifications.filter(n => n.status === 'unread');

    console.log('[Debug] NotificationIcon: Filtered unread notifications:', unreadNotifications);
    console.log('[Debug] NotificationIcon: Number of unread notifications:', unreadNotifications.length);

    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showAll) {
                setShowAll(false);
            }
        };

        if (showAll) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [showAll]);

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadNotifications.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium leading-none text-foreground">Notifications</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="flex justify-between items-center px-2 pb-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAll(true)}>
                        View All
                    </Button>
                    <Button size="sm" variant="outline" onClick={markAllNotificationsAsRead} disabled={unreadNotifications.length === 0}>
                        Mark All as Read
                    </Button>
                </div>
                {unreadNotifications.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {unreadNotifications.map((notification) => {
                            const freq = (notification as any).frequency || 0;
                            return (
                                <div
                                    key={notification._id}
                                    className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md mb-1 flex items-center p-2"
                                >
                                    <DropdownMenuItem onSelect={() => dismissNotification(notification._id)} className="flex-1 bg-transparent p-0 h-auto">
                                        <div className="flex flex-col w-full">
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground text-sm">{notification.data.message}</span>
                                                {freq > 0 && <span className="text-muted-foreground text-xs">x{freq + 1}</span>}
                                            </div>
                                            <span className="text-muted-foreground text-xs mt-1">{formatTimeAgo(notification.createdAt)}</span>
                                        </div>
                                    </DropdownMenuItem>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
        {showAll && createPortal(
            <div 
                className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[9999] flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowAll(false);
                    }
                }}
            >
                <div 
                    className="bg-background border border-border rounded-lg max-w-md w-full max-h-[80vh] shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 max-h-[calc(80vh-3rem)] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-foreground">All Notifications</h2>
                            <Button size="sm" variant="outline" onClick={() => setShowAll(false)}>Close</Button>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">No notifications</div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notification) => {
                                    const freq = (notification as any).frequency || 0;
                                    const isUnread = notification.status === 'unread';
                                    return (
                                        <div 
                                            key={notification._id} 
                                            className={`p-3 rounded-md border ${
                                                isUnread 
                                                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' 
                                                    : 'bg-muted/50 border-border'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex flex-col flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground text-sm">{notification.data.message}</span>
                                                        {freq > 0 && <span className="text-muted-foreground text-xs">x{freq + 1}</span>}
                                                    </div>
                                                    <span className="text-muted-foreground text-xs mt-1">{formatTimeAgo(notification.createdAt)}</span>
                                                </div>
                                                {isUnread && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        onClick={() => dismissNotification(notification._id)}
                                                        className="shrink-0"
                                                    >
                                                        Mark as Read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
};

export default NotificationIcon; 