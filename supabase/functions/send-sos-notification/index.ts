import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOSNotificationRequest {
  userId: string;
  message: string;
  latitude: number;
  longitude: number;
  deviceModel?: string;
  deviceSerial?: string;
  ipAddress?: string;
  networkISP?: string;
  wifiInfo?: any;
  personalInfo?: any;
  trackingUrl?: string;
  contactsNotified?: number;
  audioUrl?: string;
  photoUrls?: string[];
  audioDuration?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      userId,
      message,
      latitude,
      longitude,
      deviceModel,
      deviceSerial,
      ipAddress,
      networkISP,
      wifiInfo,
      personalInfo,
      trackingUrl,
      contactsNotified,
      audioUrl,
      photoUrls,
      audioDuration
    }: SOSNotificationRequest = await req.json();

    console.log('Received enhanced SOS notification request with attachments');

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    // Build personal info section
    let personalInfoSection = '';
    if (personalInfo) {
      personalInfoSection = `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <h3 style="color: #333; margin-top: 0;">👤 Personal Information</h3>
          ${personalInfo.photo_url ? `
          <div style="text-align: center; margin-bottom: 15px;">
            <img src="${personalInfo.photo_url}" alt="Profile Photo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #dc2626;" />
          </div>
          ` : ''}
          ${personalInfo.name ? `<p style="color: #666; margin: 5px 0;"><strong>Name:</strong> ${personalInfo.name} ${personalInfo.surname || ''}</p>` : ''}
          ${personalInfo.age ? `<p style="color: #666; margin: 5px 0;"><strong>Age:</strong> ${personalInfo.age}</p>` : ''}
          ${personalInfo.gender ? `<p style="color: #666; margin: 5px 0;"><strong>Gender:</strong> ${personalInfo.gender}</p>` : ''}
          ${personalInfo.blood_type ? `<p style="color: #666; margin: 5px 0;"><strong>Blood Type:</strong> ${personalInfo.blood_type}</p>` : ''}
          ${personalInfo.medical_aid_name ? `<p style="color: #666; margin: 5px 0;"><strong>Medical Aid:</strong> ${personalInfo.medical_aid_name}${personalInfo.medical_aid_number ? ` (${personalInfo.medical_aid_number})` : ''}</p>` : ''}
          ${personalInfo.home_address ? `<p style="color: #666; margin: 5px 0;"><strong>Home Address:</strong> ${personalInfo.home_address}</p>` : ''}
          ${personalInfo.spouse_name ? `<p style="color: #666; margin: 5px 0;"><strong>Spouse:</strong> ${personalInfo.spouse_name}${personalInfo.spouse_contact ? ` (${personalInfo.spouse_contact})` : ''}</p>` : ''}
          ${personalInfo.friend_name ? `<p style="color: #666; margin: 5px 0;"><strong>Friend:</strong> ${personalInfo.friend_name} ${personalInfo.friend_surname || ''}${personalInfo.friend_contact ? ` (${personalInfo.friend_contact})` : ''}</p>` : ''}
          ${personalInfo.vehicle_registration ? `<p style="color: #666; margin: 5px 0;"><strong>Vehicle:</strong> ${personalInfo.vehicle_brand || ''} ${personalInfo.vehicle_color || ''} (${personalInfo.vehicle_registration})</p>` : ''}
        </div>
      `;
    }

    // Create HTML email with enhanced attachments
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            h3 { color: #dc2626; margin-top: 0; border-bottom: 2px solid #dc2626; padding-bottom: 8px; }
            .btn { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 ENHANCED SOS ALERT</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Emergency assistance requested</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>⚠️ IMMEDIATE ATTENTION REQUIRED</strong>
                <p style="margin: 5px 0 0 0;">This is an enhanced SOS alert with audio recording, photos, and location tracking.</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📍 Alert Information</h3>
                <p style="color: #666; margin: 5px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Message:</strong> ${message}</p>
                <p style="color: #666; margin: 5px 0;"><strong>User:</strong> ${profile.email}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Contacts Notified:</strong> ${contactsNotified || 0}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${latitude}, ${longitude}</p>
                <div style="text-align: center; margin-top: 15px;">
                  <a href="${locationUrl}" class="btn">📍 View on Google Maps</a>
                  ${trackingUrl ? `<a href="${trackingUrl}" class="btn" style="background-color: #991b1b;">🔴 Live Tracking (1 min)</a>` : ''}
                </div>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📱 Device Information</h3>
                <p style="color: #666; margin: 0;"><strong>Model:</strong> ${deviceModel || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>Serial:</strong> ${deviceSerial || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>Network ISP:</strong> ${networkISP || 'Unknown'}</p>
              </div>
              
              ${audioUrl ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">🎤 Audio Recording</h3>
                <p style="color: #666; margin: 0;"><strong>Duration:</strong> ${audioDuration || 15} seconds</p>
                <p style="color: #666; margin: 5px 0 0 0;"><a href="${audioUrl}" style="color: #dc2626; text-decoration: none;">Download Audio Recording</a></p>
              </div>
              ` : ''}
              
              ${photoUrls && photoUrls.length > 0 ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📸 Camera Captures (${photoUrls.length} photos)</h3>
                ${photoUrls.map((url, i) => `
                  <p style="color: #666; margin: 5px 0;"><a href="${url}" style="color: #dc2626; text-decoration: none;">Photo ${i + 1}</a></p>
                `).join('')}
              </div>
              ` : ''}
              
              ${wifiInfo ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📡 Network Information</h3>
                <pre style="color: #666; margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px;">${typeof wifiInfo === 'string' ? wifiInfo : JSON.stringify(wifiInfo, null, 2)}</pre>
              </div>
              ` : ''}

              ${personalInfoSection}
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #fef2f2; border-radius: 8px;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ This is an automated emergency alert</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Please respond immediately</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const emailData = {
      from: Deno.env.get('GMAIL_USER'),
      to: 'appcontrolroom@alfa22.co.za',
      subject: `🚨 ENHANCED SOS ALERT - ${profile.email} - ${timestamp}`,
      html: htmlBody,
    };

    console.log('Sending enhanced email to:', emailData.to);

    const gmailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: Deno.env.get('GMAIL_APP_PASSWORD'),
        sender: Deno.env.get('GMAIL_USER'),
        to: [emailData.to],
        subject: emailData.subject,
        html_body: htmlBody,
      }),
    });

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error('Gmail API error:', errorText);
      throw new Error('Failed to send email');
    }

    console.log('Enhanced email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Enhanced notification sent with attachments' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-sos-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
