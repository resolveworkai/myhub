import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Bell,
  Shield,
  Camera,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

export default function DashboardProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { preferences, updatePreferences } = useNotificationStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: (user as any)?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: (user as any)?.location?.address || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = watchPassword('newPassword') || '';

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: { ...(user as any).location, address: data.address || '' },
      });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (data.currentPassword !== 'Password123!') {
        toast.error('Current password is incorrect');
        return;
      }
      
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationToggle = (category: string, key: string, value: boolean) => {
    updatePreferences({
      [category]: {
        ...(preferences as any)[category],
        [key]: value,
      },
    });
    toast.success('Notification preference updated');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Advanced Settings
        </Button>
      </div>

      <div className="max-w-3xl">
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <img
                    src={(user as any).avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                  <button 
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                    onClick={() => toast.info('Photo upload coming soon!')}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{(user as any).name}</h3>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since {new Date((user as any).joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...registerProfile('name')}
                      className={cn(profileErrors.name && 'border-destructive')}
                    />
                    {profileErrors.name && (
                      <p className="text-xs text-destructive">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerProfile('email')}
                      className={cn(profileErrors.email && 'border-destructive')}
                    />
                    {profileErrors.email && (
                      <p className="text-xs text-destructive">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...registerProfile('phone')}
                      className={cn(profileErrors.phone && 'border-destructive')}
                    />
                    {profileErrors.phone && (
                      <p className="text-xs text-destructive">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...registerProfile('address')}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...registerPassword('currentPassword')}
                      className={cn(passwordErrors.currentPassword && 'border-destructive')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-destructive">{String(passwordErrors.currentPassword.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('newPassword')}
                      className={cn(passwordErrors.newPassword && 'border-destructive')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPasswordValue} />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive">{String(passwordErrors.newPassword.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerPassword('confirmPassword')}
                      className={cn(passwordErrors.confirmPassword && 'border-destructive')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{String(passwordErrors.confirmPassword.message)}</p>
                  )}
                </div>

                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="bg-card rounded-xl border border-border p-6 space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-2">Email Notifications</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage which emails you receive from us.
                </p>
                <div className="space-y-4">
                  {[
                    { key: 'bookingConfirmation', label: 'Booking Confirmations', desc: 'Receive confirmation when you make a booking' },
                    { key: 'bookingReminder', label: 'Booking Reminders', desc: 'Get reminded before your upcoming bookings' },
                    { key: 'specialOffers', label: 'Special Offers', desc: 'Receive promotional offers and discounts' },
                    { key: 'reviewRequest', label: 'Review Requests', desc: 'Get asked to review after your visits' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(preferences.email as any)?.[item.key] ?? true}
                        onCheckedChange={(checked) => handleNotificationToggle('email', item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-2">SMS Notifications</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Text message alerts for important updates.
                </p>
                <div className="space-y-4">
                  {[
                    { key: 'bookingConfirmation', label: 'Booking Confirmations', desc: 'SMS confirmation for bookings' },
                    { key: 'bookingReminder', label: 'Booking Reminders', desc: 'SMS reminders before appointments' },
                    { key: 'urgentAlerts', label: 'Urgent Alerts', desc: 'Critical updates about your bookings' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={(preferences.sms as any)?.[item.key] ?? true}
                        onCheckedChange={(checked) => handleNotificationToggle('sms', item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Profile Visibility</p>
                      <p className="text-sm text-muted-foreground">Allow other users to see your profile</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Activity Status</p>
                      <p className="text-sm text-muted-foreground">Show when you're active</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Marketing Communications</p>
                      <p className="text-sm text-muted-foreground">Receive promotional content</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-4">Data Management</h2>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => toast.info('Data export request submitted')}
                  >
                    Download My Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => toast.warning('Please contact support to delete your account')}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
