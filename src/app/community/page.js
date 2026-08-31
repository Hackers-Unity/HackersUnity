import Link from 'next/link';
import { MessageCircle, Zap, Users, BookOpen, Award, ArrowRight, Code } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import AnimatedSection from '@/components/AnimatedSection';
import CommunityGallery from '@/components/CommunityGallery';
import styles from './community.module.css';

export const metadata = { title: "Community Hacker's Unity", description: "Join a global community of 10,000+ builders, innovators and hackers." };

export default function CommunityPage() {
  const features = [
    { icon: <MessageCircle size={24} />, title: '50+ Active Channels', desc: 'From #web-dev to #ai-ml, find your tribe in our Discord server.' },
    { icon: <Zap size={24} />, title: '20+ Weekly Events', desc: 'Workshops, AMAs, code reviews, and pair programming sessions.' },
    { icon: <Users size={24} />, title: '100+ Mentors', desc: 'Industry professionals ready to guide your learning journey.' },
    { icon: <BookOpen size={24} />, title: 'Learning Paths', desc: 'Curated resources and roadmaps for every tech domain.' },
    { icon: <Award size={24} />, title: 'Recognition System', desc: 'Earn badges, climb the leaderboard, and get featured.' },
    { icon: <Code size={24} />, title: 'Career Connect', desc: 'Get referrals, internship opportunities, and industry exposure.' },
  ];

  return (
    <>
      <section className={styles.hero}><div className="container"><AnimatedSection><SectionHeading label="Community" title="Join a Global Community of Builders" subtitle="Connect, collaborate, and grow with 10,000+ developers, students, and innovators" /></AnimatedSection></div></section>

      <section className="section"><div className="container">
        <AnimatedSection>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div key={i} className={`glass-card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <CommunityGallery />
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.joinCta}>
            <h2 className="heading-md">Ready to <span className="gradient-text">Join?</span></h2>
            <p className="text-body">Our WhatsApp is the beating heart of the community. Jump in!</p>
            <a href="https://chat.whatsapp.com/JqVKrBiZIdND1n40ffErw3?mode=gi_t" className="btn btn-primary btn-lg"><MessageCircle size={18} /> Join WhatsApp Community <ArrowRight size={16} /></a>
          </div>
        </AnimatedSection>
      </div></section>
    </>
  );
}
