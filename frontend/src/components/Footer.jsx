import React from 'react';
import { Heart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Github = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Twitter = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="relative bg-es-void font-body">
      {/* Gradient accent line — brand signature */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-0.5 group">
              <span className="font-display text-xl font-bold tracking-tight text-text-primary group-hover:opacity-80 transition-opacity">
                event
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-brand group-hover:opacity-80 transition-opacity">
                sphere
              </span>
            </Link>
            <p className="text-body-sm text-text-secondary max-w-xs leading-relaxed">
              The backstage pass to culture. Discover concerts, summits, festivals, and gatherings — or publish your own.
            </p>
            <div className="flex items-center gap-2 text-caption text-text-tertiary">
              <Shield className="h-3.5 w-3.5 text-success" />
              Secure checkout enabled
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Explore */}
            <div>
              <h4 className="text-overline text-text-primary uppercase mb-4">Explore</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Upcoming Events</Link></li>
                <li><Link to="/" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Trending</Link></li>
                <li><Link to="/" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Workshops</Link></li>
              </ul>
            </div>

            {/* Host */}
            <div>
              <h4 className="text-overline text-text-primary uppercase mb-4">Host</h4>
              <ul className="space-y-2.5">
                <li><Link to="/register?role=organizer" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Become an Organizer</Link></li>
                <li><Link to="/login" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Dashboard</Link></li>
                <li><Link to="/create-event" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Ticketing</Link></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-overline text-text-primary uppercase mb-4">Platform</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Statistics</a></li>
                <li><a href="#" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Testimonials</a></li>
                <li><Link to="/login" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Attendee Portal</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-overline text-text-primary uppercase mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Privacy</a></li>
                <li><a href="#" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Terms</a></li>
                <li><a href="#" className="text-body-sm text-text-tertiary hover:text-brand transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-es-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-caption text-text-disabled flex items-center gap-1.5">
            &copy; {new Date().getFullYear()} EventSphere. Crafted with
            <Heart className="h-3 w-3 text-brand fill-brand" />
          </p>
          <div className="flex gap-3">
            <a href="#" className="p-2 rounded-es-xs border border-es-border text-text-tertiary hover:text-text-primary hover:border-brand-muted transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-es-xs border border-es-border text-text-tertiary hover:text-text-primary hover:border-brand-muted transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-es-xs border border-es-border text-text-tertiary hover:text-text-primary hover:border-brand-muted transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
