import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRedirect = (userObj) => {
    if (userObj.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (userObj.role === 'organizer') {
      navigate('/organizer-dashboard');
    } else {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

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

      const result = await loginWithGoogle({ email, name, googleId: sub });
      if (result.success) {
        const { data } = await axios.get('/auth/me');
        if (data.success) {
          handleRedirect(data.user);
        }
      } else {
        setError(result.message || 'Google login failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Google authentication failed.');
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

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEmailValid(email)) {
      setError('Please provide a valid email format.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }

        const { data } = await axios.get('/auth/me');
        if (data.success) {
          handleRedirect(data.user);
        }
      } else {
        setError(result.message || 'Authentication failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Access credentials invalid or unrecognized.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (platform) => {
    if (platform === 'Google') {
      if (typeof google !== 'undefined') {
        google.accounts.id.prompt();
      } else {
        setError('Google Sign-In SDK is not loaded yet. Please try again in a moment.');
      }
    } else {
      setError(`Integration with ${platform} OAuth is currently in sandbox development mode.`);
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
            Welcome Back
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Access secure tickets, scheduling panels, and verifications.
          </p>
        </div>

        {/* Card Panel */}
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

          <form onSubmit={onFormSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-brand" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-11 text-xs py-3 rounded-xl"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-brand hover:underline">
                  Forgot Password?
                </Link>
              </div>
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
            </div>

            {/* Remember checking toggle */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer font-medium select-none text-[11px] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-brand focus:ring-brand border-white/10 bg-es-void h-4 w-4 cursor-pointer"
                />
                Remember me
              </label>
            </div>

            {/* Action submit button */}
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
                  Verifying Account...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 border-t border-white/5" />
            <span className="relative bg-es-surface px-3 text-[10px] text-text-tertiary uppercase font-bold tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSocialLogin('Google')}
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
              onClick={() => handleSocialLogin('GitHub')}
              className="py-2.5 px-4 rounded-xl border border-white/5 bg-es-void text-text-secondary hover:text-text-primary hover:bg-es-surface-overlay flex items-center justify-center gap-2 cursor-pointer transition-all font-bold uppercase tracking-wider text-[10px]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </motion.button>
          </div>

          {/* Account Redirect link */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            New to EventSphere?{' '}
            <Link to="/register" className="font-bold text-brand hover:underline">
              Create an Account
            </Link>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Login;
