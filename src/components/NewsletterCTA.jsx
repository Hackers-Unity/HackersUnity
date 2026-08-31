'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import styles from './NewsletterCTA.module.css';

export default function NewsletterCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) { setSubmitted(true); setEmail(''); }
  };

  return (
    <section className={`section ${styles.wrapper}`}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <span className="section-label">Newsletter</span>
          <h2 className="heading-lg">Get Hackathon Alerts <span className="gradient-text">in Your Inbox</span></h2>
          <p className={styles.sub}>Join 8,000+ hackers getting weekly alerts about the latest hackathons, workshops, and opportunities.</p>
        </div>
        {submitted ? (
          <div className={styles.success}>
            <span>🎉</span>
            <p>You&apos;re in! Check your inbox for a confirmation.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputWrapper}>
              <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} aria-label="Email address" />
              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} aria-label="Subscribe">
                <Send size={18} />
                <span>Subscribe</span>
              </button>
            </div>
            <p className={styles.privacy}>No spam, ever. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    </section>
  );
}
