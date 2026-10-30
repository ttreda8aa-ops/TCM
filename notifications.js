/**
 * Notifications Engine - Browser Web Notifications & Mobile Alerts
 * Features:
 * - Request permission for push notifications
 * - Sound & vibration support for urgent alerts
 * - Background notifications when app is minimized or tab is in background
 */

const NotificationsEngine = {
  isSupported() {
    return 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async requestPermission() {
    if (!this.isSupported()) {
      UI.toast('متصفحك لا يدعم إشعارات النظام', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        UI.toast('تم تفعيل إشعارات النظام بنجاح ✓', 'success');
        this.sendNotification({
          title: 'المنصة الجامعية الموحدة',
          body: 'الإشعارات مفعلة الآن! ستصلك التنبيهات العاجلة والامتحانات فور نشرها.',
          tag: 'welcome_notification'
        });
        window.dispatchEvent(new CustomEvent('notification-permission-changed', { detail: { permission } }));
        return true;
      } else if (permission === 'denied') {
        UI.toast('تم رفض إذن الإشعارات من إعدادات المتصفح', 'error');
        return false;
      }
    } catch (e) {
      console.warn('Notification permission error:', e.message);
    }
    return false;
  },

  sendNotification({ title, body, icon = null, tag = 'academic_alert', sound = true }) {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;

    try {
      const options = {
        body: body || '',
        icon: icon || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        tag,
        vibrate: [200, 100, 200],
        renotify: true,
        dir: 'rtl',
        lang: 'ar'
      };

      const notification = new Notification(title || 'تنبيه أكاديمي جديد ⚠️', options);

      notification.onclick = function() {
        window.focus();
        notification.close();
      };

      // Play soft academic chime sound if allowed
      if (sound) {
        this.playChime();
      }

      return true;
    } catch (err) {
      console.warn('Failed to send browser notification:', err.message);
      return false;
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
