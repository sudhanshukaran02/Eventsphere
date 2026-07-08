import React from 'react';
import { X, Calendar, MapPin, Ticket, Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

const TicketQRModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const event = booking.eventId;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Direct QR Code Downloader
  const downloadTicketImage = () => {
    if (!booking.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = booking.qrCodeUrl;
    link.download = `EventSphere-Ticket-${booking._id.substring(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:bg-white print:p-0"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-es-xl glass-modal print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white"
      >

        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between p-6 border-b border-es-border print:hidden">
          <div className="flex items-center gap-2.5">
            <Ticket className="h-5 w-5 text-brand" />
            <h2 className="font-display text-subheading text-text-primary uppercase tracking-wider font-semibold">Your Digital Pass</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-es-sm text-text-tertiary hover:text-text-primary hover:bg-es-surface-overlay transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ticket Body */}
        <div className="p-6 md:p-8 space-y-6 print:p-0">

          {/* Ticket Card Design */}
          <div className="relative border-2 border-dashed border-es-border rounded-es-lg p-6 bg-es-surface-raised/40 print:border-solid">
            {/* Top Event Details */}
            <div className="space-y-4">
              <div>
                <span className="text-overline text-brand uppercase font-bold tracking-widest font-mono">
                  Event Entry Ticket
                </span>
                <h3 className="font-display text-heading text-text-primary mt-1.5 uppercase tracking-wide leading-snug">
                  {event ? event.title : 'Event details unavailable'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-es-border">
                <div className="space-y-1">
                  <span className="text-overline text-text-disabled uppercase">Date & Time</span>
                  <p className="text-body-sm text-text-secondary flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-brand shrink-0" />
                    {event ? formatDate(event.startDate) : 'N/A'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-overline text-text-disabled uppercase">Venue</span>
                  <p className="text-body-sm text-text-secondary flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                    {event ? event.location : 'N/A'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-overline text-text-disabled uppercase">Attendee</span>
                  <p className="text-body-sm text-text-primary font-bold">
                    {booking.userId?.name || 'User'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-overline text-text-disabled uppercase">Ticket Details</span>
                  <p className="text-body-sm text-text-primary font-bold font-mono">
                    {booking.ticketQuantity} x {booking.totalPrice === 0 ? 'Free Entry' : `₹${event?.price}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Circle ornaments */}
            <div className="absolute top-1/2 -left-3.5 h-7 w-7 rounded-full bg-[#04040C] border-r-2 border-dashed border-es-border -translate-y-1/2 print:hidden"></div>
            <div className="absolute top-1/2 -right-3.5 h-7 w-7 rounded-full bg-[#04040C] border-l-2 border-dashed border-es-border -translate-y-1/2 print:hidden"></div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center pt-8 mt-6 border-t-2 border-dashed border-es-border">
              {booking.qrCodeUrl ? (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-4 rounded-es-md border border-es-border shadow-es-md"
                >
                  <img
                    src={booking.qrCodeUrl}
                    alt="Ticket QR Code"
                    className="h-44 w-44 object-contain"
                  />
                </motion.div>
              ) : (
                <div className="h-44 w-44 rounded-es-md skeleton flex items-center justify-center text-caption text-text-disabled">
                  QR loading...
                </div>
              )}
              <span className="font-mono text-overline text-text-disabled mt-4 normal-case tracking-wider font-semibold">
                ID: {booking._id}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions (hidden in print) */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-es-border bg-es-surface/80 print:hidden">
          <button
            onClick={handlePrint}
            className="btn-secondary py-2.5 px-5 flex items-center gap-1.5 rounded-xl cursor-pointer text-text-secondary hover:text-white"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={downloadTicketImage}
            className="btn-primary py-2.5 px-6 flex items-center gap-1.5 rounded-xl cursor-pointer shadow-glow-brand"
          >
            <Download className="h-4 w-4" /> Download QR
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TicketQRModal;
