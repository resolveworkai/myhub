import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatformStore } from '@/store/platformStore';
import { useClassScheduleStore } from '@/store/classScheduleStore';

interface CartDropdownProps {
  isHomePage?: boolean;
}

export function CartDropdown({ isHomePage = false }: CartDropdownProps) {
  const platformCart = usePlatformStore((s) => s.cart);
  const classCart = useClassScheduleStore((s) => s.classCart);

  const totalItems = platformCart.length + classCart.length;

  return (
    <Link to="/cart">
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${
          isHomePage
            ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
            : ''
        }`}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </Button>
    </Link>
  );
}
