import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const PAYFAST_HOST = Deno.env.get('TESTING_MODE') === 'true' 
  ? 'https://sandbox.payfast.co.za'
  : 'https://www.payfast.co.za'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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