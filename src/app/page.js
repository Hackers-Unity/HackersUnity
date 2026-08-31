'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MessageCircle, Zap, UserPlus, Search, Users, Code, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import TypewriterText from '@/components/TypewriterText';
import CountUpAnimation from '@/components/CountUpAnimation';
import SectionHeading from '@/components/SectionHeading';
import FilterTabs from '@/components/FilterTabs';
import HackathonCard from '@/components/HackathonCard';
import ProjectCard from '@/components/ProjectCard';
import EventCard from '@/components/EventCard';
import LogoMarquee from '@/components/LogoMarquee';
import NewsletterCTA from '@/components/NewsletterCTA';
import AnimatedSection from '@/components/AnimatedSection';
import GalleryCarousel from '@/components/GalleryCarousel';
import GalleryMarquee from '@/components/GalleryMarquee';
import { hackathons, hackathonFilters } from '@/data/hackathons';
import { events } from '@/data/events';
import { projects } from '@/data/projects';
import { sponsors } from '@/data/sponsors';
import styles from './page.module.css';
import PodcastCard from '@/components/PodcastCard';
import { podcasts } from '@/data/podcasts';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All');
  const scrollRef = useRef(null);

  const filteredHackathons = activeFilter === 'All'
    ? hackathons.slice(0, 6)
    : hackathons.filter(h => h.mode === activeFilter || h.domain === activeFilter).slice(0, 6);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const podcastScrollRef = useRef(null);

  const scrollPodcastLeft = () => {
  if (podcastScrollRef.current) {
    podcastScrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
  }
};

const scrollPodcastRight = () => {
  if (podcastScrollRef.current) {
    podcastScrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
  }
};
  
  const howItWorks = [
    { icon: <UserPlus size={28} />, title: 'Create Profile', desc: 'Sign up and build your hacker profile' },
    { icon: <Search size={28} />, title: 'Discover Hackathons', desc: 'Browse and filter from 500+ events' },
    { icon: <Users size={28} />, title: 'Form a Team', desc: 'Connect with skilled teammates' },
    { icon: <Trophy size={28} />, title: 'Build & Win', desc: 'Ship projects and win prizes' },
  ];

  return (
    <>
      {/* ━━ HERO ━━ */}
      <section className={styles.hero}>
        <ParticleBackground />
        <div className={styles.heroGradient} />
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroBadge}>Global Tech Community</span>
          <h1 className={`heading-xl ${styles.heroTitle}`}>
            <span className={styles.brandHackers}>Hacker&apos;s</span>
            <span className={styles.brandUnity}>Unity</span>
            <span className={styles.titleRest}>is India&apos;s Fastest-Growing Tech Community</span>
          </h1>
          <p className={styles.heroSub}>
            Hacker&apos;s Unity is India&apos;s Fastest Growing tech community that brings together developers, innovators, and technology enthusiasts. Its mission is to empower students with real-world skills and connect them with industry opportunities.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/community" className="btn btn-primary btn-lg">
              Join the Community <ArrowRight size={18} />
            </Link>
            <Link href="/hackathons" className="btn btn-secondary-outline btn-lg">
              Upcoming Events
            </Link>
          </div>
        </div>
        <LogoMarquee />
      </section>



      {/* ━━ STATS BAR ━━ */}
      <AnimatedSection>
        <section className={styles.statsBar}>
          <div className={`container ${styles.statsGrid}`}>
            {[
              { end: 15, suffix: '+', label: 'Hackathons Organized' },
              { end: 10000, suffix: '+', label: 'Community Members' },
              { end: 20, suffix: '+', label: 'Partner Organizations' },
              { end: 30, suffix: '+', label: 'Events Conducted' },
            ].map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statValue}>
                  <CountUpAnimation end={stat.end} prefix={stat.prefix || ''} suffix={stat.suffix} duration={2000} />
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

          {/* ━━ GALLERY MARQUEE ━━ */}
      <AnimatedSection>
        <GalleryMarquee />
      </AnimatedSection>

      {/* ━━ FEATURED HACKATHONS ━━ */}
      <AnimatedSection>
        <section className="section">
          <div className="container">
            <SectionHeading label="Hackathons" title="Live & Upcoming Hackathons & Events" subtitle="Discover the best hackathons and build something amazing" />
            <FilterTabs tabs={hackathonFilters} activeTab={activeFilter} onChange={setActiveFilter} />
            <div className={styles.hackathonCarouselWrapper}>
              <button className={`${styles.carouselBtn} ${styles.prevBtn}`} onClick={scrollLeft} aria-label="Previous hackathons">
                <ChevronLeft size={24} />
              </button>
              <div className={styles.hackathonGrid} ref={scrollRef}>
                {filteredHackathons.map((h) => (
                  <HackathonCard key={h.id} hackathon={h} />
                ))}
              </div>
              <button className={`${styles.carouselBtn} ${styles.nextBtn}`} onClick={scrollRight} aria-label="Next hackathons">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className={styles.viewAll}>
              <Link href="/hackathons" className="btn btn-ghost">View All Hackathons <ChevronRight size={16} /></Link>
            </div>
          </div>
        </section>
      </AnimatedSection>



      {/* ━━ GALLERY (BOOTCAMP HIGHLIGHTS) ━━ */}
      <AnimatedSection>
        <section className={`section ${styles.gallerySection}`}>
          <div className="container">
            <SectionHeading label="Gallery" title="Events Highlights" subtitle="Glimpses of our community in action" />
            <div style={{ marginTop: '40px' }}>
              <GalleryCarousel />
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ━━ COMMUNITY ━━ */}
      <AnimatedSection>
        <section className="section">
          <div className={`container ${styles.communitySection}`}>
            <div className={styles.communityText}>
              <span className="section-label">Community</span>
              <h2 className="heading-lg gradient-text">Join a Global Community of Builders</h2>
              <p className={styles.communitySub}>Connect with thousands of developers, designers, and innovators. Share ideas, get mentorship, and collaborate on projects.</p>
              <div className={styles.communityStats}>
                <div className={styles.commStat}><Zap size={18} className={styles.commIcon} /><span><strong>100+</strong> Active Channels</span></div>
                <div className={styles.commStat}><MessageCircle size={18} className={styles.commIcon} /><span><strong>20+</strong> Monthly Events</span></div>
                <div className={styles.commStat}><Users size={18} className={styles.commIcon} /><span><strong>500+</strong> Mentors</span></div>
              </div>
              <Link href="https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t" className="btn btn-primary">Join Our WhatsApp <ArrowRight size={16} /> </Link>
            </div>
            <div className={styles.communityVisual}>
              <div className={styles.communityImageWrapper}>
                <Image 
                  src="/gallery/HuTeam.jpg" 
                  alt="HU Team" 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div className={styles.communityGlassCard}>
                <h4>The Core Team</h4>
                <p>Building the future of the hacker community.</p>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ━━ PROJECT SHOWCASE ━━ */}
      <AnimatedSection>
        <section className={`section ${styles.howSection}`}>
          <div className="container">
            <SectionHeading label="Projects" title="Built at Hackathons" subtitle="Check out winning projects from our community" />
            <div className={styles.projectGrid}>
              {projects.slice(0, 3).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            <div className={styles.viewAll}>
              <Link href="/projects" className="btn btn-ghost">View All Projects <ChevronRight size={16} /></Link>
            </div>
          </div>
        </section>
      </AnimatedSection>



      {/* ━━ INDUSTRY INSIDER PODCAST ━━ */}
      <AnimatedSection>
        <section className={`section ${styles.howSection}`}>
          <div className="container">
            <SectionHeading label="Podcast" title="Industry Insider" subtitle="Real conversations with builders, founders and industry leaders" />
            <div className={styles.hackathonCarouselWrapper}>
              <button className={`${styles.carouselBtn} ${styles.prevBtn}`} onClick={scrollPodcastLeft} aria-label="Previous episodes">
                <ChevronLeft size={24} />
              </button>
              <div className={styles.podcastScroll} ref={podcastScrollRef}>
                {podcasts.map((p) => (
                  <PodcastCard key={p.id} podcast={p} />
                ))}
              </div>
              <button className={`${styles.carouselBtn} ${styles.nextBtn}`} onClick={scrollPodcastRight} aria-label="Next episodes">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className={styles.viewAll}>
              <Link href="/podcasts" className="btn btn-ghost">
  View All Episodes <ChevronRight size={16} />
</Link>
            </div>
          </div>
        </section>
      </AnimatedSection>



      {/* ━━ EVENT ORGANIZATION ━━ */}
      <AnimatedSection>
        <section className="section">
          <div className={`container ${styles.hostSection}`}>
            <div className={styles.hostContent}>
              <h2 className="heading-md gradient-text">Host an Event with Us</h2>
              <p className={styles.hostDesc}>
                If you want to host an event with us, Hacker&apos;s Unity provides the platform, community, and expertise. This includes promotion, marketing support, and technical infrastructure.
              </p>
              <Link href="/contact" className="btn btn-primary">Partner With Us <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ━━ SPONSORS ━━ */}
      <AnimatedSection>
        <section className={`section ${styles.howSection}`}>
          <div className="container">
            <SectionHeading label="Partners" title="Sponsors & Partners" subtitle="Backed by the best in tech" />
            <div className={styles.sponsorTiers}>
              {Object.entries(sponsors).map(([tier, list]) => (
                <div key={tier} className={styles.tier}>
                  <span className={styles.tierLabel}>
                    {tier.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <div className={styles.tierLogos}>
                    {list.map((s) => (
                      <a key={s.name} href={s.website} className={styles.sponsorLogo} target="_blank" rel="noopener noreferrer" title={s.name}>
                        {s.logo.startsWith('/') ? (
  <img src={s.logo} alt={s.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
) : (
  <span className={styles.sponsorInitial}>{s.logo}</span>
)}
<span className={styles.sponsorName}>{s.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.viewAll}>
              <Link href="/sponsors" className="btn btn-ghost">View All Sponsors <ChevronRight size={16} /></Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ━━ NEWSLETTER ━━ */}
      <NewsletterCTA />
    </>
  );
}
