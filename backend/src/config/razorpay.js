import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const isRazorpayConfigured = 
  process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET && 
  process.env.USE_MOCK_PAYMENTS !== 'true';

let razorpayInstance = null;

if (isRazorpayConfigured) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay payment gateway initialized successfully.');
} else {
  console.log('Razorpay credentials missing or USE_MOCK_PAYMENTS is true. Initializing payment mock system.');
  
  // Create a mock interface conforming to the SDK shape
  razorpayInstance = {
    orders: {
      create: async ({ amount, currency, receipt }) => {
        const orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
        return {
          id: orderId,
          entity: 'order',
          amount,
          amount_paid: 0,
          amount_due: amount,
          currency,
          receipt,
          status: 'created',
          attempts: 0,
          notes: [],
          created_at: Math.floor(Date.now() / 1000),
        };
      }
    }
  };
}

/**
 * Verifies a Razorpay payment signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!isRazorpayConfigured) {
    // For mock mode, any signature starting with 'sig_mock_' is valid, or we check if it follows a simple mock rule
    return signature.startsWith('sig_mock_') || signature === `mock_sig_for_${orderId}`;
  }

  try {
    const text = orderId + '|' + paymentId;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    return generated_signature === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

export default razorpayInstance;
