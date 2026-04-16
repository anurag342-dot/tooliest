// ============================================
// TOOLIEST — Consent Preferences & Google Consent Mode v2
// ============================================
// This script manages GDPR-compliant consent preferences.
// Tooliest stores the user's choice in localStorage, while
// AdSense and analytics storage remain denied until the user
// explicitly accepts non-essential tracking.
// ============================================

(function () {
  'use strict';

  const CONSENT_KEY = 'tooliest_cookie_consent';
  const CONSENT_VERSION = '2';
  let releaseBannerFocus = null;

  // --- Google Consent Mode v2: set defaults as early as possible ---
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const gtag = window.gtag;

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
      // AdSense now loads in the shared page shells. Consent Mode keeps
      // ad/analytics storage denied by default until the user opts in.
    } else {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });
    }
  }

  function clearSavedConsent() {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch (e) { /* storage not available */ }
  }

  function getFocusableElements(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
  }

  function activateBannerFocusTrap(banner) {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleReject();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(banner);
      if (!focusable.length) {
        event.preventDefault();
        banner.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    banner.addEventListener('keydown', handleKeydown);
    requestAnimationFrame(() => {
      const focusable = getFocusableElements(banner);
      (focusable[0] || banner).focus();
    });

    return function releaseFocusTrap() {
      banner.removeEventListener('keydown', handleKeydown);
      previousFocus?.focus?.();
    };
  }

  function bindBannerActions() {
    const banner = document.getElementById('cookie-banner');
    if (!banner || banner.dataset.bound === 'true') return;

    document.getElementById('cookie-accept-btn')?.addEventListener('click', handleAccept);
    document.getElementById('cookie-reject-btn')?.addEventListener('click', handleReject);
    banner.dataset.bound = 'true';
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    document.body.classList.remove('cookie-banner-open');
    releaseBannerFocus?.();
    releaseBannerFocus = null;
    if (banner) {
      banner.classList.remove('banner-visible');
      banner.classList.add('banner-hidden');
      banner.setAttribute('aria-hidden', 'true');
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

      bindBannerActions();
      document.body.classList.add('cookie-banner-open');
      banner.classList.remove('banner-hidden', 'banner-visible');
      banner.setAttribute('aria-hidden', 'false');
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-modal', 'true');
      banner.tabIndex = -1;
      releaseBannerFocus?.();
      releaseBannerFocus = activateBannerFocusTrap(banner);

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
      clearSavedConsent();
      applyConsent(false);
      showBanner();
    },
    open: function () {
      showBanner();
    },
    getStatus: function () {
      return getSavedConsent();
    }
  };

})();
