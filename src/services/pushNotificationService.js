// Web Push and Local Native Notification Service for Mr. Michael Shehata LMS

export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isPushSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
};

export const dispatchExternalNotification = async ({
  title = 'منصة مستر مايكل شحاتة التعليمية (The Master) 🇬🇧',
  body = 'تنبيه تعليمي جديد!',
  url = './',
  tag = 'ms-broadcast',
  targetAudience = 'all'
}) => {
  if (!isPushSupported()) return false;

  const currentPerm = Notification.permission;
  if (currentPerm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (granted !== 'granted') return false;
  }

  const options = {
    body,
    icon: './icons/icon-192x192.png',
    badge: './favicon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag,
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    data: {
      url,
      timestamp: Date.now(),
      audience: targetAudience
    }
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    }
    // Fallback to Window Notification
    if ('Notification' in window) {
      new Notification(title, options);
      return true;
    }
  } catch (err) {
    console.warn('Failed to dispatch external push notification:', err);
  }
  return false;
};
