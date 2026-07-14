import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import TicketQRModal from '../components/TicketQRModal';
import { demoEvents } from '../utils/demoEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Bookmark, 
  History, 
  Calendar, 
  MapPin, 
  QrCode, 
  User, 
  ShieldCheck, 
  Mail,
  Camera,
  CheckCircle,
  Bell,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const AttendeeDashboard = () => {
  const { user, refreshUser } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets', 'saved', 'upcoming', 'notifications', 'profile'
  
  // Profile settings local states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePictureUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // QR modal state
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await axios.get('/bookings/my-bookings');
      let backendBookings = [];
      if (bookingsRes.data.success) {
        backendBookings = bookingsRes.data.bookings;
      }
      
      // Load local demo bookings
      const localDemoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      setBookings([...localDemoBookings, ...backendBookings]);
      
      const savedRes = await axios.get('/events/saved');
      if (savedRes.data.success) {
        setSavedEvents(savedRes.data.events);
      }

      try {
        const eventsRes = await axios.get('/events');
        if (eventsRes.data.success) {
          const bookedIds = bookingsRes.data.bookings.map(b => b.eventId?._id || b.eventId);
          const upcoming = eventsRes.data.events.filter(e => !bookedIds.includes(e._id));
          setRecommendedEvents(upcoming.slice(0, 3));
        }
      } catch (err) {
        setRecommendedEvents(demoEvents.slice(3, 6));
      }

      try {
        const notifRes = await axios.get('/notifications');
        if (notifRes.data.success) {
          setNotifications(notifRes.data.notifications);
        }
      } catch (err) {
        console.error('Failed to retrieve live notifications:', err);
      }
    } catch (err) {
      console.error('Failed to fetch attendee dashboard data:', err);
      setRecommendedEvents(demoEvents.slice(2, 5));
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async (bookingId) => {
    if (!window.confirm('Request Refund: Are you sure you want to request a refund for this ticket? This will cancel your ticket registration.')) {
      return;
    }
    if (String(bookingId).startsWith('mock_booking_')) {
      const updatedBookings = bookings.map(b => 
        b._id === bookingId ? { ...b, refundStatus: 'requested' } : b
      );
      setBookings(updatedBookings);
      const localDemoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      const updatedLocal = localDemoBookings.map(b => 
        b._id === bookingId ? { ...b, refundStatus: 'requested' } : b
      );
      localStorage.setItem('demoBookings', JSON.stringify(updatedLocal));
      alert('Refund request submitted successfully (Simulated for demo).');
      return;
    }
    try {
      const { data } = await axios.post(`/bookings/${bookingId}/refund`);
      if (data.success) {
        alert('Refund request submitted successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Refund request failed.');
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      const { data } = await axios.put(`/notifications/${notifId}/read`);
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === notifId ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const { data } = await axios.put('/notifications/read-all');
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'security': return ShieldCheck;
      case 'alert': return AlertCircle;
      default: return Info;
    }
  };

  const handleSaveRemove = (eventId, savedStatus) => {
    if (!savedStatus) {
      setSavedEvents((prev) => prev.filter((e) => e._id !== eventId));
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);

    try {
      const formData = new FormData();
      formData.append('name', profileName);
      formData.append('email', profileEmail);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const { data } = await axios.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        setUpdateSuccess(true);
        if (typeof refreshUser === 'function') {
          await refreshUser();
        }
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=600';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let normalized = url.replace(/\\/g, '/');
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    if (normalized.startsWith('/uploads')) {
      return `http://localhost:5000${normalized}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-es-void font-body">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute font-display text-[9px] font-bold text-brand uppercase tracking-widest animate-pulse">ES</div>
        </div>
        <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Loading Attendee Console...</p>
      </div>
    );
  }

  const paidBookings = bookings.filter((b) => b.paymentStatus === 'paid');
  const otherBookings = bookings.filter((b) => b.paymentStatus !== 'paid');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-16 bg-es-void text-white font-body"
    >
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-es-void via-slate-900 to-brand/10 py-12 px-4 md:px-8 text-white rounded-b-[40px] shadow-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand to-accent text-white flex items-center justify-center font-bold text-3xl uppercase shadow-md">
                  {user?.name.charAt(0)}
                </div>
              )}
              <div 
                onClick={() => setActiveTab('profile')}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-muted text-brand border border-brand/20 text-[9px] font-bold uppercase tracking-wider font-mono">
                <ShieldCheck className="h-3 w-3" />
                Verified Attendee
              </span>
              <h1 className="text-2xl font-bold font-sans tracking-tight">{user?.name}</h1>
              <p className="text-xs text-text-secondary font-light">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex gap-4 text-center">
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl backdrop-blur-md">
              <p className="text-2xl font-extrabold font-mono text-brand">{paidBookings.length}</p>
              <p className="text-[9px] uppercase text-text-secondary font-bold tracking-wider">My Tickets</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl backdrop-blur-md">
              <p className="text-2xl font-extrabold font-mono text-brand">{savedEvents.length}</p>
              <p className="text-[9px] uppercase text-text-secondary font-bold tracking-wider font-sans">Bookmarks</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Console Panel */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Tab switch bar */}
        <div className="flex border-b border-white/5 gap-6 mb-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'tickets', label: 'My Tickets', icon: Ticket },
            { id: 'saved', label: 'Saved Events', icon: Bookmark },
            { id: 'upcoming', label: 'Upcoming Gigs', icon: Sparkles },
            { id: 'notifications', label: 'Notifications Feed', icon: Bell },
            { id: 'profile', label: 'Profile Settings', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  pb-3 text-xs uppercase font-bold tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0
                  ${activeTab === tab.id
                    ? 'border-brand text-brand font-extrabold'
                    : 'border-transparent text-text-secondary hover:text-white'}
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering with animations */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: My Tickets & Booking History */}
          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest block font-display">Active Passes</h2>
                
                {paidBookings.length === 0 ? (
                  <div className="text-center p-12 rounded-3xl bg-es-surface border border-white/5 shadow-2xl max-w-md mx-auto space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-brand-muted text-brand flex items-center justify-center">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <p className="text-xs text-text-secondary font-light">You don't hold any active virtual passes. Find and register for upcoming experiences.</p>
                    <Link to="/" className="btn-primary py-2.5 px-6 text-xs rounded-xl inline-block font-bold uppercase tracking-wider shadow-glow-brand">Browse events</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paidBookings.map((booking) => {
                      const event = booking.eventId;
                      if (!event) return null;
                      return (
                        <div
                          key={booking._id}
                          className="relative rounded-2xl bg-es-surface border border-white/[0.06] shadow-2xl transition-all duration-300 flex overflow-hidden group hover:border-brand/30"
                        >
                          {/* Left ticket thumbnail */}
                          <div className="w-1/3 aspect-square md:aspect-auto overflow-hidden bg-es-void shrink-0 relative hidden sm:block">
                            <img 
                              src={getImageUrl(event.bannerUrl)} 
                              alt="Thumbnail" 
                              className="h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-es-surface" />
                          </div>

                          {/* Ticket Stub Cutout dots */}
                          <div className="absolute top-1/2 -translate-y-1/2 left-[33%] -translate-x-1/2 h-6 w-6 rounded-full bg-es-void border border-white/5 z-15 hidden sm:block shadow-inner" />
                          
                          {/* Body */}
                          <div className="flex-1 p-5 flex flex-col justify-between space-y-4 text-xs">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="px-2.5 py-0.5 text-[8px] font-bold uppercase rounded bg-brand-muted text-brand tracking-wider font-mono">
                                  Confirmed Pass
                                </span>
                                <span className="text-[10px] text-text-tertiary font-semibold font-mono">Qty: {booking.ticketQuantity}</span>
                              </div>
                              <h3 className="font-bold text-sm text-white line-clamp-1 leading-snug font-display uppercase tracking-wider">
                                {event.title}
                              </h3>
                              <div className="text-[10px] text-text-secondary space-y-1">
                                <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand" /> {formatDate(event.startDate)}</p>
                                <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 text-brand" /> {event.location}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5 flex-wrap gap-2">
                              <span className="text-[10px] font-bold text-text-secondary uppercase font-mono">Paid: ₹{booking.totalPrice}</span>
                              <div className="flex items-center gap-2">
                                {booking.refundStatus === 'none' && new Date(event.startDate) > new Date() && (
                                  <button
                                    onClick={() => handleRefundRequest(booking._id)}
                                    className="px-2.5 py-1.5 text-[9px] rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Refund
                                  </button>
                                )}
                                {booking.refundStatus === 'requested' && (
                                  <span className="px-2.5 py-1 text-[8px] font-bold uppercase rounded bg-amber-500/10 text-amber-500 tracking-wider font-mono">
                                    Refund Pending
                                  </span>
                                )}
                                {booking.refundStatus === 'rejected' && (
                                  <span className="px-2.5 py-1 text-[8px] font-bold uppercase rounded bg-danger-muted text-danger tracking-wider font-mono" title="Refund request declined by organizer">
                                    Refund Denied
                                  </span>
                                )}
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className="btn-primary py-1.5 px-3.5 text-[9px] rounded-lg flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider shadow-sm"
                                >
                                  <QrCode className="h-3.5 w-3.5" /> View Ticket
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Booking History Table */}
              {otherBookings.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-1.5 font-display">
                    <History className="h-4 w-4 text-brand" /> Booking History & Invoice Log
                  </h2>
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-es-surface">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                          <th className="p-4">Event Details</th>
                          <th className="p-4">Quantity</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Booking Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {otherBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-es-surface-raised/35">
                            <td className="p-4 font-bold text-white">
                              {b.eventId?.title || 'Unknown Event'}
                            </td>
                            <td className="p-4 text-text-secondary font-semibold font-mono">{b.ticketQuantity}</td>
                            <td className="p-4 text-text-secondary font-semibold font-mono">₹{b.totalPrice}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wider font-mono ${
                                b.paymentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-muted text-brand'
                              }`}>
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td className="p-4 text-text-secondary font-medium font-mono">{formatDate(b.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: Bookmarks grid */}
          {activeTab === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {savedEvents.length === 0 ? (
                <div className="text-center p-12 rounded-3xl bg-es-surface border border-white/5 shadow-2xl max-w-md mx-auto space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-brand-muted text-brand flex items-center justify-center">
                    <Bookmark className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-text-secondary font-light">Your bookmark feed is empty. Click the bookmark buttons on cards to save experiences.</p>
                  <Link to="/" className="btn-secondary py-2.5 px-6 text-xs rounded-xl inline-block font-bold">Discover Events</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedEvents.map((event) => (
                    <EventCard 
                      key={event._id} 
                      event={event} 
                      onSaveToggle={handleSaveRemove} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: Recommendations (Upcoming Suggestions) */}
          {activeTab === 'upcoming' && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Sparkles className="h-4.5 w-4.5 text-brand" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Recommended Experiences</h3>
              </div>

              {recommendedEvents.length === 0 ? (
                <p className="text-xs text-text-tertiary py-8 text-center font-light">No recommendations compiled yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedEvents.map((event) => (
                    <EventCard 
                      key={event._id} 
                      event={event} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: Notifications Feed */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Notifications Feed</h3>
                {notifications.length > 0 ? (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="text-[10px] text-brand hover:underline font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Mark all as read
                  </button>
                ) : (
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest font-mono">Alerts</span>
                )}
              </div>
 
              {notifications.length === 0 ? (
                <div className="text-center p-12 rounded-3xl bg-es-surface border border-white/5 shadow-2xl max-w-sm mx-auto space-y-3">
                  <div className="mx-auto h-11 w-11 rounded-full bg-brand-muted text-brand flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-text-secondary font-light">No notifications recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    return (
                      <div 
                        key={notif._id}
                        onClick={() => !notif.isRead && handleMarkNotificationRead(notif._id)}
                        className={`p-4 rounded-xl bg-es-surface border shadow-2xl flex gap-4 hover:border-brand/20 transition-all group cursor-pointer ${
                          notif.isRead ? 'border-white/[0.04] opacity-60' : 'border-brand/20 bg-brand-subtle'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center ${
                          notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                          notif.type === 'security' ? 'bg-amber-500/10 text-amber-500' :
                          notif.type === 'alert' ? 'bg-red-500/10 text-red-500' : 'bg-brand-muted text-brand'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 text-xs flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-white leading-tight">{notif.title}</span>
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                            )}
                          </div>
                          <p className="text-text-secondary leading-relaxed font-medium group-hover:text-white transition-colors">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-text-tertiary font-mono font-medium">
                            {new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: Profile Settings */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-es-surface rounded-3xl border border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6">
                <div className="pb-4 border-b border-white/5 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group h-20 w-20 rounded-full overflow-hidden border border-white/10 bg-es-surface-raised flex items-center justify-center shrink-0">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-text-secondary" />
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                      <Camera className="h-5 w-5" />
                      <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Account Settings</h3>
                    <p className="text-[11px] text-text-tertiary">Review credentials or upload custom avatars.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="form-input text-xs py-3 rounded-xl"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="form-input pl-11 text-xs py-3 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Role (read only) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Account Role</label>
                    <input
                      type="text"
                      disabled
                      value={user?.role || 'Attendee'}
                      className="form-input text-xs py-3 rounded-xl bg-es-void/50 text-text-tertiary border-white/5 cursor-not-allowed uppercase font-semibold tracking-widest font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isUpdating}
                      className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-glow-brand"
                    >
                      {isUpdating ? 'Saving profile changes...' : 'Save Settings'}
                    </motion.button>
                  </div>
                </form>

                <AnimatePresence>
                  {updateSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold flex items-center gap-1.5 justify-center"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Settings updated successfully (Local session sync).
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Security Reset */}
                <div className="p-4 rounded-xl bg-es-void border border-white/5 text-xs text-text-secondary space-y-2">
                  <p className="font-bold text-white flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    Security Settings
                  </p>
                  <p className="font-light leading-relaxed">
                    To modify your login passcode, please trigger a secure reset request. This logs out active browser sessions and issues a reset token link to your mailbox.
                  </p>
                  <Link to="/forgot-password" className="text-brand hover:underline font-bold inline-block pt-1">
                    Reset Passcode &rarr;
                  </Link>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Ticket Modal Overlay */}
      <AnimatePresence>
        {selectedBooking && (
          <TicketQRModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AttendeeDashboard;
