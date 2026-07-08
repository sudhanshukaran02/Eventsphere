import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import razorpayInstance, { verifyPaymentSignature } from '../config/razorpay.js';
import { generateTicketQR } from '../utils/qrGenerator.js';
import { sendEmail } from '../config/nodemailer.js';
import { createNotification } from './notificationController.js';

// @desc    Initiate booking (Create Razorpay Order / Free Event Instant Ticket)
// @route   POST /api/bookings
// @access  Private (Attendee)
export const createBooking = async (req, res, next) => {
  try {
    const { eventId, ticketQuantity, couponCode } = req.body;
    const qty = Number(ticketQuantity || 1);

    // 1. Fetch Event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // 2. Check ticket availability
    if (event.availableTickets < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableTickets} tickets remaining for this event.`,
      });
    }

    const subtotal = event.price * qty;
    let totalPrice = subtotal;
    let discount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        // Run validations
        const isNotExpired = new Date(coupon.expirationDate) >= new Date();
        const underLimit = coupon.maxUses === null || coupon.uses < coupon.maxUses;
        const validEvent = !coupon.eventId || coupon.eventId.toString() === eventId;

        if (isNotExpired && underLimit && validEvent) {
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
          } else {
            discount = coupon.discountValue;
          }
          discount = Math.min(discount, subtotal);
          totalPrice = subtotal - discount;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Coupon code is invalid, expired, or has reached its usage limit.',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Coupon code not found or has been deactivated.',
        });
      }
    }

    // 3. Handle Free Event (Bypass Payment Gateway)
    if (totalPrice === 0) {
      // Create a mock order ID
      const paymentId = `free_booking_${Date.now()}_${Math.random().toString(36).substring(5)}`;
      
      const booking = await Booking.create({
        eventId,
        userId: req.user.id,
        ticketQuantity: qty,
        totalPrice,
        paymentStatus: 'paid',
        paymentId,
        couponApplied: coupon ? coupon.code : '',
        discountAmount: discount,
      });

      if (coupon) {
        coupon.uses += 1;
        await coupon.save();
      }

      // Update event ticket availability
      event.availableTickets -= qty;
      await event.save();

      // Update Analytics
      await Analytics.findOneAndUpdate(
        { eventId },
        { 
          $inc: { 
            ticketsSold: qty,
            revenue: 0
          } 
        },
        { upsert: true }
      );

      // Generate QR Code
      const qrCode = await generateTicketQR({
        bookingId: booking._id,
        attendeeName: req.user.name,
        eventName: event.title,
        ticketQuantity: qty,
        bookingDate: booking.bookingDate,
      });

      booking.qrCodeUrl = qrCode;
      await booking.save();

      // Send Email Notification
      const emailContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
            <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800;">EventSphere</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 13px;">Your gateway to local experiences</p>
          </div>
          
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Ticket Registration Confirmed!</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #334155;">Dear <strong>${req.user.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #334155;">You have successfully reserved your spot for the following experience. Below are your booking details:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 100px;">Event:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${event.title}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date & Time:</td>
                <td style="padding: 6px 0; color: #334155;">${new Date(event.startDate).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Location:</td>
                <td style="padding: 6px 0; color: #334155;">${event.location}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Quantity:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${qty} Ticket(s)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Total Cost:</td>
                <td style="padding: 6px 0; color: #10b981; font-weight: 700;">FREE ENTRY</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">
            Show the QR pass available in your Attendee Console dashboard at the entrance for scanning.
          </p>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8;">
            <p>Thank you for choosing EventSphere! enjoy the gathering.</p>
          </div>
        </div>
      `;
      await sendEmail({
        to: req.user.email,
        subject: `Ticket Confirmed - ${event.title}`,
        html: emailContent,
        text: `Your ticket for "${event.title}" is confirmed. Tickets: ${qty}. Location: ${event.location}`,
      });

      await createNotification({
        userId: req.user.id,
        title: 'Booking Confirmed',
        message: `Your ticket for "${event.title}" is confirmed (Free entry).`,
        type: 'success',
      });

      return res.status(201).json({
        success: true,
        isFree: true,
        booking,
      });
    }

    // 4. Handle Paid Event (Razorpay Order creation)
    // Amount in subunits (paise for INR)
    const amountInPaise = totalPrice * 100;
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_booking_${Date.now()}`,
    });

    // Create booking as pending
    const booking = await Booking.create({
      eventId,
      userId: req.user.id,
      ticketQuantity: qty,
      totalPrice,
      paymentStatus: 'pending',
      paymentId: razorpayOrder.id,
      couponApplied: coupon ? coupon.code : '',
      discountAmount: discount,
    });

    res.status(201).json({
      success: true,
      isFree: false,
      razorpayOrder,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/bookings/verify
// @access  Private (Attendee)
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find the pending booking
    const booking = await Booking.findOne({ paymentId: razorpay_order_id });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found for this payment order',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        booking,
      });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Transaction rejected.',
      });
    }

    // Update booking status
    booking.paymentStatus = 'paid';
    booking.paymentSignature = razorpay_signature;

    if (booking.couponApplied) {
      try {
        const coupon = await Coupon.findOne({ code: booking.couponApplied, isActive: true });
        if (coupon) {
          coupon.uses += 1;
          await coupon.save();
        }
      } catch (couponErr) {
        console.error('Failed to increment coupon uses:', couponErr);
      }
    }

    // Update Event Ticket Availability
    const event = await Event.findById(booking.eventId);
    if (event) {
      // Re-verify tickets availability in case it sold out in the meantime
      if (event.availableTickets < booking.ticketQuantity) {
        // Refund case should be triggered in real-life, but we'll mark booking as failed
        booking.paymentStatus = 'failed';
        await booking.save();
        return res.status(400).json({
          success: false,
          message: 'Unfortunately, this event sold out while payment was in progress. Please contact support.',
        });
      }
      
      event.availableTickets -= booking.ticketQuantity;
      await event.save();

      // Update Analytics
      await Analytics.findOneAndUpdate(
        { eventId: event._id },
        { 
          $inc: { 
            ticketsSold: booking.ticketQuantity,
            revenue: booking.totalPrice
          } 
        },
        { upsert: true }
      );
    }

    // Generate QR Code
    const qrCode = await generateTicketQR({
      bookingId: booking._id,
      attendeeName: req.user.name,
      eventName: event ? event.title : 'EventSphere Event',
      ticketQuantity: booking.ticketQuantity,
      bookingDate: booking.bookingDate,
    });

    booking.qrCodeUrl = qrCode;
    await booking.save();

    // Send Confirmation Email
    const emailContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 26px; font-weight: 800;">EventSphere</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 13px;">Your gateway to local experiences</p>
        </div>
        
        <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">Ticket Purchase Confirmed!</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Dear <strong>${req.user.name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">Thank you for your purchase. Your payment has been processed successfully. Below is your booking receipt:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 100px;">Event:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${event ? event.title : 'EventSphere Experience'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date & Time:</td>
              <td style="padding: 6px 0; color: #334155;">${event ? new Date(event.startDate).toLocaleString() : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Location:</td>
              <td style="padding: 6px 0; color: #334155;">${event ? event.location : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Quantity:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${booking.ticketQuantity} Ticket(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Amount Paid:</td>
              <td style="padding: 6px 0; color: #6366f1; font-weight: 700;">₹${booking.totalPrice}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment ID:</td>
              <td style="padding: 6px 0; color: #475569; font-family: monospace;">${booking.paymentId}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">
          A digital ticket stub with a printable invoice is available inside your Attendee Console.
        </p>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8;">
          <p>Thank you for choosing EventSphere! Enjoy your upcoming event.</p>
        </div>
      </div>
    `;
    await sendEmail({
      to: req.user.email,
      subject: `Ticket Confirmed & Paid - ${event ? event.title : 'EventSphere'}`,
      html: emailContent,
      text: `Your ticket for "${event ? event.title : 'Event'}" is confirmed. Quantity: ${booking.ticketQuantity}. Paid: ₹${booking.totalPrice}`,
    });

    await createNotification({
      userId: req.user.id,
      title: 'Booking Confirmed',
      message: `Your ticket purchase for "${event ? event.title : 'EventSphere Experience'}" of ₹${booking.totalPrice} has been confirmed.`,
      type: 'success',
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and ticket confirmed!',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Booking History for active user
// @route   GET /api/bookings/my-bookings
// @access  Private (Attendee)
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizerId',
          select: 'name email',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings/registrations for a specific event
// @route   GET /api/bookings/event/:eventId
// @access  Private (Organizer/Admin)
export const getEventBookings = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Authorize owner
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this event',
      });
    }

    const bookings = await Booking.find({ eventId: req.params.eventId, paymentStatus: 'paid' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate and Check-In Ticket via QR / Booking ID
// @route   POST /api/bookings/:id/check-in
// @access  Private (Organizer/Admin)
export const checkInTicket = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const event = booking.eventId;
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Associated event not found',
      });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform check-in for this event',
      });
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in. Booking has not been paid.',
      });
    }

    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: `Ticket already checked-in at ${new Date(booking.checkedInAt).toLocaleString()}`,
        booking,
      });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Attendee successfully checked-in!',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Refund for booking
// @route   POST /api/bookings/:id/refund
// @access  Private (Attendee)
export const requestRefund = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to request refund for this ticket',
      });
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Only paid bookings can be refunded',
      });
    }

    if (booking.refundStatus !== 'none') {
      return res.status(400).json({
        success: false,
        message: `Refund already ${booking.refundStatus}`,
      });
    }

    if (new Date(booking.eventId.startDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request refund for an event that has already started',
      });
    }

    booking.refundStatus = 'requested';
    await booking.save();

    await createNotification({
      userId: req.user.id,
      title: 'Refund Requested',
      message: `Your refund request for "${booking.eventId.title}" is submitted.`,
      type: 'info',
    });

    // Notify Organizer
    await createNotification({
      userId: booking.eventId.organizerId,
      title: 'Refund Request Received',
      message: `An attendee has requested a refund for your event "${booking.eventId.title}".`,
      type: 'alert',
    });

    res.status(200).json({
      success: true,
      message: 'Refund request submitted successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process/Approve/Reject Refund Request
// @route   POST /api/bookings/:id/process-refund
// @access  Private (Organizer/Admin)
export const processRefund = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const event = booking.eventId;
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Associated event not found',
      });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to process refunds for this event',
      });
    }

    if (booking.refundStatus !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'No pending refund request found for this booking',
      });
    }

    if (action === 'approve') {
      booking.refundStatus = 'refunded';
      booking.paymentStatus = 'failed'; // invalidate the ticket
      booking.refundDate = new Date();
      await booking.save();

      event.availableTickets += booking.ticketQuantity;
      await event.save();

      await Analytics.findOneAndUpdate(
        { eventId: event._id },
        { 
          $inc: { 
            ticketsSold: -booking.ticketQuantity,
            revenue: -booking.totalPrice
          } 
        }
      );

      await createNotification({
        userId: booking.userId,
        title: 'Refund Approved',
        message: `Your refund for "${event.title}" was approved by the organizer.`,
        type: 'success',
      });

      res.status(200).json({
        success: true,
        message: 'Refund approved. Tickets released back to available pool.',
        booking,
      });
    } else {
      booking.refundStatus = 'rejected';
      await booking.save();

      await createNotification({
        userId: booking.userId,
        title: 'Refund Declined',
        message: `Your refund request for "${event.title}" was declined by the organizer.`,
        type: 'alert',
      });

      res.status(200).json({
        success: true,
        message: 'Refund request declined.',
        booking,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Validate coupon code
// @route   POST /api/bookings/validate-coupon
// @access  Private (Attendee)
export const validateCouponCode = async (req, res, next) => {
  try {
    const { code, eventId, ticketQuantity } = req.body;
    const qty = Number(ticketQuantity || 1);

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code or code has been deactivated',
      });
    }

    // Check expiration
    if (new Date(coupon.expirationDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired',
      });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has reached its maximum usage limit',
      });
    }

    // Check event-specific restriction
    if (coupon.eventId && coupon.eventId.toString() !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not valid for this event',
      });
    }

    // Fetch Event to calculate prices
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const subtotal = event.price * qty;
    let discount = 0;

    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    const finalPrice = subtotal - discount;

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      discount,
      finalPrice,
      couponId: coupon._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a coupon code
// @route   POST /api/bookings/coupons
// @access  Private (Organizer/Admin)
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, eventId, expirationDate, maxUses } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A coupon with this code already exists',
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      eventId: eventId || null,
      expirationDate: new Date(expirationDate),
      maxUses: maxUses ? Number(maxUses) : null,
    });

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};
