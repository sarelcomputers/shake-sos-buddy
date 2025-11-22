import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TermsOfService() {
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
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </motion.div>

        <Card className="p-6 md:p-8 space-y-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Alfa22 SOS ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Alfa22 SOS is an emergency alert application that allows users to send SOS messages with their location to designated emergency contacts through SMS. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Manual and shake-activated emergency alerts</li>
              <li>Location sharing with emergency contacts</li>
              <li>Emergency contact management</li>
              <li>Alert history tracking</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">3. User Responsibilities</h2>
            <p className="text-muted-foreground">You agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Provide accurate and complete information</li>
              <li>Keep your emergency contacts up-to-date</li>
              <li>Use the Service only for legitimate emergency purposes</li>
              <li>Not abuse the Service by sending false alerts</li>
              <li>Obtain consent from contacts before adding them to your emergency list</li>
              <li>Maintain the security of your account credentials</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">4. Subscription and Payments</h2>
            
            <h3 className="text-xl font-semibold mt-4">4.1 Free Trial</h3>
            <p className="text-muted-foreground">
              New users receive a 30-day free trial. No payment is required during the trial period.
            </p>

            <h3 className="text-xl font-semibold mt-4">4.2 Paid Subscription</h3>
            <p className="text-muted-foreground">
              After the trial period, continued use requires a monthly subscription of R50.00 (South African Rand). Payments are processed securely through PayFast.
            </p>

            <h3 className="text-xl font-semibold mt-4">4.3 Cancellation</h3>
            <p className="text-muted-foreground">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">5. Service Limitations</h2>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="font-semibold text-amber-600 dark:text-amber-400 mb-2">IMPORTANT DISCLAIMER:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Alfa22 SOS is NOT a replacement for emergency services (police, ambulance, fire department)</li>
                <li>The Service depends on network connectivity, device functionality, and recipient availability</li>
                <li>We cannot guarantee message delivery in all situations</li>
                <li>Response times depend on your emergency contacts, not our Service</li>
                <li>Always call local emergency services (112, 10111, etc.) in life-threatening situations</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">6. Prohibited Uses</h2>
            <p className="text-muted-foreground">You may not:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Send false or hoax emergency alerts</li>
              <li>Use the Service to harass or spam contacts</li>
              <li>Attempt to access another user's account</li>
              <li>Reverse engineer or modify the Service</li>
              <li>Use the Service for any illegal purpose</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">7. Liability Limitation</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALFA22 SOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF LIFE, INJURY, OR PROPERTY DAMAGE ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="text-muted-foreground mt-2">
              We provide the Service "as is" without warranties of any kind, express or implied.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">8. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent activity. You may delete your account at any time through the app settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">9. Changes to Service</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or discontinue the Service at any time, with or without notice. We are not liable for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by the laws of South Africa. Any disputes shall be resolved in the courts of South Africa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold">11. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Email: support@alfa22sos.com</p>
              <p className="text-sm text-muted-foreground mt-1">
                (Replace with your actual support email)
              </p>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
}