import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';

// @desc    Get organizer metrics for dashboard charts and cards
// @route   GET /api/analytics/organizer
// @access  Private (Organizer)
export const getOrganizerAnalytics = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    // 1. Get all events created by this organizer
    const events = await Event.find({ organizerId });
    const eventIds = events.map((e) => e._id);

    // 2. Query analytics data for these events
    const analytics = await Analytics.find({ eventId: { $in: eventIds } });

    // 3. Compute totals
    const totalEvents = events.length;
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalViews = 0;

    const eventPerformance = events.map((event) => {
      const stats = analytics.find((a) => a.eventId.toString() === event._id.toString()) || {
        ticketsSold: 0,
        revenue: 0,
        views: 0,
      };

      totalTicketsSold += stats.ticketsSold;
      totalRevenue += stats.revenue;
      totalViews += stats.views;

      return {
        id: event._id,
        title: event.title,
        price: event.price,
        startDate: event.startDate,
        ticketsSold: stats.ticketsSold,
        revenue: stats.revenue,
        views: stats.views,
        availableTickets: event.availableTickets,
        totalTickets: event.totalTickets,
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        totalViews,
      },
      events: eventPerformance,
    });
  } catch (error) {
    next(error);
  }
};
