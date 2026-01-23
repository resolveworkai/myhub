import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Clock,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

export default function BusinessSettings() {
  const [businessInfo, setBusinessInfo] = useState({
    name: "FitZone Premium",
    email: "contact@fitzone.com",
    phone: "+91 98765 43210",
    address: "123 Fitness Street, Dubai, UAE",
    description: "Premium fitness center offering world-class facilities and expert trainers.",
    website: "https://fitzone.com",
  });

  const [operatingHours, setOperatingHours] = useState({
    monday: { open: "06:00", close: "22:00", closed: false },
    tuesday: { open: "06:00", close: "22:00", closed: false },
    wednesday: { open: "06:00", close: "22:00", closed: false },
    thursday: { open: "06:00", close: "22:00", closed: false },
    friday: { open: "06:00", close: "22:00", closed: false },
    saturday: { open: "08:00", close: "20:00", closed: false },
    sunday: { open: "08:00", close: "18:00", closed: false },
  });

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailPayments: true,
    emailReminders: true,
    smsBookings: false,
    smsPayments: true,
    pushNotifications: true,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "30",
  });

  const handleSaveBusinessInfo = () => {
    toast.success("Business information updated");
  };

  const handleSaveHours = () => {
    toast.success("Operating hours updated");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleSaveSecurity = () => {
    toast.success("Security settings updated");
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business preferences</p>
      </div>

      <Tabs defaultValue="business">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="business"><Building2 className="h-4 w-4 mr-2 hidden sm:inline" />Business</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="h-4 w-4 mr-2 hidden sm:inline" />Hours</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2 hidden sm:inline" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2 hidden sm:inline" />Security</TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload Logo</Button>
                  <p className="text-sm text-muted-foreground mt-2">Recommended: 400x400px, PNG or JPG</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveBusinessInfo}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set your business hours for each day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <div className="w-24 font-medium capitalize">{day}</div>
                  <Switch
                    checked={!operatingHours[day].closed}
                    onCheckedChange={(checked) => setOperatingHours({
                      ...operatingHours,
                      [day]: { ...operatingHours[day], closed: !checked }
                    })}
                  />
                  {!operatingHours[day].closed ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={operatingHours[day].open}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], open: e.target.value }
                        })}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={operatingHours[day].close}
                        onChange={(e) => setOperatingHours({
                          ...operatingHours,
                          [day]: { ...operatingHours[day], close: e.target.value }
                        })}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </div>
              ))}

              <Button onClick={handleSaveHours} className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><Mail className="h-4 w-4" /> Email Notifications</h4>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">New Bookings</div>
                      <div className="text-sm text-muted-foreground">Get notified when someone books</div>
                    </div>
                    <Switch checked={notifications.emailBookings} onCheckedChange={(v) => setNotifications({ ...notifications, emailBookings: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Payment Received</div>
                      <div className="text-sm text-muted-foreground">Get notified on successful payments</div>
                    </div>
                    <Switch checked={notifications.emailPayments} onCheckedChange={(v) => setNotifications({ ...notifications, emailPayments: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Daily Reminders</div>
                      <div className="text-sm text-muted-foreground">Summary of upcoming appointments</div>
                    </div>
                    <Switch checked={notifications.emailReminders} onCheckedChange={(v) => setNotifications({ ...notifications, emailReminders: v })} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Push Notifications</h4>
                <div className="space-y-3 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable Push Notifications</div>
                      <div className="text-sm text-muted-foreground">Real-time updates in browser</div>
                    </div>
                    <Switch checked={notifications.pushNotifications} onCheckedChange={(v) => setNotifications({ ...notifications, pushNotifications: v })} />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                  </div>
                  <Switch checked={security.twoFactor} onCheckedChange={(v) => setSecurity({ ...security, twoFactor: v })} />
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">Session Timeout</div>
                      <div className="text-sm text-muted-foreground">Auto-logout after inactivity</div>
                    </div>
                    <Select value={security.sessionTimeout} onValueChange={(v) => setSecurity({ ...security, sessionTimeout: v })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-medium mb-2">Change Password</div>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                    <Button variant="outline">Update Password</Button>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity}>
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
