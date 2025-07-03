
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { purchaseRequestId, otpCode } = await req.json();
    
    console.log('Verifying OTP for purchase request:', purchaseRequestId, 'with code:', otpCode);
    
    // Get delivery confirmation with OTP
    const { data: confirmation, error: confirmationError } = await supabaseService
      .from('delivery_confirmations')
      .select('*')
      .eq('purchase_request_id', purchaseRequestId)
      .eq('otp_code', otpCode)
      .is('otp_verified_at', null)
      .single();

    if (confirmationError || !confirmation) {
      console.error('OTP verification failed:', confirmationError);
      throw new Error('Invalid or expired OTP code');
    }

    console.log('Found matching OTP confirmation:', confirmation.id);

    // Check if OTP is not older than 10 minutes
    const otpAge = Date.now() - new Date(confirmation.otp_sent_at).getTime();
    const tenMinutes = 10 * 60 * 1000;
    
    if (otpAge > tenMinutes) {
      console.error('OTP expired. Age:', otpAge, 'ms');
      throw new Error('OTP has expired. Please request a new one.');
    }

    console.log('OTP is valid and not expired');

    // Mark OTP as verified and set delivery confirmations
    const { error: updateError } = await supabaseService
      .from('delivery_confirmations')
      .update({ 
        otp_verified_at: new Date().toISOString(),
        buyer_confirmed_delivery: true,
        seller_confirmed_delivery: true
      })
      .eq('id', confirmation.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('OTP verified and delivery confirmed');

    // Get purchase request details for notifications
    const { data: request, error: requestError } = await supabaseService
      .from('purchase_requests')
      .select(`
        buyer_id, 
        seller_id, 
        books!inner(title)
      `)
      .eq('id', purchaseRequestId)
      .single();

    if (request && !requestError) {
      // Create notifications for both users
      const notifications = [
        {
          user_id: request.buyer_id,
          type: 'delivery_confirmed',
          title: 'Delivery Confirmed ✅',
          message: `Delivery confirmed for "${request.books.title}". You can now proceed with payment.`,
          related_id: purchaseRequestId,
          priority: 'high'
        },
        {
          user_id: request.seller_id,
          type: 'delivery_confirmed',
          title: 'Buyer Confirmed Delivery ✅',
          message: `Buyer has confirmed delivery for "${request.books.title}". Awaiting payment confirmation.`,
          related_id: purchaseRequestId,
          priority: 'high'
        }
      ];

      const { error: notificationError } = await supabaseService
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Notification error:', notificationError);
      } else {
        console.log('Notifications created successfully');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OTP verified successfully. Delivery has been confirmed.' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
