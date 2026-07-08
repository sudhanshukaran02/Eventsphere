import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Please provide a rating (1 to 5)'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: {
      type: String,
      required: [true, 'Please provide review description text'],
      trim: true,
      maxlength: [500, 'Review text cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one review per user per event
reviewSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
