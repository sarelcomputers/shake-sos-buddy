# PayFast Payment Setup - PRODUCTION MODE

This application uses PayFast for subscription payments in **PRODUCTION MODE**.

## 1. Production Credentials

The app is configured to use PayFast production environment:
- PayFast URL: `https://www.payfast.co.za/eng/process`
- Production Merchant ID and Key are required
- Sign up at [PayFast](https://www.payfast.co.za/) to get credentials
- Create a Passphrase in your account settings under Settings → Integration

## 2. Configure Backend Secrets

You've already added the following secrets to Lovable Cloud:
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`  
- `PAYFAST_PASSPHRASE`

These are used by the webhook edge function to verify payments.

## 3. Configure Frontend Environment (Optional)

To override the default test credentials with your production credentials, create a `.env.local` file:

```env
VITE_PAYFAST_MERCHANT_ID=your_production_merchant_id
VITE_PAYFAST_MERCHANT_KEY=your_production_merchant_key
VITE_PAYFAST_URL=https://www.payfast.co.za/eng/process
```

**Note:** The app now defaults to production mode. The URL above is already set as default.

## 4. Configure PayFast Webhooks

1. Log in to your PayFast account
2. Go to Settings → Integration
3. Add the webhook URL: `https://cglsnlsasnveypwmguee.supabase.co/functions/v1/payfast-webhook`
4. Enable Instant Transaction Notifications (ITN)

**Important Security Note:**
The webhook validates incoming requests to ensure they come from PayFast's verified IP addresses:
- 197.97.145.144/28 (197.97.145.144 - 197.97.145.159)
- 41.74.179.192/27 (41.74.179.192 – 41.74.179.223)
- 102.216.36.0/28 (102.216.36.0 - 102.216.36.15)
- 102.216.36.128/28 (102.216.36.128 - 102.216.36.143)
- 144.126.193.139

**The app is now in PRODUCTION MODE and strictly enforces IP validation.** Requests from unauthorized IPs will be rejected.

## 5. Live Payment Processing

1. Sign up for a new account in your app
2. You'll get a 30-day free trial automatically
3. When the trial expires, click "Subscribe Now"
4. Complete payment using real payment methods through PayFast
5. **Note:** App is in production mode - real payments will be processed

## How It Works

1. **Trial Period**: New users get 30 days free automatically
2. **Subscription**: After trial, users must subscribe for R50/month
3. **Payment Flow**: 
   - User clicks "Subscribe Now"
   - Redirected to PayFast payment page
   - After payment, PayFast notifies webhook
   - Webhook updates subscription status
   - User gets access to the app
4. **Access Control**: App checks subscription status before allowing access

## Subscription Statuses

- `trial`: User in 30-day trial period
- `active`: Paid subscription active
- `expired`: Trial or subscription expired
- `cancelled`: User cancelled subscription

## Support

**PayFast Ports:** The webhook accepts requests on ports 80, 8080, 8081, and 443.

For PayFast support, visit: https://www.payfast.co.za/support
