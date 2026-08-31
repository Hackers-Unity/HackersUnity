import styles from './SectionHeading.module.css';

export default function SectionHeading({ label, title, subtitle, align = 'center' }) {
  const renderTitle = () => {
    if (typeof title !== 'string') return title;

    const highlights = {
      'Live & Upcoming Hackathons & Events': { base: 'Live & Upcoming', accent: 'Hackathons & Events' },
      'Events Highlights': { base: 'Events', accent: 'Highlights' },
      'Built at Hackathons': { base: 'Built at', accent: 'Hackathons' },
      'Industry Insider': { base: 'Industry', accent: 'Insider' },
      'Sponsors & Partners': { base: 'Sponsors &', accent: 'Partners' },
      'Browse All Hackathons': { base: 'Browse All', accent: 'Hackathons' },
      'Join a Global Community of Builders': { base: 'Join a Global Community of', accent: 'Builders' },
      'Empowering the Next Generation of Builders': { base: 'Empowering the Next', accent: 'Generation of Builders' },
      'What We Stand For': { base: 'What We', accent: 'Stand For' },
      'Our Milestones': { base: 'Our', accent: 'Milestones' },
      'Meet the Team': { base: 'Meet the', accent: 'Team' },
      'Get in Touch': { base: 'Get in', accent: 'Touch' },
      'Frequently Asked Questions': { base: 'Frequently Asked', accent: 'Questions' },
      'Meetups & Events Calendar': { base: 'Meetups & Events', accent: 'Calendar' },
      'Project Showcase': { base: 'Project', accent: 'Showcase' },
    };

    if (highlights[title]) {
      return (
        <>
          <span>{highlights[title].base}</span>{' '}
          <span className={styles.accent}>{highlights[title].accent}</span>
        </>
      );
    }

    const words = title.trim().split(' ');
    if (words.length > 1) {
      const splitAt = words.length > 4 ? words.length - 2 : words.length - 1;
      const base = words.slice(0, splitAt).join(' ');
      const accent = words.slice(splitAt).join(' ');
      return (
        <>
          <span>{base}</span>{' '}
          <span className={styles.accent}>{accent}</span>
        </>
      );
    }

    return title;
  };

  return (
    <div className={`${styles.wrapper} ${align === 'center' ? styles.center : styles.left}`}>
      {label && <span className={styles.label}>{label}</span>}
      <h2 className={`heading-lg ${styles.title}`}>{renderTitle()}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
