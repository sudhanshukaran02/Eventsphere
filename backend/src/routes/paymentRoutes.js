import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', protect, (req, res) => {
  res.status(200).json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKey12345',
    useMock: process.env.USE_MOCK_PAYMENTS === 'true' || !process.env.RAZORPAY_KEY_ID,
  });
});

export default router;
