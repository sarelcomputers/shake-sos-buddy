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
  deviceModel: string | null;
  deviceSerial: string | null;
  networkIsp: string | null;
  wifiInfo: { ssid: string; connected: boolean } | null;
  contactsCount: number;
  personalInfo?: any;
  liveTrackingUrl?: string | null;
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

    const data: SOSNotificationRequest = await req.json();
    console.log('Received SOS notification request:', data);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', data.userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    const locationUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
    const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    // Build personal info section
    const personalInfoSection = data.personalInfo ? `
      <div class="section">
        <h3>Personal Information</h3>
        ${data.personalInfo.photo_url ? `
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${data.personalInfo.photo_url}" alt="Profile Photo" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #dc2626;" />
        </div>
        ` : ''}
        ${data.personalInfo.name ? `
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">${data.personalInfo.name} ${data.personalInfo.surname || ''}</span>
        </div>
        ` : ''}
        ${data.personalInfo.age ? `
        <div class="info-row">
          <span class="label">Age:</span>
          <span class="value">${data.personalInfo.age}</span>
        </div>
        ` : ''}
        ${data.personalInfo.gender ? `
        <div class="info-row">
          <span class="label">Gender:</span>
          <span class="value">${data.personalInfo.gender}</span>
        </div>
        ` : ''}
        ${data.personalInfo.blood_type ? `
        <div class="info-row">
          <span class="label">Blood Type:</span>
          <span class="value">${data.personalInfo.blood_type}</span>
        </div>
        ` : ''}
        ${data.personalInfo.medical_aid_name ? `
        <div class="info-row">
          <span class="label">Medical Aid:</span>
          <span class="value">${data.personalInfo.medical_aid_name}${data.personalInfo.medical_aid_number ? ` (${data.personalInfo.medical_aid_number})` : ''}</span>
        </div>
        ` : ''}
        ${data.personalInfo.home_address ? `
        <div class="info-row">
          <span class="label">Home Address:</span>
          <span class="value">${data.personalInfo.home_address}</span>
        </div>
        ` : ''}
        ${data.personalInfo.spouse_name ? `
        <div class="info-row">
          <span class="label">Spouse:</span>
          <span class="value">${data.personalInfo.spouse_name}${data.personalInfo.spouse_contact ? ` - ${data.personalInfo.spouse_contact}` : ''}</span>
        </div>
        ` : ''}
        ${data.personalInfo.friend_name ? `
        <div class="info-row">
          <span class="label">Friend:</span>
          <span class="value">${data.personalInfo.friend_name} ${data.personalInfo.friend_surname || ''}${data.personalInfo.friend_contact ? ` - ${data.personalInfo.friend_contact}` : ''}</span>
        </div>
        ` : ''}
        ${data.personalInfo.vehicle_registration ? `
        <div class="info-row">
          <span class="label">Vehicle:</span>
          <span class="value">${data.personalInfo.vehicle_brand || ''} ${data.personalInfo.vehicle_color || ''} - ${data.personalInfo.vehicle_registration}</span>
        </div>
        ` : ''}
      </div>
    ` : '';

    // Create HTML email
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px; }
            .section h3 { margin-top: 0; color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; min-width: 150px; color: #555; }
            .value { color: #000; }
            .location-btn { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 SOS ALERT TRIGGERED</h1>
              <p style="margin: 0;">Emergency assistance requested</p>
            </div>
            <div class="content">
              <div class="section">
                <h3>Alert Information</h3>
                <div class="info-row">
                  <span class="label">Timestamp:</span>
                  <span class="value">${timestamp}</span>
                </div>
                <div class="info-row">
                  <span class="label">Message:</span>
                  <span class="value">${data.message}</span>
                </div>
                <div class="info-row">
                  <span class="label">Contacts Notified:</span>
                  <span class="value">${data.contactsCount}</span>
                </div>
              </div>

              <div class="section">
                <h3>User Details</h3>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${profile.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">User ID:</span>
                  <span class="value">${data.userId}</span>
                </div>
              </div>

              ${personalInfoSection}

              <div class="section">
                <h3>Device Information</h3>
                <div class="info-row">
                  <span class="label">Device Model:</span>
                  <span class="value">${data.deviceModel || 'Not available'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Device Serial:</span>
                  <span class="value">${data.deviceSerial || 'Not available'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Network ISP:</span>
                  <span class="value">${data.networkIsp || 'Not available'}</span>
                </div>
                ${data.wifiInfo ? `
                <div class="info-row">
                  <span class="label">WiFi SSID:</span>
                  <span class="value">${data.wifiInfo.ssid}</span>
                </div>
                <div class="info-row">
                  <span class="label">WiFi Connected:</span>
                  <span class="value">${data.wifiInfo.connected ? 'Yes' : 'No'}</span>
                </div>
                ` : ''}
              </div>

              <div class="section">
                <h3>Location Information</h3>
                <div class="info-row">
                  <span class="label">Latitude:</span>
                  <span class="value">${data.latitude}</span>
                </div>
                <div class="info-row">
                  <span class="label">Longitude:</span>
                  <span class="value">${data.longitude}</span>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                  <a href="${locationUrl}" class="location-btn">View Location on Map</a>
                </div>
                ${data.liveTrackingUrl ? `
                <div style="text-align: center; margin-top: 15px; padding: 15px; background: #fef2f2; border-radius: 6px;">
                  <p style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">🔴 LIVE TRACKING ACTIVE (5 minutes)</p>
                  <a href="${data.liveTrackingUrl}" class="location-btn" style="background-color: #991b1b;">View Live Tracking</a>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="footer">
              <p>This is an automated alert from Alfa22 SOS System</p>
              <p>Please respond immediately to this emergency</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Gmail SMTP
    const emailData = {
      from: Deno.env.get('GMAIL_USER'),
      to: 'appcontrolroom@alfa22.co.za',
      subject: `🚨 SOS ALERT - ${profile.email} - ${timestamp}`,
      html: htmlBody,
    };

    console.log('Sending email to:', emailData.to);

    // Use Gmail SMTP API
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
      
      // Fallback to nodemailer-style SMTP
      const smtpResponse = await sendViaGmailSMTP(emailData);
      if (!smtpResponse.success) {
        throw new Error('Failed to send email via SMTP');
      }
    }

    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
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

async function sendViaGmailSMTP(emailData: any) {
  try {
    // Using Gmail SMTP directly with Deno's SMTPClient
    const encoder = new TextEncoder();
    
    // Connect to Gmail SMTP
    const conn = await Deno.connect({
      hostname: 'smtp.gmail.com',
      port: 587,
    });

    // Simple SMTP protocol implementation
    const commands = [
      `EHLO localhost\r\n`,
      `AUTH LOGIN\r\n`,
      btoa(Deno.env.get('GMAIL_USER') || '') + '\r\n',
      btoa(Deno.env.get('GMAIL_APP_PASSWORD') || '') + '\r\n',
      `MAIL FROM:<${emailData.from}>\r\n`,
      `RCPT TO:<${emailData.to}>\r\n`,
      `DATA\r\n`,
      `From: ${emailData.from}\r\n`,
      `To: ${emailData.to}\r\n`,
      `Subject: ${emailData.subject}\r\n`,
      `Content-Type: text/html; charset=UTF-8\r\n`,
      `\r\n`,
      `${emailData.html}\r\n`,
      `.\r\n`,
      `QUIT\r\n`,
    ];

    for (const cmd of commands) {
      await conn.write(encoder.encode(cmd));
      // Wait a bit for response
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    conn.close();
    return { success: true };
  } catch (error) {
    console.error('SMTP error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
    return { success: false, error: errorMessage };
  }
}
