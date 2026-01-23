import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore, getNotificationIcon, formatNotificationTime, getNotificationColor, NotificationType } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unread' | 'bookings' | 'reviews' | 'updates' | 'offers';

export function NotificationCenter() {
  const { user, accountType, isAuthenticated } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    if (isAuthenticated && user && accountType) {
      fetchNotifications(user.id, accountType);
    }
  }, [isAuthenticated, user, accountType, fetchNotifications]);

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'bookings':
        return notifications.filter(n => 
          ['booking_confirmation', 'booking_reminder', 'booking_modification', 'booking_cancellation', 'new_booking', 'cancellation_alert'].includes(n.type)
        );
      case 'reviews':
        return notifications.filter(n => 
          ['review_request', 'review_alert', 'negative_review'].includes(n.type)
        );
      case 'updates':
        return notifications.filter(n => 
          ['system_update', 'daily_summary', 'weekly_report', 'capacity_alert'].includes(n.type)
        );
      case 'offers':
        return notifications.filter(n => n.type === 'special_offer');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList className="w-full justify-start mb-6 overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'all' 
                  ? "When you receive notifications, they'll appear here."
                  : `No ${activeTab} notifications.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'bg-card rounded-xl border border-border p-4 transition-all hover:shadow-md',
                  !notification.read && 'border-primary/30 bg-primary/5'
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0',
                    getNotificationColor(notification.priority)
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'font-medium',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      {notification.actionUrl && notification.actionLabel && (
                        <Button asChild size="sm" variant="outline">
                          <Link to={notification.actionUrl}>
                            {notification.actionLabel}
                          </Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive ml-auto"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
