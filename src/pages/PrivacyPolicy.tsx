import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mb-12">
                Last updated: January 23, 2026
              </p>

              <div className="prose prose-lg max-w-none text-muted-foreground">
                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    1. Introduction
                  </h2>
                  <p>
                    Welcome to Portal. We respect your privacy and are committed to protecting your personal data. 
                    This privacy policy will inform you about how we look after your personal data when you visit 
                    our website and use our services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    2. Information We Collect
                  </h2>
                  <p className="mb-4">We collect the following types of information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Personal Information:</strong> Name, email address, phone number, and location data.</li>
                    <li><strong>Account Information:</strong> Login credentials and profile details.</li>
                    <li><strong>Booking Information:</strong> Details of venues you book and your booking history.</li>
                    <li><strong>Payment Information:</strong> Payment method details (processed securely by third-party providers).</li>
                    <li><strong>Usage Data:</strong> How you interact with our platform, including pages visited and features used.</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    3. How We Use Your Information
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our services</li>
                    <li>To process your bookings and payments</li>
                    <li>To send you booking confirmations and reminders</li>
                    <li>To personalize your experience with relevant recommendations</li>
                    <li>To improve our platform and develop new features</li>
                    <li>To communicate with you about updates and promotions</li>
                    <li>To ensure platform security and prevent fraud</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    4. Information Sharing
                  </h2>
                  <p className="mb-4">
                    We do not sell your personal information. We may share your information with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Business Partners:</strong> Venues you book with to fulfill your bookings</li>
                    <li><strong>Service Providers:</strong> Companies that help us operate our platform (e.g., payment processors)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    5. Data Security
                  </h2>
                  <p>
                    We implement appropriate security measures to protect your personal information against 
                    unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                    secure servers, and regular security assessments.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    6. Your Rights
                  </h2>
                  <p className="mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                    <li>Data portability</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    7. Cookies
                  </h2>
                  <p>
                    We use cookies and similar technologies to enhance your experience, analyze usage, 
                    and deliver personalized content. You can manage cookie preferences through your 
                    browser settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    8. Contact Us
                  </h2>
                  <p>
                    If you have any questions about this privacy policy or our data practices, please contact us at:
                  </p>
                  <p className="mt-4">
                    <strong>Email:</strong> privacy@portal.com<br />
                    <strong>Address:</strong> 123 Business Hub, Tower A, Bandra Kurla Complex, Mumbai 400051
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
