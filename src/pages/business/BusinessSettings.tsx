import { useState, useEffect } from "react";
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
  Globe,
  Mail,
  Save,
  MapPin,
  Image as ImageIcon,
  Tags,
  Rocket,
  Check,
  AlertCircle,
  DollarSign,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, BusinessUser } from "@/store/authStore";
import { useVenueStore } from "@/store/venueStore";
import { LocationPicker } from "@/components/business/LocationPicker";
import { BusinessImageUpload } from "@/components/business/BusinessImageUpload";
import { BusinessAttributesEditor } from "@/components/business/BusinessAttributesEditor";
import { cn } from "@/lib/utils";

export default function BusinessSettings() {
  const { user, updateUser } = useAuthStore();
  const { publishVenue, unpublishVenue, isVenuePublished } = useVenueStore();
  
  const businessUser = user as BusinessUser | null;
  
  // Local state for form fields
  const [businessInfo, setBusinessInfo] = useState({
    name: businessUser?.businessName || "",
    email: businessUser?.email || "",
    phone: businessUser?.phone || "",
    address: businessUser?.address?.street || "",
    description: businessUser?.serviceAreas || "",
    website: businessUser?.website || "",
  });

  const defaultHours = {
    monday: { open: "06:00", close: "22:00", closed: false },
    tuesday: { open: "06:00", close: "22:00", closed: false },
    wednesday: { open: "06:00", close: "22:00", closed: false },
    thursday: { open: "06:00", close: "22:00", closed: false },
    friday: { open: "06:00", close: "22:00", closed: false },
    saturday: { open: "08:00", close: "20:00", closed: false },
    sunday: { open: "08:00", close: "18:00", closed: false },
  };

  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    () => {
      const savedHours = businessUser?.operatingHours;
      if (savedHours) {
        // Ensure closed field exists for all entries
        const normalized: Record<string, { open: string; close: string; closed: boolean }> = {};
        Object.entries(savedHours).forEach(([day, hours]) => {
          normalized[day] = {
            open: hours.open,
            close: hours.close,
            closed: hours.closed ?? false,
          };
        });
        return { ...defaultHours, ...normalized };
      }
      return defaultHours;
    }
  );

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

  // Location and media state
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(
    businessUser?.address?.lat && businessUser?.address?.lng
      ? { lat: businessUser.address.lat, lng: businessUser.address.lng }
      : undefined
  );
  const [logo, setLogo] = useState(businessUser?.logo || "");
  const [coverImage, setCoverImage] = useState(businessUser?.coverImage || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(businessUser?.galleryImages || []);

  // Attributes state
  const [amenities, setAmenities] = useState<string[]>(businessUser?.amenities || []);
  const [equipment, setEquipment] = useState<string[]>(businessUser?.equipment || []);
  const [classTypes, setClassTypes] = useState<string[]>(businessUser?.classTypes || []);
  const [membershipOptions, setMembershipOptions] = useState<string[]>(businessUser?.membershipOptions || []);
  const [subjects, setSubjects] = useState<string[]>(businessUser?.subjects || []);
  const [levels, setLevels] = useState<string[]>(businessUser?.levels || []);
  const [teachingModes, setTeachingModes] = useState<string[]>(businessUser?.teachingModes || []);
  const [batchSizes, setBatchSizes] = useState<string[]>(businessUser?.batchSizes || []);
  const [facilities, setFacilities] = useState<string[]>(businessUser?.facilities || []);
  const [collections, setCollections] = useState<string[]>(businessUser?.collections || []);
  const [spaceTypes, setSpaceTypes] = useState<string[]>(businessUser?.spaceTypes || []);

  // Publishing state
  const [isPublished, setIsPublished] = useState(businessUser?.isPublished || false);

  // Package pricing state
  const [pricing, setPricing] = useState({
    daily: businessUser?.dailyPackagePrice || 299,
    weekly: businessUser?.weeklyPackagePrice || 1499,
    monthly: businessUser?.monthlyPackagePrice || 4999,
  });

  // Sync with user changes
  useEffect(() => {
    if (businessUser) {
      setBusinessInfo({
        name: businessUser.businessName || "",
        email: businessUser.email || "",
        phone: businessUser.phone || "",
        address: businessUser.address?.street || "",
        description: businessUser.serviceAreas || "",
        website: businessUser.website || "",
      });
      setLocation(
        businessUser.address?.lat && businessUser.address?.lng
          ? { lat: businessUser.address.lat, lng: businessUser.address.lng }
          : undefined
      );
      setLogo(businessUser.logo || "");
      setCoverImage(businessUser.coverImage || "");
      setGalleryImages(businessUser.galleryImages || []);
      setAmenities(businessUser.amenities || []);
      setIsPublished(businessUser.isPublished || false);
    }
  }, [businessUser]);

  // Check if business can be published
  const canPublish = location?.lat && location?.lng && (coverImage || logo);
  const hasAnyAttribute = amenities.length > 0 || 
    equipment.length > 0 || 
    classTypes.length > 0 || 
    subjects.length > 0 || 
    facilities.length > 0;

  const handleSaveBusinessInfo = () => {
    updateUser({
      businessName: businessInfo.name,
      email: businessInfo.email,
      phone: businessInfo.phone,
      website: businessInfo.website,
      serviceAreas: businessInfo.description,
      address: {
        ...businessUser?.address,
        street: businessInfo.address,
      },
    } as Partial<BusinessUser>);
    toast.success("Business information updated");
  };

  const handleSaveHours = () => {
    updateUser({ operatingHours } as Partial<BusinessUser>);
    toast.success("Operating hours updated");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleSaveSecurity = () => {
    toast.success("Security settings updated");
  };

  const handleSaveLocation = () => {
    if (!location) {
      toast.error("Please select a location on the map");
      return;
    }
    updateUser({
      address: {
        ...businessUser?.address,
        lat: location.lat,
        lng: location.lng,
      },
      logo,
      coverImage,
      galleryImages,
    } as Partial<BusinessUser>);
    toast.success("Location and media updated");
  };

  const handleSaveAttributes = () => {
    updateUser({
      amenities,
      equipment: businessUser?.businessType === 'gym' ? equipment : undefined,
      classTypes: businessUser?.businessType === 'gym' ? classTypes : undefined,
      membershipOptions,
      subjects: businessUser?.businessType === 'coaching' ? subjects : undefined,
      levels: businessUser?.businessType === 'coaching' ? levels : undefined,
      teachingModes: businessUser?.businessType === 'coaching' ? teachingModes : undefined,
      batchSizes: businessUser?.businessType === 'coaching' ? batchSizes : undefined,
      facilities: businessUser?.businessType === 'library' ? facilities : undefined,
      collections: businessUser?.businessType === 'library' ? collections : undefined,
      spaceTypes: businessUser?.businessType === 'library' ? spaceTypes : undefined,
    } as Partial<BusinessUser>);
    toast.success("Business attributes updated");
  };

  const handleTogglePublish = () => {
    if (!isPublished && !canPublish) {
      toast.error("Please add location and at least one image before publishing");
      return;
    }

    const newPublishState = !isPublished;
    setIsPublished(newPublishState);
    
    // Update auth store
    updateUser({
      isPublished: newPublishState,
      publishedAt: newPublishState ? new Date().toISOString() : undefined,
    } as Partial<BusinessUser>);

    // Update venue store
    if (newPublishState && businessUser) {
      publishVenue({
        ...businessUser,
        isPublished: true,
        address: {
          ...businessUser.address,
          lat: location?.lat || businessUser.address.lat,
          lng: location?.lng || businessUser.address.lng,
        },
        logo,
        coverImage,
        galleryImages,
        amenities,
        equipment,
        classTypes,
        membershipOptions,
        subjects,
        levels,
        teachingModes,
        batchSizes,
        facilities,
        collections,
        spaceTypes,
      } as BusinessUser);
      toast.success("🎉 Your business is now live on Explore!");
    } else if (businessUser) {
      unpublishVenue(businessUser.id);
      toast.info("Your business has been unpublished");
    }
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  if (!businessUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in as a business user</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      {/* Publishing Status Card */}
      <Card className={cn(
        "border-2",
        isPublished ? "border-success bg-success/5" : "border-warning bg-warning/5"
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isPublished ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
              )}>
                <Rocket className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {isPublished ? "Your business is live! 🎉" : "Your business is not listed"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isPublished 
                    ? "Customers can find you on Explore" 
                    : "Complete your profile to go live"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:items-end gap-2">
              <Button
                variant={isPublished ? "outline" : "gradient"}
                onClick={handleTogglePublish}
                disabled={!isPublished && !canPublish}
                className="w-full sm:w-auto"
              >
                {isPublished ? "Unpublish" : "Publish Listing"}
              </Button>
              {!canPublish && !isPublished && (
                <div className="flex items-center gap-1 text-xs text-warning">
                  <AlertCircle className="h-3 w-3" />
                  Add location & image to publish
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          {!isPublished && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Complete to publish:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className={cn("flex items-center gap-1", businessInfo.name && "text-success")}>
                  <Check className="h-4 w-4" />
                  Business name
                </div>
                <div className={cn("flex items-center gap-1", location?.lat && "text-success")}>
                  <Check className="h-4 w-4" />
                  Location
                </div>
                <div className={cn("flex items-center gap-1", (coverImage || logo) && "text-success")}>
                  <Check className="h-4 w-4" />
                  Image
                </div>
                <div className={cn("flex items-center gap-1", hasAnyAttribute && "text-success")}>
                  <Check className="h-4 w-4" />
                  Attributes
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="business">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start gap-1 h-auto p-1">
          <TabsTrigger value="business" className="shrink-0 text-xs sm:text-sm">
            <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Business</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="shrink-0 text-xs sm:text-sm">
            <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Location</span>
            <span className="sm:hidden">Map</span>
          </TabsTrigger>
          <TabsTrigger value="attributes" className="shrink-0 text-xs sm:text-sm">
            <Tags className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Attributes</span>
            <span className="sm:hidden">Attr</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="shrink-0 text-xs sm:text-sm">
            <IndianRupee className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Pricing</span>
            <span className="sm:hidden">₹</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="shrink-0 text-xs sm:text-sm">
            <Clock className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Hours</span>
            <span className="sm:hidden">Hrs</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="shrink-0 text-xs sm:text-sm">
            <Bell className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Alerts</span>
            <span className="sm:hidden">🔔</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="shrink-0 text-xs sm:text-sm">
            <Shield className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">🔒</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  placeholder="Tell customers what makes your business special..."
                />
              </div>

              <Button onClick={handleSaveBusinessInfo}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location & Media */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Media
              </CardTitle>
              <CardDescription>
                Pin your exact location and add photos to attract customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Location Picker */}
              <div className="space-y-4">
                <h3 className="font-medium">Business Location</h3>
                <LocationPicker
                  value={location}
                  onChange={(loc) => setLocation({ lat: loc.lat, lng: loc.lng })}
                />
              </div>

              {/* Image Uploads */}
              <div className="space-y-4">
                <h3 className="font-medium">Business Images</h3>
                <BusinessImageUpload
                  logo={logo}
                  coverImage={coverImage}
                  galleryImages={galleryImages}
                  onLogoChange={setLogo}
                  onCoverChange={setCoverImage}
                  onGalleryChange={setGalleryImages}
                />
              </div>

              <Button onClick={handleSaveLocation}>
                <Save className="h-4 w-4 mr-2" />
                Save Location & Media
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes */}
        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Business Attributes
              </CardTitle>
              <CardDescription>
                Select the features and services you offer to help customers find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BusinessAttributesEditor
                businessType={businessUser.businessType}
                amenities={amenities}
                equipment={equipment}
                classTypes={classTypes}
                subjects={subjects}
                levels={levels}
                teachingModes={teachingModes}
                batchSizes={batchSizes}
                facilities={facilities}
                collections={collections}
                spaceTypes={spaceTypes}
                membershipOptions={membershipOptions}
                onAmenitiesChange={setAmenities}
                onEquipmentChange={setEquipment}
                onClassTypesChange={setClassTypes}
                onSubjectsChange={setSubjects}
                onLevelsChange={setLevels}
                onTeachingModesChange={setTeachingModes}
                onBatchSizesChange={setBatchSizes}
                onFacilitiesChange={setFacilities}
                onCollectionsChange={setCollections}
                onSpaceTypesChange={setSpaceTypes}
                onMembershipOptionsChange={setMembershipOptions}
              />

              <Button onClick={handleSaveAttributes}>
                <Save className="h-4 w-4 mr-2" />
                Save Attributes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Membership Packages
              </CardTitle>
              <CardDescription>
                Set pricing for daily, weekly, and monthly passes. These prices will be shown to customers during booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border-2 border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold">1D</span>
                    </div>
                    <div>
                      <p className="font-semibold">Daily Pass</p>
                      <p className="text-xs text-muted-foreground">1 day access</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={pricing.daily}
                      onChange={(e) => setPricing({ ...pricing, daily: parseInt(e.target.value) || 0 })}
                      className="pl-8"
                      min={0}
                    />
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border-2 border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                      <span className="text-sm font-bold">7D</span>
                    </div>
                    <div>
                      <p className="font-semibold">Weekly Pass</p>
                      <p className="text-xs text-muted-foreground">7 days access</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={pricing.weekly}
                      onChange={(e) => setPricing({ ...pricing, weekly: parseInt(e.target.value) || 0 })}
                      className="pl-8"
                      min={0}
                    />
                  </div>
                  {pricing.daily > 0 && (
                    <p className="text-xs text-success">
                      {Math.round((1 - pricing.weekly / (pricing.daily * 7)) * 100)}% savings vs daily
                    </p>
                  )}
                </div>
                
                <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 space-y-3 relative">
                  <div className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Popular
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold">30D</span>
                    </div>
                    <div>
                      <p className="font-semibold">Monthly Pass</p>
                      <p className="text-xs text-muted-foreground">30 days access</p>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={pricing.monthly}
                      onChange={(e) => setPricing({ ...pricing, monthly: parseInt(e.target.value) || 0 })}
                      className="pl-8"
                      min={0}
                    />
                  </div>
                  {pricing.daily > 0 && (
                    <p className="text-xs text-success">
                      {Math.round((1 - pricing.monthly / (pricing.daily * 30)) * 100)}% savings vs daily
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p><strong>Note:</strong> Monthly members who pay in cash cannot be removed for 30 days after assignment. This ensures commitment from both parties.</p>
              </div>

              <Button onClick={() => {
                updateUser({
                  dailyPackagePrice: pricing.daily,
                  weeklyPackagePrice: pricing.weekly,
                  monthlyPackagePrice: pricing.monthly,
                } as Partial<BusinessUser>);
                toast.success("Pricing updated successfully");
              }}>
                <Save className="h-4 w-4 mr-2" />
                Save Pricing
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
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-border last:border-0">
                  <div className="w-24 font-medium capitalize">{day}</div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={!operatingHours[day]?.closed}
                      onCheckedChange={(checked) => setOperatingHours({
                        ...operatingHours,
                        [day]: { ...operatingHours[day], closed: !checked }
                      })}
                    />
                    {!operatingHours[day]?.closed ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={operatingHours[day]?.open || "06:00"}
                          onChange={(e) => setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day], open: e.target.value }
                          })}
                          className="w-28"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={operatingHours[day]?.close || "22:00"}
                          onChange={(e) => setOperatingHours({
                            ...operatingHours,
                            [day]: { ...operatingHours[day], close: e.target.value }
                          })}
                          className="w-28"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Closed</span>
                    )}
                  </div>
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
