/**
 * Landing Page View
 * Features:
 * - 3D Isometric (3D tr) Vector Icons exclusively in the slider cards
 * - Animated Carousel with study visuals
 * - Silent Theme Toggle
 * - Secret admin trigger in footer
 */

const Landing = {
  clickCount: 0,
  clickTimer: null,
  carouselTimer: null,
  currentSlide: 0,

  // 3D Isometric (3D tr) SVG Icons
  icons3D: {
    // 3D Isometric Calendar / Schedule
    calendar3D: `
      <svg class="w-16 h-16 sm:w-20 sm:h-20 icon-3d-tr" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="calTop" x1="20" y1="20" x2="80" y2="50" gradientUnits="userSpaceOnUse">
            <stop stop-color="#38bdf8" />
            <stop offset="1" stop-color="#0284c7" />
          </linearGradient>
          <linearGradient id="calFront" x1="20" y1="50" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0369a1" />
            <stop offset="1" stop-color="#0c4a6e" />
          </linearGradient>
          <linearGradient id="calSheet" x1="25" y1="35" x2="75" y2="75" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ffffff" />
            <stop offset="1" stop-color="#e0f2fe" />
          </linearGradient>
          <filter id="shadow3D" x="0" y="20" width="100" height="80" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#0284c7" flood-opacity="0.35" />
          </filter>
        </defs>
        <g filter="url(#shadow3D)">
          <!-- Base isometric block -->
          <polygon points="50,15 85,32 50,50 15,32" fill="url(#calTop)" />
          <polygon points="85,32 85,72 50,90 50,50" fill="url(#calFront)" />
          <polygon points="15,32 50,50 50,90 15,72" fill="#0284c7" />
          <!-- Layered 3D Paper Sheet -->
          <polygon points="50,22 80,37 50,53 20,37" fill="url(#calSheet)" />
          <polygon points="80,37 80,42 50,58 50,53" fill="#cbd5e1" />
          <!-- 3D Calendar Rings / Pins -->
          <circle cx="35" cy="27" r="3.5" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
          <circle cx="50" cy="35" r="3.5" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
          <circle cx="65" cy="42" r="3.5" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
          <!-- 3D Grid markings on sheet -->
          <path d="M35 44 L45 49 M55 54 L65 59 M38 49 L48 54 M28 41 L35 44" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" />
        </g>
      </svg>
    `,

    // 3D Isometric Alarm / Exam Timer
    clock3D: `
      <svg class="w-16 h-16 sm:w-20 sm:h-20 icon-3d-tr" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clockGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stop-color="#c084fc" />
            <stop offset="1" stop-color="#7e22ce" />
          </linearGradient>
          <linearGradient id="dialGrad" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ffffff" />
            <stop offset="1" stop-color="#f3e8ff" />
          </linearGradient>
          <filter id="purpleShadow" x="0" y="10" width="100" height="90" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#a855f7" flood-opacity="0.4" />
          </filter>
        </defs>
        <g filter="url(#purpleShadow)">
          <!-- 3D Bells -->
          <ellipse cx="30" cy="22" rx="10" ry="6" fill="#9333ea" transform="rotate(-25 30 22)" />
          <ellipse cx="70" cy="22" rx="10" ry="6" fill="#9333ea" transform="rotate(25 70 22)" />
          <!-- 3D Legs -->
          <polygon points="26,75 32,77 24,92 18,88" fill="#6b21a8" />
          <polygon points="74,75 68,77 76,92 82,88" fill="#6b21a8" />
          <!-- 3D Outer Cylinder Body -->
          <ellipse cx="50" cy="54" rx="36" ry="36" fill="url(#clockGrad)" />
          <ellipse cx="50" cy="50" rx="34" ry="34" fill="#a855f7" />
          <!-- 3D Glossy Inner Dial -->
          <ellipse cx="50" cy="50" rx="27" ry="27" fill="url(#dialGrad)" />
          <!-- 3D Clock Hands -->
          <line x1="50" y1="50" x2="50" y2="34" stroke="#581c87" stroke-width="4" stroke-linecap="round" />
          <line x1="50" y1="50" x2="63" y2="56" stroke="#9333ea" stroke-width="3" stroke-linecap="round" />
          <circle cx="50" cy="50" r="4.5" fill="#581c87" />
          <!-- Gloss highlight -->
          <path d="M28 35 A24 24 0 0 1 50 26" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6" />
        </g>
      </svg>
    `,

    // 3D Isometric Book & Academic Task Checklist
    book3D: `
      <svg class="w-16 h-16 sm:w-20 sm:h-20 icon-3d-tr" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bookCover" x1="15" y1="20" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34d399" />
            <stop offset="1" stop-color="#059669" />
          </linearGradient>
          <linearGradient id="bookPages" x1="20" y1="30" x2="80" y2="70" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ffffff" />
            <stop offset="1" stop-color="#d1fae5" />
          </linearGradient>
          <filter id="greenShadow" x="0" y="15" width="100" height="85" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#10b981" flood-opacity="0.35" />
          </filter>
        </defs>
        <g filter="url(#greenShadow)">
          <!-- 3D Isometric Thick Book Base -->
          <polygon points="50,18 85,34 50,52 15,34" fill="url(#bookCover)" />
          <polygon points="85,34 85,74 50,92 50,52" fill="#047857" />
          <polygon points="15,34 50,52 50,92 15,74" fill="#059669" />
          <!-- 3D Page Layers -->
          <polygon points="50,24 81,38 50,54 19,38" fill="url(#bookPages)" />
          <polygon points="81,38 81,45 50,61 50,54" fill="#cbd5e1" />
          <!-- Floating 3D Checkmark Emblem on Top -->
          <g transform="translate(40, 26)">
            <ellipse cx="12" cy="12" rx="12" ry="8" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
            <path d="M7 11 L10 14 L17 9" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <!-- 3D Bookmark Ribbon hanging down -->
          <polygon points="50,54 56,57 56,76 50,72 44,76 44,57" fill="#ef4444" />
        </g>
      </svg>
    `
  },

  slides: [
    {
      title: 'تنظيم الجداول الدراسية والمحاضرات',
      subtitle: 'متابعة مباشرة للقاعات، أوقات المحاضرات، وكشف التوقيت الفعلي للمحاضرة الجارية',
      badge: 'الجدول الأكاديمي',
      gradient: 'from-sky-500/10 via-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-600/20',
      border: 'border-cyan-300 dark:border-cyan-500/40',
      icon3D: 'calendar3D'
    },
    {
      title: 'جدول الامتحانات والعد التنازلي',
      subtitle: 'إشعار مباشر بمواعيد الامتحانات الشهرية والنهائية مع عداد رقمي بالثواني',
      badge: 'الاستعداد للامتحانات',
      gradient: 'from-purple-500/10 via-fuchsia-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-600/20',
      border: 'border-purple-300 dark:border-purple-500/40',
      icon3D: 'clock3D'
    },
    {
      title: 'متابعة الواجبات والتقارير الأكاديمية',
      subtitle: 'إدارة متكاملة للتكاليف الجامعية مع إمكانية التحديد الفردي للمهام المنجزة',
      badge: 'المهام والتكاليف',
      gradient: 'from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-500/20 dark:to-teal-600/20',
      border: 'border-emerald-300 dark:border-emerald-500/40',
      icon3D: 'book3D'
    }
  ],

  async render(container) {
    this.cleanup();
    const settings = await window.Store.getSettings();

    container.innerHTML = `
      <div class="relative min-h-screen flex flex-col justify-between overflow-hidden">
        <!-- Floating Subtle Ambient Blobs -->
        <div class="ambient-orb w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/15 top-[-10%] right-[-10%]"></div>
        <div class="ambient-orb w-96 h-96 bg-purple-500/20 dark:bg-purple-600/15 bottom-[10%] left-[-10%]" style="animation-delay: -6s;"></div>

        <!-- Header -->
        <header class="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg glow-cyan border border-white/20">
              ${UI.icons.book}
            </div>
            <div>
              <span class="text-base font-extrabold tracking-tight text-gray-900 dark:text-white block">${settings.platformName || 'المنصة الجامعية الموحدة'}</span>
            </div>
          </div>

          <!-- Theme Switcher -->
          <div class="flex items-center gap-3">
            ${UI.getThemeButtonHtml()}
          </div>
        </header>

        <!-- Main Body -->
        <main class="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full">
          <!-- Animated Academic Visual Carousel Slider with 3D Icons -->
          <div class="mb-10 sm:mb-12">
            <div class="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 border border-gray-200/80 dark:border-white/10 shadow-xl min-h-[230px] sm:min-h-[250px] flex flex-col justify-between bg-white/80 dark:bg-[#111122]/90 backdrop-blur-xl" id="landing-carousel-card">
              <!-- Slide Content Injected by JS -->
              <div id="carousel-content-wrapper" class="transition-opacity duration-300">
                <!-- Dynamic slide here -->
              </div>

              <!-- Carousel Indicators -->
              <div class="flex items-center justify-center gap-2 pt-6">
                ${this.slides.map((_, i) => `
                  <button 
                    type="button" 
                    data-slide-index="${i}" 
                    class="carousel-indicator w-8 h-2 rounded-full transition-all duration-300 cursor-pointer ${i === 0 ? 'bg-cyan-500 w-10' : 'bg-gray-300 dark:bg-white/20'}"
                    aria-label="شريحة ${i + 1}"
                  ></button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Action CTA Buttons Section -->
          <div class="bg-white/90 dark:bg-[#111122]/90 border border-gray-200 dark:border-white/10 p-5 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl relative">
            <div class="text-center mb-6">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">اختر بوابتك للدخول إلى المنصة</h2>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">تصفح مباشر وسريع للطلبة أو دخول برمز الممثل</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Reps Button -->
              <a 
                href="#/rep/login" 
                class="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-[#1c1433] hover:bg-purple-100/90 dark:hover:bg-[#251945] border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 text-purple-950 dark:text-white transition-all duration-200 glow-purple cursor-pointer shadow-sm"
              >
                <div class="flex items-center gap-3.5">
                  <div class="w-11 h-11 rounded-xl bg-purple-200/80 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition">
                    ${UI.icons.users}
                  </div>
                  <div class="text-right">
                    <span class="block text-base font-bold text-purple-900 dark:text-purple-100">بوابة الممثلين</span>
                    <span class="block text-xs text-purple-600 dark:text-purple-300/80">إدارة الجداول والتكاليف بالرمز</span>
                  </div>
                </div>
                <div class="text-purple-600 dark:text-purple-400 group-hover:-translate-x-1 transition">
                  ${UI.icons.arrowLeft}
                </div>
              </a>

              <!-- Morning Student Button -->
              <a 
                href="#/student/morning" 
                class="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-sky-50/70 dark:bg-[#0e2738] hover:bg-sky-100/90 dark:hover:bg-[#12334a] border border-sky-200 dark:border-cyan-500/30 hover:border-cyan-400 text-sky-950 dark:text-white transition-all duration-200 glow-cyan cursor-pointer shadow-sm"
              >
                <div class="flex items-center gap-3.5">
                  <div class="w-11 h-11 rounded-xl bg-cyan-200/80 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center group-hover:scale-105 transition">
                    ${UI.icons.book}
                  </div>
                  <div class="text-right">
                    <span class="block text-base font-bold text-cyan-900 dark:text-cyan-100">طلاب الدراسة الصباحية</span>
                    <span class="block text-xs text-cyan-600 dark:text-cyan-300/80">جدول المحاضرات والامتحانات</span>
                  </div>
                </div>
                <div class="text-cyan-600 dark:text-cyan-400 group-hover:-translate-x-1 transition">
                  ${UI.icons.arrowLeft}
                </div>
              </a>

              <!-- Evening Student Button -->
              <a 
                href="#/student/evening" 
                class="group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50/70 to-purple-50/70 dark:from-[#0c2438] dark:to-[#1f1538] hover:from-sky-100 hover:to-purple-100 dark:hover:from-[#11314b] dark:hover:to-[#2b1b4f] border border-cyan-200 dark:border-cyan-500/30 hover:border-purple-400 text-gray-900 dark:text-white transition-all duration-200 glow-mixed cursor-pointer shadow-sm"
              >
                <div class="flex items-center gap-3.5">
                  <div class="w-11 h-11 rounded-xl bg-purple-200/80 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition">
                    ${UI.icons.calendar}
                  </div>
                  <div class="text-right">
                    <span class="block text-base font-bold text-gray-900 dark:text-white">طلاب الدراسة المسائية</span>
                    <span class="block text-xs text-gray-600 dark:text-gray-300">جدول وتكاليف الفترة المسائية</span>
                  </div>
                </div>
                <div class="text-purple-600 dark:text-purple-400 group-hover:-translate-x-1 transition">
                  ${UI.icons.arrowLeft}
                </div>
              </a>
            </div>
          </div>
        </main>

        <!-- Footer with secret admin trigger -->
        <footer class="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-gray-500">
          <div>
            <span class="text-gray-600 dark:text-gray-400 font-semibold">${settings.platformName || 'المنصة الجامعية'}</span>
          </div>

          <div class="flex items-center gap-3">
            <button 
              id="secret-admin-trigger"
              type="button" 
              class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-200 dark:hover:bg-white/5 transition opacity-30 hover:opacity-100 cursor-pointer"
              title="لوحة الإدارة"
              aria-label="لوحة الإدارة"
            >
              ${UI.icons.shield}
            </button>
          </div>
        </footer>
      </div>
    `;

    UI.attachThemeToggle();
    this.renderSlide(0);
    this.startCarousel();

    const adminBtn = container.querySelector('#secret-admin-trigger');
    if (adminBtn) {
      adminBtn.onclick = (e) => {
        e.preventDefault();
        this.handleClickTrigger();
      };
    }

    container.querySelectorAll('.carousel-indicator').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.slideIndex);
        this.renderSlide(idx);
        this.startCarousel();
      };
    });
  },

  renderSlide(index) {
    this.currentSlide = index;
    const slide = this.slides[index];
    const wrapper = document.getElementById('carousel-content-wrapper');
    if (!wrapper) return;

    const icon3DHtml = this.icons3D[slide.icon3D] || '';

    wrapper.style.opacity = '0';
    setTimeout(() => {
      wrapper.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="text-right flex-1">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 mb-3">
              ${UI.icons.sparkles}
              <span>${slide.badge}</span>
            </span>
            <h3 class="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-snug">${slide.title}</h3>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">${slide.subtitle}</p>
          </div>
          <!-- 3D tr Icon Only -->
          <div class="flex items-center justify-center p-3 rounded-3xl bg-gradient-to-tr ${slide.gradient} border ${slide.border} shadow-lg flex-shrink-0">
            ${icon3DHtml}
          </div>
        </div>
      `;
      wrapper.style.opacity = '1';

      document.querySelectorAll('.carousel-indicator').forEach((dot, i) => {
        if (i === index) {
          dot.className = 'carousel-indicator h-2 rounded-full transition-all duration-300 cursor-pointer bg-cyan-500 w-10';
        } else {
          dot.className = 'carousel-indicator h-2 rounded-full transition-all duration-300 cursor-pointer bg-gray-300 dark:bg-white/20 w-8';
        }
      });
    }, 150);
  },

  startCarousel() {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    this.carouselTimer = setInterval(() => {
      const next = (this.currentSlide + 1) % this.slides.length;
      this.renderSlide(next);
    }, 4500);
  },

  cleanup() {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  },

  handleClickTrigger() {
    this.clickCount++;
    if (this.clickTimer) clearTimeout(this.clickTimer);

    if (this.clickCount >= 3) {
      this.clickCount = 0;
      UI.showAdminPasswordModal();
    } else {
      this.clickTimer = setTimeout(() => {
        this.clickCount = 0;
      }, 1500);
    }
  }
};

window.Landing = Landing;
