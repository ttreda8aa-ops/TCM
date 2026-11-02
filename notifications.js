/**
 * Notifications Engine - Browser Web Notifications & Mobile Alerts
 * Features:
 * - Request permission for push notifications
 * - Service Worker notifications (required on Android / mobile Chrome)
 * - Sound & vibration support for urgent alerts
 * - In-app toast fallback when system notifications are unavailable
 */

const NotificationsEngine = {
  swRegistration: null,
  swInitPromise: null,

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  // Register the service worker once. Mobile browsers can only show
  // notifications through a service worker registration.
  init() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return Promise.resolve(null);
    }
    if (this.swInitPromise) return this.swInitPromise;

    this.swInitPromise = navigator.serviceWorker
      .register('sw.js', { scope: './', updateViaCache: 'none' })
      .then((reg) => {
        this.swRegistration = reg;
        return reg;
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err.message);
        return null;
      });

    return this.swInitPromise;
  },

  async getServiceWorkerRegistration() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      if (!this.swRegistration) this.init();
      const ready = navigator.serviceWorker.ready;
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
      const reg = await Promise.race([ready, timeout]);
      return reg || this.swRegistration || null;
    } catch (e) {
      return this.swRegistration || null;
    }
  },

  async requestPermission() {
    if (!this.isSupported()) {
      UI.toast('متصفحك لا يدعم إشعارات النظام', 'warning');
      return false;
    }

    try {
      // The service worker must exist before the notification is shown.
      await this.init();
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        UI.toast('تم تفعيل إشعارات النظام بنجاح ✓', 'success');
        await this.sendNotification({
          title: 'المنصة الجامعية الموحدة',
          body: 'الإشعارات مفعلة الآن! ستصلك التنبيهات العاجلة والامتحانات فور نشرها.',
          tag: 'welcome_notification'
        });
        window.dispatchEvent(new CustomEvent('notification-permission-changed', { detail: { permission } }));
        return true;
      }

      if (permission === 'denied') {
        UI.toast('تم رفض إذن الإشعارات. فعّل الإشعارات من إعدادات المتصفح لهذا الموقع.', 'error', 6000);
        return false;
      }

      UI.toast('لم يتم منح إذن الإشعارات', 'warning');
    } catch (e) {
      console.warn('Notification permission error:', e.message);
      UI.toast('تعذر تفعيل الإشعارات على هذا المتصفح', 'error');
    }
    return false;
  },

  async sendNotification({ title, body, icon = 'icon-192.png', tag = 'academic_alert', sound = true }) {
    const finalTitle = title || 'تنبيه أكاديمي جديد ⚠️';
    const finalBody = body || '';

    if (!this.isSupported() || Notification.permission !== 'granted') {
      this.showInApp(finalTitle, finalBody);
      return false;
    }

    const options = {
      body: finalBody,
      tag: tag || 'academic_alert',
      renotify: true,
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: typeof window !== 'undefined' ? window.location.href : '' }
    };
    if (icon) {
      options.icon = icon;
      options.badge = icon;
    }

    // 1) Preferred path: Service Worker (works on Android & mobile Chrome)
    try {
      const reg = await this.getServiceWorkerRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(finalTitle, options);
        if (sound) this.playChime();
        return true;
      }
    } catch (err) {
      console.warn('Service worker notification failed, trying desktop fallback:', err.message);
    }

    // 2) Desktop fallback: the classic Notification constructor
    try {
      const notification = new Notification(finalTitle, options);
      notification.onclick = function () {
        window.focus();
        notification.close();
      };
      if (sound) this.playChime();
      return true;
    } catch (err) {
      console.warn('Failed to send browser notification:', err.message);
      this.showInApp(finalTitle, finalBody);
      return false;
    }
  },

  // Visible fallback so students still get the alert inside the page
  // when the browser blocks or does not support system notifications.
  showInApp(title, body) {
    const message = body ? `${title} — ${body}` : title;
    if (typeof window !== 'undefined' && window.UI && typeof window.UI.toast === 'function') {
      window.UI.toast(message, 'info', 6000);
    } else {
      console.info('[Notification]', message);
    }
  },

  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio autoplay policy might block silent audio before user interaction
    }
  }
};

window.NotificationsEngine = NotificationsEngine;
