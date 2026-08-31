import Link from 'next/link';
import { ExternalLink, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import AnimatedSection from '@/components/AnimatedSection';
import { sponsors } from '@/data/sponsors';
import styles from './sponsors.module.css';

export const metadata = { title: "Sponsors & Partners — Hacker's Unity", description: "Meet the amazing companies powering Hacker's Unity hackathons and events." };

export default function SponsorsPage() {
  const benefits = ['Brand visibility to 10,000+ developers', 'Access to top talent pipeline', 'Custom hackathon sponsorship', 'Logo on all marketing materials', 'Dedicated booth at in-person events', 'Keynote and workshop slots'];

  return (
    <>
      <section className={styles.hero}><div className="container"><AnimatedSection><SectionHeading label="Partners" title="Sponsors & Partners" subtitle="Powering hackathons and empowering the next generation of builders" /></AnimatedSection></div></section>

      <section className="section"><div className="container">
        <AnimatedSection>
          <div className={styles.tiers}>
            {Object.entries(sponsors).map(([tier, list]) => (
              <div key={tier} className={styles.tier}>
                <h3 className={styles.tierTitle}>{tier.charAt(0).toUpperCase() + tier.slice(1)} {tier === 'platinum' ? '💎' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🤝'}</h3>
                <div className={styles.tierGrid}>
                  {list.map(s => (
                    <a key={s.name} href={s.website} className={styles.sponsorCard} target="_blank" rel="noopener noreferrer">
                      {s.logo.startsWith('/') ? (
                        <img src={s.logo} alt={s.name} className={styles.logoImg} />
                      ) : (
                        <span className={styles.logo}>{s.logo}</span>
                      )}
                      <span className={styles.name}>{s.name}</span>
                      <span className={styles.desc}>{s.description}</span>
                      <span className={styles.visitLink}><ExternalLink size={12} /> Visit Website</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div></section>

      <section className={`section ${styles.ctaSection}`}><div className="container">
        <AnimatedSection>
          <div className={styles.ctaCard}>
            <h2 className="heading-md">Become a <span className="gradient-text">Sponsor</span></h2>
            <p className="text-body" style={{ maxWidth: 500, margin: '0 auto' }}>Partner with us to reach the most talented developers and students in India.</p>
            <div className={styles.benefitsList}>{benefits.map(b => <div key={b} className={styles.benefit}>✓ {b}</div>)}</div>
            <Link href="/contact" className="btn btn-primary btn-lg">Get in Touch <ArrowRight size={16} /></Link>
          </div>
        </AnimatedSection>
      </div></section>
    </>
  );
}
