import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    ticketsSold: {
      type: Number,
      default: 0,
      min: [0, 'Tickets sold cannot be negative'],
    },
    revenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
