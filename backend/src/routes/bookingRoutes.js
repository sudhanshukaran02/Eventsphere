import express from 'express';
import {
  createBooking,
  verifyPayment,
  getMyBookings,
  getEventBookings,
  checkInTicket,
  requestRefund,
  processRefund,
  validateCouponCode,
  createCoupon,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { createBookingSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Attendee routes
router.post('/', authorize('attendee'), createBookingSchema, createBooking);
router.post('/verify', authorize('attendee'), verifyPayment);
router.get('/my-bookings', authorize('attendee'), getMyBookings);
router.post('/:id/refund', authorize('attendee'), requestRefund);
router.post('/validate-coupon', authorize('attendee'), validateCouponCode);

// Organizer & Admin routes
router.get('/event/:eventId', authorize('organizer', 'admin'), getEventBookings);
router.post('/:id/check-in', authorize('organizer', 'admin'), checkInTicket);
router.post('/:id/process-refund', authorize('organizer', 'admin'), processRefund);
router.post('/coupons', authorize('organizer', 'admin'), createCoupon);

export default router;
