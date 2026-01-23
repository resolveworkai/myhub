import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  User,
  Building2,
  CreditCard,
  Calendar,
  Shield,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

const categories = [
  { id: "general", name: "General", icon: HelpCircle },
  { id: "users", name: "For Users", icon: User },
  { id: "business", name: "For Business", icon: Building2 },
  { id: "booking", name: "Booking", icon: Calendar },
  { id: "payment", name: "Payment", icon: CreditCard },
  { id: "security", name: "Security", icon: Shield },
];

const faqs = [
  {
    category: "general",
    question: "What is Portal?",
    answer: "Portal is a comprehensive booking and discovery platform that connects users with gyms, coaching centers, and libraries. We help you find, compare, and book services at these venues easily."
  },
  {
    category: "general",
    question: "Is Portal free to use?",
    answer: "Yes! Portal is completely free for users. You can browse venues, read reviews, and make bookings without any charges. Businesses pay a small subscription fee to list on our platform."
  },
  {
    category: "general",
    question: "Which cities is Portal available in?",
    answer: "Currently, Portal is available in Mumbai, Delhi, Bangalore, Hyderabad, and Chennai. We're rapidly expanding to more cities. Stay tuned for updates!"
  },
  {
    category: "users",
    question: "How do I create an account?",
    answer: "Click on 'Get Started' or 'Sign Up' button. You can register using your email, phone number, or Google account. The process takes less than 2 minutes."
  },
  {
    category: "users",
    question: "Can I book multiple venues?",
    answer: "Absolutely! You can book sessions at multiple venues. All your bookings are managed from your dashboard where you can view, modify, or cancel them."
  },
  {
    category: "users",
    question: "How do I leave a review?",
    answer: "After your visit, you'll receive a prompt to leave a review. You can also go to the venue page and click on 'Write Review' in the Reviews tab."
  },
  {
    category: "business",
    question: "How can I list my business on Portal?",
    answer: "Click on 'For Business' and sign up as a business owner. Complete your profile, add photos, set pricing, and you're ready to receive bookings. Our team will verify your business within 24-48 hours."
  },
  {
    category: "business",
    question: "What are the fees for businesses?",
    answer: "We offer three plans: Starter (Free with limited features), Growth (₹3,999/month), and Enterprise (Custom pricing). Start with our free plan and upgrade as you grow."
  },
  {
    category: "business",
    question: "How do I manage bookings?",
    answer: "Your business dashboard provides a complete view of all bookings. You can accept, reschedule, or cancel bookings. You'll also receive notifications for new bookings."
  },
  {
    category: "booking",
    question: "How far in advance can I book?",
    answer: "You can book up to 30 days in advance, depending on the venue's settings. Some venues may have different booking windows."
  },
  {
    category: "booking",
    question: "Can I cancel my booking?",
    answer: "Yes, you can cancel your booking from your dashboard. Cancellation policies vary by venue - typically free cancellation is available up to 24 hours before the scheduled time."
  },
  {
    category: "booking",
    question: "What happens if the venue cancels?",
    answer: "If a venue cancels your booking, you'll receive a full refund and notification immediately. We'll also help you find alternative options."
  },
  {
    category: "payment",
    question: "What payment methods are accepted?",
    answer: "We accept credit/debit cards, UPI, net banking, and popular wallets like Paytm and PhonePe. All payments are processed securely."
  },
  {
    category: "payment",
    question: "Is my payment information secure?",
    answer: "Absolutely. We use industry-standard encryption and never store your complete card details. All transactions are processed through PCI-DSS compliant payment gateways."
  },
  {
    category: "payment",
    question: "How do refunds work?",
    answer: "Refunds are processed within 5-7 business days to your original payment method. You'll receive email confirmation once the refund is initiated."
  },
  {
    category: "security",
    question: "How is my data protected?",
    answer: "We use SSL encryption, secure data centers, and follow strict privacy policies. Your personal information is never shared with third parties without your consent."
  },
  {
    category: "security",
    question: "How are businesses verified?",
    answer: "We verify business registration documents, physical address, and owner identity. Verified businesses display a badge on their profile."
  },
  {
    category: "security",
    question: "What if I have a dispute with a venue?",
    answer: "Contact our support team with details of the issue. We'll mediate between you and the venue to find a fair resolution."
  },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Frequently Asked <span className="text-primary">Questions</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Find answers to common questions about Portal. Can't find what you're looking for? 
                Contact our support team.
              </p>
              
              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  className="pl-12 h-14 text-lg rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-2">
                  <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <category.icon className="h-5 w-5" />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ List */}
              <div className="lg:col-span-3 space-y-4">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or browse different categories.
                    </p>
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={faq.question}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.question ? null : faq.question)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                            expandedFaq === faq.question ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFaq === faq.question && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-6 pb-6 text-muted-foreground">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-8">
                Our support team is here to help. Reach out and we'll get back to you within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button variant="gradient" size="lg">
                    Contact Support
                  </Button>
                </Link>
                <a href="mailto:support@portal.com">
                  <Button variant="outline" size="lg">
                    Email Us
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
