/**
 * App - Router, Lifecycle, and Multi-tab Synchronization
 * Single Page Application Hash Router:
 * - #/                   -> Landing
 * - #/student/morning   -> Student Morning
 * - #/student/evening   -> Student Evening
 * - #/rep/login         -> Rep Login
 * - #/rep/dashboard     -> Rep Dashboard
 * - #/admin             -> Admin Dashboard (Protected)
 */

const App = {
  container: null,
  lastCloudErrorToast: 0,

  async init() {
    this.container = document.getElementById('app-root');
    if (!this.container) {
      console.error('App root container not found');
      return;
    }

    // Initialize Theme (White/Light default or saved user preference)
    if (window.UI && window.UI.initTheme) {
      window.UI.initTheme();
    }

    // Initialize Store & Realm DB (seed data if fresh)
    await window.Store.init();

    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Listen to multi-tab storage changes
    window.addEventListener('storage', (e) => {
      this.handleStorageSync(e);
    });

    // Listen to internal data updates
    window.addEventListener('uni-data-changed', (e) => {
      this.handleInternalSync(e.detail);
    });

    // Cloud sync failures are surfaced once every few seconds (writes remain local-first)
    window.addEventListener('cloud-sync-error', () => {
      const now = Date.now();
      if (now - (this.lastCloudErrorToast || 0) < 8000) return;
      this.lastCloudErrorToast = now;
      window.UI.toast('تم الحفظ محلياً فقط، تعذرت المزامنة مع السحابة. تحقق من الاتصال.', 'warning', 5000);
    });

    // Run initial route
    await this.handleRoute();
  },

  async handleRoute() {
    const hash = window.location.hash || '#/';
    UI.closeModal();

    if (window.Student && window.Student.cleanup) {
      window.Student.cleanup();
    }

    if (hash === '#/' || hash === '' || hash === '#') {
      await window.Landing.render(this.container);
    } else if (hash === '#/student/morning') {
      await window.Student.render(this.container, 'morning');
    } else if (hash === '#/student/evening') {
      await window.Student.render(this.container, 'evening');
    } else if (hash === '#/rep/login') {
      await window.Rep.renderLogin(this.container);
    } else if (hash === '#/rep/dashboard') {
      const repSession = await window.Auth.getRepSession();
      if (!repSession) {
        UI.toast('يرجى إدخال رمز الدخول للوصول إلى لوحة الممثل', 'warning');
        window.location.hash = '#/rep/login';
        return;
      }
      await window.Rep.renderDashboard(this.container);
    } else if (hash === '#/admin') {
      const adminSession = window.Auth.getAdminSession();
      if (!adminSession) {
        UI.toast('غير مصرح لك بالدخول إلى لوحة الأدمن دون تحقق', 'error');
        window.location.hash = '#/';
        return;
      }
      await window.Admin.render(this.container);
    } else {
      window.location.hash = '#/';
    }
  },

  handleStorageSync(event) {
    const key = event.key;
    if (!key || key.startsWith('realm_') || key.startsWith('uni.')) {
      const hash = window.location.hash || '#/';
      if (hash.startsWith('#/student') || hash === '#/rep/dashboard' || hash === '#/admin') {
        this.handleRoute();
      }
    }
  },

  handleInternalSync(detail) {
    const hash = window.location.hash || '#/';
    if (hash === '#/' || hash === '' || hash === '#') {
      window.Landing.render(this.container);
    } else if (hash.startsWith('#/student')) {
      const currentStudentShift = hash.split('/')[2] || 'morning';
      window.Student.render(this.container, currentStudentShift);
    } else if (hash === '#/rep/dashboard') {
      window.Rep.renderDashboard(this.container);
    } else if (hash === '#/admin') {
      window.Admin.render(this.container);
    }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
