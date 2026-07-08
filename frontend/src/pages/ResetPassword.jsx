import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Confirmed password inputs do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`/auth/reset-password/${token}`, { password });
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Token is invalid or has expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-es-void text-white relative overflow-hidden font-body"
    >
      {/* Background lights */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,86,0.12),transparent_40%)] z-0" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_80%_80%,rgba(108,92,231,0.08),transparent_40%)] z-0" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2 group mb-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-accent text-white shadow-es-glow-brand group-hover:scale-105 transition-all"
            >
              <Calendar className="h-5.5 w-5.5" />
            </motion.div>
          </Link>
          <h2 className="text-3xl font-extrabold tracking-wider text-white font-display uppercase">
            Set New Password
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Choose a strong passcode containing at least 6 characters.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-es-surface border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-455">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white uppercase font-display tracking-wider">Password Updated</h3>
                <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed font-light">
                  Your password has been reset successfully. Redirecting you to the login screen...
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                {error && (
                  <div className="p-3.5 rounded-xl bg-danger-muted border border-danger/20 text-danger text-xs font-semibold">
                    {error}
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pl-11 text-xs py-3 rounded-xl"
                    />
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input pl-11 text-xs py-3 rounded-xl"
                    />
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-glow-brand"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </motion.button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

export default ResetPassword;
