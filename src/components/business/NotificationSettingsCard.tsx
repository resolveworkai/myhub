import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettingsStore } from '@/store/notificationSettingsStore';
import type { NotificationChannel } from '@/types/notifications';

interface NotificationSettingsCardProps {
  businessId: string;
}

const channelConfig = [
  { 
    id: 'sms' as NotificationChannel, 
    label: 'SMS', 
    icon: Smartphone, 
    description: 'Send text messages to users',
    color: 'text-success'
  },
  { 
    id: 'email' as NotificationChannel, 
    label: 'Email', 
    icon: Mail, 
    description: 'Send email notifications',
    color: 'text-info'
  },
  { 
    id: 'whatsapp' as NotificationChannel, 
    label: 'WhatsApp', 
    icon: MessageSquare, 
    description: 'Send WhatsApp messages',
    color: 'text-primary'
  },
];

export function NotificationSettingsCard({ businessId }: NotificationSettingsCardProps) {
  const { 
    getBusinessSettings, 
    toggleBusinessChannel, 
    setBusinessDailyCap,
    adminConfig 
  } = useNotificationSettingsStore();
  
  const settings = getBusinessSettings(businessId);
  const [localCaps, setLocalCaps] = useState(settings.dailyCapPerUser);

  const handleToggleChannel = (channel: NotificationChannel, enabled: boolean) => {
    toggleBusinessChannel(businessId, channel, enabled);
    toast.success(`${channel.toUpperCase()} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleCapChange = (channel: NotificationChannel, value: string) => {
    const numValue = parseInt(value) || 0;
    const maxCap = adminConfig.maxAllowedCap[channel];
    const clampedValue = Math.min(Math.max(0, numValue), maxCap);
    
    setLocalCaps(prev => ({ ...prev, [channel]: clampedValue }));
  };

  const handleSaveCaps = () => {
    Object.entries(localCaps).forEach(([channel, cap]) => {
      setBusinessDailyCap(businessId, channel as NotificationChannel, cap);
    });
    toast.success('Notification caps updated');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notification Settings</CardTitle>
        </div>
        <CardDescription>
          Configure how booking confirmations are sent to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Toggles */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Enabled Channels</h4>
          {channelConfig.map((channel) => {
            const Icon = channel.icon;
            const isEnabled = settings.channelsEnabled[channel.id];
            
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
                    <div className="font-medium">{channel.label}</div>
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
        </div>

        {/* Daily Caps */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Daily Message Limits per User</h4>
            <Badge variant="outline" className="text-xs">
              Default: 5/day
            </Badge>
          </div>
          
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm text-warning">
              <p className="font-medium">Rate Limiting</p>
              <p className="text-xs opacity-80">
                These limits prevent excessive notifications. Max allowed: SMS ({adminConfig.maxAllowedCap.sms}), 
                Email ({adminConfig.maxAllowedCap.email}), WhatsApp ({adminConfig.maxAllowedCap.whatsapp})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {channelConfig.map((channel) => (
              <div key={channel.id} className="space-y-2">
                <Label className="text-xs">{channel.label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={adminConfig.maxAllowedCap[channel.id]}
                  value={localCaps[channel.id]}
                  onChange={(e) => handleCapChange(channel.id, e.target.value)}
                  disabled={!settings.channelsEnabled[channel.id]}
                />
                <p className="text-xs text-muted-foreground">
                  Max: {adminConfig.maxAllowedCap[channel.id]}
                </p>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveCaps} variant="outline" className="w-full">
            Save Limits
          </Button>
        </div>

        {/* Current Settings Summary */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-2">
          <h4 className="text-sm font-medium">Current Configuration</h4>
          <div className="flex flex-wrap gap-2">
            {channelConfig.map((channel) => (
              <Badge
                key={channel.id}
                variant={settings.channelsEnabled[channel.id] ? 'success' : 'secondary'}
              >
                {channel.label}: {settings.channelsEnabled[channel.id] 
                  ? `${settings.dailyCapPerUser[channel.id]}/day` 
                  : 'Off'}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
