import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initAnalytics } from './services/analytics.js';

// Initialize GA4 if measurement ID is provided
initAnalytics();

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
} catch (error) {
  console.error("Critical mount error:", error);
}

// Register PWA Service Worker in production
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      if (reg && reg.update) {
        reg.update().catch(() => {});
      }
      
      // Register Background Sync if supported (PWABuilder & offline capability)
      if (reg && 'sync' in reg) {
        reg.sync.register('sync-offline-cache').catch(() => {});
      }
      
      // Register Periodic Background Sync if supported
      if (reg && 'periodicSync' in reg) {
        const status = await navigator.permissions?.query({ name: 'periodic-background-sync' }).catch(() => null);
        if (!status || status.state === 'granted') {
          reg.periodicSync.register('check-new-lectures', { minInterval: 24 * 60 * 60 * 1000 }).catch(() => {});
        }
      }
    } catch (e) {}
  });
}
