/**
 * Admin Dashboard - Platform Owner Control Center
 * Features:
 * - Direct authentication with Master code '00' or saved hash
 * - Theme Switcher integration (White / Dark)
 * - Complete Representatives Management with Realm DB
 * - Platform settings & Backup/Restore
 */

const Admin = {
  activeTab: 'reps', // 'overview' | 'reps' | 'settings'
  searchQuery: '',
  shiftFilter: 'all',
  statusFilter: 'all',

  async render(container) {
    const session = window.Auth.getAdminSession();
    if (!session) {
      UI.toast('يجب تسجيل الدخول كمسؤول أولاً', 'error');
      window.location.hash = '#/';
      return;
    }

    const settings = await window.Store.getSettings();
    const reps = await window.Store.getReps();
    const morningData = await window.Store.getShiftData('morning');
    const eveningData = await window.Store.getShiftData('evening');

    container.innerHTML = `
      <div class="min-h-screen pb-16 relative overflow-hidden">
        <!-- Ambient Neon Lights -->
        <div class="ambient-orb w-96 h-96 bg-cyan-500/15 top-0 right-0"></div>
        <div class="ambient-orb w-96 h-96 bg-purple-600/15 bottom-10 left-0" style="animation-delay: -7s;"></div>

        <!-- Top Header -->
        <header class="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0c1c]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3.5 mb-6 shadow-sm">
          <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white shadow-lg glow-mixed">
                ${UI.icons.shield}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">لوحة تحكم صاحب المنصة</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-badge"></span>
                    أدمن
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30">
                    Appwrite Cloud ☁️
                  </span>
                </div>
                <p class="text-xs text-gray-500">إدارة الممثلين، الإعدادات، والمزامنة السحابية الحية</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <a 
                href="#/" 
                class="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="الرئيسية"
              >
                ${UI.icons.home}
                <span class="hidden sm:inline">الرئيسية</span>
              </a>

              ${UI.getThemeButtonHtml()}

              <button 
                type="button" 
                id="admin-logout-btn" 
                class="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-200 dark:hover:bg-rose-500/20 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="تسجيل الخروج"
              >
                ${UI.icons.logout}
                <span>خروج</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Workspace -->
        <main class="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div class="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-2xl mb-6 overflow-x-auto">
            <button 
              type="button" 
              data-admin-tab="overview" 
              class="admin-tab-btn flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'overview' ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white glow-cyan' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.sparkles}
              <span>نظرة عامة وإحصائيات</span>
            </button>
            <button 
              type="button" 
              data-admin-tab="reps" 
              class="admin-tab-btn flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'reps' ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white glow-cyan' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.users}
              <span>إدارة الممثلين (${reps.length})</span>
            </button>
            <button 
              type="button" 
              data-admin-tab="settings" 
              class="admin-tab-btn flex-1 min-w-[130px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'settings' ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white glow-cyan' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.settings}
              <span>إعدادات المنصة والنسخ</span>
            </button>
          </div>

          <div id="admin-content-area">
            ${this.renderActiveTab(settings, reps, morningData, eveningData)}
          </div>
        </main>
      </div>
    `;

    UI.attachThemeToggle();
    this.bindEvents(container);
  },

  renderActiveTab(settings, reps, morningData, eveningData) {
    if (this.activeTab === 'overview') {
      return this.renderOverviewTab(settings, reps, morningData, eveningData);
    } else if (this.activeTab === 'reps') {
      return this.renderRepsTab(reps);
    } else if (this.activeTab === 'settings') {
      return this.renderSettingsTab(settings);
    }
    return '';
  },

  renderOverviewTab(settings, reps, morningData, eveningData) {
    const activeReps = reps.filter(r => r.active).length;
    const totalLectures = (morningData.lectures || []).length + (eveningData.lectures || []).length;
    const totalExams = (morningData.exams || []).length + (eveningData.exams || []).length;
    const totalAssignments = (morningData.assignments || []).length + (eveningData.assignments || []).length;

    return `
      <div class="space-y-6 animate-fade-in">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10">
            <span class="text-xs text-gray-500 block mb-1">الممثلين المعتمدين</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl sm:text-3xl font-black font-mono-numeric text-gray-900 dark:text-white">${reps.length}</span>
              <span class="text-xs text-emerald-600 dark:text-emerald-400">(${activeReps} نشط)</span>
            </div>
          </div>

          <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10">
            <span class="text-xs text-gray-500 block mb-1">إجمالي المحاضرات</span>
            <span class="text-2xl sm:text-3xl font-black font-mono-numeric text-cyan-600 dark:text-cyan-400">${totalLectures}</span>
          </div>

          <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10">
            <span class="text-xs text-gray-500 block mb-1">الامتحانات المجدولة</span>
            <span class="text-2xl sm:text-3xl font-black font-mono-numeric text-purple-600 dark:text-purple-400">${totalExams}</span>
          </div>

          <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10">
            <span class="text-xs text-gray-500 block mb-1">الواجبات والتقارير</span>
            <span class="text-2xl sm:text-3xl font-black font-mono-numeric text-emerald-600 dark:text-emerald-400">${totalAssignments}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 rounded-3xl glass-panel border border-cyan-400/40">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-gray-900 dark:text-white">شعبة الدراسة الصباحية</h3>
              <a href="#/student/morning" target="_blank" class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <span>معاينة</span>
                ${UI.icons.arrowRight}
              </a>
            </div>
            <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>المحاضرات:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(morningData.lectures || []).length}</strong>
              </div>
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>الامتحانات:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(morningData.exams || []).length}</strong>
              </div>
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>الواجبات والتقارير:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(morningData.assignments || []).length}</strong>
              </div>
            </div>
          </div>

          <div class="p-6 rounded-3xl glass-panel border border-purple-400/40">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-gray-900 dark:text-white">شعبة الدراسة المسائية</h3>
              <a href="#/student/evening" target="_blank" class="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span>معاينة</span>
                ${UI.icons.arrowRight}
              </a>
            </div>
            <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>المحاضرات:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(eveningData.lectures || []).length}</strong>
              </div>
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>الامتحانات:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(eveningData.exams || []).length}</strong>
              </div>
              <div class="flex justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5">
                <span>الواجبات والتقارير:</span> <strong class="font-mono-numeric text-gray-900 dark:text-white">${(eveningData.assignments || []).length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderRepsTab(reps) {
    let filtered = reps;
    if (this.shiftFilter !== 'all') {
      filtered = filtered.filter(r => r.shifts && r.shifts.includes(this.shiftFilter));
    }
    if (this.statusFilter !== 'all') {
      const wantActive = this.statusFilter === 'active';
      filtered = filtered.filter(r => r.active === wantActive);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) || 
        (r.code && r.code.toLowerCase().includes(q))
      );
    }

    return `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-1 max-w-lg">
            <div class="relative flex-1">
              <input 
                type="text" 
                id="admin-rep-search" 
                placeholder="بحث بالاسم أو رمز الدخول..." 
                value="${this.searchQuery}"
                class="w-full bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
              <span class="absolute left-3 top-3 text-gray-400">${UI.icons.search}</span>
            </div>

            <select id="admin-rep-shift-filter" class="bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-white focus:outline-none cursor-pointer">
              <option value="all" ${this.shiftFilter === 'all' ? 'selected' : ''}>كل الصلاحيات</option>
              <option value="morning" ${this.shiftFilter === 'morning' ? 'selected' : ''}>صباحي</option>
              <option value="evening" ${this.shiftFilter === 'evening' ? 'selected' : ''}>مسائي</option>
            </select>
          </div>

          <button 
            type="button" 
            id="btn-add-rep" 
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 glow-cyan cursor-pointer"
          >
            ${UI.icons.plus}
            <span>إضافة ممثل جديد</span>
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${UI.icons.users}
            </div>
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا يوجد ممثلون مطابقون</h4>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtered.map(rep => `
              <div class="p-5 rounded-2xl glass-panel border ${rep.active ? 'border-gray-200 dark:border-white/10' : 'border-rose-400/50 opacity-75'} hover:border-cyan-500/40 transition flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="inline-flex items-center gap-1.5 text-xs font-bold ${rep.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}">
                      <span class="w-2 h-2 rounded-full ${rep.active ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                      ${rep.active ? 'حساب نشط' : 'معطل'}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300">
                      ${rep.shifts.includes('morning') && rep.shifts.includes('evening') ? 'كلا الشعبتين' : rep.shifts.includes('morning') ? 'صباحي' : 'مسائي'}
                    </span>
                  </div>

                  <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2">${rep.name}</h3>

                  <div class="p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-2 mb-4">
                    <div>
                      <span class="block text-[10px] text-gray-500 font-semibold">رمز الدخول</span>
                      <span class="font-mono-numeric text-sm font-bold text-cyan-700 dark:text-cyan-300 tracking-wider">${rep.code}</span>
                    </div>
                    <button type="button" data-copy-code="${rep.code}" class="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
                      ${UI.icons.copy}
                      <span>نسخ</span>
                    </button>
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <button type="button" data-toggle-rep="${rep.id}" data-active="${rep.active}" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${rep.active ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'}">
                      ${rep.active ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button type="button" data-regen-code="${rep.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-300 transition cursor-pointer" title="توليد رمز جديد">
                      ${UI.icons.refresh}
                    </button>
                  </div>

                  <div class="flex items-center gap-2">
                    <button type="button" data-edit-rep="${rep.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-300 transition cursor-pointer" title="تعديل">
                      ${UI.icons.edit}
                    </button>
                    <button type="button" data-delete-rep="${rep.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition cursor-pointer" title="حذف">
                      ${UI.icons.trash}
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderSettingsTab(settings) {
    return `
      <div class="space-y-8 animate-fade-in">
        <div class="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-white/10">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ${UI.icons.settings}
            <span>إعدادات وهوية المنصة</span>
          </h3>

          <form id="platform-settings-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم المنصة *</label>
              <input type="text" id="set-platform-name" required value="${settings.platformName || 'المنصة الجامعية الموحدة'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500" />
            </div>

            <div class="pt-2 flex justify-end">
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm glow-cyan transition cursor-pointer">
                حفظ اسم المنصة
              </button>
            </div>
          </form>
        </div>

        <!-- Password Change -->
        <div class="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-white/10">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            ${UI.icons.lock}
            <span>تغيير كلمة مرور الأدمن</span>
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">كلمة المرور الافتراضية هي 00.</p>

          <form id="change-admin-pass-form" class="space-y-4 max-w-md">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية *</label>
              <input type="password" id="old-pass" required placeholder="00" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة *</label>
              <input type="password" id="new-pass" required placeholder="كلمة جديدة" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none" />
            </div>
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer">
              تحديث كلمة المرور
            </button>
          </form>
        </div>

        <!-- Backup & Restore -->
        <div class="p-6 rounded-3xl glass-panel border border-gray-200 dark:border-white/10">
          <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            ${UI.icons.refresh}
            <span>النسخ الاحتياطي (Realm DB)</span>
          </h3>
          <div class="flex flex-wrap items-center gap-4 mt-4">
            <button type="button" id="btn-export-backup" class="px-5 py-3 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer">
              ${UI.icons.download}
              <span>تصدير نسخة Realm (JSON)</span>
            </button>

            <label class="px-5 py-3 rounded-xl bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer">
              ${UI.icons.upload}
              <span>استعادة نسخة</span>
              <input type="file" id="file-import-backup" accept=".json" class="hidden" />
            </label>

            <button type="button" id="btn-factory-reset" class="px-5 py-3 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-600 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer mr-auto">
              ${UI.icons.trash}
              <span>إعادة ضبط المصنع</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    const logoutBtn = container.querySelector('#admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        window.Auth.logoutAdmin();
        // Silent logout without toast notification as requested
        window.location.hash = '#/';
      };
    }

    container.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.adminTab;
        this.render(container);
      };
    });

    const searchInput = container.querySelector('#admin-rep-search');
    if (searchInput) searchInput.oninput = (e) => { this.searchQuery = e.target.value; this.render(container); };

    const shiftFilter = container.querySelector('#admin-rep-shift-filter');
    if (shiftFilter) shiftFilter.onchange = (e) => { this.shiftFilter = e.target.value; this.render(container); };

    container.querySelectorAll('[data-copy-code]').forEach(btn => {
      btn.onclick = () => {
        navigator.clipboard.writeText(btn.dataset.copyCode).then(() => {
          UI.toast(`تم نسخ الرمز (${btn.dataset.copyCode}) بنجاح ✓`, 'success');
        });
      };
    });

    const addRepBtn = container.querySelector('#btn-add-rep');
    if (addRepBtn) addRepBtn.onclick = () => this.showAddRepModal(container);

    container.querySelectorAll('[data-edit-rep]').forEach(btn => {
      btn.onclick = async () => {
        const rep = await window.Store.getRepById(btn.dataset.editRep);
        if (rep) this.showEditRepModal(container, rep);
      };
    });

    container.querySelectorAll('[data-toggle-rep]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.toggleRep;
        const currentActive = btn.dataset.active === 'true';
        await window.Store.updateRep(id, { active: !currentActive });
        UI.toast(!currentActive ? 'تم تفعيل حساب الممثل' : 'تم تعطيل الحساب وإلغاء الجلسة', 'info');
        this.render(container);
      };
    });

    container.querySelectorAll('[data-regen-code]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.regenCode;
        const ok = await UI.confirm({
          title: 'توليد رمز جديد',
          message: 'هل تريد توليد رمز جديد وإبطال الرمز القديم؟',
          confirmText: 'نعم، ولد رمزاً جديداً'
        });
        if (ok) {
          const newCode = await window.Store.regenerateRepCode(id);
          UI.toast(`الرمز الجديد: ${newCode}`, 'success');
          this.render(container);
        }
      };
    });

    container.querySelectorAll('[data-delete-rep]').forEach(btn => {
      btn.onclick = async () => {
        const ok = await UI.confirm({
          title: 'حذف الممثل',
          message: 'هل أنت متأكد من حذف هذا الممثل نهائياً؟',
          isDestructive: true,
          confirmText: 'نعم، احذف'
        });
        if (ok) {
          await window.Store.deleteRep(btn.dataset.deleteRep);
          UI.toast('تم حذف الممثل بنجاح', 'success');
          this.render(container);
        }
      };
    });

    const settingsForm = container.querySelector('#platform-settings-form');
    if (settingsForm) {
      settingsForm.onsubmit = async (e) => {
        e.preventDefault();
        const platformName = document.getElementById('set-platform-name').value;
        await window.Store.saveSettings({ platformName });
        UI.toast('تم حفظ اسم المنصة بنجاح ✓', 'success');
      };
    }

    const passForm = container.querySelector('#change-admin-pass-form');
    if (passForm) {
      passForm.onsubmit = async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('old-pass').value.trim();
        const newPass = document.getElementById('new-pass').value.trim();

        const settings = await window.Store.getSettings();
        const oldHash = await window.Store.sha256(oldPass);

        if (oldPass !== '00' && oldHash !== settings.adminPasswordHash) {
          UI.toast('كلمة المرور الحالية غير صحيحة!', 'error');
          return;
        }

        const newHash = await window.Store.sha256(newPass);
        await window.Store.saveSettings({ adminPasswordHash: newHash });
        UI.toast('تم تغيير كلمة المرور بنجاح', 'success');
        passForm.reset();
      };
    }

    const exportBtn = container.querySelector('#btn-export-backup');
    if (exportBtn) {
      exportBtn.onclick = async () => {
        const jsonStr = await window.Store.exportAll();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `realm-uni-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('تم تصدير نسخة Realm DB بنجاح', 'success');
      };
    }

    const fileImport = container.querySelector('#file-import-backup');
    if (fileImport) {
      fileImport.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const result = await window.Store.importAll(evt.target.result, true);
            if (result && result.ok === false) {
              UI.toast('تم الاستيراد محلياً، لكن تعذر رفع بعض البيانات إلى السحابة', 'warning', 5000);
            } else {
              UI.toast('تمت استعادة البيانات ومزامنتها مع السحابة ✓', 'success');
            }
            this.render(container);
          } catch (err) {
            UI.toast(err && err.message ? err.message : 'صيغة الملف غير صحيحة', 'error');
          }
        };
        reader.readAsText(file);
      };
    }

    const resetBtn = container.querySelector('#btn-factory-reset');
    if (resetBtn) {
      resetBtn.onclick = async () => {
        const ok = await UI.confirm({
          title: 'إعادة ضبط المصنع',
          message: 'هل تريد إعادة ضبط البيانات المحلية والسحابية إلى الحالة الافتراضية؟ لا يمكن التراجع عن هذا الإجراء.',
          isDestructive: true,
          confirmText: 'نعم، أعد الضبط'
        });
        if (ok) {
          await window.Store.resetFactory(true, true);
          UI.toast('تمت إعادة الضبط محلياً وعلى السحابة', 'info');
          this.render(container);
        }
      };
    }
  },

  showAddRepModal(container) {
    const code = window.Store.generateRepCode();
    const content = `
      <form id="add-rep-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم الممثل *</label>
          <input type="text" id="add-rep-name" required placeholder="محمد أحمد" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">الشعبة *</label>
          <select id="add-rep-shifts" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
            <option value="morning">الدراسة الصباحية فقط</option>
            <option value="evening">الدراسة المسائية فقط</option>
            <option value="both">كلا الشعبتين (صباحي + مسائي)</option>
          </select>
        </div>
        <div class="p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-cyan-400/30 flex items-center justify-between">
          <span class="font-mono-numeric font-bold text-sm text-cyan-700 dark:text-cyan-300">${code}</span>
          <span class="text-xs text-gray-500">رمز فريد آمن</span>
        </div>
      </form>
    `;

    UI.showModal({
      title: 'إضافة ممثل جديد',
      content,
      size: 'max-w-md',
      footerButtons: [
        { text: 'إلغاء', onClick: (close) => close() },
        {
          text: 'اعتماد الممثل',
          isPrimary: true,
          onClick: async (close) => {
            const form = document.getElementById('add-rep-form');
            if (!form.reportValidity()) return;

            const name = document.getElementById('add-rep-name').value;
            const shiftVal = document.getElementById('add-rep-shifts').value;
            const shifts = shiftVal === 'both' ? ['morning', 'evening'] : [shiftVal];

            const created = await window.Store.addRep({ name, code, shifts, active: true });
            close();
            UI.toast(`تم اعتماد الممثل بنجاح. رمزه: ${created.code}`, 'success', 5000);
            this.render(container);
          }
        }
      ]
    });
  },

  showEditRepModal(container, rep) {
    const currentShiftVal = rep.shifts.includes('morning') && rep.shifts.includes('evening') ? 'both' : rep.shifts[0];
    const content = `
      <form id="edit-rep-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم الممثل *</label>
          <input type="text" id="edit-rep-name" required value="${rep.name}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">الصلاحية *</label>
          <select id="edit-rep-shifts" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
            <option value="morning" ${currentShiftVal === 'morning' ? 'selected' : ''}>الدراسة الصباحية فقط</option>
            <option value="evening" ${currentShiftVal === 'evening' ? 'selected' : ''}>الدراسة المسائية فقط</option>
            <option value="both" ${currentShiftVal === 'both' ? 'selected' : ''}>كلا الشعبتين (صباحي + مسائي)</option>
          </select>
        </div>
      </form>
    `;

    UI.showModal({
      title: 'تعديل الممثل',
      content,
      size: 'max-w-md',
      footerButtons: [
        { text: 'إلغاء', onClick: (close) => close() },
        {
          text: 'حفظ',
          isPrimary: true,
          onClick: async (close) => {
            const form = document.getElementById('edit-rep-form');
            if (!form.reportValidity()) return;

            const name = document.getElementById('edit-rep-name').value;
            const shiftVal = document.getElementById('edit-rep-shifts').value;
            const shifts = shiftVal === 'both' ? ['morning', 'evening'] : [shiftVal];

            await window.Store.updateRep(rep.id, { name, shifts });
            close();
            UI.toast('تم حفظ التعديلات بنجاح', 'success');
            this.render(container);
          }
        }
      ]
    });
  }
};

window.Admin = Admin;
