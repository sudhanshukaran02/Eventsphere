import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import Analytics from '../models/Analytics.js';
import { sendEmail } from '../config/nodemailer.js';
import { createNotification } from './notificationController.js';

// @desc    Get platform wide analytics for admin
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. User stats
    const totalUsers = await User.countDocuments();
    const totalAttendees = await User.countDocuments({ role: 'attendee' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    
    // 2. Event stats
    const totalEvents = await Event.countDocuments();
    
    // 3. Financial stats from Analytics
    const analytics = await Analytics.find();
    let totalRevenue = 0;
    let totalTicketsSold = 0;
    let totalViews = 0;

    analytics.forEach((stat) => {
      totalRevenue += stat.revenue;
      totalTicketsSold += stat.ticketsSold;
      totalViews += stat.views;
    });

    // 4. Get category breakdown
    const categoryStats = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // 5. Get recent bookings (last 5)
    const recentBookings = await Booking.find({ paymentStatus: 'paid' })
      .populate('userId', 'name email')
      .populate('eventId', 'title price')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        totalAttendees,
        totalOrganizers,
        totalEvents,
        totalRevenue,
        totalTicketsSold,
        totalViews,
      },
      categoryStats,
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status / suspend / change role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { role, status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user.id && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'An admin cannot suspend their own account.',
      });
    }

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organizers pending approval
// @route   GET /api/admin/organizers/pending
// @access  Private (Admin)
export const getPendingOrganizers = async (req, res, next) => {
  try {
    const pendingOrganizers = await User.find({
      role: 'organizer',
      status: 'pending_approval',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingOrganizers.length,
      organizers: pendingOrganizers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject an organizer
// @route   PUT /api/admin/organizers/:id/approve
// @access  Private (Admin)
export const approveOrganizer = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const organizer = await User.findById(req.params.id);

    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (action === 'approve') {
      organizer.status = 'approved';
      await organizer.save();

      // Send approval email
      const emailContent = `
        <h2>Organizer Account Approved!</h2>
        <p>Dear ${organizer.name},</p>
        <p>We are excited to inform you that your EventSphere Organizer account has been reviewed and <strong>approved</strong> by our administrator team.</p>
        <p>You can now log in, create events, customize your banners, and start tracking ticket sales.</p>
        <p>Click here to access your dashboard: <a href="http://localhost:5173/login">EventSphere Login</a></p>
      `;
      await sendEmail({
        to: organizer.email,
        subject: 'EventSphere Organizer Account Approved!',
        html: emailContent,
        text: `Your organizer account has been approved! Login at http://localhost:5173/login`,
      });

      await createNotification({
        userId: organizer._id,
        title: 'Account Approved',
        message: 'Your organizer account has been approved! You can now create and host events.',
        type: 'success',
      });

      return res.status(200).json({
        success: true,
        message: 'Organizer approved and notified.',
        organizer,
      });
    } else {
      organizer.status = 'suspended';
      await organizer.save();
      
      // Send rejection/suspension email
      const emailContent = `
        <h2>Organizer Registration Status Update</h2>
        <p>Dear ${organizer.name},</p>
        <p>Your request to register as an EventSphere Organizer has been declined or suspended at this time.</p>
        <p>If you believe this was an error, please contact our support team.</p>
      `;
      await sendEmail({
        to: organizer.email,
        subject: 'EventSphere Registration Status Update',
        html: emailContent,
        text: `Your organizer registration request was declined.`,
      });

      await createNotification({
        userId: organizer._id,
        title: 'Account Suspended/Rejected',
        message: 'Your organizer registration request was declined or suspended.',
        type: 'alert',
      });

      return res.status(200).json({
        success: true,
        message: 'Organizer registration rejected/suspended.',
        organizer,
      });
    }
  } catch (error) {
    next(error);
  }
};
