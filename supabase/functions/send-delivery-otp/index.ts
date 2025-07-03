
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');

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

    const { purchaseRequestId } = await req.json();
    
    console.log('Processing OTP request for purchase request:', purchaseRequestId);
    
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otpCode);
    
    // Get purchase request details with buyer and seller info
    const { data: request, error: requestError } = await supabaseService
      .from('purchase_requests')
      .select(`
        *,
        books!inner(title, price_range),
        buyer:profiles!purchase_requests_buyer_id_fkey(email, full_name),
        seller:profiles!purchase_requests_seller_id_fkey(email, full_name)
      `)
      .eq('id', purchaseRequestId)
      .single();

    if (requestError || !request) {
      console.error('Purchase request error:', requestError);
      throw new Error('Purchase request not found');
    }

    console.log('Found purchase request:', {
      id: request.id,
      buyer: request.buyer?.email,
      seller: request.seller?.email,
      book: request.books?.title
    });

    // Check if delivery confirmation exists
    const { data: existingConfirmation, error: selectError } = await supabaseService
      .from('delivery_confirmations')
      .select('id, otp_sent_at')
      .eq('purchase_request_id', purchaseRequestId)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Select existing confirmation error:', selectError);
      throw selectError;
    }

    console.log('Existing confirmation:', existingConfirmation);

    if (existingConfirmation) {
      // Update existing record
      const { error: updateError } = await supabaseService
        .from('delivery_confirmations')
        .update({
          otp_code: otpCode,
          otp_sent_at: new Date().toISOString(),
          otp_verified_at: null
        })
        .eq('id', existingConfirmation.id);
      
      if (updateError) {
        console.error('Update confirmation error:', updateError);
        throw updateError;
      }
      
      console.log('Updated existing delivery confirmation');
    } else {
      // Create new delivery confirmation record
      const { error: insertError } = await supabaseService
        .from('delivery_confirmations')
        .insert({
          purchase_request_id: purchaseRequestId,
          buyer_id: request.buyer_id,
          seller_id: request.seller_id,
          otp_code: otpCode,
          otp_sent_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      console.log('Created new delivery confirmation');
    }

    // Send OTP via email using Resend
    let emailSent = false;
    if (request.buyer?.email) {
      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'BookEx <onboarding@resend.dev>',
          to: [request.buyer.email],
          subject: `Your Delivery OTP for "${request.books.title}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; text-align: center;">📚 BookEx Delivery Confirmation</h1>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h2 style="color: #2563eb; margin-top: 0;">Your Delivery OTP</h2>
                <p>Hello ${request.buyer.full_name || 'there'},</p>
                <p>Your one-time password (OTP) to confirm the delivery of "<strong>${request.books.title}</strong>" is:</p>
                <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #2563eb;">
                  <h1 style="font-size: 32px; letter-spacing: 8px; color: #2563eb; margin: 0; font-family: monospace;">${otpCode}</h1>
                </div>
                <p><strong>⏰ This code is valid for 10 minutes only.</strong></p>
                <p>Please provide this code to the seller to complete the delivery process.</p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  If you did not request this delivery confirmation, please ignore this email.
                </p>
              </div>
              <div style="text-align: center; color: #666; font-size: 12px;">
                <p>Thanks for using BookEx! 📖</p>
                <p>The BookEx Team</p>
              </div>
            </div>
          `
        });
        
        if (emailError) {
          console.error('Resend email error:', emailError);
        } else {
          console.log('OTP Email sent successfully:', emailData);
          emailSent = true;
        }
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
      }
    } else {
      console.warn('Buyer email not found for OTP, skipping email notification.');
    }

    // Create notification for buyer (always create this regardless of email)
    try {
      const { error: notificationError } = await supabaseService
        .from('notifications')
        .insert({
          user_id: request.buyer_id,
          type: 'delivery_otp',
          title: 'Delivery OTP Code',
          message: `Your delivery OTP for "${request.books.title}" is: ${otpCode}. Please confirm delivery to proceed with payment. Valid for 10 minutes.`,
          related_id: purchaseRequestId,
          priority: 'high'
        });

      if (notificationError) {
        console.error('Notification error:', notificationError);
      } else {
        console.log('Notification created successfully');
      }
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    console.log(`OTP ${otpCode} sent for purchase request ${purchaseRequestId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: emailSent ? 
        'OTP sent successfully to your email and notifications.' :
        'OTP sent to notifications. Please check your app notifications.',
      emailSent,
      otp: otpCode // Remove this in production for security
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
