import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface SendWhatsAppRequest {
  phoneNumbers: string[];
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumbers, message }: SendWhatsAppRequest = await req.json();
    
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error('Twilio credentials not configured');
    }

    console.log('Sending WhatsApp messages to', phoneNumbers.length, 'recipients via Twilio');

    const results = await Promise.allSettled(
      phoneNumbers.map(async (phoneNumber) => {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        // Format numbers for WhatsApp (add whatsapp: prefix)
        const fromNumber = `whatsapp:${twilioWhatsAppNumber}`;
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
        
        const formData = new URLSearchParams();
        formData.append('From', fromNumber);
        formData.append('To', toNumber);
        formData.append('Body', message);

        console.log(`Sending WhatsApp from ${fromNumber} to ${toNumber}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send WhatsApp to ${toNumber}:`, errorText);
          throw new Error(`Twilio API error: ${errorText}`);
        }

        const result = await response.json();
        console.log(`WhatsApp sent successfully to ${toNumber}:`, result.sid);
        return result;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`WhatsApp sending complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed: failed,
        results: results.map(r => r.status === 'fulfilled' ? { success: true } : { success: false, error: r.reason })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp-twilio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});