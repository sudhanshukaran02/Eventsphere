import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import EventCard from '../components/EventCard';
import { demoEvents } from '../utils/demoEvents';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Calendar,
  Music,
  Cpu,
  Palette,
  Trophy,
  Briefcase,
  UtensilsCrossed,
  Sparkles,
  Star,
  ArrowRight,
  Mail,
  CheckCircle2,
  TrendingUp,
  Compass,
  ChevronDown,
  ShieldCheck,
  Zap,
  Ticket,
  Award,
  ChevronRight,
  Flame,
  Quote
} from 'lucide-react';

const CATEGORIES = ['All', 'Music', 'Tech', 'Art', 'Sports', 'Business', 'Food'];

const CATEGORY_META = {
  Music: { gradient: 'from-purple-650 to-indigo-700', icon: Music, glow: 'rgba(138,43,226,0.3)', size: 'lg:col-span-2' },
  Tech: { gradient: 'from-blue-650 to-cyan-500', icon: Cpu, glow: 'rgba(41,121,255,0.3)', size: 'lg:col-span-2' },
  Art: { gradient: 'from-red-600 to-pink-500', icon: Palette, glow: 'rgba(255,82,119,0.3)', size: 'lg:col-span-1' },
  Sports: { gradient: 'from-amber-600 to-yellow-500', icon: Trophy, glow: 'rgba(255,214,0,0.3)', size: 'lg:col-span-1' },
  Business: { gradient: 'from-violet-650 to-indigo-650', icon: Briefcase, glow: 'rgba(99,102,241,0.3)', size: 'lg:col-span-3' },
  Food: { gradient: 'from-orange-600 to-amber-500', icon: UtensilsCrossed, glow: 'rgba(255,61,0,0.3)', size: 'lg:col-span-3' },
  Other: { gradient: 'from-slate-700 to-slate-800', icon: Sparkles, glow: 'rgba(148,163,184,0.3)', size: 'lg:col-span-1' }
};

const POPULAR_CITIES = [
  { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=800&q=80', count: 12, quote: "The pulse of Bollywood and midnight arenas." },
  { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', count: 9, quote: "Where code meets live acoustic concerts." },
  { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', count: 8, quote: "Grand heritage meetups and massive expo fields." },
  { name: 'Goa', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', count: 14, quote: "Sun-drenched stages and electronic beach nights." },
  { name: 'Pune', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', count: 6, quote: "Intimate indie gigs and cultural student fests." }
];

const TOP_ORGANIZERS = [
  { name: 'Sub Bass Records', role: 'Music promoter', events: 14, followers: '2.5K', avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&q=80', color: 'from-purple-650 to-pink-500' },
  { name: 'Neo Bangalore Devs', role: 'Conferences host', events: 9, followers: '1.8K', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', color: 'from-blue-650 to-cyan-500' },
  { name: 'Apex Curators Guild', role: 'Art exhibitions', events: 8, followers: '1.2K', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', color: 'from-red-600 to-orange-500' },
  { name: 'Rock Arena Group', role: 'Live gigs creator', events: 12, followers: '3.1K', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', color: 'from-amber-600 to-yellow-500' },
  { name: 'Sun and Sand Feasts', role: 'Food & nightlife', events: 11, followers: '2.2K', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', color: 'from-green-600 to-teal-500' }
];

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priceMode, setPriceMode] = useState('All'); // 'All', 'Free', 'Paid'

  const [showFilters, setShowFilters] = useState(false);
  const [isUsingDemo, setIsUsingDemo] = useState(false);

  // Pagination / Load More State
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      setCategory(urlCategory);
    }
  }, [searchParams]);

  useEffect(() => {
    setVisibleCount(6);
    fetchEvents();
  }, [category, priceMode]);

  useEffect(() => {
    const handleCategorySelected = (e) => {
      const selectedCat = e.detail;
      setCategory(selectedCat);
      const element = document.getElementById('events-display-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('categorySelected', handleCategorySelected);
    return () => window.removeEventListener('categorySelected', handleCategorySelected);
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    setIsUsingDemo(false);
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (search) params.search = search;
      if (location) params.location = location;

      if (priceMode === 'Free') {
        params.maxPrice = 0;
      } else if (priceMode === 'Paid') {
        params.minPrice = 1;
      } else {
        if (minPrice) params.minPrice = Number(minPrice);
        if (maxPrice) params.maxPrice = Number(maxPrice);
      }

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axios.get('/events', { params });
      if (data.success) {
        if (data.events.length === 0 && !search && !location && !minPrice && !maxPrice && !startDate && !endDate && category === 'All' && priceMode === 'All') {
          setEvents(demoEvents);
          setIsUsingDemo(true);
        } else {
          setEvents(data.events);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Querying local EventSphere offline sandbox.');

      let localFiltered = [...demoEvents];
      if (category !== 'All') {
        localFiltered = localFiltered.filter(e => e.category === category);
      }
      if (search) {
        localFiltered = localFiltered.filter(e =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (location) {
        localFiltered = localFiltered.filter(e => e.location.toLowerCase().includes(location.toLowerCase()));
      }
      if (priceMode === 'Free') {
        localFiltered = localFiltered.filter(e => e.price === 0);
      } else if (priceMode === 'Paid') {
        localFiltered = localFiltered.filter(e => e.price > 0);
      } else {
        if (minPrice) localFiltered = localFiltered.filter(e => e.price >= Number(minPrice));
        if (maxPrice) localFiltered = localFiltered.filter(e => e.price <= Number(maxPrice));
      }
      if (startDate) {
        localFiltered = localFiltered.filter(e => new Date(e.startDate) >= new Date(startDate));
      }
      if (endDate) {
        localFiltered = localFiltered.filter(e => new Date(e.startDate) <= new Date(endDate));
      }

      setEvents(localFiltered);
      setIsUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setVisibleCount(6);
    fetchEvents();
    const element = document.getElementById('events-display-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setPriceMode('All');
    setSearchParams({});
    setVisibleCount(6);

    setLoading(true);
    axios.get('/events')
      .then(({ data }) => {
        if (data.success) {
          if (data.events.length === 0) {
            setEvents(demoEvents);
            setIsUsingDemo(true);
          } else {
            setEvents(data.events);
            setIsUsingDemo(false);
          }
        }
      })
      .catch(() => {
        setEvents(demoEvents);
        setIsUsingDemo(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setLoadingMore(false);
    }, 400);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterSuccess(false);
    }, 4000);
  };

  const triggerCitySearch = (cityName) => {
    setLocation(cityName);
    setCategory('All');
    setPriceMode('All');
    setVisibleCount(6);

    setTimeout(() => {
      const element = document.getElementById('events-display-section');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    setLoading(true);
    axios.get('/events')
      .then(({ data }) => {
        if (data.success) {
          const list = data.events.length === 0 ? demoEvents : data.events;
          const filtered = list.filter(e => e.location.toLowerCase().includes(cityName.toLowerCase()));
          setEvents(filtered);
        }
      })
      .catch(() => {
        const filtered = demoEvents.filter(e => e.location.toLowerCase().includes(cityName.toLowerCase()));
        setEvents(filtered);
        setIsUsingDemo(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const featuredEvent = events[0] || demoEvents[0];
  const trendingEvents = events.slice(0, 4).length >= 2 ? events.slice(0, 4) : demoEvents.slice(0, 4);
  const displayedEvents = events.slice(0, visibleCount);
  const hasMore = events.length > visibleCount;

  return (
    <div className="min-h-screen bg-[#04040C] text-[#F1F1F6] relative overflow-x-hidden font-body">
      
      {/* BACKGROUND DECORATIVE PATTERNS (Grid, Mesh Glows) */}
      <div className="absolute top-0 left-0 w-full h-[150vh] bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none z-0" />
      <div className="absolute top-[15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(236,72,86,0.1)_0%,transparent_70%)] blur-[90px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-10%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.08)_0%,transparent_70%)] blur-[100px] pointer-events-none z-0" />

      {/* 1. ASYMMETRICAL EDITORIAL SPLIT-SCREEN HERO SECTION */}
      <section className="relative min-h-[92vh] flex flex-col justify-center pt-24 pb-12 px-6 sm:px-12 lg:px-24 overflow-hidden z-10">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          
          {/* Hero Left: Monolith Typography Element */}
          <div className="lg:col-span-7 space-y-8 flex flex-col justify-center text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 text-overline text-brand tracking-widest font-black font-mono"
            >
              <Flame className="h-4 w-4 animate-pulse text-brand" /> THE BACKSTAGE PASS TO CULTURE
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl font-black leading-[0.85] uppercase tracking-tighter text-white">
                FEEL THE <br />
                <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(241,241,246,0.7)" }}>ELECTRIC</span> <br />
                <span className="text-gradient-brand">ENERGY.</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-text-secondary text-sm sm:text-base md:text-lg max-w-xl font-light leading-relaxed font-body pr-4"
            >
              Step into the lights. We connect seekers of concerts, music festivals, design conferences, and secret culinary gatherings directly to certified curators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              <button
                onClick={() => {
                  const element = document.getElementById('events-display-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="btn-hero py-4 px-10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-glow-brand cursor-pointer"
              >
                Discover Passes
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <Link
                to="/register?role=organizer"
                className="btn-secondary py-4 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center border border-es-border hover:border-brand/40 text-text-secondary hover:text-white transition-all bg-es-surface/25 rounded-xl"
              >
                Host an Experience
              </Link>
            </motion.div>
          </div>

          {/* Hero Right: Overlapping Visual Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[400px] aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-es-void group"
            >
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
                alt="Live energy event"
                className="w-full h-full object-cover brightness-[0.4] group-hover:scale-103 transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-es-void via-transparent to-transparent" />
              
              {/* Asymmetric Overlapping Details Tag */}
              <div className="absolute top-6 left-6 flex flex-col gap-1 items-start">
                <span className="px-2 py-0.5 rounded text-[8px] tracking-widest uppercase font-bold bg-[#EC4856]/15 border border-[#EC4856]/30 text-[#EC4856] font-mono">
                  ON STAGE TONIGHT
                </span>
                <p className="font-display text-white text-lg font-bold tracking-wide uppercase mt-1">THE EDM SESSIONS</p>
              </div>
            </motion.div>

            {/* Overlapping Floating Ticket Card */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-8 -left-4 sm:-left-12 lg:-left-16 p-6 rounded-2xl glass-panel border border-white/15 shadow-2xl max-w-[280px] space-y-4 bg-es-surface/90 backdrop-blur-xl"
            >
              <div className="flex justify-between items-center text-[9px] font-mono text-text-tertiary">
                <span>PASS #2806</span>
                <span className="text-brand font-bold uppercase tracking-wider">LIMITED SEATS</span>
              </div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
                EDM Night Festival 2026
              </h3>
              <div className="space-y-1.5 text-caption text-text-secondary font-medium">
                <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-brand" /> Oct 21-22, 2026</p>
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand" /> Mumbai, India</p>
              </div>

              {/* Barcode Ornament */}
              <div className="pt-2 flex flex-col items-center gap-1 opacity-45">
                <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,currentColor,currentColor_2px,transparent_2px,transparent_6px)] text-text-secondary" />
                <span className="font-mono text-[7px] text-text-tertiary tracking-widest leading-none">ES-9806-2026</span>
              </div>

              <div className="pt-3.5 border-t border-es-border flex justify-between items-center gap-4">
                <div>
                  <p className="text-[8px] uppercase font-bold text-text-tertiary">Starting at</p>
                  <p className="font-display font-bold text-white text-base">₹999</p>
                </div>
                <Link to="/event/demo-event-1" className="btn-primary py-2 px-4 rounded-lg text-[9px] tracking-wider uppercase font-bold shadow-sm">
                  Get Pass
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 2. THE SEARCH & FILTER CONSOLE (Clean, Dashboard style) */}
      <section className="relative z-20 -mt-6 max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-es-surface border border-white/[0.08] rounded-3xl p-5 shadow-2xl relative"
        >
          <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            
            {/* Find Experience */}
            <div className="space-y-1 px-2 md:border-r border-white/5">
              <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Find Experience</label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-brand shrink-0" />
                <input
                  type="text"
                  placeholder="Concerts, summits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-text-tertiary font-bold"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1 px-2 lg:border-r border-white/5">
              <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">City / Where</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand shrink-0" />
                <input
                  type="text"
                  placeholder="Mumbai, Goa..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-text-tertiary font-bold"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1 px-2 lg:border-r border-white/5">
              <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-text-secondary focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-es-surface text-white">{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

            {/* Price Option */}
            <div className="space-y-1 px-2 lg:border-r border-white/5">
              <label className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Cost Option</label>
              <select
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value)}
                className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-text-secondary focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-es-surface text-white">All Options</option>
                <option value="Free" className="bg-es-surface text-white">Free Access</option>
                <option value="Paid" className="bg-es-surface text-white">Paid Passes</option>
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                  showFilters ? 'bg-brand/10 text-brand border-brand/35' : 'border-white/5 text-text-tertiary hover:bg-white/5'
                }`}
                title="Detailed filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>

              <button
                type="submit"
                className="flex-1 btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Query
              </button>
            </div>

          </form>

          {/* Collapsible Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-5 mt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-4"
              >
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">Min Budget (₹)</label>
                  <input
                    type="number"
                    disabled={priceMode === 'Free'}
                    placeholder={priceMode === 'Free' ? 'Free only' : 'Min Price'}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="form-input text-xs py-2.5 rounded-lg disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">Max Budget (₹)</label>
                  <input
                    type="number"
                    disabled={priceMode === 'Free'}
                    placeholder={priceMode === 'Free' ? 'Free only' : 'Max Price'}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="form-input text-xs py-2.5 rounded-lg disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input text-xs py-2.5 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input text-xs py-2.5 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                  <button type="button" onClick={clearFilters} className="btn-secondary text-[10px] py-2 px-5 rounded-lg cursor-pointer">
                    Clear
                  </button>
                  <button type="button" onClick={fetchEvents} className="btn-primary text-[10px] py-2 px-5 rounded-lg cursor-pointer">
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* 3. EXPERIENCE SPOTLIGHT: EDITORIAL MAGAZINE SPLIT SECTION */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="flex items-center gap-3 mb-10">
          <span className="p-2 rounded-lg bg-brand-muted text-brand border border-brand/20">
            <Award className="h-5 w-5" />
          </span>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">Experience Spotlight</h2>
        </div>

        {featuredEvent && (
          <EventCard event={featuredEvent} variant="editorial" />
        )}
      </section>

      {/* 4. TRENDING THIS WEEK: KINETIC HORIZONTAL SCROLL ROW */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-brand-muted text-brand border border-brand/20">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">Trending Gigs</h2>
          </div>
          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest hidden sm:inline-block font-mono">Swipe / Scroll &rarr;</span>
        </div>

        {/* Scrollable snap row using alternating festival and poster variants */}
        <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-none snap-x snap-mandatory">
          {trendingEvents.map((event, idx) => (
            <div 
              key={event._id} 
              className={`min-w-[280px] sm:min-w-[340px] md:min-w-[360px] snap-start shrink-0 transition-transform duration-500 ${
                idx % 2 === 0 ? 'mt-0' : 'mt-6'
              }`}
            >
              <EventCard event={event} variant={idx % 2 === 0 ? 'festival' : 'poster'} />
            </div>
          ))}
        </div>
      </section>

      {/* 5. UPCOMING EVENTS: ASYMMETRICAL CATALOG GRID */}
      <section id="events-display-section" className="max-w-[1280px] mx-auto px-6 mt-32 scroll-mt-24">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
              {category === 'All' ? 'Upcoming Catalog' : `${category} Events`}
            </h2>
            <p className="text-caption text-text-secondary font-light">Explore experiences structured with asymmetrical visual widths.</p>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            {isUsingDemo && (
              <span className="px-2.5 py-0.5 rounded text-[8px] font-bold bg-[#EC4856]/15 border border-[#EC4856]/30 text-[#EC4856] uppercase tracking-widest font-mono">
                Demo Sandbox
              </span>
            )}
            <span className="px-3 py-1 text-[9px] font-mono font-bold rounded-lg bg-es-surface text-text-secondary border border-white/5">
              COUNT: {events.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-brand-muted text-brand text-xs font-semibold border border-brand/20 text-center font-mono">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-es-surface border border-white/5 h-[420px] flex flex-col overflow-hidden">
                <div className="aspect-[16/10] w-full bg-es-void" />
                <div className="p-5 flex-grow space-y-4">
                  <div className="h-4 bg-es-void rounded w-2/3" />
                  <div className="h-3 bg-es-void rounded w-1/2" />
                  <div className="h-12 bg-es-void rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-16 rounded-3xl border border-white/5 bg-es-surface max-w-xl mx-auto space-y-6 shadow-xl"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-brand-muted text-brand border border-brand/20 flex items-center justify-center">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-white uppercase tracking-wider">No matching experiences found.</p>
              <p className="text-xs text-text-secondary font-light">Try resetting the filter criteria or query tags.</p>
            </div>
            <button onClick={clearFilters} className="btn-secondary text-[10px] py-2 px-6 rounded-lg inline-block cursor-pointer">
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Asymmetrical Masonry Card Grid Layout with multiple card variants */}
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {displayedEvents.map((event, idx) => {
                  // Asymmetric sizes: index 0 and 4 span 8 columns, others span 4 columns on large screens
                  const gridColClass = (idx % 4 === 0) ? 'lg:col-span-8 md:col-span-2' : 'lg:col-span-4 md:col-span-1';
                  // Dynamic premium variants mapping based on grid layout positioning
                  const variantType = (idx % 4 === 0) ? 'horizontal' : (idx % 4 === 1) ? 'magazine' : (idx % 4 === 2) ? 'compact' : 'poster';
                  return (
                    <motion.div
                      layout
                      key={event._id}
                      className={`transition-all duration-300 ${gridColClass}`}
                    >
                      <EventCard event={event} variant={variantType} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-secondary py-3.5 px-8 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-white/5 bg-es-surface hover:bg-es-surface-raised disabled:opacity-50 cursor-pointer text-text-secondary hover:text-white transition-colors"
                >
                  {loadingMore ? (
                    'Loading...'
                  ) : (
                    <>
                      Expand Catalog
                      <ChevronDown className="h-4.5 w-4.5 text-text-tertiary" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. BROWSE CATEGORIES: ASYMMETRICAL SOUNDBOARD BLOCKS */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand">THE GENRES</span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-white">Browse Categories</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto font-light">Explore arenas tailored to your exact community tastes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
          {Object.entries(CATEGORY_META).map(([name, meta]) => {
            if (name === 'Other') return null;
            const Icon = meta.icon;
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={name}
                onClick={() => {
                  setCategory(name);
                  const element = document.getElementById('events-display-section');
                  if (element) {
                    setTimeout(() => {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }
                }}
                className={`p-6 rounded-2xl bg-es-surface border border-white/[0.06] text-left flex flex-col justify-between min-h-[140px] hover:border-brand/40 transition-all shadow-md cursor-pointer group relative overflow-hidden ${meta.size}`}
              >
                {/* Glowing subtle ambient spotlight background on hover */}
                <div 
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  style={{ '--tw-gradient-from': meta.glow }}
                />
                
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${meta.gradient} text-white flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="z-10 mt-6 flex justify-between items-end w-full">
                  <span className="font-display text-base font-bold uppercase tracking-wider text-text-primary group-hover:text-brand transition-colors">
                    {name}
                  </span>
                  <ChevronRight className="h-4.5 w-4.5 text-text-tertiary group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 7. POPULAR CITIES: MAGAZINE EDITORIAL SPREAD (Alternating left/right image layouts) */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="text-center space-y-2 mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand">THE LOCATIONS</span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-white">Popular Cities</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto font-light">Major music venues, digital summits, and lifestyle spots.</p>
        </div>

        <div className="space-y-12">
          {POPULAR_CITIES.map((city, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                whileHover={{ borderColor: 'rgba(236, 72, 86, 0.2)' }}
                key={city.name}
                onClick={() => triggerCitySearch(city.name)}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 rounded-3xl border border-white/[0.05] bg-es-surface/40 hover:bg-es-surface/75 cursor-pointer transition-all shadow-lg"
              >
                {isEven ? (
                  <>
                    {/* Portrait Image Left */}
                    <div className="lg:col-span-5 aspect-[16/10] sm:aspect-[2/1] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-es-void">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="h-full w-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    {/* Info Right */}
                    <div className="lg:col-span-7 space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#EC4856]/15 border border-[#EC4856]/30 text-[#EC4856] uppercase tracking-widest">
                          {city.count} Events
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary uppercase">LIVE EXPERIENCE HUB</span>
                      </div>
                      <h3 className="font-display text-3xl font-black uppercase text-white tracking-tight">{city.name}</h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-light font-body max-w-xl italic">
                        "{city.quote}"
                      </p>
                      <div className="pt-2 flex items-center gap-1.5 text-caption text-brand font-bold uppercase tracking-wider">
                        Explore stages <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Info Left */}
                    <div className="lg:col-span-7 space-y-4 text-left order-2 lg:order-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#EC4856]/15 border border-[#EC4856]/30 text-[#EC4856] uppercase tracking-widest">
                          {city.count} Events
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary uppercase">LIVE EXPERIENCE HUB</span>
                      </div>
                      <h3 className="font-display text-3xl font-black uppercase text-white tracking-tight">{city.name}</h3>
                      <p className="text-xs text-text-secondary leading-relaxed font-light font-body max-w-xl italic">
                        "{city.quote}"
                      </p>
                      <div className="pt-2 flex items-center gap-1.5 text-brand font-bold uppercase tracking-wider">
                        Explore stages <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                    {/* Portrait Image Right */}
                    <div className="lg:col-span-5 aspect-[16/10] sm:aspect-[2/1] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-es-void order-1 lg:order-2">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="h-full w-full object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 8. VERIFIED CREATORS: LAYERED CASCADE WALL */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand">THE CREATORS</span>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">Verified Promoters</h2>
            <p className="text-xs text-text-secondary font-light">Partnering with elite curators across music, summit, and culinary worlds.</p>
          </div>
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-widest pt-2 sm:pt-0">CURATED LOOPS</span>
        </div>

        {/* Handcrafted staggered rotating layout instead of a plain grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {TOP_ORGANIZERS.map((org, index) => {
            const rotationClass = index % 3 === 0 ? '-rotate-1 hover:rotate-0' : index % 3 === 1 ? 'rotate-1 hover:rotate-0' : 'rotate-0 hover:-rotate-1';
            const offsetClass = index % 2 === 0 ? 'translate-y-0' : 'translate-y-2';
            
            return (
              <div
                key={org.name}
                className={`p-6 rounded-2xl bg-es-surface border border-white/[0.05] flex flex-col items-center justify-between space-y-4 hover:border-brand/35 transition-all text-center shadow-lg ${rotationClass} ${offsetClass} transform`}
              >
                <div className="relative">
                  <img
                    src={org.avatar}
                    alt={org.name}
                    className="h-16 w-16 rounded-full object-cover border-2 border-white/10"
                  />
                  <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-es-surface shadow">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="font-display font-bold text-white uppercase tracking-wider text-sm">{org.name}</p>
                  <p className="text-[8px] text-text-secondary uppercase font-semibold font-mono tracking-wider">{org.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[9px] font-mono font-bold uppercase tracking-wider text-text-secondary border-t border-white/5 pt-4 w-full">
                  <div>
                    <p className="text-text-tertiary text-[7px] font-sans font-bold">GIGS</p>
                    <p className="text-white mt-0.5">{org.events}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-[7px] font-sans font-bold">REACH</p>
                    <p className="text-white mt-0.5">{org.followers}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. WHY EVENTSPHERE: IMMERSIVE MONOLITH TYPE MAGAZINE COLUMN SPREAD */}
      <section className="max-w-[1280px] mx-auto px-6 mt-44 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 lg:p-16 rounded-3xl border border-white/[0.08] bg-es-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-brand-muted via-transparent to-transparent pointer-events-none z-0" />
          
          {/* Left Narrative Column */}
          <div className="lg:col-span-4 space-y-6 text-left relative z-10">
            <span className="px-3 py-1 rounded-lg bg-brand-muted text-brand border border-brand/20 text-[9px] font-bold uppercase tracking-widest font-mono">
              STAGE OPERATIONS
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-black uppercase text-white leading-none tracking-tight">
              Designed for Live <br />
              <span className="text-gradient-brand">Experiences</span>
            </h2>
            <p className="text-xs text-text-secondary font-light leading-relaxed font-body max-w-sm">
              EventSphere isn't a directory. It is the ticketing framework built for festival promoters, art curators, and conference hosts. Built for speed, payment telemetry, and verified gate scans.
            </p>
          </div>

          {/* Right Asymmetrical Grid Column */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            
            <div className="p-6 rounded-2xl bg-es-void/60 border border-white/5 space-y-4 hover:border-brand/30 transition-all shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-brand-muted text-brand flex items-center justify-center shadow-md">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">Instant Checkouts</h3>
              <p className="text-[11px] text-text-secondary font-light leading-relaxed font-body">
                Integrated payment pipelines handle secure ticketing checkouts in under 30 seconds. Invoices are dispatched to attendee inboxes instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-es-void/60 border border-white/5 space-y-4 hover:border-brand/30 transition-all shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-brand-muted text-brand flex items-center justify-center shadow-md">
                <Ticket className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">Virtual Passes & QR</h3>
              <p className="text-[11px] text-text-secondary font-light leading-relaxed font-body">
                Automated generation of virtual passes featuring printable PDF invoices and instant visual QR validation codes for gate scans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-es-void/60 border border-white/5 space-y-4 hover:border-brand/30 transition-all shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-brand-muted text-brand flex items-center justify-center shadow-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">Verified Creators</h3>
              <p className="text-[11px] text-text-secondary font-light leading-relaxed font-body">
                Rigorous administrative host onboarding checks ensure only real entertainment, design summits, and music events publish directories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-es-void/60 border border-white/5 space-y-4 hover:border-brand/30 transition-all shadow-inner">
              <div className="h-10 w-10 rounded-xl bg-brand-muted text-brand flex items-center justify-center shadow-md">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">Telemetry Panel</h3>
              <p className="text-[11px] text-text-secondary font-light leading-relaxed font-body">
                Track real-time checkout telemetry, monitor attendee counts, generate revenue graphs, and compile attendance sheets on your dashboard.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 10. SOCIAL PROOF: STAGGERED TESTIMONIAL COLUMNS */}
      <section className="max-w-[1280px] mx-auto px-6 mt-32">
        <div className="text-center space-y-2 mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand">THE VOICES</span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter text-white">Attendee Feedback</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto font-light">Feedback from concert arena seekers and verified event hosts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          <div className="p-6 rounded-2xl bg-es-surface border border-white/[0.05] space-y-5 shadow-lg text-xs leading-relaxed font-body relative">
            <Quote className="absolute right-6 top-6 h-6 w-6 text-brand/10" />
            <div className="flex items-center gap-1 text-signal">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-signal text-signal" />)}
            </div>
            <p className="text-text-secondary font-light italic">
              "The checkout was incredibly fast. I bought my VIP pass for EDM Night in just 3 clicks with Razorpay! The printable invoice is super handy."
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
              <div className="h-8 w-8 rounded-full bg-es-void font-bold flex items-center justify-center text-[10px] text-brand border border-white/10 uppercase">RS</div>
              <div>
                <p className="font-display font-bold text-white uppercase">Rohan S.</p>
                <p className="text-[8px] text-text-tertiary uppercase font-mono">Attendee · Pune</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-es-surface border border-white/[0.05] space-y-5 shadow-lg text-xs leading-relaxed font-body relative mt-0 md:mt-8">
            <Quote className="absolute right-6 top-6 h-6 w-6 text-brand/10" />
            <div className="flex items-center gap-1 text-signal">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-signal text-signal" />)}
            </div>
            <p className="text-text-secondary font-light italic">
              "Hosting our annual tech meetup on EventSphere was a breeze. The organizer dashboard let us export registration spreadsheets in one click."
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
              <div className="h-8 w-8 rounded-full bg-es-void font-bold flex items-center justify-center text-[10px] text-brand border border-white/10 uppercase">SM</div>
              <div>
                <p className="font-display font-bold text-white uppercase">Sneha M.</p>
                <p className="text-[8px] text-text-tertiary uppercase font-mono">Organizer · Bangalore</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-es-surface border border-white/[0.05] space-y-5 shadow-lg text-xs leading-relaxed font-body relative mt-0 md:mt-4">
            <Quote className="absolute right-6 top-6 h-6 w-6 text-brand/10" />
            <div className="flex items-center gap-1 text-signal">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-signal text-signal" />)}
            </div>
            <p className="text-text-secondary font-light italic">
              "Unparalleled user experience. The concert theme fits the energy perfectly. The interactive schedules made finding panel discussions extremely simple!"
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
              <div className="h-8 w-8 rounded-full bg-es-void font-bold flex items-center justify-center text-[10px] text-brand border border-white/10 uppercase">VR</div>
              <div>
                <p className="font-display font-bold text-white uppercase">Vikram R.</p>
                <p className="text-[8px] text-text-tertiary uppercase font-mono">Attendee · Delhi</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 11. NEWSLETTER: MINIMALIST GRAPHIC MONOLITH */}
      <section className="max-w-[1280px] mx-auto px-6 my-32">
        <div className="rounded-3xl bg-es-surface border border-white/[0.08] p-8 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(236,72,86,0.06),transparent_50%)]" />
          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-brand-muted text-brand border border-brand/20 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand block">STAY CONNECTED</span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">Join the Pulse</h2>
            <p className="text-xs text-text-secondary max-w-md mx-auto font-light leading-relaxed font-body">
              Subscribe to get personalized notifications of upcoming concerts, rock performances, and nightlife gathers in your town.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 form-input text-xs py-3.5 rounded-xl border border-white/[0.08] bg-es-void/50 placeholder-text-tertiary"
              />
              <button
                type="submit"
                className="btn-primary py-3.5 px-8 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Subscribe
              </button>
            </form>

            <AnimatePresence>
              {newsletterSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-bold text-success flex items-center justify-center gap-1.5 font-mono"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Subscription confirmed! Welcome to the loop.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
