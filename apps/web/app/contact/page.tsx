'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaDiscord,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa6';
import { useAuth } from '@/lib/auth-context';
import { submitContactInquiry } from '@/lib/supabase-service';

export default function ContactPage() {
  const { user } = useAuth();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'general',
    subject: '',
    message: '',
  });

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any).phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await submitContactInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        inquiryType: formData.inquiryType,
        subject: formData.subject,
        message: formData.message,
      });

      if (res.success) {
        setFormSubmitted(true);
      } else {
        setErrorMsg(res.error || 'Failed to submit your message. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const socials = [
    { icon: FaDiscord, label: 'Discord', href: 'https://discord.com/invite/xcNNqdDhce', color: 'hover:text-[#5865F2]' },
    { icon: FaWhatsapp, label: 'WhatsApp', href: 'https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t', color: 'hover:text-[#25D366]' },
    { icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/hackerunity', color: 'hover:text-[#0A66C2]' },
    { icon: FaXTwitter, label: 'Twitter (X)', href: 'https://twitter.com/Hackers_Unity', color: 'hover:text-slate-900' },
    { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/hackerunity', color: 'hover:text-[#E4405F]' },
    { icon: FaYoutube, label: 'YouTube', href: 'https://youtube.com/@hackerunity', color: 'hover:text-[#FF0000]' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-20">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/80 dark:border-white/[0.08] bg-grid-pattern">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 dark:bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 dark:bg-[#f97316]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 text-xs font-bold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
            <span className="font-mono uppercase tracking-wider text-xs">
              We&apos;d Love To Hear From You
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-4">
            Contact <span className="text-gradient-brand">Hacker&apos;s Unity</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
            Have questions about hosting an event, partnerships, sponsorships, or general support? Reach out to our community operations team.
          </p>
        </div>
      </section>

      {/* ─── Contact Form & Information Grid ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Direct Contact Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact Cards */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Direct Contact Channels</h2>

              <div className="space-y-4">
                <a
                  href="mailto:info@hackersunity.com"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] hover:bg-sky-50/60 dark:hover:bg-white/[0.06] border border-slate-100 dark:border-white/[0.06] hover:border-sky-200 dark:hover:border-sky-500/30 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#0099e6] dark:text-[#38bdf8] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Us</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all group-hover:text-[#0099e6] dark:group-hover:text-[#38bdf8] transition-colors">
                      info@hackersunity.com
                    </div>
                  </div>
                </a>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[#ea580c] shadow-2xs shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Call / WhatsApp</div>
                      <div className="flex flex-col sm:flex-row sm:gap-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                        <a href="tel:+918852924002" className="hover:text-[#0099e6] dark:hover:text-[#38bdf8] transition-colors">+91 8852924002</a>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                        <a href="tel:+919324264950" className="hover:text-[#0099e6] dark:hover:text-[#38bdf8] transition-colors">+91 9324264950</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Office Location</div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">
                      A-41, Vinmar House, Ground Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08]">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Connect on Socials & Discord
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {socials.map((soc) => {
                    const Icon = soc.icon;
                    return (
                      <a
                        key={soc.label}
                        href={soc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={soc.label}
                        className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all ${soc.color} hover:border-slate-300 dark:hover:border-white/[0.2] hover:shadow-2xs`}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-sm">
              {formSubmitted ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Message Received!</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md font-medium">
                    Thank you for reaching out to Hacker&apos;s Unity. Our operations team will review your inquiry and get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', inquiryType: 'general', subject: '', message: '' });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-md shadow-sky-500/20 hover:bg-[#0284c7] transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send us a Message</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Fill out the form below and we will get back to you promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Contact / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Inquiry Type</label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="host">Hackathon Hosting & College Partnerships</option>
                        <option value="sponsor">Sponsorship & Brand Opportunities</option>
                        <option value="support">Technical / Participant Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject</label>
                    <input
                      required
                      type="text"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Provide details about your query or event..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs text-slate-900 dark:text-white outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
