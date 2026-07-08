import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticketQuantity: {
      type: Number,
      required: true,
      min: [1, 'Must book at least 1 ticket'],
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: {
      type: String, // Razorpay order ID or transaction ID
      required: true,
    },
    paymentSignature: {
      type: String,
    },
    qrCodeUrl: {
      type: String, // Base64 encoding of the QR code containing verification text
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'refunded', 'rejected'],
      default: 'none',
    },
    refundDate: {
      type: Date,
    },
    couponApplied: {
      type: String,
      default: '',
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ paymentId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
