import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface SendTelegramRequest {
  chatIds: string[];
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatIds, message }: SendTelegramRequest = await req.json();
    
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!telegramBotToken) {
      throw new Error('Telegram bot token not configured');
    }

    console.log('Sending Telegram messages to', chatIds.length, 'recipients');

    const results = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to send Telegram to ${chatId}:`, errorText);
          throw new Error(`Telegram API error: ${errorText}`);
        }

        const result = await response.json();
        console.log(`Telegram sent successfully to ${chatId}:`, result.result.message_id);
        return result;
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Telegram sending complete: ${successful} successful, ${failed} failed`);

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
    console.error('Error in send-telegram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
