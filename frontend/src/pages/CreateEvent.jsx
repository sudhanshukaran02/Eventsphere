import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Image, 
  IndianRupee, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  CheckCircle,
  FileText,
  MapPin,
  Ticket,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const CATEGORIES = ['Music', 'Tech', 'Art', 'Sports', 'Business', 'Food', 'Other'];

const CreateEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = !!id;
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Music');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState(0);
  const [totalTickets, setTotalTickets] = useState(100);
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/events/${id}`);
      if (data.success) {
        const ev = data.event;
        setTitle(ev.title);
        setDescription(ev.description);
        setCategory(ev.category);
        setLocation(ev.location);
        setPrice(ev.price);
        setTotalTickets(ev.totalTickets);
        
        if (ev.startDate) setStartDate(new Date(ev.startDate).toISOString().slice(0, 16));
        if (ev.endDate) setEndDate(new Date(ev.endDate).toISOString().slice(0, 16));

        if (ev.bannerUrl) {
          if (ev.bannerUrl.startsWith('http://') || ev.bannerUrl.startsWith('https://')) {
            setBannerPreview(ev.bannerUrl);
          } else {
            let normalized = ev.bannerUrl.replace(/\\/g, '/');
            if (!normalized.startsWith('/')) {
              normalized = '/' + normalized;
            }
            if (normalized.startsWith('/uploads')) {
              setBannerPreview(`http://localhost:5000${normalized}`);
            } else {
              setBannerPreview(ev.bannerUrl);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 1) {
      if (title.trim().length < 5) {
        setError('Event title must be at least 5 characters.');
        return false;
      }
      if (description.trim().length < 20) {
        setError('Event description must be at least 20 characters.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!location.trim()) {
        setError('Please provide a valid location or online venue details.');
        return false;
      }
      if (!startDate || !endDate) {
        setError('Please configure both start and end date slots.');
        return false;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        setError('Start date/time must be scheduled before End date/time.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!banner && !bannerPreview) {
        setError('Please upload a cover banner for this event.');
        return false;
      }
    } else if (currentStep === 4) {
      if (price < 0) {
        setError('Ticket price must be positive.');
        return false;
      }
      if (totalTickets < 5) {
        setError('Minimum ticket capacity is 5 slots.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setError('');
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('price', price);
    formData.append('totalTickets', totalTickets);
    
    if (banner) {
      formData.append('banner', banner);
    }

    try {
      let res;
      if (isEditMode) {
        res = await axios.put(`/events/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        navigate('/organizer-dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Publishing failed. Check fields or server connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-es-void font-body">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute font-display text-[9px] font-bold text-brand uppercase tracking-widest animate-pulse">ES</div>
        </div>
        <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Retrieving Experience Settings...</p>
      </div>
    );
  }

  const stepsList = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Venue' },
    { num: 3, label: 'Cover' },
    { num: 4, label: 'Pricing' },
    { num: 5, label: 'Review' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-16 bg-es-void text-white font-body"
    >
      {/* Top Banner */}
      <section className="border-b border-white/5 bg-es-surface/60 backdrop-blur-md py-10 px-4 md:px-8 text-white rounded-b-[40px] shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/organizer-dashboard" 
              className="p-2.5 rounded-xl border border-white/5 bg-es-surface hover:bg-white/5 text-text-tertiary hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <div>
              <span className="text-[9px] text-brand font-bold uppercase tracking-widest leading-none font-display font-mono">Organizer Wizard</span>
              <h1 className="text-3xl font-extrabold mt-0.5 tracking-wider font-display uppercase text-white">
                {isEditMode ? 'Modify Event Experience' : 'Publish New Experience'}
              </h1>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 mt-10 space-y-8">
      
        {/* Step Progress indicators */}
        <div className="flex justify-between items-center max-w-xl mx-auto relative px-4 text-xs font-bold uppercase tracking-wider">
          <div className="absolute inset-x-8 top-4 h-0.5 bg-es-surface-raised z-0" />
          <div className="absolute inset-x-8 top-4 h-0.5 bg-brand z-0 transition-all duration-300" style={{ width: `${(step - 1) * 25}%` }} />

          {stepsList.map(s => (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 font-display">
              <span className={`h-8.5 w-8.5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                step === s.num ? 'bg-brand border-brand text-white font-extrabold shadow-es-glow-brand' :
                step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' :
                'bg-es-void border-white/5 text-text-tertiary'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={step === s.num ? 'text-brand font-extrabold' : 'text-text-tertiary font-semibold'}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Validation Errors banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-danger-muted text-danger text-xs font-semibold border border-danger/25 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form content steps */}
        <div className="bg-es-surface border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
          
            {/* STEP 1: Basic Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 text-xs font-semibold"
              >
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Basic Details</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Summit, Concert, Masterclass..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input text-xs py-3 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input text-xs py-3 rounded-xl cursor-pointer bg-es-void text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-es-surface text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Description & Details</label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Describe agenda slots, schedules, guidelines, and what attendees will learn..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-input text-xs py-3 rounded-xl resize-y"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Location & Dates */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 text-xs font-semibold"
              >
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Location & Date</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Venue / Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium, NYC or 'Online'"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="form-input text-xs py-3 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input text-xs py-2.5 rounded-xl text-white bg-es-void"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input text-xs py-2.5 rounded-xl text-white bg-es-void"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Banner Upload */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 text-xs font-semibold"
              >
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <Image className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Event Cover Banner</h3>
                </div>

                {bannerPreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-es-void border border-white/5 shadow-2xl group">
                    <img src={bannerPreview} alt="Preview" className="h-full w-full object-cover opacity-80" />
                    <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold cursor-pointer transition-all uppercase tracking-wider">
                      Replace Image
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/10 hover:border-brand rounded-2xl aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer text-text-secondary hover:text-white transition-all p-6 bg-es-void/40">
                    <Image className="h-8 w-8 text-brand" />
                    <span className="text-xs font-bold uppercase tracking-wider">Upload Cover Picture</span>
                    <span className="text-[10px] text-text-tertiary">JPG, PNG, WEBP (5MB Max)</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </motion.div>
            )}

            {/* STEP 4: Pricing & Capacity */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 text-xs font-semibold"
              >
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Pricing & Capacity</h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Ticket Price (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand font-bold" />
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0 (Free)"
                      value={price}
                      onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="form-input pl-10 text-xs py-3 rounded-xl font-mono"
                    />
                  </div>
                  <p className="text-[9px] text-text-tertiary font-light">Set to 0 to enable instant registration without checking out.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Maximum Capacity (Seats)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    placeholder="100"
                    value={totalTickets}
                    onChange={(e) => setTotalTickets(Math.max(5, parseInt(e.target.value) || 5))}
                    className="form-input text-xs py-3 rounded-xl font-mono"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 5: Preview & Final Review */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 text-xs font-semibold"
              >
                <div className="pb-3 border-b border-white/5 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-brand" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Review & Publish</h3>
                </div>

                <p className="text-xs text-text-tertiary font-light">Double check event card layout preview before publishing live to users.</p>

                {/* Simulated live Card Preview */}
                <div className="max-w-sm mx-auto border border-white/5 rounded-2xl overflow-hidden shadow-2xl bg-es-surface font-sans text-xs">
                  <div className="relative aspect-video bg-es-void">
                    {bannerPreview && (
                      <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-es-surface/60 text-white uppercase tracking-wider">
                      {category}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded font-bold bg-es-void text-white shadow-sm border border-white/5 font-mono">
                      {price === 0 ? 'Free' : `₹${price}`}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-white line-clamp-1 leading-snug font-display uppercase tracking-wider">{title || 'Untitled Event'}</h4>
                    <p className="text-text-secondary line-clamp-2 leading-relaxed font-light">{description || 'No description provided.'}</p>
                    <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] text-text-tertiary font-medium">
                      <span className="flex items-center gap-1 font-bold"><MapPin className="h-3 w-3 text-brand" /> {location || 'TBD'}</span>
                      <span className="font-bold font-mono">CAP: {totalTickets}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-white/5 flex justify-between gap-3 text-xs">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" /> Back
              </button>
            ) : (
              <Link
                to="/organizer-dashboard"
                className="px-4 py-2.5 rounded-xl border border-white/5 text-xs font-bold uppercase tracking-wider text-text-tertiary hover:text-white hover:bg-white/5 transition-colors inline-flex items-center gap-1.5"
              >
                Cancel
              </Link>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl border border-white/5 bg-es-surface-raised text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                Next <ChevronRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-glow-brand"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4.5 w-4.5" />
                    {isEditMode ? 'Save Changes' : 'Publish Live'}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

      </main>
    </motion.div>
  );
};

export default CreateEvent;
