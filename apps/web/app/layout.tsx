import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Hacker's Unity Platform",
  description:
    "Discover premier AI, Web3, and Fullstack hackathons. Find world-class teammates, build groundbreaking projects, and win venture-backed prize pools on Hacker's Unity.",
  keywords: [
    "Hacker's Unity",
    'hackathons',
    'AI hackathons',
    'Web3 hackathons',
    'coding competitions',
    'find teammates',
    'developer community',
  ],
  icons: {
    icon: '/logo-black.png',
  },
};

import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';
import { NotificationToast } from '@/components/notification-toast';
import { CookieConsent } from '@/components/cookie-consent';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-[#0099e6]/20 selection:text-[#0099e6]"
      >
        <AuthProvider>
          <NotificationProvider>
            <Navbar />
            <NotificationToast />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </NotificationProvider>
        </AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
