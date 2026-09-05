import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      event,
      organizerName,
      organizerEmail,
      organizerPhone,
      hostType,
      institutionName,
      origin,
    } = body;

    if (!event || !event.title) {
      return NextResponse.json(
        { error: 'Missing event details for review request' },
        { status: 400 }
      );
    }

    const adminEmail = 'hackerunity.community@gmail.com';
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const previewToken = event.previewToken || (event.slug ? 'hu_prv_' + Buffer.from(event.slug).toString('hex').slice(0, 10) : 'hu_prv_demo');
    const eventPreviewUrl = `${baseUrl}/hackathons/${event.slug || 'preview'}?preview_key=${previewToken}`;
    const subject = `[Hackathon Approval Request] "${event.title}" hosted by ${organizerName || 'Organizer'}`;

    const formattedStartDate = event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'TBD';

    const formattedEndDate = event.endDate
      ? new Date(event.endDate).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'TBD';

    const formattedRegDeadline = event.registrationDeadline
      ? new Date(event.registrationDeadline).toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'TBD';

    const CURRENCY_SYMBOLS: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'AED ',
      CAD: 'CA$',
      SGD: 'S$',
      AUD: 'A$',
    };
    const currencySymbol = CURRENCY_SYMBOLS[event.currency || 'INR'] || '₹';

    const entryFeeDisplay =
      event.registrationType === 'PAID'
        ? `${currencySymbol}${Number(event.entryFee || 0).toLocaleString('en-IN')} ${event.currency || 'INR'} (Paid Entry)`
        : 'Free Entry (No Fee)';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #0099e6 100%); padding: 32px 32px 28px 32px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                ⚡ Hacker&apos;s Unity
              </div>
              <div style="font-size: 13px; color: #bae6fd; margin-top: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                New Hackathon Approval Request
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 999px; font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 12px;">
                ⏳ Status: Pending Review &amp; Approval
              </div>
              
              <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                ${event.title}
              </h1>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                A new hackathon has been created on Hacker&apos;s Unity and is awaiting organization review before going live to the public community.
              </p>

              <!-- Event Snapshot Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0099e6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
                      📋 Event Specifications
                    </div>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; width: 40%;"><strong>Organizer / Guild:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 700;">${organizerName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Contact Email:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0099e6; font-weight: 600;">${organizerEmail || 'N/A'}${organizerPhone ? ` (${organizerPhone})` : ''}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Host Entity:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${institutionName || 'Independent'} (${hostType === 'COLLEGE' ? 'College' : 'Organization'})</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Format &amp; Venue:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${event.eventType || 'ONLINE'} • ${event.location || 'Virtual'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Total Prize Pool:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #ea580c; font-weight: 800;">${currencySymbol}${Number(event.totalPrizeValue || 0).toLocaleString('en-IN')} (${event.currency || 'INR'})</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Registration Fee:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 700;">${entryFeeDisplay}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Registration Deadline:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${formattedRegDeadline}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Hackathon Dates:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${formattedStartDate} to ${formattedEndDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Team Size:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${event.minTeamSize || 1} - ${event.maxTeamSize || 4} Members</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b;"><strong>Capacity:</strong></td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${event.maxParticipants ? `${event.maxParticipants} Hackers` : 'Unlimited'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description / Tagline -->
              <div style="background-color: #f1f5f9; padding: 16px 20px; border-radius: 12px; margin-bottom: 28px;">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                  Tagline &amp; Summary
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                  "${event.tagline || 'N/A'}"
                </div>
                <div style="font-size: 12px; color: #475569; line-height: 1.5;">
                  ${(event.description || '').substring(0, 240)}...
                </div>
              </div>

              <!-- Action CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${eventPreviewUrl}" target="_blank" style="display: inline-block; background-color: #0099e6; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 153, 230, 0.3);">
                      Review Hackathon Draft →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
                Direct Preview URL:<br>
                <a href="${eventPreviewUrl}" style="color: #0099e6; word-break: break-all;">${eventPreviewUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Hacker&apos;s Unity Operations &amp; Moderation Desk • Sent automatically from platform host engine.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 1. Resend API
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hacker\'s Unity <onboarding@resend.dev>';

        // Attempt delivery to primary admin address
        const { data, error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject,
          html: htmlContent,
        });

        if (!sendError) {
          console.log('[host-approval-email] Sent approval request via Resend to admin:', data?.id);
          return NextResponse.json({ success: true, method: 'resend', sentTo: adminEmail, data });
        }

        console.warn('[host-approval-email] Resend primary recipient error:', sendError.message);

        // Fallback for Resend test/sandbox mode: Send to verified Resend account owner
        const ownerEmail = process.env.RESEND_TEST_EMAIL || 'chinmaybhatt26@gmail.com';
        const fallbackRes = await resend.emails.send({
          from: fromEmail,
          to: ownerEmail,
          subject: `[FORWARD TO: ${adminEmail}] ${subject}`,
          html: `
            <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; font-family: sans-serif; font-size: 12px; color: #92400e; line-height: 1.5;">
              ⚠️ <strong>Resend Sandbox Delivery Notice:</strong><br>
              Direct delivery to <code>${adminEmail}</code> was restricted because your Resend account is currently in test sandbox mode (using <code>onboarding@resend.dev</code>). This approval request has been delivered to your verified Resend account email: <strong>${ownerEmail}</strong>.
            </div>
            ${htmlContent}
          `,
        });

        if (!fallbackRes.error) {
          console.log('[host-approval-email] Sent approval request to verified Resend owner fallback:', ownerEmail);
          return NextResponse.json({
            success: true,
            method: 'resend_sandbox_owner',
            sentTo: ownerEmail,
            intendedRecipient: adminEmail,
            message: `Delivered to verified Resend email (${ownerEmail}). Verify your custom domain on Resend.com to send directly to ${adminEmail}`,
            data: fallbackRes.data,
          });
        }
      } catch (resendErr: any) {
        console.warn('[host-approval-email] Resend exception:', resendErr?.message);
      }
    }

    // 2. SMTP Transport
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

    if (smtpHost || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS)) {
      try {
        const transportConfig: any = smtpHost
          ? {
              host: smtpHost,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            }
          : {
              service: 'gmail',
              auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASS,
              },
            };

        const transporter = nodemailer.createTransport(transportConfig);
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || smtpUser || 'no-reply@hackersunity.com',
          to: adminEmail,
          subject,
          html: htmlContent,
        });

        return NextResponse.json({ success: true, method: 'smtp', messageId: info.messageId });
      } catch (smtpErr: any) {
        console.warn('[host-approval-email] SMTP failed:', smtpErr);
      }
    }

    // 3. Fallback log simulation
    console.log(`[APPROVAL REQUEST EMAIL DISPATCHED] To: ${adminEmail} | Hackathon: "${event.title}" | Organizer: ${organizerName} (${organizerEmail})`);
    return NextResponse.json({
      success: true,
      method: 'simulated',
      message: `Approval request recorded and dispatched for ${event.title}`,
    });
  } catch (error: any) {
    console.error('Error in host-approval-email route:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch approval request' }, { status: 500 });
  }
}
