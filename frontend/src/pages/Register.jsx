import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Mail, Lock, Eye, EyeOff, Loader2, Briefcase, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('attendee'); // 'attendee' or 'organizer'
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: 'Too short', color: 'bg-red-500' });

  const handleGoogleResponse = async (response) => {
    setIsSubmitting(true);
    setError('');
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { email, name, sub } = JSON.parse(jsonPayload);

      const result = await loginWithGoogle({ email, name, googleId: sub, role });
      if (result.success) {
        const { data } = await axios.get('/auth/me');
        if (data.success) {
          handleRedirect();
        }
      } else {
        setError(result.message || 'Google registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError(`Google registration authentication failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    /* global google */
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com',
        callback: handleGoogleResponse,
      });
    }
  }, []);

  useEffect(() => {
    evaluatePasswordStrength(password);
  }, [password]);

  const evaluatePasswordStrength = (pwd) => {
    if (!pwd) {
      setPwdStrength({ score: 0, label: 'Too short', color: 'bg-slate-800' });
      return;
    }
    if (pwd.length < 6) {
      setPwdStrength({ score: 1, label: 'Weak', color: 'bg-red-500' });
      return;
    }
    
    const hasNumbers = /\d/.test(pwd);
    const hasSpecials = /[^A-Za-z0-9]/.test(pwd);
    const hasCaps = /[A-Z]/.test(pwd);

    if (pwd.length >= 8 && hasNumbers && hasSpecials && hasCaps) {
      setPwdStrength({ score: 3, label: 'Strong Security', color: 'bg-emerald-500' });
    } else if (pwd.length >= 7 && (hasNumbers || hasSpecials)) {
      setPwdStrength({ score: 2, label: 'Fair / Good', color: 'bg-amber-500' });
    } else {
      setPwdStrength({ score: 1, label: 'Weak', color: 'bg-red-400' });
    }
  };

  const isEmailValid = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRedirect = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }
    if (!isEmailValid(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must meet minimum length of 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({ name, email, password, role });
      if (result.success) {
        const { data } = await axios.get('/auth/me');
        if (data.success) {
          handleRedirect();
        }
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Email may be already in use on another account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = (platform) => {
    if (platform === 'Google') {
      if (typeof google !== 'undefined') {
        try {
          google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com',
            callback: handleGoogleResponse,
          });
        } catch (e) {
          console.log('Google accounts initialization:', e);
        }
        google.accounts.id.prompt();
      } else {
        setError('Google Sign-In SDK is not loaded yet. Please try again in a moment.');
      }
    } else {
      setError(`OAuth integration with ${platform} registration is currently in sandbox development mode.`);
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
      {/* Background spotlights */}
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
            Create Account
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Join the community to claim tickets or publish events.
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-es-surface border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3.5 rounded-xl bg-danger-muted border border-danger/20 text-danger text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input pl-11 text-xs py-3 rounded-xl"
                />
              </div>
            </div>

            {/* Email address */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-11 text-xs py-3 rounded-xl"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-11 pr-11 text-xs py-3 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="pt-2 space-y-1.5 font-bold uppercase tracking-wider text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-text-tertiary">Strength:</span>
                    <span className="text-text-secondary">{pwdStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-es-void rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full rounded-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: pwdStrength.score === 1 ? '33.3%' : pwdStrength.score === 2 ? '66.6%' : pwdStrength.score === 3 ? '100%' : '0%' }} />
                  </div>
                  <p className="text-[9px] text-text-tertiary font-normal lowercase normal-case tracking-normal">Min 8 chars, 1 digit, 1 capital letter, and 1 symbol for safety.</p>
                </div>
              )}
            </div>

            {/* Role switchers */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Account Type</label>
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setRole('attendee')}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider
                    ${role === 'attendee'
                      ? 'bg-brand/10 border-brand text-brand shadow-es-glow-brand'
                      : 'bg-transparent border-white/5 text-text-secondary hover:bg-white/5 hover:border-white/10'}
                  `}
                >
                  <UserCheck className="h-4 w-4" />
                  Attendee
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`
                    flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-bold transition-all duration-300 cursor-pointer uppercase tracking-wider
                    ${role === 'organizer'
                      ? 'bg-brand/10 border-brand text-brand shadow-es-glow-brand'
                      : 'bg-transparent border-white/5 text-text-secondary hover:bg-white/5 hover:border-white/10'}
                  `}
                >
                  <Briefcase className="h-4 w-4" />
                  Organizer
                </motion.button>
              </div>
            </div>

            {role === 'organizer' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] rounded-xl leading-relaxed">
                <strong>Hosting Alert:</strong> Host registrations are reviewed by administrators. Account approval is required before experience publication goes live.
              </div>
            )}

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
                  Creating profile...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Social signup divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 border-t border-white/5" />
            <span className="relative bg-es-surface px-3 text-[10px] text-text-tertiary uppercase font-bold tracking-wider">
              Or Sign Up with
            </span>
          </div>

          {/* Social options */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSocialSignup('Google')}
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-es-void text-text-secondary hover:text-text-primary hover:bg-es-surface-overlay flex items-center justify-center gap-2 cursor-pointer transition-all font-bold uppercase tracking-wider text-[10px]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.832 0-8.243-3.673-8.243-8.229s3.411-8.228 8.243-8.228c2.263 0 4.093.81 5.482 2.202l3.196-3.196C18.665.815 15.68 0 12.24 0 5.47 0 0 5.37 0 12s5.47 12 12.24 12c6.643 0 12.24-4.757 12.24-12 0-.81-.077-1.428-.204-1.715H12.24z" />
              </svg>
              Google
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSocialSignup('GitHub')}
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-es-void text-text-secondary hover:text-text-primary hover:bg-es-surface-overlay flex items-center justify-center gap-2 cursor-pointer transition-all font-bold uppercase tracking-wider text-[10px]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </motion.button>
          </div>

          {/* Redirect links */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand hover:underline">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Register;
