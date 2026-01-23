import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  Building2,
  HelpCircle,
  Copy,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { openSupportEmail, generateTicketId, SUPPORT_EMAIL } from "@/lib/support";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["123 Business Hub, Tower A", "Bandra Kurla Complex", "Mumbai, Maharashtra 400051"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["+91 22 1234 5678", "+91 98765 43210"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["hello@portal.com", SUPPORT_EMAIL],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Monday - Friday: 9 AM - 7 PM", "Saturday: 10 AM - 5 PM", "Sunday: Closed"],
  },
];

const inquiryTypes = [
  { id: "general", label: "General Inquiry", icon: MessageSquare },
  { id: "business", label: "Business Partnership", icon: Building2 },
  { id: "support", label: "Customer Support", icon: HelpCircle },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "general",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    // Generate ticket and open email client
    const result = openSupportEmail({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      inquiryType: inquiryTypes.find(t => t.id === formData.inquiryType)?.label || formData.inquiryType,
      subject: formData.subject,
      message: formData.message,
    });
    
    setTicketId(result.ticketId);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success("Support request prepared!", {
      description: `Ticket ID: ${result.ticketId}. Please send the email from your email client.`,
    });
    
    setIsSubmitting(false);
  };

  const copyTicketId = () => {
    if (ticketId) {
      navigator.clipboard.writeText(ticketId);
      toast.success("Ticket ID copied to clipboard!");
    }
  };

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
                Get in <span className="text-primary">Touch</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Have questions about Portal? We'd love to hear from you. Send us a message 
                and we'll respond as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Contact Information
                  </h2>
                  <div className="space-y-6">
                    {contactInfo.map((info) => (
                      <div key={info.title} className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <info.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {info.title}
                          </h3>
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-muted-foreground text-sm">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Direct Support Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl bg-primary/5 border border-primary/20"
                >
                  <h3 className="font-semibold text-foreground mb-2">Quick Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Email us directly for faster response
                  </p>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`PORTAL | ${generateTicketId()} | Support Request`)}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    {SUPPORT_EMAIL}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </motion.div>
              </div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <div className="bg-card rounded-3xl border border-border p-8">
                  {ticketId && (
                    <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <div>
                          <p className="text-sm font-medium text-success">Ticket Created</p>
                          <p className="text-xs text-muted-foreground">Reference: {ticketId}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={copyTicketId}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Send us a Message
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Inquiry Type */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        What can we help you with?
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {inquiryTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, inquiryType: type.id })}
                            className={`p-4 rounded-xl border-2 transition-all text-center ${
                              formData.inquiryType === type.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <type.icon className={`h-6 w-6 mx-auto mb-2 ${
                              formData.inquiryType === type.id ? "text-primary" : "text-muted-foreground"
                            }`} />
                            <span className={`text-sm font-medium ${
                              formData.inquiryType === type.id ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name & Email */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone & Subject */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Subject *
                        </label>
                        <Input
                          type="text"
                          placeholder="How can we help?"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Message *
                      </label>
                      <Textarea
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Preparing..."
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Your email client will open with pre-filled details. Subject includes: PORTAL | Ticket ID | Timestamp
                    </p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ CTA */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Looking for Quick Answers?
              </h2>
              <p className="text-muted-foreground mb-6">
                Check out our FAQ section for answers to common questions.
              </p>
              <Button variant="outline" size="lg" asChild>
                <a href="/faq">
                  Visit FAQ
                  <HelpCircle className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
