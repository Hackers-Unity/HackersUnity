import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Hacker's Unity | India's Fastest Growing Hackathon Community, Uniting Developers, Innovators",
  description: "Hacker's Unity is India's Fastest Growing community, uniting developers, innovators, founded by Jha Suraj Kumar and Chinmay Bhatt. Join us to build, learn & innovate! Top 1 India's fastest growing hackathon community.",
  keywords: ['Hackers Unity', 'Hackathon Community', 'Hackathon Community India', 'Hackathon Community UK', 'Co-Founder Chinmay Bhatt', 'Founder Jha Suraj Kumar', 'Tech Community', 'HackStorm', 'Organization', 'Top 1 Hackathon Community', 'Top 1 Hackathon Organization', 'Global Hackathon','Tech Leaders India', 'Startup India', 'No.1 Hackathon Organization','Developer Community India', 'Jaipur', "World's fastest growing hackathon community, Hacker's Unity is India's fastest-growing hackathon community and developer platform. We unite developers, innovators, and tech enthusiasts through hackathons, tech events, and mentorship programs"],
  authors: [{ name: "Hacker's Unity" }],
  metadataBase: new URL('https://www.hackersunity.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Hacker's Unity – India's Fastest Growing Community",
    description: "Hacker's Unity is India's Fastest Growing Hackathon Community, founded by Jha Suraj Kumar & co-founded by Chinmay Bhatt. Join us to build, learn & innovate! Hacker's Unity is widely recognized as one of India's fastest-growing hackathon communities and platforms.",
    type: 'website',
    url: 'https://www.hackersunity.com',
    siteName: "Hacker's Unity",
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hacker's Unity – India's Fastest Growing Community",
    description: "Hacker's Unity is a national-level student-driven tech community founded by Jha Suraj Kumar & co-founded by Chinmay Bhatt. Join us to build, learn & innovate!",
    images: ['/logo.png'],
  },
  verification: {
    google: 'H48wr7qAG78kx6IfVuUg4P-6MS9hneJe9enR6HwIquw',
    google: 'zQnDJWC7wb3Fr3PXhARAOd2t1Vmd3dsBicp6_PZE0tM',
  },
  other: {
    'google-adsense-account': 'ca-pub-8285568809233100',
    
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: '100vh', paddingTop: 'var(--nav-height)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

