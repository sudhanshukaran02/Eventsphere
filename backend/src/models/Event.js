import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an event title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add an event description'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: ['Music', 'Tech', 'Art', 'Sports', 'Business', 'Food', 'Other'],
        message: 'Please select a valid category (Music, Tech, Art, Sports, Business, Food, Other)',
      },
    },
    location: {
      type: String,
      required: [true, 'Please add a location (or Online)'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date and time'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date and time'],
    },
    price: {
      type: Number,
      required: [true, 'Please set a price (use 0 for free events)'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    bannerUrl: {
      type: String,
      required: [true, 'Please upload or provide an event banner bannerUrl'],
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    availableTickets: {
      type: Number,
      required: [true, 'Please specify available tickets'],
      min: [0, 'Tickets cannot be negative'],
    },
    totalTickets: {
      type: Number,
      required: [true, 'Please specify total tickets'],
      min: [1, 'Total tickets must be at least 1'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster searching
eventSchema.index({ title: 'text', description: 'text', location: 'text' });
eventSchema.index({ category: 1 });
eventSchema.index({ price: 1 });
eventSchema.index({ startDate: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
