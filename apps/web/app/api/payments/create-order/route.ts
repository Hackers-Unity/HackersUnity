import { NextResponse } from 'next/server';
import { authenticateRequest, createAdminClient, unauthorizedResponse } from '@/lib/api-auth';
import { getRazorpayClient, generateReceiptNumber } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to initialize payment.');
    }

    const body = await req.json();
    const { eventId, teamId, registrationId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing required field: eventId' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // 1. Resolve event details
    let resolvedEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    let eventData: any = null;

    if (isUuid) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, title, slug, entry_fee, currency, registration_type, is_team_event')
        .eq('id', eventId)
        .maybeSingle();
      eventData = data;
    } else {
      const { data } = await serverSupabase
        .from('events')
        .select('id, title, slug, entry_fee, currency, registration_type, is_team_event')
        .eq('slug', eventId)
        .maybeSingle();
      eventData = data;
      if (data?.id) resolvedEventId = data.id;
    }

    if (!eventData) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    // 2. Validate fee (₹59 is mapped to ₹1 as requested)
    let feeAmount = Number(eventData.entry_fee || 0);
    if (feeAmount === 59 || !feeAmount) {
      feeAmount = 1;
    }
    if (eventData.registration_type === 'FREE' || feeAmount <= 0) {
      return NextResponse.json({
        isFree: true,
        message: 'This event is free of charge. No payment is required.',
      });
    }

    // 3. Double-payment guard: check if already paid
    let existingPaidPaymentQuery = serverSupabase
      .from('payments')
      .select('*')
      .eq('event_id', resolvedEventId)
      .eq('status', 'PAID');

    if (teamId) {
      existingPaidPaymentQuery = existingPaidPaymentQuery.eq('team_id', teamId);
    } else {
      existingPaidPaymentQuery = existingPaidPaymentQuery.eq('user_id', auth.userId);
    }

    const { data: existingPaid } = await existingPaidPaymentQuery.maybeSingle();
    if (existingPaid) {
      return NextResponse.json({
        alreadyPaid: true,
        payment: existingPaid,
        message: 'This team has already completed payment for this event.',
      });
    }

    // 4. Fetch team or participant metadata
    let teamName = 'Solo Builder';
    let teamType: 'Solo' | 'Squad' = 'Solo';
    let teamSize = 1;
    let leaderName = auth.user.user_metadata?.name || 'Squad Lead';
    let leaderEmail = (auth.email || '').toLowerCase().trim();
    let leaderPhone = auth.user.user_metadata?.phone || null;

    if (teamId) {
      const { data: teamData } = await serverSupabase
        .from('teams')
        .select('*, profiles:leader_id(name, email, phone), team_members(id)')
        .eq('id', teamId)
        .maybeSingle();

      if (teamData) {
        teamName = teamData.name || 'Squad';
        teamType = 'Squad';
        teamSize = Array.isArray(teamData.team_members) ? teamData.team_members.length : 1;
        if (teamData.profiles?.name) leaderName = teamData.profiles.name;
        if (teamData.profiles?.email) leaderEmail = teamData.profiles.email;
        if (teamData.profiles?.phone) leaderPhone = teamData.profiles.phone;
      }
    }

    // Also check registration record for phone/name if available
    const { data: regData } = await serverSupabase
      .from('registrations')
      .select('id, user_name, user_email, phone, team_name')
      .eq('event_id', resolvedEventId)
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (regData) {
      if (regData.user_name) leaderName = regData.user_name;
      if (regData.user_email) leaderEmail = regData.user_email;
      if (regData.phone) leaderPhone = regData.phone;
      if (!teamId && regData.team_name) teamName = regData.team_name;
    }

    // 5. Convert to paise (e.g. ₹59 = 5900 paise)
    const amountInPaise = Math.round(feeAmount * 100);
    const receiptNumber = generateReceiptNumber();

    // 6. Create Razorpay order
    const razorpay = getRazorpayClient();
    const orderOptions = {
      amount: amountInPaise,
      currency: eventData.currency || 'INR',
      receipt: receiptNumber,
      notes: {
        eventId: resolvedEventId,
        eventTitle: eventData.title,
        teamId: teamId || 'solo',
        teamName,
        leaderName,
        leaderEmail,
        userId: auth.userId,
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // 7. Insert initial payment record into Supabase with status 'CREATED'
    const paymentPayload = {
      event_id: resolvedEventId,
      team_id: teamId || null,
      registration_id: regData?.id || registrationId || null,
      user_id: auth.userId,
      event_name: eventData.title,
      team_name: teamName,
      team_type: teamType,
      team_size: teamSize,
      team_leader_name: leaderName,
      team_leader_email: leaderEmail,
      team_leader_phone: leaderPhone,
      amount: feeAmount,
      amount_in_paise: amountInPaise,
      currency: eventData.currency || 'INR',
      razorpay_order_id: razorpayOrder.id,
      receipt_number: receiptNumber,
      status: 'CREATED',
      notes: orderOptions.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedPayment, error: insertErr } = await serverSupabase
      .from('payments')
      .insert(paymentPayload)
      .select('*')
      .single();

    if (insertErr) {
      console.error('[Create Order] Error recording initial payment in DB:', insertErr.message);
      // We still return the order so checkout can proceed, webhook will reconcile
    }

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      receiptNumber,
      paymentId: insertedPayment?.id || null,
      prefill: {
        name: leaderName,
        email: leaderEmail,
        contact: leaderPhone || undefined,
      },
      notes: orderOptions.notes,
    });
  } catch (err: any) {
    console.error('[Create Order API] Unhandled exception:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize Razorpay order.' },
      { status: 500 }
    );
  }
}
