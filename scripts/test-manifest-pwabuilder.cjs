const fs = require('fs');

// Read manifest
const manifest = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));

// Let's test the members using PWABuilder logic:
const validProtocols = ["bitcoin", "dat", "dweb", "ftp", "geo", "gopher", "im", "ipfs", "ipns", "irc", "ircs", "magnet", "mailto", "matrix", "mms", "news", "nntp", "sip", "sms", "smsto", "ssb", "ssh", "tel", "urn", "webcal", "wtai", "xmpp"];
const platformOptions = ["windows", "chrome_web_store", "play", "itunes", "webapp", "f-droid", "amazon"];

function isValidURL(str) {
  var pattern = new RegExp(
    '^((https?:)?\\/\\/)?' + 
    '(?:\\S+(?::\\S*)?@)?([a-z\\d](?:[a-z\\d-]*[a-z\\d])?\\.)+[a-z]{2,}' + 
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
    '(\\?[;&a-z\\d%_.~+=-]*)?' + 
    '(\\\\#[-a-z\\\\d_]*)?', 
    'i'
  );
  return !!pattern.test(str);
}

const checks = {
  file_handlers: (val) => {
    if (!Array.isArray(val) || val.length === 0) return { pass: false, reason: 'Must be non-empty array' };
    for (const h of val) {
      if (!h.action || typeof h.action !== 'string') return { pass: false, reason: 'action must be string' };
      if (!h.accept || typeof h.accept !== 'object' || Object.keys(h.accept).length === 0) return { pass: false, reason: 'accept must have minProperties 1' };
      for (const k of Object.keys(h.accept)) {
        if (!Array.isArray(h.accept[k]) || h.accept[k].length === 0) return { pass: false, reason: `accept.${k} must be non-empty array of strings` };
      }
    }
    return { pass: true };
  },

  launch_handler: (val) => {
    if (!val || typeof val !== 'object') return { pass: false, reason: 'must be object' };
    if (!val.client_mode) return { pass: false, reason: 'client_mode required' };
    return { pass: true };
  },

  protocol_handlers: (val) => {
    if (!Array.isArray(val) || val.length === 0) return { pass: false, reason: 'Must be non-empty array' };
    for (const p of val) {
      const hasProtocol = typeof p.protocol === 'string' && p.protocol.length > 0;
      const isProtoValid = hasProtocol && (validProtocols.includes(p.protocol) || p.protocol.startsWith('web+'));
      const hasUrl = typeof p.url === 'string' && p.url.length > 0;
      const isRelative = hasUrl && (p.url.startsWith('/') || p.url.startsWith('./') || p.url.startsWith('../'));
      if (!hasProtocol || !isProtoValid || !hasUrl || !isRelative) {
        return { pass: false, reason: `Invalid protocol or URL: ${JSON.stringify(p)}` };
      }
    }
    return { pass: true };
  },

  related_applications: (val) => {
    if (!Array.isArray(val)) return { pass: false, reason: 'Must be array' };
    for (const app of val) {
      if (!platformOptions.includes(app.platform)) return { pass: false, reason: `Invalid platform: ${app.platform}` };
      if (!isValidURL(app.url)) return { pass: false, reason: `Invalid URL: ${app.url}` };
    }
    return { pass: true };
  },

  share_target: (val) => {
    if (!val || typeof val !== 'object') return { pass: false, reason: 'Must be object' };
    return { pass: true };
  },

  iarc_rating_id: (val) => {
    if (!val || typeof val !== 'string' || val.length === 0) return { pass: false, reason: 'Must be non-empty string' };
    return { pass: true };
  },

  widgets: (val) => {
    if (!Array.isArray(val) || val.length === 0) return { pass: false, reason: 'Must be non-empty array' };
    for (const w of val) {
      const required = ["name", "description", "screenshots", "tag", "ms_ac_template"];
      for (const r of required) {
        if (!w[r]) return { pass: false, reason: `widget missing required property ${r}` };
      }
      if (!Array.isArray(w.screenshots) || w.screenshots.length === 0) return { pass: false, reason: 'screenshots must be non-empty array' };
      for (const s of w.screenshots) {
        if (!s.src || !s.sizes || !s.label) return { pass: false, reason: 'screenshot missing src, sizes or label' };
      }
      if (w.icons) {
        for (const ic of w.icons) {
          if (!ic.src || !ic.sizes) return { pass: false, reason: 'widget icon missing src or sizes' };
        }
      }
    }
    return { pass: true };
  },

  edge_side_panel: (val) => {
    if (!val || typeof val !== 'object') return { pass: false, reason: 'Must be object' };
    if (val.preferred_width && typeof val.preferred_width !== 'number') return { pass: false, reason: 'preferred_width must be number' };
    return { pass: true };
  },

  scope_extensions: (val) => {
    if (!Array.isArray(val) || val.length === 0) return { pass: false, reason: 'Must be non-empty array' };
    for (const ext of val) {
      if (typeof ext !== 'object' || typeof ext.origin !== 'string') return { pass: false, reason: 'origin must be string' };
    }
    return { pass: true };
  }
};

console.log('--- TESTING MANIFEST AGAINST PWABUILDER CRITERIA ---');
for (const [key, testFn] of Object.entries(checks)) {
  const result = testFn(manifest[key]);
  console.log(`${key}: ${result.pass ? '✅ PASS' : '❌ FAIL - ' + result.reason}`);
}
