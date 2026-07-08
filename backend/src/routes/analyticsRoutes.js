import express from 'express';
import { getOrganizerAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/organizer', protect, authorize('organizer'), getOrganizerAnalytics);

export default router;
