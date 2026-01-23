import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function TermsConditions() {
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
                Terms & Conditions
              </h1>
              <p className="text-muted-foreground mb-12">
                Last updated: January 23, 2026
              </p>

              <div className="prose prose-lg max-w-none text-muted-foreground">
                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    1. Agreement to Terms
                  </h2>
                  <p>
                    By accessing or using Portal, you agree to be bound by these Terms and Conditions. 
                    If you disagree with any part of these terms, you may not access the service.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    2. Use of Service
                  </h2>
                  <p className="mb-4">You agree to use Portal only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the service in any way that violates applicable laws or regulations</li>
                    <li>Impersonate any person or entity or misrepresent your affiliation</li>
                    <li>Interfere with or disrupt the service or servers</li>
                    <li>Attempt to gain unauthorized access to any portion of the service</li>
                    <li>Use automated systems to extract data from the service</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    3. User Accounts
                  </h2>
                  <p className="mb-4">When creating an account, you must:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Immediately notify us of any unauthorized use</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    4. Bookings
                  </h2>
                  <p className="mb-4">
                    When you make a booking through Portal:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You enter into an agreement directly with the venue</li>
                    <li>Portal acts as an intermediary platform</li>
                    <li>Cancellation policies are set by individual venues</li>
                    <li>You are responsible for arriving on time for your booking</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    5. Payments
                  </h2>
                  <p>
                    All payments are processed securely through our payment partners. Prices are shown 
                    in INR unless otherwise stated. Refunds are subject to the venue's cancellation policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    6. Reviews and Content
                  </h2>
                  <p className="mb-4">
                    When posting reviews or content:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You grant Portal a non-exclusive right to use your content</li>
                    <li>Reviews must be honest and based on genuine experiences</li>
                    <li>Content must not be defamatory, offensive, or illegal</li>
                    <li>We reserve the right to remove inappropriate content</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    7. Business Users
                  </h2>
                  <p className="mb-4">
                    If you register as a business:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must have authority to bind the business</li>
                    <li>Information provided must be accurate and up-to-date</li>
                    <li>You are responsible for all content on your business profile</li>
                    <li>You must honor bookings made through the platform</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    8. Limitation of Liability
                  </h2>
                  <p>
                    Portal shall not be liable for any indirect, incidental, special, consequential, 
                    or punitive damages resulting from your use of the service. We do not guarantee 
                    the quality of services provided by venues listed on our platform.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    9. Changes to Terms
                  </h2>
                  <p>
                    We reserve the right to modify these terms at any time. We will notify users of 
                    any material changes. Continued use of the service after changes constitutes 
                    acceptance of the new terms.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                    10. Contact
                  </h2>
                  <p>
                    For questions about these Terms, please contact:
                  </p>
                  <p className="mt-4">
                    <strong>Email:</strong> legal@portal.com<br />
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
