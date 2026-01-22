import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Search,
  Bell,
  Globe,
  ChevronDown,
  Building2,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Explore", href: "/explore", icon: MapPin },
  { name: "How It Works", href: "/#how-it-works", icon: Calendar },
  { name: "For Business", href: "/business", icon: Building2 },
];

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage
          ? "bg-transparent"
          : "bg-background/80 backdrop-blur-lg border-b border-border"
      }`}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
              <span className="text-primary-foreground font-display font-bold text-xl">
                M
              </span>
            </div>
            <span
              className={`font-display font-bold text-xl ${
                isHomePage ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              MyHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isHomePage
                    ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
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
                    onClick={() => setCurrentLang(lang)}
                    className="cursor-pointer"
                  >
                    <span className="text-lg mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/login">
              <Button
                variant={isHomePage ? "hero-outline" : "outline"}
                size="sm"
                className={isHomePage ? "!px-4 !py-2 !h-auto !text-sm" : ""}
              >
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant={isHomePage ? "hero" : "gradient"}
                size="sm"
                className={isHomePage ? "!px-4 !py-2 !h-auto !text-sm" : ""}
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg ${
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-slide-in-down">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isHomePage
                      ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-border/50 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gradient" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
