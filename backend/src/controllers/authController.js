import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../config/nodemailer.js';
import { uploadImage } from '../config/cloudinary.js';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Determine default status: organizer requires admin approval
    const status = role === 'organizer' ? 'pending_approval' : 'approved';

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'attendee',
      status,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (must explicitly select password since select: false is on schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePictureUrl: user.profilePictureUrl || '',
        savedEvents: user.savedEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email address',
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || (req.get('origin') || 'http://localhost:5173');
    const frontendResetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) have requested the reset of a password.</p>
      <p>Please click on the link below to complete the password reset process:</p>
      <a href="${frontendResetUrl}" target="_blank">${frontendResetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    const emailSent = await sendEmail({
      to: user.email,
      subject: 'EventSphere Password Reset Token',
      html: message,
      text: `Please reset your password using the following link: ${frontendResetUrl}`,
    });

    if (!emailSent && process.env.USE_MOCK_SMTP !== 'true') {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email sent successfully with password reset link.',
      // For testing convenience when mock mailer logs it:
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Hash the token sent in the URL params
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Login/Signup
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google login requires email payload.',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists
      // Generate a random password since they login with Google
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: name || 'Google User',
        email,
        password: randomPassword,
        role: 'attendee',
        status: 'approved',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePictureUrl: user.profilePictureUrl || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details & picture
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.email) {
      if (req.body.email !== user.email) {
        const existing = await User.findOne({ email: req.body.email });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already in use by another account',
          });
        }
        user.email = req.body.email;
      }
    }

    if (req.file) {
      user.profilePictureUrl = await uploadImage(req.file);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePictureUrl: user.profilePictureUrl,
        savedEvents: user.savedEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};
