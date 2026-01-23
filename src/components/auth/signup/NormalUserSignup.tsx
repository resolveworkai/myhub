import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StepIndicator } from './StepIndicator';
import { PersonalInfoStep } from './PersonalInfoStep';
import { SecurityStep } from './SecurityStep';
import { PreferencesStep } from './PreferencesStep';
import { useAuthStore } from '@/store/authStore';
import { registerUser } from '@/lib/mockAuthService';

const normalUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase()),
  phone: z
    .string()
    .min(8, 'Please enter a valid phone number'),
  countryCode: z.string().default('+971'),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must include at least one special character'),
  confirmPassword: z.string(),
  categories: z.array(z.string()).default([]),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions to continue',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy to continue',
  }),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type NormalUserFormData = z.infer<typeof normalUserSchema>;

const steps = ['Personal Info', 'Security', 'Preferences'];

export function NormalUserSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, setPendingVerification } = useAuthStore();

  const form = useForm<NormalUserFormData>({
    resolver: zodResolver(normalUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      countryCode: '+971',
      location: { address: '' },
      password: '',
      confirmPassword: '',
      categories: [],
      acceptTerms: false,
      acceptPrivacy: false,
      marketingConsent: false,
    },
    mode: 'onBlur',
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = form.getValues();
      
      const locationData = data.location?.lat && data.location?.lng && data.location?.address
        ? { lat: data.location.lat, lng: data.location.lng, address: data.location.address }
        : undefined;
      
      const result = await registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: `${data.countryCode}${data.phone.replace(/\D/g, '')}`,
        password: data.password,
        location: locationData,
        categories: data.categories,
        marketingConsent: data.marketingConsent,
      });

      if (result.success && result.user) {
        // Set pending verification for email
        setPendingVerification(data.email, '000000');
        
        // Log the user in
        login(result.user, '', false);
        
        toast.success('Account created successfully! Please verify your email.');
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
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
      <StepIndicator currentStep={currentStep} totalSteps={3} steps={steps} />
      
      {currentStep === 1 && (
        <PersonalInfoStep
          form={form}
          onNext={() => setCurrentStep(2)}
        />
      )}
      
      {currentStep === 2 && (
        <SecurityStep
          form={form}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}
      
      {currentStep === 3 && (
        <PreferencesStep
          form={form}
          onBack={() => setCurrentStep(2)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
