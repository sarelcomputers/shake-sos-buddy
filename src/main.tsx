import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update in the background
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Alfa22 SOS is ready to work offline');
  },
  onRegisteredSW(swUrl, registration) {
    console.log('Service Worker registered:', swUrl);
    
    // Set up periodic sync for background functionality (experimental API)
    if (registration && 'periodicSync' in registration) {
      const periodicSync = (registration as any).periodicSync;
      periodicSync?.register?.('sos-check', {
        minInterval: 60 * 1000, // 1 minute
      }).catch((error: Error) => {
        console.log('Periodic sync not supported:', error.message);
      });
    }
    
    // Listen for messages from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_SOS') {
        console.log('SOS triggered from service worker');
        window.dispatchEvent(new CustomEvent('sw-sos-trigger'));
      }
      if (event.data?.type === 'BACKGROUND_SOS_TRIGGER') {
        console.log('Background SOS trigger received');
        window.dispatchEvent(new CustomEvent('sw-sos-trigger'));
      }
    });
  },
});

// Request persistent storage for PWA
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('Storage will not be cleared');
    }
  });
}

// Request notification permission on load if not already granted
if ('Notification' in window && Notification.permission === 'default') {
  // Wait for user interaction before requesting
  document.addEventListener('click', function requestNotificationPermission() {
    Notification.requestPermission();
    document.removeEventListener('click', requestNotificationPermission);
  }, { once: true });
}

createRoot(document.getElementById("root")!).render(<App />);