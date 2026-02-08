import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Save,
  Mail,
  MessageSquare,
  Smartphone,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettingsStore } from '@/store/notificationSettingsStore';
import type { NotificationChannel } from '@/types/notifications';

const channelConfig = [
  { id: 'sms' as NotificationChannel, label: 'SMS', icon: Smartphone },
  { id: 'email' as NotificationChannel, label: 'Email', icon: Mail },
  { id: 'whatsapp' as NotificationChannel, label: 'WhatsApp', icon: MessageSquare },
];

export function AdminNotificationConfig() {
  const { adminConfig, updateAdminConfig } = useNotificationSettingsStore();
  
  const [localDefaults, setLocalDefaults] = useState(adminConfig.defaultDailyCapPerUser);
  const [localMaxCaps, setLocalMaxCaps] = useState(adminConfig.maxAllowedCap);

  const handleDefaultChange = (channel: NotificationChannel, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalDefaults(prev => ({ ...prev, [channel]: Math.max(0, numValue) }));
  };

  const handleMaxCapChange = (channel: NotificationChannel, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalMaxCaps(prev => ({ ...prev, [channel]: Math.max(0, numValue) }));
  };

  const handleSave = () => {
    updateAdminConfig({
      defaultDailyCapPerUser: localDefaults,
      maxAllowedCap: localMaxCaps,
    });
    toast.success('Notification configuration updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Global notification settings for all businesses
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Default Daily Cap</TableHead>
              <TableHead>Maximum Allowed Cap</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelConfig.map((channel) => {
              const Icon = channel.icon;
              return (
                <TableRow key={channel.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{channel.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={localDefaults[channel.id]}
                        onChange={(e) => handleDefaultChange(channel.id, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground">/day/user</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={localMaxCaps[channel.id]}
                        onChange={(e) => handleMaxCapChange(channel.id, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground">max</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channelConfig.map((channel) => {
          const Icon = channel.icon;
          return (
            <div key={channel.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-medium">{channel.label}</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Default Cap</span>
                  <span className="font-medium">{localDefaults[channel.id]}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Cap</span>
                  <span className="font-medium">{localMaxCaps[channel.id]}/day</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/50 space-y-2">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">How it works</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Default cap: Applied to new businesses automatically</li>
          <li>Maximum cap: Businesses cannot set limits higher than this</li>
          <li>Each user has separate limits per business</li>
          <li>Limits reset daily at midnight</li>
        </ul>
      </div>
    </div>
  );
}
