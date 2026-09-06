import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationProvider } from '@/lib/notification-context';
import { NotificationToast } from '@/components/notification-toast';
import { CookieConsent } from '@/components/cookie-consent';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hackersunity.com'),
  title: {
    default: "Hacker's Unity | India's Fastest Growing Hackathon Community, Uniting Developers, Innovators",
    template: "%s | Hacker's Unity",
  },
  description:
    "Hacker’s Unity is India’s Fastest Growing community, uniting developers, innovators, founded by Jha Suraj Kumar and Chinmay Bhatt. Join us to build, learn & innovate! Top 1 India's fastest growing hackathon community.",
  keywords: [
    "Hackers Unity",
    "Hackathon Community",
    "Hackathon Community India",
    "Hackathon Community UK",
    "Co-Founder Chinmay Bhatt",
    "Founder Jha Suraj Kumar",
    "Tech Community",
    "HackStorm",
    "Organization",
    "Top 1 Hackathon Community",
    "Top 1 Hackathon Organization",
    "Global Hackathon",
    "Tech Leaders India",
    "Startup India",
    "No.1 Hackathon Organization",
    "Developer Community India",
    "Jaipur",
    "World's fastest growing hackathon community",
    "Hacker's Unity is India's fastest-growing hackathon community and developer platform",
    "coding competitions",
    "find teammates",
    "AI hackathons",
    "Web3 hackathons",
    "build projects",
  ],
  authors: [
    { name: "Hacker's Unity", url: 'https://hackersunity.com' },
    { name: 'Jha Suraj Kumar' },
    { name: 'Chinmay Bhatt' },
  ],
  creator: "Hacker's Unity",
  publisher: "Hacker's Unity",
  alternates: {
    canonical: 'https://hackersunity.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '500x500' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hackersunity.com',
    siteName: "Hacker's Unity",
    title: "Hacker's Unity – India's Fastest Growing Community",
    description:
      "Hacker’s Unity is India’s Fastest Growing Hackathon Community, founded by Jha Suraj Kumar & co-founded by Chinmay Bhatt. Join us to build, learn & innovate! Top 1 India's fastest growing hackathon community.",
    images: [
      {
        url: 'https://hackersunity.com/logo.png',
        width: 500,
        height: 500,
        alt: "Hacker's Unity Logo",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hacker's Unity – India's Fastest Growing Community",
    description:
      "Hacker's Unity is a national-level student-driven tech community founded by Jha Suraj Kumar & co-founded by Chinmay Bhatt. Join us to build, learn & innovate!",
    images: ['https://hackersunity.com/logo.png'],
    creator: '@hackersunity',
  },
  verification: {
    google: [
      'H48wr7qAG78kx6IfVuUg4P-6MS9hneJe9enR6HwIquw',
      'zQnDJWC7wb3Fr3PXhARAOd2t1Vmd3dsBicp6_PZE0tM',
    ],
  },
  other: {
    'google-adsense-account': 'ca-pub-8285568809233100',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: "Hacker's Unity",
  url: 'https://hackersunity.com',
  logo: 'https://hackersunity.com/logo.png',
  description:
    "India's Fastest Growing Hackathon Community, uniting developers, innovators, founded by Jha Suraj Kumar and Chinmay Bhatt.",
  founders: [
    {
      '@type': 'Person',
      name: 'Jha Suraj Kumar',
      jobTitle: 'Founder',
    },
    {
      '@type': 'Person',
      name: 'Chinmay Bhatt',
      jobTitle: 'Co-Founder',
    },
  ],
  sameAs: [
    'https://twitter.com/hackersunity',
    'https://www.linkedin.com/company/hackersunity',
    'https://discord.com/invite/xcNNqdDhce',
    'https://github.com/Hackers-Unity',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91 8852924002',
    contactType: 'customer support',
    areaServed: 'IN',
    availableLanguage: ['English', 'Hindi'],
  },
};

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
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="500x500" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7ZTZNB5GND"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7ZTZNB5GND', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
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
