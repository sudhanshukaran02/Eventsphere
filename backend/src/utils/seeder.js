import mongoose from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Analytics from '../models/Analytics.js';

const seedDB = async () => {
  try {
    // Auto-approve all existing organizers in non-test environments to prevent lockout
    const isTest = process.env.NODE_ENV === 'test';
    if (!isTest) {
      const approveResult = await User.updateMany(
        { role: 'organizer', status: 'pending_approval' },
        { status: 'approved' }
      );
      if (approveResult.modifiedCount > 0) {
        console.log(`Auto-approved ${approveResult.modifiedCount} pending organizer accounts.`);
      }
    }

    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      console.log('Database already contains event data. Skipping seeding.');
      return;
    }

    console.log('Database is empty. Starting database seeding...');

    // 1. Find or create an approved organizer
    let organizer = await User.findOne({ role: 'organizer' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Demo Organizer',
        email: 'organizer@test.com',
        password: 'password123',
        role: 'organizer',
        status: 'approved',
      });
      console.log('Created demo organizer user:', organizer.email);
    }

    // 2. Define initial events
    const initialEvents = [
      {
        title: "EDM Night Festival",
        description: "Get ready for the loudest EDM night festival of the season! Featuring award-winning international headliners, high-powered bass lasers, stellar visual production, and non-stop energetic dance tracks. Experience the nightlife music magic.",
        category: "Music",
        location: "Mumbai, India",
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        price: 999,
        bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
        totalTickets: 1500,
        availableTickets: 650,
        organizerId: organizer._id,
      },
      {
        title: "Tech Summit 2024",
        description: "Connect with the developers, founders, and investors shaping the digital landscape. Discover panels on generative intelligence models, cloud architecture scaling, Web3, and UI/UX design. Under interactive neon spotlight stages.",
        category: "Tech",
        location: "Bangalore, India",
        startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        price: 499,
        bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800",
        totalTickets: 1000,
        availableTickets: 400,
        organizerId: organizer._id,
      },
      {
        title: "Art & Creativity Expo",
        description: "Explore a stunning gallery of abstract expressionism, digital installations, and interactive neon sculpture designs. Engage in panel discussions with local curators and artists. Complimentary mocktails are included.",
        category: "Art",
        location: "Delhi, India",
        startDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 0,
        bannerUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800",
        totalTickets: 500,
        availableTickets: 250,
        organizerId: organizer._id,
      }
    ];

    // 3. Insert events and initialize analytics
    const seededEvents = await Event.insertMany(initialEvents);
    console.log(`Successfully seeded ${seededEvents.length} events.`);

    for (const ev of seededEvents) {
      await Analytics.create({
        eventId: ev._id,
        ticketsSold: 0,
        revenue: 0,
        views: 0,
      });
    }
    console.log('Seeded analytics entries for all seeded events.');
    console.log('Database seeding complete! ✅');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

export default seedDB;
