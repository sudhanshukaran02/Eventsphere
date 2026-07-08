import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Ticket, 
  Calendar, 
  Loader2 
} from 'lucide-react';

const CheckInConsoleModal = ({ isOpen, onClose }) => {
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    let bookingId = ticketInput.trim();

    // Check if input is a JSON string (scanned QR code)
    if (bookingId.startsWith('{') && bookingId.endsWith('}')) {
      try {
        const parsed = JSON.parse(bookingId);
        if (parsed.bookingId) {
          bookingId = parsed.bookingId;
        }
      } catch (err) {
        // Not valid JSON, treat as raw ID
      }
    } else if (bookingId.includes('ES-')) {
      // If it contains validation key format, extract it if needed or warn
      // But the backend expects MongoDB bookingId, so we warn the user
    }

    try {
      const { data } = await axios.post(`/bookings/${bookingId}/check-in`);
      if (data.success) {
        setResult({
          status: 'success',
          message: data.message,
          booking: data.booking,
        });
        setTicketInput('');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Check-in failed. Please verify the Ticket ID.';
      setError(errMsg);
      
      // If already checked in, we might still receive the booking object back in some errors,
      // but let's check if the server returned a booking in response data.
      if (err.response?.data?.booking) {
        setResult({
          status: 'already_checked_in',
          message: errMsg,
          booking: err.response.data.booking,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg overflow-hidden bg-es-surface border border-white/10 rounded-3xl shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">Check-In Console</h2>
              <p className="text-[10px] text-text-secondary font-light">Scan QR payload or enter Ticket Booking ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/5 bg-es-surface-raised hover:bg-white/5 text-text-tertiary hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-grow overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider font-display">
                Ticket Code / Booking JSON
              </label>
              <textarea
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder='Paste raw booking ID (e.g. 603d5...) or scanned QR JSON payload...'
                rows={3}
                required
                className="w-full px-4 py-3 bg-es-surface-raised border border-white/5 rounded-xl text-white text-xs placeholder:text-text-tertiary focus:border-brand/40 focus:outline-none transition-colors font-mono resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !ticketInput.trim()}
              className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-glow-brand cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider text-[10px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Ticket...
                </>
              ) : (
                'Verify & Validate Check-In'
              )}
            </button>
          </form>

          {/* Success Result */}
          {result && result.status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-display">Check-In Successful</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-white/5 pt-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block">Attendee</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <User className="h-3.5 w-3.5 text-text-secondary" />
                    {result.booking.userId?.name || 'Attendee'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block">Quantity</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold font-mono">
                    <Ticket className="h-3.5 w-3.5 text-text-secondary" />
                    {result.booking.ticketQuantity} Ticket(s)
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block">Event</span>
                  <div className="flex items-center gap-1.5 text-white font-bold font-display uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                    {result.booking.eventId?.title || 'Experience'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Already Checked-In / Error Result */}
          {result && result.status === 'already_checked_in' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4"
            >
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-display">Already Checked-In</span>
              </div>
              <p className="text-[11px] text-text-secondary font-light border-b border-white/5 pb-3">
                {result.message}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block">Checked In At</span>
                  <div className="text-white font-semibold font-mono">
                    {new Date(result.booking.checkedInAt).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block">Attendee</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <User className="h-3.5 w-3.5 text-text-secondary" />
                    {result.booking.userId?.name || 'Attendee'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Simple Alert Error */}
          {error && !result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-danger-muted border border-danger/25 text-danger text-xs font-semibold flex items-center gap-2.5"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckInConsoleModal;
