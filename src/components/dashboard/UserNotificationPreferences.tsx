import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettingsStore } from '@/store/notificationSettingsStore';
import { useAuthStore } from '@/store/authStore';
import type { NotificationChannel } from '@/types/notifications';

const channelConfig = [
  { 
    id: 'sms' as NotificationChannel, 
    label: 'SMS', 
    icon: Smartphone, 
    description: 'Receive text messages for bookings',
    color: 'text-success'
  },
  { 
    id: 'email' as NotificationChannel, 
    label: 'Email', 
    icon: Mail, 
    description: 'Get email confirmations',
    color: 'text-info'
  },
  { 
    id: 'whatsapp' as NotificationChannel, 
    label: 'WhatsApp', 
    icon: MessageSquare, 
    description: 'Receive WhatsApp messages',
    color: 'text-primary'
  },
];

export function UserNotificationPreferences() {
  const { user } = useAuthStore();
  const { getUserSettings, toggleUserChannel } = useNotificationSettingsStore();
  
  if (!user) return null;
  
  const settings = getUserSettings(user.id);

  const handleToggleChannel = (channel: NotificationChannel, enabled: boolean) => {
    toggleUserChannel(user.id, channel, enabled);
    toast.success(`${channel.toUpperCase()} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose how you want to receive booking confirmations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {channelConfig.map((channel) => {
          const Icon = channel.icon;
          const isEnabled = settings.enabled[channel.id];
          const dailyUsage = settings.dailyUsage[channel.id];
          
          return (
            <div 
              key={channel.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${channel.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {channel.label}
                    {dailyUsage > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {dailyUsage} today
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {channel.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
              />
            </div>
          );
        })}

        <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>💡 Notifications are sent when you confirm a booking. Each business may have limits on how many messages can be sent per day.</p>
        </div>
      </CardContent>
    </Card>
  );
}
