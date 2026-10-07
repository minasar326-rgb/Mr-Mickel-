/**
 * Google Analytics 4 (GA4) Integration Suite for The Master LMS
 * 
 * To activate GA4 in production:
 * 1. Set VITE_GA_MEASUREMENT_ID in your .env file:
 *    VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
 * 
 * Or set window.GA_MEASUREMENT_ID before app init.
 * If no measurement ID is provided, tracking gracefully bypasses without any errors.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) || null;

let isInitialized = false;

export function initAnalytics() {
  if (typeof window === 'undefined' || isInitialized || !GA_ID) {
    return;
  }

  try {
    // Inject gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, {
      send_page_view: true,
      anonymize_ip: true
    });

    isInitialized = true;
    console.info('[GA4] Initialized with measurement ID:', GA_ID);
  } catch (error) {
    console.warn('[GA4] Failed to initialize analytics:', error);
  }
}

function sendEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    try {
      window.gtag('event', eventName, params);
    } catch (e) {
      // Graceful fail
    }
  }
}

/**
 * 1. Track User Registration
 */
export function trackSignUp(method = 'google') {
  sendEvent('sign_up', {
    method: method
  });
}

/**
 * 2. Track User Login
 */
export function trackLogin(method = 'google') {
  sendEvent('login', {
    method: method
  });
}

/**
 * 3. Track Search Queries
 */
export function trackSearch(searchTerm) {
  if (!searchTerm) return;
  sendEvent('search', {
    search_term: searchTerm
  });
}

/**
 * 4. Track Viewing Educational Item / Lecture / Booklet
 */
export function trackViewItem({ itemId, itemName, itemCategory = 'lecture' }) {
  sendEvent('view_item', {
    items: [
      {
        item_id: String(itemId),
        item_name: String(itemName),
        item_category: String(itemCategory)
      }
    ]
  });
}

/**
 * 5. Track Critical Button Clicks (CTA)
 */
export function trackButtonClick(buttonName, location = 'general') {
  sendEvent('button_click', {
    button_name: String(buttonName),
    location: String(location)
  });
}

/**
 * 6. Track Lecture Subscription / Code Redemption
 */
export function trackSubscription({ courseId, courseName, price = 0, code = '' }) {
  sendEvent('purchase', {
    transaction_id: `SUB-${Date.now()}`,
    value: Number(price) || 0,
    currency: 'EGP',
    items: [
      {
        item_id: String(courseId || code),
        item_name: String(courseName || 'Lecture Subscription'),
        item_category: 'educational_course',
        price: Number(price) || 0,
        quantity: 1
      }
    ]
  });
}

/**
 * 7. Track Virtual Page View in SPA
 */
export function trackPageView(pageTitle, pagePath) {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    try {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath,
        page_location: window.location.href
      });
    } catch (_) {}
  }
}
