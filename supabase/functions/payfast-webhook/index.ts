import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PAYFAST_HOST = 'https://www.payfast.co.za'

// PayFast valid IP addresses
const PAYFAST_IPS = [
  // 197.97.145.144/28 (197.97.145.144 - 197.97.145.159)
  '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
  '197.97.145.148', '197.97.145.149', '197.97.145.150', '197.97.145.151',
  '197.97.145.152', '197.97.145.153', '197.97.145.154', '197.97.145.155',
  '197.97.145.156', '197.97.145.157', '197.97.145.158', '197.97.145.159',
  // 41.74.179.192/27 (41.74.179.192 – 41.74.179.223)
  '41.74.179.192', '41.74.179.193', '41.74.179.194', '41.74.179.195',
  '41.74.179.196', '41.74.179.197', '41.74.179.198', '41.74.179.199',
  '41.74.179.200', '41.74.179.201', '41.74.179.202', '41.74.179.203',
  '41.74.179.204', '41.74.179.205', '41.74.179.206', '41.74.179.207',
  '41.74.179.208', '41.74.179.209', '41.74.179.210', '41.74.179.211',
  '41.74.179.212', '41.74.179.213', '41.74.179.214', '41.74.179.215',
  '41.74.179.216', '41.74.179.217', '41.74.179.218', '41.74.179.219',
  '41.74.179.220', '41.74.179.221', '41.74.179.222', '41.74.179.223',
  // 102.216.36.0/28 (102.216.36.0 - 102.216.36.15)
  '102.216.36.0', '102.216.36.1', '102.216.36.2', '102.216.36.3',
  '102.216.36.4', '102.216.36.5', '102.216.36.6', '102.216.36.7',
  '102.216.36.8', '102.216.36.9', '102.216.36.10', '102.216.36.11',
  '102.216.36.12', '102.216.36.13', '102.216.36.14', '102.216.36.15',
  // 102.216.36.128/28 (102.216.36.128 - 102.216.36.143)
  '102.216.36.128', '102.216.36.129', '102.216.36.130', '102.216.36.131',
  '102.216.36.132', '102.216.36.133', '102.216.36.134', '102.216.36.135',
  '102.216.36.136', '102.216.36.137', '102.216.36.138', '102.216.36.139',
  '102.216.36.140', '102.216.36.141', '102.216.36.142', '102.216.36.143',
  // Additional IP
  '144.126.193.139',
];

function isValidPayFastIP(ip: string | null): boolean {
  if (!ip) return false;
  
  // Extract IP if it contains port
  const cleanIP = ip.split(':')[0];
  const isValid = PAYFAST_IPS.includes(cleanIP);
  
  console.log(`IP validation: ${cleanIP} - ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP address
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') ||
                     'unknown';
    
    console.log(`Webhook request from IP: ${clientIP}`);
    
    // Validate IP address (only in production)
    if (!isValidPayFastIP(clientIP)) {
      console.error(`Unauthorized IP address: ${clientIP}`);
      return new Response('Unauthorized', { 
        status: 403, 
        headers: corsHeaders 
      })
    }
    const formData = await req.formData()
    const data: Record<string, string> = {}
    
    // Convert FormData to object
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    console.log('PayFast webhook received:', data)

    // Verify the signature
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE')
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID')
    
    if (data.merchant_id !== merchantId) {
      console.error('Invalid merchant ID')
      return new Response('Invalid merchant', { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract user_id from custom_str1
    const userId = data.custom_str1
    
    if (!userId) {
      console.error('No user_id in webhook data')
      return new Response('No user_id', { status: 400, headers: corsHeaders })
    }

    // Handle different payment statuses
    const paymentStatus = data.payment_status
    
    console.log(`Processing payment status: ${paymentStatus} for user: ${userId}`)

    if (paymentStatus === 'COMPLETE') {
      // Update subscription to active
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payfast_token: data.token,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating subscription:', error)
        return new Response('Database error', { status: 500, headers: corsHeaders })
      }

      console.log('Subscription activated for user:', userId)
    } else if (paymentStatus === 'CANCELLED') {
      // Update subscription to cancelled
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      console.log('Subscription cancelled for user:', userId)
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})