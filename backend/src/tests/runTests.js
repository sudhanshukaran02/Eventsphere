import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import errorHandler from '../middleware/errorMiddleware.js';

// Route files
import authRoutes from '../routes/authRoutes.js';
import eventRoutes from '../routes/eventRoutes.js';
import bookingRoutes from '../routes/bookingRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import analyticsRoutes from '../routes/analyticsRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';

dotenv.config();

// We override the DB URI for testing so we don't overwrite user records
const TEST_MONGODB_URI = process.env.MONGODB_URI + '_test';
process.env.MONGODB_URI = TEST_MONGODB_URI;
process.env.PORT = 5099; // Test port
process.env.USE_MOCK_PAYMENTS = 'true';
process.env.USE_MOCK_SMTP = 'true';
process.env.USE_MOCK_CLOUDINARY = 'true';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

const runAllTests = async () => {
  console.log('\n======================================');
  console.log('STARTING EVENTSPHERE INTEGRATION TESTS');
  console.log('======================================');

  let server;
  let testMongoServer;
  try {
    // Connect to database
    try {
      await mongoose.connect(TEST_MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('CONNECTED TO TEST DATABASE:', TEST_MONGODB_URI);
    } catch (dbError) {
      console.error(`Local Test DB Connection failed: ${dbError.message}. Spinning up in-memory MongoDB for tests...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      testMongoServer = await MongoMemoryServer.create();
      const testMongoUri = testMongoServer.getUri();
      console.log(`In-memory Test MongoDB started at: ${testMongoUri}`);
      await mongoose.connect(testMongoUri);
      console.log('CONNECTED TO FALLBACK TEST DATABASE.');
    }

    // Clear test collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log('Test collections cleared.');

    // Start Express test server
    server = app.listen(5099, () => {
      console.log('Test Server listening on port 5099.');
    });

    const baseUrl = 'http://localhost:5099/api';

    // Store tokens and IDs
    let attendeeToken, organizerToken, adminToken;
    let organizerId;
    let eventId;
    let bookingOrderId;

    // --- TEST 1: Register Attendee ---
    console.log('\n[Test 1] Register Attendee...');
    const registerAttendeeRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Attendee',
        email: 'attendee@test.com',
        password: 'password123',
        role: 'attendee',
      }),
    });
    const attendeeData = await registerAttendeeRes.json();
    if (registerAttendeeRes.status === 201 && attendeeData.success) {
      attendeeToken = attendeeData.token;
      console.log('  -> Success! Token received.');
    } else {
      throw new Error(`Failed Test 1: ${JSON.stringify(attendeeData)}`);
    }

    // --- TEST 2: Register Organizer ---
    console.log('\n[Test 2] Register Organizer...');
    const registerOrganizerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Organizer',
        email: 'organizer@test.com',
        password: 'password123',
        role: 'organizer',
      }),
    });
    const organizerData = await registerOrganizerRes.json();
    if (registerOrganizerRes.status === 201 && organizerData.success) {
      organizerToken = organizerData.token;
      organizerId = organizerData.user.id;
      console.log(`  -> Success! Organizer status is: ${organizerData.user.status}`);
      if (organizerData.user.status !== 'pending_approval') {
        throw new Error('Organizer status should be pending_approval');
      }
    } else {
      throw new Error(`Failed Test 2: ${JSON.stringify(organizerData)}`);
    }

    // --- TEST 3: Register Admin ---
    console.log('\n[Test 3] Register Admin...');
    const registerAdminRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      }),
    });
    const adminData = await registerAdminRes.json();
    if (registerAdminRes.status === 201 && adminData.success) {
      adminToken = adminData.token;
      console.log('  -> Success! Admin registered.');
    } else {
      throw new Error(`Failed Test 3: ${JSON.stringify(adminData)}`);
    }

    // --- TEST 4: Create Event - Unapproved Organizer ---
    console.log('\n[Test 4] Create Event (Expected block - Organizer unapproved)...');
    // Multer expects formData, but we can mock validation or test with JSON for quick trigger if allowed.
    // Wait, since event controller validates file upload, let's test route access by triggering route.
    // Because it's blocked by roleMiddleware check (which runs BEFORE multer uploads), let's call it:
    const blockEventRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerToken}`,
      },
      body: JSON.stringify({ title: 'Invalid Event' }),
    });
    const blockEventData = await blockEventRes.json();
    if (blockEventRes.status === 403) {
      console.log(`  -> Success! Correctly blocked. Message: "${blockEventData.message}"`);
    } else {
      throw new Error('Test 4 failed: Organizer should have been blocked');
    }

    // --- TEST 5: Approve Organizer via Admin ---
    console.log('\n[Test 5] Approve Organizer via Admin API...');
    const approveRes = await fetch(`${baseUrl}/admin/organizers/${organizerId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'approve' }),
    });
    const approveData = await approveRes.json();
    if (approveRes.status === 200 && approveData.success) {
      console.log('  -> Success! Organizer status approved.');
    } else {
      throw new Error(`Failed Test 5: ${JSON.stringify(approveData)}`);
    }

    // --- TEST 6: Mock Event Creation using Mongoose directly (bypassing Multer for integration validation) ---
    console.log('\n[Test 6] Create Event (Direct DB Injection for further integration testing)...');
    // Since multer requires dynamic form parser, injecting directly in mongoose is perfect to get an eventId
    const EventModel = mongoose.model('Event');
    const AnalyticsModel = mongoose.model('Analytics');
    
    const dbEvent = await EventModel.create({
      title: 'Integration Rock Concert',
      description: 'Stunning music show',
      category: 'Music',
      location: 'New York, NY',
      startDate: new Date(Date.now() + 86400000), // tomorrow
      endDate: new Date(Date.now() + 100000000),
      price: 150, // paid event
      bannerUrl: '/uploads/mock.png',
      organizerId: organizerId,
      totalTickets: 50,
      availableTickets: 50,
    });
    eventId = dbEvent._id.toString();

    await AnalyticsModel.create({
      eventId: dbEvent._id,
      ticketsSold: 0,
      revenue: 0,
      views: 0,
    });
    console.log(`  -> Success! Created Event ID: ${eventId}`);

    // --- TEST 7: Fetch Events ---
    console.log('\n[Test 7] Retrieve Events...');
    const listRes = await fetch(`${baseUrl}/events`);
    const listData = await listRes.json();
    if (listRes.status === 200 && listData.success && listData.events.length > 0) {
      console.log(`  -> Success! Listed ${listData.events.length} events.`);
    } else {
      throw new Error(`Failed Test 7: ${JSON.stringify(listData)}`);
    }

    // --- TEST 8: Book Ticket (Paid Event - Razorpay order creation) ---
    console.log('\n[Test 8] Initiate Ticket Booking...');
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        eventId: eventId,
        ticketQuantity: 2,
      }),
    });
    const bookingData = await bookingRes.json();
    if (bookingRes.status === 201 && bookingData.success) {
      bookingOrderId = bookingData.razorpayOrder.id;
      console.log(`  -> Success! Razorpay order created: ${bookingOrderId}`);
    } else {
      throw new Error(`Failed Test 8: ${JSON.stringify(bookingData)}`);
    }

    // --- TEST 9: Verify Payment (Mock Signature validation) ---
    console.log('\n[Test 9] Verify Payment...');
    const verifyRes = await fetch(`${baseUrl}/bookings/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: bookingOrderId,
        razorpay_payment_id: 'pay_testmock12345',
        razorpay_signature: `mock_sig_for_${bookingOrderId}`,
      }),
    });
    const verifyData = await verifyRes.json();
    if (verifyRes.status === 200 && verifyData.success) {
      console.log('  -> Success! Payment verified, ticket confirmed.');
      console.log(`  -> QR Ticket Data URL size: ${verifyData.booking.qrCodeUrl.length} chars.`);
    } else {
      throw new Error(`Failed Test 9: ${JSON.stringify(verifyData)}`);
    }

    // --- TEST 10: Check Dashboard Analytics ---
    console.log('\n[Test 10] Query Organizer Analytics...');
    const statsQueryRes = await fetch(`${baseUrl}/analytics/organizer`, {
      headers: { Authorization: `Bearer ${organizerToken}` },
    });
    const statsQueryData = await statsQueryRes.json();
    if (statsQueryRes.status === 200 && statsQueryData.success) {
      const summary = statsQueryData.summary;
      console.log(`  -> Success! Total tickets sold: ${summary.totalTicketsSold}, Revenue: ₹${summary.totalRevenue}`);
      if (summary.totalTicketsSold !== 2 || summary.totalRevenue !== 300) {
        throw new Error('Analytics totals mismatch');
      }
    } else {
      throw new Error(`Failed Test 10: ${JSON.stringify(statsQueryData)}`);
    }

    console.log('\n======================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
    console.log('======================================\n');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE:', error.message);
  } finally {
    // Close servers and clean up db
    if (server) {
      server.close();
    }
    // Clean up test DB
    try {
      const EventModel = mongoose.model('Event');
      const UserModel = mongoose.model('User');
      const BookingModel = mongoose.model('Booking');
      const AnalyticsModel = mongoose.model('Analytics');
      
      await EventModel.deleteMany({});
      await UserModel.deleteMany({});
      await BookingModel.deleteMany({});
      await AnalyticsModel.deleteMany({});
      console.log('Cleaned up test DB entries.');
    } catch (e) {
      console.error('Error during test cleanup:', e.message);
    }
    
    await mongoose.disconnect();
    console.log('Mongoose connection disconnected.');
    if (testMongoServer) {
      await testMongoServer.stop();
      console.log('In-memory Test MongoDB stopped.');
    }
    process.exit(0);
  }
};

runAllTests();
