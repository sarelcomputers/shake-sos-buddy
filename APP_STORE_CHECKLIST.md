# App Store Submission Checklist

## ✅ Completed Requirements

### Legal Pages (Required)
- ✅ Privacy Policy available at `/privacy`
- ✅ Terms of Service available at `/terms`
- ✅ Both pages are publicly accessible (no login required)

### Security & Privacy
- ✅ Secure authentication system
- ✅ Row-level security on all database tables
- ✅ Encrypted data transmission (HTTPS)
- ✅ Payment processing via secure third-party (PayFast)
- ✅ Admin-only subscription management

### App Functionality
- ✅ Emergency SOS alerts
- ✅ Location sharing
- ✅ Shake detection
- ✅ Contact management
- ✅ Subscription system (30-day trial + R50/month)
- ✅ User authentication
- ✅ Admin dashboard

## 📋 Before Submission

### 1. App Store Connect / Google Play Console Setup

#### Apple App Store
1. Create an App Store Connect account at https://appstoreconnect.apple.com
2. Add a new app and fill in:
   - **App Name**: Alfa22 SOS
   - **Bundle ID**: `app.lovable.5cb83c0c55a84b36a981495f8680a735`
   - **SKU**: `alfa22-sos`
   - **Primary Language**: English

#### Google Play Console
1. Create a Google Play Developer account at https://play.google.com/console
2. Create a new app and fill in:
   - **App Name**: Alfa22 SOS
   - **Package Name**: `app.lovable.5cb83c0c55a84b36a981495f8680a735`
   - **Default Language**: English

### 2. App Icons & Assets

You need to create app icons in multiple sizes:

**iOS Requirements:**
- 1024x1024px (App Store)
- 180x180px (iPhone 3x)
- 120x120px (iPhone 2x)
- 167x167px (iPad Pro)
- 152x152px (iPad)

**Android Requirements:**
- 512x512px (Play Store)
- 192x192px (xxxhdpi)
- 144x144px (xxhdpi)
- 96x96px (xhdpi)
- 72x72px (hdpi)
- 48x48px (mdpi)

**Tool:** Use https://www.appicon.co/ to generate all sizes from one 1024x1024 image.

### 3. Screenshots

You need screenshots for multiple device sizes:

**iOS:**
- iPhone 6.7" (1290x2796px) - At least 3 screenshots
- iPhone 6.5" (1242x2688px) - At least 3 screenshots
- iPad Pro 12.9" (2048x2732px) - At least 3 screenshots

**Android:**
- Phone (1080x1920px or similar) - At least 2 screenshots
- 7" Tablet (1024x600px or similar) - Optional
- 10" Tablet (1920x1200px or similar) - Optional

### 4. App Descriptions

#### Short Description (80 characters max)
"Emergency SOS app with shake detection and location sharing"

#### Full Description (Suggested)
```
Alfa22 SOS is your reliable emergency alert companion that helps you reach your loved ones when you need them most.

KEY FEATURES:
• Instant SOS Alerts: Send emergency messages to multiple contacts with one tap
• Shake Detection: Automatically trigger alerts by shaking your phone
• Location Sharing: Your exact GPS location is sent with every SOS message
• Contact Management: Add and manage your emergency contacts
• Alert History: Review past emergency activations
• Customizable Messages: Personalize your emergency alerts

SUBSCRIPTION:
• 30-day FREE trial for all new users
• R50/month after trial period
• Cancel anytime

IMPORTANT:
Alfa22 SOS is designed to complement, not replace, official emergency services. Always call local emergency numbers (112, 10111) in life-threatening situations.

WHY CHOOSE ALFA22 SOS?
✓ Fast and reliable emergency communication
✓ Easy-to-use interface
✓ Secure and private
✓ Works offline (SMS-based)
✓ No ads

PERMISSIONS:
• Location: To share your location with emergency contacts
• SMS: To send emergency messages
• Motion: For shake detection feature

For support: support@alfa22sos.com
Privacy Policy: https://yourapp.com/privacy
Terms of Service: https://yourapp.com/terms
```

### 5. App Store-Specific Information

#### Age Rating
- **Minimum Age**: 13+ (contains location sharing and payment processing)
- **Content Descriptors**: None (emergency service app)

#### Keywords (Apple)
emergency, sos, alert, safety, security, location, shake, help, contacts, panic button

#### Categories
- **Primary**: Utilities
- **Secondary**: Health & Fitness (optional)

### 6. Privacy & Data Handling

You must disclose what data you collect:

**Data Collected:**
- ✅ Email address (for authentication)
- ✅ Contact information (emergency contacts)
- ✅ Location data (when SOS is activated)
- ✅ Device motion data (for shake detection)
- ✅ Payment information (processed by PayFast)
- ✅ Usage history (SOS activations)

**Data Usage:**
- All data is used solely for providing emergency services
- Location is only accessed during SOS activation
- No data is sold to third parties
- Payment processing handled by PayFast (PCI-DSS compliant)

### 7. Support & Contact Information

Update these placeholders in your legal pages:
- **Support Email**: support@alfa22sos.com (replace with real email)
- **Privacy Email**: privacy@alfa22sos.com (replace with real email)
- **Website**: https://yourapp.com (replace with your domain)

### 8. Testing Before Submission

#### iOS Testing
```bash
# 1. Export to GitHub and clone locally
git clone your-repo-url

# 2. Install dependencies
npm install

# 3. Add iOS platform
npx cap add ios

# 4. Build the web app
npm run build

# 5. Sync to iOS
npx cap sync ios

# 6. Open in Xcode
npx cap open ios

# 7. Test on physical device or simulator
# Select your device and click Run in Xcode
```

#### Android Testing
```bash
# 1-4: Same as iOS above

# 5. Sync to Android
npx cap sync android

# 6. Open in Android Studio
npx cap open android

# 7. Test on physical device or emulator
# Click Run in Android Studio
```

### 9. Final Checklist Before Submitting

- [ ] App icons added in all required sizes
- [ ] Screenshots captured for all device sizes
- [ ] Privacy Policy URL is publicly accessible
- [ ] Terms of Service URL is publicly accessible
- [ ] Support email is active and monitored
- [ ] App description is clear and accurate
- [ ] All permissions are properly explained
- [ ] Age rating is appropriate (13+)
- [ ] Payment system (PayFast) is properly configured
- [ ] Test payments work correctly
- [ ] All features tested on physical devices
- [ ] No crashes or critical bugs
- [ ] App meets performance guidelines

### 10. Common Rejection Reasons (Avoid These!)

**Apple:**
- ❌ Missing privacy policy or inaccessible
- ❌ Not explaining why permissions are needed
- ❌ Crashes or bugs during review
- ❌ Misleading app description
- ❌ Payment system not properly disclosed

**Google:**
- ❌ Privacy policy not linked in Play Store listing
- ❌ Dangerous permissions without clear explanation
- ❌ Violating location data policies
- ❌ Payment processing not compliant

### 11. Post-Submission

After submitting:
1. **Review Time**: 
   - Apple: 1-3 business days
   - Google: Few hours to 7 days
2. **Respond quickly** to any reviewer questions
3. **Monitor** your support email for user feedback
4. **Update regularly** to fix bugs and add features

### 12. Permissions Explanations (Required!)

When submitting, you'll need to explain each permission:

**Location Permission:**
"Alfa22 SOS needs your location to send your exact GPS coordinates to emergency contacts when you activate an SOS alert. This helps your contacts find you quickly in an emergency."

**SMS Permission:**
"The app sends SMS messages to your emergency contacts when you activate an SOS alert. This ensures the message reaches them even without internet connection."

**Motion/Accelerometer Permission:**
"The shake detection feature uses your device's motion sensor to automatically trigger an SOS alert when you shake your phone rapidly. This provides a quick way to call for help in emergencies."

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Capacitor iOS Deployment Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Deployment Guide](https://capacitorjs.com/docs/android)

## Need Help?

If you encounter issues during submission:
1. Read the rejection reasons carefully
2. Update your app based on feedback
3. Resubmit with explanations of changes made
4. Consider hiring a mobile app consultant if needed

Good luck with your submission! 🚀
