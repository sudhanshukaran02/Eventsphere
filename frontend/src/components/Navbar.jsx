import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  Plus,
  Ticket,
  LayoutDashboard,
  Bookmark,
  Bell,
  ChevronDown,
  Compass,
  Layers,
  HelpCircle,
  Search,
  Sparkles
} from 'lucide-react';

const CATEGORIES = ['Music', 'Tech', 'Art', 'Sports', 'Business', 'Food'];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const categoriesRef = useRef(null);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Tickets Confirmed!', message: 'Your booking for EDM Night Festival is successful.', read: false, time: '2h ago' },
    { id: 2, title: 'New Event Alert', message: 'Rock Live Concert was just published.', read: false, time: '5h ago' },
    { id: 3, title: 'Welcome to EventSphere', message: 'Explore local concert experiences today!', read: true, time: '1d ago' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setShowCategoriesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowProfileDropdown(false);
    navigate('/login');
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const selectCategory = (cat) => {
    setShowCategoriesDropdown(false);
    setIsOpen(false);
    navigate(`/?category=${cat}`);
    const event = new CustomEvent('categorySelected', { detail: cat });
    window.dispatchEvent(event);
  };

  const focusSearch = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 300);
    } else {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  const dropdownMotion = {
    initial: { opacity: 0, y: 8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.96 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav transition-all duration-normal font-body">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo & Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-0.5 group shrink-0">
              <span className="font-display text-xl font-bold tracking-tight text-text-primary group-hover:opacity-80 transition-opacity">
                event
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-brand group-hover:opacity-80 transition-opacity">
                sphere
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className={`px-3 py-2 rounded-es-sm text-overline uppercase transition-all flex items-center gap-1.5 ${isActive('/') ? 'text-brand bg-brand-subtle' : 'text-text-secondary hover:text-text-primary'}`}>
                <Compass className="h-3.5 w-3.5" />
                Explore
              </Link>

              {/* Categories trigger */}
              <div className="relative" ref={categoriesRef}>
                <button
                  onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
                  className="px-3 py-2 rounded-es-sm text-overline uppercase transition-all flex items-center gap-1 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Categories
                  <ChevronDown className={`h-3 w-3 transition-transform duration-normal ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showCategoriesDropdown && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute left-0 mt-2 w-48 glass-panel rounded-es-md p-1.5 z-50"
                    >
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => selectCategory(cat)}
                          className="w-full text-left px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Organizers Link */}
              <Link
                to={user?.role === 'organizer' || user?.role === 'admin' ? '/organizer-dashboard' : '/register?role=organizer'}
                className="px-3 py-2 rounded-es-sm text-overline uppercase transition-all flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                For Organizers
              </Link>

              {/* About Link */}
              <button
                onClick={() => {
                  const element = document.getElementById('statistics-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="px-3 py-2 rounded-es-sm text-overline uppercase transition-all flex items-center gap-1.5 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                About
              </button>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">

            {/* Search Button */}
            <button
              onClick={focusSearch}
              className="p-2.5 rounded-es-sm border border-es-border hover:bg-es-surface-overlay text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              title="Search events"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications Popover */}
            {isAuthenticated && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-es-sm border border-es-border hover:bg-es-surface-overlay text-text-tertiary hover:text-text-primary transition-colors relative cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand pulse-brand" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute right-0 mt-2 w-80 glass-panel rounded-es-lg z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-es-border flex justify-between items-center">
                        <span className="text-overline text-text-primary uppercase">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-overline text-brand hover:underline cursor-pointer">
                            Mark read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-es-border">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }}
                            className={`p-3.5 space-y-1 hover:bg-es-surface-overlay transition-colors cursor-pointer ${notif.read ? 'opacity-50' : 'bg-brand-subtle'}`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-caption text-text-primary font-semibold">{notif.title}</span>
                              <span className="text-overline text-text-disabled">{notif.time}</span>
                            </div>
                            <p className="text-overline text-text-tertiary font-normal normal-case tracking-normal leading-relaxed">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1 px-2 rounded-es-full border border-es-border hover:bg-es-surface-overlay transition-colors cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-brand text-white flex items-center justify-center font-body font-bold text-xs uppercase shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="h-3 w-3 text-text-disabled" />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      {...dropdownMotion}
                      className="absolute right-0 mt-2 w-56 glass-panel rounded-es-lg p-1.5 z-50"
                    >
                      <div className="p-3 border-b border-es-border mb-1">
                        <p className="text-caption text-text-primary font-semibold truncate">{user.name}</p>
                        <p className="text-overline text-text-disabled truncate mt-0.5 normal-case tracking-normal font-normal">{user.email}</p>
                        <span className="badge badge-brand mt-2 inline-block">
                          {user.role}
                        </span>
                      </div>

                      {user.role === 'attendee' && (
                        <>
                          <Link
                            to="/my-bookings"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <Ticket className="h-3.5 w-3.5 text-brand" />
                            My Tickets
                          </Link>
                          <Link
                            to="/saved"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <Bookmark className="h-3.5 w-3.5 text-brand" />
                            Saved Events
                          </Link>
                        </>
                      )}

                      {user.role === 'organizer' && (
                        <>
                          <Link
                            to="/organizer-dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5 text-brand" />
                            Dashboard
                          </Link>
                          <Link
                            to="/create-event"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-brand" />
                            Create Event
                          </Link>
                        </>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin-dashboard"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-es-surface-overlay text-caption text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5 text-accent" />
                          Admin Console
                        </Link>
                      )}

                      <div className="h-px bg-es-border my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-es-sm hover:bg-danger-muted text-caption text-danger transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost py-2 px-4 text-overline">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-overline">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-es-sm text-text-tertiary hover:bg-es-surface-overlay cursor-pointer transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-es-border glass-panel px-4 py-3 space-y-2 overflow-hidden"
          >
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
              Explore Events
            </Link>

            <div className="px-3 py-1 space-y-1.5">
              <p className="text-overline text-text-disabled uppercase">Categories</p>
              <div className="grid grid-cols-3 gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className="py-1.5 px-2 rounded-es-xs bg-es-surface hover:bg-es-surface-overlay text-overline text-text-secondary text-center transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated && (
              <div className="pt-2 border-t border-es-border space-y-1">
                {user.role === 'attendee' && (
                  <>
                    <Link to="/my-bookings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
                      <Ticket className="h-4 w-4 text-brand" /> My Tickets
                    </Link>
                    <Link to="/saved" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
                      <Bookmark className="h-4 w-4 text-brand" /> Saved
                    </Link>
                  </>
                )}

                {user.role === 'organizer' && (
                  <>
                    <Link to="/organizer-dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
                      <LayoutDashboard className="h-4 w-4 text-brand" /> Dashboard
                    </Link>
                    <Link to="/create-event" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
                      <Plus className="h-4 w-4 text-brand" /> Create Event
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <Link to="/admin-dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-es-sm text-text-secondary hover:bg-es-surface-overlay text-caption transition-colors">
                    <LayoutDashboard className="h-4 w-4 text-accent" /> Admin Panel
                  </Link>
                )}

                <div className="pt-3 border-t border-es-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center font-body font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-caption text-text-primary font-semibold leading-tight">{user.name}</p>
                      <p className="text-overline text-text-disabled mt-0.5 normal-case tracking-normal font-normal">{user.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-es-xs border border-danger-muted text-danger hover:bg-danger-muted text-overline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Logout
                  </button>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="pt-2 border-t border-es-border flex gap-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 btn-secondary py-2 text-center text-overline">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1 btn-primary py-2 text-center text-overline">
                  Sign Up
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
