import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  Star, 
  ArrowUpRight, 
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const EventCard = ({ event, onSaveToggle, variant = 'default' }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(() => {
    return user?.savedEvents?.includes(event._id) || false;
  });
  const [loadingSave, setLoadingSave] = useState(false);

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const backendUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
      return `${backendUrl}${normalized}`;
    }
    return url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'attendee') return;

    setLoadingSave(true);
    try {
      const { data } = await axios.post(`/events/${event._id}/save`);
      if (data.success) {
        setIsSaved(data.saved);
        await refreshUser();
        if (onSaveToggle) onSaveToggle(event._id, data.saved);
      }
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    } finally {
      setIsSaved(prev => !prev); // Fallback for offline demo mode toggle
      setLoadingSave(false);
    }
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateFormatted} · ${timeFormatted}`;
  };

  const available = typeof event.availableTickets === 'number' ? event.availableTickets : event.totalTickets || 100;
  const isSoldOut = available <= 0;
  const isAlmostGone = available > 0 && available <= 10;
  const ratingVal = event.rating || (4.5 + (event.title.charCodeAt(0) % 5) / 10).toFixed(1);

  // Dynamic colors for category specific borders / text elements
  const categoryThemes = {
    Music: { glow: 'group-hover:border-brand/40', text: 'text-brand', badge: 'bg-brand/10 text-brand border-brand/20' },
    Tech: { glow: 'group-hover:border-accent/45', text: 'text-accent', badge: 'bg-accent/10 text-accent border-accent/20' },
    Art: { glow: 'group-hover:border-rose-500/40', text: 'text-rose-450', badge: 'bg-rose-500/10 text-rose-450 border-rose-500/20' },
    Sports: { glow: 'group-hover:border-amber-500/40', text: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    Business: { glow: 'group-hover:border-indigo-400/40', text: 'text-indigo-400', badge: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20' },
    Food: { glow: 'group-hover:border-orange-500/40', text: 'text-orange-500', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20' }
  };
  const theme = categoryThemes[event.category] || { glow: 'group-hover:border-brand/30', text: 'text-brand', badge: 'bg-brand/10 text-brand border-brand/20' };

  // ==========================================
  // VARIANT 1: COMPACT EVENT CARD
  // ==========================================
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        className="group relative rounded-2xl bg-es-surface border border-white/[0.05] overflow-hidden flex flex-col h-full hover:border-white/10 transition-all text-xs"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-es-void shrink-0">
          <img
            src={getImageUrl(event.bannerUrl)}
            alt={event.title}
            className="w-full h-full object-cover brightness-[0.7] group-hover:scale-102 transition-transform duration-500"
          />
          <span className="absolute bottom-2.5 left-2.5 bg-es-void/90 border border-white/5 text-[9px] font-mono px-2 py-0.5 rounded text-white font-bold">
            {event.price === 0 ? 'Free' : `₹${event.price}`}
          </span>
          {(!user || user.role === 'attendee') && (
            <button
              onClick={handleSave}
              disabled={loadingSave}
              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-es-void/80 border border-white/5 text-text-tertiary hover:text-brand transition-colors cursor-pointer"
            >
              {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 text-brand fill-brand" /> : <Bookmark className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-text-tertiary">
              <span>{event.category}</span>
              <span className="flex items-center gap-0.5 text-signal font-semibold"><Star className="h-3 w-3 fill-signal text-signal" /> {ratingVal}</span>
            </div>
            <h4 className="font-bold text-white line-clamp-1 leading-tight group-hover:text-brand transition-colors font-display uppercase tracking-wide">
              <Link to={`/event/${event._id}`}>{event.title}</Link>
            </h4>
            <p className="text-[10px] text-text-secondary leading-none flex items-center gap-1">
              <Calendar className="h-3 w-3 text-brand" />
              {formatDateTime(event.startDate)}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
            <span className="text-[9px] text-text-tertiary truncate max-w-[60%]">{event.location}</span>
            <Link to={`/event/${event._id}`} className="text-[9px] font-bold text-brand uppercase hover:underline flex items-center gap-0.5">
              Pass <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 2: HORIZONTAL EVENT CARD
  // ==========================================
  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-25px" }}
        className="group relative rounded-3xl bg-es-surface border border-white/[0.05] overflow-hidden flex flex-col sm:flex-row h-full hover:border-white/10 transition-all text-xs"
      >
        {/* Left Side: Thumbnail */}
        <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden bg-es-void relative shrink-0">
          <img
            src={getImageUrl(event.bannerUrl)}
            alt={event.title}
            className="w-full h-full object-cover brightness-[0.7] group-hover:scale-102 transition-transform duration-500"
          />
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${theme.badge}`}>
            {event.category}
          </span>
          <span className="absolute bottom-3 left-3 bg-es-void/95 border border-white/5 font-mono text-[10px] px-2.5 py-0.5 rounded text-white font-bold">
            {event.price === 0 ? 'Free' : `₹${event.price}`}
          </span>
        </div>

        {/* Right Side: Details */}
        <div className="sm:w-3/5 p-5 flex flex-col justify-between flex-grow space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-mono text-text-tertiary">
              <span>{event.organizerId?.name || 'Curator Guild'}</span>
              <div className="flex items-center gap-0.5 text-signal font-semibold">
                <Star className="h-3 w-3 fill-signal text-signal" />
                <span>{ratingVal}</span>
              </div>
            </div>

            <h3 className="font-display text-base font-extrabold uppercase text-white tracking-wide line-clamp-1 leading-snug group-hover:text-brand transition-colors">
              <Link to={`/event/${event._id}`}>{event.title}</Link>
            </h3>

            <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 font-light">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-text-tertiary">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-brand" /> {formatDateTime(event.startDate)}</span>
              <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin className="h-3.5 w-3.5 text-brand" /> {event.location}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center gap-4">
            <div className="text-[9px] font-mono font-bold uppercase">
              {isSoldOut ? (
                <span className="text-brand">Sold out</span>
              ) : isAlmostGone ? (
                <span className="text-signal animate-pulse">Only {available} left</span>
              ) : (
                <span className="text-text-tertiary font-semibold">{available} seats left</span>
              )}
            </div>

            <Link
              to={`/event/${event._id}`}
              className="btn-secondary py-2 px-5 text-[9px] font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1 cursor-pointer"
            >
              Book Pass <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 3: LARGE POSTER CARD (Image dominated)
  // ==========================================
  if (variant === 'poster') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        className="group relative rounded-3xl bg-es-void border border-white/[0.05] overflow-hidden aspect-[3/4.2] flex flex-col justify-end p-5 hover:border-white/10 transition-all text-xs"
      >
        <img
          src={getImageUrl(event.bannerUrl)}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.55] group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-es-void via-es-void/70 to-transparent z-10 pointer-events-none" />

        {/* Overlay Badges */}
        <span className="absolute top-4 left-4 bg-brand/10 border border-brand/20 text-brand px-2.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-bold z-20">
          {event.category}
        </span>

        {(!user || user.role === 'attendee') && (
          <button
            onClick={handleSave}
            disabled={loadingSave}
            className="absolute top-4 right-4 p-2 rounded-xl bg-es-void/85 border border-white/5 text-text-tertiary hover:text-brand transition-colors cursor-pointer z-20"
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4 text-brand fill-brand" /> : <Bookmark className="h-4 w-4" />}
          </button>
        )}

        <div className="relative z-20 space-y-3.5">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-widest block">{event.organizerId?.name || 'Curator Guild'}</span>
            <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight line-clamp-2">
              <Link to={`/event/${event._id}`}>{event.title}</Link>
            </h3>
          </div>

          <div className="text-[10px] text-text-secondary space-y-1 font-medium">
            <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand" /> {formatDateTime(event.startDate)}</p>
            <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 text-brand" /> {event.location}</p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[7px] uppercase font-bold text-text-tertiary">Booking Rate</p>
              <p className="font-mono text-xs font-bold text-white mt-0.5">{event.price === 0 ? 'Free' : `₹${event.price}`}</p>
            </div>
            <Link
              to={`/event/${event._id}`}
              className="btn-primary py-2 px-4 text-[9px] font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1 shadow-sm"
            >
              Get Pass
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 4: MAGAZINE STYLE CARD
  // ==========================================
  if (variant === 'magazine') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        className={`group relative rounded-2xl bg-es-surface border border-white/[0.05] p-5 flex flex-col justify-between h-full transition-all duration-300 ${theme.glow}`}
      >
        <div className="space-y-4">
          {/* Asymmetric offset image block */}
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-es-void border border-white/5">
            <img
              src={getImageUrl(event.bannerUrl)}
              alt={event.title}
              className="w-full h-full object-cover brightness-[0.75] group-hover:scale-102 transition-transform duration-500"
            />
            <span className="absolute top-2.5 left-2.5 bg-es-void/90 text-white font-mono text-[9px] px-2 py-0.5 rounded border border-white/5 font-bold">
              {event.price === 0 ? 'Free' : `₹${event.price}`}
            </span>
          </div>

          {/* Bold typography layout */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest text-text-tertiary">
              <span className={`font-bold ${theme.text}`}>{event.category}</span>
              <span>{event.organizerId?.name || 'Host'}</span>
            </div>

            <h3 className="font-display text-base font-extrabold uppercase tracking-tight text-white leading-tight group-hover:text-brand transition-colors line-clamp-2">
              <Link to={`/event/${event._id}`}>{event.title}</Link>
            </h3>

            <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2 font-light italic pr-2">
              "{event.description}"
            </p>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono font-medium">
          <span className="flex items-center gap-1 text-text-secondary"><Calendar className="h-3.5 w-3.5 text-brand" /> {new Date(event.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
          <Link to={`/event/${event._id}`} className="text-[9px] font-bold text-brand uppercase tracking-wider flex items-center gap-0.5">
            Pass Details &rarr;
          </Link>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 5: FEATURED FESTIVAL CARD (Ticket stub ornaments)
  // ==========================================
  if (variant === 'festival') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-25px" }}
        className="group relative rounded-3xl bg-es-surface border border-white/[0.06] overflow-hidden flex flex-col h-full hover:border-brand/30 transition-all shadow-xl"
      >
        {/* Top visual */}
        <div className="relative aspect-[16/10.5] w-full overflow-hidden bg-es-void">
          <img
            src={getImageUrl(event.bannerUrl)}
            alt={event.title}
            className="w-full h-full object-cover brightness-[0.7] group-hover:scale-102 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 bg-[#EC4856]/15 border border-[#EC4856]/30 text-[#EC4856] px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-bold">
            ON STAGE TONIGHT
          </span>
          <span className="absolute bottom-3 left-3 bg-es-void/90 text-white font-mono text-[10px] px-2.5 py-0.5 rounded border border-white/5 font-bold">
            {event.price === 0 ? 'Free' : `₹${event.price}`}
          </span>
        </div>

        {/* Dashed ticket divider with circle cutouts */}
        <div className="relative h-px border-t border-dashed border-white/10 my-1 shrink-0">
          <div className="absolute -top-3 -left-3.5 h-6 w-6 rounded-full bg-es-void border-r border-white/5" />
          <div className="absolute -top-3 -right-3.5 h-6 w-6 rounded-full bg-es-void border-l border-white/5" />
        </div>

        {/* Bottom details */}
        <div className="p-5 flex flex-col justify-between flex-grow space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-mono text-text-tertiary">
              <span className="uppercase">{event.category} FESTIVAL</span>
              <span className="flex items-center gap-0.5 text-signal font-semibold"><Star className="h-3 w-3 fill-signal text-signal" /> {ratingVal}</span>
            </div>
            
            <h3 className="font-display text-base font-black uppercase text-white leading-tight tracking-wide group-hover:text-brand transition-colors line-clamp-1">
              <Link to={`/event/${event._id}`}>{event.title}</Link>
            </h3>

            <div className="text-[10px] text-text-secondary space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand" /> {formatDateTime(event.startDate)}</p>
              <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 text-brand" /> {event.location}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-brand font-bold uppercase">
              {isSoldOut ? 'Sold Out' : `Seats: ${available}`}
            </span>
            <Link
              to={`/event/${event._id}`}
              className="btn-primary py-2 px-5 text-[9px] font-bold uppercase tracking-wider rounded-xl shadow-glow-brand"
            >
              Get Ticket
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 6: EDITORIAL SPOTLIGHT CARD
  // ==========================================
  if (variant === 'editorial') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-es-surface group w-full"
      >
        {/* Left side: Immersive Magazine Image */}
        <div className="relative min-h-[380px] lg:col-span-7 bg-es-void overflow-hidden">
          <img
            src={getImageUrl(event.bannerUrl)}
            alt={event.title}
            className="w-full h-full object-cover opacity-75 lg:opacity-90 group-hover:scale-103 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-es-surface hidden lg:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-es-surface via-transparent to-transparent lg:hidden" />
          <span className="absolute top-6 left-6 px-3.5 py-1.5 text-[9px] font-bold rounded-lg bg-brand text-white border border-brand/20 uppercase tracking-widest font-mono">
            {event.category}
          </span>
        </div>

        {/* Right side: Asymmetric Overlapping Details Panel */}
        <div className="p-8 lg:p-12 lg:col-span-5 flex flex-col justify-between space-y-8 lg:-ml-12 bg-es-surface/95 backdrop-blur-xl border-l border-white/5 relative z-10 my-auto rounded-r-3xl text-xs font-semibold">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[9px] font-mono text-text-secondary uppercase tracking-widest">
              <span className="text-brand font-bold">Featured Event of the Month</span>
              <div className="flex items-center gap-1 text-signal">
                <Star className="h-3.5 w-3.5 fill-signal text-signal" />
                <span>{ratingVal}</span>
              </div>
            </div>

            <h3 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white leading-none tracking-tight">
              {event.title}
            </h3>

            <p className="text-xs text-text-secondary font-light leading-relaxed font-body">
              {event.description}
            </p>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-text-secondary">
                  <Calendar className="h-4 w-4 text-brand shrink-0" />
                  <span>{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-secondary">
                  <MapPin className="h-4 w-4 text-brand shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* Editorial Timeline Agenda */}
              <div className="border-l border-dashed border-brand/20 pl-4 space-y-2 text-[10px]">
                <p className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary mb-1">Pass Details</p>
                <div className="flex items-start gap-2 text-text-secondary">
                  <span className="font-mono text-brand font-bold">Host:</span>
                  <span className="truncate">{event.organizerId?.name || 'Curator Guild'}</span>
                </div>
                <div className="flex items-start gap-2 text-text-secondary">
                  <span className="font-mono text-brand font-bold">Avail:</span>
                  <span>{available} seats</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spotlight footer pricing & CTA */}
          <div className="flex items-center justify-between pt-5 border-t border-white/5">
            <div>
              <p className="text-[8px] uppercase font-bold text-text-tertiary">Booking Rate</p>
              <p className="text-2xl font-bold text-white font-display tracking-wider mt-1">
                {event.price === 0 ? 'Free Access' : `₹${event.price}`}
              </p>
            </div>
            <Link
              to={`/event/${event._id}`}
              className="btn-hero py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-glow-brand"
            >
              Book Pass
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // VARIANT 7: DEFAULT EVENT CARD (Fallback)
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col h-full card-interactive rounded-es-md overflow-hidden text-xs"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-es-void">
        <img
          src={getImageUrl(event.bannerUrl)}
          alt={event.title}
          className="h-full w-full object-cover brightness-[0.7] group-hover:brightness-[0.9] group-hover:scale-102 transition-all duration-500 ease-out"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-es-surface via-transparent to-transparent opacity-90" />

        <span className="badge badge-brand absolute top-3 left-3 backdrop-blur-sm">
          {event.category}
        </span>

        <span className="absolute bottom-3 left-3 font-mono text-overline bg-es-void/90 text-text-primary px-2.5 py-1 rounded-es-xs border border-es-border backdrop-blur-sm normal-case tracking-normal font-semibold">
          {event.price === 0 ? 'Free' : `₹${event.price}`}
        </span>

        {(!user || user.role === 'attendee') && (
          <button
            onClick={handleSave}
            disabled={loadingSave}
            className="absolute top-3 right-3 p-2 rounded-es-xs bg-es-void/90 border border-es-border text-text-tertiary hover:text-brand backdrop-blur-sm cursor-pointer z-10 transition-colors"
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4 text-brand fill-brand" /> : <Bookmark className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="flex flex-col flex-grow p-5 space-y-3 justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-overline text-text-disabled truncate max-w-[65%] normal-case tracking-normal font-medium font-mono">
              {event.organizerId?.name || 'Organizer'}
            </span>
            <div className="flex items-center gap-1 text-signal font-mono text-overline normal-case tracking-normal">
              <Star className="h-3 w-3 fill-signal text-signal shrink-0" />
              <span className="font-semibold">{ratingVal}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-caption text-text-tertiary">
            <Calendar className="h-3.5 w-3.5 text-brand shrink-0" />
            <span>{formatDateTime(event.startDate)}</span>
          </div>

          <h3 className="font-display text-[1rem] font-semibold text-text-primary uppercase tracking-wide leading-snug line-clamp-1 group-hover:text-brand transition-colors duration-normal">
            <Link to={`/event/${event._id}`}>{event.title}</Link>
          </h3>

          <p className="text-body-sm text-text-secondary line-clamp-2 leading-relaxed font-light">
            {event.description}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-es-border">
          <div className="text-overline normal-case tracking-normal font-mono font-bold text-text-tertiary">
            {isSoldOut ? (
              <span className="text-brand">Sold out</span>
            ) : isAlmostGone ? (
              <span className="text-signal animate-pulse">Only {available} left</span>
            ) : (
              <span>{available} seats remaining</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-text-tertiary max-w-[55%] truncate text-caption">
              <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
              {event.location}
            </span>
            <Link
              to={`/event/${event._id}`}
              className="btn-secondary py-2 px-4 text-overline rounded-es-sm"
            >
              View Pass
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
