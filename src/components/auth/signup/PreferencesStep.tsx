import { UseFormReturn, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Dumbbell, GraduationCap, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const categories = [
  { id: 'gym', label: 'Gyms & Fitness', icon: Dumbbell, description: 'Gyms, yoga studios, sports facilities' },
  { id: 'coaching', label: 'Coaching Centers', icon: GraduationCap, description: 'Tutoring, test prep, skill training' },
  { id: 'library', label: 'Libraries', icon: BookOpen, description: 'Study spaces, reading rooms' },
];

interface PreferencesStepProps {
  form: UseFormReturn<any>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PreferencesStep({ form, onBack, onSubmit, isSubmitting }: PreferencesStepProps) {
  const { watch, setValue, formState: { errors }, control, trigger } = form;
  const selectedCategories = watch('categories') || [];

  const toggleCategory = (categoryId: string) => {
    const current = selectedCategories || [];
    const updated = current.includes(categoryId)
      ? current.filter((c: string) => c !== categoryId)
      : [...current, categoryId];
    setValue('categories', updated);
  };

  const handleSubmit = async () => {
    const valid = await trigger(['acceptTerms', 'acceptPrivacy']);
    if (valid) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-3">
        <Label>Interested Categories</Label>
        <p className="text-sm text-muted-foreground">
          Select categories to personalize your experience (optional)
        </p>
        <div className="grid gap-3">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <category.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{category.label}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                )}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Terms & Privacy */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-start gap-3">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
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
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {String(errors.acceptTerms.message)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Controller
            name="acceptPrivacy"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptPrivacy"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
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
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {String(errors.acceptPrivacy.message)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Controller
            name="marketingConsent"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="marketingConsent"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
            )}
          />
          <Label htmlFor="marketingConsent" className="cursor-pointer font-normal text-muted-foreground">
            I'd like to receive promotional emails, offers, and updates (optional)
          </Label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          variant="gradient"
          className="flex-1"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </div>
    </div>
  );
}
