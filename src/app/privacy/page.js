import styles from '../terms/legal.module.css';

export const metadata = { title: "Privacy Policy — Hacker's Unity", description: "Privacy Policy for the Hacker's Unity platform." };

export default function PrivacyPage() {
  return (
    <section className={styles.legalPage}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.label}>LEGAL</span>
          <h1 className="heading-lg">Privacy <span className="gradient-text">Policy</span></h1>
          <p className={styles.updated}>Last updated: May 2, 2026</p>
        </div>

        <div className={styles.content}>
          <p className={styles.intro}>
            At Hacker&apos;s Unity, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform, attend our events, or interact with our services.
          </p>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className={styles.list}>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and basic profile details provided during registration or event participation.</li>
              <li><strong>Event Data:</strong> Hackathon registrations, participation history, team formations, and project submissions.</li>
              <li><strong>Newsletter Subscriptions:</strong> Email addresses submitted through our newsletter sign-up forms.</li>
              <li><strong>Usage Data:</strong> Browser type, device information, IP address, pages visited, and interaction patterns collected through cookies and analytics tools.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>2. How We Use Your Data</h2>
            <p>The information we collect is used for the following purposes:</p>
            <ul className={styles.list}>
              <li>To manage and organize hackathons, tech events, and community programs.</li>
              <li>To send updates, newsletters, event announcements, and relevant communications.</li>
              <li>To improve platform performance, user experience, and service quality.</li>
              <li>To verify participant eligibility and ensure fair competition in events.</li>
              <li>To respond to user inquiries and provide customer support.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Data Sharing</h2>
            <ul className={styles.list}>
              <li>We <strong>do not sell</strong> your personal data to third parties under any circumstances.</li>
              <li>Data may be shared with trusted service providers (email delivery services, analytics platforms, event management tools) solely for operational purposes.</li>
              <li>We may disclose information if required by law or to protect the rights and safety of Hacker&apos;s Unity and its users.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Your Rights</h2>
            <p>As a user of Hacker&apos;s Unity, you have the following rights:</p>
            <ul className={styles.list}>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request updates or corrections to your personal information.</li>
              <li><strong>Deletion:</strong> Request the deletion of your personal data, subject to legal requirements.</li>
              <li><strong>Unsubscribe:</strong> Opt out of newsletters and promotional emails at any time using the unsubscribe link provided in every email.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Cookies & Tracking</h2>
            <ul className={styles.list}>
              <li>Our platform may use cookies and similar tracking technologies to enhance functionality and analyze usage patterns.</li>
              <li>You can control cookie preferences through your browser settings.</li>
              <li>We use analytics tools (such as Google Analytics) to understand how users interact with our platform.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Children&apos;s Privacy</h2>
            <p>Hacker&apos;s Unity is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such information, we will take steps to delete it promptly.</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Updates to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Any significant changes will be communicated through our platform or via email. Continued use of our services after any changes constitutes acceptance of the updated policy.</p>
          </div>

          <div className={styles.contact}>
            <h3>Questions?</h3>
            <p>If you have any questions or concerns about this Privacy Policy, please reach out to us at <a href="mailto:hackerunity.community@gmail.com">hackerunity.community@gmail.com</a></p>
          </div>
        </div>
      </div>
    </section>
  );
}
