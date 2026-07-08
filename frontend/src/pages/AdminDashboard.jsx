import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  Check, 
  X, 
  Trash2, 
  Activity,
  Briefcase,
  Search,
  CheckCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const COLORS = ['#ef4444', '#f97316', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9'];

const AdminDashboard = () => {
  
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalAttendees: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalViews: 0,
  });
  
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'organizers', 'approvals', 'events', 'reports'
  
  // Lists
  const [users, setUsers] = useState([]);
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Searching lists locally
  const [userSearch, setUserSearch] = useState('');
  const [hostSearch, setHostSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get('/admin/analytics');
      if (statsRes.data.success) {
        setSummary(statsRes.data.summary);
        setCategoryStats(statsRes.data.categoryStats);
        setRecentBookings(statsRes.data.recentBookings);
      }

      const usersRes = await axios.get('/admin/users');
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      const pendingRes = await axios.get('/admin/organizers/pending');
      if (pendingRes.data.success) {
        setPendingOrganizers(pendingRes.data.organizers);
      }

      const eventsRes = await axios.get('/events');
      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve administrative console data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerApproval = async (orgId, action) => {
    try {
      const { data } = await axios.put(`/admin/organizers/${orgId}/approve`, { action });
      if (data.success) {
        setPendingOrganizers((prev) => prev.filter((o) => o._id !== orgId));
        
        const uRes = await axios.get('/admin/users');
        if (uRes.data.success) setUsers(uRes.data.users);
        const sRes = await axios.get('/admin/analytics');
        if (sRes.data.success) setSummary(sRes.data.summary);
      }
    } catch (err) {
      alert('Verification resolution failed.');
    }
  };

  const handleToggleSuspend = async (targetUser) => {
    const nextStatus = targetUser.status === 'suspended' ? 'approved' : 'suspended';
    if (!window.confirm(`Suspend Toggle: Are you sure you want to change status to ${nextStatus} for ${targetUser.name}?`)) {
      return;
    }

    try {
      const { data } = await axios.put(`/admin/users/${targetUser._id}/role`, {
        status: nextStatus,
      });
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Suspension toggle failed.');
    }
  };

  const handleModeratorTakedown = async (eventId) => {
    if (!window.confirm('Moderator Takedown: Are you sure you want to delete this event from the platform?')) {
      return;
    }

    try {
      const { data } = await axios.delete(`/events/${eventId}`);
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
        const statsRes = await axios.get('/admin/analytics');
        if (statsRes.data.success) setSummary(statsRes.data.summary);
      }
    } catch (err) {
      alert('Delete operation failed.');
    }
  };

  const handleExportUsersCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Registered Date'];
    const rows = users.map(u => [
      u._id,
      `"${u.name.replace(/"/g, '""')}"`,
      u.email,
      u.role,
      u.status,
      new Date(u.createdAt).toLocaleDateString()
    ]);
    triggerCSVDownload(headers, rows, 'platform_users_audit');
  };

  const handleExportTransactionsCSV = () => {
    if (recentBookings.length === 0) return;
    const headers = ['Booking ID', 'User Name', 'User Email', 'Event Title', 'Tickets Bought', 'Total Paid (INR)', 'Booking Date'];
    const rows = recentBookings.map(b => [
      b._id,
      `"${(b.userId?.name || 'N/A').replace(/"/g, '""')}"`,
      b.userId?.email || 'N/A',
      `"${(b.eventId?.title || 'N/A').replace(/"/g, '""')}"`,
      b.ticketQuantity,
      b.totalPrice,
      new Date(b.bookingDate).toLocaleDateString()
    ]);
    triggerCSVDownload(headers, rows, 'platform_transactions_audit');
  };

  const triggerCSVDownload = (headers, rows, filename) => {
    const csvContent ="data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const pieChartData = categoryStats.map((c) => ({
    name: c._id || 'Other',
    value: c.count,
  }));

  const barChartData = categoryStats.map((c) => ({
    name: c._id || 'Other',
    Revenue: c.revenue || 0,
  }));

  const attendeesList = users.filter(u => u.role === 'attendee');
  const organizersList = users.filter(u => u.role === 'organizer');

  const filteredAttendees = attendeesList.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredOrganizers = organizersList.filter(u => 
    u.name.toLowerCase().includes(hostSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(hostSearch.toLowerCase())
  );

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
    e.category.toLowerCase().includes(eventSearch.toLowerCase()) ||
    (e.organizerId?.name || '').toLowerCase().includes(eventSearch.toLowerCase())
  );

  const averageTicketPrice = summary.totalTicketsSold > 0 
    ? Math.round(summary.totalRevenue / summary.totalTicketsSold) 
    : 0;

  const totalSeatsAllocated = events.reduce((sum, e) => sum + e.totalTickets, 0);
  const seatsReservationRatio = totalSeatsAllocated > 0 
    ? Math.round((summary.totalTicketsSold / totalSeatsAllocated) * 100)
    : 0;

  const hostToAttendeeRatio = summary.totalAttendees > 0
    ? (summary.totalOrganizers / summary.totalAttendees).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-es-void font-body">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute font-display text-[9px] font-bold text-brand uppercase tracking-widest animate-pulse">ES</div>
        </div>
        <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Loading Administrative Console...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-16 bg-es-void text-white font-body"
    >
      {/* 1. Header segment */}
      <section className="border-b border-white/5 bg-es-surface/60 backdrop-blur-md pt-8 pb-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand animate-pulse" />
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest leading-none font-display font-mono">Administrative Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-wider text-white font-display uppercase">
              Platform Master Console
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl border border-white/5 bg-es-surface hover:bg-white/5 transition-colors text-text-tertiary hover:text-white cursor-pointer"
              title="Refresh stats"
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={handleExportTransactionsCSV}
              className="px-4 py-2.5 font-bold rounded-xl bg-brand hover:bg-brand-hover text-white shadow-glow-brand transition-all flex items-center gap-1.5 uppercase tracking-wider text-[10px] cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Bookings
            </button>
          </div>
        </div>
      </section>

      {/* 2. Secondary Tab Switcher */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {error && (
          <div className="p-4 rounded-xl bg-danger-muted text-danger text-xs border border-danger/20 text-center font-bold">
            {error}
          </div>
        )}

        <div className="flex border-b border-white/5 gap-6 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'analytics', label: 'Analytics Panel' },
            { id: 'users', label: 'Attendees' },
            { id: 'organizers', label: 'Hosts Directory' },
            { id: 'approvals', label: pendingOrganizers.length > 0 ? `Verifications (${pendingOrganizers.length})` : 'Verifications' },
            { id: 'events', label: 'Moderation Feed' },
            { id: 'reports', label: 'System Reports' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 text-xs uppercase font-bold tracking-wider border-b-2 transition-all duration-200 shrink-0 cursor-pointer
                ${activeTab === tab.id
                  ? 'border-brand text-brand font-extrabold'
                  : 'border-transparent text-text-secondary hover:text-white'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Tab Contents with entry animations */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Analytics Charts */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Analytics metrics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
                  <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Total Users</p>
                  <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1">{summary.totalUsers}</h3>
                </div>
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
                  <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Active Listings</p>
                  <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1">{summary.totalEvents}</h3>
                </div>
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
                  <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Gross Sales (₹)</p>
                  <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1">₹{summary.totalRevenue.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl">
                  <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest font-display">Tickets Scanned</p>
                  <h3 className="text-3xl font-extrabold font-display tracking-wider text-white mt-1">{summary.totalTicketsSold}</h3>
                </div>
              </div>

              {/* Multi chart grids */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category volume pie chart */}
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl md:col-span-1 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Category Split</h3>
                    <span className="text-[9px] text-text-tertiary font-bold uppercase">Volume</span>
                  </div>
                  {pieChartData.length === 0 ? (
                    <p className="text-xs text-text-tertiary py-12 text-center">No categories recorded.</p>
                  ) : (
                    <>
                      <div className="h-40 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0B0B18', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-text-tertiary pt-2 border-t border-white/5">
                        {pieChartData.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-1 truncate">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                            <span className="truncate text-text-secondary">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Category Revenue bar chart */}
                <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Revenue per Category</h3>
                    <span className="text-[9px] text-text-tertiary font-bold uppercase">INR (₹)</span>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#0B0B18', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '10px' }} />
                        <Bar dataKey="Revenue" fill="#6C5CE7" radius={[4, 4, 0, 0]} barSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger ledger */}
              <div className="bg-es-surface border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Platform ledger feed</h3>
                  <span className="text-[9px] text-text-tertiary font-bold uppercase">Bookings feed</span>
                </div>
                {recentBookings.length === 0 ? (
                  <p className="text-xs text-text-tertiary py-8 text-center">No platform bookings logged.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {recentBookings.map((b) => (
                      <div key={b._id} className="flex justify-between items-center p-3 rounded-xl bg-es-void/50 border border-white/5 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span className="h-4.5 w-4.5 rounded-full bg-es-surface flex items-center justify-center text-[9px] uppercase font-mono border border-white/5">{(b.userId?.name || 'A').charAt(0)}</span>
                            {b.userId?.name || 'Attendee'}
                            <span className="text-[9px] text-text-tertiary font-normal">registered for</span>
                            <span className="font-semibold text-text-secondary truncate max-w-xs font-display uppercase tracking-wide">{b.eventId?.title || 'Unknown slot'}</span>
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-500">+₹{b.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: Attendees Suspension Console */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="max-w-md flex items-center gap-2 p-2 bg-es-surface border border-white/[0.06] rounded-xl shadow-2xl">
                <Search className="h-4 w-4 text-text-tertiary shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search attendees by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-text-tertiary"
                />
              </div>

              <div className="bg-es-surface border border-white/[0.06] rounded-2xl overflow-hidden text-xs shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAttendees.map((u) => (
                        <tr key={u._id} className="hover:bg-es-surface-raised/35">
                          <td className="p-4 font-bold text-white">{u.name}</td>
                          <td className="p-4 text-text-secondary font-medium">{u.email}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider font-mono ${
                              u.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-muted text-brand'
                            }`}>
                              {u.status === 'approved' ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                u.status === 'suspended'
                                  ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                  : 'border-brand/35 text-brand hover:bg-brand-muted hover:border-brand'
                              }`}
                            >
                              {u.status === 'suspended' ? 'Unsuspend' : 'Suspend Account'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Hosts Directory */}
          {(activeTab === 'organizer' || activeTab === 'organizers') && (
            <motion.div
              key="organizers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="max-w-md flex items-center gap-2 p-2 bg-es-surface border border-white/[0.06] rounded-xl shadow-2xl">
                <Search className="h-4 w-4 text-text-tertiary shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search hosts name or email..."
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-text-tertiary"
                />
              </div>

              <div className="bg-es-surface border border-white/[0.06] rounded-2xl overflow-hidden text-xs shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                        <th className="p-4">Host Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Decisions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrganizers.map((o) => (
                        <tr key={o._id} className="hover:bg-es-surface-raised/35">
                          <td className="p-4 font-bold text-white flex items-center gap-1.5 font-display uppercase tracking-wider">
                            <Briefcase className="h-3.5 w-3.5 text-text-tertiary" />
                            {o.name}
                          </td>
                          <td className="p-4 text-text-secondary font-medium">{o.email}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider font-mono ${
                              o.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                              o.status === 'pending_approval' ? 'bg-amber-500/10 text-amber-500' : 'bg-brand-muted text-brand'
                            }`}>
                              {o.status === 'approved' ? 'Verified Host' : o.status === 'pending_approval' ? 'Pending Approval' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleSuspend(o)}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                o.status === 'suspended'
                                  ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                  : 'border-brand/35 text-brand hover:bg-brand-muted hover:border-brand'
                              }`}
                            >
                              {o.status === 'suspended' ? 'Unsuspend Host' : 'Suspend Host'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Verifications approvals Queue */}
          {activeTab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-es-surface border border-white/[0.06] rounded-2xl overflow-hidden text-xs shadow-2xl">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Host Verifications Queue</h3>
                  <span className="px-2.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-500 font-mono">
                    Queue: {pendingOrganizers.length}
                  </span>
                </div>
                
                {pendingOrganizers.length === 0 ? (
                  <div className="p-12 text-center space-y-3 max-w-sm mx-auto font-light text-text-tertiary text-xs">
                    <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
                    <p>All host registrations verified. Queue is empty.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Applied Date</th>
                          <th className="p-4 text-center">Decisions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pendingOrganizers.map((o) => (
                          <tr key={o._id} className="hover:bg-es-surface-raised/35">
                            <td className="p-4 font-bold text-white">{o.name}</td>
                            <td className="p-4 text-text-secondary font-medium">{o.email}</td>
                            <td className="p-4 text-text-tertiary font-medium font-mono">{formatDate(o.createdAt)}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOrganizerApproval(o._id, 'approve')}
                                  className="p-1.5 rounded border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-500 cursor-pointer"
                                  title="Approve Host"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleOrganizerApproval(o._id, 'reject')}
                                  className="p-1.5 rounded border border-brand/35 hover:bg-brand-muted text-brand cursor-pointer"
                                  title="Reject Host"
                                >
                                  <X className="h-4 w-4" />
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
            </motion.div>
          )}

          {/* TAB 5: Event Moderation */}
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="max-w-md flex items-center gap-2 p-2 bg-es-surface border border-white/[0.06] rounded-xl shadow-2xl">
                <Search className="h-4 w-4 text-text-tertiary shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search listings by title, category, or organizer..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-text-tertiary"
                />
              </div>

              <div className="bg-es-surface border border-white/[0.06] rounded-2xl overflow-hidden text-xs shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-es-surface-raised/40 text-text-tertiary uppercase font-bold border-b border-white/5">
                        <th className="p-4">Title</th>
                        <th className="p-4">Organizer</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4 text-center">Takedown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredEvents.map((e) => (
                        <tr key={e._id} className="hover:bg-es-surface-raised/35">
                          <td className="p-4 font-bold text-white font-display uppercase tracking-wider">{e.title}</td>
                          <td className="p-4 text-text-secondary font-medium">{e.organizerId?.name || 'N/A'}</td>
                          <td className="p-4 uppercase text-text-tertiary font-bold tracking-wider">{e.category}</td>
                          <td className="p-4 text-text-secondary font-bold font-mono">{e.price === 0 ? 'Free' : `₹${e.price}`}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleModeratorTakedown(e._id)}
                              className="px-3 py-1.5 rounded-lg border border-brand/35 hover:bg-brand-muted text-brand inline-flex items-center gap-1 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                              title="Takedown Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Takedown
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: Reports & CSV Exporters */}
          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl md:col-span-2 space-y-6">
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">System Audit Report</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="p-4 rounded-xl bg-es-void border border-white/5">
                    <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Average Ticket Price</p>
                    <p className="text-lg font-bold font-mono text-white mt-1">₹{averageTicketPrice}</p>
                    <span className="text-[9px] text-text-tertiary block mt-1">Gross / volume ratio</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-es-void border border-white/5">
                    <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Reservations Ratio</p>
                    <p className="text-lg font-bold font-mono text-white mt-1">{seatsReservationRatio}%</p>
                    <span className="text-[9px] text-text-tertiary block mt-1">Tickets sold vs capacity</span>
                  </div>

                  <div className="p-4 rounded-xl bg-es-void border border-white/5">
                    <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Host to Attendee Ratio</p>
                    <p className="text-lg font-bold font-mono text-white mt-1">{hostToAttendeeRatio}</p>
                    <span className="text-[9px] text-text-tertiary block mt-1">Active hosts vs attendees</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-es-void border border-white/5 text-xs text-text-secondary leading-relaxed font-light font-body">
                  <strong>Administrative Audit:</strong> The average ticket pricing metric is dynamically updated based on paid bookings. Refund transactions are compiled locally. Audit logs do not reflect mock test balances.
                </div>
              </div>

              {/* Data exports */}
              <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl md:col-span-1 space-y-6">
                <div className="pb-3 border-b border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Data Exports</h3>
                </div>

                <p className="text-xs text-text-secondary font-light leading-relaxed">
                  Generate and compile platform statistics. CSV exports contain complete system records.
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <button
                    onClick={handleExportUsersCSV}
                    className="w-full px-4 py-3.5 font-bold rounded-xl border border-white/5 bg-es-void hover:bg-es-surface-raised hover:text-white text-text-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-[10px]"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-text-tertiary" />
                    Export Users List
                  </button>

                  <button
                    onClick={handleExportTransactionsCSV}
                    className="w-full px-4 py-3.5 font-bold rounded-xl border border-white/5 bg-es-void hover:bg-es-surface-raised hover:text-white text-text-secondary transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-[10px]"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-text-tertiary" />
                    Export Ledger Sheet
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>
    </motion.div>
  );
};

export default AdminDashboard;
