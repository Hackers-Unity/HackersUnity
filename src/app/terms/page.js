import styles from './legal.module.css';

export const metadata = { title: "Terms of Service — Hacker's Unity", description: "Terms of Service for the Hacker's Unity platform." };

export default function TermsPage() {
  return (
    <section className={styles.legalPage}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.label}>LEGAL</span>
          <h1 className="heading-lg">Terms of <span className="gradient-text">Service</span></h1>
          <p className={styles.updated}>Last updated: May 2, 2026</p>
        </div>

        <div className={styles.content}>
          <p className={styles.intro}>
            Welcome to Hacker&apos;s Unity. By accessing or using our platform, website, or services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
            <p>By accessing or using the Hacker&apos;s Unity platform — including our website, hackathons, events, community programs, and any related services — you acknowledge that you have read, understood, and agree to comply with all terms and conditions outlined herein. These terms constitute a legally binding agreement between you and Hacker&apos;s Unity.</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Use of Brand & Intellectual Property</h2>
            <ul className={styles.list}>
              <li>Users are allowed to reference &quot;Hacker&apos;s Unity&quot; for participation or collaboration purposes only.</li>
              <li>Unauthorized use of the Hacker&apos;s Unity name, logo, branding, or identity for personal gain, courses, promotions, or third-party services is <strong>strictly prohibited</strong>.</li>
              <li>Users cannot create courses, programs, or products using the Hacker&apos;s Unity name without prior written permission from the organization.</li>
              <li>All trademarks, logos, and branding materials are the exclusive property of Hacker&apos;s Unity and may not be reproduced without authorization.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Prohibited Activities</h2>
            <p>Users of the platform must not:</p>
            <ul className={styles.list}>
              <li>Engage in any illegal, fraudulent, or harmful activities on or through the platform.</li>
              <li>Misuse the platform for hacking, spamming, phishing, or exploiting systems and infrastructure.</li>
              <li>Submit plagiarized, stolen, or copied work in hackathons or any other events.</li>
              <li>Impersonate the organization, its founders, team members, or other users.</li>
              <li>Distribute malicious software, viruses, or any code designed to harm or disrupt services.</li>
              <li>Harass, bully, or discriminate against other community members.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Hackathon & Event Rules</h2>
            <ul className={styles.list}>
              <li>All participants must adhere to fair competition guidelines and the specific rules of each event.</li>
              <li>Any form of cheating, plagiarism, or rule violation may result in immediate disqualification and potential ban from future events.</li>
              <li>Hacker&apos;s Unity reserves the right to modify, cancel, or reschedule events at its sole discretion.</li>
              <li>Prize distribution is subject to verification of eligibility and compliance with event rules.</li>
              <li>Decisions made by judges and organizers are final and binding.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>5. User Content & Ownership</h2>
            <ul className={styles.list}>
              <li>Users retain full ownership of their submissions, projects, and intellectual property created during events.</li>
              <li>By participating in Hacker&apos;s Unity events, users grant the organization a non-exclusive, royalty-free license to showcase, display, and promote their projects for community and promotional purposes.</li>
              <li>Hacker&apos;s Unity will always credit the original creators when showcasing user projects.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Account & Access Control</h2>
            <ul className={styles.list}>
              <li>Users are responsible for maintaining the confidentiality of their account credentials.</li>
              <li>Accounts may be suspended or permanently terminated if any of these terms are violated.</li>
              <li>Hacker&apos;s Unity reserves the right to refuse service or access to any user at its discretion.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Limitation of Liability</h2>
            <p>Hacker&apos;s Unity, its founders, team members, and affiliates are not responsible for any direct, indirect, incidental, consequential, or special damages arising from the use of, or inability to use, the platform or services. This includes but is not limited to loss of data, revenue, or opportunities.</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Governing Law & Jurisdiction</h2>
            <p>These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.</p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Changes to Terms</h2>
            <p>Hacker&apos;s Unity reserves the right to update or modify these Terms of Service at any time without prior notice. Continued use of the platform after any changes constitutes acceptance of the revised terms. We encourage users to review this page periodically.</p>
          </div>

          <div className={styles.contact}>
            <h3>Questions?</h3>
            <p>If you have any questions about these Terms of Service, please contact us at <a href="mailto:hackerunity.community@gmail.com">hackerunity.community@gmail.com</a></p>
          </div>
        </div>
      </div>
    </section>
  );
}
