import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: [true, 'Please specify discount type (percentage or flat)'],
      enum: ['percentage', 'flat'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Please specify discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null, // null means global coupon
    },
    expirationDate: {
      type: Date,
      required: [true, 'Please specify coupon expiration date'],
    },
    maxUses: {
      type: Number,
      default: null, // null means unlimited
    },
    uses: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
