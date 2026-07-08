import express from 'express';
import {
  getAdminAnalytics,
  getAllUsers,
  updateUserStatus,
  getPendingOrganizers,
  approveOrganizer,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Enforce admin privileges globally on this router
router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserStatus);
router.get('/organizers/pending', getPendingOrganizers);
router.put('/organizers/:id/approve', approveOrganizer);

export default router;
