import { callAI, renderQuota, getQuotaButtonLabel } from '../_shared/rateLimit.js';

const TOOL_KEY = 'resume-builder';
const ATS_STATUS_MESSAGES = [
  'Scanning for ATS keywords...',
  'Evaluating section completeness...',
  'Calculating your score...',
  'Preparing improvement tips...',
];
const BUILDER_STATUS_MESSAGES = [
  'Reviewing your background...',
  'Strengthening ATS language...',
  'Drafting quantified achievements...',
  'Preparing your final resume...',
];
const ATS_SECTION_ORDER = [
  ['contact', 'Contact Info'],
  ['summary', 'Summary / Objective'],
  ['experience', 'Work Experience'],
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['certifications', 'Certifications'],
  ['achievements', 'Achievements'],
];
const ATS_STATUS_META = {
  present: { icon: '\u2705', label: 'Present', className: 'present' },
  partial: { icon: '\u26A0\uFE0F', label: 'Partial', className: 'partial' },
  missing: { icon: '\u274C', label: 'Missing', className: 'missing' },
};
const SCORE_META = [
  { min: 85, label: 'Excellent', color: '#22c55e' },
  { min: 70, label: 'Good', color: '#06b6d4' },
  { min: 41, label: 'Fair', color: '#f59e0b' },
  { min: 0, label: 'Needs Work', color: '#ef4444' },
];
const STORAGE_KEY = 'tooliest_resume_draft_v1';
const AUTOSAVE_DELAY = 1200;
let resumeExportState = null;
let resumeExportToastStack = null;

const ATS_SYSTEM_PROMPT = `You are an elite ATS (Applicant Tracking System) resume expert and HR consultant
with 15 years of experience at Fortune 500 companies. Your task is to deeply
analyze the provided resume against the job description.

You MUST respond with ONLY a valid JSON object - no markdown fences, no prose.
Use this exact structure:
{
  "score": <integer 0-100>,
  "score_label": "<Needs Work | Fair | Good | Excellent>",
  "keywords_found": ["keyword1", "keyword2", ...],
  "keywords_missing": ["keyword1", "keyword2", ...],
  "sections": {
    "contact": { "status": "<present|partial|missing>", "tip": "<string>" },
    "summary": { "status": "<present|partial|missing>", "tip": "<string>" },
    "experience": { "status": "<present|partial|missing>", "tip": "<string>" },
    "education": { "status": "<present|partial|missing>", "tip": "<string>" },
    "skills": { "status": "<present|partial|missing>", "tip": "<string>" },
    "certifications": { "status": "<present|partial|missing>", "tip": "<string>" },
    "achievements": { "status": "<present|partial|missing>", "tip": "<string>" }
  },
  "improvements": [
    { "priority": "<high|medium|low>", "title": "<short title>", "detail": "<one sentence>" }
  ]
}
Score methodology: keyword match (35%), section completeness (25%), quantified achievements (20%), formatting signals (10%), length fit (10%).
Be strict and honest. Most resumes score 40-70. Reserve 85+ for truly exceptional ones.`;

const BUILDER_SYSTEM_PROMPT = `You are an elite professional resume writer who has crafted resumes that landed
candidates at Google, McKinsey, and Goldman Sachs. Write a complete, ATS-optimized
resume in clean plain text format (no HTML, no markdown headers, no emojis).

Format rules:
- Name on first line, all caps
- The first line must use the candidate name exactly as provided by the user. Never abbreviate, rewrite, translate, correct, or alter the spelling of the name.
- Contact info on second line, pipe-separated
- Section headers in all caps on their own line, followed by a divider line of dashes
- Bullet points use \u2022 character
- Achievements must be quantified wherever possible. If the user has not provided numbers, insert a [PLACEHOLDER — add your specific metric here] tag instead of fabricating numbers. Never invent percentages, dollar amounts, or statistics the user did not provide.
- If the user provides projects, include a PROJECTS section using only the provided project names, links, technologies, and details. Never invent project links, repositories, metrics, or outcomes.
- Tailor language to the target job title provided
- Total length: 450-650 words for junior, 650-900 for senior
- Use strong action verbs: Led, Built, Designed, Developed, Increased, Reduced, Managed, Launched, Delivered, Implemented, Optimized, Streamlined, Collaborated, Coordinated, Achieved
- ATS-safe formatting: no tables, no columns, no graphics references
Output ONLY the resume text. No explanations, no commentary.`;

function qs(root, selector) {
  return root.querySelector(selector);
}

function createNode(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (typeof text === 'string') node.textContent = text;
  return node;
}

function clearNode(node) {
  if (node) node.replaceChildren();
}

function debounce(fn, delayMs = 100) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delayMs);
  };
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSpinner(label) {
  const wrap = createNode('span', 'resume-button-spinner');
  wrap.append(document.createTextNode(`${label} `));
  const spinner = createNode('span');
  spinner.setAttribute('aria-hidden', 'true');
  spinner.style.cssText = 'width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;';
  wrap.appendChild(spinner);
  return wrap;
}

function setButtonLoading(button, isLoading, idleLabel, loadingLabel) {
  if (!button) return;
  button.disabled = isLoading;
  button.setAttribute('aria-busy', String(isLoading));
  button.replaceChildren();
  if (isLoading) {
    button.appendChild(createSpinner(loadingLabel));
    return;
  }
  button.textContent = idleLabel;
}

function showToast(stack, message, type = 'error') {
  if (!stack || !message) return;
  const toast = createNode('div', `resume-toast ${type}`);
  const text = createNode('span', '', message);
  const close = createNode('button', 'btn btn-secondary', 'Dismiss');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss message');
  close.style.padding = '8px 12px';
  close.addEventListener('click', () => toast.remove());
  toast.append(text, close);
  stack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4000);
}

function setBanner(node, message = '', type = 'error', retryHandler = null) {
  if (!node) return;
  clearNode(node);
  node.classList.remove('hidden', 'info', 'success');
  if (!message) {
    node.classList.add('hidden');
    return;
  }
  if (type !== 'error') node.classList.add(type);

  const text = createNode('span', '', message);
  node.appendChild(text);

  if (typeof retryHandler === 'function') {
    const retry = createNode('button', 'btn btn-secondary', 'Retry');
    retry.type = 'button';
    retry.addEventListener('click', retryHandler);
    node.appendChild(retry);
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text, toastRoot, successMessage) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.setAttribute('readonly', 'true');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  }
  showToast(toastRoot, successMessage, 'success');
}

// Persistence: Autosave & Restore
function normalizeSavedExperience(experience = {}) {
  const achievements = Array.isArray(experience.achievements) ? experience.achievements : [];
  return {
    jobTitle: String(experience.jobTitle ?? experience.title ?? ''),
    company: String(experience.company ?? ''),
    duration: String(experience.duration ?? ''),
    achievement1: String(experience.achievement1 ?? achievements[0] ?? ''),
    achievement2: String(experience.achievement2 ?? achievements[1] ?? ''),
    achievement3: String(experience.achievement3 ?? achievements[2] ?? ''),
  };
}

function normalizeSavedProject(project = {}) {
  return {
    name: String(project.name ?? project.title ?? ''),
    link: String(project.link ?? project.url ?? ''),
    technologies: String(project.technologies ?? project.tech ?? ''),
    description: String(project.description ?? project.details ?? project.impact ?? ''),
  };
}

function serializeState(state) {
  try {
    return JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      state: {
        personal: { ...state.personal },
        targetRole: state.targetRole,
        experiences: state.experiences.map(normalizeSavedExperience),
        projects: (state.projects || []).map(normalizeSavedProject),
        education: { ...state.education },
        skills: state.skills,
        certifications: [...state.certifications],
      },
    });
  } catch (_) {
    return null;
  }
}

function saveToStorage(state) {
  const serialized = serializeState(state);
  if (!serialized) return;
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    showSaveIndicator('saved');
  } catch (error) {
    // Autosave is a convenience layer; storage failures should never block the UI.
    console.warn('Autosave failed:', error?.message || 'localStorage unavailable');
    const indicator = document.getElementById('rb-autosave-indicator');
    if (indicator) indicator.classList.remove('rb-autosave--visible');
  }
}

function restoreFromStorage(state) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !parsed.state) return false;

    const saved = parsed.state;
    if (saved.personal && typeof saved.personal === 'object') {
      Object.assign(state.personal, saved.personal);
    }
    if (typeof saved.targetRole === 'string') {
      state.targetRole = saved.targetRole;
    } else if (typeof saved.targetJob === 'string') {
      state.targetRole = saved.targetJob;
    }
    if (Array.isArray(saved.experiences) && saved.experiences.length > 0) {
      state.experiences = saved.experiences.slice(0, 5).map(normalizeSavedExperience);
    }
    if (Array.isArray(saved.projects) && saved.projects.length > 0) {
      state.projects = saved.projects.slice(0, 5).map(normalizeSavedProject);
    }
    if (saved.education && typeof saved.education === 'object') {
      Object.assign(state.education, saved.education);
    }
    if (typeof saved.skills === 'string') {
      state.skills = saved.skills;
    }
    if (Array.isArray(saved.certifications)) {
      state.certifications = saved.certifications.slice(0, 5).map((item) => String(item ?? ''));
      if (!state.certifications.length) {
        state.certifications = [createEmptyCertification()];
      }
    }

    return true;
  } catch (_) {
    return false;
  }
}

function clearSavedDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {
    // Ignore storage errors.
  }
}

function showSaveIndicator(status) {
  const indicator = document.getElementById('rb-autosave-indicator');
  if (!indicator) return;
  indicator.setAttribute('data-status', status);
  const labels = {
    saved: '\u2713 Draft saved',
    saving: 'Saving...',
    error: 'Save failed',
  };
  indicator.textContent = labels[status] || '';
  indicator.classList.add('rb-autosave--visible');
  if (status === 'saved') {
    window.setTimeout(() => indicator.classList.remove('rb-autosave--visible'), 2800);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseResumeText(resumeText) {
  const lines = resumeText.split('\n').map((line) => line.trimEnd());
  const sections = [];
  let currentSection = null;
  const headerLines = [];
  let headerParsed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    const looksLikeSection = trimmed.length > 2
      && trimmed === trimmed.toUpperCase()
      && !/^[-\u2500\u2550=]{3,}$/.test(trimmed);

    if (!headerParsed) {
      if (looksLikeSection && i > 1) {
        headerParsed = true;
        currentSection = { title: trimmed, lines: [] };
        sections.push(currentSection);
      } else if (trimmed && !/^[-\u2500\u2550=]{3,}$/.test(trimmed)) {
        headerLines.push(trimmed);
      }
      continue;
    }

    if (looksLikeSection) {
      currentSection = { title: trimmed, lines: [] };
      sections.push(currentSection);
    } else if (currentSection && trimmed && !/^[-\u2500\u2550=]{3,}$/.test(trimmed)) {
      currentSection.lines.push(trimmed);
    }
  }

  const name = headerLines[0] || '';
  const contact = headerLines.slice(1).filter(Boolean).join(' | ');
  return { name, contact, sections };
}

function getCanonicalResumeHeader(state) {
  const personal = state?.personal || {};
  const name = String(personal.name || '').trim();
  const contact = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.portfolio,
  ].map((value) => String(value || '').trim()).filter(Boolean).join(' | ');
  return { name, contact };
}

function normalizeGeneratedResumeIdentity(resumeText, state) {
  const { name, contact } = getCanonicalResumeHeader(state);
  if (!name || !resumeText) return resumeText;

  const lines = String(resumeText).split('\n');
  const isDivider = (line) => /^[-\u2500\u2550=]{3,}$/.test(String(line || '').trim());
  const isKnownSectionTitle = (line) => /^(SUMMARY|OBJECTIVE|PROFILE|PROFESSIONAL SUMMARY|EDUCATION|RELEVANT COURSES|SKILLS|CERTIFICATIONS|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|PROJECTS|ADDITIONAL PROJECTS|ADDITIONAL EXPERIENCE|PROFESSIONAL AFFILIATIONS|INTERESTS)$/i
    .test(String(line || '').trim());
  const isSectionHeader = (line) => {
    const trimmed = String(line || '').trim();
    return trimmed.length > 2 && trimmed === trimmed.toUpperCase() && !isDivider(trimmed);
  };
  const firstContentIndex = lines.findIndex((line) => String(line || '').trim() && !isDivider(line));

  if (firstContentIndex === -1) {
    return [name.toUpperCase(), contact].filter(Boolean).join('\n');
  }

  if (isKnownSectionTitle(lines[firstContentIndex])) {
    lines.splice(firstContentIndex, 0, ...[name.toUpperCase(), contact].filter(Boolean));
    return lines.join('\n');
  }

  lines[firstContentIndex] = name.toUpperCase();

  if (contact) {
    let secondContentIndex = -1;
    for (let i = firstContentIndex + 1; i < lines.length; i += 1) {
      if (!String(lines[i] || '').trim() || isDivider(lines[i])) continue;
      secondContentIndex = i;
      break;
    }

    if (secondContentIndex === -1 || isSectionHeader(lines[secondContentIndex])) {
      lines.splice(firstContentIndex + 1, 0, contact);
    } else {
      lines[secondContentIndex] = contact;
    }
  }

  return lines.join('\n');
}

function renderFormattedPreview(resumeText) {
  const container = document.getElementById('rb-preview-pane');
  if (!container) return;

  if (!resumeText || !resumeText.trim()) {
    container.innerHTML = `
      <div class="rb-preview-empty">
        <div class="rb-preview-empty-icon" aria-hidden="true">&#128196;</div>
        <p>Your formatted resume will appear here after generation</p>
      </div>`;
    return;
  }

  const { name, contact } = getCanonicalResumeHeader(resumeExportState);
  const parsed = parseResumeText(resumeText);
  const displayName = name || parsed.name;
  const displayContact = contact || parsed.contact;
  const { sections } = parsed;
  let html = '<div class="rb-resume-doc">';

  html += `
    <div class="rb-resume-header">
      <h1 class="rb-resume-name">${escapeHtml(displayName)}</h1>
      <p class="rb-resume-contact">${escapeHtml(displayContact)}</p>
    </div>`;

  for (const section of sections) {
    html += `
      <div class="rb-resume-section">
        <h2 class="rb-resume-section-title">${escapeHtml(section.title)}</h2>
        <div class="rb-resume-section-divider"></div>
        <div class="rb-resume-section-body">`;

    for (const line of section.lines) {
      if (line.startsWith('\u2022') || line.startsWith('-')) {
        const text = line.replace(/^[\u2022-]\s*/, '');
        html += `<p class="rb-resume-bullet">\u2022 ${escapeHtml(text)}</p>`;
      } else {
        html += `<p class="rb-resume-line">${escapeHtml(line)}</p>`;
      }
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

// PDF Export
function showExportToast(message, type = 'info') {
  if (resumeExportToastStack) {
    showToast(resumeExportToastStack, message, type);
  }
}

function setResumeExportReady(isReady) {
  const exportBar = document.getElementById('rb-export-bar');
  const pdfBtn = document.getElementById('rb-btn-download-pdf');
  const printBtn = document.getElementById('rb-btn-print');
  if (exportBar) {
    exportBar.toggleAttribute('hidden', !isReady);
  }
  if (pdfBtn) {
    pdfBtn.disabled = !isReady;
    pdfBtn.setAttribute('aria-disabled', String(!isReady));
  }
  if (printBtn) {
    printBtn.disabled = !isReady;
    printBtn.setAttribute('aria-disabled', String(!isReady));
  }
}

let resumePrintFrame = null;

function getResumeFileBaseName() {
  return (resumeExportState?.personal?.name || 'resume')
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase() || 'resume';
}

function getResumeDocumentHtml() {
  const existingDoc = document.querySelector('#rb-preview-pane .rb-resume-doc');
  if (existingDoc) return existingDoc.outerHTML;

  if (resumeExportState?.generatedResume) {
    renderFormattedPreview(resumeExportState.generatedResume);
    return document.querySelector('#rb-preview-pane .rb-resume-doc')?.outerHTML || '';
  }

  return '';
}

function removeResumePrintFrame() {
  if (resumePrintFrame?.parentNode) {
    resumePrintFrame.parentNode.removeChild(resumePrintFrame);
  }
  resumePrintFrame = null;
}

function getResumePrintStyles() {
  return `
    @page {
      size: letter portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: 8.5in;
      min-height: 11in;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .rb-resume-doc {
      width: 8.5in;
      max-width: none;
      min-height: 11in;
      margin: 0 auto;
      padding: 0.75in 0.85in;
      font-family: "Times New Roman", Georgia, serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #111111;
      background: #ffffff;
      box-shadow: none;
      border-radius: 0;
    }

    .rb-resume-header {
      text-align: center;
      margin-bottom: 0.35in;
      break-after: avoid;
      page-break-after: avoid;
    }

    .rb-resume-name {
      margin: 0 0 0.1in;
      font-family: "Times New Roman", Georgia, serif;
      font-size: 18pt;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: 0.04em;
      color: #111111;
      text-transform: uppercase;
    }

    .rb-resume-contact {
      margin: 0;
      font-family: "Times New Roman", Georgia, serif;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #333333;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .rb-resume-section {
      margin-bottom: 0.2in;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .rb-resume-section-title {
      margin: 0 0 2px;
      font-family: "Times New Roman", Georgia, serif;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #111111;
      break-after: avoid;
      page-break-after: avoid;
    }

    .rb-resume-section-divider {
      margin-bottom: 0.06in;
      border-top: 1.5px solid #111111;
      break-after: avoid;
      page-break-after: avoid;
    }

    .rb-resume-section-body {
      padding: 0;
    }

    .rb-resume-line,
    .rb-resume-bullet {
      margin-top: 0;
      margin-bottom: 2px;
      font-family: "Times New Roman", Georgia, serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #111111;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      orphans: 2;
      widows: 2;
    }

    .rb-resume-bullet {
      margin-left: 0.15in;
      padding-left: 0.15in;
      text-indent: -0.15in;
    }

    @media print {
      html,
      body,
      .rb-resume-doc {
        width: 8.5in;
      }

      .rb-resume-doc {
        min-height: 11in;
        margin: 0;
      }
    }
  `;
}

function openResumePrintDialog(intent = 'print') {
  if (!resumeExportState?.generatedResume) {
    showExportToast(`Generate a resume before ${intent === 'pdf' ? 'saving as PDF' : 'printing'}.`, 'error');
    return false;
  }

  const resumeHtml = getResumeDocumentHtml();
  if (!resumeHtml) {
    showExportToast('Generate a resume before exporting.', 'error');
    return false;
  }

  removeResumePrintFrame();

  const fileBaseName = `${getResumeFileBaseName()}_resume`;
  const frame = document.createElement('iframe');
  frame.id = 'rb-print-frame';
  frame.title = 'Resume print export';
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });

  resumePrintFrame = frame;
  document.body.appendChild(frame);

  frame.onload = () => {
    window.setTimeout(() => {
      const printWindow = frame.contentWindow;
      if (!printWindow) {
        removeResumePrintFrame();
        showExportToast('Could not open the print dialog. Please try again.', 'error');
        return;
      }

      const cleanup = () => {
        window.setTimeout(removeResumePrintFrame, 500);
      };

      printWindow.addEventListener('afterprint', cleanup, { once: true });
      window.setTimeout(removeResumePrintFrame, 45000);
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  frame.srcdoc = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(fileBaseName)}</title>
        <style>${getResumePrintStyles()}</style>
      </head>
      <body>${resumeHtml}</body>
    </html>`;

  return true;
}

async function downloadResumePDF() {
  const btn = document.getElementById('rb-btn-download-pdf');
  if (btn) {
    btn.classList.add('rb-export-btn--loading');
    btn.setAttribute('aria-label', 'Open save as PDF dialog');
  }

  try {
    const opened = openResumePrintDialog('pdf');
    if (opened) {
      showExportToast('Use Save as PDF in the print dialog for a preview-matched PDF.', 'info');
    }
  } finally {
    window.setTimeout(() => {
      if (btn) {
        btn.classList.remove('rb-export-btn--loading');
        btn.setAttribute('aria-label', 'Save resume as PDF');
      }
    }, 800);
  }
}

function printResume() {
  openResumePrintDialog('print');
}

function parsePossiblyWrappedJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const candidates = [raw];
  if (raw.startsWith('```')) {
    candidates.push(raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim());
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {
      // Try the next candidate.
    }
  }
  return null;
}

function normalizeScore(score) {
  const parsed = Number(score);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function getScoreMeta(score, providedLabel) {
  const byScore = SCORE_META.find((item) => score >= item.min) || SCORE_META[SCORE_META.length - 1];
  if (!providedLabel) return byScore;
  const byLabel = SCORE_META.find((item) => item.label.toLowerCase() === String(providedLabel).toLowerCase());
  return byLabel || byScore;
}

function sanitizeAnalysisPayload(payload) {
  const safeScore = normalizeScore(payload?.score);
  const scoreMeta = getScoreMeta(safeScore, payload?.score_label);
  const safeSections = {};

  ATS_SECTION_ORDER.forEach(([key]) => {
    const section = payload?.sections?.[key] || {};
    const status = String(section.status || '').toLowerCase();
    safeSections[key] = {
      status: ATS_STATUS_META[status] ? status : 'missing',
      tip: String(section.tip || 'No guidance returned for this section.').trim() || 'No guidance returned for this section.',
    };
  });

  const normalizeList = (value) => Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 15)
    : [];

  const improvements = Array.isArray(payload?.improvements)
    ? payload.improvements.map((item) => ({
      priority: ['high', 'medium', 'low'].includes(String(item?.priority || '').toLowerCase())
        ? String(item.priority).toLowerCase()
        : 'medium',
      title: String(item?.title || 'Improve this section').trim() || 'Improve this section',
      detail: String(item?.detail || 'Review this area and make it more specific.').trim() || 'Review this area and make it more specific.',
    })).slice(0, 8)
    : [];

  return {
    score: safeScore,
    scoreLabel: scoreMeta.label,
    scoreColor: scoreMeta.color,
    keywordsFound: normalizeList(payload?.keywords_found),
    keywordsMissing: normalizeList(payload?.keywords_missing),
    sections: safeSections,
    improvements,
  };
}

function buildReportMarkdown(report) {
  const lines = [
    '# Tooliest ATS Resume Report',
    '',
    `Score: ${report.score}/100 (${report.scoreLabel})`,
    '',
    '## Keywords Found',
    ...(report.keywordsFound.length ? report.keywordsFound.map((item) => `- ${item}`) : ['- None surfaced']),
    '',
    '## Keywords Missing',
    ...(report.keywordsMissing.length ? report.keywordsMissing.map((item) => `- ${item}`) : ['- None surfaced']),
    '',
    '## Section Analysis',
  ];

  ATS_SECTION_ORDER.forEach(([key, label]) => {
    const section = report.sections[key];
    const statusMeta = ATS_STATUS_META[section.status];
    lines.push(`- ${label}: ${statusMeta.label} - ${section.tip}`);
  });

  lines.push('', '## Improvement Suggestions');
  if (report.improvements.length) {
    report.improvements.forEach((item, index) => {
      lines.push(`${index + 1}. [${item.priority.toUpperCase()}] ${item.title}: ${item.detail}`);
    });
  } else {
    lines.push('1. No suggestions returned.');
  }

  return lines.join('\n');
}

function animateScoreGauge(container, score, scoreLabel, scoreColor) {
  clearNode(container);
  const radius = 60;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;

  const wrap = createNode('div', 'resume-gauge-wrap');
  wrap.style.position = 'relative';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '170');
  svg.setAttribute('height', '170');
  svg.setAttribute('viewBox', '0 0 170 170');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `ATS score: ${score} out of 100`);

  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', '85');
  bgCircle.setAttribute('cy', '85');
  bgCircle.setAttribute('r', String(radius));
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', 'rgba(255,255,255,0.08)');
  bgCircle.setAttribute('stroke-width', String(stroke));

  const fgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  fgCircle.setAttribute('cx', '85');
  fgCircle.setAttribute('cy', '85');
  fgCircle.setAttribute('r', String(radius));
  fgCircle.setAttribute('fill', 'none');
  fgCircle.setAttribute('stroke', scoreColor);
  fgCircle.setAttribute('stroke-width', String(stroke));
  fgCircle.setAttribute('stroke-linecap', 'round');
  fgCircle.setAttribute('transform', 'rotate(-90 85 85)');
  fgCircle.setAttribute('stroke-dasharray', String(circumference));
  fgCircle.setAttribute('stroke-dashoffset', String(circumference));

  svg.append(bgCircle, fgCircle);

  const textWrap = createNode('div', 'resume-gauge-text');
  const value = createNode('div', 'resume-gauge-value', '0');
  const caption = createNode('div', 'resume-gauge-caption', scoreLabel);
  textWrap.append(value, caption);
  wrap.append(svg, textWrap);
  container.appendChild(wrap);

  const targetOffset = circumference - ((score / 100) * circumference);
  const duration = 1500;
  const startedAt = performance.now();

  function tick(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    fgCircle.setAttribute('stroke-dashoffset', String(circumference - ((circumference - targetOffset) * eased)));
    value.textContent = String(Math.round(score * eased));
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      value.textContent = String(score);
    }
  }

  window.requestAnimationFrame(tick);
}

function renderPills(container, values, type) {
  clearNode(container);
  if (!values.length) {
    container.appendChild(createNode('span', 'resume-pill neutral', 'None surfaced'));
    return;
  }
  const render = () => {
    values.forEach((value) => {
      container.appendChild(createNode('span', `resume-pill ${type}`, value));
    });
  };
  if (values.length > 30 && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(render);
  } else {
    render();
  }
}

function renderSectionTable(tbody, sections) {
  clearNode(tbody);
  ATS_SECTION_ORDER.forEach(([key, label]) => {
    const section = sections[key];
    const meta = ATS_STATUS_META[section.status] || ATS_STATUS_META.missing;
    const row = document.createElement('tr');
    const nameCell = createNode('td', '', label);
    const statusCell = createNode('td');
    const statusText = createNode('span', `resume-status ${meta.className}`, `${meta.icon} ${meta.label}`);
    statusCell.appendChild(statusText);
    const tipCell = createNode('td', '', section.tip);
    row.append(nameCell, statusCell, tipCell);
    tbody.appendChild(row);
  });
}

function renderSuggestions(container, improvements) {
  clearNode(container);
  if (!improvements.length) {
    const fallback = createNode('div', 'resume-suggestion medium');
    const head = createNode('div', 'resume-suggestion-head');
    head.append(createNode('span', '', '1.'), createNode('span', '', 'Review for specificity'));
    const detail = createNode('p', '', 'No structured suggestions were returned, so review keywords, measurable achievements, and section coverage manually.');
    detail.style.margin = '0';
    detail.style.color = 'var(--text-secondary)';
    fallback.append(head, detail);
    container.appendChild(fallback);
    return;
  }

  improvements.forEach((item, index) => {
    const card = createNode('div', `resume-suggestion ${item.priority}`);
    const head = createNode('div', 'resume-suggestion-head');
    head.append(createNode('span', '', `${index + 1}.`), createNode('span', '', item.title));
    const detail = createNode('p', '', item.detail);
    detail.style.margin = '0';
    detail.style.color = 'var(--text-secondary)';
    card.append(head, detail);
    container.appendChild(card);
  });
}

function revealResults(root) {
  root.querySelectorAll('.fade-item').forEach((item, index) => {
    item.classList.remove('is-visible');
    window.setTimeout(() => item.classList.add('is-visible'), 60 * index);
  });
}

function startStatusRotation(node, messages) {
  if (!node || !Array.isArray(messages) || !messages.length) {
    return () => {};
  }
  let index = 0;
  node.textContent = messages[index];
  const timer = window.setInterval(() => {
    index = (index + 1) % messages.length;
    node.textContent = messages[index];
  }, 2000);
  return () => window.clearInterval(timer);
}

function createEmptyExperience() {
  return {
    jobTitle: '',
    company: '',
    duration: '',
    achievement1: '',
    achievement2: '',
    achievement3: '',
  };
}

function createEmptyCertification() {
  return '';
}

function createEmptyProject() {
  return {
    name: '',
    link: '',
    technologies: '',
    description: '',
  };
}

function formatExperienceBlock(experience) {
  const label = [experience.jobTitle, experience.company].filter(Boolean).join(' @ ');
  return label || 'Untitled experience';
}

function formatProjectBlock(project) {
  return project.name || project.link || 'Untitled project';
}

function buildResumePrompt(state) {
  const parts = [
    `Name: ${state.personal.name || ''}`,
    `Email: ${state.personal.email || ''}`,
    `Phone: ${state.personal.phone || ''}`,
    `LinkedIn: ${state.personal.linkedin || ''}`,
    `Location: ${state.personal.location || ''}`,
    `Portfolio: ${state.personal.portfolio || ''}`,
    '',
    `Target Job Title: ${state.targetRole || 'General professional role'}`,
    '',
    'WORK EXPERIENCE:',
  ];

  state.experiences.forEach((experience, index) => {
    parts.push(`Experience ${index + 1}:`);
    parts.push(`Job Title: ${experience.jobTitle || ''}`);
    parts.push(`Company: ${experience.company || ''}`);
    parts.push(`Duration: ${experience.duration || ''}`);
    [experience.achievement1, experience.achievement2, experience.achievement3].forEach((line, lineIndex) => {
      if (String(line || '').trim()) {
        parts.push(`Achievement ${lineIndex + 1}: ${line.trim()}`);
      }
    });
    parts.push('');
  });

  parts.push('PROJECTS:');
  state.projects.forEach((project, index) => {
    if (![project.name, project.link, project.technologies, project.description].some((value) => String(value || '').trim())) {
      return;
    }
    parts.push(`Project ${index + 1}:`);
    parts.push(`Name: ${project.name || ''}`);
    parts.push(`Link: ${project.link || ''}`);
    parts.push(`Technologies: ${project.technologies || ''}`);
    parts.push(`Details: ${project.description || ''}`);
    parts.push('');
  });

  parts.push('EDUCATION:');
  parts.push(`Degree: ${state.education.degree || ''}`);
  parts.push(`Institution: ${state.education.institution || ''}`);
  parts.push(`Year: ${state.education.year || ''}`);
  parts.push(`GPA: ${state.education.gpa || ''}`);
  parts.push(`Relevant Courses: ${parseCommaList(state.education.courses).join(', ')}`);
  parts.push('');
  parts.push(`Skills: ${parseCommaList(state.skills).join(', ')}`);
  parts.push(`Certifications: ${state.certifications.filter(Boolean).join(', ')}`);
  return parts.join('\n');
}

function deriveResumeNote(text, state) {
  const sectionCount = ['EXPERIENCE', 'PROJECTS', 'EDUCATION', 'SKILLS'].filter((label) => text.includes(label)).length;
  const experienceCount = state.experiences.filter((item) => item.jobTitle || item.company).length;
  if (text.length < 1400) {
    return 'ATS note: the draft looks short. Add more quantified detail before you apply.';
  }
  if (sectionCount < 3 || experienceCount === 0) {
    return 'ATS note: review section coverage and make sure the draft reflects real experience clearly.';
  }
  return 'ATS note: the draft uses a straightforward ATS-safe structure, but still review every fact before sending it.';
}

function bindCounter(textarea, countNode, limit, warnNode = null, warnAt = limit - 500) {
  const update = debounce(() => {
    if (textarea.value.length > limit) {
      textarea.value = textarea.value.slice(0, limit);
    }
    countNode.textContent = `${textarea.value.length} / ${limit} chars`;
    if (warnNode) {
      warnNode.classList.toggle('hidden', textarea.value.length < warnAt);
    }
  }, 100);
  textarea.addEventListener('input', update);
  update();
}

function configureTabs(root) {
  const tabs = Array.from(root.querySelectorAll('[data-tab-target]'));
  const panels = Array.from(root.querySelectorAll('[data-panel]'));

  const activate = (target) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tabTarget === target;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === target;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.tabTarget));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activate(tabs[nextIndex].dataset.tabTarget);
    });
  });

  const initialTab = tabs.find((tab) => tab.classList.contains('is-active'))?.dataset.tabTarget
    || tabs[0]?.dataset.tabTarget
    || 'ats';
  activate(initialTab);
}

export async function initResumeBuilderTool(container) {
  const root = qs(container, '[data-resume-tool]') || container;
  configureTabs(root);

  const toastStack = qs(root, '#resume-toast-stack');
  const atsResume = qs(root, '#resume-ats-resume');
  const atsJob = qs(root, '#resume-ats-job');
  const atsResumeCount = qs(root, '#resume-ats-resume-count');
  const atsJobCount = qs(root, '#resume-ats-job-count');
  const atsWarn = qs(root, '#resume-ats-resume-warn');
  const atsButton = qs(root, '#resume-ats-submit');
  const atsQuotaMount = qs(root, '[data-resume-quota="shared"]');
  const atsBanner = qs(root, '#resume-ats-banner');
  const atsLoading = qs(root, '#resume-ats-loading');
  const atsStatus = qs(root, '#resume-ats-status');
  const atsResults = qs(root, '#resume-ats-results');
  const scoreGauge = qs(root, '#resume-score-gauge');
  const scoreLabel = qs(root, '#resume-score-label');
  const foundKeywords = qs(root, '#resume-keywords-found');
  const missingKeywords = qs(root, '#resume-keywords-missing');
  const sectionBody = qs(root, '#resume-section-body');
  const suggestions = qs(root, '#resume-suggestions');
  const copyReportButton = qs(root, '#resume-copy-report');
  const downloadReportButton = qs(root, '#resume-download-report');

  const builderQuotaMount = qs(root, '[data-resume-quota="shared-builder"]');
  const builderBanner = qs(root, '#rb-banner');
  const builderLoading = qs(root, '#rb-loading');
  const builderStatus = qs(root, '#rb-status');
  const previewWrap = qs(root, '#rb-preview-wrap');
  const previewCount = qs(root, '#rb-preview-count');
  const previewNote = qs(root, '#rb-ats-note');
  const generateButton = qs(root, '#rb-generate');
  const copyResumeButton = qs(root, '#rb-copy');
  const downloadResumeButton = qs(root, '#rb-download');
  const pdfButton = qs(root, '#rb-btn-download-pdf');
  const printButton = qs(root, '#rb-btn-print');

  const state = {
    currentStep: 1,
    lastReport: null,
    generatedResume: '',
    personal: {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      location: '',
      portfolio: '',
    },
    experiences: [createEmptyExperience()],
    projects: [createEmptyProject()],
    education: {
      degree: '',
      institution: '',
      year: '',
      gpa: '',
      courses: '',
    },
    skills: '',
    targetRole: '',
    certifications: [createEmptyCertification()],
  };

  const atsBaseLabel = 'Analyze Resume';
  const builderBaseLabel = 'Generate Resume';
  let atsBusy = false;
  let builderBusy = false;
  const debouncedSave = debounce(() => {
    showSaveIndicator('saving');
    saveToStorage(state);
  }, AUTOSAVE_DELAY);
  const wasRestored = restoreFromStorage(state);
  resumeExportState = state;
  resumeExportToastStack = toastStack;

  function syncExportButtons() {
    const hasReport = Boolean(state.lastReport);
    const hasResume = Boolean(state.generatedResume);
    copyReportButton.disabled = !hasReport;
    downloadReportButton.disabled = !hasReport;
    copyResumeButton.disabled = !hasResume;
    downloadResumeButton.disabled = !hasResume;
    copyReportButton.setAttribute('aria-disabled', String(!hasReport));
    downloadReportButton.setAttribute('aria-disabled', String(!hasReport));
    copyResumeButton.setAttribute('aria-disabled', String(!hasResume));
    downloadResumeButton.setAttribute('aria-disabled', String(!hasResume));
    setResumeExportReady(hasResume);
  }

  function updateQuotaUi() {
    renderQuota(TOOL_KEY, atsQuotaMount);
    renderQuota(TOOL_KEY, builderQuotaMount);
    atsButton.textContent = getQuotaButtonLabel(atsBaseLabel, TOOL_KEY);
    generateButton.textContent = `\u26A1 ${getQuotaButtonLabel(builderBaseLabel, TOOL_KEY)}`;
  }

  function renderPillPreview(containerNode, values) {
    clearNode(containerNode);
    values.forEach((value) => {
      containerNode.appendChild(createNode('span', 'resume-pill neutral', value));
    });
  }

  function renderReviewSummary() {
    const mount = qs(root, '#rb-review-summary');
    clearNode(mount);

    const personalCard = createNode('div', 'resume-review-item');
    personalCard.appendChild(createNode('h4', '', 'Personal Info'));
    const personalList = createNode('div', 'resume-review-list');
    [
      ['Name', state.personal.name || 'No name yet'],
      ['Email', state.personal.email || 'No email yet'],
      ['Phone', state.personal.phone || 'No phone yet'],
      ['LinkedIn', state.personal.linkedin || 'No LinkedIn URL'],
      ['Location', state.personal.location || 'No location yet'],
      ['Portfolio', state.personal.portfolio || 'No portfolio URL'],
    ].forEach(([label, value]) => {
      const row = createNode('div', 'resume-review-row');
      row.append(createNode('span', 'resume-review-key', label), createNode('span', 'resume-review-value', value));
      personalList.appendChild(row);
    });
    personalCard.appendChild(personalList);

    const experienceCard = createNode('div', 'resume-review-item');
    experienceCard.appendChild(createNode('h4', '', 'Work Experience'));
    const experienceList = createNode('ul');
    const filledExperiences = state.experiences.filter((experience) => [
      experience.jobTitle,
      experience.company,
      experience.duration,
      experience.achievement1,
      experience.achievement2,
      experience.achievement3,
    ].some((value) => String(value || '').trim()));
    if (!filledExperiences.length) {
      experienceList.appendChild(createNode('li', '', 'No work experience added yet.'));
    } else {
      filledExperiences.forEach((experience) => {
        experienceList.appendChild(createNode('li', '', `${formatExperienceBlock(experience)} - ${experience.duration || 'Duration not set'}`));
      });
    }
    experienceCard.appendChild(experienceList);

    const projectCard = createNode('div', 'resume-review-item');
    projectCard.appendChild(createNode('h4', '', 'Projects'));
    const projectList = createNode('ul');
    const filledProjects = state.projects.filter((project) => [
      project.name,
      project.link,
      project.technologies,
      project.description,
    ].some((value) => String(value || '').trim()));
    if (!filledProjects.length) {
      projectList.appendChild(createNode('li', '', 'No projects added yet.'));
    } else {
      filledProjects.forEach((project) => {
        const meta = [project.technologies, project.link].filter(Boolean).join(' | ');
        projectList.appendChild(createNode('li', '', `${formatProjectBlock(project)}${meta ? ` - ${meta}` : ''}`));
      });
    }
    projectCard.appendChild(projectList);

    const educationCard = createNode('div', 'resume-review-item');
    educationCard.append(
      createNode('h4', '', 'Education'),
      createNode('p', '', `${state.education.degree || 'No degree yet'} | ${state.education.institution || 'No institution yet'} | ${state.education.year || 'No year yet'}`),
      createNode('p', '', `Courses: ${parseCommaList(state.education.courses).join(', ') || 'None added'}`),
    );

    const skillsCard = createNode('div', 'resume-review-item');
    skillsCard.append(
      createNode('h4', '', 'Skills and Target Role'),
      createNode('p', '', `Target role: ${state.targetRole || 'General role'}`),
      createNode('p', '', `Skills: ${parseCommaList(state.skills).join(', ') || 'None added yet'}`),
      createNode('p', '', `Certifications: ${state.certifications.filter(Boolean).join(', ') || 'None added yet'}`),
    );

    mount.append(personalCard, experienceCard, projectCard, educationCard, skillsCard);
  }

  function renderBuilderDerivedViews() {
    renderPillPreview(qs(root, '#rb-course-pills'), parseCommaList(state.education.courses));
    renderPillPreview(qs(root, '#rb-skill-pills'), parseCommaList(state.skills));
    renderReviewSummary();
  }

  function populateFormFromState() {
    [
      ['#rb-name', state.personal.name],
      ['#rb-email', state.personal.email],
      ['#rb-phone', state.personal.phone],
      ['#rb-linkedin', state.personal.linkedin],
      ['#rb-location', state.personal.location],
      ['#rb-portfolio', state.personal.portfolio],
      ['#rb-degree', state.education.degree],
      ['#rb-institution', state.education.institution],
      ['#rb-year', state.education.year],
      ['#rb-gpa', state.education.gpa],
      ['#rb-courses', state.education.courses],
      ['#rb-skills', state.skills],
      ['#rb-target-role', state.targetRole],
    ].forEach(([selector, value]) => {
      const input = qs(root, selector);
      if (input) input.value = value || '';
    });

    renderExperienceList();
    renderProjectList();
    renderCertificationList();
    renderBuilderDerivedViews();
  }

  function updateBuilderFieldBindings() {
    [
      ['#rb-name', ['personal', 'name']],
      ['#rb-email', ['personal', 'email']],
      ['#rb-phone', ['personal', 'phone']],
      ['#rb-linkedin', ['personal', 'linkedin']],
      ['#rb-location', ['personal', 'location']],
      ['#rb-portfolio', ['personal', 'portfolio']],
      ['#rb-degree', ['education', 'degree']],
      ['#rb-institution', ['education', 'institution']],
      ['#rb-year', ['education', 'year']],
      ['#rb-gpa', ['education', 'gpa']],
      ['#rb-courses', ['education', 'courses']],
      ['#rb-skills', ['root', 'skills']],
      ['#rb-target-role', ['root', 'targetRole']],
    ].forEach(([selector, path]) => {
      const input = qs(root, selector);
      if (!input || input.dataset.resumeBound === 'true') return;
      input.dataset.resumeBound = 'true';
      input.addEventListener('input', () => {
        if (path[0] === 'root') {
          state[path[1]] = input.value;
        } else {
          state[path[0]][path[1]] = input.value;
        }
        renderBuilderDerivedViews();
        debouncedSave();
      });
    });
  }

  function renderExperienceList() {
    const mount = qs(root, '#rb-experience-list');
    clearNode(mount);
    state.experiences.forEach((experience, index) => {
      const card = createNode('div', 'resume-subcard');
      const head = createNode('div', 'resume-subcard-head');
      const title = createNode('strong', '', `Experience ${index + 1}`);
      const remove = createNode('button', 'resume-remove-btn', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove experience ${index + 1}`);
      remove.disabled = state.experiences.length === 1;
      remove.addEventListener('click', () => {
        if (state.experiences.length === 1) return;
        state.experiences.splice(index, 1);
        renderExperienceList();
        renderBuilderDerivedViews();
        saveToStorage(state);
      });
      head.append(title, remove);
      card.appendChild(head);

      const grid = createNode('div', 'resume-form-grid two-col');
      [
        ['Job Title', 'jobTitle'],
        ['Company', 'company'],
        ['Duration', 'duration'],
      ].forEach(([labelText, key]) => {
        const field = createNode('div', 'resume-field');
        const label = createNode('label', '', labelText);
        const input = document.createElement('input');
        input.type = 'text';
        input.value = experience[key];
        input.setAttribute('aria-label', `${labelText} for experience ${index + 1}`);
        input.addEventListener('input', () => {
          experience[key] = input.value;
          renderBuilderDerivedViews();
          debouncedSave();
        });
        field.append(label, input);
        grid.appendChild(field);
      });
      card.appendChild(grid);

      ['achievement1', 'achievement2', 'achievement3'].forEach((key, achievementIndex) => {
        const field = createNode('div', 'resume-field');
        const label = createNode('label', '', `Key Achievement ${achievementIndex + 1}`);
        const input = document.createElement('textarea');
        input.rows = 2;
        input.value = experience[key];
        input.setAttribute('aria-label', `Key achievement ${achievementIndex + 1} for experience ${index + 1}`);
        input.addEventListener('input', () => {
          experience[key] = input.value;
          renderBuilderDerivedViews();
          debouncedSave();
        });
        field.append(label, input);
        card.appendChild(field);
      });

      mount.appendChild(card);
    });
  }

  function renderProjectList() {
    const mount = qs(root, '#rb-project-list');
    clearNode(mount);
    state.projects.forEach((project, index) => {
      const card = createNode('div', 'resume-subcard');
      const head = createNode('div', 'resume-subcard-head');
      const title = createNode('strong', '', `Project ${index + 1}`);
      const remove = createNode('button', 'resume-remove-btn', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove project ${index + 1}`);
      remove.disabled = state.projects.length === 1;
      remove.addEventListener('click', () => {
        if (state.projects.length === 1) return;
        state.projects.splice(index, 1);
        renderProjectList();
        renderBuilderDerivedViews();
        saveToStorage(state);
      });
      head.append(title, remove);
      card.appendChild(head);

      const grid = createNode('div', 'resume-form-grid two-col');
      [
        ['Project Name', 'name', 'text'],
        ['Project Link', 'link', 'url'],
        ['Technologies Used', 'technologies', 'text'],
      ].forEach(([labelText, key, type]) => {
        const field = createNode('div', 'resume-field');
        const label = createNode('label', '', labelText);
        const input = document.createElement('input');
        input.type = type;
        input.value = project[key];
        input.setAttribute('aria-label', `${labelText} for project ${index + 1}`);
        input.addEventListener('input', () => {
          project[key] = input.value;
          renderBuilderDerivedViews();
          debouncedSave();
        });
        field.append(label, input);
        grid.appendChild(field);
      });
      card.appendChild(grid);

      const field = createNode('div', 'resume-field');
      const label = createNode('label', '', 'Project details and impact');
      const input = document.createElement('textarea');
      input.rows = 3;
      input.value = project.description;
      input.setAttribute('aria-label', `Project details and impact for project ${index + 1}`);
      input.placeholder = 'What did you build, who used it, and what result did it create? Add real metrics only if you know them.';
      input.addEventListener('input', () => {
        project.description = input.value;
        renderBuilderDerivedViews();
        debouncedSave();
      });
      field.append(label, input);
      card.appendChild(field);

      mount.appendChild(card);
    });
  }

  function renderCertificationList() {
    const mount = qs(root, '#rb-certification-list');
    clearNode(mount);
    state.certifications.forEach((certification, index) => {
      const card = createNode('div', 'resume-subcard');
      const head = createNode('div', 'resume-subcard-head');
      const title = createNode('strong', '', `Certification ${index + 1}`);
      const remove = createNode('button', 'resume-remove-btn', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove certification ${index + 1}`);
      remove.disabled = state.certifications.length === 1;
      remove.addEventListener('click', () => {
        if (state.certifications.length === 1) return;
        state.certifications.splice(index, 1);
        renderCertificationList();
        renderBuilderDerivedViews();
        saveToStorage(state);
      });
      head.append(title, remove);

      const field = createNode('div', 'resume-field');
      const label = createNode('label', '', 'Certification name');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = certification;
      input.setAttribute('aria-label', `Certification ${index + 1} name`);
      input.addEventListener('input', () => {
        state.certifications[index] = input.value;
        renderBuilderDerivedViews();
        debouncedSave();
      });
      field.append(label, input);

      card.append(head, field);
      mount.appendChild(card);
    });
  }

  function setStep(step) {
    state.currentStep = Math.min(5, Math.max(1, step));
    let activePanel = null;
    root.querySelectorAll('[data-step-panel]').forEach((panel) => {
      const active = Number(panel.getAttribute('data-step-panel')) === state.currentStep;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
      if (active) activePanel = panel;
    });
    root.querySelectorAll('[data-step-dot]').forEach((dot) => {
      const dotStep = Number(dot.getAttribute('data-step-dot'));
      dot.classList.toggle('is-active', dotStep === state.currentStep);
      dot.classList.toggle('is-complete', dotStep < state.currentStep);
      dot.setAttribute('aria-current', dotStep === state.currentStep ? 'step' : 'false');
    });

    const prev = qs(root, '#rb-prev');
    const next = qs(root, '#rb-next');
    prev.disabled = state.currentStep === 1;
    prev.setAttribute('aria-disabled', String(state.currentStep === 1));
    prev.hidden = false;
    next.hidden = state.currentStep === 5;
    next.setAttribute('aria-hidden', String(state.currentStep === 5));
    next.textContent = state.currentStep === 4 ? 'Review & Generate' : 'Next';
    renderReviewSummary();

    if (activePanel) {
      const focusTarget = activePanel.querySelector('input, textarea, select, button:not([disabled])');
      if (focusTarget && state.currentStep !== 5) {
        window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
      }
      window.requestAnimationFrame(() => activePanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    }
  }

  function validateCurrentStep() {
    if (state.currentStep === 1 && (!state.personal.name.trim() || !state.personal.email.trim())) {
      setBanner(builderBanner, 'Add at least your full name and email before moving on.');
      showToast(toastStack, 'Add your name and email first.', 'error');
      return false;
    }
    setBanner(builderBanner);
    return true;
  }

  function renderAnalysisResults(report) {
    animateScoreGauge(scoreGauge, report.score, report.scoreLabel, report.scoreColor);
    scoreLabel.textContent = report.scoreLabel;
    scoreLabel.style.color = report.scoreColor;
    renderPills(foundKeywords, report.keywordsFound, 'found');
    renderPills(missingKeywords, report.keywordsMissing, 'missing');
    renderSectionTable(sectionBody, report.sections);
    renderSuggestions(suggestions, report.improvements);
    atsResults.classList.remove('hidden');
    revealResults(atsResults);
  }

  async function runAtsAnalysis() {
    const resumeText = atsResume.value.trim();
    const jobText = atsJob.value.trim();

    if (resumeText.length < 50) {
      setBanner(atsBanner, 'Please paste at least 50 characters of resume text before analyzing it.');
      showToast(toastStack, 'Please paste more resume text before running the ATS analysis.', 'error');
      return;
    }

    atsBusy = true;
    state.lastReport = null;
    syncExportButtons();
    updateQuotaUi();
    atsResults.classList.add('hidden');
    setBanner(atsBanner);
    atsLoading.classList.remove('hidden');
    const stopRotation = startStatusRotation(atsStatus, ATS_STATUS_MESSAGES);
    setButtonLoading(atsButton, true, getQuotaButtonLabel(atsBaseLabel, TOOL_KEY), 'Analyzing...');

    try {
      const userContent = `Resume:\n${resumeText}\n\nJob Description:\n${jobText || 'Not provided - analyze for general quality.'}`;
      const firstAttempt = await callAI({
        tool: TOOL_KEY,
        systemPrompt: ATS_SYSTEM_PROMPT,
        userContent,
        maxTokens: 1800,
        temperature: 0.2,
      });

      let parsed = parsePossiblyWrappedJson(firstAttempt.text);
      if (!parsed) {
        setBanner(atsBanner, 'AI returned unexpected format. Retrying with backup model...', 'info');
        await delay(2000);
        const retryAttempt = await callAI({
          tool: TOOL_KEY,
          systemPrompt: ATS_SYSTEM_PROMPT,
          userContent,
          maxTokens: 1800,
          temperature: 0.15,
          chargeQuota: false,
          skipModels: firstAttempt.model ? [firstAttempt.model] : [],
        });
        parsed = parsePossiblyWrappedJson(retryAttempt.text);
      }

      if (!parsed) {
        throw new Error('AI returned unexpected format. Please retry.');
      }

      const report = sanitizeAnalysisPayload(parsed);
      state.lastReport = report;
      syncExportButtons();
      renderAnalysisResults(report);
      setBanner(atsBanner, 'Analysis complete. Review missing keywords and high-priority fixes before you apply.', 'success');
    } catch (error) {
      const message = String(error?.message || error || '');
      if (/Daily limit reached/i.test(message)) {
        setBanner(atsBanner, 'Daily limit reached \u2014 15 uses per tool per day. Resets at midnight. \u26A1');
        showToast(toastStack, 'Daily limit reached \u2014 15 uses per tool per day. Resets at midnight. \u26A1', 'error');
      } else if (/busy|60 seconds/i.test(message)) {
        setBanner(atsBanner, 'Our AI is busy right now. Try again in 60 seconds.', 'error', runAtsAnalysis);
      } else if (/unexpected format/i.test(message)) {
        setBanner(atsBanner, 'AI returned unexpected format. Please retry.', 'error', runAtsAnalysis);
      } else if (/connection|network/i.test(message) || !navigator.onLine) {
        setBanner(atsBanner, 'Connection issue. Check your internet and try again.', 'error', runAtsAnalysis);
      } else {
        setBanner(atsBanner, message || 'Our AI is busy right now. Try again in 60 seconds.', 'error', runAtsAnalysis);
      }
    } finally {
      stopRotation();
      atsLoading.classList.add('hidden');
      atsBusy = false;
      updateQuotaUi();
      setButtonLoading(atsButton, false, getQuotaButtonLabel(atsBaseLabel, TOOL_KEY), 'Analyzing...');
    }
  }

  async function runResumeBuilder() {
    if (!state.personal.name.trim()) {
      setBanner(builderBanner, 'Add your full name before generating the resume draft.');
      showToast(toastStack, 'Add your full name before generating the resume.', 'error');
      return;
    }

    builderBusy = true;
    state.generatedResume = '';
    syncExportButtons();
    updateQuotaUi();
    setBanner(builderBanner);
    previewWrap.classList.add('hidden');
    builderLoading.classList.remove('hidden');
    const stopRotation = startStatusRotation(builderStatus, BUILDER_STATUS_MESSAGES);
    setButtonLoading(generateButton, true, `\u26A1 ${getQuotaButtonLabel(builderBaseLabel, TOOL_KEY)}`, 'Generating...');

    try {
      const result = await callAI({
        tool: TOOL_KEY,
        systemPrompt: BUILDER_SYSTEM_PROMPT,
        userContent: buildResumePrompt(state),
        maxTokens: 1800,
        temperature: 0.55,
      });

      state.generatedResume = normalizeGeneratedResumeIdentity(result.text.trim(), state);
      renderFormattedPreview(state.generatedResume);
      previewCount.textContent = `${state.generatedResume.length} chars`;
      previewNote.textContent = deriveResumeNote(state.generatedResume, state);
      previewWrap.classList.remove('hidden');
      syncExportButtons();
      setBanner(builderBanner, 'Resume draft ready. Review every metric, date, and claim before you use it.', 'success');
    } catch (error) {
      const message = String(error?.message || error || '');
      if (/Daily limit reached/i.test(message)) {
        setBanner(builderBanner, 'Daily limit reached \u2014 15 uses per tool per day. Resets at midnight. \u26A1');
        showToast(toastStack, 'Daily limit reached \u2014 15 uses per tool per day. Resets at midnight. \u26A1', 'error');
      } else if (/busy|60 seconds/i.test(message)) {
        setBanner(builderBanner, 'Our AI is busy right now. Try again in 60 seconds.', 'error', runResumeBuilder);
      } else if (/connection|network/i.test(message) || !navigator.onLine) {
        setBanner(builderBanner, 'Connection issue. Check your internet and try again.', 'error', runResumeBuilder);
      } else {
        setBanner(builderBanner, message || 'Could not generate the resume right now. Please retry.', 'error', runResumeBuilder);
      }
    } finally {
      stopRotation();
      builderLoading.classList.add('hidden');
      builderBusy = false;
      updateQuotaUi();
      setButtonLoading(generateButton, false, `\u26A1 ${getQuotaButtonLabel(builderBaseLabel, TOOL_KEY)}`, 'Generating...');
    }
  }

  qs(root, '#rb-add-experience').addEventListener('click', () => {
    if (state.experiences.length >= 5) {
      showToast(toastStack, 'You can add up to 5 experience blocks.', 'info');
      return;
    }
    state.experiences.push(createEmptyExperience());
    renderExperienceList();
    renderBuilderDerivedViews();
    saveToStorage(state);
  });

  qs(root, '#rb-add-project').addEventListener('click', () => {
    if (state.projects.length >= 5) {
      showToast(toastStack, 'You can add up to 5 project blocks.', 'info');
      return;
    }
    state.projects.push(createEmptyProject());
    renderProjectList();
    renderBuilderDerivedViews();
    saveToStorage(state);
  });

  qs(root, '#rb-add-certification').addEventListener('click', () => {
    if (state.certifications.length >= 5) {
      showToast(toastStack, 'You can add up to 5 certifications.', 'info');
      return;
    }
    state.certifications.push(createEmptyCertification());
    renderCertificationList();
    renderBuilderDerivedViews();
    saveToStorage(state);
  });

  qs(root, '#rb-prev').addEventListener('click', () => setStep(state.currentStep - 1));
  qs(root, '#rb-next').addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    setStep(state.currentStep + 1);
  });

  atsButton.addEventListener('click', runAtsAnalysis);
  generateButton.addEventListener('click', runResumeBuilder);
  if (pdfButton) pdfButton.addEventListener('click', downloadResumePDF);
  if (printButton) printButton.addEventListener('click', printResume);

  copyReportButton.addEventListener('click', async () => {
    if (!state.lastReport) return;
    await copyText(buildReportMarkdown(state.lastReport), toastStack, 'ATS report copied to clipboard.');
  });

  downloadReportButton.addEventListener('click', () => {
    if (!state.lastReport) return;
    downloadText('tooliest-ats-report.txt', buildReportMarkdown(state.lastReport));
  });

  copyResumeButton.addEventListener('click', async () => {
    if (!state.generatedResume) return;
    await copyText(state.generatedResume, toastStack, 'Resume copied to clipboard.');
  });

  downloadResumeButton.addEventListener('click', () => {
    if (!state.generatedResume) return;
    downloadText('tooliest-resume.txt', state.generatedResume);
  });

  bindCounter(atsResume, atsResumeCount, 5000, atsWarn, 4500);
  bindCounter(atsJob, atsJobCount, 3000, null, 2500);
  updateBuilderFieldBindings();
  populateFormFromState();
  renderFormattedPreview(state.generatedResume);
  setStep(1);
  syncExportButtons();
  updateQuotaUi();
  if (wasRestored) {
    window.setTimeout(() => {
      showToast(toastStack, 'Draft restored - your previous work has been loaded.', 'info');
    }, 400);
  }
}
