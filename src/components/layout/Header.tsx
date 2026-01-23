import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Building2,
  Dumbbell,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Gyms", href: "/gyms", icon: Dumbbell },
  { name: "Coaching", href: "/coaching", icon: GraduationCap },
  { name: "Libraries", href: "/libraries", icon: BookOpen },
  { name: "How It Works", href: "/how-it-works", icon: HelpCircle },
  { name: "For Business", href: "/for-business", icon: Building2 },
];

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ar", name: "العربية", flag: "🇦🇪" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <>
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
                  P
                </span>
              </div>
              <span
                className={`font-display font-bold text-xl ${
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
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? isHomePage
                        ? "text-primary-foreground bg-primary-foreground/20"
                        : "text-foreground bg-muted"
                      : isHomePage
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

              <Link to="/signin">
                <Button
                  variant={isHomePage ? "hero-outline" : "outline"}
                  size="sm"
                  className={isHomePage ? "!px-4 !py-2 !h-auto !text-sm" : ""}
                >
                  Sign In
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
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-background shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">
                P
              </span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Portal
            </span>
          </Link>
          <button
            type="button"
            className="p-2 rounded-lg text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-80px)]">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-border space-y-2">
            <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="gradient" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 px-4">Language</p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setCurrentLang(lang)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentLang.code === lang.code
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
