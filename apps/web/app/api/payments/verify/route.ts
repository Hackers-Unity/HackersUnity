import { NextResponse } from 'next/server';
import { authenticateRequest, createAdminClient, unauthorizedResponse } from '@/lib/api-auth';
import { getRazorpayClient, verifyRazorpaySignature } from '@/lib/razorpay';
import { sendNotificationToUser } from '@/lib/notification-service';
import { NotificationDbType } from '@hackers-unity/shared-types';
import { syncPaymentToGoogleSheets } from '@/lib/google-sheets-sync';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to verify payment.');
    }

    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, eventId, teamId } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay verification credentials.' },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      console.error('[Verify Payment] Tampered or invalid Razorpay signature:', {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      });
      return NextResponse.json(
        { error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    const serverSupabase = createAdminClient();
    const razorpay = getRazorpayClient();

    // 2. Fetch authoritative payment status and acquirer data from Razorpay API
    let paymentDetails: any = null;
    let paymentMethod = 'upi';
    let utrNumber: string | null = null;

    try {
      paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
      paymentMethod = paymentDetails.method || 'upi';

      // Extract UTR / RRN (Bank Reference Number)
      const acquirer = paymentDetails.acquirer_data || {};
      utrNumber =
        acquirer.rrn ||
        acquirer.upi_transaction_id ||
        acquirer.bank_transaction_id ||
        acquirer.auth_code ||
        null;
    } catch (fetchErr: any) {
      console.warn('[Verify Payment] Could not fetch payment from Razorpay API:', fetchErr.message);
    }

    // Fallback UTR to payment ID if no specific bank reference was returned
    if (!utrNumber) {
      utrNumber = paymentDetails?.method === 'card' ? `AUTH-${razorpayPaymentId}` : razorpayPaymentId;
    }

    // 3. Locate and update payment record in Supabase
    const { data: existingPayment } = await serverSupabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    let updatedPayment: any = null;

    if (existingPayment) {
      const { data, error: updateErr } = await serverSupabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          payment_method: paymentMethod,
          utr_number: utrNumber,
          status: 'PAID',
          transaction_date: nowIso,
          raw_response: paymentDetails || {},
          updated_at: nowIso,
        })
        .eq('id', existingPayment.id)
        .select('*')
        .single();

      if (updateErr) {
        console.error('[Verify Payment] Failed to update payments table:', updateErr.message);
      }
      updatedPayment = data || existingPayment;
    } else {
      // If order row wasn't found, insert a complete paid record
      const { data, error: insertErr } = await serverSupabase
        .from('payments')
        .insert({
          event_id: eventId,
          team_id: teamId || null,
          user_id: auth.userId,
          event_name: 'Hackathon Arena',
          team_name: 'Squad',
          team_leader_name: auth.user.user_metadata?.name || 'Hacker',
          team_leader_email: auth.email || '',
          amount: (paymentDetails?.amount ? paymentDetails.amount / 100 : 800),
          amount_in_paise: paymentDetails?.amount || 80000,
          currency: paymentDetails?.currency || 'INR',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          payment_method: paymentMethod,
          utr_number: utrNumber,
          receipt_number: `HU-REC-${Date.now()}`,
          status: 'PAID',
          transaction_date: nowIso,
          raw_response: paymentDetails || {},
        })
        .select('*')
        .single();

      if (insertErr) {
        console.error('[Verify Payment] Failed to insert missing payment record:', insertErr.message);
      }
      updatedPayment = data;
    }

    // 4. Update team status to PAID if team exists
    const targetTeamId = teamId || updatedPayment?.team_id;
    if (targetTeamId) {
      await serverSupabase
        .from('teams')
        .update({
          payment_status: 'PAID',
          payment_id: updatedPayment?.id || null,
        })
        .eq('id', targetTeamId);

      // Update registrations belonging to this team
      await serverSupabase
        .from('registrations')
        .update({
          payment_status: 'PAID',
          payment_id: updatedPayment?.id || null,
        })
        .eq('team_id', targetTeamId);
    }

    // Also update individual registration for this user
    await serverSupabase
      .from('registrations')
      .update({
        payment_status: 'PAID',
        payment_id: updatedPayment?.id || null,
      })
      .eq('event_id', eventId)
      .eq('user_id', auth.userId);

    // 5. Send Realtime Notification to user
    try {
      await sendNotificationToUser(
        auth.userId,
        '💳 Payment Confirmed!',
        `Your payment of ₹${updatedPayment?.amount || 1} for ${updatedPayment?.event_name || 'the hackathon'} was successful! (Ref: ${utrNumber})`,
        NotificationDbType.REGISTRATION,
        {
          icon: '💳',
          eventId,
          actionUrl: `/dashboard`,
        }
      );
    } catch (notifErr) {
      console.warn('[Verify Payment] Notification warning:', notifErr);
    }

    // 6. Realtime Broadcast to update counters & live dashboards
    try {
      const channel = serverSupabase.channel('public:events_realtime');
      await channel.send({
        type: 'broadcast',
        event: 'payment_confirmed',
        payload: {
          eventId,
          teamId: targetTeamId,
          userId: auth.userId,
          amount: updatedPayment?.amount,
        },
      });
    } catch (bcErr) {
      console.warn('[Verify Payment] Realtime broadcast warning:', bcErr);
    }

    // 7. Sync transaction row to Google Sheet
    try {
      if (updatedPayment) {
        await syncPaymentToGoogleSheets(updatedPayment);
      }
    } catch (sheetErr) {
      console.warn('[Verify Payment] Google Sheet sync warning:', sheetErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and confirmed successfully.',
      payment: updatedPayment,
    });
  } catch (err: any) {
    console.error('[Verify Payment API] Unhandled exception:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
