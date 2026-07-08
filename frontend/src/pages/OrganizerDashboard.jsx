import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { 
  Plus, 
  Ticket, 
  Calendar, 
  Pencil, 
  Trash2, 
  Users, 
  X, 
  Loader2, 
  TrendingUp, 
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CheckInConsoleModal from '../components/CheckInConsoleModal';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  
  const [summary, setSummary] = useState({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalViews: 0,
  });
  
  const [events, setEvents] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected event for attendee inspection drawer
  const [inspectEventId, setInspectEventId] = useState(null);
  const [inspectEventTitle, setInspectEventTitle] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    fetchOrganizerStats();
  }, []);

  const fetchOrganizerStats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/analytics/organizer');
      if (data.success) {
        setSummary(data.summary);
        setEvents(data.events);
        
        if (data.events.length > 0) {
          const regFeed = await fetchAllEventRegistrations(data.events);
          setRecentRegistrations(regFeed);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve organizer dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEventRegistrations = async (eventList) => {
    try {
      const promises = eventList.map(e => axios.get(`/bookings/event/${e.id}`));
      const results = await Promise.all(promises);
      const combined = [];
      results.forEach((res, index) => {
        if (res.data.success) {
          const eventTitle = eventList[index].title;
          res.data.bookings.forEach(b => {
            combined.push({
              ...b,
              eventTitle
            });
          });
        }
      });
      combined.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      return combined;
    } catch (err) {
      console.error('Combined registrations compilation failed:', err);
      return [];
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete Event: Are you sure? This will remove all tickets and transactions associated with it.')) {
      return;
    }
    
    try {
      const { data } = await axios.delete(`/events/${eventId}`);
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        fetchOrganizerStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleInspectAttendees = async (eventId, title) => {
    setInspectEventId(eventId);
    setInspectEventTitle(title);
    setLoadingAttendees(true);
    setAttendees([]);
    try {
      const { data } = await axios.get(`/bookings/event/${eventId}`);
      if (data.success) {
        setAttendees(data.bookings);
      }
    } catch (err) {
      console.error(err);
      alert('Could not inspect registrations.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleRefundAction = async (bookingId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this refund request?`)) {
      return;
    }
    try {
      const { data } = await axios.post(`/bookings/${bookingId}/process-refund`, { action });
      if (data.success) {
        alert(`Refund request ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
        fetchOrganizerStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Refund processing failed.');
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Event Title', 'Start Date', 'Ticket Price (INR)', 'Tickets Sold', 'Revenue (INR)', 'Views'];
    const rows = events.map(e => [
      `"${e.title.replace(/"/g, '""')}"`,
      new Date(e.startDate).toLocaleDateString(),
      e.price,
      e.ticketsSold,
      e.revenue,
      e.views
    ]);
    const csvContent ="data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `eventsphere_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-es-void font-body">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute font-display text-[9px] font-bold text-brand uppercase tracking-widest animate-pulse">ES</div>
        </div>
        <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Loading Creator Console...</p>
      </div>
    );
  }

  const activeCount = events.length;
  const upcomingCount = events.filter(e => new Date(e.startDate) >= new Date()).length;

  const chartData = events.map((e) => ({
    name: e.title.length > 12 ? e.title.substring(0, 12) + '...' : e.title,
    Tickets: e.ticketsSold,
    Revenue: e.revenue,
    Views: e.views,
  }));

  const recentPayments = recentRegistrations.filter(r => r.paymentStatus === 'paid').slice(0, 5);
  const slicedRegistrations = recentRegistrations.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-16 bg-es-void text-white font-body"
    >
      {/* 1. Header segment Vercel-style */}
      <section className="border-b border-white/5 bg-es-surface/60 backdrop-blur-md pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest leading-none font-display">Organizer Console</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white font-display uppercase">
              {user?.name}'s Dashboard
            </h1>
          </div>

          {/* Quick Actions Vercel panel */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowCheckInModal(true)}
              className="px-4 py-2.5 font-bold rounded-xl border border-white/5 bg-es-surface-raised hover:bg-white/5 text-text-tertiary hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider text-[10px]"
            >
              <QrCode className="h-4 w-4 text-brand" />
              Check-In Console
            </button>
            <button
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="px-4 py-2.5 font-bold rounded-xl border border-white/5 bg-es-surface-raised hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider text-[10px]"
            >
              <FileSpreadsheet className="h-4 w-4 text-brand" />
              Export CSV
            </button>
            <Link 
              to="/create-event" 
              className="px-4 py-2.5 font-bold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-glow-brand transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px]"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Main content grids */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {error && (
          <div className="p-4 rounded-xl bg-danger-muted text-danger text-xs border border-danger/20 text-center font-semibold">
            {error}
          </div>
        )}

        {/* 3. Vercel Style 4-Card Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl hover:border-brand/30 transition-all">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Total Revenue</p>
            <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1.5">
              ₹{summary.totalRevenue.toLocaleString('en-IN')}
            </h3>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-1 font-mono">
              <TrendingUp className="h-3 w-3" /> Live payout
            </span>
          </div>

          {/* Tickets Sold */}
          <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl hover:border-brand/30 transition-all">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Tickets Sold</p>
            <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1.5">
              {summary.totalTicketsSold}
            </h3>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider flex items-center gap-0.5 mt-1 font-mono">
              <Ticket className="h-3 w-3" /> Passes verified
            </span>
          </div>

          {/* Active Events */}
          <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl hover:border-brand/30 transition-all">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Active Events</p>
            <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1.5">
              {activeCount}
            </h3>
            <span className="text-[9px] text-text-secondary uppercase tracking-wider flex items-center gap-0.5 mt-1 font-mono">
              <Activity className="h-3 w-3" /> Total listings
            </span>
          </div>

          {/* Upcoming Events */}
          <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl hover:border-brand/30 transition-all">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Upcoming Slots</p>
            <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1.5">
              {upcomingCount}
            </h3>
            <span className="text-[9px] text-brand font-bold uppercase tracking-wider flex items-center gap-0.5 mt-1 font-mono">
              <Calendar className="h-3 w-3" /> Scheduled future
            </span>
          </div>
        </div>

        {/* 4. Charts Block */}
        {events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Revenue Area Chart */}
            <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Revenue Analytics</h3>
                <span className="text-[9px] font-bold text-text-tertiary uppercase">INR (₹)</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4856" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EC4856" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0B0B18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#EC4856" strokeWidth={1.5} fillOpacity={1} fill="url(#revenueGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ticket Sales Bar Chart */}
            <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Ticket Sales Volume</h3>
                <span className="text-[9px] font-bold text-text-tertiary uppercase">Volume</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0B0B18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Bar dataKey="Tickets" fill="#6C5CE7" radius={[4, 4, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* 5. Performance catalog list Vercel-style */}
        <div className="bg-es-surface border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Event Performance</h3>
            <span className="text-[10px] text-text-tertiary font-bold uppercase">All Listings</span>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center space-y-4 max-w-sm mx-auto font-light text-text-secondary text-xs">
              <p>You haven't listed any experiences on EventSphere yet. Click Create Event to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                    <th className="p-4">Title</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Tickets Sold</th>
                    <th className="p-4">Revenue</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-es-surface-raised/35">
                      <td className="p-4 font-bold text-white font-display uppercase tracking-wider">
                        {event.title}
                      </td>
                      <td className="p-4 text-text-secondary font-medium font-mono">
                        {formatDate(event.startDate)}
                      </td>
                      <td className="p-4 text-text-secondary font-semibold font-mono">
                        {event.price === 0 ? 'Free' : `₹${event.price}`}
                      </td>
                      <td className="p-4 font-bold text-white font-mono">
                        {event.ticketsSold} / {event.totalTickets}
                      </td>
                      <td className="p-4 text-emerald-450 font-bold font-mono">
                        ₹{event.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleInspectAttendees(event.id, event.title)}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-text-tertiary hover:text-white transition-colors cursor-pointer"
                            title="Attendee Registrations"
                          >
                            <Users className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            to={`/edit-event/${event.id}`}
                            className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-text-tertiary hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 rounded-lg border border-white/5 hover:border-danger/20 hover:bg-danger-muted text-text-tertiary hover:text-danger transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refund Requests List */}
        {recentRegistrations.filter(r => r.refundStatus === 'requested').length > 0 && (
          <div className="bg-es-surface border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Action Required: Refund Requests ({recentRegistrations.filter(r => r.refundStatus === 'requested').length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRegistrations.filter(r => r.refundStatus === 'requested').map((refund) => (
                <div key={refund._id} className="flex items-center justify-between text-xs p-4 rounded-xl bg-es-void/50 border border-white/5 gap-4">
                  <div className="space-y-1 truncate">
                    <p className="font-bold text-white truncate">
                      {refund.userId?.name || 'Attendee'}
                    </p>
                    <p className="text-[10px] text-text-secondary truncate">
                      Event: <strong>{refund.eventTitle}</strong>
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      Tickets: {refund.ticketQuantity} · Amount: ₹{refund.totalPrice}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRefundAction(refund._id, 'reject')}
                      className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-es-surface-raised hover:bg-white/5 text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRefundAction(refund._id, 'approve')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Recent Registrations & Payments Feed */}
        {events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Registrations feed */}
            <div className="bg-es-surface border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Recent Registrations</h3>
              {slicedRegistrations.length === 0 ? (
                <p className="text-xs text-text-tertiary font-light py-6 text-center">No registrants recorded yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {slicedRegistrations.map((b) => (
                    <div key={b._id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-es-void/50 border border-white/5">
                      <div className="space-y-1 truncate max-w-[70%]">
                        <p className="font-bold text-white truncate">
                          {b.userId?.name || 'Attendee'}
                        </p>
                        <p className="text-[10px] text-text-secondary truncate font-light">
                          Bought {b.ticketQuantity} ticket(s) for <strong>{b.eventTitle}</strong>
                        </p>
                      </div>
                      <span className="text-[10px] text-text-tertiary font-bold flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(b.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payments ledger */}
            <div className="bg-es-surface border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Recent Payments</h3>
              {recentPayments.length === 0 ? (
                <p className="text-xs text-text-tertiary font-light py-6 text-center">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {recentPayments.map((b) => (
                    <div key={b._id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-es-void/50 border border-white/5">
                      <div className="space-y-1">
                        <p className="font-mono text-[9px] text-text-tertiary font-bold">ID: {b.paymentId?.substring(0, 14) || 'N/A'}</p>
                        <p className="text-[10px] text-text-secondary">
                          Invoice split: {b.ticketQuantity} ticket(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-500 font-mono text-xs">+₹{b.totalPrice}</span>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-0.5 justify-end">
                          <CheckCircle className="h-2.5 w-2.5" /> PAID
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Inspection Drawer Overlay */}
      <AnimatePresence>
        {inspectEventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="h-full w-full max-w-md bg-es-surface border-l border-white/[0.08] shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between text-white"
            >
              <div className="space-y-6 flex-1 text-xs">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Registrations</h3>
                  <button onClick={() => setInspectEventId(null)} className="p-1.5 rounded-lg text-text-tertiary hover:bg-white/5 cursor-pointer">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-brand font-bold uppercase tracking-wider font-mono">Event target</span>
                  <h4 className="text-sm font-bold text-white leading-snug font-display uppercase tracking-wider">{inspectEventTitle}</h4>
                </div>

                {loadingAttendees ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                  </div>
                ) : attendees.length === 0 ? (
                  <p className="text-xs text-text-tertiary py-12 text-center font-light">No bookings registered for this event slot.</p>
                ) : (
                  <div className="space-y-4">
                    {attendees.map(a => (
                      <div key={a._id} className="p-4 rounded-xl bg-es-void border border-white/5 text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-white">{a.userId?.name || 'Attendee'}</span>
                          <span className="text-text-secondary font-mono">Qty: {a.ticketQuantity}</span>
                        </div>
                        <p className="text-text-tertiary text-[10px] font-medium leading-none">{a.userId?.email || 'N/A'}</p>
                        <div className="pt-2 flex justify-between items-center text-[10px] border-t border-white/5 mt-2 font-medium">
                          <span className="text-text-secondary">Paid: ₹{a.totalPrice}</span>
                          <span className="text-text-tertiary font-mono">{new Date(a.bookingDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={() => setInspectEventId(null)}
                  className="w-full py-3 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                >
                  Close panel
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CheckInConsoleModal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} />

    </motion.div>
  );
};

export default OrganizerDashboard;
