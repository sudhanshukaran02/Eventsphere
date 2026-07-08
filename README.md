# EventSphere - Modern Event Management Platform

EventSphere is a production-ready, full-stack event management platform built to enable organizers to post and manage events, track ticket sales, and analyze revenue while attendees browse happenings, bookmark selections, and book tickets through secure payments.

---

## 🌟 Tech Stack

### Frontend
- **React.js & Vite**: Fast, modernized scaffolding.
- **Tailwind CSS**: Glassmorphism, premium typography (`Outfit` & `Inter` Google Fonts), and responsive layouts.
- **React Router Dom (v6)**: Custom route guarding and role management.
- **Axios**: Promised-based client with custom authorization header interceptors.
- **Recharts**: Beautiful SVG dashboard charts.
- **Lucide React**: Crisp icons.

### Backend
- **Node.js & Express.js**: RESTful API service.
- **MongoDB & Mongoose**: Flexible document models and search indexing.
- **JSON Web Tokens (JWT)**: Security validation.
- **Multer**: High-performance local multipart upload handler.
- **QRCode**: Base64 ticketing encoder.

---

## 📂 Project Architecture

```
/eventsphere
  /backend
    /src
      /config         # DB, Cloudinary, Razorpay, Nodemailer integrations
      /controllers    # Auth, Events, Bookings, Analytics, Admins controllers
      /middleware     # JWT validation, Role checks, Error translating
      /models         # Mongoose User, Event, Booking, Analytics schemas
      /routes         # API endpoint routers
      /utils          # Base64 QR code generation
      /tests          # Integration testing suite
    index.js
    .env
    package.json
  /frontend
    /src
      /components     # Navbar, Footer, EventCard, ProtectedRoute, TicketQRModal
      /context        # AuthContext (login/registers), ThemeContext (dark mode)
      /pages          # Home, Login, Register, ForgotPassword, ResetPassword, Dashboards
      App.jsx
      main.jsx
      index.css
    index.html
    tailwind.config.js
    postcss.config.js
    package.json
  README.md
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventsphere
JWT_SECRET=supersecretkeyforeventsphereauth12345
JWT_EXPIRE=7d

# Third-party credentials (Optional, defaults to mock if left empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@eventsphere.com

# Developer Bypass Modes (Set to false when moving to production)
USE_MOCK_PAYMENTS=true
USE_MOCK_CLOUDINARY=true
USE_MOCK_SMTP=true
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (`mongodb://localhost:27017`) or a remote Atlas connection string.

### 1. Setup Backend
```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
The client website will load on `http://localhost:5173`.

### 3. Run Automated Tests
To run the automated backend integration testing suite:
```bash
cd backend
npm run test
```
This automatically spins up a sandboxed test server on port 5099, performs full test registrations, approves mock organizers, creates events, processes mock payments, verifies signatures, and asserts analytics updates.

---

## 📖 API Documentation

All API routes are prefixed with `/api`.

### 🔐 Authentication

#### **Register User**
`POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@eventsphere.com",
    "password": "password123",
    "role": "organizer"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603d2e...",
      "name": "Alex Mercer",
      "email": "alex@eventsphere.com",
      "role": "organizer",
      "status": "pending_approval"
    }
  }
  ```

#### **Login User**
`POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "alex@eventsphere.com",
    "password": "password123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi..."
  }
  ```

---

### 📅 Events

#### **List & Filter Events**
`GET /api/events`
- **Query Params**: `category`, `location`, `search`, `minPrice`, `maxPrice`, `startDate`, `endDate`
- **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "events": [
      {
        "_id": "603d4...",
        "title": "Summer Beats Concert",
        "price": 250,
        "availableTickets": 100,
        "category": "Music"
      }
    ]
  }
  ```

#### **Create Event**
`POST /api/events` (Protected: Organizer/Admin)
- **Headers**: `Content-Type: multipart/form-data`
- **Form Fields**: `title`, `description`, `category`, `location`, `startDate`, `endDate`, `price`, `totalTickets`
- **Files**: `banner` (Image cover)

---

### 🎟️ Bookings & Payments

#### **Initiate Booking**
`POST /api/bookings` (Protected: Attendee)
- **Request Body**:
  ```json
  {
    "eventId": "603d4...",
    "ticketQuantity": 2
  }
  ```
- **Response** (201 Created - Paid event):
  ```json
  {
    "success": true,
    "isFree": false,
    "razorpayOrder": {
      "id": "order_Hj3...",
      "amount": 50000,
      "currency": "INR"
    },
    "booking": {
      "_id": "603d5...",
      "paymentStatus": "pending"
    }
  }
  ```

#### **Verify Signature**
`POST /api/bookings/verify` (Protected: Attendee)
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_Hj3...",
    "razorpay_payment_id": "pay_Hj4...",
    "razorpay_signature": "mock_sig_for_order_Hj3..."
  }
  ```

---

## 🛠️ Advanced Platform Features

1. **Local Multer Storage Bypass**: If Cloudinary keys are missing, uploads default to `backend/uploads/` and are served statically via Express.
2. **Mock Razorpay Checkout Modals**: If `USE_MOCK_PAYMENTS=true`, clicking "Pay" on the frontend displays a custom modal overlay simulating Razorpay's options.
3. **Nodemailer console logging**: Emails log to `backend/logs/emails.txt` automatically if no SMTP configs are supplied.
4. **QR Codes**: Encodes booking validation fields into base64 images that are printable and downloadable in a click.

---

## 🌍 Production Deployment Guide

### Database Hosting
1. Setup a free cluster on MongoDB Atlas.
2. Retrieve your connection string `mongodb+srv://<username>:<password>@cluster.mongodb.net/eventsphere`.

### Backend Deploy (e.g. Render, Heroku)
1. Set Environment Variables on host (deactivate mock configurations):
   - `NODE_ENV=production`
   - `USE_MOCK_PAYMENTS=false`
   - `USE_MOCK_CLOUDINARY=false`
   - `USE_MOCK_SMTP=false`
2. Populate Cloudinary, SMTP, and Razorpay Live Key credentials.
3. Start script: `npm start`.

### Frontend Deploy (e.g. Vercel, Netlify)
1. Update Axios baseURL in `frontend/src/context/AuthContext.jsx` to match your deployed backend domain.
2. Build commands:
   ```bash
   cd frontend
   npm run build
   ```
3. Set Vercel output publish directory to `dist`.
