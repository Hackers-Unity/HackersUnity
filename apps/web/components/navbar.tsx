'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PlusCircle,
  Trophy,
  Bell,
  Menu,
  X,
  Compass,
  LogOut,
  User,
  Megaphone,
  ChevronDown,
  Sparkles,
  Mail,
  Info,
  ArrowRight,
  Search,
  Sun,
  Moon,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { Logo } from './logo';
import { AuthModal } from './auth-modal';
import { NotificationPanel } from './notification-panel';
import { SearchDialog } from './search-dialog';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-context';
import { useTheme } from '@/lib/theme-context';
import { UserRole } from '@hackers-unity/shared-types';

export function Navbar() {
  const pathname = usePathname();
  const { user: currentUser, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOppsOpen, setMobileOppsOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOppsMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpportunitiesOpen(true);
  };

  const handleOppsMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpportunitiesOpen(false);
    }, 200);
  };

  const isAboutActive = pathname === '/about';
  const isContactActive = pathname === '/contact';
  const isBlogsActive = pathname.startsWith('/blogs') || pathname.startsWith('/blog');
  const isOppsActive = pathname.startsWith('/hackathons') || pathname.startsWith('/events') || pathname.startsWith('/podcasts');
  const isDashboardActive = pathname.startsWith('/dashboard');

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#05070c]/85 border-b border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-xs dark:shadow-black/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-22 flex items-center justify-between gap-6 relative">
          {/* Left: Brand Logo */}
          <div className="flex items-center shrink-0 pl-3 sm:pl-6 lg:pl-8">
            <Link href="/" className="flex items-center group py-1">
              <Logo size={74} showText={false} />
            </Link>
          </div>

          {/* Center: Shekunj-style Floating Glass Panel Navigation (Centered) */}
          <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-xl shadow-xs">
              {/* About Us */}
              <Link
                href="/about"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isAboutActive
                    ? 'bg-white dark:bg-white/[0.08] text-[#0099e6] shadow-xs font-bold dark:border dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                About Us
              </Link>

              {/* Opportunities with Hover Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleOppsMouseEnter}
                onMouseLeave={handleOppsMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setOpportunitiesOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isOppsActive
                      ? 'bg-white dark:bg-white/[0.08] text-[#0099e6] shadow-xs font-bold dark:border dark:border-white/[0.08]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Opportunities</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      opportunitiesOpen ? 'rotate-180 text-[#0099e6]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {opportunitiesOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-2.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseEnter={handleOppsMouseEnter}
                    onMouseLeave={handleOppsMouseLeave}
                  >
                    <div className="p-2 rounded-2xl bg-white/95 dark:bg-[#0c1017] backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xl dark:shadow-black/80 space-y-1">
                      <Link
                        href="/hackathons"
                        onClick={() => setOpportunitiesOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center text-[#0099e6] group-hover:scale-105 transition-transform shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0099e6] transition-colors">
                            Hackathons
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Coding sprints & prize pools
                          </span>
                        </div>
                      </Link>

                      <Link
                        href="/events"
                        onClick={() => setOpportunitiesOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-[#ea580c] group-hover:scale-105 transition-transform shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#ea580c] transition-colors">
                            Tech Events
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Workshops, meetups & summits
                          </span>
                        </div>
                      </Link>

                      <Link
                        href="/podcasts"
                        onClick={() => setOpportunitiesOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-[#1ed760] group-hover:scale-105 transition-transform shrink-0">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1ed760] transition-colors">
                              Podcasts
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30">
                              NEW
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            Beyond The Mic tech series
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Us */}
              <Link
                href="/contact"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isContactActive
                    ? 'bg-white dark:bg-white/[0.08] text-[#0099e6] shadow-xs font-bold dark:border dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                Contact Us
              </Link>

              {/* Blogs */}
              <Link
                href="/blogs"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isBlogsActive
                    ? 'bg-white dark:bg-white/[0.08] text-[#0099e6] shadow-xs font-bold dark:border dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                Blogs
              </Link>

              {/* My Dashboard */}
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isDashboardActive
                    ? 'bg-white dark:bg-white/[0.08] text-[#0099e6] shadow-xs font-bold dark:border dark:border-white/[0.08]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                My Dashboard
              </Link>
            </div>
          </nav>

          {/* Right: Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Quick Search Button (⌘K) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 p-2 xl:px-3 xl:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer shadow-2xs group"
              title="Search hackathons & builders (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#0099e6] group-hover:scale-110 transition-transform" />
              <span className="hidden 2xl:inline text-slate-400 text-xs font-medium">Search...</span>
              <kbd className="hidden 2xl:inline px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.12] text-[10px] font-mono font-bold text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Open search"
            >
              <Search className="w-4 h-4 text-[#0099e6]" />
            </button>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                data-notification-trigger="true"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f97316] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-[#05070c] shadow-xs pointer-events-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <NotificationPanel
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </div>

            {/* Quick Theme Toggle Button (Always visible on website open) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer group"
              aria-label="Toggle theme"
              title="Toggle theme (Light / Dark)"
            >
              <Sun className="w-4 h-4 text-amber-400 hidden dark:block transition-transform duration-200 group-hover:rotate-45" />
              <Moon className="w-4 h-4 text-slate-600 dark:hidden transition-transform duration-200 group-hover:-rotate-12" />
            </button>

            {/* User Profile / Supabase Login */}
            {mounted && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl bg-sky-50 dark:bg-[#0099e6]/10 border border-[#0099e6]/30 hover:border-[#0099e6] transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#0099e6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate hidden sm:inline">
                    {currentUser.name ? currentUser.name.split(' ')[0] : 'User'}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xl dark:shadow-2xl dark:shadow-black/90 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2.5 border-b border-slate-100 dark:border-white/[0.08]">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{currentUser.email}</div>
                    </div>
                    <div className="py-1 space-y-1 text-xs font-medium">
                      <Link
                        href="/settings"
                        prefetch={false}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>Account & Settings</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        prefetch={false}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-950 dark:hover:text-white transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>My Dashboard & Analytics</span>
                      </Link>

                      {/* Admin Announcement Studio Link */}
                      {(currentUser.role === UserRole.ADMIN ||
                        currentUser.role === UserRole.SUPER_ADMIN ||
                        currentUser.role === UserRole.ORGANIZER) && (
                        <Link
                          href="/admin/notifications"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#0099e6] bg-sky-50/70 dark:bg-sky-500/10 hover:bg-sky-100/80 dark:hover:bg-sky-500/20 font-bold transition-colors"
                        >
                          <Megaphone className="w-3.5 h-3.5 text-[#0099e6]" />
                          <span>Announcements Studio</span>
                        </Link>
                      )}
                    </div>

                    {/* Theme Switcher in Profile Menu */}
                    <div className="py-2 px-1 border-t border-slate-100 dark:border-white/[0.08]">
                      <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Theme</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#0099e6]">
                          {theme}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setTheme('light')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            theme === 'light'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme('dark')}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-[#0099e6] text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5 text-sky-200" />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-[#0099e6] dark:hover:bg-[#0088cc] text-white font-bold text-xs transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                Get Started
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#05070c] px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isAboutActive ? 'bg-sky-50 dark:bg-[#0099e6]/10 text-[#0099e6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Info className="w-4 h-4 text-slate-500" />
              <span>About Us</span>
            </Link>

            {/* Mobile Opportunities Accordion */}
            <div className="space-y-1">
              <button
                onClick={() => setMobileOppsOpen(!mobileOppsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${
                  isOppsActive ? 'bg-sky-50 dark:bg-[#0099e6]/10 text-[#0099e6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-slate-500" />
                  <span>Opportunities</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileOppsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileOppsOpen && (
                <div className="pl-6 space-y-1 py-1">
                  <Link
                    href="/hackathons"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      pathname.startsWith('/hackathons')
                        ? 'text-[#0099e6] font-bold bg-sky-50/70 dark:bg-sky-500/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>Hackathons</span>
                  </Link>
                  <Link
                    href="/events"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      pathname.startsWith('/events')
                        ? 'text-[#ea580c] font-bold bg-orange-50/70 dark:bg-orange-500/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span>Tech Events</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isContactActive ? 'bg-sky-50 dark:bg-[#0099e6]/10 text-[#0099e6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Contact Us</span>
            </Link>

            <Link
              href="/blogs"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isBlogsActive ? 'bg-sky-50 dark:bg-[#0099e6]/10 text-[#0099e6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Blogs</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                isDashboardActive ? 'bg-sky-50 dark:bg-[#0099e6]/10 text-[#0099e6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>My Dashboard</span>
            </Link>

            {/* Mobile Theme Toggle */}
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/[0.08]">
              <div className="px-3 pb-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Theme</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#0099e6]">
                  {theme}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4 text-sky-200" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {mounted && !currentUser && (
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#0099e6] dark:hover:bg-[#0088cc] text-white text-xs font-bold transition-colors text-center shadow-xs block"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
