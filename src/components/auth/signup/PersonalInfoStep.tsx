import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Check,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkEmailExists, checkPhoneExists } from '@/lib/mockAuthService';
import { formatPhoneNumber } from '@/lib/authValidation';

const countryCodes = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+966', country: 'Saudi', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
];

interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
  onNext: () => void;
}

export function PersonalInfoStep({ form, onNext }: PersonalInfoStepProps) {
  const [emailChecking, setEmailChecking] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [emailUnique, setEmailUnique] = useState<boolean | null>(null);
  const [phoneUnique, setPhoneUnique] = useState<boolean | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { register, watch, setValue, formState: { errors }, trigger } = form;
  const email = watch('email');
  const phone = watch('phone');
  const countryCode = watch('countryCode') || '+971';

  // Debounced email check
  useEffect(() => {
    if (!email || email.length < 5) {
      setEmailUnique(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setEmailChecking(true);
      const exists = await checkEmailExists(email);
      setEmailUnique(!exists);
      if (exists) {
        form.setError('email', { message: 'This email is already registered' });
      } else {
        form.clearErrors('email');
      }
      setEmailChecking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [email, form]);

  // Debounced phone check
  useEffect(() => {
    if (!phone || phone.length < 8) {
      setPhoneUnique(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setPhoneChecking(true);
      const exists = await checkPhoneExists(`${countryCode}${phone.replace(/\D/g, '')}`);
      setPhoneUnique(!exists);
      if (exists) {
        form.setError('phone', { message: 'This phone number is already registered' });
      } else {
        form.clearErrors('phone');
      }
      setPhoneChecking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [phone, countryCode, form]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('phone', formatted);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      form.setError('location', { message: 'Geolocation is not supported by your browser' });
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location', {
          lat: latitude,
          lng: longitude,
          address: 'Current Location',
        });
        // Simulate reverse geocoding
        setTimeout(() => {
          setValue('location', {
            lat: latitude,
            lng: longitude,
            address: 'Dubai, UAE',
          });
          setDetectingLocation(false);
        }, 1000);
      },
      (error) => {
        form.setError('location', { message: 'Unable to detect location' });
        setDetectingLocation(false);
      }
    );
  };

  const handleNext = async () => {
    const valid = await trigger(['fullName', 'email', 'phone']);
    if (valid && emailUnique !== false && phoneUnique !== false) {
      onNext();
    }
  };

  const getFieldStatus = (fieldName: string, isUnique: boolean | null, isChecking: boolean) => {
    if (isChecking) return 'checking';
    if (errors[fieldName]) return 'error';
    if (isUnique === true) return 'success';
    return 'default';
  };

  return (
    <div className="space-y-5">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="fullName"
            {...register('fullName')}
            placeholder="Enter your full name"
            className={cn(
              'pl-10 pr-10',
              errors.fullName && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          {!errors.fullName && watch('fullName')?.length >= 2 && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
          )}
        </div>
        {errors.fullName && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(errors.fullName.message)}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className={cn(
              'pl-10 pr-10',
              getFieldStatus('email', emailUnique, emailChecking) === 'error' && 'border-destructive',
              getFieldStatus('email', emailUnique, emailChecking) === 'success' && 'border-success'
            )}
            onBlur={(e) => {
              e.target.value = e.target.value.toLowerCase();
              setValue('email', e.target.value.toLowerCase());
            }}
          />
          {emailChecking && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
          {!emailChecking && emailUnique === true && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
          )}
        </div>
        {errors.email && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(errors.email.message)}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={(value) => setValue('countryCode', value)}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map((cc) => (
                <SelectItem key={cc.code} value={cc.code}>
                  {cc.flag} {cc.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="phone"
              {...register('phone')}
              placeholder="50-123-4567"
              className={cn(
                'pl-10 pr-10',
                getFieldStatus('phone', phoneUnique, phoneChecking) === 'error' && 'border-destructive',
                getFieldStatus('phone', phoneUnique, phoneChecking) === 'success' && 'border-success'
              )}
              onChange={handlePhoneChange}
            />
            {phoneChecking && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
            )}
            {!phoneChecking && phoneUnique === true && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
            )}
          </div>
        </div>
        {errors.phone && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(errors.phone.message)}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Preferred Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              {...register('location.address')}
              placeholder="Enter your address"
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={detectLocation}
            disabled={detectingLocation}
          >
            {detectingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
        {watch('location.address') && watch('location.lat') && (
          <p className="text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            Location detected: {watch('location.address')}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="gradient"
        className="w-full"
        size="lg"
        onClick={handleNext}
        disabled={emailChecking || phoneChecking}
      >
        Continue
      </Button>
    </div>
  );
}
