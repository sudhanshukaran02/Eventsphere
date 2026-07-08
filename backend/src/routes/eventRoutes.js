import express from 'express';
import upload from '../config/multer.js';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  saveEvent,
  getSavedEvents,
  getEventReviews,
  addEventReview,
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { createEventSchema } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/saved', protect, authorize('attendee'), getSavedEvents); // Need specific route above /:id so it doesn't treat 'saved' as an id
router.get('/:id', getEvent);
router.get('/:id/reviews', getEventReviews);

// Protected routes (Attendees only)
router.post('/:id/save', protect, authorize('attendee'), saveEvent);
router.post('/:id/reviews', protect, authorize('attendee'), addEventReview);

// Organizer routes (or Admin)
router.post('/', protect, authorize('organizer', 'admin'), upload.single('banner'), createEventSchema, createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), upload.single('banner'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

export default router;
