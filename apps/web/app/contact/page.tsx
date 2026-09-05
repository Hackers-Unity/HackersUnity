'use client';

import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaDiscord,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa6';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'general',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
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
      <section className="relative overflow-hidden pt-16 pb-16 md:pt-20 md:pb-24 border-b border-slate-200/80 bg-grid-pattern">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
            <span className="font-mono uppercase tracking-wider text-xs">
              We&apos;d Love To Hear From You
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
            Contact <span className="text-gradient-brand">Hacker&apos;s Unity</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">
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
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Direct Contact Channels</h2>

              <div className="space-y-4">
                <a
                  href="mailto:hackerunity.community@gmail.com"
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-100 hover:border-sky-200 transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0099e6] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Us</div>
                    <div className="text-sm font-bold text-slate-800 break-all group-hover:text-[#0099e6] transition-colors">
                      hackerunity.community@gmail.com
                    </div>
                  </div>
                </a>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#ea580c] shadow-2xs shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Call / WhatsApp</div>
                      <div className="flex flex-col sm:flex-row sm:gap-3 text-sm font-bold text-slate-800">
                        <a href="tel:+918852924002" className="hover:text-[#0099e6] transition-colors">+91 8852924002</a>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <a href="tel:+919324264950" className="hover:text-[#0099e6] transition-colors">+91 9324264950</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Office Location</div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed mt-0.5">
                      A-41, Vinmar House, Ground Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                        className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-600 flex items-center justify-center transition-all ${soc.color} hover:border-slate-300 hover:shadow-2xs`}
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
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              {formSubmitted ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Message Received!</h3>
                  <p className="text-sm text-slate-600 max-w-md font-medium">
                    Thank you for reaching out to Hacker&apos;s Unity. Our operations team will review your inquiry and get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', inquiryType: 'general', subject: '', message: '' });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-[#0099e6] text-white text-xs font-bold shadow-md shadow-sky-500/20 hover:bg-[#0284c7] transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Send us a Message</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Fill out the form below and we will get back to you promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Inquiry Type</label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all font-medium cursor-pointer"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="host">Hackathon Hosting & College Partnerships</option>
                      <option value="sponsor">Sponsorship & Brand Opportunities</option>
                      <option value="support">Technical / Participant Support</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Subject</label>
                    <input
                      required
                      type="text"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Message</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Provide details about your query or event..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0099e6] focus:bg-white text-xs text-slate-900 outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
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
