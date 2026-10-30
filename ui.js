/**
 * UI - Shared Components, Modals, Toasts, SVG Icons, and Theme Management
 * Features:
 * - Silent Theme Switching (no toast on toggle)
 * - Admin password modal without "(الافتراضية: 00)" label text
 * - Silent login / logout
 */

const UI = {
  icons: {
    sun: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
    moon: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`,
    calendar: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
    clock: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    book: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
    check: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    checkCircle: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    alert: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    x: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
    user: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
    users: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`,
    shield: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    lock: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
    key: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>`,
    plus: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
    edit: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
    trash: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
    copy: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`,
    refresh: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
    logout: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`,
    arrowRight: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`,
    arrowLeft: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>`,
    search: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
    sparkles: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`,
    download: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`,
    upload: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>`,
    home: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    settings: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    chevronDown: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`,
    location: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    fileText: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    checkDone: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`
  },

  dayNames: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],

  getAcademicDayIndex(jsDate = new Date()) {
    const jsDay = jsDate.getDay();
    return (jsDay + 1) % 7;
  },

  formatNumber(val, format = 'western') {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (format !== 'indic') return str;
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, w => arabicDigits[+w]);
  },

  // Theme Management (Silent toggle - no toast notification)
  initTheme() {
    const savedTheme = localStorage.getItem('uni.theme') || 'light';
    this.applyTheme(savedTheme);
  },

  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
    localStorage.setItem('uni.theme', theme);
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    this.applyTheme(newTheme);
    // Silent switch without toast notification as requested
    return newTheme;
  },

  getThemeButtonHtml() {
    const isDark = document.documentElement.classList.contains('dark');
    return `
      <button 
        type="button" 
        id="global-theme-toggle-btn"
        class="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
        title="تبديل المظهر"
        aria-label="تبديل المظهر"
      >
        <span class="theme-icon">${isDark ? this.icons.sun : this.icons.moon}</span>
        <span class="text-xs font-bold hidden sm:inline">${isDark ? 'نهاري' : 'ليلي'}</span>
      </button>
    `;
  },

  attachThemeToggle() {
    const btn = document.getElementById('global-theme-toggle-btn');
    if (btn) {
      btn.onclick = () => {
        this.toggleTheme();
        const iconSpan = btn.querySelector('.theme-icon');
        const textSpan = btn.querySelector('span:not(.theme-icon)');
        const isDarkNow = document.documentElement.classList.contains('dark');
        if (iconSpan) iconSpan.innerHTML = isDarkNow ? this.icons.sun : this.icons.moon;
        if (textSpan) textSpan.textContent = isDarkNow ? 'نهاري' : 'ليلي';
      };
    }
  },

  // Toast System
  toast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-5 left-5 right-5 sm:right-auto sm:left-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-3 p-4 rounded-xl glass-panel text-sm text-gray-800 dark:text-gray-100 shadow-xl border animate-toast';

    let iconHtml = this.icons.info;
    let borderColor = 'border-cyan-500/50';
    let iconClass = 'text-cyan-500';

    if (type === 'success') {
      iconHtml = this.icons.checkCircle;
      borderColor = 'border-emerald-500/60 glow-mixed';
      iconClass = 'text-emerald-500';
    } else if (type === 'warning') {
      iconHtml = this.icons.alert;
      borderColor = 'border-amber-500/60';
      iconClass = 'text-amber-500';
    } else if (type === 'error') {
      iconHtml = this.icons.x;
      borderColor = 'border-rose-500/60';
      iconClass = 'text-rose-500';
    }

    toast.classList.add(...borderColor.split(' '));
    toast.innerHTML = `
      <div class="flex-shrink-0 ${iconClass}">${iconHtml}</div>
      <div class="flex-1 font-medium leading-relaxed">${message}</div>
      <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-white transition flex-shrink-0 cursor-pointer" aria-label="إغلاق">
        ${this.icons.x}
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.2s ease-out';
      setTimeout(() => toast.remove(), 200);
    };

    closeBtn.onclick = dismiss;
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  },

  // Modal
  showModal({ title, content, footerButtons = [], size = 'max-w-lg', onClose = null }) {
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'app-modal-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in';

    let buttonsHtml = '';
    footerButtons.forEach((btn, index) => {
      const cls = btn.isDestructive
        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
        : btn.isPrimary
        ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white glow-cyan'
        : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-white/10';

      buttonsHtml += `
        <button type="button" data-modal-btn="${index}" class="px-5 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2 ${cls}">
          ${btn.icon || ''}
          ${btn.text}
        </button>
      `;
    });

    overlay.innerHTML = `
      <div class="w-full ${size} bg-white dark:bg-[#0d0d1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 relative animate-scale-up max-h-[90vh] flex flex-col text-gray-900 dark:text-gray-100">
        <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
          <h3 class="text-lg font-bold flex items-center gap-2">${title}</h3>
          <button id="modal-close-x" class="text-gray-400 hover:text-gray-800 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer" aria-label="إغلاق">
            ${this.icons.x}
          </button>
        </div>
        <div class="py-4 text-gray-700 dark:text-gray-300 text-sm overflow-y-auto flex-1 custom-scroll" id="modal-body-content">
          ${content}
        </div>
        ${footerButtons.length ? `<div class="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-3 flex-shrink-0">${buttonsHtml}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);

    const closeHandler = () => {
      this.closeModal();
      if (onClose) onClose();
    };

    overlay.querySelector('#modal-close-x').onclick = closeHandler;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeHandler();
    };

    footerButtons.forEach((btn, index) => {
      const btnEl = overlay.querySelector(`[data-modal-btn="${index}"]`);
      if (btnEl && btn.onClick) {
        btnEl.onclick = () => btn.onClick(closeHandler);
      }
    });

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeHandler();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  },

  closeModal() {
    const existing = document.getElementById('app-modal-overlay');
    if (existing) existing.remove();
  },

  confirm({ title = 'تأكيد الإجراء', message, confirmText = 'نعم، تابع', cancelText = 'إلغاء', isDestructive = false }) {
    return new Promise((resolve) => {
      this.showModal({
        title,
        size: 'max-w-md',
        content: `
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl ${isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'} flex-shrink-0">
              ${isDestructive ? this.icons.trash : this.icons.alert}
            </div>
            <div class="leading-relaxed text-gray-800 dark:text-gray-200">
              ${message}
            </div>
          </div>
        `,
        footerButtons: [
          {
            text: cancelText,
            onClick: (close) => {
              close();
              resolve(false);
            }
          },
          {
            text: confirmText,
            isDestructive,
            isPrimary: !isDestructive,
            onClick: (close) => {
              close();
              resolve(true);
            }
          }
        ],
        onClose: () => resolve(false)
      });
    });
  },

  // Admin Password Dialog: Removed "(الافتراضية: 00)" text & silent redirect
  showAdminPasswordModal() {
    const content = `
      <form id="admin-pass-form" class="space-y-4">
        <div class="text-center pb-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3 glow-mixed">
            ${this.icons.shield}
          </div>
          <h4 class="text-base font-bold text-gray-900 dark:text-white">بوابة صاحب المنصة (الإدارة العليا)</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">أدخل كلمة المرور للوصول إلى لوحة الإدارة</p>
        </div>

        <div>
          <!-- Label without "(الافتراضية: 00)" as requested -->
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">كلمة مرور الأدمن</label>
          <div class="relative">
            <input 
              type="password" 
              id="admin-pass-input" 
              placeholder="••••" 
              required
              autocomplete="current-password"
              class="w-full bg-gray-50 dark:bg-[#121226] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-center font-mono-numeric tracking-widest text-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
          </div>
          <p id="admin-pass-error" class="text-xs text-rose-500 mt-2 hidden text-center font-bold"></p>
        </div>

        <button 
          type="submit" 
          id="admin-pass-submit"
          class="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 glow-cyan transition cursor-pointer flex items-center justify-center gap-2 mt-4"
        >
          <span>تأكيد الدخول</span>
          ${this.icons.arrowLeft}
        </button>
      </form>
    `;

    this.showModal({
      title: 'التحقق الأمني للأدمن',
      content,
      size: 'max-w-sm'
    });

    const form = document.getElementById('admin-pass-form');
    const input = document.getElementById('admin-pass-input');
    const errorEl = document.getElementById('admin-pass-error');

    setTimeout(() => input.focus(), 100);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const val = input.value;
      try {
        await window.Auth.loginAdmin(val);
        UI.closeModal();
        // Silent transition without notification as requested
        window.location.hash = '#/admin';
      } catch (err) {
        input.classList.add('animate-shake', 'border-rose-500');
        errorEl.textContent = err.message || 'كلمة المرور غير صحيحة';
        errorEl.classList.remove('hidden');
        setTimeout(() => input.classList.remove('animate-shake'), 400);
      }
    };
  }
};

window.UI = UI;
