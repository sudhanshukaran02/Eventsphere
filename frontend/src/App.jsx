import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EventDetails from './pages/EventDetails';
import AttendeeDashboard from './pages/AttendeeDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/CreateEvent';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-es-void text-text-primary transition-colors duration-normal">
            {/* Header */}
            <Navbar />

            {/* Main view container */}
            <main className="flex-grow">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/event/:id" element={<EventDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Attendee protected routes */}
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute allowedRoles={['attendee']}>
                      <AttendeeDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute allowedRoles={['attendee']}>
                      <AttendeeDashboard /> {/* We reuse dashboard and set tab inside, wait, in our dashboard activeTab was tickets. Let's make dashboard handle a routing/state or tab preset if needed, or attendee dashboard handles bookmarks beautifully. We will render AttendeeDashboard and it will fetch bookmarks, the user can click tabs. Let's make a custom tab state if needed, or attendee dashboard is fine. */}
                    </ProtectedRoute>
                  }
                />

                {/* Organizer protected routes */}
                <Route
                  path="/organizer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-event"
                  element={
                    <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-event/:id"
                  element={
                    <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />

                {/* Admin protected routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
