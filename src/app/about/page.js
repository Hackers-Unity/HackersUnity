import Image from 'next/image';
import { Target, Heart, Lightbulb, Globe, Rocket, Shield } from 'lucide-react';
import { FaLinkedinIn, FaXTwitter, FaInstagram } from 'react-icons/fa6';
import SectionHeading from '@/components/SectionHeading';
import AnimatedSection from '@/components/AnimatedSection';
import { team } from '@/data/team';
import styles from './about.module.css';

export const metadata = { title: "About — Hacker's Unity", description: "Learn about Hacker's Unity's mission to empower the next generation of builders." };

export default function AboutPage() {
  const values = [
    { icon: <Heart size={24} />, title: 'Community First', desc: 'Everything we do is for our community of builders.' },
    { icon: <Lightbulb size={24} />, title: 'Innovation', desc: 'We push boundaries and encourage creative solutions.' },
    { icon: <Globe size={24} />, title: 'Inclusivity', desc: 'Open to all backgrounds, skill levels, and perspectives.' },
    { icon: <Rocket size={24} />, title: 'Impact', desc: 'We focus on building things that matter.' },
    { icon: <Shield size={24} />, title: 'Integrity', desc: 'Transparent, ethical, and always learning.' },
    { icon: <Target size={24} />, title: 'Excellence', desc: 'High quality in everything we organize.' },
  ];

  const milestones = [
    { year: '2022', event: 'Founded with 50 members' },
    { year: '2023', event: 'Hosted first national hackathon (1000+ participants)' },
    { year: '2024', event: 'Reached 5,000 community members, 100+ hackathons' },
    { year: '2025', event: 'Expanded to 120+ colleges, launched mentorship program' },
    { year: '2026', event: '10,000+ members, ₹50L+ in prizes distributed' },
  ];

  const socialIcons = {
    linkedin: FaLinkedinIn,
    twitter: FaXTwitter,
    instagram: FaInstagram,
  };

  return (
    <>
      <section className={styles.hero}><div className="container"><AnimatedSection>
        <SectionHeading label="About Us" title="Empowering the Next Generation of Builders" subtitle="Hacker's Unity is building a global developer community where students and developers don't just build projects — they build products." />
      </AnimatedSection></div></section>

      <section className="section"><div className="container"><AnimatedSection>
        <div className={styles.mission}>
          <h2 className="heading-md">Our <span className="gradient-text">Vision</span></h2>
          <p className="text-body">Hacker&apos;s Unity&apos;s vision is to build a global developer community where students and developers don&apos;t just create projects — they create products. Through the Hacker&apos;s Unity network, we connect builders with funding, investment opportunities, and the resources they need to turn their ideas into reality.</p>
        </div>
      </AnimatedSection></div></section>

      <section className={`section ${styles.valuesSection}`}><div className="container"><AnimatedSection>
        <SectionHeading label="Values" title="What We Stand For" />
        <div className={styles.valuesGrid}>{values.map((v, i) => (
          <div key={i} className={`glass-card ${styles.valueCard}`}>
            <div className={styles.valueIcon}>{v.icon}</div>
            <h3 className={styles.valueTitle}>{v.title}</h3>
            <p className={styles.valueDesc}>{v.desc}</p>
          </div>
        ))}</div>
      </AnimatedSection></div></section>

      <section className="section"><div className="container"><AnimatedSection>
        <SectionHeading label="Journey" title="Our Milestones" />
        <div className={styles.timeline}>{milestones.map((m, i) => (
          <div key={i} className={styles.milestone}>
            <span className={styles.milestoneYear}>{m.year}</span>
            <div className={styles.milestoneDot} />
            <span className={styles.milestoneEvent}>{m.event}</span>
          </div>
        ))}</div>
      </AnimatedSection></div></section>

      <section className={`section ${styles.valuesSection}`}><div className="container"><AnimatedSection>
        <SectionHeading label="Team" title="Meet the Team" subtitle="The people behind Hacker's Unity" />
        <div className={styles.teamGrid}>{team.map(m => (
          <div key={m.id} className={`glass-card ${styles.teamCard}`}>
            <div className={styles.teamAvatarWrapper}>
              <Image src={m.avatar} alt={m.name} width={96} height={96} className={styles.teamAvatar} />
            </div>
            <h3 className={styles.teamName}>{m.name}</h3>
            <span className={styles.teamRole}>{m.role}</span>
            <div className={styles.teamSocials}>
              {Object.entries(m.social).map(([platform, url]) => {
                const Icon = socialIcons[platform];
                if (!Icon || url === '#') return null;
                return (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={`${m.name} on ${platform}`}>
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
            <p className={styles.teamBio}>{m.bio}</p>
          </div>
        ))}</div>
      </AnimatedSection></div></section>
    </>
  );
}
