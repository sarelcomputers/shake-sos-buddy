import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WifiInfo {
  currentNetwork: {
    ssid: string;
    connectionType: string;
    connected: boolean;
  };
  nearbyNetworks: Array<{
    ssid: string;
    level?: number;
    frequency?: number;
  }>;
  timestamp: number;
}

interface EmailRequest {
  to: string;
  name: string;
  subject: string;
  message: string;
  location?: string;
  trackingUrl?: string;
  personalInfo?: any;
  wifiNames?: string;
  wifiInfo?: WifiInfo;
  photoUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, subject, message, location, trackingUrl, personalInfo, wifiNames, wifiInfo, photoUrl }: EmailRequest = await req.json();

    console.log('Sending email to:', to);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If photoUrl is provided, fetch and convert to base64
    let photoBase64 = '';
    if (photoUrl) {
      try {
        console.log('Fetching photo from:', photoUrl);
        
        // Extract bucket and path from the photoUrl
        const urlParts = photoUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const [bucket, ...pathParts] = urlParts[1].split('/');
          const filePath = pathParts.join('/');
          
          console.log('Bucket:', bucket, 'Path:', filePath);
          
          // Download the image from Supabase Storage
          const { data: imageData, error } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (error) {
            console.error('Error downloading photo:', error);
          } else if (imageData) {
            // Convert blob to ArrayBuffer then to base64
            const arrayBuffer = await imageData.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            
            // Convert to base64
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            photoBase64 = btoa(binary);
            console.log('Photo converted to base64, size:', photoBase64.length);
          }
        }
      } catch (error) {
        console.error('Error processing photo:', error);
      }
    }

    // Construct email body
    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            <strong>Dear ${name},</strong>
          </p>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-size: 16px;">
              ${message}
            </p>
          </div>
    `;

    if (location) {
      emailBody += `
          <div style="margin: 20px 0;">
            <h3 style="color: #111827; margin-bottom: 10px;">📍 Location</h3>
            <p style="color: #4b5563;">${location}</p>
          </div>
      `;
    }

    if (trackingUrl) {
      emailBody += `
          <div style="margin: 20px 0;">
            <h3 style="color: #111827; margin-bottom: 10px;">🗺️ Live Location Tracking (5 Minutes)</h3>
            <a href="${trackingUrl}" 
               style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Live Location
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Click the button above to track the live location for the next 5 minutes
            </p>
          </div>
      `;
    }

    if (photoBase64) {
      emailBody += `
          <div style="margin: 20px 0;">
            <h3 style="color: #111827; margin-bottom: 10px;">📷 Emergency Photo</h3>
            <img src="data:image/jpeg;base64,${photoBase64}" 
                 alt="Emergency photo from device" 
                 style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #dc2626;" />
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Photo captured from the front camera at the time of alert
            </p>
          </div>
      `;
    }

    // Display WiFi information
    if (wifiInfo && (wifiInfo.nearbyNetworks.length > 0 || wifiInfo.currentNetwork.ssid !== 'N/A')) {
      emailBody += `
          <div style="margin: 20px 0;">
            <h3 style="color: #111827; margin-bottom: 10px;">📡 WiFi Network Information</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
      `;
      
      // Current network
      if (wifiInfo.currentNetwork.ssid !== 'N/A' && wifiInfo.currentNetwork.connectionType === 'wifi') {
        emailBody += `
              <p style="margin: 5px 0;"><strong>Current Network:</strong> ${wifiInfo.currentNetwork.ssid} (Connected)</p>
        `;
      } else {
        emailBody += `
              <p style="margin: 5px 0;"><strong>Connection Type:</strong> ${wifiInfo.currentNetwork.connectionType}</p>
        `;
      }
      
      // Nearby networks
      if (wifiInfo.nearbyNetworks.length > 0) {
        emailBody += `
              <p style="margin: 10px 0 5px 0;"><strong>Nearby WiFi Networks:</strong></p>
              <ul style="margin: 5px 0; padding-left: 20px; color: #4b5563;">
        `;
        
        wifiInfo.nearbyNetworks.forEach(network => {
          const signalStrength = network.level 
            ? network.level > -50 ? '🟢 Excellent' 
              : network.level > -60 ? '🟡 Good' 
              : network.level > -70 ? '🟠 Fair' 
              : '🔴 Weak'
            : '';
          
          emailBody += `
                <li style="margin: 3px 0;">${network.ssid}${signalStrength ? ' - ' + signalStrength : ''}</li>
          `;
        });
        
        emailBody += `
              </ul>
        `;
      } else {
        emailBody += `
              <p style="margin: 5px 0; color: #6b7280;">No nearby WiFi networks detected</p>
        `;
      }
      
      emailBody += `
            </div>
          </div>
      `;
    } else if (wifiNames) {
      // Fallback to simple string if wifiInfo not provided
      emailBody += `
          <div style="margin: 20px 0;">
            <h3 style="color: #111827; margin-bottom: 10px;">📡 WiFi Information</h3>
            <p style="color: #4b5563;">${wifiNames}</p>
          </div>
      `;
    }

    if (personalInfo && Object.keys(personalInfo).length > 0) {
      emailBody += `
          <div style="margin: 20px 0; border-top: 2px solid #e5e7eb; padding-top: 20px;">
            <h3 style="color: #111827; margin-bottom: 15px;">👤 Personal Information</h3>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
      `;

      // Basic Information
      if (personalInfo.name || personalInfo.surname) {
        emailBody += `<p style="margin: 5px 0;"><strong>Name:</strong> ${personalInfo.name || ''} ${personalInfo.surname || ''}</p>`;
      }
      if (personalInfo.id_number) {
        emailBody += `<p style="margin: 5px 0;"><strong>ID Number:</strong> ${personalInfo.id_number}</p>`;
      }
      if (personalInfo.age) {
        emailBody += `<p style="margin: 5px 0;"><strong>Age:</strong> ${personalInfo.age}</p>`;
      }
      if (personalInfo.gender) {
        emailBody += `<p style="margin: 5px 0;"><strong>Gender:</strong> ${personalInfo.gender}</p>`;
      }
      if (personalInfo.home_address) {
        emailBody += `<p style="margin: 5px 0;"><strong>Home Address:</strong> ${personalInfo.home_address}</p>`;
      }
      
      // Medical Information
      if (personalInfo.blood_type) {
        emailBody += `<p style="margin: 5px 0;"><strong>Blood Type:</strong> ${personalInfo.blood_type}</p>`;
      }
      if (personalInfo.medical_aid_name) {
        emailBody += `<p style="margin: 5px 0;"><strong>Medical Aid:</strong> ${personalInfo.medical_aid_name}</p>`;
      }
      if (personalInfo.medical_aid_number) {
        emailBody += `<p style="margin: 5px 0;"><strong>Medical Aid Number:</strong> ${personalInfo.medical_aid_number}</p>`;
      }
      
      // Emergency Contacts
      if (personalInfo.spouse_name) {
        emailBody += `<p style="margin: 10px 0 5px 0;"><strong>Spouse:</strong> ${personalInfo.spouse_name}`;
        if (personalInfo.spouse_contact) {
          emailBody += ` - ${personalInfo.spouse_contact}`;
        }
        emailBody += `</p>`;
      }
      if (personalInfo.friend_name || personalInfo.friend_surname) {
        emailBody += `<p style="margin: 5px 0;"><strong>Friend:</strong> ${personalInfo.friend_name || ''} ${personalInfo.friend_surname || ''}`;
        if (personalInfo.friend_contact) {
          emailBody += ` - ${personalInfo.friend_contact}`;
        }
        emailBody += `</p>`;
      }
      
      // Vehicle Information
      if (personalInfo.vehicle_registration || personalInfo.vehicle_brand || personalInfo.vehicle_color) {
        emailBody += `<p style="margin: 10px 0 5px 0;"><strong>Vehicle:</strong> `;
        const vehicleParts = [];
        if (personalInfo.vehicle_brand) vehicleParts.push(personalInfo.vehicle_brand);
        if (personalInfo.vehicle_color) vehicleParts.push(personalInfo.vehicle_color);
        if (personalInfo.vehicle_registration) vehicleParts.push(`Reg: ${personalInfo.vehicle_registration}`);
        emailBody += vehicleParts.join(' - ') + `</p>`;
      }

      emailBody += `
            </div>
          </div>
      `;
    }

    emailBody += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>This is an automated emergency alert from Alfa22 SOS system.</p>
            <p style="margin-top: 10px;">Please respond immediately if you receive this message.</p>
          </div>
        </div>
      </div>
    `;

    // Send email using Gmail SMTP
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      throw new Error('Gmail credentials not configured');
    }

    await sendViaGmailSMTP(gmailUser, gmailPassword, to, subject, emailBody);

    console.log('Email sent successfully to:', to);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-emergency-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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