import {
  callAI,
  renderQuota,
  getQuotaButtonLabel,
  getRemaining,
  refreshQuotaStatus,
} from '../_shared/rateLimit.js';

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
const DOCX_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',
  'https://unpkg.com/docx@8.5.0/build/index.umd.js',
];
const MAMMOTH_CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js',
];
const LZ_STRING_CDN_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js',
  'https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js',
];
// PDF.js 3.x exposes a reliable browser global for lazy script loading.
const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const RESUME_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_IMPORT_MAX_CHARS = 8000;
const SHARE_LINK_URL_LIMIT = 8000;
let resumeExportState = null;
let resumeExportToastStack = null;
let docxLoaded = false;
let mammothLoaded = false;
let pdfJsLoaded = false;
let lzStringLoaded = false;
let autosaveSettleTimer = 0;
let autosaveRefreshTimer = 0;
let resumeTemplateState = null;
let resumeTemplateRoot = null;
let resumeTemplateSave = null;
let quotaCountdownInterval = 0;
let resumeQuotaUiController = null;
let globalErrorBoundaryReady = false;

function getErrorMessage(error) {
  return String(error?.message || error || '');
}

function isRateLimitError(error) {
  const message = getErrorMessage(error).toLowerCase();
  return error?.status === 429
    || message.includes('429')
    || message.includes('rate limit')
    || message.includes('daily limit')
    || message.includes('quota');
}

function isNetworkError(error) {
  const message = getErrorMessage(error).toLowerCase();
  return error instanceof TypeError
    || message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('connection');
}

function showGlobalToast(message, type = 'error') {
  if (resumeExportToastStack) {
    showToast(resumeExportToastStack, message, type);
  }
}

function getQuotaResetCountdown() {
  const now = new Date();
  const resetUTC = new Date();
  resetUTC.setUTCHours(24, 0, 0, 0);
  const diffMs = Math.max(0, resetUTC.getTime() - now.getTime());
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  if (diffHours === 0) return `${diffMins} minutes`;
  if (diffMins === 0) return `${diffHours} hours`;
  return `${diffHours}h ${diffMins}m`;
}

function showRateLimitExhaustedState() {
  showGlobalToast(
    "You've used all 15 AI credits for today. The counter resets at midnight UTC. Non-AI features (PDF, DOCX, Copy, Share, Templates) still work!",
    'warning',
  );
  if (resumeQuotaUiController?.showRateLimitExhaustedState) {
    resumeQuotaUiController.showRateLimitExhaustedState();
  }
}

function setupGlobalErrorBoundary() {
  if (globalErrorBoundaryReady || typeof window === 'undefined') return;
  globalErrorBoundaryReady = true;

  window.onerror = (message, source, lineno, colno, error) => {
    const filename = String(source || '');
    const text = String(message || '');
    if (filename.includes('extension://') || filename.includes('moz-extension://')) return true;
    if (text === 'Script error.' && !filename && !error) return true;
    const isOwnScript = /resume-builder|tooliest/i.test(filename);
    if (isOwnScript) {
      console.error('[Resume Builder] Runtime error boundary:', error || { message, source, lineno, colno });
      showGlobalToast('Something went wrong. Your draft is safe - try refreshing the page if the issue persists.', 'error');
      return true;
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    console.error('[Resume Builder] Unhandled promise rejection:', reason);
    if (isRateLimitError(reason)) {
      showRateLimitExhaustedState();
    } else if (isNetworkError(reason)) {
      showGlobalToast('Network error - check your connection and try again.', 'error');
    } else {
      showGlobalToast('An unexpected error occurred. Your draft is safe.', 'error');
    }
    event.preventDefault();
  });

  window.addEventListener('beforeunload', () => {
    window.clearInterval(quotaCountdownInterval);
  });
}

setupGlobalErrorBoundary();

const RESUME_TEMPLATE_OPTIONS = ['classic', 'modern', 'compact'];
const RESUME_TEMPLATE_CLASSES = {
  classic: 'rb-tpl-classic',
  modern: 'rb-tpl-modern',
  compact: 'rb-tpl-compact',
};
const OPTIONAL_RESUME_SECTIONS = ['projects', 'certifications', 'languages'];
const DEFAULT_SECTION_ORDER = ['experience', 'projects', 'education', 'skills', 'certifications'];
const SECTION_LABELS = {
  experience: 'Work Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
};
const SECTION_TITLE_TO_KEY = {
  'WORK EXPERIENCE': 'experience',
  EXPERIENCE: 'experience',
  PROJECTS: 'projects',
  EDUCATION: 'education',
  SKILLS: 'skills',
  CERTIFICATIONS: 'certifications',
  CERTIFICATION: 'certifications',
};

// --- INDUSTRY KEYWORD INTELLIGENCE ---
const INDUSTRY_KEYWORD_MAP = {
  ROLE_TO_INDUSTRY: [
    { patterns: ['software engineer', 'software developer', 'full stack', 'fullstack', 'frontend', 'front-end', 'backend', 'back-end', 'web developer', 'web engineer'], industry: 'software_engineering' },
    { patterns: ['data scientist', 'data analyst', 'data engineer', 'machine learning', 'ml engineer', 'ai engineer', 'deep learning', 'nlp engineer'], industry: 'data_science' },
    { patterns: ['product manager', 'product owner', 'pm ', 'program manager'], industry: 'product_management' },
    { patterns: ['devops', 'site reliability', 'sre', 'platform engineer', 'cloud engineer', 'infrastructure engineer', 'devsecops'], industry: 'devops_cloud' },
    { patterns: ['ui designer', 'ux designer', 'ui/ux', 'product designer', 'visual designer', 'interaction designer', 'design lead'], industry: 'design' },
    { patterns: ['marketing manager', 'digital marketing', 'growth manager', 'content strategist', 'seo specialist', 'performance marketer', 'brand manager'], industry: 'marketing' },
    { patterns: ['financial analyst', 'finance manager', 'accountant', 'investment analyst', 'cfo', 'controller', 'auditor', 'budget analyst'], industry: 'finance' },
    { patterns: ['sales manager', 'account executive', 'sales engineer', 'business development', 'account manager', 'sales representative', 'solutions engineer'], industry: 'sales' },
    { patterns: ['registered nurse', 'rn ', 'nurse practitioner', 'clinical nurse', 'healthcare', 'medical assistant', 'physician assistant', 'pharmacist'], industry: 'healthcare' },
    { patterns: ['teacher', 'educator', 'professor', 'curriculum', 'instructional designer', 'academic', 'tutor', 'lecturer'], industry: 'education' },
    { patterns: ['project manager', 'pmp', 'scrum master', 'delivery manager', 'program manager', 'operations manager'], industry: 'project_management' },
    { patterns: ['cybersecurity', 'security analyst', 'penetration', 'information security', 'infosec', 'security engineer', 'soc analyst'], industry: 'cybersecurity' },
    { patterns: ['recruiter', 'talent acquisition', 'hr manager', 'human resources', 'people operations', 'hr business partner'], industry: 'human_resources' },
    { patterns: ['content writer', 'copywriter', 'technical writer', 'journalist', 'editor', 'communications manager', 'public relations'], industry: 'content_writing' },
    { patterns: ['business analyst', 'systems analyst', 'ba ', 'process analyst', 'functional analyst'], industry: 'business_analysis' },
  ],
  INDUSTRY_KEYWORDS: {
    software_engineering: [
      { kw: 'JavaScript', category: 'Technical', priority: 1 },
      { kw: 'TypeScript', category: 'Technical', priority: 1 },
      { kw: 'React', category: 'Technical', priority: 1 },
      { kw: 'Node.js', category: 'Technical', priority: 1 },
      { kw: 'Python', category: 'Technical', priority: 1 },
      { kw: 'REST API', category: 'Technical', priority: 1 },
      { kw: 'SQL', category: 'Technical', priority: 1 },
      { kw: 'Git', category: 'Tools', priority: 1 },
      { kw: 'Docker', category: 'Tools', priority: 1 },
      { kw: 'Agile', category: 'Methodologies', priority: 1 },
      { kw: 'CI/CD', category: 'Methodologies', priority: 1 },
      { kw: 'AWS', category: 'Tools', priority: 1 },
      { kw: 'Microservices', category: 'Technical', priority: 1 },
      { kw: 'Unit Testing', category: 'Methodologies', priority: 1 },
      { kw: 'Code Review', category: 'Methodologies', priority: 1 },
      { kw: 'Vue.js', category: 'Technical', priority: 2 },
      { kw: 'PostgreSQL', category: 'Technical', priority: 2 },
      { kw: 'GraphQL', category: 'Technical', priority: 2 },
      { kw: 'Kubernetes', category: 'Tools', priority: 2 },
      { kw: 'System Design', category: 'Technical', priority: 2 },
      { kw: 'Performance Optimization', category: 'Technical', priority: 2 },
      { kw: 'Cross-functional Collaboration', category: 'Soft Skills', priority: 2 },
      { kw: 'Technical Documentation', category: 'Soft Skills', priority: 2 },
      { kw: 'Problem Solving', category: 'Soft Skills', priority: 1 },
      { kw: 'Scalability', category: 'Technical', priority: 2 },
    ],
    data_science: [
      { kw: 'Python', category: 'Technical', priority: 1 },
      { kw: 'Machine Learning', category: 'Technical', priority: 1 },
      { kw: 'SQL', category: 'Technical', priority: 1 },
      { kw: 'TensorFlow', category: 'Tools', priority: 1 },
      { kw: 'PyTorch', category: 'Tools', priority: 1 },
      { kw: 'Data Visualization', category: 'Technical', priority: 1 },
      { kw: 'Statistical Analysis', category: 'Technical', priority: 1 },
      { kw: 'Pandas', category: 'Tools', priority: 1 },
      { kw: 'NumPy', category: 'Tools', priority: 1 },
      { kw: 'Scikit-learn', category: 'Tools', priority: 1 },
      { kw: 'A/B Testing', category: 'Methodologies', priority: 1 },
      { kw: 'Natural Language Processing', category: 'Technical', priority: 2 },
      { kw: 'Deep Learning', category: 'Technical', priority: 2 },
      { kw: 'Feature Engineering', category: 'Technical', priority: 1 },
      { kw: 'Data Pipeline', category: 'Technical', priority: 1 },
      { kw: 'Tableau', category: 'Tools', priority: 2 },
      { kw: 'Apache Spark', category: 'Tools', priority: 2 },
      { kw: 'ETL', category: 'Technical', priority: 2 },
      { kw: 'Model Deployment', category: 'Technical', priority: 2 },
      { kw: 'Data Wrangling', category: 'Technical', priority: 1 },
      { kw: 'Jupyter Notebook', category: 'Tools', priority: 2 },
      { kw: 'Regression Analysis', category: 'Technical', priority: 1 },
      { kw: 'Data Storytelling', category: 'Soft Skills', priority: 2 },
      { kw: 'Cross-team Collaboration', category: 'Soft Skills', priority: 2 },
      { kw: 'Business Intelligence', category: 'Technical', priority: 2 },
    ],
    product_management: [
      { kw: 'Product Roadmap', category: 'Core', priority: 1 },
      { kw: 'User Research', category: 'Core', priority: 1 },
      { kw: 'Agile', category: 'Methodologies', priority: 1 },
      { kw: 'Scrum', category: 'Methodologies', priority: 1 },
      { kw: 'A/B Testing', category: 'Technical', priority: 1 },
      { kw: 'Data-driven Decision Making', category: 'Core', priority: 1 },
      { kw: 'Stakeholder Management', category: 'Soft Skills', priority: 1 },
      { kw: 'Product Strategy', category: 'Core', priority: 1 },
      { kw: 'Go-to-Market Strategy', category: 'Core', priority: 1 },
      { kw: 'Customer Discovery', category: 'Core', priority: 1 },
      { kw: 'KPIs', category: 'Core', priority: 1 },
      { kw: 'OKRs', category: 'Methodologies', priority: 2 },
      { kw: 'JIRA', category: 'Tools', priority: 2 },
      { kw: 'Figma', category: 'Tools', priority: 2 },
      { kw: 'SQL', category: 'Technical', priority: 2 },
      { kw: 'Customer Journey Mapping', category: 'Core', priority: 2 },
      { kw: 'Feature Prioritization', category: 'Core', priority: 1 },
      { kw: 'Cross-functional Leadership', category: 'Soft Skills', priority: 1 },
      { kw: 'Market Analysis', category: 'Core', priority: 2 },
      { kw: 'Sprint Planning', category: 'Methodologies', priority: 2 },
      { kw: 'Revenue Growth', category: 'Core', priority: 2 },
      { kw: 'Product Metrics', category: 'Core', priority: 1 },
      { kw: 'Wireframing', category: 'Technical', priority: 2 },
      { kw: 'Competitive Analysis', category: 'Core', priority: 2 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
    ],
    devops_cloud: [
      { kw: 'AWS', category: 'Technical', priority: 1 },
      { kw: 'Kubernetes', category: 'Technical', priority: 1 },
      { kw: 'Docker', category: 'Technical', priority: 1 },
      { kw: 'CI/CD', category: 'Methodologies', priority: 1 },
      { kw: 'Terraform', category: 'Tools', priority: 1 },
      { kw: 'Linux', category: 'Technical', priority: 1 },
      { kw: 'Jenkins', category: 'Tools', priority: 1 },
      { kw: 'Ansible', category: 'Tools', priority: 2 },
      { kw: 'Infrastructure as Code', category: 'Methodologies', priority: 1 },
      { kw: 'Monitoring', category: 'Technical', priority: 1 },
      { kw: 'Azure', category: 'Technical', priority: 2 },
      { kw: 'GCP', category: 'Technical', priority: 2 },
      { kw: 'Prometheus', category: 'Tools', priority: 2 },
      { kw: 'Grafana', category: 'Tools', priority: 2 },
      { kw: 'GitOps', category: 'Methodologies', priority: 2 },
      { kw: 'Site Reliability', category: 'Methodologies', priority: 1 },
      { kw: 'Incident Management', category: 'Core', priority: 1 },
      { kw: 'Security Best Practices', category: 'Core', priority: 1 },
      { kw: 'Bash Scripting', category: 'Technical', priority: 1 },
      { kw: 'Python', category: 'Technical', priority: 2 },
      { kw: 'Microservices Architecture', category: 'Technical', priority: 2 },
      { kw: 'Network Configuration', category: 'Technical', priority: 2 },
      { kw: 'Disaster Recovery', category: 'Core', priority: 2 },
      { kw: 'Cost Optimization', category: 'Core', priority: 2 },
      { kw: 'Automation', category: 'Methodologies', priority: 1 },
    ],
    design: [
      { kw: 'Figma', category: 'Tools', priority: 1 },
      { kw: 'User Research', category: 'Core', priority: 1 },
      { kw: 'Wireframing', category: 'Core', priority: 1 },
      { kw: 'Prototyping', category: 'Core', priority: 1 },
      { kw: 'Design Systems', category: 'Core', priority: 1 },
      { kw: 'Usability Testing', category: 'Core', priority: 1 },
      { kw: 'Information Architecture', category: 'Core', priority: 1 },
      { kw: 'Interaction Design', category: 'Core', priority: 1 },
      { kw: 'Adobe XD', category: 'Tools', priority: 2 },
      { kw: 'Adobe Illustrator', category: 'Tools', priority: 2 },
      { kw: 'Accessibility (WCAG)', category: 'Technical', priority: 1 },
      { kw: 'Design Thinking', category: 'Methodologies', priority: 1 },
      { kw: 'Visual Design', category: 'Core', priority: 1 },
      { kw: 'Typography', category: 'Core', priority: 2 },
      { kw: 'Color Theory', category: 'Core', priority: 2 },
      { kw: 'User Personas', category: 'Methodologies', priority: 2 },
      { kw: 'A/B Testing', category: 'Methodologies', priority: 2 },
      { kw: 'Cross-functional Collaboration', category: 'Soft Skills', priority: 1 },
      { kw: 'Responsive Design', category: 'Technical', priority: 1 },
      { kw: 'Stakeholder Presentation', category: 'Soft Skills', priority: 2 },
      { kw: 'Journey Mapping', category: 'Methodologies', priority: 2 },
      { kw: 'Design Critique', category: 'Soft Skills', priority: 2 },
      { kw: 'CSS', category: 'Technical', priority: 2 },
      { kw: 'Motion Design', category: 'Core', priority: 2 },
      { kw: 'Empathy', category: 'Soft Skills', priority: 1 },
    ],
    marketing: [
      { kw: 'Digital Marketing', category: 'Core', priority: 1 },
      { kw: 'SEO', category: 'Technical', priority: 1 },
      { kw: 'Content Marketing', category: 'Core', priority: 1 },
      { kw: 'Google Analytics', category: 'Tools', priority: 1 },
      { kw: 'Social Media Marketing', category: 'Core', priority: 1 },
      { kw: 'Email Marketing', category: 'Core', priority: 1 },
      { kw: 'PPC Advertising', category: 'Technical', priority: 1 },
      { kw: 'CRM', category: 'Tools', priority: 1 },
      { kw: 'HubSpot', category: 'Tools', priority: 2 },
      { kw: 'A/B Testing', category: 'Methodologies', priority: 1 },
      { kw: 'Campaign Management', category: 'Core', priority: 1 },
      { kw: 'Marketing Automation', category: 'Technical', priority: 2 },
      { kw: 'Conversion Rate Optimization', category: 'Technical', priority: 2 },
      { kw: 'Brand Strategy', category: 'Core', priority: 2 },
      { kw: 'Market Research', category: 'Core', priority: 1 },
      { kw: 'Copywriting', category: 'Core', priority: 2 },
      { kw: 'Google Ads', category: 'Tools', priority: 1 },
      { kw: 'Data Analytics', category: 'Technical', priority: 1 },
      { kw: 'Lead Generation', category: 'Core', priority: 1 },
      { kw: 'Customer Segmentation', category: 'Core', priority: 2 },
      { kw: 'Salesforce', category: 'Tools', priority: 2 },
      { kw: 'ROI Analysis', category: 'Core', priority: 2 },
      { kw: 'Growth Hacking', category: 'Methodologies', priority: 2 },
      { kw: 'Storytelling', category: 'Soft Skills', priority: 2 },
      { kw: 'Budget Management', category: 'Core', priority: 2 },
    ],
    finance: [
      { kw: 'Financial Analysis', category: 'Core', priority: 1 },
      { kw: 'Financial Modeling', category: 'Technical', priority: 1 },
      { kw: 'Excel', category: 'Tools', priority: 1 },
      { kw: 'Budgeting', category: 'Core', priority: 1 },
      { kw: 'Forecasting', category: 'Core', priority: 1 },
      { kw: 'GAAP', category: 'Methodologies', priority: 1 },
      { kw: 'Variance Analysis', category: 'Technical', priority: 1 },
      { kw: 'Accounts Payable', category: 'Core', priority: 2 },
      { kw: 'Accounts Receivable', category: 'Core', priority: 2 },
      { kw: 'Risk Management', category: 'Core', priority: 1 },
      { kw: 'SQL', category: 'Technical', priority: 2 },
      { kw: 'SAP', category: 'Tools', priority: 2 },
      { kw: 'QuickBooks', category: 'Tools', priority: 2 },
      { kw: 'Valuation', category: 'Technical', priority: 2 },
      { kw: 'Audit', category: 'Core', priority: 2 },
      { kw: 'Cash Flow Management', category: 'Core', priority: 1 },
      { kw: 'Financial Reporting', category: 'Core', priority: 1 },
      { kw: 'DCF Analysis', category: 'Technical', priority: 2 },
      { kw: 'Regulatory Compliance', category: 'Core', priority: 1 },
      { kw: 'Investment Analysis', category: 'Technical', priority: 2 },
      { kw: 'Power BI', category: 'Tools', priority: 2 },
      { kw: 'CPA', category: 'Credentials', priority: 1 },
      { kw: 'Attention to Detail', category: 'Soft Skills', priority: 1 },
      { kw: 'Strategic Planning', category: 'Core', priority: 2 },
      { kw: 'Stakeholder Reporting', category: 'Core', priority: 2 },
    ],
    sales: [
      { kw: 'Salesforce', category: 'Tools', priority: 1 },
      { kw: 'CRM', category: 'Tools', priority: 1 },
      { kw: 'Pipeline Management', category: 'Core', priority: 1 },
      { kw: 'Lead Generation', category: 'Core', priority: 1 },
      { kw: 'Cold Outreach', category: 'Core', priority: 1 },
      { kw: 'Closing Deals', category: 'Core', priority: 1 },
      { kw: 'Account Management', category: 'Core', priority: 1 },
      { kw: 'SaaS Sales', category: 'Technical', priority: 2 },
      { kw: 'B2B Sales', category: 'Core', priority: 1 },
      { kw: 'Quota Achievement', category: 'Core', priority: 1 },
      { kw: 'Negotiation', category: 'Soft Skills', priority: 1 },
      { kw: 'Solution Selling', category: 'Methodologies', priority: 2 },
      { kw: 'Prospecting', category: 'Core', priority: 1 },
      { kw: 'Forecasting', category: 'Technical', priority: 2 },
      { kw: 'HubSpot', category: 'Tools', priority: 2 },
      { kw: 'Customer Success', category: 'Core', priority: 2 },
      { kw: 'Revenue Growth', category: 'Core', priority: 1 },
      { kw: 'Outbound Sales', category: 'Core', priority: 2 },
      { kw: 'Discovery Calls', category: 'Core', priority: 2 },
      { kw: 'LinkedIn Sales Navigator', category: 'Tools', priority: 2 },
      { kw: 'Relationship Building', category: 'Soft Skills', priority: 1 },
      { kw: 'Product Demos', category: 'Core', priority: 2 },
      { kw: 'Objection Handling', category: 'Soft Skills', priority: 1 },
      { kw: 'Territory Management', category: 'Core', priority: 2 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
    ],
    healthcare: [
      { kw: 'Patient Care', category: 'Core', priority: 1 },
      { kw: 'Electronic Health Records (EHR)', category: 'Technical', priority: 1 },
      { kw: 'HIPAA Compliance', category: 'Regulatory', priority: 1 },
      { kw: 'Clinical Documentation', category: 'Core', priority: 1 },
      { kw: 'Medication Administration', category: 'Core', priority: 1 },
      { kw: 'Vital Signs Monitoring', category: 'Core', priority: 1 },
      { kw: 'Patient Assessment', category: 'Core', priority: 1 },
      { kw: 'Epic Systems', category: 'Tools', priority: 2 },
      { kw: 'IV Therapy', category: 'Core', priority: 2 },
      { kw: 'Infection Control', category: 'Core', priority: 1 },
      { kw: 'Care Coordination', category: 'Core', priority: 1 },
      { kw: 'Acute Care', category: 'Core', priority: 2 },
      { kw: 'Patient Education', category: 'Core', priority: 2 },
      { kw: 'Interdisciplinary Collaboration', category: 'Soft Skills', priority: 1 },
      { kw: 'Critical Thinking', category: 'Soft Skills', priority: 1 },
      { kw: 'BLS Certification', category: 'Credentials', priority: 1 },
      { kw: 'ACLS', category: 'Credentials', priority: 2 },
      { kw: 'Triage', category: 'Core', priority: 2 },
      { kw: 'Wound Care', category: 'Core', priority: 2 },
      { kw: 'Compassionate Care', category: 'Soft Skills', priority: 1 },
      { kw: 'Medical Terminology', category: 'Technical', priority: 1 },
      { kw: 'Quality Improvement', category: 'Methodologies', priority: 2 },
      { kw: 'Time Management', category: 'Soft Skills', priority: 1 },
      { kw: 'Diagnostic Support', category: 'Core', priority: 2 },
      { kw: 'Multidisciplinary Teamwork', category: 'Soft Skills', priority: 1 },
    ],
    education: [
      { kw: 'Curriculum Development', category: 'Core', priority: 1 },
      { kw: 'Lesson Planning', category: 'Core', priority: 1 },
      { kw: 'Classroom Management', category: 'Core', priority: 1 },
      { kw: 'Differentiated Instruction', category: 'Methodologies', priority: 1 },
      { kw: 'Assessment Design', category: 'Core', priority: 1 },
      { kw: 'Student Engagement', category: 'Core', priority: 1 },
      { kw: 'Learning Management System', category: 'Tools', priority: 1 },
      { kw: 'Google Classroom', category: 'Tools', priority: 2 },
      { kw: 'Formative Assessment', category: 'Methodologies', priority: 2 },
      { kw: 'Data-Driven Instruction', category: 'Methodologies', priority: 2 },
      { kw: 'Special Education', category: 'Core', priority: 2 },
      { kw: 'IEP', category: 'Regulatory', priority: 2 },
      { kw: 'Parent Communication', category: 'Soft Skills', priority: 1 },
      { kw: 'Collaborative Teaching', category: 'Soft Skills', priority: 2 },
      { kw: 'STEM Education', category: 'Core', priority: 2 },
      { kw: 'Instructional Technology', category: 'Technical', priority: 2 },
      { kw: 'Project-Based Learning', category: 'Methodologies', priority: 2 },
      { kw: 'Bloom\'s Taxonomy', category: 'Methodologies', priority: 2 },
      { kw: 'Student-Centered Learning', category: 'Methodologies', priority: 1 },
      { kw: 'Educational Leadership', category: 'Soft Skills', priority: 2 },
      { kw: 'Mentorship', category: 'Soft Skills', priority: 2 },
      { kw: 'Critical Thinking Development', category: 'Core', priority: 1 },
      { kw: 'Empathy', category: 'Soft Skills', priority: 1 },
      { kw: 'Microsoft Office', category: 'Tools', priority: 1 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
    ],
    project_management: [
      { kw: 'PMP', category: 'Credentials', priority: 1 },
      { kw: 'Agile', category: 'Methodologies', priority: 1 },
      { kw: 'Scrum', category: 'Methodologies', priority: 1 },
      { kw: 'Project Planning', category: 'Core', priority: 1 },
      { kw: 'Risk Management', category: 'Core', priority: 1 },
      { kw: 'Stakeholder Management', category: 'Soft Skills', priority: 1 },
      { kw: 'Budget Management', category: 'Core', priority: 1 },
      { kw: 'JIRA', category: 'Tools', priority: 1 },
      { kw: 'MS Project', category: 'Tools', priority: 2 },
      { kw: 'Gantt Charts', category: 'Technical', priority: 2 },
      { kw: 'Resource Allocation', category: 'Core', priority: 1 },
      { kw: 'Sprint Planning', category: 'Methodologies', priority: 1 },
      { kw: 'Cross-functional Collaboration', category: 'Soft Skills', priority: 1 },
      { kw: 'Waterfall', category: 'Methodologies', priority: 2 },
      { kw: 'Change Management', category: 'Core', priority: 2 },
      { kw: 'KPIs', category: 'Core', priority: 1 },
      { kw: 'Milestone Tracking', category: 'Core', priority: 1 },
      { kw: 'Vendor Management', category: 'Core', priority: 2 },
      { kw: 'Asana', category: 'Tools', priority: 2 },
      { kw: 'Trello', category: 'Tools', priority: 2 },
      { kw: 'Executive Reporting', category: 'Core', priority: 2 },
      { kw: 'Conflict Resolution', category: 'Soft Skills', priority: 2 },
      { kw: 'Kanban', category: 'Methodologies', priority: 2 },
      { kw: 'Scope Management', category: 'Core', priority: 1 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
    ],
    cybersecurity: [
      { kw: 'SIEM', category: 'Tools', priority: 1 },
      { kw: 'Penetration Testing', category: 'Technical', priority: 1 },
      { kw: 'Vulnerability Assessment', category: 'Technical', priority: 1 },
      { kw: 'Network Security', category: 'Technical', priority: 1 },
      { kw: 'Incident Response', category: 'Core', priority: 1 },
      { kw: 'Threat Intelligence', category: 'Core', priority: 1 },
      { kw: 'NIST Framework', category: 'Methodologies', priority: 1 },
      { kw: 'ISO 27001', category: 'Regulatory', priority: 2 },
      { kw: 'Firewall Management', category: 'Technical', priority: 1 },
      { kw: 'Splunk', category: 'Tools', priority: 2 },
      { kw: 'OWASP', category: 'Methodologies', priority: 1 },
      { kw: 'Ethical Hacking', category: 'Technical', priority: 2 },
      { kw: 'Risk Assessment', category: 'Core', priority: 1 },
      { kw: 'Cloud Security', category: 'Technical', priority: 1 },
      { kw: 'Identity and Access Management', category: 'Technical', priority: 1 },
      { kw: 'Forensics', category: 'Technical', priority: 2 },
      { kw: 'Python', category: 'Technical', priority: 2 },
      { kw: 'Compliance', category: 'Regulatory', priority: 1 },
      { kw: 'Zero Trust', category: 'Methodologies', priority: 2 },
      { kw: 'SOC', category: 'Core', priority: 1 },
      { kw: 'Endpoint Security', category: 'Technical', priority: 2 },
      { kw: 'CompTIA Security+', category: 'Credentials', priority: 1 },
      { kw: 'CISSP', category: 'Credentials', priority: 2 },
      { kw: 'Malware Analysis', category: 'Technical', priority: 2 },
      { kw: 'Security Awareness Training', category: 'Core', priority: 2 },
    ],
    human_resources: [
      { kw: 'Talent Acquisition', category: 'Core', priority: 1 },
      { kw: 'Applicant Tracking System', category: 'Tools', priority: 1 },
      { kw: 'Employee Relations', category: 'Core', priority: 1 },
      { kw: 'Performance Management', category: 'Core', priority: 1 },
      { kw: 'Onboarding', category: 'Core', priority: 1 },
      { kw: 'HRIS', category: 'Tools', priority: 1 },
      { kw: 'Compensation & Benefits', category: 'Core', priority: 1 },
      { kw: 'Labor Law Compliance', category: 'Regulatory', priority: 1 },
      { kw: 'Workforce Planning', category: 'Core', priority: 2 },
      { kw: 'Diversity & Inclusion', category: 'Core', priority: 1 },
      { kw: 'Training & Development', category: 'Core', priority: 1 },
      { kw: 'Succession Planning', category: 'Core', priority: 2 },
      { kw: 'Workday', category: 'Tools', priority: 2 },
      { kw: 'LinkedIn Recruiter', category: 'Tools', priority: 2 },
      { kw: 'Behavioral Interviewing', category: 'Methodologies', priority: 1 },
      { kw: 'Conflict Resolution', category: 'Soft Skills', priority: 1 },
      { kw: 'Employee Engagement', category: 'Core', priority: 1 },
      { kw: 'Organizational Development', category: 'Core', priority: 2 },
      { kw: 'HR Analytics', category: 'Technical', priority: 2 },
      { kw: 'Policy Development', category: 'Core', priority: 2 },
      { kw: 'Exit Interviews', category: 'Core', priority: 2 },
      { kw: 'Empathy', category: 'Soft Skills', priority: 1 },
      { kw: 'Confidentiality', category: 'Soft Skills', priority: 1 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
      { kw: 'SHRM-CP', category: 'Credentials', priority: 2 },
    ],
    content_writing: [
      { kw: 'SEO Writing', category: 'Technical', priority: 1 },
      { kw: 'Content Strategy', category: 'Core', priority: 1 },
      { kw: 'Copywriting', category: 'Core', priority: 1 },
      { kw: 'Editing', category: 'Core', priority: 1 },
      { kw: 'Blog Writing', category: 'Core', priority: 1 },
      { kw: 'AP Style', category: 'Methodologies', priority: 2 },
      { kw: 'Social Media Content', category: 'Core', priority: 1 },
      { kw: 'Content Management System', category: 'Tools', priority: 1 },
      { kw: 'WordPress', category: 'Tools', priority: 2 },
      { kw: 'Keyword Research', category: 'Technical', priority: 1 },
      { kw: 'Long-form Content', category: 'Core', priority: 2 },
      { kw: 'Email Newsletters', category: 'Core', priority: 2 },
      { kw: 'Brand Voice', category: 'Core', priority: 1 },
      { kw: 'Research', category: 'Core', priority: 1 },
      { kw: 'Storytelling', category: 'Soft Skills', priority: 1 },
      { kw: 'Content Calendar', category: 'Methodologies', priority: 2 },
      { kw: 'Grammarly', category: 'Tools', priority: 2 },
      { kw: 'Google Analytics', category: 'Tools', priority: 2 },
      { kw: 'Audience Analysis', category: 'Core', priority: 2 },
      { kw: 'White Papers', category: 'Core', priority: 2 },
      { kw: 'Technical Writing', category: 'Core', priority: 2 },
      { kw: 'Interviewing Sources', category: 'Core', priority: 2 },
      { kw: 'Attention to Detail', category: 'Soft Skills', priority: 1 },
      { kw: 'Deadline Management', category: 'Soft Skills', priority: 1 },
      { kw: 'Adaptability', category: 'Soft Skills', priority: 1 },
    ],
    business_analysis: [
      { kw: 'Requirements Gathering', category: 'Core', priority: 1 },
      { kw: 'Process Mapping', category: 'Technical', priority: 1 },
      { kw: 'SQL', category: 'Technical', priority: 1 },
      { kw: 'Data Analysis', category: 'Technical', priority: 1 },
      { kw: 'Stakeholder Management', category: 'Soft Skills', priority: 1 },
      { kw: 'User Stories', category: 'Methodologies', priority: 1 },
      { kw: 'JIRA', category: 'Tools', priority: 1 },
      { kw: 'Visio', category: 'Tools', priority: 2 },
      { kw: 'Gap Analysis', category: 'Technical', priority: 1 },
      { kw: 'BPMN', category: 'Methodologies', priority: 2 },
      { kw: 'Agile', category: 'Methodologies', priority: 1 },
      { kw: 'Business Case Development', category: 'Core', priority: 1 },
      { kw: 'UAT', category: 'Methodologies', priority: 1 },
      { kw: 'Tableau', category: 'Tools', priority: 2 },
      { kw: 'Excel', category: 'Tools', priority: 1 },
      { kw: 'Process Improvement', category: 'Core', priority: 1 },
      { kw: 'Documentation', category: 'Core', priority: 1 },
      { kw: 'Change Management', category: 'Core', priority: 2 },
      { kw: 'KPIs', category: 'Core', priority: 1 },
      { kw: 'Root Cause Analysis', category: 'Technical', priority: 2 },
      { kw: 'Cross-functional Collaboration', category: 'Soft Skills', priority: 1 },
      { kw: 'Communication', category: 'Soft Skills', priority: 1 },
      { kw: 'Problem Solving', category: 'Soft Skills', priority: 1 },
      { kw: 'CBAP', category: 'Credentials', priority: 2 },
      { kw: 'Lean Six Sigma', category: 'Methodologies', priority: 2 },
    ],
  },
};

const INDUSTRY_DISPLAY_NAMES = {
  software_engineering: 'Software Engineering',
  data_science: 'Data Science & Analytics',
  product_management: 'Product Management',
  devops_cloud: 'DevOps & Cloud Engineering',
  design: 'UI/UX Design',
  marketing: 'Digital Marketing',
  finance: 'Finance & Accounting',
  sales: 'Sales & Business Development',
  healthcare: 'Healthcare & Nursing',
  education: 'Education & Teaching',
  project_management: 'Project Management',
  cybersecurity: 'Cybersecurity',
  human_resources: 'Human Resources',
  content_writing: 'Content Writing & Communications',
  business_analysis: 'Business Analysis',
};

let lastDetectedIndustry = null;

function detectIndustry(targetRole) {
  const role = String(targetRole || '').trim().toLowerCase();
  if (role.length < 2) return null;
  for (const entry of INDUSTRY_KEYWORD_MAP.ROLE_TO_INDUSTRY) {
    if (entry.patterns.some((pattern) => role.includes(pattern))) return entry.industry;
  }
  return null;
}

function getKeywordsForIndustry(industry) {
  return INDUSTRY_KEYWORD_MAP.INDUSTRY_KEYWORDS[industry] || [];
}

function getIndustryDisplayName(industry) {
  return INDUSTRY_DISPLAY_NAMES[industry] || '';
}

function getAlreadyAddedKeywords(state = resumeExportState) {
  return new Set(parseCommaList(state?.skills).map((skill) => skill.toLowerCase()));
}

function normalizeResumeTemplate(template) {
  return RESUME_TEMPLATE_OPTIONS.includes(template) ? template : 'classic';
}

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
- After the contact header, write a PROFESSIONAL SUMMARY section (2-3 sentences) that is tailored to the target role, highlights the candidate's years of experience and strongest skills, and contains no invented claims. This section must appear before WORK EXPERIENCE in the output.
- If the user provides a Professional Summary, preserve its facts and intent instead of replacing it with invented claims.
- Section headers in all caps on their own line. Do not write decorative divider lines (no dashes, underscores, or horizontal rules); the app renders section dividers automatically.
- Bullet points use \u2022 character
- Achievements must be quantified wherever possible. If the user has not provided numbers, insert a [PLACEHOLDER — add your specific metric here] tag instead of fabricating numbers. Never invent percentages, dollar amounts, or statistics the user did not provide.
- If the user provides projects, include a PROJECTS section using only the provided project names, links, technologies, and details. Never invent project links, repositories, metrics, or outcomes.
- In the EDUCATION section, list all education entries provided by the user.
- Follow the requested section order from the user content after PROFESSIONAL SUMMARY. Omit optional sections when they are disabled or not provided.
- Tailor language to the target job title provided
- Total length: 450-650 words for junior, 650-900 for senior
- Use strong action verbs: Led, Built, Designed, Developed, Increased, Reduced, Managed, Launched, Delivered, Implemented, Optimized, Streamlined, Collaborated, Coordinated, Achieved
- ATS-safe formatting: no tables, no columns, no graphics references
Output ONLY the resume text. No explanations, no commentary.`;

// Per-section improvement prompts
const IMPROVE_SUMMARY_PROMPT = `You are an expert resume writer. Rewrite the provided Professional
Summary to be more compelling, concise, and tailored to the target
role. Rules:
- Length: exactly 2-3 sentences, no more
- Start with a strong professional identity statement
- Include the target role/title naturally
- Mention the most relevant skills or experience level
- Use active, confident language - no passive voice
- Do NOT invent credentials, years of experience, or companies
- Do NOT add placeholders or brackets
- Return ONLY the improved summary text, no labels, no commentary`;

const IMPROVE_BULLETS_PROMPT = `You are an expert resume writer specializing in achievement-based
bullet points. You will receive a job title, company name, and up
to 3 existing bullet points. Rewrite each bullet to:
- Start with a powerful action verb (Led, Built, Increased, Reduced,
  Designed, Launched, Managed, Delivered, Optimized, Implemented,
  Streamlined, Developed, Coordinated, Automated, Negotiated)
- Be concise: maximum 20 words per bullet
- Follow the CAR format where possible: Context -> Action -> Result
- If a metric exists in the original bullet, preserve it exactly
- If no metric exists, insert [ADD YOUR METRIC] as a placeholder
- Do NOT invent companies, projects, tools, or technologies
- Do NOT add bullets beyond the ones provided
Return ONLY a JSON array of strings, one improved bullet per element.
Example: ["Led migration of...", "Reduced costs by..."]
No markdown fences, no commentary, just the raw JSON array.`;

const IMPROVE_SKILLS_PROMPT = `You are an expert resume writer and recruiter. You will receive a
target job role and a comma-separated list of skills. Your job is to:
- Return a clean, ATS-friendly, comma-separated skills list
- Keep only skills that are already present or clearly implied by the user's input
- Remove vague or weak entries (e.g., "good communicator", "team player"
  as standalone skills - these belong in the summary)
- Do NOT add guessed skills, placeholders, brackets, [?] markers, or verification notes
- Merge duplicates and near-duplicates
- Put the strongest target-role keywords first
- Use industry-standard terminology and casing (e.g., "JavaScript"
  not "javascript", "REST API" not "rest api")
- Use comma separators only; do not use semicolons, bullets, headings, or grouped labels
- Return ONLY the improved skills text, no commentary, no markdown`;

const RESUME_IMPORT_PROMPT = `You are an expert resume parser. Extract structured resume data from raw resume text.

Return ONLY a valid JSON object. No markdown fences, no prose, no commentary, no text before or after the JSON.
The response MUST be parseable by JSON.parse() with no preprocessing: no trailing commas, no comments, no single quotes, no undefined, no NaN.

Extract only data that is actually present in the resume text. Never invent, assume, complete, rewrite, or hallucinate missing data.
If a string field is not found, return an empty string. If an array field is not found, return an empty array.
For targetRole: if a target job title is clearly stated, extract it. Otherwise infer the most recent job title from work experience. If neither is clear, use an empty string.
For summary: if a professional summary, profile, or objective exists, extract it exactly. If not, return an empty string.
For skills: return one comma-separated string of individual skills.
For experiences: extract up to 5 entries. If fewer than 3 achievements exist for a role, use empty strings for missing achievement fields. Never invent achievements.
For educations: extract up to 3 entries. GPA and courses may be empty.
For projects: extract up to 5 entries. Links and technologies may be empty.

Use exactly this JSON schema and exact field names:
{
  "personal": {
    "name": "",
    "email": "",
    "phone": "",
    "linkedin": "",
    "location": "",
    "portfolio": ""
  },
  "targetRole": "",
  "summary": "",
  "experiences": [
    {
      "title": "",
      "company": "",
      "duration": "",
      "achievement1": "",
      "achievement2": "",
      "achievement3": ""
    }
  ],
  "educations": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "gpa": "",
      "courses": ""
    }
  ],
  "skills": "",
  "certifications": [],
  "projects": [
    {
      "name": "",
      "link": "",
      "technologies": "",
      "details": ""
    }
  ]
}`;

const COVER_LETTER_SYSTEM_PROMPT = `You are an elite career coach and professional writer who has written thousands
of cover letters that secured interviews at top companies. Write cover letters
that sound like a thoughtful human wrote them, not an AI tool or template.
Every sentence must sound like it was written by the candidate themselves, in
their own professional voice. Never sound like an AI assistant.

Use only the facts provided in the user content. Do not invent company details,
credentials, job duties, technologies, metrics, percentages, awards, or outcomes.
If a metric exists in the resume data, preserve it exactly. If no metric exists,
write the achievement without a number. Never fabricate numbers.

Structure rules:
- Honor the selected Style field. Use Problem-Solution for problem-solution,
  Story-Impact for story-impact, and Skills-First for skills-first while also
  matching the selected tone.
- If tone is Professional or Confident, follow a Problem-Solution structure:
  opening paragraph with a strong hook that references the exact company name
  and role, then two achievement-focused body paragraphs, then a company-fit
  paragraph, then a confident close.
- If tone is Warm & Enthusiastic, use a Story-Impact format: begin with a brief
  one-sentence career moment or result, then connect that experience to this
  company and role with warmer first-person language.
- If tone is Concise & Punchy, use a Skills-First format: no story, no filler,
  three tight paragraphs maximum, each paragraph delivering one clear message.

Opening rules:
- Do not start with "I am writing to apply for".
- Do not start with "I am excited to".
- The opening paragraph must mention the company name at least once. A letter
  that does not mention the company name in the opening paragraph is a failed output.
- The opening must reference the specific role and feel specific to this company.

Content rules:
- Body paragraph 1 must use the candidate's strongest relevant achievement and
  connect it to a problem the target role likely faces.
- Body paragraph 2 must use a second supporting achievement, skill set, or
  project. If a job description was provided, address a specific requirement
  from it using the candidate's real experience.
- The company paragraph must use the "Why this company" field if provided. If
  it is not provided, write a grounded sentence about why this role aligns with
  the candidate's trajectory without pretending to know private company facts.
- Closing must be confident and forward-looking. State availability for an
  interview. Use a professional sign-off.

Banned phrases:
- "I am writing to apply"
- "I am excited to"
- "I am passionate about"
- "I believe I would be a great fit"
- "I look forward to hearing from you"
- "Thank you for your time and consideration"
- "Furthermore,"
- "In conclusion,"
- "It goes without saying"
- "I am a team player"
- "my passion for [industry]"
- "I have always been fascinated"

Never include unfilled placeholders, brackets, "[Your Name]", "[Company]",
"[Company Name]", "[Role]", or any similar marker. Use the actual provided data.

Output format:
- Start directly with the opening paragraph. Do not include date, address block,
  subject line, or salutation.
- Separate paragraphs with one blank line.
- End with a complimentary close line such as "Best regards," on its own line,
  then the candidate's full name on the next line.
- Output ONLY the letter body text. No explanations, no commentary.

Length targets:
- Concise: 180-250 words
- Standard: 280-380 words
- Detailed: 400-480 words
Before outputting, count your words. If over the target range, cut the least
impactful sentence. If under, expand the achievement details.

Human voice rules:
- Vary sentence length: mix short, direct sentences with longer explanatory ones.
- Use the candidate's specific job titles, company names, projects, skills, and
  achievement details to ground every claim in real data.
- The letter must be specific enough that it could only belong to this candidate
  applying to this company and role. Generic output is a failure.`;

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

function normalizeSkillsText(value) {
  const seen = new Set();
  return String(value || '')
    .replace(/```(?:text)?|```/gi, '')
    .replace(/\[\?\]/g, '')
    .replace(/\[(?:verify|verification needed|suggested)\]/gi, '')
    .replace(/\b(?:Technical Skills|Soft Skills|Tools & Platforms|Tools|Platforms|Programming Languages|Data Skills)\s*:/gi, '')
    .split(/[,;\n]+/)
    .map((item) => item
      .replace(/^\s*(?:[-*]|\u2022)\s*/, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
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

function setImproveBtnLoading(btn, isLoading) {
  if (!btn) return;
  const label = btn.querySelector('.rb-improve-btn__label');
  const spinner = btn.querySelector('.rb-improve-btn__spinner');
  if (isLoading) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('rb-improve-btn--loading');
    if (label) label.textContent = btn.dataset.loadingLabel || 'Improving...';
    if (spinner) spinner.hidden = false;
  } else {
    btn.disabled = false;
    btn.setAttribute('aria-busy', 'false');
    btn.classList.remove('rb-improve-btn--loading');
    if (label) {
      label.textContent = btn.dataset.originalLabel || 'Improve with AI';
    }
    if (spinner) spinner.hidden = true;
  }
}

function flashImproveButtonDone(btn) {
  if (!btn) return;
  const label = btn.querySelector('.rb-improve-btn__label');
  const originalLabel = btn.dataset.originalLabel || label?.textContent || 'Improve with AI';
  btn.classList.add('rb-improve-btn--done');
  if (label) label.textContent = '\u2713 Done';
  window.setTimeout(() => {
    btn.classList.remove('rb-improve-btn--done');
    if (label && !btn.classList.contains('rb-improve-btn--loading')) {
      label.textContent = originalLabel;
    }
  }, 1500);
}

function cacheImproveButtonLabel(btn, fallback = 'Improve with AI') {
  if (!btn) return;
  if (!btn.dataset.originalLabel) {
    btn.dataset.originalLabel = btn.querySelector('.rb-improve-btn__label')?.textContent || fallback;
  }
}

function getAIResultText(result) {
  return String(result?.content || result?.text || '').trim();
}

function parseImprovedBulletResponse(text) {
  const cleaned = String(text || '').replace(/```(?:json)?|```/gi, '').trim();
  if (!cleaned) return [];

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch (_) {
    // Fall back to line parsing below.
  }

  return cleaned
    .split(/\r?\n/)
    .map((line) => line
      .replace(/^\s*(?:\d+[.)]|[-*]|\u2022)\s*/, '')
      .replace(/^["']|["']$/g, '')
      .trim())
    .filter(Boolean);
}

function showToast(stack, message, type = 'error') {
  if (!stack || !message) return;
  stack.setAttribute('role', 'status');
  stack.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
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
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
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
  try {
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
  } catch (error) {
    showToast(toastRoot, 'Clipboard copy failed. Select the text manually and try again.', 'error');
    throw error;
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

function normalizeSavedEducation(education = {}) {
  return {
    degree: String(education.degree ?? ''),
    institution: String(education.institution ?? ''),
    year: String(education.year ?? ''),
    gpa: String(education.gpa ?? ''),
    courses: String(education.courses ?? ''),
  };
}

function createDefaultSectionsEnabled() {
  return OPTIONAL_RESUME_SECTIONS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

function normalizeSectionsEnabled(value = {}) {
  const defaults = createDefaultSectionsEnabled();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  OPTIONAL_RESUME_SECTIONS.forEach((key) => {
    if (typeof value[key] === 'boolean') defaults[key] = value[key];
  });
  return defaults;
}

function normalizeSectionOrder(value = []) {
  const valid = new Set(DEFAULT_SECTION_ORDER);
  const normalized = [];
  if (Array.isArray(value)) {
    value.forEach((item) => {
      const key = String(item || '').trim();
      if (valid.has(key) && !normalized.includes(key)) normalized.push(key);
    });
  }
  DEFAULT_SECTION_ORDER.forEach((key) => {
    if (!normalized.includes(key)) normalized.push(key);
  });
  return normalized;
}

function isSectionEnabled(state, key) {
  return normalizeSectionsEnabled(state?.sectionsEnabled)[key] !== false;
}

function normalizeTimestamp(value) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function formatLastEdited(timestamp) {
  const normalized = normalizeTimestamp(timestamp);
  if (!normalized) return '';
  const diffMs = Math.max(0, Date.now() - normalized);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(normalized).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function hasFilledProject(project) {
  return [project?.name, project?.link, project?.technologies, project?.description]
    .some((value) => String(value || '').trim());
}

function hasFilledCertification(certification) {
  return Boolean(String(certification || '').trim());
}

function createDefaultCoverLetterSettings() {
  return {
    company: '',
    role: '',
    hiringManager: '',
    companyReason: '',
    jobDescription: '',
    tone: 'professional',
    style: 'problem-solution',
    length: 'standard',
  };
}

function normalizeCoverLetterSettings(settings = {}) {
  const defaults = createDefaultCoverLetterSettings();
  const allowedTone = ['professional', 'confident', 'warm', 'concise'];
  const allowedStyle = ['problem-solution', 'story-impact', 'skills-first'];
  const allowedLength = ['concise', 'standard', 'detailed'];
  const normalized = {
    company: String(settings.company ?? defaults.company).trim(),
    role: String(settings.role ?? defaults.role).trim(),
    hiringManager: String(settings.hiringManager ?? defaults.hiringManager).trim(),
    companyReason: String(settings.companyReason ?? settings.reason ?? defaults.companyReason).trim(),
    jobDescription: String(settings.jobDescription ?? settings.jd ?? defaults.jobDescription).trim(),
    tone: String(settings.tone ?? defaults.tone),
    style: String(settings.style ?? defaults.style),
    length: String(settings.length ?? defaults.length),
  };
  if (!allowedTone.includes(normalized.tone)) normalized.tone = defaults.tone;
  if (!allowedStyle.includes(normalized.style)) normalized.style = defaults.style;
  if (!allowedLength.includes(normalized.length)) normalized.length = defaults.length;
  return normalized;
}

function normalizeSavedAtsAnalysisResult(result = null) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  const score = Number(result.score ?? result.total);
  if (!Number.isFinite(score)) return null;
  const keywordsFound = Array.isArray(result.keywordsFound)
    ? result.keywordsFound
    : Array.isArray(result.keywords_found)
      ? result.keywords_found
      : [];
  const keywordsMissing = Array.isArray(result.keywordsMissing)
    ? result.keywordsMissing
    : Array.isArray(result.keywords_missing)
      ? result.keywords_missing
      : [];
  if (!Array.isArray(keywordsFound) || !Array.isArray(keywordsMissing)) return null;
  const scoreMeta = SCORE_META.find((meta) => score >= meta.min) || SCORE_META[SCORE_META.length - 1];
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    scoreLabel: String(result.scoreLabel || result.score_label || scoreMeta.label),
    scoreColor: String(result.scoreColor || result.color || scoreMeta.color),
    keywordsFound: keywordsFound.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 40),
    keywordsMissing: keywordsMissing.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 40),
    improvements: Array.isArray(result.improvements)
      ? result.improvements.slice(0, 8).map((item) => ({
        priority: String(item?.priority || 'medium'),
        title: String(item?.title || 'Improve resume fit'),
        detail: String(item?.detail || item?.message || '').trim(),
      })).filter((item) => item.detail || item.title)
      : [],
    sections: result.sections && typeof result.sections === 'object' && !Array.isArray(result.sections)
      ? result.sections
      : {},
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
        summary: state.summary,
        experiences: state.experiences.map(normalizeSavedExperience),
        projects: (state.projects || []).map(normalizeSavedProject),
        educations: (state.educations || []).map(normalizeSavedEducation),
        skills: state.skills,
        certifications: [...state.certifications],
        generatedResume: String(state.generatedResume || ''),
        template: normalizeResumeTemplate(state.template),
        atsAnalysisResult: normalizeSavedAtsAnalysisResult(state.atsAnalysisResult),
        coverLetter: String(state.coverLetter || ''),
        coverLetterSettings: normalizeCoverLetterSettings(state.coverLetterSettings),
        sectionsEnabled: normalizeSectionsEnabled(state.sectionsEnabled),
        sectionOrder: normalizeSectionOrder(state.sectionOrder),
        lastEditedAt: normalizeTimestamp(state.lastEditedAt),
        suggestionsDismissed: Boolean(state.suggestionsDismissed),
      },
    });
  } catch (_) {
    return null;
  }
}

function saveToStorage(state) {
  state.lastEditedAt = Date.now();
  const serialized = serializeState(state);
  if (!serialized) return;
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    showSaveIndicator('saved', state);
  } catch (error) {
    // Autosave is a convenience layer; storage failures should never block the UI.
    console.warn('Autosave failed:', error?.message || 'localStorage unavailable');
    if (error?.name === 'QuotaExceededError') {
      showGlobalToast('Storage full - your draft could not be saved. Download your resume to avoid losing work.', 'warning');
    }
    const indicator = document.getElementById('rb-autosave-indicator');
    window.clearTimeout(autosaveSettleTimer);
    window.clearInterval(autosaveRefreshTimer);
    if (indicator) indicator.classList.remove('rb-autosave--visible', 'rb-autosave-indicator--persistent');
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
    if (typeof saved.summary === 'string') {
      state.summary = saved.summary;
    }
    if (Array.isArray(saved.experiences) && saved.experiences.length > 0) {
      state.experiences = saved.experiences.slice(0, 5).map(normalizeSavedExperience);
    }
    if (Array.isArray(saved.projects) && saved.projects.length > 0) {
      state.projects = saved.projects.slice(0, 5).map(normalizeSavedProject);
    }
    if (Array.isArray(saved.educations) && saved.educations.length > 0) {
      state.educations = saved.educations.slice(0, 3).map(normalizeSavedEducation);
    } else if (saved.education && typeof saved.education === 'object') {
      state.educations = [normalizeSavedEducation(saved.education)];
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
    state.template = normalizeResumeTemplate(saved.template);
    state.atsAnalysisResult = normalizeSavedAtsAnalysisResult(saved.atsAnalysisResult);
    state.generatedResume = typeof saved.generatedResume === 'string' ? saved.generatedResume : '';
    state.coverLetter = typeof saved.coverLetter === 'string' ? saved.coverLetter : '';
    state.coverLetterSettings = normalizeCoverLetterSettings(saved.coverLetterSettings);
    state.sectionsEnabled = normalizeSectionsEnabled(saved.sectionsEnabled);
    state.sectionOrder = normalizeSectionOrder(saved.sectionOrder);
    state.lastEditedAt = normalizeTimestamp(saved.lastEditedAt);
    state.suggestionsDismissed = Boolean(saved.suggestionsDismissed);

    return true;
  } catch (_) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
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

function showSaveIndicator(status, stateForTimestamp = resumeExportState) {
  const indicator = document.getElementById('rb-autosave-indicator');
  if (!indicator) return;
  window.clearTimeout(autosaveSettleTimer);
  window.clearInterval(autosaveRefreshTimer);
  indicator.setAttribute('data-status', status);
  indicator.classList.remove('rb-autosave-indicator--persistent');
  const labels = {
    saved: '\u2713 Saved',
    saving: 'Saving...',
    error: 'Save failed',
  };
  const timeStr = status === 'saved' ? formatLastEdited(stateForTimestamp?.lastEditedAt) : '';
  indicator.textContent = `${labels[status] || ''}${timeStr ? ` \u00B7 ${timeStr}` : ''}`;
  indicator.classList.add('rb-autosave--visible');
  if (status === 'saved') {
    autosaveRefreshTimer = window.setInterval(() => {
      if (indicator.getAttribute('data-status') !== 'saved') return;
      const refreshed = formatLastEdited(stateForTimestamp?.lastEditedAt);
      indicator.textContent = `\u2713 Saved${refreshed ? ` \u00B7 ${refreshed}` : ''}`;
    }, 30000);
    autosaveSettleTimer = window.setTimeout(() => {
      indicator.classList.add('rb-autosave-indicator--persistent');
    }, 2800);
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

function isResumeDividerLine(line) {
  const compact = String(line || '').trim().replace(/\s+/g, '');
  return compact.length >= 3
    && /^[-_=\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u2500\u2501\u2550]+$/.test(compact);
}

const RESUME_SECTION_TITLES = new Map([
  ['SUMMARY', 'PROFESSIONAL SUMMARY'],
  ['OBJECTIVE', 'PROFESSIONAL SUMMARY'],
  ['PROFILE', 'PROFESSIONAL SUMMARY'],
  ['PROFESSIONAL PROFILE', 'PROFESSIONAL SUMMARY'],
  ['PROFESSIONAL SUMMARY', 'PROFESSIONAL SUMMARY'],
  ['EXPERIENCE', 'WORK EXPERIENCE'],
  ['WORK EXPERIENCE', 'WORK EXPERIENCE'],
  ['PROFESSIONAL EXPERIENCE', 'WORK EXPERIENCE'],
  ['EMPLOYMENT HISTORY', 'WORK EXPERIENCE'],
  ['PROJECTS', 'PROJECTS'],
  ['ADDITIONAL PROJECTS', 'ADDITIONAL PROJECTS'],
  ['EDUCATION', 'EDUCATION'],
  ['RELEVANT COURSES', 'RELEVANT COURSES'],
  ['SKILLS', 'SKILLS'],
  ['TECHNICAL SKILLS', 'SKILLS'],
  ['CERTIFICATIONS', 'CERTIFICATIONS'],
  ['CERTIFICATES', 'CERTIFICATIONS'],
  ['LANGUAGES', 'LANGUAGES'],
  ['ADDITIONAL EXPERIENCE', 'ADDITIONAL EXPERIENCE'],
  ['PROFESSIONAL AFFILIATIONS', 'PROFESSIONAL AFFILIATIONS'],
  ['INTERESTS', 'INTERESTS'],
]);

function getResumeSectionTitle(line) {
  const normalized = String(line || '')
    .trim()
    .replace(/:$/, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
  return RESUME_SECTION_TITLES.get(normalized) || null;
}

function parseResumeText(resumeText) {
  const lines = resumeText.split('\n').map((line) => line.trimEnd());
  const sections = [];
  let currentSection = null;
  const headerLines = [];
  let headerParsed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    const sectionTitle = getResumeSectionTitle(trimmed);

    if (!headerParsed) {
      if (sectionTitle && i > 1) {
        headerParsed = true;
        currentSection = { title: sectionTitle, lines: [] };
        sections.push(currentSection);
      } else if (trimmed && !isResumeDividerLine(trimmed)) {
        headerLines.push(trimmed);
      }
      continue;
    }

    if (sectionTitle) {
      currentSection = { title: sectionTitle, lines: [] };
      sections.push(currentSection);
    } else if (currentSection && trimmed && !isResumeDividerLine(trimmed)) {
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

// Resume template system
function getResumeContactParts(state, fallbackContact = '') {
  const personal = state?.personal || {};
  const parts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.portfolio,
  ].map((value) => String(value || '').trim()).filter(Boolean);

  if (parts.length) return parts;
  return String(fallbackContact || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderContactParts(parts) {
  return parts
    .map((part) => `<span class="rb-resume-contact-item">${escapeHtml(part)}</span>`)
    .join('<span class="rb-resume-contact-sep" aria-hidden="true"></span>');
}

function syncTemplatePicker(template) {
  const root = resumeTemplateRoot || document;
  root.querySelectorAll('[data-resume-template]').forEach((button) => {
    const active = button.dataset.resumeTemplate === template;
    const wasActive = button.classList.contains('is-active');
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    if (active && !wasActive) {
      button.classList.add('rb-template-pop');
      window.setTimeout(() => button.classList.remove('rb-template-pop'), 220);
    }
  });
}

function applyTemplate(templateName, options = {}) {
  const template = normalizeResumeTemplate(templateName);
  const shouldSave = options.persist !== false;

  if (resumeTemplateState) {
    resumeTemplateState.template = template;
  }

  const root = resumeTemplateRoot || document;
  const doc = root.querySelector('#rb-preview-pane .rb-resume-doc') || document.querySelector('#rb-preview-pane .rb-resume-doc');
  if (doc) {
    Object.values(RESUME_TEMPLATE_CLASSES).forEach((className) => doc.classList.remove(className));
    doc.classList.add(RESUME_TEMPLATE_CLASSES[template]);
    if (options.animate !== false) {
      doc.classList.remove('rb-template-fade');
      void doc.offsetWidth;
      doc.classList.add('rb-template-fade');
      window.setTimeout(() => doc.classList.remove('rb-template-fade'), 280);
    }
  }

  syncTemplatePicker(template);

  if (shouldSave && typeof resumeTemplateSave === 'function') {
    resumeTemplateSave();
  }

  return template;
}

function normalizeGeneratedResumeIdentity(resumeText, state) {
  const { name, contact } = getCanonicalResumeHeader(state);
  if (!name || !resumeText) return resumeText;

  const lines = String(resumeText).split('\n');
  const isDivider = isResumeDividerLine;
  const isKnownSectionTitle = (line) => Boolean(getResumeSectionTitle(line));
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

    if (secondContentIndex === -1 || isKnownSectionTitle(lines[secondContentIndex])) {
      lines.splice(firstContentIndex + 1, 0, contact);
    } else {
      lines[secondContentIndex] = contact;
    }
  }

  return lines.join('\n');
}

function getRenderableResumeSections(sections, state) {
  const summary = String(state?.summary || '').trim();
  const preparedSections = (sections || []).filter((section) => shouldRenderResumeSection(section, state));
  const parsedSummarySections = preparedSections.filter((section) => isSummarySectionTitle(section.title));
  const nonSummarySections = preparedSections.filter((section) => !isSummarySectionTitle(section.title));
  const orderedSections = orderResumeSections(nonSummarySections, state);

  if (summary) {
    return [
      { title: 'PROFESSIONAL SUMMARY', lines: [summary] },
      ...orderedSections,
    ];
  }

  return [
    ...parsedSummarySections,
    ...orderedSections,
  ];
}

function isSummarySectionTitle(title) {
  return /^(SUMMARY|OBJECTIVE|PROFILE|PROFESSIONAL SUMMARY)$/i.test(String(title || '').trim());
}

function getResumeSectionKey(title) {
  return SECTION_TITLE_TO_KEY[String(title || '').trim().toUpperCase()] || null;
}

function isBracketOnlySection(section) {
  const content = (section?.lines || []).join('\n').trim();
  return !content || /^\[[\s\S]*\]$/.test(content);
}

function shouldRenderResumeSection(section, state) {
  const key = getResumeSectionKey(section?.title);
  if (key === 'projects') {
    return isSectionEnabled(state, 'projects') && !isBracketOnlySection(section);
  }
  if (key === 'certifications') {
    return isSectionEnabled(state, 'certifications') && !isBracketOnlySection(section);
  }
  return true;
}

function orderResumeSections(sections, state) {
  const order = normalizeSectionOrder(state?.sectionOrder);
  const indexed = new Map();
  const unkeyed = [];
  sections.forEach((section) => {
    const key = getResumeSectionKey(section?.title);
    if (!key) {
      unkeyed.push(section);
      return;
    }
    if (!indexed.has(key)) indexed.set(key, []);
    indexed.get(key).push(section);
  });
  return [
    ...order.flatMap((key) => indexed.get(key) || []),
    ...unkeyed,
  ];
}

function normalizeResumeBulletText(line) {
  return String(line || '').trim().replace(/^(?:[\u2022-]\s*)+/, '').trim();
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
    applyTemplate(resumeTemplateState?.template || resumeExportState?.template || 'classic', { persist: false });
    updateWordCountDisplay(resumeExportState);
    return;
  }

  const { name, contact } = getCanonicalResumeHeader(resumeExportState);
  const parsed = parseResumeText(resumeText);
  const displayName = name || parsed.name;
  const contactParts = getResumeContactParts(resumeExportState, contact || parsed.contact);
  const sections = getRenderableResumeSections(parsed.sections, resumeExportState);
  let html = '<div class="rb-resume-doc">';

  html += `
    <div class="rb-resume-header">
      <h1 class="rb-resume-name">${escapeHtml(displayName)}</h1>
      <p class="rb-resume-contact">${renderContactParts(contactParts)}</p>
    </div>`;

  for (const section of sections) {
    html += `
      <div class="rb-resume-section">
        <h2 class="rb-resume-section-title">${escapeHtml(section.title)}</h2>
        <div class="rb-resume-section-divider"></div>
        <div class="rb-resume-section-body">`;

    for (const line of section.lines) {
      if (isResumeDividerLine(line)) continue;
      if (line.startsWith('\u2022') || line.startsWith('-')) {
        const text = normalizeResumeBulletText(line);
        html += `<p class="rb-resume-bullet"><span class="rb-resume-bullet-marker" aria-hidden="true"></span><span>${escapeHtml(text)}</span></p>`;
      } else {
        html += `<p class="rb-resume-line">${escapeHtml(line)}</p>`;
      }
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
  applyTemplate(resumeTemplateState?.template || resumeExportState?.template || 'classic', { persist: false });
  updateWordCountDisplay(resumeExportState);
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
  const docxBtn = document.getElementById('rb-btn-download-docx');
  const printBtn = document.getElementById('rb-btn-print');
  const shareHint = document.getElementById('rb-share-hint');
  if (exportBar) {
    exportBar.removeAttribute('hidden');
  }
  if (shareHint) shareHint.hidden = Boolean(isReady);
  if (pdfBtn) {
    pdfBtn.disabled = !isReady;
    pdfBtn.setAttribute('aria-disabled', String(!isReady));
  }
  if (docxBtn) {
    docxBtn.disabled = !isReady;
    docxBtn.setAttribute('aria-disabled', String(!isReady));
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

function detectPlaceholders(text) {
  const matches = String(text || '').match(/\[.*?\]/g) || [];
  return [...new Set(matches.map((item) => item.trim()).filter(Boolean))];
}

function getResumeWordCount(state = resumeExportState) {
  const text = String(state?.generatedResume || '').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function getWordCountMeta(count) {
  if (count <= 0) return { label: '', color: '' };
  if (count < 200) return { label: 'Too short for most roles', color: 'var(--rb-warning, #f97316)' };
  if (count < 350) return { label: 'A bit short - add more detail', color: '#eab308' };
  if (count <= 700) return { label: 'Ideal length \u2713', color: 'var(--rb-success, #22c55e)' };
  if (count <= 900) return { label: 'Slightly long - consider trimming', color: '#eab308' };
  return { label: 'Too long - ATS may truncate', color: 'var(--rb-error, #ef4444)' };
}

function updateWordCountDisplay(state = resumeExportState) {
  const wrap = document.getElementById('rb-word-count');
  const number = document.getElementById('rb-word-count-number');
  const label = document.getElementById('rb-word-count-label');
  if (!wrap || !number || !label) return;
  const count = getResumeWordCount(state);
  wrap.hidden = count === 0;
  number.textContent = String(count);
  const meta = getWordCountMeta(count);
  label.textContent = meta.label;
  label.style.color = meta.color;
}

function calculateCompletionPercentage(state = resumeExportState) {
  if (!state) return 0;
  let score = 0;
  const personal = state.personal || {};
  if (String(personal.name || '').trim()) score += 8;
  if (String(personal.email || '').trim()) score += 8;
  if (String(personal.phone || '').trim()) score += 5;
  if (String(personal.location || '').trim()) score += 4;
  if (String(personal.linkedin || '').trim()) score += 3;
  if (String(state.targetRole || '').trim()) score += 5;

  const summaryLength = String(state.summary || '').trim().length;
  if (summaryLength >= 50) score += 10;
  else if (summaryLength > 0) score += 5;

  const experiences = state.experiences || [];
  const titledExperiences = experiences.filter((exp) => String(exp?.title || exp?.jobTitle || '').trim());
  const experiencesWithAchievements = titledExperiences.filter((exp) => [
    exp?.achievement1,
    exp?.achievement2,
    exp?.achievement3,
  ].some((value) => String(value || '').trim()));
  if (titledExperiences.length >= 1) score += 10;
  if (experiencesWithAchievements.length >= 1) score += 8;
  if (experiencesWithAchievements.length >= 2) score += 5;

  if ((state.educations || []).some((edu) => (
    String(edu?.degree || '').trim() && String(edu?.institution || '').trim()
  ))) score += 8;

  const skillCount = parseCommaList(state.skills).length;
  if (skillCount >= 5) score += 8;
  else if (skillCount >= 1) score += 4;

  if (String(state.generatedResume || '').trim()) score += 10;
  if ((state.certifications || []).some(hasFilledCertification) || (state.projects || []).some(hasFilledProject)) score += 4;

  return Math.max(0, Math.min(100, Math.round((score / 96) * 100)));
}

function updateCompletionBar(state = resumeExportState) {
  const fill = document.getElementById('rb-completion-fill');
  const label = document.getElementById('rb-completion-label');
  if (!fill || !label) return;
  const percent = calculateCompletionPercentage(state);
  fill.style.width = `${percent}%`;
  fill.setAttribute('aria-valuenow', String(percent));
  fill.classList.toggle('rb-completion--low', percent < 50);
  fill.classList.toggle('rb-completion--mid', percent >= 50 && percent < 80);
  fill.classList.toggle('rb-completion--high', percent >= 80);

  let message = `${percent}% complete - let's get started!`;
  if (percent === 100) message = 'Complete \u2713 - ready to generate!';
  else if (percent >= 90) message = `${percent}% complete - just a few more touches`;
  else if (percent >= 75) message = `${percent}% complete - almost there`;
  else if (percent >= 50) message = `${percent}% complete - looking good`;
  else if (percent >= 20) message = `${percent}% complete - keep going`;
  label.textContent = message;
}

function normalizeResumeTextForCopy(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^\s*[-*\u2022]\s+/gm, '\u2022 ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatResumeBodyForCopy(state) {
  const parsed = parseResumeText(state.generatedResume || '');
  const sections = getRenderableResumeSections(parsed.sections, state);
  if (!sections.length) return normalizeResumeTextForCopy(state.generatedResume);
  return sections.map((section) => {
    const header = String(section.title || '').toUpperCase();
    const lines = section.lines
      .filter((line) => !isResumeDividerLine(line))
      .map(normalizeResumeTextForCopy)
      .filter(Boolean)
      .join('\n');
    return `${header}\n${'\u2500'.repeat(20)}\n${lines}`;
  }).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function buildFormattedResumeText(state) {
  const placeholders = detectPlaceholders(state.generatedResume);
  const parts = [];
  if (placeholders.length) {
    parts.push(`\u26A0 REVIEW BEFORE SENDING: This resume contains ${placeholders.length} unfilled placeholder(s). Search for [ to find and replace them.`);
    parts.push('');
  }
  const name = String(state.personal?.name || '').trim();
  if (name) parts.push(name.toUpperCase());
  const contactLine = [
    state.personal?.email,
    state.personal?.phone,
    state.personal?.location,
    state.personal?.linkedin,
    state.personal?.portfolio,
  ].map((item) => String(item || '').trim()).filter(Boolean).join(' | ');
  if (contactLine) parts.push(contactLine);
  parts.push('', '\u2500'.repeat(45));
  parts.push(formatResumeBodyForCopy(state));
  parts.push('', '\u2500'.repeat(45));
  parts.push('Generated with Tooliest AI Resume Builder');
  parts.push('tooliest.com/resume-builder');
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function confirmResumePlaceholdersBeforeExport() {
  const placeholders = detectPlaceholders(resumeExportState?.generatedResume || '');
  if (!placeholders.length) return true;
  const list = placeholders.slice(0, 8).join('\n');
  return window.confirm(`Your resume contains ${placeholders.length} unfilled placeholder(s):\n${list}\n\nThese will appear in your exported file. Review and fill them in before downloading?\n\nClick OK to continue anyway, or Cancel to go back and fix.`);
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

    .rb-resume-contact-sep::before {
      content: " | ";
    }

    .rb-tpl-modern .rb-resume-contact-sep::before {
      content: " \\00B7 ";
    }

    .rb-resume-bullet-marker::before {
      content: "\\2022\\00A0";
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

    .rb-resume-doc.rb-tpl-modern {
      padding: 0.65in 0.72in;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 10pt;
      line-height: 1.34;
      color: #111827;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-header {
      text-align: left;
      margin-bottom: 0.24in;
      padding-bottom: 0.1in;
      border-bottom: 2pt solid #3b4f6b;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-name {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 20pt;
      line-height: 1.1;
      letter-spacing: -0.01em;
      text-transform: none;
      color: #111827;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-contact {
      text-align: left;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 9pt;
      color: #374151;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-contact-sep::before {
      content: " \\00B7 ";
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-section {
      margin-bottom: 0.16in;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-section-title {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 10pt;
      letter-spacing: 0.055em;
      color: #24364f;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-section-divider {
      width: 1.1in;
      border-top: 2pt solid #3b4f6b;
      margin-bottom: 0.055in;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-line,
    .rb-resume-doc.rb-tpl-modern .rb-resume-bullet {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 10pt;
      line-height: 1.34;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-bullet {
      margin-left: 0.12in;
      padding-left: 0.12in;
      text-indent: -0.12in;
    }

    .rb-resume-doc.rb-tpl-modern .rb-resume-bullet-marker::before {
      content: "\\2013\\00A0";
    }

    .rb-resume-doc.rb-tpl-compact {
      padding: 0.55in 0.62in;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 9.5pt;
      line-height: 1.23;
      color: #111111;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-header {
      text-align: left;
      margin-bottom: 0.18in;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-name {
      font-size: 15pt;
      line-height: 1.1;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-contact {
      text-align: left;
      font-size: 8.5pt;
      line-height: 1.2;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-section {
      margin-bottom: 0.105in;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-section-title {
      font-size: 9.5pt;
      letter-spacing: 0.055em;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-section-divider {
      border-top: 0.75pt solid #333333;
      margin-bottom: 0.035in;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-line,
    .rb-resume-doc.rb-tpl-compact .rb-resume-bullet {
      font-size: 9.5pt;
      line-height: 1.23;
      margin-bottom: 1pt;
    }

    .rb-resume-doc.rb-tpl-compact .rb-resume-bullet {
      margin-left: 0.11in;
      padding-left: 0.11in;
      text-indent: -0.11in;
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

  const templateName = normalizeResumeTemplate(resumeExportState?.template);
  const fileBaseName = `${getResumeFileBaseName()}_resume_${templateName}`;
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
  if (!confirmResumePlaceholdersBeforeExport()) return;
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
  } catch (error) {
    console.error('[PDF Export]', error);
    showExportToast('PDF export failed. Try the Print option or check your browser pop-up settings.', 'error');
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
  if (!confirmResumePlaceholdersBeforeExport()) return;
  openResumePrintDialog('print');
}

// Resume Import: browser-only file text extraction
function loadScriptFromUrls(urls, isReady, label) {
  if (isReady()) return Promise.resolve();

  let chain = Promise.reject(new Error(`${label} loader start`));
  urls.forEach((url) => {
    chain = chain.catch(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (isReady()) {
          resolve();
          return;
        }
        script.remove();
        reject(new Error(`${label} global unavailable after load`));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error(`${label} CDN load failed: ${url}`));
      };
      document.head.appendChild(script);
    }));
  });

  return chain.catch((error) => {
    showGlobalToast(`${label} failed to load. Check your internet connection - this feature requires a CDN library.`, 'error');
    throw error || new Error(`${label} CDN load failed`);
  });
}

async function loadMammoth() {
  if (mammothLoaded || window.mammoth?.extractRawText) {
    mammothLoaded = true;
    return;
  }
  try {
    await loadScriptFromUrls(MAMMOTH_CDN_URLS, () => Boolean(window.mammoth?.extractRawText), 'mammoth.js');
    mammothLoaded = true;
  } catch (error) {
    mammothLoaded = false;
    throw error;
  }
}

async function loadPdfJs() {
  if (pdfJsLoaded || window.pdfjsLib?.getDocument) {
    pdfJsLoaded = true;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return;
  }
  try {
    await loadScriptFromUrls([PDFJS_CDN_URL], () => Boolean(window.pdfjsLib?.getDocument), 'PDF.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    pdfJsLoaded = true;
  } catch (error) {
    pdfJsLoaded = false;
    throw error;
  }
}

async function loadLzString() {
  if (lzStringLoaded || window.LZString?.compressToEncodedURIComponent) {
    lzStringLoaded = true;
    return;
  }
  try {
    await loadScriptFromUrls(
      LZ_STRING_CDN_URLS,
      () => Boolean(window.LZString?.compressToEncodedURIComponent && window.LZString?.decompressFromEncodedURIComponent),
      'lz-string',
    );
    lzStringLoaded = true;
  } catch (error) {
    lzStringLoaded = false;
    throw error;
  }
}

function buildShareableState(state) {
  const personal = state.personal || {};
  return {
    v: 2,
    p: {
      n: personal.name || '',
      e: personal.email || '',
      ph: personal.phone || '',
      li: personal.linkedin || '',
      lo: personal.location || '',
      po: personal.portfolio || '',
    },
    tr: state.targetRole || '',
    su: state.summary || '',
    ex: (state.experiences || []).map((exp) => ({
      t: exp.title || exp.jobTitle || '',
      c: exp.company || '',
      d: exp.duration || exp.dates || '',
      a1: exp.achievement1 || '',
      a2: exp.achievement2 || '',
      a3: exp.achievement3 || '',
    })),
    ed: (state.educations || []).map((edu) => ({
      dg: edu.degree || '',
      i: edu.institution || '',
      y: edu.year || '',
      g: edu.gpa || '',
      co: edu.courses || '',
    })),
    sk: state.skills || '',
    ce: Array.isArray(state.certifications) ? [...state.certifications] : [],
    pr: (state.projects || []).map((project) => ({
      n: project.name || '',
      l: project.link || '',
      t: project.technologies || '',
      d: project.details || project.description || '',
    })),
    tm: normalizeResumeTemplate(state.template),
    se: normalizeSectionsEnabled(state.sectionsEnabled),
    so: normalizeSectionOrder(state.sectionOrder),
    gr: state.generatedResume || '',
  };
}

function applyShareableState(shared, state) {
  if (!shared || typeof shared !== 'object' || !shared.v || !shared.p || typeof shared.p !== 'object') {
    return false;
  }
  state.personal = {
    name: String(shared.p.n || ''),
    email: String(shared.p.e || ''),
    phone: String(shared.p.ph || ''),
    linkedin: String(shared.p.li || ''),
    location: String(shared.p.lo || ''),
    portfolio: String(shared.p.po || ''),
  };
  state.targetRole = String(shared.tr || '');
  state.summary = String(shared.su || '');
  state.experiences = Array.isArray(shared.ex) && shared.ex.length
    ? shared.ex.slice(0, 5).map((exp) => normalizeSavedExperience({
      title: exp?.t,
      company: exp?.c,
      duration: exp?.d,
      achievement1: exp?.a1,
      achievement2: exp?.a2,
      achievement3: exp?.a3,
    }))
    : [createEmptyExperience()];
  state.educations = Array.isArray(shared.ed) && shared.ed.length
    ? shared.ed.slice(0, 3).map((edu) => normalizeSavedEducation({
      degree: edu?.dg,
      institution: edu?.i,
      year: edu?.y,
      gpa: edu?.g,
      courses: edu?.co,
    }))
    : [createEmptyEducation()];
  state.skills = String(shared.sk || '');
  state.certifications = Array.isArray(shared.ce) && shared.ce.length
    ? shared.ce.slice(0, 5).map((item) => String(item || ''))
    : [createEmptyCertification()];
  state.projects = Array.isArray(shared.pr) && shared.pr.length
    ? shared.pr.slice(0, 5).map((project) => normalizeSavedProject({
      name: project?.n,
      link: project?.l,
      technologies: project?.t,
      details: project?.d,
    }))
    : [createEmptyProject()];
  state.template = normalizeResumeTemplate(shared.tm);
  state.sectionsEnabled = normalizeSectionsEnabled(shared.se);
  state.sectionOrder = normalizeSectionOrder(shared.so);
  state.generatedResume = String(shared.gr || '');
  state.atsAnalysisResult = null;
  state.lastEditedAt = null;
  state.suggestionsDismissed = false;
  return true;
}

function hasStoredDraft() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch (_) {
    return false;
  }
}

async function loadShareableStateFromHash(state) {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#r=')) return { loaded: false, hadStoredDraft: false };
  const hadStoredDraft = hasStoredDraft();
  try {
    await loadLzString();
    const compressed = hash.slice(3);
    const json = window.LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return { loaded: false, hadStoredDraft };
    const parsed = JSON.parse(json);
    if (!applyShareableState(parsed, state)) return { loaded: false, hadStoredDraft };
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    return { loaded: true, hadStoredDraft };
  } catch (error) {
    console.warn('[Resume Builder] Shared resume link could not be loaded:', error?.message || 'invalid hash');
    return { loaded: false, hadStoredDraft };
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file. Please try again.'));
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read this text file. Please try again.'));
    reader.readAsText(file);
  });
}

async function extractTextFromDocx(file) {
  try {
    await loadMammoth();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return String(result?.value || '');
  } catch (error) {
    throw new Error(error?.message || 'Could not extract text from this DOCX file.');
  }
}

async function extractTextFromPdf(file) {
  try {
    await loadPdfJs();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => String(item.str || '')).join(' '));
    }
    return pages.join('\n');
  } catch (error) {
    throw new Error(error?.message || 'Could not extract text from this PDF file.');
  }
}

function cleanExtractedResumeText(text) {
  return String(text || '')
    .replace(/^\uFEFF/, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function validateAndTrimExtractedText(text) {
  const cleaned = cleanExtractedResumeText(text);
  if (cleaned.length < 100) {
    throw new Error('The file may be image-based or scanned, so text extraction failed. Try a text-based PDF/DOCX or start by filling the form manually.');
  }
  return cleaned.length > RESUME_IMPORT_MAX_CHARS
    ? cleaned.slice(0, RESUME_IMPORT_MAX_CHARS)
    : cleaned;
}

async function extractTextFromFile(file) {
  try {
    const name = String(file?.name || '').toLowerCase();
    const type = String(file?.type || '').toLowerCase();
    let rawText = '';

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
      rawText = await extractTextFromDocx(file);
    } else if (type === 'application/pdf' || name.endsWith('.pdf')) {
      rawText = await extractTextFromPdf(file);
    } else if (type === 'text/plain' || name.endsWith('.txt')) {
      rawText = await readFileAsText(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }

    return validateAndTrimExtractedText(rawText);
  } catch (error) {
    const message = getErrorMessage(error);
    if (/unsupported file type/i.test(message)) throw error;
    throw new Error(message || 'This file could not be read. Try a different PDF, DOCX, or TXT file.');
  }
}

// DOCX Export
async function loadDocx() {
  if (window.docx) {
    docxLoaded = true;
    return;
  }

  let lastError = null;
  for (const url of DOCX_CDN_URLS) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (window.docx?.Document && window.docx?.Packer) {
            resolve();
            return;
          }
          script.remove();
          reject(new Error('docx global unavailable after load'));
        };
        script.onerror = () => {
          script.remove();
          reject(new Error(`docx CDN load failed: ${url}`));
        };
        document.head.appendChild(script);
      });
      docxLoaded = true;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  docxLoaded = false;
  showGlobalToast('DOCX library failed to load. Check your internet connection - this feature requires a CDN library.', 'error');
  throw lastError || new Error('docx CDN load failed');
}

function getDocxFileName() {
  const template = normalizeResumeTemplate(resumeExportState?.template);
  return `${getResumeFileBaseName()}_resume_${template}.docx`;
}

function getFilledEducations(state) {
  return (state.educations || []).filter((education) => [
    education.degree,
    education.institution,
    education.year,
    education.gpa,
    education.courses,
  ].some((value) => String(value || '').trim()));
}

function getFilledProjects(state) {
  return (state.projects || []).filter((project) => [
    project.name,
    project.link,
    project.technologies,
    project.description,
  ].some((value) => String(value || '').trim()));
}

function getDocxTemplateProfile(templateName) {
  const template = normalizeResumeTemplate(templateName);
  const profiles = {
    classic: {
      template,
      font: 'Times New Roman',
      textColor: '111111',
      mutedColor: '333333',
      accentColor: '111111',
      nameTransform: (value) => value.toUpperCase(),
      nameSize: 36,
      nameAlign: 'center',
      nameAfter: 80,
      contactSize: 19,
      contactAlign: 'center',
      contactAfter: 260,
      contactSeparator: ' | ',
      sectionSize: 22,
      sectionBefore: 180,
      sectionAfter: 120,
      sectionBorderSize: 6,
      bodySize: 21,
      bodyAfter: 100,
      lineSpacing: 276,
      bulletPrefix: '\u2022 ',
      bulletIndent: { left: 432, hanging: 216 },
      margins: { top: 1080, right: 1224, bottom: 1080, left: 1224 },
    },
    modern: {
      template,
      font: 'Calibri',
      textColor: '111827',
      mutedColor: '374151',
      accentColor: '3B4F6B',
      nameTransform: (value) => value,
      nameSize: 40,
      nameAlign: 'left',
      nameAfter: 60,
      contactSize: 18,
      contactAlign: 'left',
      contactAfter: 260,
      contactSeparator: ' \u00B7 ',
      contactBorder: true,
      sectionSize: 20,
      sectionBefore: 150,
      sectionAfter: 90,
      sectionBorderSize: 8,
      bodySize: 20,
      bodyAfter: 80,
      lineSpacing: 258,
      bulletPrefix: '- ',
      bulletIndent: { left: 360, hanging: 180 },
      margins: { top: 936, right: 1037, bottom: 936, left: 1037 },
    },
    compact: {
      template,
      font: 'Georgia',
      textColor: '111111',
      mutedColor: '2F2F2F',
      accentColor: '333333',
      nameTransform: (value) => value.toUpperCase(),
      nameSize: 30,
      nameAlign: 'left',
      nameAfter: 50,
      contactSize: 17,
      contactAlign: 'left',
      contactAfter: 170,
      contactSeparator: ' | ',
      sectionSize: 19,
      sectionBefore: 105,
      sectionAfter: 65,
      sectionBorderSize: 4,
      bodySize: 19,
      bodyAfter: 55,
      lineSpacing: 235,
      bulletPrefix: '\u2022 ',
      bulletIndent: { left: 316, hanging: 158 },
      margins: { top: 792, right: 893, bottom: 792, left: 893 },
    },
  };

  return profiles[template];
}

function createDocxParagraph(text, options = {}) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  const {
    bold = false,
    italic = false,
    size = 22,
    align = 'left',
    after = 120,
    before = 0,
    indent = null,
    font = 'Calibri',
    color = '111111',
    border = null,
    line = 276,
  } = options;
  const alignment = align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
  const paragraphOptions = {
    alignment,
    spacing: { before, after, line },
    indent,
    children: [
      new TextRun({
        text: String(text || ''),
        font,
        size,
        color,
        bold,
        italics: italic,
      }),
    ],
  };
  if (border) {
    paragraphOptions.border = border;
  }
  return new Paragraph(paragraphOptions);
}

function createDocxSectionHeader(title, profile) {
  const { Paragraph, TextRun, BorderStyle } = window.docx;
  return new Paragraph({
    spacing: { before: profile.sectionBefore, after: profile.sectionAfter, line: profile.lineSpacing },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: profile.sectionBorderSize,
        color: profile.accentColor,
        space: 1,
      },
    },
    children: [
      new TextRun({
        text: String(title || '').toUpperCase(),
        font: profile.font,
        size: profile.sectionSize,
        color: profile.accentColor,
        bold: true,
      }),
    ],
  });
}

function createDocxBullet(text, profile) {
  return createDocxParagraph(`${profile.bulletPrefix}${normalizeResumeBulletText(text)}`, {
    size: profile.bodySize,
    font: profile.font,
    color: profile.textColor,
    after: profile.bodyAfter,
    line: profile.lineSpacing,
    indent: profile.bulletIndent,
  });
}

function createDocxMixedLine(parts) {
  const { Paragraph, TextRun } = window.docx;
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: parts.filter((part) => String(part.text || '').trim()).map((part) => new TextRun({
      text: String(part.text || ''),
      font: 'Calibri',
      size: part.size || 22,
      bold: Boolean(part.bold),
      italics: Boolean(part.italic),
    })),
  });
}

function buildDocxChildren(state, profile) {
  const { BorderStyle } = window.docx;
  const children = [];
  const { name, contact } = getCanonicalResumeHeader(state);
  children.push(createDocxParagraph(profile.nameTransform(name || 'Your Name'), {
    bold: true,
    size: profile.nameSize,
    align: profile.nameAlign,
    after: profile.nameAfter,
    font: profile.font,
    color: profile.textColor,
    line: profile.lineSpacing,
  }));
  if (contact) {
    const contactText = getResumeContactParts(state, contact).join(profile.contactSeparator);
    children.push(createDocxParagraph(contactText, {
      size: profile.contactSize,
      align: profile.contactAlign,
      after: profile.contactAfter,
      font: profile.font,
      color: profile.mutedColor,
      line: profile.lineSpacing,
      border: profile.contactBorder ? {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 8,
          color: profile.accentColor,
          space: 8,
        },
      } : null,
    }));
  }

  const parsed = parseResumeText(state.generatedResume || '');
  const sections = getRenderableResumeSections(parsed.sections, state);
  sections.forEach((section) => {
    const lines = (section.lines || []).filter((line) => String(line || '').trim() && !isResumeDividerLine(line));
    if (!lines.length) return;
    children.push(createDocxSectionHeader(section.title, profile));
    lines.forEach((line) => {
      const trimmed = String(line || '').trim();
      if (trimmed.startsWith('\u2022') || trimmed.startsWith('-')) {
        children.push(createDocxBullet(trimmed, profile));
        return;
      }
      children.push(createDocxParagraph(trimmed, {
        size: profile.bodySize,
        font: profile.font,
        color: profile.textColor,
        after: profile.bodyAfter,
        line: profile.lineSpacing,
      }));
    });
  });

  return children;
}

async function downloadResumeDOCX() {
  const state = resumeExportState;
  const btn = document.getElementById('rb-btn-download-docx');
  if (!state?.generatedResume) {
    showExportToast('Generate a resume before downloading the DOCX.', 'error');
    return;
  }
  if (!confirmResumePlaceholdersBeforeExport()) return;

  if (btn) {
    btn.classList.add('rb-export-btn--loading');
    btn.setAttribute('aria-label', 'Generating DOCX...');
  }

  try {
    await loadDocx();
    if (!window.docx) throw new Error('docx global unavailable');
    const { Document, Packer } = window.docx;
    const profile = getDocxTemplateProfile(state.template);
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: profile.margins,
          },
        },
        children: buildDocxChildren(state, profile),
      }],
    });
    const blob = await Packer.toBlob(doc);
    downloadBlob(getDocxFileName(), blob);
    showExportToast('DOCX downloaded successfully.', 'success');
  } catch (error) {
    console.error('[DOCX Export]', error);
    showExportToast('DOCX export failed. Try Save as PDF instead, or check your internet connection.', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('rb-export-btn--loading');
      btn.setAttribute('aria-label', 'Download resume as DOCX');
    }
  }
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

function createEmptyEducation() {
  return {
    degree: '',
    institution: '',
    year: '',
    gpa: '',
    courses: '',
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
    `Professional Summary: ${state.summary || ''}`,
    '',
    `Requested section order after Professional Summary: ${normalizeSectionOrder(state.sectionOrder).map((key) => SECTION_LABELS[key]).join(' -> ')}`,
    '',
  ];

  const sectionWriters = {
    experience() {
      parts.push('WORK EXPERIENCE:');
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
    },
    projects() {
      if (!isSectionEnabled(state, 'projects')) return;
      const filledProjects = (state.projects || []).filter(hasFilledProject);
      if (!filledProjects.length) return;
      parts.push('PROJECTS:');
      filledProjects.forEach((project, index) => {
        parts.push(`Project ${index + 1}:`);
        parts.push(`Name: ${project.name || ''}`);
        parts.push(`Link: ${project.link || ''}`);
        parts.push(`Technologies: ${project.technologies || ''}`);
        parts.push(`Details: ${project.description || ''}`);
        parts.push('');
      });
    },
    education() {
      parts.push('EDUCATION:');
      (state.educations || []).forEach((education, index) => {
        parts.push(`Education ${index + 1}:`);
        parts.push(`Degree: ${education.degree || ''}`);
        parts.push(`Institution: ${education.institution || ''}`);
        parts.push(`Year: ${education.year || ''}`);
        parts.push(`GPA: ${education.gpa || ''}`);
        parts.push(`Relevant Courses: ${parseCommaList(education.courses).join(', ')}`);
        parts.push('');
      });
    },
    skills() {
      parts.push(`Skills: ${parseCommaList(state.skills).join(', ')}`);
    },
    certifications() {
      if (!isSectionEnabled(state, 'certifications')) return;
      const filledCertifications = (state.certifications || []).filter(hasFilledCertification);
      if (!filledCertifications.length) return;
      parts.push(`Certifications: ${filledCertifications.join(', ')}`);
    },
  };

  normalizeSectionOrder(state.sectionOrder).forEach((key) => {
    sectionWriters[key]?.();
  });
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

  const activate = (target, { animate = true } = {}) => {
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
      if (active && animate) {
        panel.classList.add('rb-panel-entering');
        window.setTimeout(() => panel.classList.remove('rb-panel-entering'), 240);
      }
    });
    root.dispatchEvent(new CustomEvent('resume-tab-change', { detail: { target } }));
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
  activate(initialTab, { animate: false });
}

export async function initResumeBuilderTool(container) {
  try {
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
  const docxButton = qs(root, '#rb-btn-download-docx');
  const printButton = qs(root, '#rb-btn-print');
  const shareLinkButton = qs(root, '#rb-btn-share-link');
  const shareFallback = qs(root, '#rb-share-fallback');
  const shareFallbackUrl = qs(root, '#rb-share-fallback-url');
  const shareHint = qs(root, '#rb-share-hint');
  const wordCountWrap = qs(root, '#rb-word-count');
  const completionFill = qs(root, '#rb-completion-fill');
  const clearDraftButton = qs(root, '#rb-btn-clear-draft');
  const improveSummaryButton = qs(root, '#rb-btn-improve-summary');
  const improveSkillsButton = qs(root, '#rb-btn-improve-skills');
  const experienceContainer = qs(root, '#rb-experience-list');
  const creditsBar = qs(root, '#rb-credits-bar');
  const creditsRemaining = qs(root, '#rb-credits-remaining');
  const creditsLabel = qs(root, '.rb-credits-bar__label');
  const quotaExhaustedBanner = qs(root, '#rb-quota-exhausted-banner');
  const quotaCountdown = qs(root, '#rb-quota-countdown');
  const scoreCompact = qs(root, '#rb-live-score-compact');
  const scoreCompactNumber = qs(root, '#rb-score-compact-number');
  const scoreCompactLabel = qs(root, '#rb-score-compact-label');
  const scoreCompactTip = qs(root, '#rb-score-compact-tip');
  const scorePanelFull = qs(root, '#rb-score-panel-full');
  const scoreGaugeValue = qs(root, '#rb-score-gauge-value');
  const scoreFullNumber = qs(root, '#rb-score-full-number');
  const scoreFullLabel = qs(root, '#rb-score-full-label');
  const scoreFullDescription = qs(root, '#rb-score-full-description');
  const scoreAiBadge = qs(root, '#rb-score-ai-badge');
  const scoreBreakdown = qs(root, '#rb-score-breakdown');
  const scoreTips = qs(root, '#rb-score-tips');
  const scoreKeywords = qs(root, '#rb-score-keywords');
  const scoreKeywordsFound = qs(root, '#rb-score-keywords-found');
  const scoreKeywordsMissing = qs(root, '#rb-score-keywords-missing');
  const scoreAnalyzeToggle = qs(root, '#rb-score-analyze-toggle');
  const scoreJdForm = qs(root, '#rb-score-jd-form');
  const scoreJdInput = qs(root, '#rb-score-jd');
  const scoreRunAiButton = qs(root, '#rb-score-run-ai');
  const coverLetterQuotaMount = qs(root, '[data-resume-quota="shared-cover-letter"]');
  const coverLetterCreditsBar = qs(root, '#cl-credits-bar');
  const coverLetterCreditsRemaining = qs(root, '#cl-credits-remaining');
  const coverLetterCreditsLabel = qs(root, '.cl-credits-bar__label');
  const coverLetterNotice = qs(root, '#cl-resume-data-notice');
  const coverLetterPreviewPane = qs(root, '#cl-preview-pane');
  const coverLetterGenerateButton = qs(root, '#cl-btn-generate');
  const coverLetterCopyButton = qs(root, '#cl-btn-copy');
  const coverLetterPdfButton = qs(root, '#cl-btn-pdf');
  const coverLetterDocxButton = qs(root, '#cl-btn-docx');
  const coverLetterRegenerateButton = qs(root, '#cl-btn-regenerate');
  const coverLetterJdCounter = qs(root, '#cl-jd-count');
  const coverLetterInputs = {
    company: qs(root, '#cl-company'),
    role: qs(root, '#cl-role'),
    hiringManager: qs(root, '#cl-manager'),
    companyReason: qs(root, '#cl-reason'),
    jobDescription: qs(root, '#cl-jd'),
  };
  const importCard = qs(root, '#rb-import-card');
  const importCollapsed = qs(root, '#rb-import-collapsed');
  const importExpanded = qs(root, '#rb-import-expanded');
  const importToggleButton = qs(root, '#rb-import-toggle');
  const importCancelButton = qs(root, '#rb-import-cancel');
  const importDropzone = qs(root, '#rb-import-dropzone');
  const importBrowseButton = qs(root, '#rb-import-browse');
  const importFileInput = qs(root, '#rb-import-file');
  const importProcessing = qs(root, '#rb-import-processing');
  const importFileName = qs(root, '#rb-import-file-name');
  const importSteps = qs(root, '#rb-import-steps');
  const importError = qs(root, '#rb-import-error');
  const importSuccess = qs(root, '#rb-import-success');
  const builderPanel = qs(root, '#resume-panel-builder');
  const mobileNav = qs(root, '#rb-mobile-nav');
  const mobileNavButtons = Array.from(root.querySelectorAll('[data-mobile-nav]'));
  const mobilePreviewView = qs(root, '#rb-mobile-preview-view');
  const mobileScoreView = qs(root, '#rb-mobile-score-view');
  const generateReadiness = qs(root, '#rb-generate-readiness');
  const stepPanelsContainer = qs(root, '.resume-step-panels');
  const toggleProjectsButton = qs(root, '#rb-toggle-projects');
  const toggleCertificationsButton = qs(root, '#rb-toggle-certifications');
  const projectFields = qs(root, '#rb-project-fields');
  const certificationFields = qs(root, '#rb-certification-fields');
  const projectsDisabledNote = qs(root, '#rb-projects-disabled-note');
  const certificationsDisabledNote = qs(root, '#rb-certifications-disabled-note');
  const sectionOrderList = qs(root, '#rb-section-order-list');
  const fabBackButton = qs(root, '#rb-fab-back');
  const keywordSuggestions = qs(root, '#rb-keyword-suggestions');
  const keywordIndustryLabel = qs(root, '#rb-kw-industry-label');
  const keywordPillsContainer = qs(root, '#rb-kw-pills-container');
  const keywordDismissButton = qs(root, '#rb-kw-dismiss');
  const keywordRestoreButton = qs(root, '#rb-kw-restore');
  const industryBadge = qs(root, '#rb-industry-badge');
  const industryBadgeLabel = qs(root, '#rb-industry-badge-label');
  const skillsTextarea = qs(root, '#rb-skills');

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
    summary: '',
    experiences: [createEmptyExperience()],
    projects: [createEmptyProject()],
    educations: [createEmptyEducation()],
    skills: '',
    targetRole: '',
    template: 'classic',
    atsAnalysisResult: null,
    coverLetter: '',
    coverLetterSettings: createDefaultCoverLetterSettings(),
    sectionsEnabled: createDefaultSectionsEnabled(),
    sectionOrder: normalizeSectionOrder(),
    lastEditedAt: null,
    suggestionsDismissed: false,
    certifications: [createEmptyCertification()],
  };

  const atsBaseLabel = 'Analyze Resume';
  const builderBaseLabel = 'Generate Resume';
  let atsBusy = false;
  let builderBusy = false;
  let importBusy = false;
  let importSuccessTimer = null;
  let coverLetterPrintFrame = null;
  let activeMainTab = 'ats';
  let activeMobileBuilderView = 'edit';
  let previousLiveScore = null;
  const previewOriginalPosition = previewWrap
    ? { parent: previewWrap.parentNode, nextSibling: previewWrap.nextSibling }
    : null;
  const scoreOriginalPosition = scorePanelFull
    ? { parent: scorePanelFull.parentNode, nextSibling: scorePanelFull.nextSibling }
    : null;
  const debouncedSave = debounce(() => {
    showSaveIndicator('saving');
    saveToStorage(state);
  }, AUTOSAVE_DELAY);
  let debouncedRefreshScore = () => {};
  const sharedLoad = await loadShareableStateFromHash(state);
  const wasRestored = sharedLoad.loaded ? false : restoreFromStorage(state);
  resumeExportState = state;
  resumeExportToastStack = toastStack;
  resumeTemplateState = state;
  resumeTemplateRoot = root;
  resumeTemplateSave = debouncedSave;

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

  function updateResumePreviewMeta() {
    if (previewCount) previewCount.textContent = `${String(state.generatedResume || '').length} chars`;
    if (previewNote) previewNote.textContent = state.generatedResume ? deriveResumeNote(state.generatedResume, state) : 'ATS note pending';
    updateWordCountDisplay(state);
    syncExportButtons();
  }

  async function copyShareLink() {
    if (!String(state.personal?.name || '').trim()) {
      showToast(toastStack, 'Add your name and details first to create a shareable link.', 'info');
      return;
    }
    try {
      saveToStorage(state);
      await loadLzString();
      const json = JSON.stringify(buildShareableState(state));
      const compressed = window.LZString.compressToEncodedURIComponent(json);
      const shareUrl = `${window.location.origin}/resume-builder/#r=${compressed}`;
      if (shareUrl.length > SHARE_LINK_URL_LIMIT) {
        showToast(toastStack, 'Your resume is too long to share as a link. Try removing some content or using PDF/DOCX export.', 'warning');
        return;
      }
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(shareUrl);
        if (shareFallback) {
          shareFallback.hidden = true;
          shareFallback.classList.remove('rb-share-fallback--visible');
        }
        showToast(toastStack, 'Share link copied! Anyone with this link can view and edit your resume.', 'success');
      } catch (_) {
        if (shareFallback && shareFallbackUrl) {
          shareFallback.hidden = false;
          shareFallback.classList.add('rb-share-fallback--visible');
          shareFallbackUrl.value = shareUrl;
          shareFallbackUrl.focus();
          shareFallbackUrl.select();
          showToast(toastStack, 'Clipboard access was blocked. Select and copy the share link below.', 'info');
          return;
        }
        showToast(toastStack, 'Clipboard access was blocked. Please try again.', 'error');
      }
    } catch (error) {
      console.error('[Resume Builder] Share link failed:', error);
      showToast(toastStack, 'Could not create a share link. Please try again.', 'error');
    }
  }

  function getAiActionButtons() {
    return [
      atsButton,
      generateButton,
      improveSummaryButton,
      improveSkillsButton,
      coverLetterGenerateButton,
      scoreAnalyzeToggle,
      scoreRunAiButton,
      ...Array.from(root.querySelectorAll('.rb-improve-bullets-btn')),
    ].filter(Boolean);
  }

  function showQuotaExhaustedBanner() {
    if (!quotaExhaustedBanner) return;
    quotaExhaustedBanner.hidden = false;
    const updateCountdown = () => {
      if (quotaCountdown) quotaCountdown.textContent = getQuotaResetCountdown();
    };
    updateCountdown();
    window.clearInterval(quotaCountdownInterval);
    quotaCountdownInterval = window.setInterval(updateCountdown, 60000);
  }

  function hideQuotaExhaustedBanner() {
    if (quotaExhaustedBanner) quotaExhaustedBanner.hidden = true;
    window.clearInterval(quotaCountdownInterval);
    quotaCountdownInterval = 0;
  }

  function syncQuotaExhaustedState(remaining) {
    const exhausted = Number(remaining) <= 0;
    getAiActionButtons().forEach((button) => {
      if (button.classList.contains('rb-improve-btn--loading')) return;
      button.classList.toggle('rb-btn-quota-exhausted', exhausted);
      button.disabled = exhausted;
      button.setAttribute('aria-disabled', String(exhausted));
    });
    if (exhausted) {
      showQuotaExhaustedBanner();
    } else {
      hideQuotaExhaustedBanner();
    }
  }

  function showRateLimitExhaustedStateLocal() {
    showQuotaExhaustedBanner();
    syncQuotaExhaustedState(0);
    if (creditsRemaining) creditsRemaining.textContent = '0';
    if (creditsLabel) creditsLabel.textContent = ' - AI features paused until tomorrow';
    if (coverLetterCreditsRemaining) coverLetterCreditsRemaining.textContent = '0';
    if (coverLetterCreditsLabel) coverLetterCreditsLabel.textContent = ' - AI features paused until tomorrow';
    creditsBar?.classList.add('rb-credits-bar--empty');
    coverLetterCreditsBar?.classList.add('cl-credits-bar--empty');
    syncImportCreditState(0);
  }

  resumeQuotaUiController = {
    showRateLimitExhaustedState: showRateLimitExhaustedStateLocal,
  };

  function guardAiCredits() {
    if (getRemainingCreditsSafe() > 0) return true;
    showRateLimitExhaustedState();
    return false;
  }

  function handleAiActionError(error, fallbackMessage, options = {}) {
    if (isRateLimitError(error)) {
      if (options.banner) {
        setBanner(options.banner, `Daily AI limit reached. Resets in ${getQuotaResetCountdown()}.`, 'error');
      }
      showRateLimitExhaustedState();
      return;
    }
    if (isNetworkError(error) || !navigator.onLine) {
      const message = 'Network error - check your connection.';
      if (options.banner) setBanner(options.banner, message, 'error', options.retryHandler || null);
      showToast(toastStack, message, 'error');
      return;
    }
    if (options.banner) {
      setBanner(options.banner, fallbackMessage, 'error', options.retryHandler || null);
    }
    showToast(toastStack, fallbackMessage, 'error');
  }

  function updateCreditsDisplay() {
    if (!creditsBar || !creditsRemaining || !creditsLabel) return;
    let remaining = 15;
    try {
      remaining = getRemaining(TOOL_KEY);
    } catch (error) {
      console.warn('[Resume Builder] Could not read AI credits:', error);
    }
    if (!Number.isFinite(remaining)) remaining = 15;
    creditsBar.classList.toggle('rb-credits-bar--empty', remaining === 0);
    creditsBar.classList.toggle('rb-credits-bar--low', remaining > 0 && remaining <= 3);

    if (remaining === 0) {
      creditsRemaining.textContent = '0';
      creditsLabel.textContent = ' - AI features paused until tomorrow';
    } else {
      creditsRemaining.textContent = String(remaining);
      creditsLabel.textContent = ' AI credits remaining today';
    }
    if (coverLetterCreditsBar && coverLetterCreditsRemaining && coverLetterCreditsLabel) {
      coverLetterCreditsBar.classList.toggle('cl-credits-bar--empty', remaining === 0);
      coverLetterCreditsBar.classList.toggle('cl-credits-bar--low', remaining > 0 && remaining <= 3);
      coverLetterCreditsRemaining.textContent = String(remaining);
      coverLetterCreditsLabel.textContent = remaining === 0
        ? ' - AI features paused until tomorrow'
        : ' AI credits remaining today';
    }

    if (scoreAnalyzeToggle) {
      scoreAnalyzeToggle.classList.toggle('rb-improve-btn--credit-empty', remaining === 0);
    }
    if (coverLetterGenerateButton) {
      coverLetterGenerateButton.classList.toggle('rb-improve-btn--credit-empty', remaining === 0);
    }
    syncQuotaExhaustedState(remaining);
    syncImportCreditState(remaining);
  }

  let quotaUiSyncPending = false;

  function renderQuotaMounts() {
    renderQuota(TOOL_KEY, atsQuotaMount);
    renderQuota(TOOL_KEY, builderQuotaMount);
    renderQuota(TOOL_KEY, coverLetterQuotaMount);
  }

  function applyQuotaLabels() {
    atsButton.textContent = getQuotaButtonLabel(atsBaseLabel, TOOL_KEY);
    generateButton.textContent = `\u26A1 ${getQuotaButtonLabel(builderBaseLabel, TOOL_KEY)}`;
    updateCreditsDisplay();
  }

  function updateQuotaUi() {
    renderQuotaMounts();
    applyQuotaLabels();
    if (quotaUiSyncPending) return;
    quotaUiSyncPending = true;
    refreshQuotaStatus(TOOL_KEY)
      .then(() => {
        renderQuotaMounts();
        applyQuotaLabels();
      })
      .catch(() => {})
      .finally(() => {
        quotaUiSyncPending = false;
      });
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function returnNodeToOriginalPosition(node, position) {
    if (!node || !position?.parent) return;
    if (node.parentNode === position.parent) return;
    position.parent.insertBefore(node, position.nextSibling);
  }

  function mountNodeForMobile(node, target) {
    if (!node || !target || node.parentNode === target) return;
    target.appendChild(node);
  }

  function setMobileBuilderView(view = 'edit') {
    activeMobileBuilderView = ['edit', 'preview', 'score'].includes(view) ? view : 'edit';
    if (!builderPanel) return;

    builderPanel.classList.toggle('rb-mobile-view-edit', activeMobileBuilderView === 'edit');
    builderPanel.classList.toggle('rb-mobile-view-preview', activeMobileBuilderView === 'preview');
    builderPanel.classList.toggle('rb-mobile-view-score', activeMobileBuilderView === 'score');

    if (isMobileLayout() && activeMobileBuilderView === 'preview') {
      returnNodeToOriginalPosition(scorePanelFull, scoreOriginalPosition);
      mountNodeForMobile(previewWrap, mobilePreviewView);
    } else if (isMobileLayout() && activeMobileBuilderView === 'score') {
      returnNodeToOriginalPosition(previewWrap, previewOriginalPosition);
      mountNodeForMobile(scorePanelFull, mobileScoreView);
    } else {
      returnNodeToOriginalPosition(previewWrap, previewOriginalPosition);
      returnNodeToOriginalPosition(scorePanelFull, scoreOriginalPosition);
    }

    updateMobileNavState();
  }

  function updateMobileNavState() {
    if (!mobileNav || !mobileNavButtons.length) return;
    const builderMode = activeMainTab === 'builder';
    const labels = builderMode
      ? { edit: 'Edit', preview: 'Preview', score: 'Score' }
      : { edit: 'ATS', preview: 'Builder', score: 'Letter' };
    const activeByMainTab = { ats: 'edit', builder: 'preview', 'cover-letter': 'score' };
    const activeKey = builderMode ? activeMobileBuilderView : activeByMainTab[activeMainTab] || 'edit';

    mobileNavButtons.forEach((button) => {
      const key = button.dataset.mobileNav;
      const active = key === activeKey;
      const label = button.querySelector('.rb-mobile-nav__label');
      if (label) label.textContent = labels[key] || key;
      button.classList.toggle('rb-mobile-nav__btn--active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function activateMainTabFromMobile(navKey) {
    const targetByKey = { edit: 'ats', preview: 'builder', score: 'cover-letter' };
    const target = targetByKey[navKey];
    if (target === 'builder') activeMobileBuilderView = 'edit';
    root.querySelector(`[data-tab-target="${target}"]`)?.click();
  }

  function isToolContainerVisible() {
    const rect = root.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function handleMobileNavClick(event) {
    const button = event.target.closest('[data-mobile-nav]');
    if (!button) return;
    const navKey = button.dataset.mobileNav;
    const performNavigation = () => {
      if (activeMainTab === 'builder') {
        setMobileBuilderView(navKey);
        return;
      }
      activateMainTabFromMobile(navKey);
    };
    if (isMobileLayout() && !isToolContainerVisible()) {
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(performNavigation, 600);
      return;
    }
    performNavigation();
  }

  function handleMobileViewportChange() {
    if (!isMobileLayout()) {
      setMobileBuilderView('edit');
    }
    updateMobileNavState();
  }

  // Local ATS pre-scorer
  const LOCAL_ATS_ACTION_VERBS = new Set([
    'led', 'built', 'designed', 'developed', 'increased', 'reduced',
    'managed', 'launched', 'delivered', 'implemented', 'optimized',
    'streamlined', 'collaborated', 'coordinated', 'achieved', 'automated',
    'negotiated', 'created', 'established', 'improved', 'maintained',
    'operated', 'produced', 'provided', 'resolved', 'scaled', 'secured',
    'spearheaded', 'supported', 'transformed', 'architected', 'accelerated',
    'deployed', 'engineered', 'generated', 'grew', 'integrated', 'mentored',
    'migrated', 'presented', 'prioritized', 'recruited', 'restructured',
    'reviewed', 'saved', 'trained', 'utilized', 'won', 'wrote',
  ]);
  const LOCAL_ATS_STOP_WORDS = new Set([
    'the', 'and', 'or', 'in', 'at', 'to', 'a', 'an', 'of', 'for', 'with',
    'as', 'is', 'was', 'are', 'were', 'be', 'been', 'by', 'from', 'on',
    'that', 'this', 'it', 'its', 'not', 'but',
  ]);
  const LOCAL_SCORE_DIMENSION_LABELS = {
    contact: 'Contact Info',
    sections: 'Section Completeness',
    achievements: 'Achievement Quality',
    keywords: 'Keyword Density',
    length: 'Resume Length',
    completeness: 'Profile Completeness',
  };

  function getLocalScoreMeta(score) {
    if (score >= 90) return { label: 'ATS Ready', color: '#6366f1' };
    if (score >= 75) return { label: 'Strong', color: '#22c55e' };
    if (score >= 60) return { label: 'Good Start', color: '#eab308' };
    if (score >= 40) return { label: 'Getting There', color: '#f97316' };
    return { label: 'Needs Work', color: '#ef4444' };
  }

  function getValidExperiencesForScore() {
    return (state.experiences || []).filter((experience) => String(experience?.jobTitle || experience?.title || '').trim());
  }

  function getAchievementBulletsForScore() {
    return (state.experiences || []).flatMap((experience) => [
      experience?.achievement1,
      experience?.achievement2,
      experience?.achievement3,
    ]).map((bullet) => String(bullet || '').trim()).filter(Boolean);
  }

  function countResumeWords(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function tokenizeScoreKeywords(text) {
    return String(text || '')
      .toLowerCase()
      .match(/[a-z0-9+#.]+/g)?.filter((word) => word.length >= 3 && !LOCAL_ATS_STOP_WORDS.has(word)) || [];
  }

  function getLocalScoreTip(key) {
    const bullets = getAchievementBulletsForScore();
    const skills = parseCommaList(state.skills);
    const resumeWords = countResumeWords(state.generatedResume);
    if (key === 'contact') {
      if (!state.personal.email.trim()) return 'Add your email address - most ATS systems require it.';
      if (!state.personal.phone.trim()) return 'Add your phone number so recruiters can contact you quickly.';
      if (!state.personal.linkedin.trim()) return 'Add a LinkedIn URL to strengthen recruiter trust signals.';
      return 'Complete every contact field to make parsing and recruiter follow-up easier.';
    }
    if (key === 'sections') {
      if (!state.summary.trim() || state.summary.trim().length < 50) return 'Write a 2-3 sentence summary tailored to your target role.';
      if (!getValidExperiencesForScore().length) return 'Add at least one work experience with a role title and achievement.';
      if (!skills.length) return 'Add targeted skills so ATS systems can match your resume to the role.';
      return 'Fill in summary, experience, education, and skills for stronger section coverage.';
    }
    if (key === 'achievements') {
      if (!bullets.length) return 'Add achievement bullets under experience before generating your resume.';
      return 'Start bullet points with action verbs like Led, Built, or Increased and include real metrics where possible.';
    }
    if (key === 'keywords') {
      return 'Add more specific skills and target-role terms to improve ATS keyword density.';
    }
    if (key === 'length') {
      if (!state.generatedResume.trim()) return 'Generate your resume to evaluate final length and keyword coverage.';
      if (resumeWords < 350) return 'Your resume is light; add more concrete detail to experience and project bullets.';
      return 'Trim low-impact wording so the final resume stays focused and ATS-friendly.';
    }
    return 'Add target role, projects, certifications, and complete education details to boost profile completeness.';
  }

  function buildLocalScoreTips(dimensions) {
    return Object.entries(dimensions)
      .map(([key, dimension]) => ({
        key,
        ratio: dimension.max ? dimension.score / dimension.max : 1,
      }))
      .filter((item) => item.ratio < 0.6)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3)
      .map((item) => getLocalScoreTip(item.key));
  }

  function calculateLocalAtsScore() {
    const personal = state.personal || {};
    let contact = 0;
    if (String(personal.name || '').trim()) contact += 3;
    if (String(personal.email || '').trim()) contact += 4;
    if (String(personal.phone || '').trim()) contact += 3;
    if (String(personal.location || '').trim()) contact += 2;
    if (String(personal.linkedin || '').trim()) contact += 2;
    if (String(personal.portfolio || '').trim()) contact += 1;

    const summaryLength = String(state.summary || '').trim().length;
    let sections = summaryLength >= 50 ? 7 : summaryLength > 0 ? 3 : 0;
    const experienceEntriesWithAchievements = (state.experiences || []).filter((experience) => {
      const title = String(experience?.jobTitle || experience?.title || '').trim();
      const hasAchievement = [experience?.achievement1, experience?.achievement2, experience?.achievement3]
        .some((value) => String(value || '').trim());
      return title && hasAchievement;
    });
    if (experienceEntriesWithAchievements.length >= 2) sections += 8;
    else if (experienceEntriesWithAchievements.length === 1) sections += 5;
    if ((state.educations || []).some((education) => String(education?.degree || '').trim() && String(education?.institution || '').trim())) {
      sections += 4;
    }
    const skillCount = parseCommaList(state.skills).length;
    if (skillCount >= 10) sections += 6;
    else if (skillCount >= 5) sections += 4;
    else if (skillCount >= 1) sections += 2;

    const achievementBullets = getAchievementBulletsForScore();
    let achievements = 0;
    if (achievementBullets.length) {
      const strongVerbCount = achievementBullets.filter((bullet) => {
        const firstWord = String(bullet || '').trim().split(/\s+/)[0]?.replace(/[^a-z]/gi, '').toLowerCase();
        return LOCAL_ATS_ACTION_VERBS.has(firstWord);
      }).length;
      const quantifiedCount = achievementBullets.filter((bullet) => /[0-9%$€£¥₹]|\b\d+x\b/i.test(bullet)).length;
      achievements = Math.round((strongVerbCount / achievementBullets.length) * 10)
        + Math.round((quantifiedCount / achievementBullets.length) * 10);
    }

    let keywords = 3;
    if (String(state.generatedResume || '').trim() || String(state.skills || '').trim()) {
      const keywordSource = [
        ...parseCommaList(state.skills),
        ...String(state.targetRole || '').split(/\s+/),
        ...(state.experiences || []).map((experience) => experience?.jobTitle || experience?.title || ''),
      ].join(' ');
      const keywordSet = new Set(tokenizeScoreKeywords(keywordSource));
      const matchCorpus = String(state.generatedResume || '').trim()
        || [
          state.summary,
          state.skills,
          ...achievementBullets,
        ].join(' ');
      const corpusLower = String(matchCorpus || '').toLowerCase();
      const matches = [...keywordSet].filter((keyword) => corpusLower.includes(keyword)).length;
      if (matches >= 15) keywords = 15;
      else if (matches >= 10) keywords = 11;
      else if (matches >= 5) keywords = 7;
      else keywords = 3;
    }

    let length = 5;
    if (String(state.generatedResume || '').trim()) {
      const words = countResumeWords(state.generatedResume);
      if (words < 200) length = 2;
      else if (words <= 349) length = 6;
      else if (words <= 700) length = 10;
      else if (words <= 900) length = 8;
      else length = 4;
    }

    let completeness = 0;
    if (String(state.targetRole || '').trim()) completeness += 3;
    if (getValidExperiencesForScore().length >= 2) completeness += 2;
    if ((state.certifications || []).some((item) => String(item || '').trim())) completeness += 2;
    if (String(personal.linkedin || '').trim()) completeness += 2;
    if ((state.projects || []).some((project) => String(project?.name || '').trim())) completeness += 2;
    if ((state.educations || []).some((education) => (
      String(education?.degree || '').trim()
      && String(education?.institution || '').trim()
      && String(education?.year || '').trim()
    ))) completeness += 2;
    if (summaryLength >= 100) completeness += 2;

    const dimensions = {
      contact: { score: contact, max: 15, label: LOCAL_SCORE_DIMENSION_LABELS.contact },
      sections: { score: sections, max: 25, label: LOCAL_SCORE_DIMENSION_LABELS.sections },
      achievements: { score: achievements, max: 20, label: LOCAL_SCORE_DIMENSION_LABELS.achievements },
      keywords: { score: keywords, max: 15, label: LOCAL_SCORE_DIMENSION_LABELS.keywords },
      length: { score: length, max: 10, label: LOCAL_SCORE_DIMENSION_LABELS.length },
      completeness: { score: completeness, max: 15, label: LOCAL_SCORE_DIMENSION_LABELS.completeness },
    };
    const total = Math.max(0, Math.min(100, Math.round(
      contact + sections + achievements + keywords + length + completeness,
    )));
    const hasMeaningfulData = [
      personal.name,
      personal.email,
      state.experiences?.[0]?.jobTitle,
      state.experiences?.[0]?.title,
      state.summary,
    ].some((value) => String(value || '').trim());
    if (!hasMeaningfulData) {
      return {
        total: null,
        label: 'Not started',
        color: null,
        dimensions: null,
        tips: null,
      };
    }
    const meta = getLocalScoreMeta(total);
    return {
      total,
      label: meta.label,
      color: meta.color,
      dimensions,
      tips: buildLocalScoreTips(dimensions),
    };
  }

  function getDisplayScoreResult(localScore) {
    if (localScore.total === null) {
      return { ...localScore, isAi: false, keywordsFound: [], keywordsMissing: [] };
    }
    const aiResult = normalizeSavedAtsAnalysisResult(state.atsAnalysisResult);
    if (!aiResult) return { ...localScore, isAi: false, keywordsFound: [], keywordsMissing: [] };
    const scoreMeta = getLocalScoreMeta(aiResult.score);
    const aiTips = aiResult.improvements.length
      ? aiResult.improvements.slice(0, 3).map((item) => `${item.title}: ${item.detail}`.replace(/:\s*$/, ''))
      : localScore.tips;
    return {
      ...localScore,
      total: aiResult.score,
      label: aiResult.scoreLabel || scoreMeta.label,
      color: aiResult.scoreColor || scoreMeta.color,
      tips: aiTips,
      isAi: true,
      keywordsFound: aiResult.keywordsFound,
      keywordsMissing: aiResult.keywordsMissing,
    };
  }

  function renderScoreBreakdown(dimensions, color) {
    clearNode(scoreBreakdown);
    if (!scoreBreakdown) return;
    Object.entries(dimensions).forEach(([, dimension]) => {
      const row = createNode('div', 'rb-score-breakdown-row');
      const label = createNode('span', 'rb-score-breakdown-row__label', dimension.label);
      const bar = createNode('span', 'rb-score-breakdown-row__bar');
      const fill = createNode('span', 'rb-score-breakdown-row__fill');
      const value = createNode('span', 'rb-score-breakdown-row__value', `${dimension.score}/${dimension.max}`);
      fill.style.width = `${Math.max(0, Math.min(100, Math.round((dimension.score / dimension.max) * 100)))}%`;
      fill.style.backgroundColor = color;
      bar.appendChild(fill);
      row.append(label, bar, value);
      scoreBreakdown.appendChild(row);
    });
  }

  function renderScoreTips(tips) {
    clearNode(scoreTips);
    if (!scoreTips) return;
    const safeTips = tips?.length ? tips : ['Keep filling the form - your live score will update as you add stronger detail.'];
    safeTips.slice(0, 3).forEach((tip) => {
      const item = createNode('li', '', tip);
      scoreTips.appendChild(item);
    });
  }

  function refreshLiveScore() {
    const localScore = calculateLocalAtsScore();
    const displayScore = getDisplayScoreResult(localScore);
    const scoreNotStarted = displayScore.total === null;
    if (scoreCompact) scoreCompact.classList.toggle('rb-score-hidden', scoreNotStarted);
    if (scorePanelFull) scorePanelFull.classList.toggle('rb-score-empty', scoreNotStarted);
    if (scoreNotStarted) {
      previousLiveScore = null;
      if (scoreFullNumber) scoreFullNumber.textContent = '';
      if (scoreFullLabel) {
        scoreFullLabel.textContent = 'Not started';
        scoreFullLabel.style.color = '';
      }
      if (scoreFullDescription) {
        scoreFullDescription.textContent = 'Fill in your details to see your ATS score.';
      }
      if (scoreAiBadge) scoreAiBadge.hidden = true;
      if (scoreKeywords) scoreKeywords.hidden = true;
      clearNode(scoreBreakdown);
      clearNode(scoreTips);
      if (generateReadiness) generateReadiness.hidden = true;
      return;
    }
    const tip = displayScore.tips[0] || 'Keep filling the form to improve your ATS readiness.';
    const circumference = 2 * Math.PI * 38;
    const gaugeOffset = circumference - ((displayScore.total / 100) * circumference);
    const previousScore = previousLiveScore;
    previousLiveScore = displayScore.total;

    [scoreCompact, scorePanelFull].forEach((node) => {
      if (node) node.style.setProperty('--rb-score-color', displayScore.color);
    });
    if (scoreCompact && previousScore !== null && previousScore !== displayScore.total) {
      scoreCompact.classList.remove('rb-score-increased', 'rb-score-decreased');
      void scoreCompact.offsetWidth;
      scoreCompact.classList.add(displayScore.total > previousScore ? 'rb-score-increased' : 'rb-score-decreased');
      window.setTimeout(() => scoreCompact.classList.remove('rb-score-increased', 'rb-score-decreased'), 320);
    }
    if (scoreCompactNumber) {
      scoreCompactNumber.textContent = String(displayScore.total);
      scoreCompactNumber.style.borderColor = displayScore.color;
    }
    if (scoreCompactLabel) {
      scoreCompactLabel.textContent = displayScore.label;
      scoreCompactLabel.style.color = displayScore.color;
    }
    if (scoreCompactTip) scoreCompactTip.textContent = tip;
    if (scoreGaugeValue) {
      scoreGaugeValue.style.stroke = displayScore.color;
      scoreGaugeValue.style.strokeDasharray = String(circumference);
      scoreGaugeValue.style.strokeDashoffset = String(gaugeOffset);
    }
    if (scoreFullNumber) scoreFullNumber.textContent = String(displayScore.total);
    if (scoreFullLabel) {
      scoreFullLabel.textContent = displayScore.label;
      scoreFullLabel.style.color = displayScore.color;
    }
    if (scoreFullDescription) {
      scoreFullDescription.textContent = displayScore.isAi
        ? 'Job-description match from your latest AI analysis.'
        : 'Local score based on contact details, sections, achievements, keywords, and length.';
    }
    if (scoreAiBadge) scoreAiBadge.hidden = !displayScore.isAi;
    renderScoreBreakdown(localScore.dimensions, displayScore.color);
    renderScoreTips(displayScore.tips);
    if (scoreKeywords) scoreKeywords.hidden = !displayScore.isAi;
    if (displayScore.isAi) {
      renderPills(scoreKeywordsFound, displayScore.keywordsFound, 'found');
      renderPills(scoreKeywordsMissing, displayScore.keywordsMissing, 'missing');
    }
    const analyzeLabel = scoreAnalyzeToggle?.querySelector('.rb-improve-btn__label');
    if (analyzeLabel) {
      analyzeLabel.textContent = displayScore.isAi ? 'Re-analyze with Job Description' : 'Analyze with Job Description';
    }
    if (generateReadiness) {
      const showNotice = state.currentStep === 5 && displayScore.total < 40;
      generateReadiness.hidden = !showNotice;
      if (showNotice) {
        generateReadiness.textContent = `Your resume needs a bit more work before generating. Score: ${displayScore.total}/100 - add more details to improve it.`;
      }
    }
  }

  debouncedRefreshScore = debounce(() => {
    refreshLiveScore();
    updateCompletionBar(state);
  }, 600);

  function markBuilderContentChanged() {
    state.atsAnalysisResult = null;
    debouncedRefreshScore();
    updateCoverLetterResumeNotice();
  }

  function updateIndustryBadge(industry) {
    if (!industryBadge || !industryBadgeLabel) return;
    const label = getIndustryDisplayName(industry);
    industryBadge.hidden = !label;
    industryBadgeLabel.textContent = label ? `Detected: ${label}` : '';
  }

  function hideKeywordSuggestions() {
    if (keywordSuggestions) keywordSuggestions.hidden = true;
    if (keywordPillsContainer) clearNode(keywordPillsContainer);
  }

  function renderSuggestionPanel(industry = detectIndustry(state.targetRole), keywords = getKeywordsForIndustry(industry)) {
    const hasSuggestions = Boolean(industry && keywords.length);
    if (!keywordSuggestions || !keywordPillsContainer) {
      if (keywordRestoreButton) keywordRestoreButton.hidden = true;
      return;
    }

    if (!hasSuggestions) {
      hideKeywordSuggestions();
      if (keywordRestoreButton) keywordRestoreButton.hidden = true;
      return;
    }

    if (state.suggestionsDismissed) {
      hideKeywordSuggestions();
      if (keywordRestoreButton) keywordRestoreButton.hidden = false;
      return;
    }

    if (keywordRestoreButton) keywordRestoreButton.hidden = true;
    if (keywordIndustryLabel) keywordIndustryLabel.textContent = getIndustryDisplayName(industry);
    clearNode(keywordPillsContainer);

    const alreadyAdded = getAlreadyAddedKeywords(state);
    const grouped = new Map();
    keywords.forEach((item) => {
      const category = item.category || 'Suggested';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    });

    grouped.forEach((items, category) => {
      const group = createNode('div', 'rb-kw-category-group');
      group.appendChild(createNode('span', 'rb-kw-category-label', category));
      const pillRow = createNode('div', 'rb-kw-pill-row');
      items
        .slice()
        .sort((a, b) => Number(a.priority || 2) - Number(b.priority || 2))
        .forEach((item) => {
          const keyword = String(item.kw || '').trim();
          if (!keyword) return;
          const isAdded = alreadyAdded.has(keyword.toLowerCase());
          const button = createNode('button', `rb-kw-pill${isAdded ? ' rb-kw-pill--added' : ''}`, isAdded ? `\u2713 ${keyword}` : keyword);
          button.type = 'button';
          button.dataset.keyword = keyword;
          button.dataset.priority = String(item.priority || 2);
          button.setAttribute('aria-pressed', String(isAdded));
          pillRow.appendChild(button);
        });
      group.appendChild(pillRow);
      keywordPillsContainer.appendChild(group);
    });

    keywordSuggestions.hidden = false;
  }

  function renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange = true } = {}) {
    const industry = detectIndustry(state.targetRole);
    if (industry !== lastDetectedIndustry) {
      if (resetDismissedOnIndustryChange && industry) {
        state.suggestionsDismissed = false;
      }
      lastDetectedIndustry = industry;
    }
    updateIndustryBadge(industry);
    renderSuggestionPanel(industry, getKeywordsForIndustry(industry));
  }

  const debouncedDetectIndustry = debounce(() => {
    renderCurrentIndustrySuggestions();
  }, 600);

  function addKeywordToSkills(keyword) {
    const nextKeyword = String(keyword || '').trim();
    if (!nextKeyword) return;

    const currentSkills = parseCommaList(state.skills);
    const existing = new Set(currentSkills.map((skill) => skill.toLowerCase()));
    if (existing.has(nextKeyword.toLowerCase())) {
      showToast(toastStack, 'Already in your skills!', 'info');
      renderSuggestionPanel(detectIndustry(state.targetRole), getKeywordsForIndustry(detectIndustry(state.targetRole)));
      return;
    }

    currentSkills.push(nextKeyword);
    state.skills = currentSkills.join(', ');
    const field = skillsTextarea || qs(root, '#rb-skills');
    if (field) field.value = state.skills;
    renderBuilderDerivedViews();
    state.atsAnalysisResult = null;
    refreshLiveScore();
    updateCompletionBar(state);
    renderSuggestionPanel(detectIndustry(state.targetRole), getKeywordsForIndustry(detectIndustry(state.targetRole)));
    debouncedSave();
  }

  function getCoverLetterSettingsFromForm() {
    const current = normalizeCoverLetterSettings(state.coverLetterSettings);
    return normalizeCoverLetterSettings({
      company: coverLetterInputs.company?.value ?? current.company,
      role: coverLetterInputs.role?.value || current.role || state.targetRole,
      hiringManager: coverLetterInputs.hiringManager?.value ?? current.hiringManager,
      companyReason: coverLetterInputs.companyReason?.value ?? current.companyReason,
      jobDescription: coverLetterInputs.jobDescription?.value ?? current.jobDescription,
      tone: current.tone,
      style: current.style,
      length: current.length,
    });
  }

  function setCoverLetterButtonsEnabled(isEnabled) {
    [
      coverLetterCopyButton,
      coverLetterPdfButton,
      coverLetterDocxButton,
      coverLetterRegenerateButton,
    ].forEach((button) => {
      if (!button) return;
      button.disabled = !isEnabled;
      button.setAttribute('aria-disabled', String(!isEnabled));
    });
  }

  function getCoverLetterDate() {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getCoverLetterManager(settings) {
    return String(settings?.hiringManager || '').trim() || 'Hiring Manager';
  }

  function getCoverLetterContactLine() {
    const personal = state.personal || {};
    return [
      personal.email,
      personal.phone,
      personal.location,
    ].map((value) => String(value || '').trim()).filter(Boolean).join(' | ');
  }

  function getCoverLetterParagraphs(letterText) {
    return String(letterText || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  function renderCoverLetterEmptyState() {
    if (!coverLetterPreviewPane) return;
    coverLetterPreviewPane.innerHTML = `
      <div class="cl-preview-empty">
        <div class="cl-preview-empty__icon" aria-hidden="true">&#128100;</div>
        <p>Your cover letter will appear here</p>
        <span>Fill in the details and click Generate</span>
      </div>`;
  }

  function renderCoverLetterLoadingState() {
    if (!coverLetterPreviewPane) return;
    coverLetterPreviewPane.innerHTML = `
      <div class="cl-letter-skeleton" aria-live="polite" aria-label="Generating cover letter">
        <span class="cl-letter-skeleton__bar wide"></span>
        <span class="cl-letter-skeleton__bar"></span>
        <span class="cl-letter-skeleton__bar short"></span>
        <span class="cl-letter-skeleton__gap"></span>
        <span class="cl-letter-skeleton__bar wide"></span>
        <span class="cl-letter-skeleton__bar"></span>
        <span class="cl-letter-skeleton__bar short"></span>
      </div>`;
  }

  function renderCoverLetterPreview(letterText = state.coverLetter, settings = state.coverLetterSettings) {
    if (!coverLetterPreviewPane) return;
    const cleanLetter = String(letterText || '').trim();
    if (!cleanLetter) {
      renderCoverLetterEmptyState();
      setCoverLetterButtonsEnabled(false);
      return;
    }

    const normalizedSettings = normalizeCoverLetterSettings(settings);
    const candidateName = String(state.personal.name || '').trim() || 'Your Name';
    const contactLine = getCoverLetterContactLine();
    const manager = getCoverLetterManager(normalizedSettings);
    const company = normalizedSettings.company || 'Company';
    const paragraphs = getCoverLetterParagraphs(cleanLetter);
    const bodyHtml = paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('');

    coverLetterPreviewPane.innerHTML = `
      <div class="cl-letter-doc">
        <header class="cl-letter-header">
          <div>
            <h1>${escapeHtml(candidateName)}</h1>
            ${contactLine ? `<p>${escapeHtml(contactLine)}</p>` : ''}
          </div>
          <time>${escapeHtml(getCoverLetterDate())}</time>
        </header>
        <div class="cl-letter-address">
          <p>${escapeHtml(manager)}</p>
          <p>${escapeHtml(company)}</p>
        </div>
        <p class="cl-letter-salutation">Dear ${escapeHtml(manager)},</p>
        <div class="cl-letter-body">${bodyHtml}</div>
      </div>`;
    setCoverLetterButtonsEnabled(true);
  }

  function buildCompleteCoverLetterText(letterText = state.coverLetter, settings = state.coverLetterSettings) {
    const normalizedSettings = normalizeCoverLetterSettings(settings);
    const candidateName = String(state.personal.name || '').trim() || 'Your Name';
    const contactLine = getCoverLetterContactLine();
    const manager = getCoverLetterManager(normalizedSettings);
    const company = normalizedSettings.company || 'Company';
    return [
      candidateName,
      contactLine,
      getCoverLetterDate(),
      '',
      manager,
      company,
      '',
      `Dear ${manager},`,
      '',
      String(letterText || '').trim(),
    ].filter((line, index, array) => line || array[index - 1] !== '').join('\n');
  }

  function updateCoverLetterResumeNotice() {
    if (!coverLetterNotice) return;
    if (
      coverLetterInputs.role
      && !String(coverLetterInputs.role.value || '').trim()
      && !String(state.coverLetterSettings?.role || '').trim()
      && String(state.targetRole || '').trim()
    ) {
      coverLetterInputs.role.value = state.targetRole;
    }
    const experienceCount = (state.experiences || []).filter(hasAnyResumeValue).length;
    const educationCount = (state.educations || []).filter(hasAnyResumeValue).length;
    const skillCount = parseCommaList(state.skills).length;
    if (experienceCount || educationCount || skillCount) {
      coverLetterNotice.innerHTML = `&#10003; Using your resume data: ${experienceCount} experience${experienceCount === 1 ? '' : 's'}, ${skillCount} skill${skillCount === 1 ? '' : 's'}, ${educationCount} education entr${educationCount === 1 ? 'y' : 'ies'}`;
      coverLetterNotice.classList.remove('is-empty');
    } else {
      coverLetterNotice.textContent = 'No resume data found - fill in the Resume Builder for best results, or generate with the info above.';
      coverLetterNotice.classList.add('is-empty');
    }
  }

  function syncCoverLetterOptionGroup(groupName, value) {
    root.querySelectorAll(`[data-cl-option-group="${groupName}"] .cl-option-pill`).forEach((button) => {
      const attr = groupName === 'tone' ? 'clTone' : groupName === 'style' ? 'clStyle' : 'clLength';
      const active = button.dataset[attr] === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function populateCoverLetterFormFromState() {
    state.coverLetterSettings = normalizeCoverLetterSettings(state.coverLetterSettings);
    const settings = state.coverLetterSettings;
    if (coverLetterInputs.company) coverLetterInputs.company.value = settings.company;
    if (coverLetterInputs.role) coverLetterInputs.role.value = settings.role || state.targetRole || '';
    if (coverLetterInputs.hiringManager) coverLetterInputs.hiringManager.value = settings.hiringManager;
    if (coverLetterInputs.companyReason) coverLetterInputs.companyReason.value = settings.companyReason;
    if (coverLetterInputs.jobDescription) coverLetterInputs.jobDescription.value = settings.jobDescription;
    syncCoverLetterOptionGroup('tone', settings.tone);
    syncCoverLetterOptionGroup('style', settings.style);
    syncCoverLetterOptionGroup('length', settings.length);
    updateCoverLetterJdCounter();
    updateCoverLetterResumeNotice();
  }

  function updateCoverLetterJdCounter() {
    if (!coverLetterJdCounter) return;
    const length = String(coverLetterInputs.jobDescription?.value || '').length;
    coverLetterJdCounter.textContent = `${Math.min(length, 3000)} / 3000`;
  }

  function scoreCoverLetterAchievement(achievement) {
    const text = String(achievement || '').trim();
    if (!text) return 0;
    const firstWord = text.split(/\s+/)[0]?.replace(/[^a-z]/gi, '').toLowerCase();
    let score = Math.min(text.length / 20, 8);
    if (/[0-9%$€£¥₹]|\b\d+x\b/i.test(text)) score += 20;
    if (LOCAL_ATS_ACTION_VERBS.has(firstWord)) score += 8;
    if (/\b(increased|reduced|improved|built|launched|delivered|optimized|streamlined|managed|created)\b/i.test(text)) score += 5;
    return score;
  }

  function getTopCoverLetterAchievements() {
    return (state.experiences || []).flatMap((experience) => {
      const jobTitle = experience.jobTitle || experience.title || '';
      return [experience.achievement1, experience.achievement2, experience.achievement3]
        .map((achievement) => ({
          achievement: String(achievement || '').trim(),
          jobTitle,
          company: experience.company || '',
          duration: experience.duration || '',
          score: scoreCoverLetterAchievement(achievement),
        }));
    }).filter((item) => item.achievement)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  function buildCoverLetterPrompt(settings) {
    const normalizedSettings = normalizeCoverLetterSettings(settings);
    const personal = state.personal || {};
    const achievements = getTopCoverLetterAchievements();
    const topExperiences = (state.experiences || [])
      .filter(hasAnyResumeValue)
      .slice(0, 3)
      .map((experience, index) => [
        `Experience ${index + 1}:`,
        `Title: ${experience.jobTitle || experience.title || ''}`,
        `Company: ${experience.company || ''}`,
        `Duration: ${experience.duration || ''}`,
        `Best achievements: ${[experience.achievement1, experience.achievement2, experience.achievement3].filter(Boolean).join(' | ')}`,
      ].join('\n'));
    const educationSummary = (state.educations || [])
      .filter(hasAnyResumeValue)
      .slice(0, 3)
      .map((education) => [education.degree, education.institution, education.year].filter(Boolean).join(' - '))
      .join('\n');
    const projectSummary = (state.projects || [])
      .filter(hasAnyResumeValue)
      .slice(0, 3)
      .map((project) => [
        project.name,
        project.technologies ? `Technologies: ${project.technologies}` : '',
        project.description ? `Details: ${project.description}` : '',
      ].filter(Boolean).join(' | '))
      .join('\n');

    return [
      `Candidate Name: ${personal.name || ''}`,
      `Email: ${personal.email || ''}`,
      `Phone: ${personal.phone || ''}`,
      `Location: ${personal.location || ''}`,
      `LinkedIn: ${personal.linkedin || ''}`,
      `Portfolio: ${personal.portfolio || ''}`,
      '',
      `Target Role: ${state.targetRole || normalizedSettings.role || 'General professional role'}`,
      `Company Name: ${normalizedSettings.company}`,
      `Position/Role Title: ${normalizedSettings.role || state.targetRole || 'Target role'}`,
      `Hiring Manager: ${getCoverLetterManager(normalizedSettings)}`,
      `Why This Company: ${normalizedSettings.companyReason || 'Not provided'}`,
      `Job Description: ${normalizedSettings.jobDescription || 'Not provided'}`,
      `Tone Selected: ${normalizedSettings.tone}`,
      `Style Selected: ${normalizedSettings.style}`,
      `Length Selected: ${normalizedSettings.length}`,
      '',
      `Professional Summary: ${state.summary || 'Not provided'}`,
      '',
      'Top 3 strongest achievements selected from resume data:',
      achievements.length
        ? achievements.map((item, index) => `${index + 1}. ${item.achievement} (${[item.jobTitle, item.company].filter(Boolean).join(' at ')})`).join('\n')
        : 'No achievements provided.',
      '',
      'Top 3 experiences:',
      topExperiences.length ? topExperiences.join('\n\n') : 'No work experience provided.',
      '',
      `Skills Summary: ${parseCommaList(state.skills).join(', ') || 'Not provided'}`,
      '',
      `Education Summary:\n${educationSummary || 'Not provided'}`,
      '',
      `Notable Projects:\n${projectSummary || 'Not provided'}`,
    ].join('\n');
  }

  async function generateCoverLetter() {
    const settings = getCoverLetterSettingsFromForm();
    if (!settings.company) {
      coverLetterInputs.company?.focus();
      showToast(toastStack, 'Please enter the company name to generate your cover letter.', 'error');
      return;
    }
    if (!guardAiCredits()) return;

    state.coverLetterSettings = settings;
    const btn = coverLetterGenerateButton;
    cacheImproveButtonLabel(btn, 'Generate Cover Letter');
    if (btn) btn.dataset.loadingLabel = 'Generating...';
    setImproveBtnLoading(btn, true);
    renderCoverLetterLoadingState();

    try {
      const result = await callAI({
        tool: TOOL_KEY,
        systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
        userContent: buildCoverLetterPrompt(settings),
        maxTokens: 1200,
        temperature: 0.65,
      });
      const letter = getAIResultText(result);
      if (!letter) throw new Error('The AI returned an empty cover letter.');
      state.coverLetter = letter;
      state.coverLetterSettings = settings;
      saveToStorage(state);
      renderCoverLetterPreview(state.coverLetter, state.coverLetterSettings);
      showToast(toastStack, 'Cover letter generated. Review and personalize before sending.', 'success');
    } catch (error) {
      console.error('[Cover Letter]', error);
      renderCoverLetterPreview(state.coverLetter, state.coverLetterSettings);
      handleAiActionError(error, 'Cover letter generation failed. Check your credits or try again.');
    } finally {
      setImproveBtnLoading(btn, false);
      updateQuotaUi();
    }
  }

  async function copyCoverLetter() {
    if (!state.coverLetter) return;
    try {
      await copyText(
        buildCompleteCoverLetterText(state.coverLetter, state.coverLetterSettings),
        toastStack,
        'Cover letter copied to clipboard!',
      );
    } catch (error) {
      console.error('[Cover Letter Copy]', error);
      showToast(toastStack, 'Copy failed. Please select and copy manually.', 'error');
    }
  }

  function removeCoverLetterPrintFrame() {
    if (coverLetterPrintFrame?.parentNode) {
      coverLetterPrintFrame.parentNode.removeChild(coverLetterPrintFrame);
    }
    coverLetterPrintFrame = null;
  }

  function getCoverLetterPrintStyles() {
    return `
      @page { size: letter portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
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
      .cl-letter-doc {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 1in;
        background: #ffffff;
        color: #111111;
        box-shadow: none;
        border-radius: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 10.5pt;
        line-height: 1.5;
      }
      .cl-letter-header {
        display: flex;
        justify-content: space-between;
        gap: 0.5in;
        margin-bottom: 0.35in;
      }
      .cl-letter-header h1 {
        margin: 0 0 0.06in;
        font-size: 15pt;
        line-height: 1.1;
      }
      .cl-letter-header p,
      .cl-letter-header time,
      .cl-letter-address p,
      .cl-letter-salutation,
      .cl-letter-body p {
        margin: 0;
      }
      .cl-letter-header p {
        color: #333333;
        font-size: 9.5pt;
      }
      .cl-letter-header time {
        white-space: nowrap;
        font-size: 10pt;
      }
      .cl-letter-address {
        margin-bottom: 0.25in;
      }
      .cl-letter-salutation {
        margin-bottom: 0.2in;
      }
      .cl-letter-body p {
        margin-bottom: 0.18in;
        orphans: 2;
        widows: 2;
      }
    `;
  }

  function printCoverLetter() {
    const existingDoc = coverLetterPreviewPane?.querySelector('.cl-letter-doc');
    if (!state.coverLetter || !existingDoc) {
      showToast(toastStack, 'Generate a cover letter before saving as PDF.', 'error');
      return;
    }
    removeCoverLetterPrintFrame();
    const fileBaseName = `${getResumeFileBaseName()}_cover_letter`;
    const frame = document.createElement('iframe');
    frame.id = 'cl-print-frame';
    frame.title = 'Cover letter print export';
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
    coverLetterPrintFrame = frame;
    document.body.appendChild(frame);
    frame.onload = () => {
      window.setTimeout(() => {
        const printWindow = frame.contentWindow;
        if (!printWindow) {
          removeCoverLetterPrintFrame();
          showToast(toastStack, 'Could not open the print dialog. Please try again.', 'error');
          return;
        }
        printWindow.addEventListener('afterprint', () => {
          window.setTimeout(removeCoverLetterPrintFrame, 500);
        }, { once: true });
        window.setTimeout(removeCoverLetterPrintFrame, 45000);
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
          <style>${getCoverLetterPrintStyles()}</style>
        </head>
        <body>${existingDoc.outerHTML}</body>
      </html>`;
  }

  async function downloadCoverLetterDOCX() {
    if (!state.coverLetter) {
      showToast(toastStack, 'Generate a cover letter before downloading DOCX.', 'error');
      return;
    }
    const btn = coverLetterDocxButton;
    btn?.classList.add('rb-export-btn--loading');
    try {
      await loadDocx();
      if (!window.docx) throw new Error('docx global unavailable');
      const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;
      const settings = normalizeCoverLetterSettings(state.coverLetterSettings);
      const name = String(state.personal.name || '').trim() || 'Your Name';
      const contact = getCoverLetterContactLine();
      const manager = getCoverLetterManager(settings);
      const company = settings.company || 'Company';
      const bodyParagraphs = getCoverLetterParagraphs(state.coverLetter)
        .flatMap((paragraph) => paragraph.split('\n').map((line) => line.trim()).filter(Boolean));
      const makeParagraph = (text, options = {}) => new Paragraph({
        alignment: options.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { after: options.after ?? 160, line: 300 },
        children: [new TextRun({
          text: String(text || ''),
          font: options.font || 'Calibri',
          size: options.size || 22,
          bold: Boolean(options.bold),
        })],
      });
      const children = [
        makeParagraph(name, { bold: true, size: 28, after: 60 }),
      ];
      if (contact) children.push(makeParagraph(contact, { size: 20, after: 120 }));
      children.push(
        makeParagraph(getCoverLetterDate(), { align: 'right', size: 20, after: 220 }),
        makeParagraph(manager, { after: 60 }),
        makeParagraph(company, { after: 220 }),
        makeParagraph(`Dear ${manager},`, { after: 220 }),
        ...bodyParagraphs.map((paragraph) => makeParagraph(paragraph, { after: 180 })),
      );
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        }],
      });
      const blob = await Packer.toBlob(doc);
      downloadBlob(`${getResumeFileBaseName()}_cover_letter.docx`, blob);
      showToast(toastStack, 'Cover letter DOCX downloaded.', 'success');
    } catch (error) {
      console.error('[Cover Letter DOCX]', error);
      showToast(toastStack, 'Cover letter DOCX export failed. Try the PDF option instead.', 'error');
    } finally {
      btn?.classList.remove('rb-export-btn--loading');
    }
  }

  function initCoverLetterTab() {
    populateCoverLetterFormFromState();
    if (state.coverLetter) {
      renderCoverLetterPreview(state.coverLetter, state.coverLetterSettings);
    } else {
      renderCoverLetterEmptyState();
    }

    Object.entries(coverLetterInputs).forEach(([key, input]) => {
      if (!input || input.dataset.coverLetterBound === 'true') return;
      input.dataset.coverLetterBound = 'true';
      input.addEventListener('input', () => {
        state.coverLetterSettings = {
          ...normalizeCoverLetterSettings(state.coverLetterSettings),
          [key]: input.value,
        };
        updateCoverLetterJdCounter();
        debouncedSave();
      });
    });

    root.querySelectorAll('.cl-option-group').forEach((group) => {
      if (group.dataset.coverLetterBound === 'true') return;
      group.dataset.coverLetterBound = 'true';
      group.addEventListener('click', (event) => {
        const button = event.target.closest('.cl-option-pill');
        if (!button || !group.contains(button)) return;
        const settings = normalizeCoverLetterSettings(state.coverLetterSettings);
        if (button.dataset.clTone) settings.tone = button.dataset.clTone;
        if (button.dataset.clStyle) settings.style = button.dataset.clStyle;
        if (button.dataset.clLength) settings.length = button.dataset.clLength;
        state.coverLetterSettings = settings;
        syncCoverLetterOptionGroup('tone', settings.tone);
        syncCoverLetterOptionGroup('style', settings.style);
        syncCoverLetterOptionGroup('length', settings.length);
        debouncedSave();
      });
    });
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

    const summaryCard = createNode('div', 'resume-review-item');
    summaryCard.append(
      createNode('h4', '', 'Professional Summary'),
      createNode('p', '', state.summary || 'No summary added yet. AI will draft one if left blank.'),
    );

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
    educationCard.appendChild(createNode('h4', '', 'Education'));
    const educationList = createNode('ul');
    const filledEducations = getFilledEducations(state);
    if (!filledEducations.length) {
      educationList.appendChild(createNode('li', '', 'No education added yet.'));
    } else {
      filledEducations.forEach((education) => {
        educationList.appendChild(createNode(
          'li',
          '',
          `${education.degree || 'Education'} - ${education.institution || 'Institution not set'}${education.year ? ` | ${education.year}` : ''}`,
        ));
      });
    }
    educationCard.appendChild(educationList);

    const skillsCard = createNode('div', 'resume-review-item');
    skillsCard.append(
      createNode('h4', '', 'Skills and Target Role'),
      createNode('p', '', `Target role: ${state.targetRole || 'General role'}`),
      createNode('p', '', `Skills: ${parseCommaList(state.skills).join(', ') || 'None added yet'}`),
      createNode('p', '', `Certifications: ${state.certifications.filter(Boolean).join(', ') || 'None added yet'}`),
    );

    if (!isSectionEnabled(state, 'projects')) {
      projectList.innerHTML = '';
      projectList.appendChild(createNode('li', '', 'Projects hidden from resume.'));
    }
    if (!isSectionEnabled(state, 'certifications')) {
      skillsCard.querySelectorAll('p').forEach((paragraph) => {
        if (paragraph.textContent.startsWith('Certifications:')) {
          paragraph.textContent = 'Certifications: hidden from resume';
        }
      });
    }

    mount.append(personalCard, summaryCard, experienceCard, projectCard, educationCard, skillsCard);
  }

  function updateOptionalSectionUi(sectionKey) {
    const enabled = isSectionEnabled(state, sectionKey);
    const isProjects = sectionKey === 'projects';
    const fields = isProjects ? projectFields : certificationFields;
    const note = isProjects ? projectsDisabledNote : certificationsDisabledNote;
    const button = isProjects ? toggleProjectsButton : toggleCertificationsButton;
    if (fields) fields.hidden = !enabled;
    if (note) note.hidden = enabled;
    if (button) {
      button.textContent = enabled ? 'Remove section' : `+ Add ${isProjects ? 'projects' : 'certifications'}`;
      button.classList.toggle('rb-section-toggle--danger', enabled);
      button.classList.toggle('rb-section-toggle--add', !enabled);
      button.setAttribute('aria-pressed', String(enabled));
    }
  }

  function toggleOptionalSection(sectionKey) {
    state.sectionsEnabled = normalizeSectionsEnabled(state.sectionsEnabled);
    state.sectionsEnabled[sectionKey] = !isSectionEnabled(state, sectionKey);
    if (sectionKey === 'projects' && state.sectionsEnabled.projects && !state.projects.length) {
      state.projects = [createEmptyProject()];
      renderProjectList();
    }
    if (sectionKey === 'certifications' && state.sectionsEnabled.certifications && !state.certifications.length) {
      state.certifications = [createEmptyCertification()];
      renderCertificationList();
    }
    updateOptionalSectionUi(sectionKey);
    renderBuilderDerivedViews();
    markBuilderContentChanged();
    saveToStorage(state);
    refreshLiveScore();
    updateCompletionBar(state);
  }

  function renderSectionOrderList() {
    clearNode(sectionOrderList);
    if (!sectionOrderList) return;
    state.sectionOrder = normalizeSectionOrder(state.sectionOrder);
    state.sectionOrder.forEach((key, index) => {
      const row = createNode('div', 'rb-section-order-row');
      const hidden = (key === 'projects' || key === 'certifications') && !isSectionEnabled(state, key);
      row.classList.toggle('is-hidden-section', hidden);
      const label = createNode('span', 'rb-section-order-label', SECTION_LABELS[key] || key);
      if (hidden) label.appendChild(createNode('span', 'rb-section-order-badge', 'Hidden'));
      const actions = createNode('span', 'rb-section-order-actions');
      const up = createNode('button', 'rb-section-order-btn', '\u2191');
      const down = createNode('button', 'rb-section-order-btn', '\u2193');
      up.type = 'button';
      down.type = 'button';
      up.dataset.sectionOrderMove = 'up';
      down.dataset.sectionOrderMove = 'down';
      up.dataset.sectionKey = key;
      down.dataset.sectionKey = key;
      up.disabled = index === 0;
      down.disabled = index === state.sectionOrder.length - 1;
      up.setAttribute('aria-label', `Move ${SECTION_LABELS[key]} up`);
      down.setAttribute('aria-label', `Move ${SECTION_LABELS[key]} down`);
      actions.append(up, down);
      row.append(label, actions);
      sectionOrderList.appendChild(row);
    });
  }

  function moveSectionOrderItem(key, direction) {
    const order = normalizeSectionOrder(state.sectionOrder);
    const index = order.indexOf(key);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= order.length) return;
    [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
    state.sectionOrder = order;
    renderSectionOrderList();
    markBuilderContentChanged();
    saveToStorage(state);
  }

  function renderBuilderDerivedViews() {
    renderPillPreview(qs(root, '#rb-skill-pills'), parseCommaList(state.skills));
    renderReviewSummary();
    renderSectionOrderList();
    updateOptionalSectionUi('projects');
    updateOptionalSectionUi('certifications');
    updateCoverLetterResumeNotice();
  }

  function populateFormFromState() {
    [
      ['#rb-name', state.personal.name],
      ['#rb-email', state.personal.email],
      ['#rb-phone', state.personal.phone],
      ['#rb-linkedin', state.personal.linkedin],
      ['#rb-location', state.personal.location],
      ['#rb-portfolio', state.personal.portfolio],
      ['#rb-summary', state.summary],
      ['#rb-skills', state.skills],
      ['#rb-target-role', state.targetRole],
    ].forEach(([selector, value]) => {
      const input = qs(root, selector);
      if (input) input.value = value || '';
    });

    renderExperienceList();
    renderEducationList();
    renderProjectList();
    renderCertificationList();
    renderBuilderDerivedViews();
    applyTemplate(state.template, { persist: false });
  }

  function updateBuilderFieldBindings() {
    [
      ['#rb-name', ['personal', 'name']],
      ['#rb-email', ['personal', 'email']],
      ['#rb-phone', ['personal', 'phone']],
      ['#rb-linkedin', ['personal', 'linkedin']],
      ['#rb-location', ['personal', 'location']],
      ['#rb-portfolio', ['personal', 'portfolio']],
      ['#rb-summary', ['root', 'summary']],
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
        if (selector === '#rb-target-role') {
          debouncedDetectIndustry();
        } else if (selector === '#rb-skills') {
          renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
        }
        markBuilderContentChanged();
        debouncedSave();
      });
    });
  }

  function setImportExpanded(isExpanded) {
    if (!importCard || !importCollapsed || !importExpanded) return;
    importCard.dataset.state = isExpanded ? 'expanded' : 'collapsed';
    importCollapsed.hidden = isExpanded;
    importExpanded.hidden = !isExpanded;
    if (!isExpanded) {
      setImportError('');
      setImportProcessing(false);
      if (importFileInput) importFileInput.value = '';
    } else {
      syncImportCreditState();
    }
  }

  function setImportError(message = '') {
    if (!importError) return;
    importError.textContent = message;
    importError.hidden = !message;
  }

  function setImportSuccess(summary) {
    if (!importSuccess) return;
    window.clearTimeout(importSuccessTimer);
    const found = summary?.fieldsPopulated?.length
      ? summary.fieldsPopulated.join(', ')
      : 'resume details';
    importSuccess.innerHTML = `<strong>&#10003; Resume imported!</strong> We found: ${escapeHtml(found)}. Review each step and make any corrections.`;
    importSuccess.hidden = false;
    importSuccessTimer = window.setTimeout(() => {
      importSuccess.hidden = true;
    }, 6000);
  }

  function setImportProcessing(isProcessing, file = null) {
    importBusy = isProcessing;
    if (importProcessing) importProcessing.hidden = !isProcessing;
    if (importFileName) importFileName.textContent = file ? `Processing: ${file.name}` : '';
    importCard?.classList.toggle('is-processing', isProcessing);
    if (importCancelButton) {
      importCancelButton.disabled = isProcessing;
      importCancelButton.setAttribute('aria-disabled', String(isProcessing));
    }
    if (!isProcessing) {
      setImportStep('');
    }
    syncImportCreditState();
  }

  function setImportStep(activeStep) {
    const order = ['reading', 'extracting', 'parsing', 'populating'];
    const activeIndex = order.indexOf(activeStep);
    importSteps?.querySelectorAll('[data-import-step]').forEach((item) => {
      const itemIndex = order.indexOf(item.dataset.importStep);
      item.classList.toggle('is-active', itemIndex === activeIndex);
      item.classList.toggle('is-complete', activeIndex !== -1 && itemIndex < activeIndex);
    });
  }

  function getRemainingCreditsSafe() {
    try {
      return getRemaining(TOOL_KEY);
    } catch (_) {
      return 15;
    }
  }

  function syncImportCreditState(remaining = getRemainingCreditsSafe()) {
    const noCredits = Number.isFinite(remaining) && remaining <= 0;
    const disabled = importBusy || noCredits;
    importDropzone?.classList.toggle('is-disabled', disabled);
    if (importBrowseButton) {
      importBrowseButton.disabled = disabled;
      importBrowseButton.setAttribute('aria-disabled', String(disabled));
    }
    if (importFileInput) {
      importFileInput.disabled = disabled;
    }
    if (noCredits && importExpanded && !importExpanded.hidden) {
      setImportError(`No AI credits remain today. Resume import will be available again in ${getQuotaResetCountdown()}.`);
    }
  }

  function validateResumeImportFile(file) {
    if (!file) {
      throw new Error('Choose a PDF, DOCX, or TXT file to import.');
    }
    if (file.size > RESUME_IMPORT_MAX_BYTES) {
      throw new Error('This file is larger than 5MB. Please upload a smaller resume file.');
    }

    const name = String(file.name || '').toLowerCase();
    const type = String(file.type || '').toLowerCase();
    const supported = type === 'application/pdf'
      || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || type === 'text/plain'
      || name.endsWith('.pdf')
      || name.endsWith('.docx')
      || name.endsWith('.txt');
    if (!supported) {
      throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }
  }

  function hasAnyResumeValue(item) {
    return Object.values(item || {}).some((value) => String(value || '').trim());
  }

  function hasMeaningfulBuilderData() {
    return Boolean(
      state.personal.name.trim()
      || state.summary.trim()
      || state.skills.trim()
      || state.targetRole.trim()
      || state.experiences.some(hasAnyResumeValue)
      || state.educations.some(hasAnyResumeValue)
      || state.projects.some(hasAnyResumeValue)
      || state.certifications.some((certification) => String(certification || '').trim()),
    );
  }

  function resetStateForImport() {
    const template = state.template;
    state.generatedResume = '';
    state.personal = {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      location: '',
      portfolio: '',
    };
    state.summary = '';
    state.experiences = [createEmptyExperience()];
    state.educations = [createEmptyEducation()];
    state.projects = [createEmptyProject()];
    state.skills = '';
    state.targetRole = '';
    state.template = template;
    state.atsAnalysisResult = null;
    state.coverLetter = '';
    state.coverLetterSettings = createDefaultCoverLetterSettings();
    state.sectionsEnabled = createDefaultSectionsEnabled();
    state.sectionOrder = normalizeSectionOrder();
    state.certifications = [createEmptyCertification()];
    state.suggestionsDismissed = false;
    lastDetectedIndustry = null;
  }

  function assignImportedString(currentValue, nextValue, assign, label, summary, overwrite) {
    const value = String(nextValue || '').trim();
    const existing = String(currentValue || '').trim();
    if (!value || (!overwrite && existing)) return;
    assign(value);
    summary.fieldsPopulated.push(label);
  }

  function buildImportSummary() {
    const fieldsPopulated = [];
    const fieldsEmpty = [];
    const filledExperiences = state.experiences.filter(hasAnyResumeValue);
    const filledEducations = state.educations.filter(hasAnyResumeValue);
    const filledProjects = state.projects.filter(hasAnyResumeValue);
    const filledCertifications = state.certifications.filter((item) => String(item || '').trim());
    const skillsCount = parseCommaList(state.skills).length;

    if (state.personal.name) fieldsPopulated.push('name');
    else fieldsEmpty.push('name');
    if (state.summary) fieldsPopulated.push('summary');
    if (filledExperiences.length) fieldsPopulated.push(`${filledExperiences.length} work experience${filledExperiences.length === 1 ? '' : 's'}`);
    else fieldsEmpty.push('work experience');
    if (filledEducations.length) fieldsPopulated.push(`${filledEducations.length} education entr${filledEducations.length === 1 ? 'y' : 'ies'}`);
    if (skillsCount) fieldsPopulated.push(`${skillsCount} skills`);
    else fieldsEmpty.push('skills');
    if (filledProjects.length) fieldsPopulated.push(`${filledProjects.length} project${filledProjects.length === 1 ? '' : 's'}`);
    if (filledCertifications.length) fieldsPopulated.push(`${filledCertifications.length} certification${filledCertifications.length === 1 ? '' : 's'}`);

    return { fieldsPopulated, fieldsEmpty };
  }

  function mergeParsedResumeData(parsed, overwrite = false) {
    const summary = { fieldsPopulated: [], fieldsEmpty: [] };
    if (overwrite) resetStateForImport();

    const personal = parsed?.personal && typeof parsed.personal === 'object' ? parsed.personal : {};
    assignImportedString(state.personal.name, personal.name, (value) => { state.personal.name = value; }, 'name', summary, overwrite);
    assignImportedString(state.personal.email, personal.email, (value) => { state.personal.email = value; }, 'email', summary, overwrite);
    assignImportedString(state.personal.phone, personal.phone, (value) => { state.personal.phone = value; }, 'phone', summary, overwrite);
    assignImportedString(state.personal.linkedin, personal.linkedin, (value) => { state.personal.linkedin = value; }, 'LinkedIn', summary, overwrite);
    assignImportedString(state.personal.location, personal.location, (value) => { state.personal.location = value; }, 'location', summary, overwrite);
    assignImportedString(state.personal.portfolio, personal.portfolio, (value) => { state.personal.portfolio = value; }, 'portfolio', summary, overwrite);
    assignImportedString(state.targetRole, parsed?.targetRole, (value) => { state.targetRole = value; }, 'target role', summary, overwrite);
    assignImportedString(state.summary, parsed?.summary, (value) => { state.summary = value; }, 'summary', summary, overwrite);
    assignImportedString(state.skills, parsed?.skills, (value) => { state.skills = normalizeSkillsText(value); }, 'skills', summary, overwrite);

    const experiences = Array.isArray(parsed?.experiences)
      ? parsed.experiences.map(normalizeSavedExperience).filter(hasAnyResumeValue).slice(0, 5)
      : [];
    if (experiences.length) {
      state.experiences = experiences;
      summary.fieldsPopulated.push(`${experiences.length} work experience${experiences.length === 1 ? '' : 's'}`);
    } else if (overwrite) {
      state.experiences = [createEmptyExperience()];
    }

    const educations = Array.isArray(parsed?.educations)
      ? parsed.educations.map(normalizeSavedEducation).filter(hasAnyResumeValue).slice(0, 3)
      : [];
    if (educations.length) {
      state.educations = educations;
      summary.fieldsPopulated.push(`${educations.length} education entr${educations.length === 1 ? 'y' : 'ies'}`);
    } else if (overwrite) {
      state.educations = [createEmptyEducation()];
    }

    const projects = Array.isArray(parsed?.projects)
      ? parsed.projects.map(normalizeSavedProject).filter(hasAnyResumeValue).slice(0, 5)
      : [];
    if (projects.length) {
      state.projects = projects;
      summary.fieldsPopulated.push(`${projects.length} project${projects.length === 1 ? '' : 's'}`);
    } else if (overwrite) {
      state.projects = [createEmptyProject()];
    }

    const certifications = Array.isArray(parsed?.certifications)
      ? parsed.certifications.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 10)
      : [];
    if (certifications.length) {
      state.certifications = certifications;
      summary.fieldsPopulated.push(`${certifications.length} certification${certifications.length === 1 ? '' : 's'}`);
    } else if (overwrite) {
      state.certifications = [createEmptyCertification()];
    }

    state.generatedResume = '';
    state.atsAnalysisResult = null;
    state.coverLetter = '';
    renderFormattedPreview('');
    renderCoverLetterPreview('', state.coverLetterSettings);
    previewCount.textContent = '0 chars';
    previewNote.textContent = 'ATS note pending';
    syncExportButtons();
    populateFormFromState();
    saveToStorage(state);
    applyTemplate(state.template);
    setStep(1);
    refreshLiveScore();
    updateCompletionBar(state);
    renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
    return summary.fieldsPopulated.length ? summary : buildImportSummary();
  }

  function parseImportJsonResponse(text) {
    const cleaned = String(text || '').replace(/```(?:json)?|```/gi, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Fall through to the tolerant parser used by other JSON AI flows.
    }
    const parsed = parsePossiblyWrappedJson(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  }

  async function parseResumeTextWithAI(rawText, overwrite = false) {
    try {
      const userContent = `Raw resume text:\n${rawText}`;
      const firstAttempt = await callAI({
        tool: TOOL_KEY,
        systemPrompt: RESUME_IMPORT_PROMPT,
        userContent,
        maxTokens: 1800,
        temperature: 0.1,
      });

      let parsed = parseImportJsonResponse(getAIResultText(firstAttempt));
      if (!parsed) {
        const retryAttempt = await callAI({
          tool: TOOL_KEY,
          systemPrompt: `${RESUME_IMPORT_PROMPT}\n\nCritical retry instruction: return only raw JSON, absolutely nothing else.`,
          userContent,
          maxTokens: 1800,
          temperature: 0,
          chargeQuota: false,
          skipModels: firstAttempt.model ? [firstAttempt.model] : [],
        });
        parsed = parseImportJsonResponse(getAIResultText(retryAttempt));
      }

      if (!parsed) {
        throw new Error('AI could not return clean structured data from this resume.');
      }

      setImportStep('populating');
      await delay(150);
      return mergeParsedResumeData(parsed, overwrite);
    } catch (error) {
      console.error('[Resume Import] AI parsing failed:', error);
      if (isRateLimitError(error)) {
        showRateLimitExhaustedState();
        throw new Error('Resume parsing failed because the daily AI limit was reached.');
      }
      if (isNetworkError(error)) {
        showToast(toastStack, 'Network error - check your connection and try importing again.', 'error');
        throw new Error('Resume parsing failed because the network request could not complete.');
      }
      showToast(toastStack, 'Resume parsing failed. The form is still available to fill manually.', 'error');
      throw error;
    }
  }

  async function processResumeImportFile(file) {
    if (importBusy) return;
    setImportError('');
    if (importSuccess) importSuccess.hidden = true;

    try {
      validateResumeImportFile(file);
      if (getRemainingCreditsSafe() <= 0) {
        showRateLimitExhaustedState();
        setImportError(`No AI credits remain today. Resume import will be available again in ${getQuotaResetCountdown()}.`);
        syncImportCreditState(0);
        return;
      }

      let overwrite = false;
      if (hasMeaningfulBuilderData()) {
        overwrite = window.confirm('You have existing data in the form. Importing will overwrite it. Continue?');
        if (!overwrite) {
          return;
        }
      }

      setImportProcessing(true, file);
      setImportStep('reading');
      await delay(120);
      setImportStep('extracting');
      const extractedText = await extractTextFromFile(file);
      setImportStep('parsing');
      const summary = await parseResumeTextWithAI(extractedText, overwrite);
      setImportProcessing(false);
      setImportExpanded(false);
      setImportSuccess(summary);
      showToast(toastStack, 'Resume imported. Review the populated fields before generating.', 'success');
    } catch (error) {
      console.error('[Resume Import]', error);
      setImportProcessing(false);
      if (isRateLimitError(error)) {
        showRateLimitExhaustedState();
        setImportError(`Daily AI limit reached. Resume import resets in ${getQuotaResetCountdown()}.`);
      } else if (isNetworkError(error)) {
        showToast(toastStack, 'Network error - check your connection and try the import again.', 'error');
        setImportError('Connection issue while importing. Check your internet and try again.');
      } else {
        setImportError(`Could not import this resume. ${error?.message || 'Try a different file, or start by filling the form manually.'}`);
      }
    } finally {
      if (importFileInput) importFileInput.value = '';
      updateQuotaUi();
    }
  }

  function renderExperienceList() {
    const mount = qs(root, '#rb-experience-list');
    clearNode(mount);
    state.experiences.forEach((experience, index) => {
      const card = createNode('div', 'resume-subcard rb-experience-card');
      card.dataset.experienceIndex = String(index);
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
        markBuilderContentChanged();
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
        input.dataset.experienceField = key;
        input.setAttribute('aria-label', `${labelText} for experience ${index + 1}`);
        input.addEventListener('input', () => {
          experience[key] = input.value;
          renderBuilderDerivedViews();
          markBuilderContentChanged();
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
        input.dataset.experienceField = key;
        input.setAttribute('aria-label', `Key achievement ${achievementIndex + 1} for experience ${index + 1}`);
        input.addEventListener('input', () => {
          experience[key] = input.value;
          renderBuilderDerivedViews();
          markBuilderContentChanged();
          debouncedSave();
        });
        field.append(label, input);
        card.appendChild(field);
      });

      const improveActions = createNode('div', 'rb-section-ai-actions rb-section-ai-actions--card');
      const improveButton = createNode('button', 'rb-improve-btn rb-improve-bullets-btn');
      improveButton.type = 'button';
      improveButton.dataset.experienceIndex = String(index);
      improveButton.setAttribute('aria-label', 'Improve bullet points with AI');
      improveButton.innerHTML = `
        <span class="rb-improve-btn__icon" aria-hidden="true">&#10022;</span>
        <span class="rb-improve-btn__label">Improve Bullets</span>
        <span class="rb-improve-btn__spinner" aria-hidden="true" hidden></span>`;
      improveActions.append(improveButton, createNode('span', 'rb-improve-btn__hint', 'Uses 1 AI credit'));
      card.appendChild(improveActions);

      mount.appendChild(card);
    });
    updateCreditsDisplay();
  }

  function renderEducationList() {
    const mount = qs(root, '#rb-education-list');
    clearNode(mount);
    state.educations.forEach((education, index) => {
      const card = createNode('div', 'resume-subcard');
      const head = createNode('div', 'resume-subcard-head');
      const title = createNode('strong', '', `Education ${index + 1}`);
      const remove = createNode('button', 'resume-remove-btn', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove education ${index + 1}`);
      remove.disabled = state.educations.length === 1;
      remove.addEventListener('click', () => {
        if (state.educations.length === 1) return;
        state.educations.splice(index, 1);
        renderEducationList();
        renderBuilderDerivedViews();
        markBuilderContentChanged();
        saveToStorage(state);
      });
      head.append(title, remove);
      card.appendChild(head);

      const grid = createNode('div', 'resume-form-grid two-col');
      [
        ['Degree', 'degree'],
        ['Institution', 'institution'],
        ['Year', 'year'],
        ['GPA (optional)', 'gpa'],
      ].forEach(([labelText, key]) => {
        const field = createNode('div', 'resume-field');
        const label = createNode('label', '', labelText);
        const input = document.createElement('input');
        input.type = 'text';
        input.value = education[key];
        input.setAttribute('aria-label', `${labelText} for education ${index + 1}`);
        input.addEventListener('input', () => {
          education[key] = input.value;
          renderBuilderDerivedViews();
          markBuilderContentChanged();
          debouncedSave();
        });
        field.append(label, input);
        grid.appendChild(field);
      });
      card.appendChild(grid);

      const field = createNode('div', 'resume-field');
      const label = createNode('label', '', 'Relevant courses (comma-separated)');
      const input = document.createElement('input');
      const pills = createNode('div', 'resume-pill-preview');
      input.type = 'text';
      input.value = education.courses;
      input.setAttribute('aria-label', `Relevant courses for education ${index + 1}`);
      input.addEventListener('input', () => {
        education.courses = input.value;
        renderPillPreview(pills, parseCommaList(education.courses));
        renderBuilderDerivedViews();
        markBuilderContentChanged();
        debouncedSave();
      });
      field.append(label, input, pills);
      card.appendChild(field);
      renderPillPreview(pills, parseCommaList(education.courses));

      mount.appendChild(card);
    });

    const addEducationButton = qs(root, '#rb-add-education');
    if (addEducationButton) {
      const atLimit = state.educations.length >= 3;
      addEducationButton.disabled = atLimit;
      addEducationButton.setAttribute('aria-disabled', String(atLimit));
    }
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
        markBuilderContentChanged();
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
          markBuilderContentChanged();
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
        markBuilderContentChanged();
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
        markBuilderContentChanged();
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
        markBuilderContentChanged();
        debouncedSave();
      });
      field.append(label, input);

      card.append(head, field);
      mount.appendChild(card);
    });
  }

  function scrollStepContainerIntoView() {
    if (!stepPanelsContainer) return;
    stepPanelsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const rect = stepPanelsContainer.getBoundingClientRect();
    const scrollTarget = window.scrollY + rect.top - 16;
    window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
  }

  function updateBackFab() {
    if (!fabBackButton) return;
    const showFab = state.currentStep === 5 && Boolean(String(state.generatedResume || '').trim());
    fabBackButton.classList.toggle('rb-fab-visible', showFab);
    fabBackButton.setAttribute('aria-hidden', String(!showFab));
  }

  function setStep(step) {
    const previousStep = state.currentStep;
    state.currentStep = Math.min(5, Math.max(1, step));
    const stepChanged = previousStep !== state.currentStep;
    let activePanel = null;
    root.querySelectorAll('[data-step-panel]').forEach((panel) => {
      const active = Number(panel.getAttribute('data-step-panel')) === state.currentStep;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
      if (active) {
        activePanel = panel;
        panel.classList.add('rb-step-entering');
        window.setTimeout(() => panel.classList.remove('rb-step-entering'), 210);
      }
    });
    root.querySelectorAll('[data-step-dot]').forEach((dot) => {
      const dotStep = Number(dot.getAttribute('data-step-dot'));
      const dotNumber = dot.querySelector('span');
      const stateName = dotStep < state.currentStep ? 'done' : dotStep === state.currentStep ? 'current' : 'upcoming';
      dot.classList.toggle('is-active', dotStep === state.currentStep);
      dot.classList.toggle('is-complete', dotStep < state.currentStep);
      dot.dataset.stepState = stateName;
      dot.setAttribute('aria-current', dotStep === state.currentStep ? 'step' : 'false');
      if (dotNumber) dotNumber.textContent = dotStep < state.currentStep ? '\u2713' : String(dotStep);
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
    renderSectionOrderList();
    refreshLiveScore();
    updateCompletionBar(state);
    updateBackFab();

    if (activePanel) {
      const focusTarget = activePanel.querySelector('input, textarea, select, button:not([disabled])');
      if (focusTarget && state.currentStep !== 5) {
        window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
      }
      if (stepChanged) {
        window.requestAnimationFrame(scrollStepContainerIntoView);
      }
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

  function isTypingTarget(target) {
    const tagName = target?.tagName;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || Boolean(target?.isContentEditable);
  }

  function handleBuilderKeyboardShortcuts(event) {
    const target = event.target;
    const typing = isTypingTarget(target);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      if (state.generatedResume && pdfButton && !pdfButton.disabled) {
        event.preventDefault();
        pdfButton.click();
      }
      return;
    }

    if (typing) return;

    if (event.key === 'Escape' && activeMobileBuilderView === 'score') {
      event.preventDefault();
      setMobileBuilderView('edit');
      return;
    }

    if (event.key === 'ArrowRight' && activeMainTab === 'builder' && state.currentStep < 5) {
      event.preventDefault();
      if (validateCurrentStep()) setStep(state.currentStep + 1);
      return;
    }

    if (event.key === 'ArrowLeft' && activeMainTab === 'builder' && state.currentStep > 1) {
      event.preventDefault();
      setStep(state.currentStep - 1);
      return;
    }

    if (event.key === 'Enter' && event.ctrlKey && activeMainTab === 'builder' && state.currentStep === 5 && generateButton && !generateButton.disabled) {
      event.preventDefault();
      generateButton.click();
    }
  }

  function getTargetRoleValue() {
    const targetInput = qs(root, '#rb-target-role');
    const targetRole = String(targetInput?.value || state.targetRole || '').trim();
    state.targetRole = targetRole;
    return targetRole || 'General professional role';
  }

  function readExperienceCardField(card, key, fallback = '') {
    return String(card?.querySelector(`[data-experience-field="${key}"]`)?.value ?? fallback ?? '').trim();
  }

  function writeExperienceCardField(card, key, value) {
    const input = card?.querySelector(`[data-experience-field="${key}"]`);
    if (input) input.value = value || '';
  }

  async function improveSummaryWithAI() {
    const input = qs(root, '#rb-summary');
    const currentSummary = String(input?.value || state.summary || '').trim();

    if (currentSummary.length < 10) {
      showToast(toastStack, 'Please write a basic summary first, then AI can improve it.', 'info');
      return;
    }
    if (!guardAiCredits()) return;

    const btn = improveSummaryButton;
    cacheImproveButtonLabel(btn, 'Improve with AI');
    setImproveBtnLoading(btn, true);

    try {
      const result = await callAI({
        tool: TOOL_KEY,
        systemPrompt: IMPROVE_SUMMARY_PROMPT,
        userContent: `Target Role: ${getTargetRoleValue()}\n\nCurrent Summary:\n${currentSummary}`,
        maxTokens: 350,
        temperature: 0.4,
      });
      const improved = getAIResultText(result);
      if (!improved) throw new Error('The AI returned an empty summary.');

      if (input) input.value = improved;
      state.summary = improved;
      renderBuilderDerivedViews();
      state.atsAnalysisResult = null;
      refreshLiveScore();
      updateCompletionBar(state);
      debouncedSave();
      if (btn) btn.dataset.flashDone = 'true';
      showToast(toastStack, 'Summary improved! Review the changes above.', 'success');
    } catch (error) {
      console.error('[Resume Builder] Summary improvement failed:', error);
      handleAiActionError(error, 'Summary improvement failed. Check your AI credits or try again in a moment.');
    } finally {
      setImproveBtnLoading(btn, false);
      if (btn?.dataset.flashDone === 'true') {
        delete btn.dataset.flashDone;
        flashImproveButtonDone(btn);
      }
      updateQuotaUi();
      refreshLiveScore();
      updateCompletionBar(state);
    }
  }

  async function improveExperienceBulletsWithAI(experienceIndex, triggerButton = null) {
    const experience = state.experiences[experienceIndex];
    if (!experience) return;

    const card = experienceContainer?.querySelector(`[data-experience-index="${experienceIndex}"]`);
    const bullets = ['achievement1', 'achievement2', 'achievement3']
      .map((key) => readExperienceCardField(card, key, experience[key]))
      .filter(Boolean);
    const totalWords = bullets.join(' ').split(/\s+/).filter(Boolean).length;

    if (!bullets.length || totalWords < 3) {
      showToast(toastStack, 'Add at least one achievement first, then AI can improve it.', 'info');
      return;
    }
    if (!guardAiCredits()) return;

    const jobTitle = readExperienceCardField(card, 'jobTitle', experience.jobTitle);
    const company = readExperienceCardField(card, 'company', experience.company);
    const duration = readExperienceCardField(card, 'duration', experience.duration);
    experience.jobTitle = jobTitle;
    experience.company = company;
    experience.duration = duration;

    const btn = triggerButton || card?.querySelector('.rb-improve-bullets-btn');
    cacheImproveButtonLabel(btn, 'Improve Bullets');
    setImproveBtnLoading(btn, true);

    try {
      const result = await callAI({
        tool: TOOL_KEY,
        systemPrompt: IMPROVE_BULLETS_PROMPT,
        userContent: `Job Title: ${jobTitle}\nCompany: ${company}\n\nCurrent Bullets:\n${bullets.map((bullet, index) => `${index + 1}. ${bullet}`).join('\n')}`,
        maxTokens: 400,
        temperature: 0.35,
      });
      const improvedBullets = parseImprovedBulletResponse(getAIResultText(result)).slice(0, 3);
      if (!improvedBullets.length) throw new Error('The AI returned no usable bullets.');

      const currentExperience = state.experiences[experienceIndex];
      const currentCard = experienceContainer?.querySelector(`[data-experience-index="${experienceIndex}"]`);
      if (currentExperience !== experience || !currentCard) {
        throw new Error('This experience changed before the AI response completed.');
      }

      ['achievement1', 'achievement2', 'achievement3'].forEach((key, index) => {
        const value = improvedBullets[index] || '';
        writeExperienceCardField(currentCard, key, value);
        experience[key] = value;
      });
      renderBuilderDerivedViews();
      state.atsAnalysisResult = null;
      refreshLiveScore();
      updateCompletionBar(state);
      debouncedSave();
      if (btn) btn.dataset.flashDone = 'true';
      showToast(toastStack, 'Bullets improved! Review the changes above.', 'success');
    } catch (error) {
      console.error('[Resume Builder] Bullet improvement failed:', error);
      handleAiActionError(error, 'Bullet improvement failed. Your original bullets are unchanged.');
    } finally {
      setImproveBtnLoading(btn, false);
      if (btn?.dataset.flashDone === 'true') {
        delete btn.dataset.flashDone;
        flashImproveButtonDone(btn);
      }
      updateQuotaUi();
      refreshLiveScore();
      updateCompletionBar(state);
    }
  }

  async function improveSkillsWithAI() {
    const input = qs(root, '#rb-skills');
    const currentSkills = String(input?.value || state.skills || '').trim();

    if (currentSkills.length < 3) {
      showToast(toastStack, 'Add some skills first, then AI can organize and enhance them.', 'info');
      return;
    }
    if (!guardAiCredits()) return;

    const btn = improveSkillsButton;
    cacheImproveButtonLabel(btn, 'Optimize Skills');
    setImproveBtnLoading(btn, true);

    try {
      const result = await callAI({
        tool: TOOL_KEY,
        systemPrompt: IMPROVE_SKILLS_PROMPT,
        userContent: `Target Role: ${getTargetRoleValue()}\n\nCurrent Skills:\n${currentSkills}`,
        maxTokens: 300,
        temperature: 0.3,
      });
      const improved = normalizeSkillsText(getAIResultText(result));
      if (!improved) throw new Error('The AI returned an empty skills response.');

      if (input) input.value = improved;
      state.skills = improved;
      renderBuilderDerivedViews();
      state.atsAnalysisResult = null;
      refreshLiveScore();
      updateCompletionBar(state);
      renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
      debouncedSave();
      if (btn) btn.dataset.flashDone = 'true';
      showToast(toastStack, 'Skills optimized! Review the cleaned keyword list above.', 'success');
    } catch (error) {
      console.error('[Resume Builder] Skills improvement failed:', error);
      handleAiActionError(error, 'Skills optimization failed. Your original skills list is unchanged.');
    } finally {
      setImproveBtnLoading(btn, false);
      if (btn?.dataset.flashDone === 'true') {
        delete btn.dataset.flashDone;
        flashImproveButtonDone(btn);
      }
      updateQuotaUi();
      refreshLiveScore();
      updateCompletionBar(state);
    }
  }

  function setScoreJdFormVisible(isVisible) {
    if (!scoreJdForm || !scoreAnalyzeToggle) return;
    scoreJdForm.hidden = !isVisible;
    scoreAnalyzeToggle.setAttribute('aria-expanded', String(isVisible));
    if (isVisible) {
      window.requestAnimationFrame(() => scoreJdInput?.focus({ preventScroll: true }));
    }
  }

  function handleScoreAnalyzeToggle() {
    if (!String(state.generatedResume || '').trim()) {
      showToast(toastStack, 'Generate your resume first, then run the full analysis.', 'info');
      return;
    }
    if (getRemainingCreditsSafe() <= 0) {
      showRateLimitExhaustedState();
      if (scoreFullDescription) {
        scoreFullDescription.textContent = 'No AI credits remain today, but the local score still updates for structure and completeness.';
      }
      return;
    }
    setScoreJdFormVisible(scoreJdForm?.hidden !== false);
  }

  async function runBuilderAtsEnrichment() {
    if (!String(state.generatedResume || '').trim()) {
      showToast(toastStack, 'Generate your resume first, then run the full analysis.', 'info');
      return;
    }
    if (!guardAiCredits()) return;

    const jobDescription = String(scoreJdInput?.value || '').trim();
    if (jobDescription.length < 20) {
      showToast(toastStack, 'Paste a job description first for a tailored ATS analysis.', 'info');
      return;
    }

    const btn = scoreRunAiButton;
    cacheImproveButtonLabel(btn, 'Run Analysis ->');
    if (btn) btn.dataset.loadingLabel = 'Analyzing...';
    setImproveBtnLoading(btn, true);

    try {
      const userContent = `Resume:\n${state.generatedResume}\n\nJob Description:\n${jobDescription}`;
      const firstAttempt = await callAI({
        tool: TOOL_KEY,
        systemPrompt: ATS_SYSTEM_PROMPT,
        userContent,
        maxTokens: 1800,
        temperature: 0.2,
      });

      let parsed = parsePossiblyWrappedJson(getAIResultText(firstAttempt));
      if (!parsed) {
        const retryAttempt = await callAI({
          tool: TOOL_KEY,
          systemPrompt: ATS_SYSTEM_PROMPT,
          userContent,
          maxTokens: 1800,
          temperature: 0.15,
          chargeQuota: false,
          skipModels: firstAttempt.model ? [firstAttempt.model] : [],
        });
        parsed = parsePossiblyWrappedJson(getAIResultText(retryAttempt));
      }

      if (!parsed) {
        throw new Error('AI returned unexpected format. Please retry.');
      }

      state.atsAnalysisResult = sanitizeAnalysisPayload(parsed);
      saveToStorage(state);
      refreshLiveScore();
      updateCompletionBar(state);
      setScoreJdFormVisible(false);
      showToast(toastStack, 'Job description analysis complete. Review the score and keyword gaps.', 'success');
    } catch (error) {
      console.error('[Resume Builder] ATS enrichment failed:', error);
      handleAiActionError(error, 'Job description analysis failed. Your local ATS score is still available.');
    } finally {
      setImproveBtnLoading(btn, false);
      updateQuotaUi();
      refreshLiveScore();
      updateCompletionBar(state);
    }
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
    if (!guardAiCredits()) return;

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
      if (isRateLimitError(error)) {
        setBanner(atsBanner, `Daily AI limit reached. Resets in ${getQuotaResetCountdown()}.`);
        showRateLimitExhaustedState();
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
      setButtonLoading(atsButton, false, getQuotaButtonLabel(atsBaseLabel, TOOL_KEY), 'Analyzing...');
      updateQuotaUi();
    }
  }

  async function runResumeBuilder() {
    if (!state.personal.name.trim()) {
      setBanner(builderBanner, 'Add your full name before generating the resume draft.');
      showToast(toastStack, 'Add your full name before generating the resume.', 'error');
      return;
    }
    if (!guardAiCredits()) return;

    builderBusy = true;
    state.generatedResume = '';
    state.atsAnalysisResult = null;
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
      updateResumePreviewMeta();
      previewWrap.classList.remove('hidden');
      if (isMobileLayout()) setMobileBuilderView('preview');
      syncExportButtons();
      refreshLiveScore();
      updateCompletionBar(state);
      updateBackFab();
      saveToStorage(state);
      setBanner(builderBanner, 'Resume draft ready. Review every metric, date, and claim before you use it.', 'success');
    } catch (error) {
      const message = String(error?.message || error || '');
      if (isRateLimitError(error)) {
        setBanner(builderBanner, `Daily AI limit reached. Resets in ${getQuotaResetCountdown()}.`);
        showRateLimitExhaustedState();
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
      setButtonLoading(generateButton, false, `\u26A1 ${getQuotaButtonLabel(builderBaseLabel, TOOL_KEY)}`, 'Generating...');
      updateQuotaUi();
      refreshLiveScore();
      updateCompletionBar(state);
    }
  }

  function resetBuilderState() {
    state.currentStep = 1;
    state.lastReport = null;
    state.generatedResume = '';
    state.personal = {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      location: '',
      portfolio: '',
    };
    state.summary = '';
    state.experiences = [createEmptyExperience()];
    state.educations = [createEmptyEducation()];
    state.projects = [];
    state.skills = '';
    state.targetRole = '';
    state.template = 'classic';
    state.atsAnalysisResult = null;
    state.coverLetter = '';
    state.coverLetterSettings = createDefaultCoverLetterSettings();
    state.sectionsEnabled = createDefaultSectionsEnabled();
    state.sectionOrder = normalizeSectionOrder();
    state.lastEditedAt = null;
    state.certifications = [createEmptyCertification()];
    state.suggestionsDismissed = false;
    lastDetectedIndustry = null;
    clearSavedDraft();
    populateFormFromState();
    previewWrap.classList.remove('hidden');
    previewCount.textContent = '0 chars';
    previewNote.textContent = 'ATS note pending';
    renderFormattedPreview('');
    renderCoverLetterPreview('', state.coverLetterSettings);
    populateCoverLetterFormFromState();
    if (shareFallback) {
      shareFallback.hidden = true;
      shareFallback.classList.remove('rb-share-fallback--visible');
    }
    applyTemplate('classic', { persist: false });
    syncExportButtons();
    setStep(1);
    setMobileBuilderView('edit');
    refreshLiveScore();
    updateWordCountDisplay(state);
    updateCompletionBar(state);
    renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
    updateBackFab();
    window.clearTimeout(autosaveSettleTimer);
    window.clearInterval(autosaveRefreshTimer);
    const autosaveIndicator = qs(root, '#rb-autosave-indicator');
    if (autosaveIndicator) {
      autosaveIndicator.classList.remove('rb-autosave--visible', 'rb-autosave-indicator--persistent');
      autosaveIndicator.textContent = '';
    }
    setBanner(builderBanner, 'Draft cleared. Start fresh whenever you are ready.', 'success');
    showToast(toastStack, 'Draft cleared.', 'success');
  }

  qs(root, '#rb-add-experience').addEventListener('click', () => {
    if (state.experiences.length >= 5) {
      showToast(toastStack, 'You can add up to 5 experience blocks.', 'info');
      return;
    }
    state.experiences.push(createEmptyExperience());
    renderExperienceList();
    renderBuilderDerivedViews();
    markBuilderContentChanged();
    saveToStorage(state);
  });

  qs(root, '#rb-add-education').addEventListener('click', () => {
    if (state.educations.length >= 3) {
      showToast(toastStack, 'You can add up to 3 education entries.', 'info');
      return;
    }
    state.educations.push(createEmptyEducation());
    renderEducationList();
    renderBuilderDerivedViews();
    markBuilderContentChanged();
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
    markBuilderContentChanged();
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
    markBuilderContentChanged();
    saveToStorage(state);
  });

  qs(root, '#rb-prev').addEventListener('click', () => setStep(state.currentStep - 1));
  qs(root, '#rb-next').addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    setStep(state.currentStep + 1);
  });

  atsButton.addEventListener('click', runAtsAnalysis);
  generateButton.addEventListener('click', runResumeBuilder);
  if (improveSummaryButton) improveSummaryButton.addEventListener('click', improveSummaryWithAI);
  if (improveSkillsButton) improveSkillsButton.addEventListener('click', improveSkillsWithAI);
  if (scoreAnalyzeToggle) scoreAnalyzeToggle.addEventListener('click', handleScoreAnalyzeToggle);
  if (scoreRunAiButton) scoreRunAiButton.addEventListener('click', runBuilderAtsEnrichment);
  if (coverLetterGenerateButton) coverLetterGenerateButton.addEventListener('click', generateCoverLetter);
  if (coverLetterRegenerateButton) coverLetterRegenerateButton.addEventListener('click', generateCoverLetter);
  if (coverLetterCopyButton) coverLetterCopyButton.addEventListener('click', copyCoverLetter);
  if (coverLetterPdfButton) coverLetterPdfButton.addEventListener('click', printCoverLetter);
  if (coverLetterDocxButton) coverLetterDocxButton.addEventListener('click', downloadCoverLetterDOCX);
  if (experienceContainer) {
    experienceContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('.rb-improve-bullets-btn');
      if (!btn || !experienceContainer.contains(btn)) return;
      const index = Number.parseInt(btn.dataset.experienceIndex || '', 10);
      if (!Number.isFinite(index)) return;
      improveExperienceBulletsWithAI(index, btn);
    });
  }
  const templatePicker = qs(root, '#rb-template-picker');
  if (templatePicker) {
    templatePicker.addEventListener('click', (event) => {
      const button = event.target.closest('[data-resume-template]');
      if (!button || !templatePicker.contains(button)) return;
      applyTemplate(button.dataset.resumeTemplate);
    });
  }
  if (importToggleButton) {
    importToggleButton.addEventListener('click', () => {
      setImportExpanded(true);
    });
  }
  if (importCancelButton) {
    importCancelButton.addEventListener('click', () => {
      setImportExpanded(false);
    });
  }
  if (importBrowseButton && importFileInput) {
    importBrowseButton.addEventListener('click', () => {
      if (importBrowseButton.disabled) return;
      importFileInput.click();
    });
    importFileInput.addEventListener('change', () => {
      const file = importFileInput.files?.[0];
      processResumeImportFile(file);
    });
  }
  if (importDropzone) {
    importDropzone.addEventListener('click', (event) => {
      if (event.target.closest('button') || importBusy || importBrowseButton?.disabled) return;
      importFileInput?.click();
    });
    ['dragenter', 'dragover'].forEach((eventName) => {
      importDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (importBusy || importBrowseButton?.disabled) return;
        importDropzone.classList.add('is-active');
      });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
      importDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        importDropzone.classList.remove('is-active');
      });
    });
    importDropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0];
      processResumeImportFile(file);
    });
  }
  root.addEventListener('resume-tab-change', (event) => {
    activeMainTab = event.detail?.target || 'ats';
    if (activeMainTab === 'builder') {
      setMobileBuilderView(activeMobileBuilderView || 'edit');
    } else {
      returnNodeToOriginalPosition(previewWrap, previewOriginalPosition);
      returnNodeToOriginalPosition(scorePanelFull, scoreOriginalPosition);
      if (builderPanel) {
        builderPanel.classList.remove('rb-mobile-view-preview', 'rb-mobile-view-score');
        builderPanel.classList.add('rb-mobile-view-edit');
      }
    }
    updateMobileNavState();
  });
  if (mobileNav) {
    mobileNav.addEventListener('click', handleMobileNavClick);
  }
  if (toggleProjectsButton) {
    toggleProjectsButton.addEventListener('click', () => toggleOptionalSection('projects'));
  }
  if (toggleCertificationsButton) {
    toggleCertificationsButton.addEventListener('click', () => toggleOptionalSection('certifications'));
  }
  if (sectionOrderList) {
    sectionOrderList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-section-order-move]');
      if (!button || button.disabled) return;
      moveSectionOrderItem(button.dataset.sectionKey, button.dataset.sectionOrderMove);
    });
  }
  if (fabBackButton) {
    fabBackButton.addEventListener('click', () => setStep(4));
  }
  if (keywordPillsContainer) {
    keywordPillsContainer.addEventListener('click', (event) => {
      const pill = event.target.closest('.rb-kw-pill');
      if (!pill) return;
      addKeywordToSkills(pill.dataset.keyword);
    });
  }
  if (keywordDismissButton) {
    keywordDismissButton.addEventListener('click', () => {
      state.suggestionsDismissed = true;
      renderSuggestionPanel(detectIndustry(state.targetRole), getKeywordsForIndustry(detectIndustry(state.targetRole)));
      saveToStorage(state);
    });
  }
  if (keywordRestoreButton) {
    keywordRestoreButton.addEventListener('click', () => {
      state.suggestionsDismissed = false;
      renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
      saveToStorage(state);
    });
  }
  root.addEventListener('keydown', handleBuilderKeyboardShortcuts);
  window.addEventListener('resize', handleMobileViewportChange);
  if (pdfButton) pdfButton.addEventListener('click', downloadResumePDF);
  if (docxButton) docxButton.addEventListener('click', downloadResumeDOCX);
  if (printButton) printButton.addEventListener('click', printResume);
  if (clearDraftButton) {
    clearDraftButton.addEventListener('click', () => {
      const confirmed = window.confirm('Start fresh? This will clear all saved form data and cannot be undone.');
      if (!confirmed) return;
      resetBuilderState();
    });
  }

  copyReportButton.addEventListener('click', async () => {
    if (!state.lastReport) return;
    try {
      await copyText(buildReportMarkdown(state.lastReport), toastStack, 'ATS report copied to clipboard.');
    } catch (error) {
      console.error('[Resume Builder] ATS report copy failed:', error);
    }
  });

  downloadReportButton.addEventListener('click', () => {
    if (!state.lastReport) return;
    downloadText('tooliest-ats-report.txt', buildReportMarkdown(state.lastReport));
  });

  copyResumeButton.addEventListener('click', async () => {
    if (!state.generatedResume) return;
    try {
      await copyText(
        buildFormattedResumeText(state),
        toastStack,
        'Resume copied as formatted text! Remember to review before pasting to a job application.',
      );
    } catch (error) {
      console.error('[Resume Builder] Resume copy failed:', error);
    }
  });

  downloadResumeButton.addEventListener('click', () => {
    if (!state.generatedResume) return;
    downloadText('tooliest-resume.txt', state.generatedResume);
  });

  if (shareLinkButton) {
    shareLinkButton.addEventListener('click', copyShareLink);
  }

  bindCounter(atsResume, atsResumeCount, 5000, atsWarn, 4500);
  bindCounter(atsJob, atsJobCount, 3000, null, 2500);
  activeMainTab = root.querySelector('.resume-tab.is-active')?.dataset.tabTarget || 'ats';
  if (builderPanel) builderPanel.classList.add('rb-mobile-view-edit');
  updateMobileNavState();
  updateBuilderFieldBindings();
  initCoverLetterTab();
  populateFormFromState();
  applyTemplate(state.template, { persist: false });
  renderFormattedPreview(state.generatedResume);
  updateResumePreviewMeta();
  setStep(1);
  syncExportButtons();
  updateQuotaUi();
  refreshLiveScore();
  updateCompletionBar(state);
  renderCurrentIndustrySuggestions({ resetDismissedOnIndustryChange: false });
  updateBackFab();
  window.requestAnimationFrame(updateQuotaUi);
  window.requestAnimationFrame(() => {
    refreshLiveScore();
    updateCompletionBar(state);
  });
  window.setTimeout(updateQuotaUi, 250);
  if (sharedLoad.loaded) {
    window.setTimeout(() => {
      const suffix = sharedLoad.hadStoredDraft ? ' Your previous draft was not overwritten - start fresh or use the shared resume.' : '';
      showToast(toastStack, `\u2713 Resume loaded from shared link! Review the details and make it your own.${suffix}`, 'success');
    }, 400);
  } else if (wasRestored) {
    if (state.lastEditedAt) showSaveIndicator('saved', state);
    window.setTimeout(() => {
      showToast(toastStack, 'Draft restored - your previous work has been loaded.', 'info');
    }, 400);
  }
  } catch (error) {
    console.error('[Resume Builder Init]', error);
    showGlobalToast('Resume Builder could not initialize. Refresh the page and try again.', 'error');
  }
}
