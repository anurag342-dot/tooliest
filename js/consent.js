// ============================================
// TOOLIEST — Cookie Consent & Google Consent Mode v2
// ============================================
// This script manages GDPR-compliant cookie consent.
// AdSense and Analytics scripts are only activated after
// the user explicitly accepts non-essential cookies.
// ============================================

(function () {
  'use strict';

  const CONSENT_KEY = 'tooliest_cookie_consent';
  const CONSENT_VERSION = '2';

  // --- Google Consent Mode v2: set defaults BEFORE any tags load ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  // Default: deny everything until user decides
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 2000,
  });

  // --- Check existing consent ---
  function getSavedConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) { /* storage not available */ }
  }

  function applyConsent(accepted) {
    if (accepted) {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
      // Load AdSense if consent was given
      // (AdSense script tag is already in index.html, commented out for now)
      // When you have your publisher ID, uncomment the AdSense <script> in index.html
      // and this consent system will correctly gate it via Consent Mode v2.
    } else {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });
    }
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    document.body.classList.remove('cookie-banner-open');
    if (banner) {
      banner.classList.remove('banner-visible');
      banner.classList.add('banner-hidden');
      setTimeout(() => banner.remove(), 400);
    }
  }

  function handleAccept() {
    saveConsent(true);
    applyConsent(true);
    hideBanner();
  }

  function handleReject() {
    saveConsent(false);
    applyConsent(false);
    hideBanner();
  }

  function showBanner() {
    // Wait for DOM to be ready
    const initBanner = () => {
      const banner = document.getElementById('cookie-banner');
      if (!banner) return;

      document.body.classList.add('cookie-banner-open');
      document.getElementById('cookie-accept-btn')?.addEventListener('click', handleAccept);
      document.getElementById('cookie-reject-btn')?.addEventListener('click', handleReject);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          banner.classList.add('banner-visible');
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBanner);
    } else {
      initBanner();
    }
  }

  // --- Main logic ---
  const saved = getSavedConsent();

  if (saved && saved.version === CONSENT_VERSION) {
    // User has already chosen — apply their saved preference silently
    applyConsent(saved.accepted);
  } else {
    // No prior consent — show the banner
    showBanner();
  }

  // Expose a reset function for "manage cookies" link
  window.TooliestConsent = {
    reset: function () {
      localStorage.removeItem(CONSENT_KEY);
      // Re-inject banner
      location.reload();
    },
    getStatus: function () {
      return getSavedConsent();
    }
  };

})();
