import { Download, Palette, MapPin, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import styles from './brandkit.module.css';

export const metadata = {
  title: "Brand Kit — Hacker's Unity",
  description: "Official brand assets, logos, and usage guidelines for Hacker's Unity. Download approved logo files and learn how to correctly represent the brand.",
};

const logos = [
  {
    name: "Primary Logo",
    description: "Full-color version — use on dark backgrounds",
    file: "/brand-kit/hackers-unity-logo.png",
    downloadName: "HackersUnity-Logo-Primary.png",
    format: "PNG",
    bgClass: "Dark",
  },
  {
    name: "Black Logo",
    description: "Monochrome version — use on light backgrounds",
    file: "/brand-kit/hackers-unity-logo-black.png",
    downloadName: "HackersUnity-Logo-Black.png",
    format: "PNG",
    bgClass: "Light",
  },
];

export default function BrandKitPage() {
  return (
    <section className={styles.brandKitPage}>
      <div className={`container ${styles.inner}`}>
        {/* ---- Header ---- */}
        <div className={styles.header}>
          <span className={styles.label}>BRAND RESOURCES</span>
          <h1 className="heading-lg">Brand <span className="gradient-text">Kit</span></h1>
          <p className={styles.subtitle}>
            Official logo assets and brand usage guidelines for Hacker&apos;s Unity. 
            Use these resources when representing our community in events, partnerships, and promotional materials.
          </p>
        </div>

        {/* ---- Logo Downloads ---- */}
        <div className={styles.logoSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Palette size={20} />
            </div>
            <h2 className={styles.sectionTitle}>Logo Assets</h2>
          </div>

          <div className={styles.logoGrid}>
            {logos.map((logo) => (
              <div key={logo.name} className={styles.logoCard}>
                <div className={`${styles.logoPreview} ${logo.bgClass === 'Light' ? styles.logoPreviewLight : styles.logoPreviewDark}`}>
                  <img
                    src={logo.file}
                    alt={`Hacker's Unity ${logo.name}`}
                    className={styles.logoImg}
                  />
                </div>
                <div className={styles.logoInfo}>
                  <div>
                    <div className={styles.logoName}>{logo.name}</div>
                    <div className={styles.logoMeta}>{logo.description} &middot; {logo.format}</div>
                  </div>
                  <a
                    href={logo.file}
                    download={logo.downloadName}
                    className={styles.downloadBtn}
                  >
                    <Download size={15} />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className={styles.separator} />

        {/* ---- Brand Guidelines ---- */}
        <div className={styles.guidelines}>

          {/* Section 1 — Brand Usage */}
          <div className={styles.guidelineSection}>
            <div className={styles.guidelineHeader}>
              <div className={`${styles.guidelineIcon} ${styles.guidelineIconOrange}`}>
                <CheckCircle2 size={22} />
              </div>
              <h2 className={styles.guidelineTitle}>Brand Usage Guidelines</h2>
            </div>
            <div className={styles.guidelineBody}>
              <p>
                You may use the Hacker&apos;s Unity logo in your events and promotional materials.
              </p>
              <p>
                Please note that <strong>&ldquo;Community Partner&rdquo;</strong> is not a category used by Hacker&apos;s Unity.
                Instead, you may mention us using these categories:
              </p>
              <ul className={styles.tagList}>
                <li className={`${styles.tagItem} ${styles.tagItemGreen}`}>
                  <CheckCircle2 size={14} /> Ecosystem Partner
                </li>
                <li className={`${styles.tagItem} ${styles.tagItemGreen}`}>
                  <CheckCircle2 size={14} /> Supported By
                </li>
                <li className={`${styles.tagItem} ${styles.tagItemGreen}`}>
                  <CheckCircle2 size={14} /> Presented Partner
                </li>
              </ul>

              <div className={`${styles.callout} ${styles.calloutWarning}`}>
                <span className={styles.calloutIcon}><AlertTriangle size={18} color="#F5C875" /></span>
                <span className={styles.calloutText}>
                  If you want to use categories like <strong>In-Kind Partner</strong>, <strong>Silver Partner</strong>, <strong>Gold Partner</strong>, <strong>Platinum Partner</strong>, or any other sponsorship/partnership category, you <strong>must first contact the Hacker&apos;s Unity team</strong> for approval.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2 — Logo Placement */}
          <div className={styles.guidelineSection}>
            <div className={styles.guidelineHeader}>
              <div className={`${styles.guidelineIcon} ${styles.guidelineIconBlue}`}>
                <MapPin size={22} />
              </div>
              <h2 className={styles.guidelineTitle}>Logo Placement Guidelines</h2>
            </div>
            <div className={styles.guidelineBody}>
              <p>
                The Hacker&apos;s Unity logo <strong>must not</strong> be placed at the bottom section of posters or event creatives.
                The logo should always be positioned at the <strong>top area</strong> of the design.
              </p>
              <p>You may place it on the:</p>
              <ul className={styles.tagList}>
                <li className={`${styles.tagItem} ${styles.tagItemBlue}`}>
                  <MapPin size={14} /> Top Left
                </li>
                <li className={`${styles.tagItem} ${styles.tagItemBlue}`}>
                  <MapPin size={14} /> Top Center
                </li>
                <li className={`${styles.tagItem} ${styles.tagItemBlue}`}>
                  <MapPin size={14} /> Top Right
                </li>
              </ul>

              <p>Mentioning the category is <strong>optional</strong> when the logo is placed at the top. Both of these are acceptable:</p>
              <ul className={styles.bulletList}>
                <li>Hacker&apos;s Unity + Ecosystem Partner</li>
                <li>Only the Hacker&apos;s Unity logo</li>
              </ul>

              <div className={`${styles.callout} ${styles.calloutSuccess}`}>
                <span className={styles.calloutIcon}><Info size={18} color="#6ee7b7" /></span>
                <span className={styles.calloutText}>
                  Both options are acceptable as long as the logo is placed in the <strong>top section</strong> of the creative.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3 — Asset Modification Rules */}
          <div className={styles.guidelineSection}>
            <div className={styles.guidelineHeader}>
              <div className={`${styles.guidelineIcon} ${styles.guidelineIconRed}`}>
                <ShieldAlert size={22} />
              </div>
              <h2 className={styles.guidelineTitle}>Asset Modification Rules</h2>
            </div>
            <div className={styles.guidelineBody}>
              <p>
                Please use <strong>only the official logos</strong> provided in this Brand Kit.
              </p>

              <div className={`${styles.callout} ${styles.calloutDanger}`}>
                <span className={styles.calloutIcon}><ShieldAlert size={18} color="#F07B8A" /></span>
                <span className={styles.calloutText}>
                  <strong>Do not</strong> modify, stretch, recolor, redesign, or edit the logo assets in any way. Only the exact provided versions should be used.
                </span>
              </div>

              <p>Prohibited modifications include:</p>
              <ul className={styles.bulletList}>
                <li>Changing the logo colors or applying filters</li>
                <li>Stretching, skewing, or distorting the logo proportions</li>
                <li>Adding effects, shadows, or outlines not in the original</li>
                <li>Recreating or redrawing the logo</li>
                <li>Using the logo as part of another logo or design element</li>
              </ul>
            </div>
          </div>

        </div>

        {/* ---- Contact CTA ---- */}
        <div className={styles.contactCta}>
          <h3>Need Custom Assets or Have Questions?</h3>
          <p>
            If you need additional formats, sizes, or have questions about brand usage, reach out to us at{' '}
            <a href="mailto:hackerunity.community@gmail.com">hackerunity.community@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
