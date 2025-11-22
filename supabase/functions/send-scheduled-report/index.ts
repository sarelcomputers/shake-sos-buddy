import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: 'daily' | 'weekly';
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

    const { reportType } = await req.json() as ReportRequest;
    console.log('Generating scheduled report:', reportType);

    // Calculate date range based on report type
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;
    let reportPeriod: string;

    if (reportType === 'daily') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      startDate = yesterday.toISOString();
      reportPeriod = yesterday.toLocaleDateString('en-ZA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      // Weekly report - last 7 days
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
      startDate = lastWeek.toISOString();
      reportPeriod = `${lastWeek.toLocaleDateString('en-ZA')} - ${now.toLocaleDateString('en-ZA')}`;
    }

    // Fetch alerts for the period
    const { data: alerts, error: alertsError } = await supabase
      .from('sos_history')
      .select(`
        *,
        profiles (
          email
        )
      `)
      .gte('triggered_at', startDate)
      .lte('triggered_at', endDate)
      .order('triggered_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      throw new Error('Failed to fetch alerts');
    }

    const alertCount = alerts?.length || 0;
    console.log(`Found ${alertCount} alerts for ${reportType} report`);

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'User ID',
      'Message',
      'Latitude',
      'Longitude',
      'Contacts Notified',
      'Contact Names',
      'Contact Phones',
      'Device Model',
      'Device Serial',
      'Network ISP',
      'WiFi SSID',
      'WiFi Connected'
    ].join(',');

    const csvRows = (alerts || []).map((alert: any) => {
      const timestamp = new Date(alert.triggered_at).toLocaleString('en-ZA');
      const userEmail = alert.profiles?.email || 'Unknown';
      const contactNames = (alert.contacted_recipients as any[])?.map(c => c.name).join('; ') || '';
      const contactPhones = (alert.contacted_recipients as any[])?.map(c => c.phone).join('; ') || '';
      
      return [
        `"${timestamp}"`,
        `"${userEmail}"`,
        `"${alert.user_id}"`,
        `"${alert.message.replace(/"/g, '""')}"`,
        alert.latitude,
        alert.longitude,
        alert.contacts_count,
        `"${contactNames}"`,
        `"${contactPhones}"`,
        `"${alert.device_model || 'N/A'}"`,
        `"${alert.device_serial || 'N/A'}"`,
        `"${alert.network_isp || 'N/A'}"`,
        `"${alert.wifi_info?.ssid || 'N/A'}"`,
        alert.wifi_info?.connected ? 'Yes' : 'No'
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    // Create summary statistics
    const uniqueUsers = new Set((alerts || []).map((a: any) => a.user_id)).size;
    const totalContacts = (alerts || []).reduce((sum: number, a: any) => sum + a.contacts_count, 0);
    
    const deviceModels: { [key: string]: number } = {};
    (alerts || []).forEach((a: any) => {
      if (a.device_model) {
        deviceModels[a.device_model] = (deviceModels[a.device_model] || 0) + 1;
      }
    });
    const topDevice = Object.entries(deviceModels).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Create HTML email with report
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background-color: #1e40af; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .stats { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stat-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .stat-label { font-weight: bold; color: #6b7280; }
            .stat-value { color: #1e40af; font-size: 18px; font-weight: bold; }
            .alert-section { margin-top: 30px; }
            .alert-item { background: #f9fafb; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; border-radius: 4px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            .download-note { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Alfa22 SOS Alert Report</h1>
              <p style="margin: 5px 0; font-size: 18px;">${reportType === 'daily' ? 'Daily' : 'Weekly'} Report</p>
              <p style="margin: 5px 0;">${reportPeriod}</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1e40af;">Summary Statistics</h2>
              <div class="stats">
                <div class="stat-row">
                  <span class="stat-label">Total Alerts:</span>
                  <span class="stat-value">${alertCount}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Unique Users:</span>
                  <span class="stat-value">${uniqueUsers}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Total Contacts Notified:</span>
                  <span class="stat-value">${totalContacts}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Most Common Device:</span>
                  <span class="stat-value" style="font-size: 14px;">${topDevice}</span>
                </div>
              </div>

              ${alertCount === 0 ? `
                <div style="text-align: center; padding: 40px 20px; color: #6b7280;">
                  <p style="font-size: 18px;">✅ No emergency alerts during this period</p>
                  <p>This is great news! The system is operational and monitoring.</p>
                </div>
              ` : `
                <div class="download-note">
                  <strong>📎 Attachment:</strong> Detailed CSV report with all ${alertCount} alert(s) is attached to this email.
                </div>

                <h2 style="color: #1e40af; margin-top: 30px;">Recent Alerts Preview</h2>
                <div class="alert-section">
                  ${(alerts || []).slice(0, 5).map((alert: any) => `
                    <div class="alert-item">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>${alert.profiles?.email || 'Unknown User'}</strong>
                        <span style="color: #6b7280; font-size: 12px;">
                          ${new Date(alert.triggered_at).toLocaleString('en-ZA')}
                        </span>
                      </div>
                      <div style="font-size: 14px; color: #4b5563;">
                        <p style="margin: 5px 0;"><strong>Message:</strong> ${alert.message}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> ${alert.latitude.toFixed(6)}, ${alert.longitude.toFixed(6)}</p>
                        <p style="margin: 5px 0;"><strong>Contacts Notified:</strong> ${alert.contacts_count}</p>
                        ${alert.device_model ? `<p style="margin: 5px 0;"><strong>Device:</strong> ${alert.device_model}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                  ${alertCount > 5 ? `<p style="text-align: center; color: #6b7280; margin-top: 15px;">... and ${alertCount - 5} more alert(s) in the attached CSV file</p>` : ''}
                </div>
              `}

              <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px;">
                <h3 style="color: #1e40af; margin-top: 0;">📊 Access Control Room Dashboard</h3>
                <p style="margin: 10px 0;">For real-time monitoring and detailed analysis, access the control room dashboard:</p>
                <p style="margin: 10px 0;"><a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/control-room" style="color: #1e40af;">Open Control Room →</a></p>
              </div>
            </div>

            <div class="footer">
              <p><strong>Alfa22 SOS Alert System</strong></p>
              <p>Automated ${reportType === 'daily' ? 'Daily' : 'Weekly'} Report</p>
              <p>Generated: ${now.toLocaleString('en-ZA')}</p>
              <p style="margin-top: 15px; color: #9ca3af;">
                This is an automated report. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Gmail SMTP using a simple HTTP approach
    const emailSubject = `${reportType === 'daily' ? 'Daily' : 'Weekly'} SOS Alert Report - ${reportPeriod} (${alertCount} alerts)`;
    
    console.log('Sending email to appcontrolroom@alfa22.co.za');

    // Using a simple nodemailer-compatible approach via fetch
    // Note: In production, you might want to use a dedicated email service
    const emailPayload = {
      from: Deno.env.get('GMAIL_USER'),
      to: 'appcontrolroom@alfa22.co.za',
      subject: emailSubject,
      html: htmlBody,
      attachments: alertCount > 0 ? [
        {
          filename: `sos_alerts_${reportType}_${now.toISOString().split('T')[0]}.csv`,
          content: csvBase64,
          encoding: 'base64',
          contentType: 'text/csv'
        }
      ] : []
    };

    // Log the report generation
    console.log('Report generated successfully:', {
      reportType,
      period: reportPeriod,
      alertCount,
      uniqueUsers,
      totalContacts
    });

    // In a real implementation, you'd send this via SMTP
    // For now, we'll use a simple approach with the Gmail API or SMTP service
    // This is a placeholder - in production, integrate with an email service like Resend or SendGrid
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Report generated and email prepared',
        stats: {
          reportType,
          period: reportPeriod,
          alertCount,
          uniqueUsers,
          totalContacts
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating scheduled report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
