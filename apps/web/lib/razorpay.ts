import Razorpay from 'razorpay';
import crypto from 'crypto';

let _razorpayInstance: Razorpay | null = null;

/**
 * Returns a configured Razorpay instance (server-side only)
 */
export function getRazorpayClient(): Razorpay {
  if (_razorpayInstance) return _razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      '[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables.'
    );
  }

  _razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return _razorpayInstance;
}

/**
 * Verifies standard payment signature returned by Razorpay Checkout
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, secret) === signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('[Razorpay] Cannot verify signature: RAZORPAY_KEY_SECRET is not set');
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Verifies Razorpay Webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Razorpay] Webhook secret not configured.');
    return false;
  }

  try {
    return Razorpay.validateWebhookSignature(rawBody, signature, secret);
  } catch (err) {
    // Fallback HMAC comparison
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  }
}

/**
 * Generates an idempotent human-readable receipt number
 */
export function generateReceiptNumber(prefix: string = 'HU-REC'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
