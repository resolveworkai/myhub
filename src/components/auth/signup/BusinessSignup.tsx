import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  FileUp,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepIndicator } from './StepIndicator';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { useAuthStore } from '@/store/authStore';
import { registerBusinessUser, checkEmailExists } from '@/lib/apiService';
import { formatPhoneNumber } from '@/lib/authValidation';

const businessSchema = z.object({
  // Step 1 - Business Information
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  businessType: z.enum(['gym', 'coaching', 'library']),
  registrationNumber: z.string().min(8, 'Registration number must be 8-15 characters').max(15).regex(/^[a-zA-Z0-9\-]+$/, 'Only alphanumeric characters and hyphens allowed'),
  yearsInOperation: z.string(),
  
  // Step 2 - Contact Information
  ownerName: z.string().min(2, 'Name must be at least 2 characters').max(50).regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Please enter a valid email address').transform((val) => val.toLowerCase()),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  countryCode: z.string().default('+971'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State/Emirate is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().default('UAE'),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  
  // Step 3 - Business Details
  numberOfLocations: z.string(),
  totalCapacity: z.number().min(1, 'Capacity must be at least 1'),
  specialties: z.array(z.string()).default([]),
  serviceAreas: z.string().max(500, 'Description must be less than 500 characters'),
  
  // Step 4 - Security
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include uppercase letter')
    .regex(/[a-z]/, 'Password must include lowercase letter')
    .regex(/[0-9]/, 'Password must include number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include special character'),
  confirmPassword: z.string(),
  accountManagerEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  
  // Step 5 - Subscription
  subscriptionTier: z.enum(['starter', 'growth', 'enterprise']).default('starter'),
  acceptTerms: z.boolean().refine((val) => val === true, { message: 'You must accept the terms and conditions' }),
  acceptPrivacy: z.boolean().refine((val) => val === true, { message: 'You must accept the privacy policy' }),
  verificationConsent: z.boolean().refine((val) => val === true, { message: 'You must consent to business verification' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type BusinessFormData = z.infer<typeof businessSchema>;

const steps = ['Business Info', 'Contact', 'Details', 'Security', 'Subscription'];

const businessTypes = [
  { value: 'gym', label: 'Gym / Fitness Center' },
  { value: 'coaching', label: 'Coaching Center' },
  { value: 'library', label: 'Library / Study Center' },
];

const yearsOptions = [
  'Less than 1 year',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
];

const locationOptions = [
  '1 location',
  '2-3 locations',
  '4-5 locations',
  '6-10 locations',
  '10+ locations',
];

const subscriptionTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    priceValue: 0,
    period: 'forever',
    features: ['1 location', '50 bookings/month', 'Basic analytics', 'Email support'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '₹3,999',
    priceValue: 3999,
    period: 'month',
    features: ['3 locations', 'Unlimited bookings', 'Advanced analytics', 'Priority support', 'Smart scheduling'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹9,999',
    priceValue: 9999,
    period: 'month',
    features: ['Unlimited locations', 'API access', 'Dedicated support', 'White-label options', 'SLA guarantee'],
    popular: false,
  },
];

// Smart specialty suggestions per business type
const specialtySuggestions: Record<string, { value: string; label: string; emoji: string }[]> = {
  gym: [
    { value: 'hiit', label: 'HIIT & Cardio Blitz', emoji: '🔥' },
    { value: 'strength', label: 'Powerlifting Paradise', emoji: '💪' },
    { value: 'crossfit', label: 'CrossFit Zone', emoji: '🏋️' },
    { value: 'yoga', label: 'Zen Yoga Studio', emoji: '🧘' },
    { value: 'boxing', label: 'Boxing Ring', emoji: '🥊' },
    { value: 'spinning', label: 'Spin Cycle Hub', emoji: '🚴' },
    { value: 'personal_training', label: 'Elite Personal Training', emoji: '🎯' },
    { value: 'functional', label: 'Functional Fitness Lab', emoji: '⚡' },
    { value: 'swimming', label: 'Aqua Fitness Center', emoji: '🏊' },
    { value: 'martial_arts', label: 'MMA & Combat Sports', emoji: '🥋' },
    { value: 'wellness', label: 'Recovery & Wellness Spa', emoji: '🌿' },
    { value: 'womens_only', label: "Women's Only Zone", emoji: '👑' },
  ],
  coaching: [
    { value: 'academic', label: 'Academic Excellence Hub', emoji: '📚' },
    { value: 'test_prep', label: 'Test Prep Mastery', emoji: '✍️' },
    { value: 'language', label: 'Language Learning Lab', emoji: '🌍' },
    { value: 'coding', label: 'Code Academy Pro', emoji: '💻' },
    { value: 'stem', label: 'STEM Innovation Center', emoji: '🔬' },
    { value: 'music', label: 'Music & Arts Academy', emoji: '🎵' },
    { value: 'sports', label: 'Sports Excellence Program', emoji: '⚽' },
    { value: 'career', label: 'Career Launchpad', emoji: '🚀' },
    { value: 'leadership', label: 'Leadership Forge', emoji: '🎖️' },
    { value: 'public_speaking', label: 'Public Speaking Dojo', emoji: '🎤' },
    { value: 'entrepreneurship', label: 'Startup Incubator', emoji: '💡' },
    { value: 'kids', label: 'Kids & Teens Academy', emoji: '🌟' },
  ],
  library: [
    { value: 'study_pods', label: 'Silent Study Pods', emoji: '🤫' },
    { value: 'coworking', label: 'Co-Working Space', emoji: '💼' },
    { value: 'digital', label: 'Digital Media Lab', emoji: '🖥️' },
    { value: 'rare_books', label: 'Rare Books Collection', emoji: '📖' },
    { value: 'research', label: 'Research & Archives', emoji: '🔍' },
    { value: 'maker_space', label: 'Maker Space Hub', emoji: '🛠️' },
    { value: 'kids_corner', label: "Children's Reading Corner", emoji: '🧒' },
    { value: 'audiobooks', label: 'Audio & Podcast Lounge', emoji: '🎧' },
    { value: 'cafe', label: 'Library Café', emoji: '☕' },
    { value: 'events', label: 'Event & Workshop Space', emoji: '🎪' },
    { value: 'study_groups', label: 'Group Study Rooms', emoji: '👥' },
    { value: '247_access', label: '24/7 Access Zone', emoji: '🌙' },
  ],
};

export function BusinessSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login, setPendingVerification } = useAuthStore();

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      businessType: 'gym',
      registrationNumber: '',
      yearsInOperation: '',
      ownerName: '',
      email: '',
      phone: '',
      countryCode: '+971',
      website: '',
      address: { street: '', city: '', state: '', postalCode: '', country: 'UAE' },
      numberOfLocations: '1 location',
      totalCapacity: 50,
      specialties: [],
      serviceAreas: '',
      password: '',
      confirmPassword: '',
      accountManagerEmail: '',
      subscriptionTier: 'starter',
      acceptTerms: false,
      acceptPrivacy: false,
      verificationConsent: false,
    },
    mode: 'onBlur',
  });

  const { register, watch, setValue, formState: { errors }, trigger, control } = form;
  const password = watch('password') || '';
  const confirmPassword = watch('confirmPassword') || '';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const selectedTier = watch('subscriptionTier');
  const businessType = watch('businessType');
  const selectedSpecialties = watch('specialties') || [];

  // Get specialty options based on business type
  const currentSpecialties = specialtySuggestions[businessType] || [];

  const toggleSpecialty = (value: string) => {
    const current = selectedSpecialties || [];
    if (current.includes(value)) {
      setValue('specialties', current.filter(s => s !== value));
    } else {
      setValue('specialties', [...current, value]);
    }
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsByStep: Record<number, string[]> = {
      1: ['businessName', 'businessType', 'registrationNumber', 'yearsInOperation'],
      2: ['ownerName', 'email', 'phone', 'address.street', 'address.city', 'address.state', 'address.postalCode'],
      3: ['numberOfLocations', 'totalCapacity', 'serviceAreas'],
      4: ['password', 'confirmPassword'],
      5: ['acceptTerms', 'acceptPrivacy', 'verificationConsent'],
    };
    return await trigger(fieldsByStep[step] as any);
  };

  const handleNext = async () => {
    const valid = await validateStep(currentStep);
    if (valid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const valid = await validateStep(5);
    if (!valid) return;

    setIsSubmitting(true);
    try {
      const data = form.getValues();
      
      const addressData = {
        street: data.address.street || '',
        city: data.address.city || '',
        state: data.address.state || '',
        postalCode: data.address.postalCode || '',
        country: data.address.country || 'UAE',
        lat: data.address.lat,
        lng: data.address.lng,
      };
      
      const result = await registerBusinessUser({
        businessName: data.businessName,
        businessType: data.businessType,
        registrationNumber: data.registrationNumber,
        yearsInOperation: data.yearsInOperation,
        ownerName: data.ownerName,
        email: data.email,
        phone: `${data.countryCode}${data.phone.replace(/\D/g, '')}`,
        website: data.website,
        address: addressData,
        numberOfLocations: data.numberOfLocations,
        totalCapacity: data.totalCapacity,
        serviceAreas: data.serviceAreas,
        specialties: data.specialties, // Business-type specific specialties
        password: data.password,
        accountManagerEmail: data.accountManagerEmail,
        subscriptionTier: data.subscriptionTier,
      });

      if (result.success && result.user) {
        setPendingVerification(data.email, '000000');
        login(result.user, '', false);
        
        console.log('📧 Admin notification: New business registration pending verification', {
          businessName: data.businessName,
          email: data.email,
        });
        
        toast.success('Business account created! Your account is pending verification.');
        navigate('/business-dashboard/pending');
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={5} steps={steps} />

      {/* Step 1: Business Information */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="businessName"
                {...register('businessName')}
                placeholder="Your Business Name"
                className={cn('pl-10', errors.businessName && 'border-destructive')}
              />
            </div>
            {errors.businessName && (
              <p className="text-xs text-destructive">{String(errors.businessName.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Business Type *</Label>
            <Controller
              name="businessType"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger className={cn(errors.businessType && 'border-destructive')}>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Business Registration Number *</Label>
            <Input
              id="registrationNumber"
              {...register('registrationNumber')}
              placeholder="e.g., DXB-GYM-2024-001"
              className={cn(errors.registrationNumber && 'border-destructive')}
            />
            {errors.registrationNumber && (
              <p className="text-xs text-destructive">{String(errors.registrationNumber.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Years in Operation *</Label>
            <Controller
              name="yearsInOperation"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Button type="button" variant="gradient" className="w-full" size="lg" onClick={handleNext}>
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Contact Information */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner/Manager Name *</Label>
            <Input
              id="ownerName"
              {...register('ownerName')}
              placeholder="Full name"
              className={cn(errors.ownerName && 'border-destructive')}
            />
            {errors.ownerName && (
              <p className="text-xs text-destructive">{String(errors.ownerName.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Business Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="business@example.com"
                className={cn('pl-10', errors.email && 'border-destructive')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{String(errors.email.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Business Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="phone"
                {...register('phone')}
                placeholder="50-123-4567"
                className={cn('pl-10', errors.phone && 'border-destructive')}
                onChange={(e) => setValue('phone', formatPhoneNumber(e.target.value))}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive">{String(errors.phone.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="website"
                {...register('website')}
                placeholder="https://yourbusiness.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Business Address *</Label>
            <Input
              {...register('address.street')}
              placeholder="Street address"
              className={cn(errors.address?.street && 'border-destructive')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                {...register('address.city')}
                placeholder="City"
                className={cn(errors.address?.city && 'border-destructive')}
              />
              <Input
                {...register('address.state')}
                placeholder="State/Emirate"
                className={cn(errors.address?.state && 'border-destructive')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                {...register('address.postalCode')}
                placeholder="Postal code"
                className={cn(errors.address?.postalCode && 'border-destructive')}
              />
              <Input
                {...register('address.country')}
                placeholder="Country"
                defaultValue="UAE"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" size="lg" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button type="button" variant="gradient" className="flex-1" size="lg" onClick={handleNext}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Business Details */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Number of Locations *</Label>
            <Controller
              name="numberOfLocations"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCapacity">Total Capacity *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="totalCapacity"
                type="number"
                {...register('totalCapacity', { valueAsNumber: true })}
                placeholder="Maximum customers at one time"
                className={cn('pl-10', errors.totalCapacity && 'border-destructive')}
              />
            </div>
            {errors.totalCapacity && (
              <p className="text-xs text-destructive">{String(errors.totalCapacity.message)}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Service Areas / Specialties</Label>
              <span className="text-xs text-muted-foreground">
                {selectedSpecialties.length} selected
              </span>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Select the specialties that best describe your {businessType === 'gym' ? 'fitness center' : businessType === 'coaching' ? 'coaching center' : 'library'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {currentSpecialties.map((specialty) => {
                const isSelected = selectedSpecialties.includes(specialty.value);
                return (
                  <button
                    key={specialty.value}
                    type="button"
                    onClick={() => toggleSpecialty(specialty.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-lg">{specialty.emoji}</span>
                    <span className="font-medium truncate">{specialty.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceAreas">Additional Details (Optional)</Label>
            <Textarea
              id="serviceAreas"
              {...register('serviceAreas')}
              placeholder="Add any other unique features or specialties not listed above..."
              className={cn('min-h-[80px]', errors.serviceAreas && 'border-destructive')}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {watch('serviceAreas')?.length || 0}/500 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" size="lg" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button type="button" variant="gradient" className="flex-1" size="lg" onClick={handleNext}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Account Security */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Create a strong password"
                className={cn('pl-10 pr-10', errors.password && 'border-destructive')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            {errors.password && (
              <p className="text-xs text-destructive">{String(errors.password.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Confirm your password"
                className={cn('pl-10 pr-10', errors.confirmPassword && 'border-destructive', passwordsMatch && 'border-success')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{String(errors.confirmPassword.message)}</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-success flex items-center gap-1">
                <Check className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountManagerEmail">Account Manager Email (optional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="accountManagerEmail"
                type="email"
                {...register('accountManagerEmail')}
                placeholder="If different from owner email"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" size="lg" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button type="button" variant="gradient" className="flex-1" size="lg" onClick={handleNext}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Subscription & Verification */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Select Subscription Tier</Label>
            <div className="grid gap-3">
              {subscriptionTiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setValue('subscriptionTier', tier.id as any)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all relative',
                    selectedTier === tier.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                    tier.popular && 'ring-2 ring-primary/20'
                  )}
                >
                  {tier.popular && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                      Most Popular
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{tier.name}</span>
                      <div className="text-right">
                        <span className={cn('font-bold', tier.id === 'starter' ? 'text-success' : 'text-primary')}>
                          {tier.price}
                        </span>
                        {tier.price !== 'Free' && (
                          <span className="text-xs text-muted-foreground">/{tier.period}</span>
                        )}
                      </div>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedTier === tier.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {selectedTier === tier.id && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Payment notice for paid plans */}
            {selectedTier !== 'starter' && (
              <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                <p className="text-sm text-info-foreground">
                  💳 Payment will be processed after account verification. Start with a 14-day free trial.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3">
              <Controller
                name="acceptTerms"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Checkbox id="acceptTerms" checked={value} onCheckedChange={onChange} className="mt-1" />
                )}
              />
              <div>
                <Label htmlFor="acceptTerms" className="cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms-conditions" target="_blank" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  *
                </Label>
                {errors.acceptTerms && (
                  <p className="text-xs text-destructive">{String(errors.acceptTerms.message)}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Controller
                name="acceptPrivacy"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Checkbox id="acceptPrivacy" checked={value} onCheckedChange={onChange} className="mt-1" />
                )}
              />
              <div>
                <Label htmlFor="acceptPrivacy" className="cursor-pointer">
                  I agree to the{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  *
                </Label>
                {errors.acceptPrivacy && (
                  <p className="text-xs text-destructive">{String(errors.acceptPrivacy.message)}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Controller
                name="verificationConsent"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Checkbox id="verificationConsent" checked={value} onCheckedChange={onChange} className="mt-1" />
                )}
              />
              <div>
                <Label htmlFor="verificationConsent" className="cursor-pointer">
                  I consent to business verification and understand my account will be reviewed *
                </Label>
                {errors.verificationConsent && (
                  <p className="text-xs text-destructive">{String(errors.verificationConsent.message)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" size="lg" onClick={handleBack} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button type="button" variant="gradient" className="flex-1" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Business Account'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
