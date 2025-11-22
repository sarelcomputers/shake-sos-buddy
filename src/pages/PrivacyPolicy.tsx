import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pt-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>

        <Card className="p-6 md:p-8 space-y-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">1. Introduction</h2>
            <p className="text-muted-foreground">
              Alfa22 SOS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-4">2.1 Personal Information</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Email address (for account creation and notifications)</li>
              <li>Emergency contact names and phone numbers</li>
              <li>Payment information (processed securely by PayFast)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">2.2 Location Information</h3>
            <p className="text-muted-foreground">
              We collect your precise location data only when you activate an SOS alert. This location is sent to your emergency contacts to help them locate you in an emergency.
            </p>

            <h3 className="text-xl font-semibold mt-4">2.3 Device Information</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Device motion data (accelerometer) for shake detection</li>
              <li>SMS permissions to send emergency messages</li>
              <li>Device identifiers for authentication</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">2.4 Usage Information</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>SOS activation history (date, time, location)</li>
              <li>App settings and preferences</li>
              <li>Subscription and payment history</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>To provide emergency SOS services and send alerts to your contacts</li>
              <li>To detect shake gestures and automatically trigger emergency alerts</li>
              <li>To process subscription payments through PayFast</li>
              <li>To maintain and improve our services</li>
              <li>To send important service notifications</li>
              <li>To prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Emergency Contacts:</strong> Your location and emergency message when you activate SOS</li>
              <li><strong>Payment Processor:</strong> PayFast processes your payment information securely</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure database storage with row-level security</li>
              <li>Role-based access controls</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">6. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. SOS history is kept for 90 days. You can delete your account and all associated data at any time through the app settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">9. Location Services</h2>
            <p className="text-muted-foreground">
              Location access is required only when you activate an SOS alert. We do not track your location continuously. You can revoke location permissions at any time through your device settings, but this will prevent the app from sending your location to emergency contacts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Email: privacy@alfa22sos.com</p>
              <p className="text-sm text-muted-foreground mt-1">
                (Replace with your actual contact email)
              </p>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
}