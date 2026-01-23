import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccountType?: 'normal' | 'business';
  requireVerification?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredAccountType,
  requireVerification = true 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user, accountType, checkAndRestoreSession, loading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check session on mount
    checkAndRestoreSession();
    setIsChecking(false);
  }, [checkAndRestoreSession]);

  // Show loading while checking auth
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${returnUrl}`} replace />;
  }

  // Check account type if required
  if (requiredAccountType && accountType !== requiredAccountType) {
    // Redirect to appropriate dashboard
    if (accountType === 'business') {
      return <Navigate to="/business-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Check email verification for normal users
  if (requireVerification && user.accountType === 'normal' && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check business verification
  if (requireVerification && user.accountType === 'business' && !user.businessVerified) {
    return <Navigate to="/business-dashboard/pending" replace />;
  }

  return <>{children}</>;
}

// Hook to get current user with type safety
export function useCurrentUser() {
  const { user, accountType, isAuthenticated } = useAuthStore();
  return { user, accountType, isAuthenticated };
}

// Hook to require authentication
export function useRequireAuth(requiredType?: 'normal' | 'business') {
  const { isAuthenticated, accountType, user, checkAndRestoreSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAndRestoreSession();
  }, [checkAndRestoreSession]);

  const isAuthorized = isAuthenticated && 
    (!requiredType || accountType === requiredType);

  return {
    isAuthenticated,
    isAuthorized,
    user,
    accountType,
    redirectPath: isAuthenticated 
      ? (accountType === 'business' ? '/business-dashboard' : '/dashboard')
      : `/signin?redirect=${encodeURIComponent(location.pathname)}`,
  };
}
