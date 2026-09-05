import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      toEmail,
      teamName,
      hackathonTitle,
      hackathonSlug,
      invitedByName,
      inviteToken,
      origin,
    } = body;

    if (!toEmail || !teamName || !inviteToken) {
      return NextResponse.json(
        { error: 'Missing required fields (toEmail, teamName, inviteToken)' },
        { status: 400 }
      );
    }

    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/hackathons/${hackathonSlug || 'event'}/invite?token=${inviteToken}`;
    const inviter = invitedByName || 'A teammate';
    const hackathon = hackathonTitle || 'the hackathon';

    const subject = `You're invited to join squad "${teamName}" for ${hackathon}!`;

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
        <table width="100%" max-width="560" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0099e6 0%, #0284c7 100%); padding: 32px 32px 28px 32px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                ⚡ Hacker&apos;s Unity
              </div>
              <div style="font-size: 13px; color: #e0f2fe; margin-top: 6px; font-weight: 500;">
                The Ultimate Hackathon Platform
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 11px; font-weight: 800; color: #0099e6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Squad Invitation
              </div>
              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                Join <span style="color: #0099e6;">${teamName}</span> for ${hackathon}
              </h1>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                Hey there! <strong>${inviter}</strong> has invited you to team up and build something amazing together in squad <strong>"${teamName}"</strong>.
              </p>

              <!-- Squad Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                      Hackathon Details
                    </div>
                    <div style="font-size: 15px; font-weight: 800; color: #0f172a;">
                      ${hackathon}
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                      Squad: <strong style="color: #0284c7;">${teamName}</strong> • Invited by: <strong>${inviter}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Accept & Join Squad →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
                Button not working? Copy and open this URL in your browser:<br>
                <a href="${inviteUrl}" style="color: #0099e6; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Sent via Hacker&apos;s Unity Platform. If you were not expecting this invite, you can safely ignore this email.
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

    // 1. Try Resend if RESEND_API_KEY exists
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hacker\'s Unity <onboarding@resend.dev>';

        const { data, error: sendError } = await resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject,
          html: htmlContent,
        });

        if (sendError) {
          console.warn('[invite-email] Resend returned error (sandbox domain restriction):', sendError.message);
          return NextResponse.json({
            success: true,
            method: 'sandbox_fallback',
            warning: 'Invite link created! On Resend test domain, emails only deliver to account owner. Share the direct invite link via WhatsApp or Copy Link below.',
            inviteUrl,
          });
        } else {
          console.log('[invite-email] Successfully sent invite via Resend to:', toEmail, 'ID:', data?.id);
          return NextResponse.json({
            success: true,
            method: 'resend',
            data,
            inviteUrl,
          });
        }
      } catch (resendErr: any) {
        console.warn('[invite-email] Resend send exception:', resendErr?.message);
        return NextResponse.json({
          success: true,
          method: 'sandbox_fallback',
          warning: 'Invite link created! Share via WhatsApp or Copy Link below.',
          inviteUrl,
        });
      }
    }

    // 2. Try SMTP if configured (e.g. Gmail / Brevo / AWS SES)
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
          to: toEmail,
          subject,
          html: htmlContent,
        });

        return NextResponse.json({
          success: true,
          method: 'smtp',
          messageId: info.messageId,
          inviteUrl,
        });
      } catch (smtpErr: any) {
        console.warn('SMTP send failed:', smtpErr);
      }
    }

    // 3. If no email service configured, return success with simulated link info
    console.log(`[EMAIL INVITE SIMULATION] To: ${toEmail} | Team: ${teamName} | Link: ${inviteUrl}`);
    return NextResponse.json({
      success: true,
      method: 'simulated',
      message: 'Invite link generated. To send live inbox emails, set RESEND_API_KEY or SMTP credentials in .env.local',
      inviteUrl,
    });
  } catch (error: any) {
    console.error('Error in invite-email route:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invite email' }, { status: 500 });
  }
}
