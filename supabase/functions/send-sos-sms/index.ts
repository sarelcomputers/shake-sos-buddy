import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOSRequest {
  message: string;
  contacts: Array<{ phone: string; name: string }>;
  location: {
    latitude: number;
    longitude: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, contacts, location }: SOSRequest = await req.json();

    console.log('Sending SOS messages to', contacts.length, 'contacts');

    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const fullMessage = `${message}\n\nLocation: ${locationUrl}`;

    // Send SMS to all contacts in parallel
    const sendPromises = contacts.map(async (contact) => {
      const basicAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
      
      const body = new URLSearchParams({
        To: contact.phone,
        From: twilioPhoneNumber!,
        Body: fullMessage,
      });

      console.log(`Sending SMS to ${contact.name} (${contact.phone})`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        console.error(`Failed to send SMS to ${contact.name}:`, result);
        throw new Error(`Failed to send to ${contact.name}: ${result.message}`);
      }

      console.log(`SMS sent successfully to ${contact.name}:`, result.sid);
      return { success: true, contact: contact.name, sid: result.sid };
    });

    const results = await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SOS messages sent successfully',
        results 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-sos-sms function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
