import express from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  googleLogin,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerSchema, loginSchema } from '../middleware/validationMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/register', registerSchema, register);
router.post('/login', loginSchema, login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);

export default router;
