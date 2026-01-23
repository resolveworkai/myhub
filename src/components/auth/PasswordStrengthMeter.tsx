import { cn } from '@/lib/utils';
import { getPasswordStrength } from '@/lib/authValidation';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({ password, showRequirements = true }: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium capitalize",
            strength.label === 'weak' && "text-destructive",
            strength.label === 'medium' && "text-warning",
            strength.label === 'strong' && "text-success",
            strength.label === 'very-strong' && "text-info",
          )}>
            {strength.label.replace('-', ' ')}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              strength.color
            )}
            style={{ 
              width: `${Math.min(100, (strength.score / 7) * 100)}%` 
            }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1">
          {requirements.map((req, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                req.met ? "text-success" : "text-muted-foreground"
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
