import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';

// Config and Middleware
import connectDB from './config/db.js';
import errorHandler from './middleware/errorMiddleware.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load environment variables
dotenv.config();

// Verify required environment variables on startup (fail fast in production)
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL STARTUP ERROR: Environment variable "${key}" is missing.`);
    process.exit(1);
  }
});

// Connect to Database
connectDB();

const app = express();

// 1. Security Headers (Helmet) with customized Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:5000",
          "https://*.cloudinary.com",
          "https://images.unsplash.com",
        ],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "ws://localhost:5173",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 3. Response Compression
app.use(compression());

// 4. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // React Vite ports
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directory if it does not exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Mount routers with rate-limiters
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Root route check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the EventSphere API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Centralized error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`EventSphere server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
