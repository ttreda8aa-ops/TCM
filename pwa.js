/**
 * PWA - Install Prompt, Offline Status, and App Updates
 *
 * - Shows an "install app" banner when the browser reports the app is installable.
 * - Explains the Add-to-Home-Screen flow on iPhone (Safari has no install prompt).
 * - Informs the user when a new version has been downloaded.
 */

const PWA = {
  deferredPrompt: null,
  initialized: false,
  banner: null,
  DISMISS_KEY: 'uni.pwa.dismissedAt',
  DISMISS_DAYS: 10,

  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf('android-app://') === 0
    );
  },

  isIos() {
    const ua = navigator.userAgent || '';
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  },

  wasDismissed() {
    try {
      const at = Number(localStorage.getItem(this.DISMISS_KEY) || 0);
      if (!at) return false;
      return Date.now() - at < this.DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  },

  dismiss() {
    try {
      localStorage.setItem(this.DISMISS_KEY, String(Date.now()));
    } catch (e) {}
    this.hideBanner();
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (this.isStandalone()) {
      this.hideBanner();
      return;
    }

    if (this.deferredPrompt) {
      this.showBanner();
    } else if (this.isIos() && !this.wasDismissed()) {
      // Safari does not fire beforeinstallprompt; show the manual instructions.
      setTimeout(() => this.showBanner('ios'), 2000);
    } else if (this.wasDismissed()) {
      this.hideBanner();
    }

    this.bindConnectivity();
    this.bindServiceWorkerUpdates();
  },

  showBanner(mode) {
    if (this.banner || this.isStandalone()) return;

    const isIos = mode === 'ios' || (!this.deferredPrompt && this.isIos());
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('dir', 'rtl');
    banner.style.cssText =
      'position:fixed;z-index:70;bottom:max(16px, env(safe-area-inset-bottom));' +
      'left:16px;right:16px;max-width:390px;margin-inline:auto;';

    banner.innerHTML = `
      <div class="relative flex items-center gap-3 p-3 pr-4 rounded-2xl bg-white/95 dark:bg-[#12122a]/95 border border-cyan-400/50 shadow-2xl backdrop-blur-xl animate-fade-in">
        <button type="button" id="pwa-install-main" class="flex items-center gap-3 flex-1 text-right cursor-pointer bg-transparent border-0">
          <img src="icon-192.png" alt="" class="w-11 h-11 rounded-xl shadow-md flex-shrink-0" />
          <span class="flex flex-col min-w-0">
            <strong class="text-sm font-black text-gray-900 dark:text-white">تثبيت التطبيق</strong>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 leading-5">
              ${isIos ? 'من المشاركة ← إضافة إلى الشاشة الرئيسية' : 'فتح أسرع ويعمل بدون إنترنت'}
            </span>
          </span>
        </button>
        <button type="button" id="pwa-install-close" aria-label="إغلاق" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer bg-transparent border-0">
          ${window.UI && window.UI.icons ? window.UI.icons.x : '×'}
        </button>
      </div>
    `;

    document.body.appendChild(banner);
    this.banner = banner;

    banner.querySelector('#pwa-install-close').addEventListener('click', () => this.dismiss());
    banner.querySelector('#pwa-install-main').addEventListener('click', () => this.promptInstall());
  },

  hideBanner() {
    if (this.banner) {
      this.banner.remove();
      this.banner = null;
    }
  },

  async promptInstall() {
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;

        if (choice && choice.outcome === 'accepted') {
          this.hideBanner();
          if (window.UI) window.UI.toast('جاري تثبيت التطبيق…', 'success');
        } else {
          this.dismiss();
        }
        return;
      } catch (e) {
        // Fall through to the manual instructions.
      }
    }

    this.showInstallHelp();
  },

  showInstallHelp() {
    const isIos = this.isIos();
    const content = isIos
      ? `
        <div class="space-y-3 text-sm leading-7">
          <p>لتثبيت المنصة على آيفون:</p>
          <ol class="space-y-2 pr-5 list-decimal">
            <li>افتح الموقع في متصفح <strong>Safari</strong>.</li>
            <li>اضغط زر <strong>المشاركة</strong> (المربع مع السهم).</li>
            <li>اختر <strong>إضافة إلى الشاشة الرئيسية</strong>.</li>
            <li>اضغط <strong>إضافة</strong>.</li>
          </ol>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            إشعارات النظام على آيفون تعمل بعد التثبيت مع iOS 16.4 أو أحدث.
          </p>
        </div>
      `
      : `
        <div class="space-y-3 text-sm leading-7">
          <p>لتثبيت المنصة كتطبيق:</p>
          <ol class="space-y-2 pr-5 list-decimal">
            <li>افتح قائمة المتصفح (⋮).</li>
            <li>اختر <strong>تثبيت التطبيق</strong> أو <strong>إضافة إلى الشاشة الرئيسية</strong>.</li>
            <li>أكد التثبيت.</li>
          </ol>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            إن لم يظهر الخيار، فتأكد أنك تفتح الموقع عبر HTTPS وليس داخل نافذة خاصة.
          </p>
        </div>
      `;

    if (window.UI && window.UI.showModal) {
      window.UI.showModal({
        title: 'تثبيت التطبيق',
        size: 'max-w-md',
        content,
        footerButtons: [
          {
            text: 'حسناً',
            isPrimary: true,
            onClick: (close) => close()
          }
        ]
      });
    } else {
      alert('افتح قائمة المتصفح واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  },

  bindConnectivity() {
    window.addEventListener('offline', () => {
      if (window.UI) {
        window.UI.toast('أنت غير متصل — يتم عرض البيانات المحفوظة على جهازك', 'warning', 5000);
      }
    });

    window.addEventListener('online', () => {
      if (window.UI) {
        window.UI.toast('عاد الاتصال بالإنترنت ✓', 'success', 3000);
      }
    });
  },

  bindServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              if (window.UI) {
                window.UI.toast('تم تنزيل تحديث جديد. أعد فتح الصفحة لتطبيقه.', 'info', 6000);
              }
            }
          });
        });
      })
      .catch(() => {});
  }
};

window.PWA = PWA;

// Captured as early as possible so the install event is never missed.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  PWA.deferredPrompt = event;
  if (PWA.initialized) PWA.showBanner();
});

window.addEventListener('appinstalled', () => {
  PWA.deferredPrompt = null;
  PWA.hideBanner();
  try {
    localStorage.setItem('uni.pwa.installed', '1');
  } catch (e) {}
  if (window.UI) window.UI.toast('تم تثبيت التطبيق بنجاح ✓', 'success');
});
