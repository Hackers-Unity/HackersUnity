import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp,
  FaDiscord,
} from 'react-icons/fa6';

export function Footer() {
  const socials = [
    { icon: FaInstagram, label: 'Instagram', handle: '@hackerunity', href: 'https://instagram.com/hackerunity' },
    { icon: FaXTwitter, label: 'Twitter (X)', handle: '@Hackers_Unity', href: 'https://twitter.com/Hackers_Unity' },
    { icon: FaLinkedin, label: 'LinkedIn', handle: '@hackerunity', href: 'https://linkedin.com/company/hackerunity' },
    { icon: FaYoutube, label: 'YouTube', handle: '@hackerunity', href: 'https://youtube.com/@hackerunity' },
    { icon: FaWhatsapp, label: 'WhatsApp', handle: 'Community Group', href: 'https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t' },
    { icon: FaDiscord, label: 'Discord', handle: 'Join Server', href: 'https://discord.com/invite/xcNNqdDhce' },
  ];

  return (
    <footer className="border-t border-slate-800/80 bg-[#0b0e14] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1 shadow-sm group-hover:border-[#0099e6]/40 transition-colors">
                <Image
                  src="/logo-main.png"
                  alt="Hacker's Unity"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-black text-white tracking-tight">
                Hacker&apos;s Unity
              </span>
            </Link>

            <div className="text-xs font-bold text-[#f97316] tracking-wide">
              Build. Connect. Innovate.
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Empowering the next generation of builders through hackathons, community, and collaboration.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${social.label} (${social.handle})`}
                    className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contact Us Col (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-xs">
              <li>
                <a
                  href="mailto:hackerunity.community@gmail.com"
                  className="flex items-center gap-2.5 text-slate-400 hover:text-[#0099e6] transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">hackerunity.community@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+918852924002"
                  className="flex items-center gap-2.5 text-slate-400 hover:text-[#0099e6] transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">+91 8852924002</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+919324264950"
                  className="flex items-center gap-2.5 text-slate-400 hover:text-[#0099e6] transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">+91 9324264950</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href="https://www.google.com/maps/place/Hacker's+Unity/@19.1172167,72.8642732,17z/data=!3m1!4b1!4m15!1m7!3m6!1s0x3be7c97b475f9155:0xe5b912633881889!2sHacker's+Unity!8m2!3d19.1172116!4d72.8668481!16s%2Fg%2F11zxcs0wbc!3m6!1s0x3be7c97b475f9155:0xe5b912633881889!8m2!3d19.1172116!4d72.8668481!15sCg5IYWNrZXIncyBVbml0eZIBGGV2ZW50X21hbmFnZW1lbnRfY29tcGFueeABAA!16s%2Fg%2F11zxcs0wbc?entry=ttu&g_ep=EgoyMDI2MDgzMC4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-white transition-colors cursor-pointer"
                >
                  A-41, Vinmar House, 1st Floor, Road no. 2, MIDC, Andheri East, Mumbai - 400093
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Col (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/hackathons" className="text-slate-400 hover:text-white transition-colors">
                  Hackathons
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-slate-400 hover:text-white transition-colors">
                  Tech Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/host" className="text-slate-400 hover:text-white transition-colors">
                  Host Hackathon
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.com/invite/xcNNqdDhce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Col (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/brand-guidelines" className="text-slate-400 hover:text-white transition-colors">
                  Brand Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-12 pt-8 text-center text-xs text-slate-500 font-medium">
          <p>© 2026 Hacker&apos;s Unity All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
