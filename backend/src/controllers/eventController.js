import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';
import User from '../models/User.js';
import { uploadImage } from '../config/cloudinary.js';
import { createNotification } from './notificationController.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

// @desc    Get all events (with search & filters)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const { category, location, minPrice, maxPrice, startDate, endDate, search } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by location (case insensitive match)
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by dates
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Search query on title/description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch matching events and populate organizer details
    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizerId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`,
      });
    }

    // Increment event views analytics on-the-fly
    await Analytics.findOneAndUpdate(
      { eventId: event._id },
      { $inc: { views: 1 } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizer)
export const createEvent = async (req, res, next) => {
  try {
    // Check file upload status
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an event banner image',
      });
    }

    // Upload to Cloudinary / Local
    const bannerUrl = await uploadImage(req.file.path);

    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      price,
      totalTickets,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      price: Number(price || 0),
      bannerUrl,
      organizerId: req.user.id,
      totalTickets: Number(totalTickets || 100),
      availableTickets: Number(totalTickets || 100),
    });

    // Initialize event analytics
    await Analytics.create({
      eventId: event._id,
      ticketsSold: 0,
      revenue: 0,
      views: 0,
    });

    await createNotification({
      userId: req.user.id,
      title: 'Event Created Successfully',
      message: `Your event "${event.title}" has been successfully published!`,
      type: 'success',
    });

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin)
export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`,
      });
    }

    // Ensure user is the event organizer or is an admin
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    const updates = { ...req.body };

    // Handle new banner image upload if provided
    if (req.file) {
      updates.bannerUrl = await uploadImage(req.file.path);
    }

    // Handle price and tickets type conversions
    if (updates.price) updates.price = Number(updates.price);
    
    if (updates.totalTickets) {
      const parsedTotal = Number(updates.totalTickets);
      const difference = parsedTotal - event.totalTickets;
      updates.totalTickets = parsedTotal;
      updates.availableTickets = Math.max(0, event.availableTickets + difference);
    }

    event = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${req.params.id}`,
      });
    }

    // Ensure user is the event organizer or is an admin
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    
    // Clean up associated analytics
    await Analytics.deleteOne({ eventId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Event and related analytics successfully deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Bookmark an event
// @route   POST /api/events/:id/save
// @access  Private (Attendee)
export const saveEvent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const eventId = req.params.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Toggle saved status
    const isSaved = user.savedEvents.includes(eventId);
    if (isSaved) {
      user.savedEvents = user.savedEvents.filter((id) => id.toString() !== eventId);
    } else {
      user.savedEvents.push(eventId);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      saved: !isSaved,
      message: isSaved ? 'Event removed from saved list' : 'Event added to saved list',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved events
// @route   GET /api/events/saved
// @access  Private (Attendee)
export const getSavedEvents = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedEvents',
      populate: {
        path: 'organizerId',
        select: 'name email',
      },
    });

    res.status(200).json({
      success: true,
      events: user.savedEvents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for an event
// @route   GET /api/events/:id/reviews
// @access  Public
export const getEventReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ eventId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a review for an event
// @route   POST /api/events/:id/reviews
// @access  Private (Attendee who booked the event)
export const addEventReview = async (req, res, next) => {
  try {
    const { rating, reviewText } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const booking = await Booking.findOne({
      eventId,
      userId: req.user.id,
      paymentStatus: 'paid',
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        message: 'You can only review events you have purchased tickets for.',
      });
    }

    const alreadyReviewed = await Review.findOne({
      eventId,
      userId: req.user.id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this event.',
      });
    }

    const review = await Review.create({
      eventId,
      userId: req.user.id,
      rating: Number(rating),
      reviewText,
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully!',
      review,
    });
  } catch (error) {
    next(error);
  }
};
