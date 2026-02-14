import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
  ArrowLeft,
  User,
  Lock,
  Bell,
  Shield,
  Camera,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { passwordSchema as authPasswordSchema } from '@/lib/authValidation';
import { cn } from '@/lib/utils';
import { updateUserProfile, changePassword } from '@/lib/apiService';

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
}).refine((data) => {
  const result = authPasswordSchema.safeParse(data.newPassword);
  return result.success;
}, {
  message: 'Password must include uppercase, lowercase, number, and special character',
  path: ['newPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfileSettings() {
  const { user, accountType, updateUser } = useAuthStore();
  const { preferences, updatePreferences } = useNotificationStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const isNormalUser = accountType === 'normal';
  const dashboardPath = isNormalUser ? '/dashboard' : '/business-dashboard';

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: isNormalUser ? (user as any)?.name : (user as any)?.ownerName,
      email: user?.email || '',
      phone: user?.phone || '',
      address: isNormalUser 
        ? (user as any)?.location?.address 
        : `${(user as any)?.address?.street}, ${(user as any)?.address?.city}`,
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
      if (isNormalUser) {
        const location = (user as any)?.location;
        await updateUserProfile({
          name: data.name,
          phone: data.phone,
          location: data.address ? {
            lat: location?.lat || 0,
            lng: location?.lng || 0,
            address: data.address,
          } : undefined,
        });
        
        // Update local store
        updateUser({
          name: data.name,
          phone: data.phone,
          location: data.address ? { ...location, address: data.address } : location,
        });
      } else {
        // For business users, use business API (if exists)
        // For now, just update local store
        updateUser({
          ownerName: data.name,
          phone: data.phone,
        });
        toast.success('Profile updated successfully!');
        return;
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    try {
      if (isNormalUser) {
        await changePassword(data.currentPassword, data.newPassword);
        toast.success('Password changed successfully!');
        resetPassword();
      } else {
        // For business users, use business API (if exists)
        toast.error('Password change for business users not yet implemented');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationToggle = async (category: string, key: string, value: boolean) => {
    try {
      if (isNormalUser) {
        // Map frontend preference keys to backend keys
        let backendKey: string;
        if (category === 'email') {
          const keyMap: Record<string, string> = {
            bookingConfirmation: 'emailBookings',
            bookingReminder: 'emailReminders',
            specialOffers: 'emailBookings',
            reviewRequest: 'emailBookings',
          };
          backendKey = keyMap[key] || `email${key.charAt(0).toUpperCase() + key.slice(1)}`;
        } else if (category === 'sms') {
          const keyMap: Record<string, string> = {
            bookingConfirmation: 'smsBookings',
            bookingReminder: 'smsBookings',
            urgentAlerts: 'smsPayments',
          };
          backendKey = keyMap[key] || `sms${key.charAt(0).toUpperCase() + key.slice(1)}`;
        } else if (category === 'inApp') {
          backendKey = key === 'soundEnabled' || key === 'toastEnabled' ? 'pushNotifications' : key;
        } else {
          backendKey = key;
        }
        
        await updateUserProfile({
          notificationPreferences: {
            [backendKey]: value,
          },
        });
        
        // Update local store
        updatePreferences({
          [category]: {
            ...(preferences as any)[category],
            [key]: value,
          },
        });
        toast.success('Notification preference updated');
      } else {
        // For business users, use business API (if exists)
        updatePreferences({
          [category]: {
            ...(preferences as any)[category],
            [key]: value,
          },
        });
        toast.success('Notification preference updated');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update notification preference';
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to={dashboardPath}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display font-semibold text-lg">Profile Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
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
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isNormalUser ? (user as any).name : (user as any).ownerName}
                  </h3>
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
                        checked={(preferences.email as any)[item.key]}
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
                        checked={(preferences.sms as any)[item.key]}
                        onCheckedChange={(checked) => handleNotificationToggle('sms', item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-2">In-App Notifications</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Control how notifications appear in the app.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Sound</p>
                      <p className="text-sm text-muted-foreground">Play a sound for new notifications</p>
                    </div>
                    <Switch
                      checked={preferences.inApp.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationToggle('inApp', 'soundEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Toast Notifications</p>
                      <p className="text-sm text-muted-foreground">Show pop-up notifications</p>
                    </div>
                    <Switch
                      checked={preferences.inApp.toastEnabled}
                      onCheckedChange={(checked) => handleNotificationToggle('inApp', 'toastEnabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h2 className="text-lg font-semibold mb-2">Quiet Hours</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pause non-urgent notifications during specific hours.
                </p>
                <div className="flex items-center justify-between py-2 mb-4">
                  <div>
                    <p className="font-medium">Enable Quiet Hours</p>
                    <p className="text-sm text-muted-foreground">No notifications except urgent ones</p>
                  </div>
                  <Switch
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={(checked) => handleNotificationToggle('quietHours', 'enabled', checked)}
                  />
                </div>
                {preferences.quietHours.enabled && (
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          try {
                            if (isNormalUser) {
                              await updateUserProfile({
                                notificationPreferences: {
                                  quietHoursStart: newValue,
                                },
                              });
                              updatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  start: newValue,
                                },
                              });
                              toast.success('Quiet hours start time updated');
                            } else {
                              updatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  start: newValue,
                                },
                              });
                              toast.success('Quiet hours start time updated');
                            }
                          } catch (error: any) {
                            const errorMessage = error.response?.data?.error?.message || 
                                                error.response?.data?.message || 
                                                error.message || 
                                                'Failed to update quiet hours';
                            toast.error(errorMessage);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          try {
                            if (isNormalUser) {
                              await updateUserProfile({
                                notificationPreferences: {
                                  quietHoursEnd: newValue,
                                },
                              });
                              updatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  end: newValue,
                                },
                              });
                              toast.success('Quiet hours end time updated');
                            } else {
                              updatePreferences({
                                quietHours: {
                                  ...preferences.quietHours,
                                  end: newValue,
                                },
                              });
                              toast.success('Quiet hours end time updated');
                            }
                          } catch (error: any) {
                            const errorMessage = error.response?.data?.error?.message || 
                                                error.response?.data?.message || 
                                                error.message || 
                                                'Failed to update quiet hours';
                            toast.error(errorMessage);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Privacy Settings</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Control your data and privacy preferences.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Marketing Communications</p>
                    <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
                  </div>
                  <Switch
                    checked={(user as any).marketingConsent || false}
                    onCheckedChange={async (checked) => {
                      try {
                        if (isNormalUser) {
                          await updateUserProfile({ marketingConsent: checked });
                          updateUser({ marketingConsent: checked } as any);
                          toast.success('Marketing preference updated');
                        } else {
                          updateUser({ marketingConsent: checked } as any);
                          toast.success('Marketing preference updated');
                        }
                      } catch (error: any) {
                        const errorMessage = error.response?.data?.error?.message || 
                                            error.response?.data?.message || 
                                            error.message || 
                                            'Failed to update privacy setting';
                        toast.error(errorMessage);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">Allow others to see your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Activity Status</p>
                    <p className="text-sm text-muted-foreground">Show when you're active on the platform</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Data Management</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">Download My Data</Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Delete Account
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deleting your account is permanent and cannot be undone. All your data will be removed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
