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
  wifiNames?: string;
  personalInfo?: any;
  trackingUrl?: string;
  photoUrl?: string;
  contactsNotified?: number;
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
      wifiNames,
      personalInfo,
      trackingUrl,
      photoUrl,
      contactsNotified,
    }: SOSNotificationRequest = await req.json();

    console.log('Received simplified SOS notification request');

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

    // Create HTML email
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
              <h1>🚨 SOS ALERT</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px;">Emergency assistance requested</p>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>⚠️ IMMEDIATE ATTENTION REQUIRED</strong>
                <p style="margin: 5px 0 0 0;">This is an SOS alert with location tracking and personal information.</p>
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
                  ${trackingUrl ? `<a href="${trackingUrl}" class="btn" style="background-color: #991b1b;">🔴 Live Tracking (5 min)</a>` : ''}
                </div>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📱 Device Information</h3>
                <p style="color: #666; margin: 0;"><strong>Model:</strong> ${deviceModel || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>Serial:</strong> ${deviceSerial || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
                <p style="color: #666; margin: 0;"><strong>Network ISP:</strong> ${networkISP || 'Unknown'}</p>
              </div>
              
              ${wifiNames ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h3 style="color: #333; margin-top: 0;">📡 Nearby WiFi Networks</h3>
                <p style="color: #666; margin: 0;">${wifiNames}</p>
              </div>
              ` : ''}

              ${photoUrl ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
                <h3 style="color: #333; margin-top: 0;">📷 Emergency Photo</h3>
                <img src="${photoUrl}" alt="Emergency photo from device" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #dc2626; margin-top: 10px;" />
                <p style="color: #666; font-size: 14px; margin-top: 10px;">Photo captured from the front camera at the time of alert</p>
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

    // Send email using Gmail SMTP
    const emailTo = 'appcontrolroom@alfa22.co.za';
    const emailSubject = `🚨 SOS ALERT - ${profile.email} - ${timestamp}`;
    
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail credentials not configured');
    }

    console.log('Sending email to:', emailTo);
    await sendViaGmailSMTP(gmailUser, gmailPassword, emailTo, emailSubject, htmlBody);

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

async function sendViaGmailSMTP(
  user: string,
  password: string,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  console.log('Sending email via Gmail SMTP to:', to);

  const conn = await Deno.connect({
    hostname: "smtp.gmail.com",
    port: 587,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    return decoder.decode(buffer.subarray(0, n));
  }

  async function sendCommand(command: string): Promise<string> {
    await conn.write(encoder.encode(command + "\r\n"));
    return await readResponse();
  }

  try {
    await readResponse();
    await sendCommand("EHLO localhost");
    await sendCommand("STARTTLS");

    const tlsConn = await Deno.startTls(conn, {
      hostname: "smtp.gmail.com",
    });

    async function sendTlsCommand(command: string): Promise<string> {
      await tlsConn.write(encoder.encode(command + "\r\n"));
      const buffer = new Uint8Array(1024);
      const n = await tlsConn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buffer.subarray(0, n));
    }

    await sendTlsCommand("EHLO localhost");
    await sendTlsCommand("AUTH LOGIN");
    await sendTlsCommand(btoa(user));
    await sendTlsCommand(btoa(password));
    await sendTlsCommand(`MAIL FROM:<${user}>`);
    await sendTlsCommand(`RCPT TO:<${to}>`);
    await sendTlsCommand("DATA");

    const emailContent = [
      `From: Alfa22 SOS <${user}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      html,
      ".",
    ].join("\r\n");

    await sendTlsCommand(emailContent);
    await sendTlsCommand("QUIT");
    tlsConn.close();
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}
