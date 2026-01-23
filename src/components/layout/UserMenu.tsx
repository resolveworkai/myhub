import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Calendar,
  Heart,
  Building2,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface UserMenuProps {
  isHomePage?: boolean;
}

export function UserMenu({ isHomePage = false }: UserMenuProps) {
  const { user, accountType, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("You've been logged out successfully.");
    navigate('/');
  };

  if (!user) return null;

  const isNormalUser = accountType === 'normal';
  const userName = isNormalUser ? (user as any).name : (user as any).ownerName;
  const userAvatar = (user as any).avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face';
  const dashboardPath = isNormalUser ? '/dashboard' : '/business-dashboard';

  const normalUserLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', href: '/dashboard/appointments', icon: Calendar },
    { label: 'Favorites', href: '/favorites', icon: Heart },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const businessUserLinks = [
    { label: 'Dashboard', href: '/business-dashboard', icon: LayoutDashboard },
    { label: 'Analytics', href: '/business-dashboard/analytics', icon: BarChart3 },
    { label: 'Bookings', href: '/business-dashboard/bookings', icon: Calendar },
    { label: 'Settings', href: '/business-dashboard/settings', icon: Settings },
  ];

  const menuLinks = isNormalUser ? normalUserLinks : businessUserLinks;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 px-2 ${
            isHomePage
              ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
              : ''
          }`}
        >
          <img
            src={userAvatar}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border-2 border-background"
          />
          <span className="hidden md:inline font-medium max-w-[100px] truncate">
            {userName.split(' ')[0]}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b border-border">
          <p className="font-semibold truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          {!isNormalUser && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">Business Account</span>
            </div>
          )}
        </div>

        <div className="py-1">
          {menuLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link to={link.href} className="flex items-center gap-2 cursor-pointer">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
