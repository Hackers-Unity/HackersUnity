import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';
import { getRazorpayClient } from '@/lib/razorpay';
import { syncPaymentToGoogleSheets } from '@/lib/google-sheets-sync';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const eventId = searchParams.get('eventId');
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');

    if (!orderId && !eventId && !teamId && !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // 1. If teamId is specified, check team status and leader payment first
    if (teamId) {
      const { data: teamData } = await serverSupabase
        .from('teams')
        .select('id, leader_id, payment_status, payment_id')
        .eq('id', teamId)
        .maybeSingle();

      if (teamData && teamData.payment_status === 'PAID') {
        let p = null;
        if (teamData.payment_id) {
          const { data: payRow } = await serverSupabase
            .from('payments')
            .select('*')
            .eq('id', teamData.payment_id)
            .maybeSingle();
          p = payRow;
        }
        return NextResponse.json({
          isPaid: true,
          payment: p || {
            id: teamData.payment_id || `pay_${teamId}`,
            status: 'PAID',
            team_id: teamId,
            event_id: eventId,
          },
        });
      }

      // Check if squad leader completed payment for this event
      if (teamData?.leader_id && eventId) {
        const { data: leaderPay } = await serverSupabase
          .from('payments')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', teamData.leader_id)
          .eq('status', 'PAID')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (leaderPay) {
          // Link this team to the leader's payment
          await serverSupabase
            .from('teams')
            .update({ payment_status: 'PAID', payment_id: leaderPay.id })
            .eq('id', teamId);
          await serverSupabase
            .from('payments')
            .update({ team_id: teamId })
            .eq('id', leaderPay.id);
          await serverSupabase
            .from('registrations')
            .update({ payment_status: 'PAID', payment_id: leaderPay.id })
            .eq('team_id', teamId);

          return NextResponse.json({ isPaid: true, payment: leaderPay });
        }
      }
    }

    // 2. If userId is specified, check if user is in a squad whose leader paid
    if (userId && eventId) {
      // Direct user payment
      const { data: userDirectPay } = await serverSupabase
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userDirectPay) {
        return NextResponse.json({ isPaid: true, payment: userDirectPay });
      }

      // Check user team membership
      const { data: memberships } = await serverSupabase
        .from('team_members')
        .select('team_id, teams(id, leader_id, payment_status, payment_id, event_id)')
        .eq('user_id', userId);

      if (memberships && memberships.length > 0) {
        for (const m of memberships) {
          const t: any = Array.isArray(m.teams) ? m.teams[0] : m.teams;
          if (t && (t.event_id === eventId || !eventId)) {
            if (t.payment_status === 'PAID') {
              return NextResponse.json({
                isPaid: true,
                payment: {
                  id: t.payment_id,
                  status: 'PAID',
                  team_id: t.id,
                  event_id: eventId,
                },
              });
            }
            if (t.leader_id) {
              const { data: leaderPay } = await serverSupabase
                .from('payments')
                .select('*')
                .eq('event_id', eventId)
                .eq('user_id', t.leader_id)
                .eq('status', 'PAID')
                .maybeSingle();

              if (leaderPay) {
                await serverSupabase
                  .from('teams')
                  .update({ payment_status: 'PAID', payment_id: leaderPay.id })
                  .eq('id', t.id);
                return NextResponse.json({ isPaid: true, payment: leaderPay });
              }
            }
          }
        }
      }
    }

    // 3. Check Supabase for existing payment by orderId or teamId
    let query = serverSupabase.from('payments').select('*');
    if (orderId) {
      query = query.eq('razorpay_order_id', orderId);
    } else if (teamId && eventId) {
      query = query.eq('event_id', eventId).eq('team_id', teamId);
    } else if (teamId) {
      query = query.eq('team_id', teamId);
    } else if (userId && eventId) {
      query = query.eq('event_id', eventId).eq('user_id', userId);
    }

    const { data: payments } = await query;
    const payment = payments && payments.length > 0 ? payments[0] : null;

    if (payment && payment.status === 'PAID') {
      return NextResponse.json({ isPaid: true, payment });
    }

    // 2. If not marked PAID yet, but we have orderId, check Razorpay directly
    const targetOrderId = orderId || payment?.razorpay_order_id;
    if (targetOrderId) {
      try {
        const razorpay = getRazorpayClient();
        const paymentsList: any = await razorpay.orders.fetchPayments(targetOrderId);
        
        // Find any captured / successful payment
        const successfulPayment = paymentsList?.items?.find(
          (p: any) => p.status === 'captured'
        );

        if (successfulPayment) {
          const acquirer = successfulPayment.acquirer_data || {};
          const utrNumber =
            acquirer.rrn ||
            acquirer.upi_transaction_id ||
            acquirer.bank_transaction_id ||
            acquirer.auth_code ||
            successfulPayment.id;
          const nowIso = new Date().toISOString();

          let updatedPayment = payment;

          if (payment) {
            const { data } = await serverSupabase
              .from('payments')
              .update({
                razorpay_payment_id: successfulPayment.id,
                payment_method: successfulPayment.method || 'upi',
                utr_number: utrNumber,
                status: 'PAID',
                transaction_date: nowIso,
                raw_response: successfulPayment,
                updated_at: nowIso,
              })
              .eq('id', payment.id)
              .select('*')
              .single();
            updatedPayment = data || payment;
          }

          // Update team and registrations
          const resolvedTeamId = updatedPayment?.team_id || teamId;
          const resolvedEventId = updatedPayment?.event_id || eventId;
          const resolvedPaymentId = updatedPayment?.id;

          if (resolvedTeamId) {
            await serverSupabase
              .from('teams')
              .update({ payment_status: 'PAID', payment_id: resolvedPaymentId })
              .eq('id', resolvedTeamId);

            await serverSupabase
              .from('registrations')
              .update({ payment_status: 'PAID', payment_id: resolvedPaymentId })
              .eq('team_id', resolvedTeamId);
          }

          if (resolvedEventId && updatedPayment?.user_id) {
            await serverSupabase
              .from('registrations')
              .update({ payment_status: 'PAID', payment_id: resolvedPaymentId })
              .eq('event_id', resolvedEventId)
              .eq('user_id', updatedPayment.user_id);
          }

          // Sync with Google Sheets
          if (updatedPayment) {
            try {
              await syncPaymentToGoogleSheets(updatedPayment);
            } catch (sheetErr) {
              console.warn('[Payment Status Poller] Sheet sync warning:', sheetErr);
            }
          }

          return NextResponse.json({ isPaid: true, payment: updatedPayment });
        }
      } catch (rzpErr: any) {
        // Continue silently if Razorpay order lookup fails
        console.warn('[Payment Status Poller] Razorpay lookup warning:', rzpErr.message);
      }
    }

    return NextResponse.json({ isPaid: false, payment });
  } catch (err: any) {
    console.error('[Payment Status Poller] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
