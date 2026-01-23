import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

interface SecurityStepProps {
  form: UseFormReturn<any>;
  onNext: () => void;
  onBack: () => void;
}

export function SecurityStep({ form, onNext, onBack }: SecurityStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, watch, formState: { errors }, trigger } = form;
  const password = watch('password') || '';
  const confirmPassword = watch('confirmPassword') || '';

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleNext = async () => {
    const valid = await trigger(['password', 'confirmPassword']);
    if (valid) {
      onNext();
    }
  };

  return (
    <div className="space-y-5">
      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Create a strong password"
            className={cn(
              'pl-10 pr-10',
              errors.password && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <PasswordStrengthMeter password={password} />
        {errors.password && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(errors.password.message)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Use 8+ characters with uppercase, lowercase, number, and special character
        </p>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Confirm your password"
            className={cn(
              'pl-10 pr-10',
              errors.confirmPassword && 'border-destructive',
              passwordsMatch && 'border-success'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(errors.confirmPassword.message)}
          </p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            Passwords match
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          variant="gradient"
          className="flex-1"
          size="lg"
          onClick={handleNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
