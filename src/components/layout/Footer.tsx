import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";
import { useEnabledCategories } from "@/hooks/useEnabledCategories";

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
];

export function Footer() {
  const { categories } = useEnabledCategories();

  // Build discover links dynamically based on enabled categories
  const discoverLinks = useMemo(() => {
    const categoryLinks = categories.map((cat) => ({
      name: cat.namePlural,
      href: cat.route,
    }));
    return [...categoryLinks, { name: "Explore All", href: "/explore" }];
  }, [categories]);

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "For Business", href: "/for-business" },
    { name: "Contact Us", href: "/contact" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "/faq" },
    { name: "FAQ", href: "/faq" },
    { name: "Email Support", href: `mailto:${SUPPORT_EMAIL}` },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-conditions" },
  ];

  // Build description based on enabled categories
  const categoryDescription = useMemo(() => {
    const names = categories.map((c) => c.namePlural.toLowerCase());
    if (names.length === 0) return "services";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }, [categories]);
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">
                  P
                </span>
              </div>
              <span className="font-display font-bold text-lg sm:text-xl">Portal</span>
            </Link>
            <p className="text-background/70 mb-4 sm:mb-6 max-w-sm text-sm sm:text-base">
              Your gateway to fitness and learning. Discover {categoryDescription} near you with real-time availability and instant booking.
            </p>
            <div className="flex gap-3 sm:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors touch-target"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Discover Links */}
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Discover</h3>
            <ul className="space-y-2 sm:space-y-3">
              {discoverLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm sm:text-base text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm sm:text-base text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('mailto:') ? (
                    <a
                      href={link.href}
                      className="text-sm sm:text-base text-background/70 hover:text-background transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm sm:text-base text-background/70 hover:text-background transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-xs sm:text-sm text-center sm:text-left">
            © {new Date().getFullYear()} Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-background/60">
            <Link to="/privacy-policy" className="hover:text-background transition-colors">
              Privacy
            </Link>
            <Link to="/terms-conditions" className="hover:text-background transition-colors">
              Terms
            </Link>
            <Link to="/faq" className="hover:text-background transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
