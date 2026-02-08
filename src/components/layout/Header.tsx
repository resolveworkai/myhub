import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ChevronDown,
  Building2,
  HelpCircle,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { UserMenu } from "./UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { languages } from "@/i18n";
import { useEnabledCategories } from "@/hooks/useEnabledCategories";

export function Header() {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  
  const { isAuthenticated, accountType } = useAuthStore();
  const { getNavItems } = useEnabledCategories();
  
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  // Build navigation dynamically based on enabled categories
  const navigation = useMemo(() => {
    const categoryNavItems = getNavItems();
    return [
      ...categoryNavItems,
      { nameKey: "nav.howItWorks", href: "/how-it-works", icon: HelpCircle },
      { nameKey: "nav.forBusiness", href: "/for-business", icon: Building2 },
    ];
  }, [getNavItems]);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const getHeaderClasses = () => {
    if (isHomePage) {
      if (isScrolled) {
        return "bg-gradient-to-r from-primary/95 via-primary/90 to-[hsl(195,85%,40%)]/95 backdrop-blur-lg shadow-lg";
      }
      return "bg-transparent";
    }
    return "bg-background/80 backdrop-blur-lg border-b border-border";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}
      >
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow ${
                isHomePage && !isScrolled 
                  ? "bg-primary-foreground/20 backdrop-blur-sm" 
                  : "gradient-primary"
              }`}>
                <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">
                  P
                </span>
              </div>
              <span
                className={`font-display font-bold text-lg sm:text-xl ${
                  isHomePage ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.nameKey}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname === item.href
                      ? isHomePage
                        ? "text-primary-foreground bg-primary-foreground/20"
                        : "text-foreground bg-muted"
                      : isHomePage
                      ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.nameKey)}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      isHomePage
                        ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        : ""
                    }
                  >
                    <span className="text-lg">{currentLang.flag}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="cursor-pointer"
                    >
                      <span className="text-lg mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth-dependent buttons */}
              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <UserMenu isHomePage={isHomePage} />
                </>
              ) : (
                <>
                  <Link to="/signin">
                    <Button
                      variant={isHomePage ? "hero-outline" : "outline"}
                      size="sm"
                      className={isHomePage ? "!px-3 !py-2 !h-auto !text-sm" : ""}
                    >
                      {t('common.signIn')}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button
                      variant={isHomePage ? "hero" : "gradient"}
                      size="sm"
                      className={isHomePage ? "!px-3 !py-2 !h-auto !text-sm" : ""}
                    >
                      {t('common.signUp')}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={`lg:hidden p-2 rounded-lg touch-target flex items-center justify-center ${
                isHomePage
                  ? "text-primary-foreground hover:bg-primary-foreground/10"
                  : "text-foreground hover:bg-muted"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85vw] max-w-80 bg-background shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={closeMobileMenu}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">
                P
              </span>
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-foreground">
              Portal
            </span>
          </Link>
          <button
            type="button"
            className="p-2 rounded-lg text-foreground hover:bg-muted touch-target flex items-center justify-center"
            onClick={closeMobileMenu}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)] pb-safe">
          {navigation.map((item) => (
            <Link
              key={item.nameKey}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors touch-target ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={closeMobileMenu}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {t(item.nameKey)}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-border space-y-3">
            {isAuthenticated ? (
              <>
                <Link 
                  to={accountType === 'business' ? '/business-dashboard' : '/dashboard'} 
                  onClick={closeMobileMenu}
                  className="block"
                >
                  <Button variant="outline" className="w-full h-12 touch-target">
                    {t('common.dashboard')}
                  </Button>
                </Link>
                <Link to="/settings" onClick={closeMobileMenu} className="block">
                  <Button variant="ghost" className="w-full h-12 touch-target">
                    {t('common.settings')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/signin" onClick={closeMobileMenu} className="block">
                  <Button variant="outline" className="w-full h-12 touch-target">
                    {t('common.signIn')}
                  </Button>
                </Link>
                <Link to="/signup" onClick={closeMobileMenu} className="block">
                  <Button variant="gradient" className="w-full h-12 touch-target">
                    {t('common.signUp')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 px-4">Language</p>
            <div className="space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-colors touch-target ${
                    currentLang.code === lang.code
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {currentLang.code === lang.code && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Links in Mobile */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 px-4">More</p>
            <Link
              to="/about"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted touch-target"
              onClick={closeMobileMenu}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted touch-target"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
            <Link
              to="/faq"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted touch-target"
              onClick={closeMobileMenu}
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
