/**
 * PushEngine - OneSignal Web Push (SDK v16)
 *
 * Goals:
 * - Subscribe students to OneSignal automatically when they tap the bell.
 * - Tag each subscriber with the shift (morning/evening) and role.
 * - Keep the existing local notification engine as a fallback.
 * - Never block the app if OneSignal is blocked, offline, or misconfigured.
 *
 * The OneSignal worker lives in its own scope so it never conflicts with the
 * PWA service worker (sw.js) at the site root:
 *   /push/onesignal/OneSignalSDKWorker.js  -> scope /push/onesignal/
 *
 * GitHub Pages subfolders are supported: the base path is computed at runtime.
 */

const PushEngine = {
  appId: '98cbb38d-868a-4d01-924f-5228eeb8fb42',
  sdkUrl: 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js',
  sdkScriptId: 'onesignal-sdk',
  sdkPromise: null,
  sdkFailed: false,
  initPromise: null,
  oneSignal: null,
  ready: false,
  failed: false,
  lastInitAttempt: 0,
  initRetryMs: 60000,
  lastRole: null,
  lastShift: null,
  permissionListenersBound: false,
  localNotified: {},
  serverNotified: {},

  /**
   * Web push needs a secure context (HTTPS or localhost), service workers,
   * PushManager, and the Notification API.
   */
  isSupported() {
    return (
      typeof window !== 'undefined' &&
      window.isSecureContext === true &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Directory of the current page. Examples:
   *   https://site.github.io/repo/index.html -> /repo/
   *   https://site.github.io/repo/          -> /repo/
   */
  siteBase() {
    const path = (window.location && window.location.pathname) || '/';
    const slash = path.lastIndexOf('/');
    return slash >= 0 ? path.slice(0, slash + 1) : '/';
  },

  /**
   * The folder layout is preferred. The root file is a fallback for uploads
   * that keep every file flat in the repository root.
   *
   * OneSignal expects serviceWorkerPath relative to the origin root (without
   * a leading slash), while the scope must be an absolute URL path.
   */
  workerCandidates() {
    const base = this.siteBase();
    const scope = base + 'push/onesignal/';
    return [
      {
        path: base + 'push/onesignal/OneSignalSDKWorker.js',
        sdkPath: (base + 'push/onesignal/OneSignalSDKWorker.js').replace(/^\/+/, ''),
        scope
      },
      {
        path: base + 'OneSignalSDKWorker.js',
        sdkPath: (base + 'OneSignalSDKWorker.js').replace(/^\/+/, ''),
        scope
      }
    ];
  },

  async pickWorker() {
    const candidates = this.workerCandidates();
    for (let i = 0; i < candidates.length; i += 1) {
      try {
        const response = await fetch(candidates[i].path, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (response && response.ok) return candidates[i];
      } catch (e) {
        // Offline or blocked: try the next candidate.
      }
    }
    return candidates[0];
  },

  loadSdk() {
    if (window.OneSignal && typeof window.OneSignal.init === 'function') {
      return Promise.resolve(window.OneSignal);
    }
    if (this.sdkPromise && !this.sdkFailed) return this.sdkPromise;

    this.sdkFailed = false;
    this.sdkPromise = new Promise((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.sdkFailed = true;
        // Keep the script element: it may still be downloading and can be
        // reused by the retry triggered from the bell button.
        reject(new Error('OneSignal SDK load timeout'));
      }, 20000);

      window.OneSignalDeferred.push((OneSignal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(OneSignal);
      });

      let script = document.getElementById(this.sdkScriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = this.sdkScriptId;
        script.src = this.sdkUrl;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          this.sdkFailed = true;
          if (script.parentNode) script.parentNode.removeChild(script);
          reject(new Error('OneSignal SDK failed to load'));
        };
        document.head.appendChild(script);
      }
    }).catch((error) => {
      this.sdkFailed = true;
      throw error;
    });

    return this.sdkPromise;
  },

  async init() {
    if (this.initPromise) return this.initPromise;
    if (!this.isSupported()) {
      this.failed = true;
      return null;
    }

    this.lastInitAttempt = Date.now();

    // Do not spend 20 seconds loading the SDK while the device is offline.
    // The next online event or bell tap retries automatically.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.failed = true;
      window.dispatchEvent(
        new CustomEvent('push-ready', {
          detail: { ready: false, subscribed: false, offline: true }
        })
      );
      return null;
    }

    this.initPromise = (async () => {
      try {
        const OneSignal = await this.loadSdk();
        this.oneSignal = OneSignal;

        const worker = await this.pickWorker();
        const options = {
          appId: this.appId,
          serviceWorkerPath: worker.sdkPath,
          serviceWorkerParam: { scope: worker.scope },
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          promptOptions: { slidedown: { enabled: false } },
          welcomeNotification: { disable: true },
          autoResubscribe: true
        };

        await OneSignal.init(options);
        this.ready = true;
        this.failed = false;
        this.bindEvents(OneSignal);
        await this.applyTags();

        window.dispatchEvent(
          new CustomEvent('push-ready', {
            detail: { ready: true, subscribed: this.isSubscribed() }
          })
        );
        return OneSignal;
      } catch (error) {
        this.failed = true;
        this.ready = false;
        // Allow a later user gesture (the bell button) to retry after a
        // transient network/SDK failure without reloading the page.
        this.initPromise = null;
        console.warn(
          '[Push] OneSignal init failed, using local notifications:',
          error && error.message ? error.message : error
        );
        window.dispatchEvent(
          new CustomEvent('push-ready', {
            detail: { ready: false, subscribed: false }
          })
        );
        return null;
      }
    })();

    return this.initPromise;
  },

  bindEvents(OneSignal) {
    if (this.permissionListenersBound) return;
    this.permissionListenersBound = true;

    try {
      OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
        window.dispatchEvent(
          new CustomEvent('push-permission-changed', { detail: { granted: !!granted } })
        );
        if (granted) this.applyTags();
      });
    } catch (e) {
      // Older SDK builds may not expose this event.
    }

    try {
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        const notification = event && event.notification ? event.notification : null;
        const data =
          (notification && (notification.additionalData || notification.data)) || {};
        const tag = data.tag || (notification && notification.tag) || '';

        // The local Realtime notification already reached this page. Suppress
        // the OneSignal copy to avoid showing the same alert twice.
        if (tag && this.wasLocallyNotified(tag)) {
          try {
            event.preventDefault();
          } catch (e) {}
          return;
        }

        // Remember that OneSignal displayed this notification so the local
        // Realtime handler can skip its duplicate if it arrives a moment later.
        if (tag) this.markServerNotification(tag);
      });
    } catch (e) {
      // Foreground display events are optional.
    }
  },

  /**
   * Store role/shift tags on the OneSignal user. Called on every route change
   * and kept locally until the SDK is ready.
   */
  identify(role, shift) {
    if (role) this.lastRole = role;
    if (shift) this.lastShift = shift;

    if (!this.ready) {
      // Retry a failed initialization on a later route, but not on every hash
      // change. The bell button and the online/visibility listeners bypass
      // this cooldown because they represent a fresh user/network signal.
      const coolingDown =
        this.failed && Date.now() - (this.lastInitAttempt || 0) < this.initRetryMs;
      if (coolingDown) return Promise.resolve(false);
      return this.init()
        .then((OneSignal) => (OneSignal ? this.applyTags() : false))
        .catch(() => false);
    }
    return this.applyTags();
  },

  async applyTags() {
    if (!this.oneSignal || !this.ready) return false;

    const tags = {};
    if (this.lastRole) tags.role = this.lastRole;
    if (this.lastShift) tags.shift = this.lastShift;
    if (Object.keys(tags).length === 0) return true;

    try {
      await this.oneSignal.User.addTags(tags);
      return true;
    } catch (error) {
      console.warn(
        '[Push] Could not set OneSignal tags:',
        error && error.message ? error.message : error
      );
      return false;
    }
  },

  getPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  },

  isSubscribed() {
    try {
      return (
        this.ready &&
        this.oneSignal &&
        this.oneSignal.User &&
        this.oneSignal.User.PushSubscription &&
        this.oneSignal.User.PushSubscription.optedIn === true &&
        (typeof Notification === 'undefined' || Notification.permission === 'granted')
      );
    } catch (e) {
      return false;
    }
  },

  async requestPermission() {
    await this.init();

    if (!this.oneSignal || !this.ready) {
      return this.requestLocalPermission();
    }

    try {
      if (Notification.permission !== 'granted') {
        await this.oneSignal.Notifications.requestPermission();
      }

      if (Notification.permission !== 'granted') {
        if (Notification.permission === 'denied') {
          if (window.UI) {
            window.UI.toast(
              'تم رفض إذن الإشعارات. فعّل الإشعارات من إعدادات المتصفح لهذا الموقع.',
              'error',
              6000
            );
          }
        } else if (window.UI) {
          window.UI.toast('لم يتم منح إذن الإشعارات', 'warning');
        }
        return false;
      }

      // If the user previously opted out, turn the subscription back on.
      try {
        if (this.oneSignal.User.PushSubscription.optedIn !== true) {
          await this.oneSignal.User.PushSubscription.optIn();
        }
      } catch (e) {
        // Permission is already granted; the SDK will subscribe on its own.
      }

      await this.applyTags();

      if (window.UI) {
        window.UI.toast('تم تفعيل إشعارات المنصة على هذا الجهاز ✓', 'success');
      }

      // A local confirmation notification also verifies the PWA service worker.
      if (window.NotificationsEngine) {
        window.NotificationsEngine.sendNotification({
          title: 'المنصة الجامعية الموحدة',
          body: 'الإشعارات مفعلة الآن! ستصلك التنبيهات العاجلة والامتحانات فور نشرها.',
          tag: 'welcome_notification'
        });
      }

      return true;
    } catch (error) {
      console.warn(
        '[Push] OneSignal permission request failed, using local fallback:',
        error && error.message ? error.message : error
      );
      return this.requestLocalPermission();
    }
  },

  requestLocalPermission() {
    if (window.NotificationsEngine && window.NotificationsEngine.requestPermission) {
      return window.NotificationsEngine.requestPermission();
    }
    return Promise.resolve(false);
  },

  markLocalNotification(tag) {
    if (!tag) return;
    this.localNotified[tag] = Date.now();
    this.cleanupTimestamps();
  },

  wasLocallyNotified(tag) {
    const at = this.localNotified[tag];
    return !!at && Date.now() - at < 20000;
  },

  markServerNotification(tag) {
    if (!tag) return;
    this.serverNotified[tag] = Date.now();
    this.cleanupTimestamps();
  },

  wasServerNotified(tag) {
    const at = this.serverNotified[tag];
    return !!at && Date.now() - at < 20000;
  },

  cleanupTimestamps() {
    const cutoff = Date.now() - 60000;
    ['localNotified', 'serverNotified'].forEach((key) => {
      const map = this[key];
      Object.keys(map).forEach((tag) => {
        if (map[tag] < cutoff) delete map[tag];
      });
    });
  },

  getTags() {
    try {
      if (this.oneSignal && this.oneSignal.User) {
        return this.oneSignal.User.getTags();
      }
    } catch (e) {}
    return {};
  },

  getStatus() {
    return {
      permission: this.getPermission(),
      ready: this.ready,
      subscribed: this.isSubscribed(),
      failed: this.failed,
      role: this.lastRole,
      shift: this.lastShift
    };
  }
};

window.PushEngine = PushEngine;
