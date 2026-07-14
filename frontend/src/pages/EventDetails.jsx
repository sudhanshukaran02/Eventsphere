import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, BACKEND_URL } from '../context/AuthContext';
import { demoEvents } from '../utils/demoEvents';
import EventCard from '../components/EventCard';
import {
  Calendar,
  MapPin,
  Ticket,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Heart,
  User,
  CheckCircle2,
  Star,
  Clock,
  Info,
  Copy,
  Check,
  Map,
  MessageSquare,
  FileText,
  QrCode,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Twitter = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Form States
  const [qty, setQty] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedDetails, setBookedDetails] = useState(null);
  const [bookingFailed, setBookingFailed] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);

  // Bookmark State
  const [isSaved, setIsSaved] = useState(false);

  // Mock Payment Modal States
  const [showMockModal, setShowMockModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // Share Clipboard State
  const [linkCopied, setLinkCopied] = useState(false);

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Reviews & Ratings States
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [myRating, setMyRating] = useState(5);
  const [myReviewText, setMyReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userHasBooked, setUserHasBooked] = useState(false);

  useEffect(() => {
    // Reset coupon if quantity changes
    setAppliedCoupon('');
    setDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
    setError('');
  }, [qty]);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (user && event) {
      setIsSaved(user.savedEvents?.includes(event._id) || false);
    }
  }, [user, event]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    try {
      if (id.startsWith('demo-event-')) {
        const found = demoEvents.find(e => e._id === id);
        if (found) {
          setEvent(found);
          const related = demoEvents.filter(e => e.category === found.category && e._id !== id);
          setRelatedEvents(related.slice(0, 3));
          setLoading(false);
          return;
        }
      }

      const { data } = await axios.get(`/events/${id}`);
      if (data.success) {
        setEvent(data.event);
        await fetchReviewsAndBooking(data.event._id);

        try {
          const relRes = await axios.get('/events', { params: { category: data.event.category } });
          if (relRes.data.success) {
            const filtered = relRes.data.events.filter(e => e._id !== data.event._id);
            setRelatedEvents(filtered.slice(0, 3));
          }
        } catch (relErr) {
          const related = demoEvents.filter(e => e.category === data.event.category && e._id !== data.event._id);
          setRelatedEvents(related.slice(0, 3));
        }
      }
    } catch (err) {
      console.error(err);
      const found = demoEvents.find(e => e._id === id);
      if (found) {
        setEvent(found);
        const related = demoEvents.filter(e => e.category === found.category && e._id !== id);
        setRelatedEvents(related.slice(0, 3));
      } else {
        setError('Experience details could not be retrieved from database.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsAndBooking = async (eventId) => {
    try {
      const { data } = await axios.get(`/events/${eventId}/reviews`);
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewsCount(data.count);
      }
    } catch (err) {
      console.error('Reviews load failed:', err);
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.get('/bookings/my-bookings');
        if (data.success) {
          const hasBooking = data.bookings.some(b =>
            (b.eventId?._id === eventId || b.eventId === eventId) && b.paymentStatus === 'paid'
          );
          setUserHasBooked(hasBooking);
        }
      } catch (bookErr) {
        console.error('Bookings load failed:', bookErr);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!myReviewText.trim()) return;

    setIsSubmittingReview(true);
    try {
      if (event._id.startsWith('demo-event-')) {
        const newReview = {
          _id: `mock_review_${Date.now()}`,
          eventId: event._id,
          rating: myRating,
          reviewText: myReviewText,
          userId: {
            _id: user?._id || 'mock_user_id',
            name: user?.name || 'Local Tester',
          },
          createdAt: new Date().toISOString(),
        };
        setReviews([newReview, ...reviews]);
        setReviewsCount(reviewsCount + 1);
        setAverageRating(Math.round(((averageRating * reviewsCount + myRating) / (reviewsCount + 1)) * 10) / 10);
        alert('Thank you! Review published successfully (Simulated for demo).');
        setMyReviewText('');
        setIsSubmittingReview(false);
        return;
      }
      const { data } = await axios.post(`/events/${event._id}/reviews`, {
        rating: myRating,
        reviewText: myReviewText,
      });

      if (data.success) {
        alert('Thank you! Review published successfully.');
        setMyReviewText('');
        fetchReviewsAndBooking(event._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (event._id.startsWith('demo-event-')) {
      setIsSaved(!isSaved);
      return;
    }
    try {
      const { data } = await axios.post(`/events/${event._id}/save`);
      if (data.success) {
        setIsSaved(data.saved);
        await refreshUser();
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const { data } = await axios.post('/bookings/validate-coupon', {
        code: couponCodeInput,
        eventId: event._id,
        ticketQuantity: qty,
      });

      if (data.success) {
        setDiscountAmount(data.discount);
        setAppliedCoupon(couponCodeInput.toUpperCase());
        setCouponSuccess(`Promo code applied! You save ₹${data.discount}.`);
      }
    } catch (err) {
      console.error(err);
      setCouponError(err.response?.data?.message || 'Invalid promo code');
      setDiscountAmount(0);
      setAppliedCoupon('');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      let data;
      let config = { useMock: true, keyId: 'mock_key' };

      if (event._id.startsWith('demo-event-')) {
        const isFree = event.price === 0;
        const totalPrice = isFree ? 0 : (event.price * qty) - discountAmount;
        const mockBookingId = `mock_booking_${Date.now()}`;
        const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          JSON.stringify({
            bookingId: mockBookingId,
            attendeeName: user?.name || 'Local Tester',
            eventName: event.title,
            ticketQuantity: qty,
            bookingDate: new Date().toISOString(),
          })
        )}`;

        data = {
          success: true,
          isFree,
          booking: {
            _id: mockBookingId,
            eventId: event,
            userId: {
              _id: user?._id || 'mock_user_id',
              name: user?.name || 'Local Tester',
              email: user?.email || 'test_attendee_random@example.com',
            },
            ticketQuantity: qty,
            totalPrice,
            paymentStatus: isFree ? 'paid' : 'pending',
            paymentId: `order_mock_${Math.random().toString(36).substring(5)}`,
            bookingDate: new Date().toISOString(),
            qrCodeUrl: mockQrCodeUrl,
          }
        };
      } else {
        const configRes = await axios.get('/payments/config');
        config = configRes.data;
        setPaymentConfig(config);

        const response = await axios.post('/bookings', {
          eventId: event._id,
          ticketQuantity: qty,
          couponCode: appliedCoupon || undefined,
        });
        data = response.data;
      }

      if (data.success) {
        if (data.isFree) {
          setBookedDetails(data.booking);
          setBookingSuccess(true);
          setIsBooking(false);

          if (event._id.startsWith('demo-event-')) {
            const existing = JSON.parse(localStorage.getItem('demoBookings') || '[]');
            existing.push(data.booking);
            localStorage.setItem('demoBookings', JSON.stringify(existing));
          }
        } else {
          setPendingBooking(data.booking);
          if (config.useMock) {
            setShowMockModal(true);
            setIsBooking(false);
          } else {
            openRealRazorpay(data.razorpayOrder, config.keyId);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Booking order creation failed. Try again.');
      setIsBooking(false);
    }
  };

  const openRealRazorpay = (order, keyId) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EventSphere',
        description: `Booking tickets for ${event.title}`,
        order_id: order.id,
        handler: async function (response) {
          setIsBooking(true);
          try {
            const verifyRes = await axios.post('/bookings/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              setBookedDetails(verifyRes.data.booking);
              setBookingSuccess(true);
            }
          } catch (err) {
            setFailureReason(err.response?.data?.message || 'Payment signature verification failed.');
            setBookingFailed(true);
          } finally {
            setIsBooking(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#EC4856',
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    script.onerror = () => {
      setError('Failed to load payment checkout SDK. Check network.');
      setIsBooking(false);
    };
    document.body.appendChild(script);
  };

  const handleMockPaymentResult = async (status) => {
    setShowMockModal(false);

    if (status === 'cancel') {
      setError('Payment cancelled by user.');
      return;
    }

    setIsBooking(true);
    try {
      if (status === 'success') {
        const orderId = pendingBooking.paymentId;
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(5)}`;
        const mockSignature = `mock_sig_for_${orderId}`;

        let verifyData;
        const isDemoEvent = typeof pendingBooking.eventId === 'object'
          ? pendingBooking.eventId._id.startsWith('demo-event-')
          : pendingBooking.eventId.startsWith('demo-event-');

        if (isDemoEvent) {
          verifyData = {
            success: true,
            booking: {
              ...pendingBooking,
              paymentStatus: 'paid',
            }
          };

          const existing = JSON.parse(localStorage.getItem('demoBookings') || '[]');
          existing.push(verifyData.booking);
          localStorage.setItem('demoBookings', JSON.stringify(existing));
        } else {
          const verifyRes = await axios.post('/bookings/verify', {
            razorpay_order_id: orderId,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: mockSignature,
          });
          verifyData = verifyRes.data;
        }

        if (verifyData.success) {
          setBookedDetails(verifyData.booking);
          setBookingSuccess(true);
        }
      } else {
        setFailureReason('Simulated payment failure: The mock checkout transaction was declined by the card holder bank.');
        setBookingFailed(true);
      }
    } catch (err) {
      console.error(err);
      setFailureReason(err.response?.data?.message || 'Verification signature mismatch or network timeout.');
      setBookingFailed(true);
    } finally {
      setIsBooking(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!bookedDetails || !event) return;
    const printWindow = window.open('', '_blank');
    const subtotal = event.price * bookedDetails.ticketQuantity;
    const gst = Math.round(subtotal * 0.18);
    const total = bookedDetails.totalPrice;

    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice - ${event.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; background-color: #fff; }
          .invoice-box { max-width: 800px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #EC4856; }
          .invoice-id { font-size: 14px; color: #64748b; font-family: monospace; }
          .details { display: flex; justify-content: space-between; margin-top: 30px; font-size: 13px; }
          .col { width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-top: 40px; font-size: 13px; }
          th, td { padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; color: #475569; }
          .totals { display: flex; justify-content: flex-end; margin-top: 30px; font-size: 13px; }
          .totals-table { width: 40%; }
          .totals-table td { border: none; padding: 6px; }
          .grand-total td { font-weight: bold; font-size: 16px; border-top: 2px solid #f1f5f9 !important; color: #EC4856; padding-top: 12px !important; }
          .footer { margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">EventSphere</div>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Premium Experiences Registry</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #475569;">Invoice</h2>
              <p class="invoice-id" style="margin: 4px 0 0 0;">ID: ${bookedDetails._id}</p>
            </div>
          </div>

          <div class="details">
            <div class="col">
              <strong style="color: #475569; text-transform: uppercase; font-size: 11px; tracking-wider;">Billed To:</strong>
              <p style="margin: 6px 0 0 0; font-weight: bold; color: #0f172a;">${user?.name}</p>
              <p style="margin: 2px 0 0 0; color: #475569;">${user?.email}</p>
            </div>
            <div class="col" style="text-align: right;">
              <strong style="color: #475569; text-transform: uppercase; font-size: 11px; tracking-wider;">Transaction Summary:</strong>
              <p style="margin: 6px 0 0 0; color: #0f172a;"><strong>Date:</strong> ${new Date(bookedDetails.bookingDate).toLocaleDateString()}</p>
              <p style="margin: 2px 0 0 0; color: #0f172a;"><strong>Status:</strong> PAID</p>
              <p style="margin: 2px 0 0 0; color: #0f172a;"><strong>Reference ID:</strong> ${bookedDetails.paymentId}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Experience</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #0f172a;">${event.title}</strong>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Venue: ${event.location}</p>
                </td>
                <td>${bookedDetails.ticketQuantity}</td>
                <td>₹${event.price}</td>
                <td style="text-align: right;">₹${subtotal}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right; font-family: monospace;">₹${subtotal}</td>
              </tr>
              <tr>
                <td>GST / Sales Tax (18%):</td>
                <td style="text-align: right; font-family: monospace;">₹${gst}</td>
              </tr>
              <tr>
                <td>Convenience Fee:</td>
                <td style="text-align: right; font-family: monospace;">₹0</td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right; font-family: monospace;">₹${total}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for choosing EventSphere! Enjoy your upcoming experience.</p>
            <p style="margin-top: 10px; font-size: 9px; color: #cbd5e1;">Generated by EventSphere Platform Checkout Service.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let normalized = url.replace(/\\/g, '/');
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    if (normalized.startsWith('/uploads')) {
      return `${BACKEND_URL}${normalized}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-es-void">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
          <div className="absolute font-display text-[9px] font-bold text-brand uppercase tracking-widest animate-pulse">ES</div>
        </div>
        <p className="mt-4 text-[10px] text-text-secondary uppercase tracking-widest font-bold">Retrieving Stage Details...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-brand-muted border border-brand/20 text-brand rounded-lg mb-4">
          {error}
        </div>
        <Link to="/" className="btn-secondary py-2 px-4 rounded-xl inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    );
  }

  // Booking Confirmation Screen (Fully Dark-Themed & Polished)
  if (bookingSuccess && bookedDetails) {
    const subtotal = event.price * bookedDetails.ticketQuantity;
    const gst = Math.round(subtotal * 0.18);
    return (
      <div className="min-h-screen py-16 px-4 flex flex-col items-center justify-center bg-es-void font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-8 rounded-3xl text-center space-y-6 bg-es-surface border border-white/[0.08] shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white">Passes Confirmed!</h2>
            <p className="text-xs text-text-secondary">
              Your registration for <strong>{event.title}</strong> is active.
            </p>
          </div>

          {/* Premium Invoice receipt block */}
          <div className="p-6 bg-es-void border border-white/[0.06] rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <span className="text-[9px] font-bold text-brand uppercase tracking-widest leading-none font-mono">Tax Invoice & Receipt</span>
              <span className="text-[9px] font-mono text-text-tertiary">ID: {bookedDetails._id.substring(0, 12)}</span>
            </div>

            <div className="text-xs space-y-2 text-text-secondary">
              <div className="flex justify-between">
                <span>Attendee Name:</span>
                <span className="font-bold text-white">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Tickets Booked:</span>
                <span className="font-bold text-white">{bookedDetails.ticketQuantity} Pass(es)</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium font-mono text-white">₹{subtotal}</span>
              </div>
              {subtotal > 0 && (
                <div className="flex justify-between">
                  <span>GST / Tax (18%):</span>
                  <span className="font-medium font-mono text-white">₹{gst}</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-dashed border-white/5 text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="text-emerald-500 font-mono">₹{bookedDetails.totalPrice}</span>
              </div>
            </div>
            <p className="text-[9px] text-text-tertiary leading-relaxed text-center pt-2">A confirmation email receipt has been compiled and dispatched to your email.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs">
            <button
              onClick={handlePrintInvoice}
              className="flex-grow btn-secondary py-3 rounded-xl border border-white/5 text-text-secondary hover:text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="h-4 w-4 text-text-tertiary" /> Print Invoice
            </button>
            <Link to="/my-bookings" className="flex-grow btn-primary py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-brand">
              <QrCode className="h-4 w-4" /> View Ticket QR
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Visual Failure screen block
  if (bookingFailed) {
    return (
      <div className="min-h-screen py-16 px-4 flex flex-col items-center justify-center bg-es-void font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-6 bg-es-surface border border-white/[0.08] shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger animate-bounce">
            <X className="h-8 w-8" />
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white font-semibold">Transaction Failed</h2>
            <p className="text-xs text-text-secondary">
              We could not complete your booking for <strong>{event.title}</strong>.
            </p>
          </div>

          <div className="p-4 bg-es-void border border-white/5 rounded-2xl text-left space-y-1 text-xs">
            <p className="font-bold text-brand uppercase tracking-widest text-[9px] mb-1">Declined Reason</p>
            <p className="text-text-secondary leading-relaxed font-light">{failureReason || 'The mock payment transaction was aborted.'}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 text-xs">
            <button
              onClick={() => {
                setBookingFailed(false);
                setError('');
                handleBooking();
              }}
              className="flex-grow btn-primary py-3 rounded-xl font-bold uppercase tracking-wider cursor-pointer shadow-glow-brand"
            >
              Retry Payment
            </button>
            <button
              onClick={() => {
                setBookingFailed(false);
                setError('');
              }}
              className="flex-grow btn-secondary py-3 rounded-xl border border-white/5 text-text-secondary hover:text-white font-bold uppercase tracking-wider cursor-pointer"
            >
              Cancel Checkout
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isSoldOut = event.availableTickets <= 0;
  const daysDiff = Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24));

  const ratingVal = event.rating || (4.5 + (event.title.charCodeAt(0) % 5) / 10).toFixed(1);
  const reviewsVal = event.reviewsCount || (event.title.charCodeAt(1) % 150) + 12;

  const agendaList = [
    { time: '09:00 AM', title: 'Registration & Welcoming', desc: 'Badge pick-ups, morning coffee, and introductory networking.' },
    { time: '10:00 AM', title: 'Opening Keynote Address', desc: 'Overview of topics, main panels launch, and host statements.' },
    { time: '12:30 PM', title: 'Catered Networking Lunch', desc: 'Included refreshments and breakout tables organized by category.' },
    { time: '02:00 PM', title: 'Main Panel Discussions', desc: 'Deep dive sessions led by verified organizers and guest hosts.' },
    { time: '04:30 PM', title: 'Closing Remarks & Social', desc: 'Summary of details, Q&A rounds, and social cocktail hour.' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-20 bg-es-void text-white transition-colors duration-300 font-body"
    >
      {/* 1. Large Hero Banner Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-4 md:px-8 bg-es-surface text-white">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={getImageUrl(event.bannerUrl)}
            alt="Blur bg"
            className="w-full h-full object-cover blur-2xl scale-110"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-es-void via-es-void/70 to-es-void/50 z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-6 pt-10">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="p-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}`, '_blank')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                title="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </button>
              <button
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`, '_blank')}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                title="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
                  title="Copy link to clipboard"
                >
                  {linkCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {linkCopied && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded bg-es-surface border border-white/10 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap font-mono"
                    >
                      Copied!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-4xl pt-6">
            <span className="px-3.5 py-1.5 text-[9px] font-bold rounded-lg bg-brand-muted text-brand border border-brand/20 uppercase tracking-widest inline-block font-mono">
              {event.category}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white font-display uppercase">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary pt-2 font-medium">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-brand" /> Hosted by {event.organizerId?.name || 'Community Organizer'}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
              <span className="flex items-center gap-1 text-signal font-bold"><Star className="h-4 w-4 fill-signal text-signal" /> {reviewsCount > 0 ? averageRating : event.rating || 4.5} <span className="text-text-tertiary font-normal">({reviewsCount > 0 ? reviewsCount : event.reviewsCount || 0} reviews)</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Page Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Main details segments */}
          <div className="lg:col-span-2 space-y-8">

            {/* Banner Media Card */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl aspect-video w-full bg-es-surface">
              <img
                src={getImageUrl(event.bannerUrl)}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Quick Timing & Location badges grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="bg-es-surface border border-white/[0.06] p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                <div className="p-3 rounded-xl bg-brand-muted text-brand shrink-0">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider font-mono">Date & Time</h3>
                  <p className="text-sm font-bold text-white mt-1">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-brand" />
                    {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-es-surface border border-white/[0.06] p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                <div className="p-3 rounded-xl bg-brand-muted text-brand shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider font-mono">Location / Venue</h3>
                  <p className="text-sm font-bold text-white mt-1">
                    {event.location}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 font-medium">
                    {event.location.toLowerCase() === 'online' ? 'Interactive webinar access' : 'Physical entry pass required'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-es-surface border border-white/[0.06] p-6 md:p-8 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white uppercase tracking-widest font-display">About the Experience</h2>
              <p className="text-text-secondary text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-light">
                {event.description}
              </p>
            </div>

            {/* Agenda/Schedule Section */}
            <div className="bg-es-surface border border-white/[0.06] p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
              <h2 className="text-base font-bold text-white uppercase tracking-widest font-display">Agenda & Timeline</h2>

              <div className="relative border-l border-white/5 pl-6 ml-3 space-y-6 py-2">
                {agendaList.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-brand border-2 border-[#04040C]" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[9px] font-bold text-brand uppercase font-mono">{item.time}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-xs text-text-secondary font-light">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Map */}
            <div className="bg-es-surface border border-white/[0.06] p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-white uppercase tracking-widest font-display">Venue Information</h2>
                <span className="text-[9px] text-text-tertiary font-bold uppercase flex items-center gap-1"><Map className="h-3.5 w-3.5" /> Map Location</span>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-light">
                The experience takes place at <strong className="font-semibold text-white">{event.location}</strong>. For physical locations, doors open 30 minutes before slot schedules.
              </p>

              <div className="relative h-64 rounded-xl overflow-hidden bg-es-void border border-white/5 shadow-inner group">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                  alt="Mock Map grid"
                  className="w-full h-full object-cover opacity-30 group-hover:scale-102 transition-transform duration-700"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="p-3 rounded-full bg-brand/20 border border-brand/35 text-brand animate-bounce mb-3 shadow-lg">
                    <MapPin className="h-7 w-7" />
                  </div>

                  <div className="bg-es-surface border border-white/10 p-3 rounded-xl max-w-xs shadow-xl text-white space-y-1">
                    <p className="text-xs font-bold leading-tight truncate">{event.location}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-bold text-brand hover:underline uppercase block tracking-wider"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-es-surface border border-white/[0.06] p-6 md:p-8 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white uppercase tracking-widest font-display">Ticketing & Entry Policies</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-light leading-relaxed text-text-secondary">
                <div className="space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-brand" /> Refund Terms
                  </p>
                  <p>Cancellations issued up to 48 hours before the start date qualify for full refunds. Fees are non-refundable inside the 48-hour window.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Admission Terms
                  </p>
                  <p>Bring either a printed virtual pass or display the confirmed QR code stub inside your Attendee Console dashboard for scanning at the gate.</p>
                </div>
              </div>
            </div>

            {/* Reviews Thread */}
            <div className="bg-es-surface border border-white/[0.06] p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
              <h2 className="text-base font-bold text-white uppercase tracking-widest font-display flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand" /> Attendee Feedback
              </h2>

              {/* Add Review Form */}
              {userHasBooked && !reviews.some(r => r.userId?._id === user?.id || r.userId === user?.id) && (
                <form onSubmit={handleSubmitReview} className="p-4 rounded-xl bg-es-void/40 border border-white/5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Leave a Review</h3>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMyRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star className={`h-4.5 w-4.5 transition-colors ${myRating >= star ? 'fill-signal text-signal' : 'text-text-tertiary hover:text-signal'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      placeholder="Share your experience..."
                      value={myReviewText}
                      onChange={(e) => setMyReviewText(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3.5 py-2.5 bg-es-surface border border-white/5 rounded-xl text-white text-xs placeholder:text-text-tertiary focus:border-brand/45 focus:outline-none transition-colors leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[10px] text-text-tertiary">
                      <span>{myReviewText.length}/500 characters</span>
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !myReviewText.trim()}
                        className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="divide-y divide-white/5 space-y-4">
                {reviews.length === 0 ? (
                  <div className="py-6 text-center text-xs text-text-secondary font-light">
                    <p>No reviews have been posted for this experience yet.</p>
                  </div>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={review._id || idx} className={`pt-4 space-y-2 ${idx === 0 ? 'pt-0' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{review.userId?.name || 'Attendee'}</span>
                        <div className="flex gap-0.5 text-signal text-xs">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-signal text-signal" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs font-light text-text-secondary leading-relaxed">"{review.reviewText}"</p>
                      <p className="text-[9px] text-text-tertiary font-mono">
                        {new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Ticket console */}
          <div className="space-y-6 text-xs">
            <div className="bg-es-surface border border-white/[0.06] p-6 rounded-2xl shadow-2xl sticky top-24 space-y-6">

              {/* Cost Header */}
              <div className="pb-4 border-b border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider">Ticket cost</span>
                  <p className="text-3xl font-bold text-white flex items-baseline mt-0.5 font-display tracking-wide">
                    {event.price === 0 ? (
                      <span className="text-emerald-400 text-xl font-bold uppercase tracking-wider font-display">Free Access</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-text-tertiary mr-0.5 font-sans">₹</span>
                        {event.price}
                      </>
                    )}
                  </p>
                </div>

                {/* Save Heart Toggle */}
                {(!user || user.role === 'attendee') && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSaveToggle}
                    className="p-3 rounded-xl border border-white/5 hover:bg-white/5 text-text-tertiary hover:text-brand transition-colors cursor-pointer"
                  >
                    <Heart className={`h-4.5 w-4.5 transition-colors ${isSaved ? 'text-brand fill-brand' : ''}`} />
                  </motion.button>
                )}
              </div>

              {/* Status details */}
              <div className="space-y-3.5 font-bold uppercase tracking-wider text-[10px] text-text-tertiary">
                <div className="flex justify-between items-center">
                  <span>Capacity:</span>
                  <span className={isSoldOut ? 'text-brand font-extrabold' : 'text-white'}>
                    {isSoldOut ? 'Sold Out' : `${event.availableTickets} / ${event.totalTickets} slots left`}
                  </span>
                </div>

                {daysDiff > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Days to Event:</span>
                    <span className="text-brand font-extrabold">{daysDiff} days</span>
                  </div>
                )}

                {/* Ticket slots ratio progress */}
                <div className="h-1 w-full bg-es-void rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-brand' : event.availableTickets <= 10 ? 'bg-signal' : 'bg-brand'
                      }`}
                    style={{ width: `${Math.round(((event.totalTickets - event.availableTickets) / event.totalTickets) * 100)}%` }}
                  />
                </div>

                {/* Booking quantity controllers */}
                {!isSoldOut && (!user || user.role === 'attendee') && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="h-9 w-9 rounded-xl border border-white/5 hover:bg-white/5 flex items-center justify-center font-bold text-white cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-grow text-center font-bold text-sm text-white font-mono">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(Math.min(Math.min(10, event.availableTickets), qty + 1))}
                        className="h-9 w-9 rounded-xl border border-white/5 hover:bg-white/5 flex items-center justify-center font-bold text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Promo Code System */}
                {!isSoldOut && (!user || user.role === 'attendee') && event.price > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        disabled={isApplyingCoupon || !!appliedCoupon}
                        className="flex-grow px-3 py-2 bg-es-surface-raised border border-white/5 rounded-xl text-white text-[10px] placeholder:text-text-tertiary focus:border-brand/45 focus:outline-none transition-colors uppercase font-bold"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCodeInput.trim() || !!appliedCoupon}
                        className="px-3 py-2 rounded-xl bg-es-surface-raised border border-white/5 hover:border-brand/35 text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40"
                      >
                        {isApplyingCoupon ? '...' : appliedCoupon ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                    {couponSuccess && (
                      <p className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider">{couponSuccess}</p>
                    )}
                    {couponError && (
                      <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {user?.role === 'organizer' || user?.role === 'admin' ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>You are logged in as an <strong>{user.role}</strong>. Booking registrations are restricted to attendee accounts only.</p>
                </div>
              ) : isSoldOut ? (
                <button
                  disabled
                  className="w-full bg-es-surface-raised text-text-disabled py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-not-allowed"
                >
                  Sold Out
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBooking}
                  disabled={isBooking}
                  className="w-full btn-primary py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-brand cursor-pointer"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Securing Pass...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4.5 w-4.5" />
                      {event.price === 0 ? 'Register Free Pass' : discountAmount > 0 ? `Book Passes • ₹${(event.price * qty) - discountAmount} (Save ₹${discountAmount})` : `Book Passes • ₹${event.price * qty}`}
                    </>
                  )}
                </motion.button>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase tracking-wider font-bold rounded-xl flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

            </div>
          </div>
        </div>

        {relatedEvents.length > 0 && (
          <section className="mt-20 pt-10 border-t border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white uppercase tracking-widest font-display">Related Gigs</h2>
              <span className="text-[9px] text-text-tertiary font-bold uppercase">Similar Category</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedEvents.map((rel) => (
                <EventCard key={rel._id} event={rel} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 4. SIMULATED MOCK PAYMENT MODAL OVERLAY */}
      {showMockModal && pendingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-es-surface border border-white/[0.08] shadow-2xl text-white"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-es-surface-raised">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-brand text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">R</span>
                <span className="text-xs font-mono font-bold tracking-widest text-text-secondary">RAZORPAY CHECKOUT</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Payment to EventSphere</p>
                <h3 className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  ₹{pendingBooking.totalPrice}
                </h3>
                <p className="text-[10px] text-text-tertiary font-mono">Order ID: {pendingBooking.paymentId.substring(0, 14)}</p>
              </div>

              <div className="p-4 rounded-xl bg-es-void border border-white/5 space-y-2">
                <p className="text-xs font-bold text-text-secondary">Attendee details:</p>
                <div className="text-[11px] text-text-tertiary font-mono space-y-0.5">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-[10px] text-brand font-bold uppercase tracking-wider text-center">Simulated Bank Gateway</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleMockPaymentResult('success')}
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Simulate Success
                  </button>
                  <button
                    onClick={() => handleMockPaymentResult('fail')}
                    className="p-3 bg-brand/10 hover:bg-brand/20 border border-brand/30 text-brand font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Simulate Decline
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 bg-es-void/30 flex justify-center">
              <button
                onClick={() => handleMockPaymentResult('cancel')}
                className="text-xs font-semibold text-text-tertiary hover:text-white cursor-pointer"
              >
                Abort Transaction
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default EventDetails;
