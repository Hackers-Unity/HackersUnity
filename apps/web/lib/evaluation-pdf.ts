import { ProductEvaluationReport, ProjectSubmission } from '@/lib/storage';

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CRITERIA_CONFIG = [
  { key: 'problemValidation', label: 'Problem Validation & Importance', weight: '15%' },
  { key: 'productValue', label: 'Product Value & Usefulness', weight: '15%' },
  { key: 'innovation', label: 'Innovation & Differentiation', weight: '10%' },
  { key: 'productExperience', label: 'Product Experience & Usability', weight: '10%' },
  { key: 'marketPotential', label: 'Market Potential & Target Users', weight: '15%' },
  { key: 'scalability', label: 'Scalability & Technical Feasibility', weight: '10%' },
  { key: 'productExecution', label: 'Product Execution & Completeness', weight: '15%' },
  { key: 'businessModel', label: 'Business Model & Sustainability', weight: '10%' },
] as const;

function getScoreBadgeColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 80) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
  if (score >= 60) return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' };
  if (score >= 40) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
  return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
}

function getStatusBadge(status?: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'WINNER':
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    case 'ACCEPTED':
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
    case 'UNDER_REVIEW':
      return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
    case 'REJECTED':
      return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' };
    default:
      return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  }
}

/**
 * Generate HTML string for an individual project's evaluation report
 */
function renderSingleProjectHtml(
  sub: ProjectSubmission,
  evalReport?: ProductEvaluationReport | null,
  index?: number,
  total?: number
): string {
  const score = evalReport?.finalScore ?? sub.score ?? 0;
  const scoreColors = getScoreBadgeColor(score);
  const statusColors = getStatusBadge(sub.status);
  const dateStr = sub.submittedAt
    ? new Date(sub.submittedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const evaluatedAtStr = evalReport?.evaluatedAt
    ? new Date(evalReport.evaluatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : dateStr;

  const projectIndexLabel =
    typeof index === 'number' && typeof total === 'number'
      ? `Project ${index + 1} of ${total}`
      : 'Participant Evaluation Dossier';

  return `
  <section class="project-dossier">
    <!-- Project Header Bar -->
    <div class="project-top-bar">
      <div>
        <div class="project-counter-tag">${projectIndexLabel}</div>
        <h2 class="project-heading">${escapeHtml(sub.projectTitle)}</h2>
        ${sub.tagline ? `<div class="project-subtag">${escapeHtml(sub.tagline)}</div>` : ''}
      </div>
      <div class="score-display-box" style="background:${scoreColors.bg}; border-color:${scoreColors.border};">
        <div class="score-number" style="color:${scoreColors.text};">${score}<span class="score-denom">/100</span></div>
        <div class="score-stage">${escapeHtml(evalReport?.productStage || (sub.status ? sub.status.replace('_', ' ') : 'Evaluated'))}</div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="meta-card-grid">
      <div class="meta-item">
        <span class="meta-label">Submitted By</span>
        <span class="meta-value">${escapeHtml(sub.submittedByName || 'Builder')}</span>
        ${sub.submittedByEmail ? `<span class="meta-sub">${escapeHtml(sub.submittedByEmail)}</span>` : ''}
      </div>
      <div class="meta-item">
        <span class="meta-label">Track / Category</span>
        <span class="meta-value">${escapeHtml(sub.track || 'General')}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Award Status</span>
        <span class="status-pill" style="background:${statusColors.bg}; color:${statusColors.text}; border-color:${statusColors.border};">
          ${escapeHtml(sub.status || 'SUBMITTED')}
        </span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Evaluation Confidence</span>
        <span class="meta-value">${escapeHtml(evalReport?.evaluationConfidence || 'Verified Evaluation')}</span>
        <span class="meta-sub">${evaluatedAtStr}</span>
      </div>
    </div>

    <!-- Executive Product Summary -->
    <div class="section-box summary-box">
      <div class="section-title">
        <span class="icon">💡</span> Executive Product Summary
      </div>
      <p class="summary-text">
        ${escapeHtml(evalReport?.productSummary || sub.projectDescription || 'No description provided.')}
      </p>
    </div>

    <!-- Strengths & Weaknesses 2-Column Grid -->
    <div class="strengths-weaknesses-grid">
      <div class="sw-card strengths">
        <div class="sw-header" style="color:#059669;">
          <span>✓</span> Core Product Strengths
        </div>
        <ul class="sw-list">
          ${
            evalReport?.strengths && evalReport.strengths.length > 0
              ? evalReport.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('')
              : `<li>Solid technical execution and clear presentation</li>`
          }
        </ul>
      </div>

      <div class="sw-card weaknesses">
        <div class="sw-header" style="color:#dc2626;">
          <span>⚠</span> Key Weaknesses & Vulnerabilities
        </div>
        <ul class="sw-list">
          ${
            evalReport?.weaknesses && evalReport.weaknesses.length > 0
              ? evalReport.weaknesses.map((w) => `<li>${escapeHtml(w)}</li>`).join('')
              : `<li>Ensure market validation and ongoing user discovery</li>`
          }
        </ul>
      </div>
    </div>

    ${
      evalReport?.scores
        ? `
    <!-- 8-Factor Criteria Breakdown Table -->
    <div class="section-box no-break">
      <div class="section-title">
        <span class="icon">📊</span> 8-Factor Viability Score Breakdown
      </div>
      <table class="criteria-table">
        <thead>
          <tr>
            <th style="width: 32%;">Criterion</th>
            <th style="width: 12%; text-align: center;">Weight</th>
            <th style="width: 14%; text-align: center;">Score (/10)</th>
            <th style="width: 42%;">Evaluator Rationale & Justification</th>
          </tr>
        </thead>
        <tbody>
          ${CRITERIA_CONFIG.map(({ key, label, weight }) => {
            const item = evalReport.scores?.[key as keyof typeof evalReport.scores];
            const itemScore = item?.score ?? 0;
            const barWidth = Math.min(100, itemScore * 10);
            return `
            <tr>
              <td><strong>${escapeHtml(label)}</strong></td>
              <td style="text-align: center; color: #64748b; font-weight: 600;">${weight}</td>
              <td style="text-align: center;">
                <span class="factor-score-num">${itemScore}/10</span>
                <div class="mini-bar-track">
                  <div class="mini-bar-fill" style="width: ${barWidth}%;"></div>
                </div>
              </td>
              <td class="rationale-text">${escapeHtml(item?.reason || 'Evaluated against hackathon standards.')}</td>
            </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- Market & Tech Grid -->
    <div class="market-tech-grid no-break">
      <!-- Market & Business -->
      <div class="sub-card">
        <div class="sub-card-title">💼 Market & Business Potential</div>
        <div class="sub-card-body">
          <div class="field-row">
            <span class="field-label">Target Audience:</span>
            <span class="field-val">
              ${
                evalReport?.targetUsers && evalReport.targetUsers.length > 0
                  ? evalReport.targetUsers.map((u) => `<span class="badge-tag">${escapeHtml(u)}</span>`).join(' ')
                  : 'Hackathon target ecosystem'
              }
            </span>
          </div>
          ${
            evalReport?.marketOpportunity
              ? `
          <div class="field-row">
            <span class="field-label">Opportunity:</span>
            <p class="field-val-p">${escapeHtml(evalReport.marketOpportunity)}</p>
          </div>
          `
              : ''
          }
          ${
            evalReport?.businessPotential?.possibleModels?.length
              ? `
          <div class="field-row">
            <span class="field-label">Monetization:</span>
            <span class="field-val">
              ${evalReport.businessPotential.possibleModels
                .map((m) => `<span class="badge-tag blue">${escapeHtml(m)}</span>`)
                .join(' ')}
            </span>
          </div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Tech Stack & Architecture -->
      <div class="sub-card">
        <div class="sub-card-title">⚙️ Tech Stack & Architecture</div>
        <div class="sub-card-body">
          <div class="field-row">
            <span class="field-label">Detected Tech Stack:</span>
            <span class="field-val">
              ${
                evalReport?.techStackAnalysis?.detectedStack && evalReport.techStackAnalysis.detectedStack.length > 0
                  ? evalReport.techStackAnalysis.detectedStack
                      .map((t) => `<span class="badge-tag purple">${escapeHtml(t)}</span>`)
                      .join(' ')
                  : 'Web / Full-Stack Stack'
              }
            </span>
          </div>
          ${
            evalReport?.techStackAnalysis?.suitability
              ? `
          <div class="field-row">
            <span class="field-label">Architecture Suitability:</span>
            <p class="field-val-p">${escapeHtml(evalReport.techStackAnalysis.suitability)}</p>
          </div>
          `
              : ''
          }
          ${
            evalReport?.techStackAnalysis?.scalability
              ? `
          <div class="field-row">
            <span class="field-label">Scalability Assessment:</span>
            <p class="field-val-p">${escapeHtml(evalReport.techStackAnalysis.scalability)}</p>
          </div>
          `
              : ''
          }
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    ${
      evalReport?.recommendations && evalReport.recommendations.length > 0
        ? `
    <div class="section-box no-break">
      <div class="section-title">
        <span class="icon">🚀</span> Strategic Actionable Next Steps
      </div>
      <ol class="recommendations-list">
        ${evalReport.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
      </ol>
    </div>
    `
        : ''
    }

    <!-- Reviewer Notes (if any) -->
    ${
      sub.reviewNotes
        ? `
    <div class="section-box no-break" style="background:#fffbeb; border-color:#fde68a;">
      <div class="section-title" style="color:#b45309;">
        <span class="icon">📝</span> Judge / Evaluator Remarks
      </div>
      <p class="summary-text" style="color:#78350f;">
        ${escapeHtml(sub.reviewNotes)}
      </p>
    </div>
    `
        : ''
    }

    <!-- Deliverable Links -->
    <div class="deliverables-row no-break">
      <span class="deliv-title">Submitted Deliverables:</span>
      ${
        sub.projectLink
          ? `<a href="${escapeHtml(sub.projectLink)}" target="_blank" class="deliv-link">GitHub / Repo ↗</a>`
          : ''
      }
      ${
        sub.demoVideoUrl
          ? `<a href="${escapeHtml(sub.demoVideoUrl)}" target="_blank" class="deliv-link">Demo Video ↗</a>`
          : ''
      }
      ${
        sub.presentationUrl
          ? `<a href="${escapeHtml(sub.presentationUrl)}" target="_blank" class="deliv-link">Slide Deck ↗</a>`
          : ''
      }
    </div>

    <!-- Project Card Footer -->
    <div class="project-card-footer">
      <div>Hacker's Unity • Product Intelligence Report</div>
      <div>ID: HU-EVAL-${escapeHtml(sub.id.slice(0, 8).toUpperCase())}</div>
    </div>
  </section>
  `;
}

/**
 * Common Stylesheet for High-Fidelity PDF and Print Output
 */
const COMMON_PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 12mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  body {
    background-color: #f8fafc;
    color: #0f172a;
    font-size: 11px;
    line-height: 1.45;
    padding: 20px;
  }

  /* Printable Top Controls */
  .no-print {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 14px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  }
  .no-print button {
    cursor: pointer;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 12px;
    transition: opacity 0.2s;
  }
  .btn-print {
    background: #0099e6;
    color: #ffffff;
  }
  .btn-close {
    background: rgba(255,255,255,0.15);
    color: #ffffff;
    margin-left: 8px;
  }

  @media print {
    .no-print {
      display: none !important;
    }
    body {
      background-color: #ffffff !important;
      padding: 0 !important;
    }
    .page-break {
      page-break-before: always !important;
      break-before: page !important;
    }
    .no-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Cover / Global Header */
  .global-header {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px 28px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    position: relative;
    overflow: hidden;
  }
  .global-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #0099e6 0%, #0F9D58 100%);
  }
  .brand-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .brand-logo-text {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-tag {
    display: inline-block;
    padding: 3px 10px;
    background: rgba(0, 153, 230, 0.1);
    color: #0099e6;
    border: 1px solid rgba(0, 153, 230, 0.25);
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .doc-title {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }
  .doc-sub {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  /* Summary Metrics Row */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px dashed #e2e8f0;
  }
  .metric-tile {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 14px;
  }
  .metric-tile .label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .metric-tile .val {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin-top: 2px;
  }

  /* Table of Contents / Summary Sheet */
  .summary-table-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }
  .summary-table-title {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .roster-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
  }
  .roster-table th {
    background: #f8fafc;
    padding: 7px 10px;
    font-weight: 800;
    text-align: left;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
    text-transform: uppercase;
    font-size: 9px;
    letter-spacing: 0.05em;
  }
  .roster-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }
  .roster-table tr:hover td {
    background-color: #f8fafc;
  }

  /* Project Dossier Block */
  .project-dossier {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px 28px;
    margin-bottom: 24px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    position: relative;
  }
  .project-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f1f5f9;
    margin-bottom: 16px;
  }
  .project-counter-tag {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0099e6;
    margin-bottom: 3px;
  }
  .project-heading {
    font-size: 19px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .project-subtag {
    font-size: 11px;
    color: #0284c7;
    font-weight: 600;
    margin-top: 3px;
  }
  .score-display-box {
    text-align: center;
    border: 1.5px solid;
    border-radius: 14px;
    padding: 8px 16px;
    min-width: 105px;
    flex-shrink: 0;
  }
  .score-number {
    font-size: 26px;
    font-weight: 900;
    line-height: 1;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
  .score-denom {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
  }
  .score-stage {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
    margin-top: 4px;
  }

  /* Metadata Items Grid */
  .meta-card-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .meta-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 12px;
  }
  .meta-label {
    display: block;
    font-size: 8.5px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }
  .meta-value {
    display: block;
    font-size: 11px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta-sub {
    display: block;
    font-size: 9.5px;
    color: #64748b;
    font-family: ui-monospace, monospace;
  }
  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    border: 1px solid;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Section Containers */
  .section-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .summary-text {
    font-size: 11px;
    color: #334155;
    line-height: 1.55;
    white-space: pre-line;
  }

  /* Strengths & Weaknesses Grid */
  .strengths-weaknesses-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .sw-card {
    border-radius: 12px;
    padding: 12px 14px;
    border: 1px solid;
  }
  .sw-card.strengths {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .sw-card.weaknesses {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .sw-header {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .sw-list {
    list-style: none;
    font-size: 10px;
    line-height: 1.45;
  }
  .sw-list li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 4px;
    color: #1e293b;
  }
  .sw-card.strengths .sw-list li::before {
    content: '•';
    color: #059669;
    font-weight: 900;
    position: absolute;
    left: 2px;
  }
  .sw-card.weaknesses .sw-list li::before {
    content: '•';
    color: #dc2626;
    font-weight: 900;
    position: absolute;
    left: 2px;
  }

  /* Criteria Table */
  .criteria-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-top: 6px;
  }
  .criteria-table th {
    background: #e2e8f0;
    padding: 6px 8px;
    font-weight: 800;
    text-align: left;
    color: #334155;
    text-transform: uppercase;
    font-size: 8.5px;
    letter-spacing: 0.05em;
  }
  .criteria-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .factor-score-num {
    font-weight: 800;
    font-family: ui-monospace, monospace;
    color: #0f172a;
    display: block;
    font-size: 10px;
  }
  .mini-bar-track {
    width: 100%;
    height: 4px;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
    margin-top: 3px;
  }
  .mini-bar-fill {
    height: 100%;
    background: #0099e6;
    border-radius: 99px;
  }
  .rationale-text {
    font-size: 9.5px;
    color: #475569;
    line-height: 1.35;
  }

  /* Market & Tech Sub-cards */
  .market-tech-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .sub-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 14px;
  }
  .sub-card-title {
    font-size: 10.5px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }
  .field-row {
    margin-bottom: 6px;
  }
  .field-label {
    display: block;
    font-size: 8.5px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }
  .field-val {
    font-size: 10px;
    color: #1e293b;
    font-weight: 600;
  }
  .field-val-p {
    font-size: 9.5px;
    color: #334155;
    line-height: 1.35;
  }

  .badge-tag {
    display: inline-block;
    padding: 2px 6px;
    background: #e2e8f0;
    color: #334155;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 700;
    margin-right: 4px;
    margin-bottom: 3px;
  }
  .badge-tag.blue {
    background: #e0f2fe;
    color: #0369a1;
  }
  .badge-tag.purple {
    background: #f3e8ff;
    color: #7e22ce;
  }

  /* Recommendations List */
  .recommendations-list {
    padding-left: 18px;
    font-size: 10px;
    color: #334155;
    line-height: 1.5;
  }
  .recommendations-list li {
    margin-bottom: 4px;
  }

  /* Deliverables Row */
  .deliverables-row {
    background: #f1f5f9;
    border-radius: 10px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 10px;
    margin-bottom: 12px;
  }
  .deliv-title {
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    font-size: 8.5px;
    letter-spacing: 0.05em;
  }
  .deliv-link {
    color: #0099e6;
    text-decoration: none;
    font-weight: 700;
  }

  /* Footer */
  .project-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 10px;
    font-size: 8.5px;
    color: #94a3b8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
`;

/**
 * Download single project evaluation report as PDF
 */
export function downloadSingleEvaluationPdf(params: {
  submission: ProjectSubmission;
  evaluation?: ProductEvaluationReport | null;
  eventTitle?: string;
}): void {
  if (typeof window === 'undefined') return;

  const { submission, evaluation, eventTitle = 'Hackathon Event' } = params;
  const projectTitle = submission.projectTitle || 'Project';
  const cleanTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

  const printWindow = window.open('', '_blank', 'width=880,height=960');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Evaluation-Report-${cleanTitle}</title>
  <style>
    ${COMMON_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong>📄 Hacker's Unity AI Product Evaluation Dossier</strong>
      <div style="font-size: 11px; opacity: 0.75;">Click "Save as PDF" in the print destination to save this document</div>
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">Save as PDF / Print</button>
      <button class="btn-close" onclick="window.close()">Close Window</button>
    </div>
  </div>

  <div class="container">
    <div class="global-header">
      <div class="brand-row">
        <div class="brand-logo-text">
          <span>⚡ Hacker's Unity</span>
          <span class="brand-tag">AI Product Intelligence</span>
        </div>
        <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">
          Official Evaluation Record
        </div>
      </div>
      <h1 class="doc-title">${escapeHtml(eventTitle)}</h1>
      <p class="doc-sub">Individual Participant Project Viability & Commercial Readiness Report</p>
    </div>

    ${renderSingleProjectHtml(submission, evaluation, 0, 1)}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    window.print();
  }
}

/**
 * Download ALL participants' evaluation reports in ONE single consolidated PDF, project-wise!
 */
export function downloadAllEvaluationsPdf(params: {
  submissions: ProjectSubmission[];
  eventTitle?: string;
}): void {
  if (typeof window === 'undefined') return;

  const { submissions, eventTitle = 'Hackathon Event' } = params;
  if (!submissions || submissions.length === 0) {
    alert('No submissions found to export.');
    return;
  }

  // Sort submissions: by score descending
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const scoreA = a.aiEvaluation?.finalScore ?? a.score ?? 0;
    const scoreB = b.aiEvaluation?.finalScore ?? b.score ?? 0;
    return scoreB - scoreA;
  });

  const total = sortedSubmissions.length;
  const evaluatedSubmissions = sortedSubmissions.filter(
    (s) => Boolean(s.aiEvaluation) || (typeof s.score === 'number' && s.score > 0)
  );
  const evaluatedCount = evaluatedSubmissions.length;
  const avgScore =
    evaluatedCount > 0
      ? Math.round(
          evaluatedSubmissions.reduce(
            (acc, s) => acc + (s.aiEvaluation?.finalScore ?? s.score ?? 0),
            0
          ) / evaluatedCount
        )
      : 0;
  const topScore =
    evaluatedCount > 0
      ? (sortedSubmissions[0]?.aiEvaluation?.finalScore ?? sortedSubmissions[0]?.score ?? 0)
      : 0;
  const winnerCount = sortedSubmissions.filter((s) => s.status === 'WINNER').length;

  const cleanEvent = eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

  const printWindow = window.open('', '_blank', 'width=920,height=1000');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${cleanEvent}-All-Participants-Evaluation-Reports</title>
  <style>
    ${COMMON_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong>📄 Hacker's Unity — All Participants Consolidated Evaluation Dossier</strong>
      <div style="font-size: 11px; opacity: 0.75;">Includes all ${total} projects compiled project-wise with full criteria breakdowns. Select "Save as PDF" to download.</div>
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">Save as PDF / Print All</button>
      <button class="btn-close" onclick="window.close()">Close Window</button>
    </div>
  </div>

  <div class="container">
    <!-- Executive Cover / Global Header -->
    <div class="global-header no-break">
      <div class="brand-row">
        <div class="brand-logo-text">
          <span>⚡ Hacker's Unity</span>
          <span class="brand-tag">Consolidated Hackathon Dossier</span>
        </div>
        <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">
          Automated Groq AI Product Intelligence
        </div>
      </div>
      <h1 class="doc-title">${escapeHtml(eventTitle)}</h1>
      <p class="doc-sub">Comprehensive Participant Evaluations & Project-Wise Performance Dossier</p>

      <div class="metrics-grid">
        <div class="metric-tile">
          <div class="label">Total Submissions</div>
          <div class="val">${total}</div>
        </div>
        <div class="metric-tile">
          <div class="label">Evaluated Projects</div>
          <div class="val">${evaluatedCount}</div>
        </div>
        <div class="metric-tile">
          <div class="label">Cohort Average Score</div>
          <div class="val" style="color: #0099e6;">${avgScore} <span style="font-size: 11px; color:#94a3b8;">/100</span></div>
        </div>
        <div class="metric-tile">
          <div class="label">Top Cohort Score</div>
          <div class="val" style="color: #059669;">${topScore} <span style="font-size: 11px; color:#94a3b8;">/100</span></div>
        </div>
      </div>
    </div>

    <!-- Table of Contents / Executive Summary Table -->
    <div class="summary-table-box no-break">
      <div class="summary-table-title">
        <span>🏆</span> Cohort Rankings & Project Index (${total} Projects)
      </div>
      <table class="roster-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 32%;">Project Title</th>
            <th style="width: 22%;">Participant / Submitter</th>
            <th style="width: 18%;">Track</th>
            <th style="width: 13%;">Status</th>
            <th style="width: 10%; text-align: right;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${sortedSubmissions
            .map((s, idx) => {
              const hasEval = Boolean(s.aiEvaluation) || (typeof s.score === 'number' && s.score > 0);
              const sc = s.aiEvaluation?.finalScore ?? s.score ?? 0;
              const scColors = getScoreBadgeColor(sc);
              const stColors = getStatusBadge(s.status);
              return `
              <tr>
                <td style="text-align: center; font-weight: 800; color: #94a3b8; font-family: ui-monospace, monospace;">${idx + 1}</td>
                <td>
                  <strong>${escapeHtml(s.projectTitle)}</strong>
                  ${s.tagline ? `<div style="font-size: 9px; color: #64748b;">${escapeHtml(s.tagline)}</div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 700;">${escapeHtml(s.submittedByName || 'Builder')}</div>
                  ${s.submittedByEmail ? `<div style="font-size: 8.5px; color: #94a3b8; font-family: ui-monospace, monospace;">${escapeHtml(s.submittedByEmail)}</div>` : ''}
                </td>
                <td>
                  <span class="badge-tag">${escapeHtml(s.track || 'General')}</span>
                </td>
                <td>
                  <span class="status-pill" style="background:${stColors.bg}; color:${stColors.text}; border-color:${stColors.border}; font-size: 8px;">
                    ${escapeHtml(s.status || 'SUBMITTED')}
                  </span>
                </td>
                <td style="text-align: right; font-weight: 900; font-family: ui-monospace, monospace; color:${hasEval ? scColors.text : '#94a3b8'}; font-size: 11px;">
                  ${hasEval ? sc : `<span style="font-size: 9px; font-weight: 700; color: #94a3b8;" title="Click 'Evaluate All' in Dashboard to run Groq AI Scoring">0 (Pending)</span>`}
                </td>
              </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>

    <!-- Project-by-Project Detailed Evaluation Dossiers (Each starts with page break) -->
    ${sortedSubmissions
      .map((sub, idx) => {
        return `
        <div class="page-break"></div>
        ${renderSingleProjectHtml(sub, sub.aiEvaluation, idx, total)}
        `;
      })
      .join('')}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    window.print();
  }
}
