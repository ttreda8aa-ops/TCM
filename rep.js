/**
 * Representative Portal - Login and Management Dashboard
 * Features:
 * - Mark Exam as Finished/Completed button next to Edit & Delete
 * - Separate Assignments (الواجبات) & Reports (التقارير)
 * - Complete CRUD Modals with validations & conflict warnings
 * - Theme Switcher integration
 */

const Rep = {
  activeTab: 'lectures', // 'lectures' | 'exams' | 'assignments' | 'reports'
  currentShift: 'morning',
  repSession: null,
  searchQuery: '',
  dayFilter: 'all',

  async renderLogin(container) {
    const existing = await window.Auth.getRepSession();
    if (existing) {
      window.location.hash = '#/rep/dashboard';
      return;
    }

    const lockout = window.Auth.isLockedOut();

    container.innerHTML = `
      <div class="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-50 dark:bg-[#070714]">
        <!-- Modern Grid & Ambient Glows -->
        <div class="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e1e38_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div class="ambient-orb w-[450px] h-[450px] bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 top-[-100px] right-[-100px] blur-3xl"></div>
        <div class="ambient-orb w-[450px] h-[450px] bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 bottom-[-100px] left-[-100px] blur-3xl" style="animation-delay: -3s;"></div>

        <!-- Top Right Controls -->
        <div class="absolute top-6 right-6 z-20 flex items-center gap-3">
          <a 
            href="#/" 
            class="px-4 py-2 rounded-2xl bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm backdrop-blur-md"
          >
            ${UI.icons.arrowRight}
            <span>الرئيسية</span>
          </a>
          ${UI.getThemeButtonHtml()}
        </div>

        <!-- Luxury Glass Card -->
        <div class="w-full max-w-md bg-white/95 dark:bg-[#0f0f23]/90 border border-slate-200/80 dark:border-purple-500/20 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 animate-scale-up">
          
          <!-- Header & Badge -->
          <div class="text-center mb-8">
            <div class="relative w-20 h-20 mx-auto mb-5">
              <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-500 blur-lg opacity-60"></div>
              <div class="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-xl">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
            </div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 mb-3">
              <span>بوابة الإدارة الأكاديمية</span>
            </div>

            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">تسجيل دخول الممثلين</h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">أدخل رمز الوصول الخاص بشعبتك لإدارة المحاضرات والتكاليف</p>
          </div>

          <div id="lockout-banner" class="${lockout.locked ? 'block' : 'hidden'} mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-bold">
            النظام مقفل مؤقتاً. يرجى الانتظار <span id="lockout-timer">${lockout.remainingSeconds}</span> ثانية.
          </div>

          <!-- Form -->
          <form id="rep-login-form" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">رمز الدخول المعتمد</label>
              <div class="relative">
                <input 
                  type="text" 
                  id="rep-code-input" 
                  placeholder="XXXX-XXXX" 
                  required
                  autocomplete="off"
                  autocapitalize="characters"
                  ${lockout.locked ? 'disabled' : ''}
                  class="w-full bg-slate-50 dark:bg-[#16162e] border-2 border-slate-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-500 rounded-2xl px-5 py-4 text-slate-900 dark:text-white text-center font-mono-numeric tracking-[0.25em] text-xl font-bold focus:outline-none transition-all shadow-inner"
                />
              </div>
              <p id="rep-login-error" class="text-xs text-rose-500 mt-2.5 hidden text-center font-bold animate-shake"></p>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
              <label class="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" id="rep-remember-me" class="w-4 h-4 rounded-lg text-purple-600 focus:ring-0 cursor-pointer" />
                <span class="font-medium">تذكر هذا الجهاز</span>
              </label>
              <span class="text-[11px] text-slate-400">مشفر وآمن</span>
            </div>

            <button 
              type="submit" 
              ${lockout.locked ? 'disabled' : ''}
              class="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/25 dark:shadow-purple-950/50 hover:shadow-purple-500/40 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group mt-2"
            >
              <span>دخول إلى لوحة التحكم</span>
              <span class="transition-transform group-hover:-translate-x-1">${UI.icons.arrowLeft}</span>
            </button>
          </form>

        </div>
      </div>
    `;

    UI.attachThemeToggle();

    const form = container.querySelector('#rep-login-form');
    const input = container.querySelector('#rep-code-input');
    const rememberMe = container.querySelector('#rep-remember-me');
    const errorEl = container.querySelector('#rep-login-error');

    form.onsubmit = async (e) => {
      e.preventDefault();
      errorEl.classList.add('hidden');
      try {
        const rep = await window.Auth.loginRep(input.value, rememberMe.checked);
        // Silent login without toast notification as requested
        window.location.hash = '#/rep/dashboard';
      } catch (err) {
        input.classList.add('animate-shake', 'border-rose-500');
        errorEl.textContent = err.message || 'فشل تسجيل الدخول';
        errorEl.classList.remove('hidden');
        setTimeout(() => input.classList.remove('animate-shake'), 400);

        const lo = window.Auth.isLockedOut();
        if (lo.locked) this.renderLogin(container);
      }
    };
  },

  async renderDashboard(container) {
    const session = await window.Auth.getRepSession();
    if (!session) {
      UI.toast('انتهت الجلسة أو تم إلغاء الصلاحية من الإدارة', 'warning');
      window.location.hash = '#/rep/login';
      return;
    }

    this.repSession = session;
    const allowedShifts = session.shifts || ['morning'];
    const canSwitchShifts = allowedShifts.includes('morning') && allowedShifts.includes('evening');

    if (!allowedShifts.includes(this.currentShift)) {
      this.currentShift = allowedShifts[0];
    }

    const shiftData = await window.Store.getShiftData(this.currentShift);
    const settings = await window.Store.getSettings();

    const isMorning = this.currentShift === 'morning';
    const currentShiftTitle = isMorning ? 'الدراسة الصباحية' : 'الدراسة المسائية';

    const assignmentsOnly = (shiftData.assignments || []).filter(a => a.kind === 'assignment');
    const reportsOnly = (shiftData.assignments || []).filter(a => a.kind === 'report');

    container.innerHTML = `
      <div class="min-h-screen pb-16 relative overflow-hidden">
        <!-- Ambient Lights -->
        <div class="ambient-orb w-96 h-96 bg-purple-600/15 top-0 left-0"></div>
        <div class="ambient-orb w-96 h-96 bg-cyan-500/15 bottom-0 right-0" style="animation-delay: -5s;"></div>

        <!-- Top Header -->
        <header class="sticky top-0 z-40 bg-white/95 dark:bg-[#0c0c1a]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3.5 mb-6 shadow-sm">
          <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shadow-md">
                ${UI.icons.user}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-sm sm:text-base font-bold text-gray-900 dark:text-white">${session.name}</h1>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
                    ممثل الدفعة
                  </span>
                </div>
                <p class="text-xs text-gray-500">إدارة: <span class="text-cyan-600 dark:text-cyan-400 font-bold">${currentShiftTitle}</span></p>
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              ${canSwitchShifts ? `
                <div class="flex items-center bg-gray-100 dark:bg-[#15152a] p-1 rounded-xl border border-gray-200 dark:border-white/10 text-xs">
                  <button type="button" id="shift-switch-morning" class="px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${isMorning ? 'bg-cyan-600 text-white' : 'text-gray-600 dark:text-gray-400'}">
                    الصباحي
                  </button>
                  <button type="button" id="shift-switch-evening" class="px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${!isMorning ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400'}">
                    المسائي
                  </button>
                </div>
              ` : ''}

              <!-- Preview as Student -->
              <a 
                href="#/student/${this.currentShift}" 
                target="_blank"
                class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs font-bold transition cursor-pointer"
                title="معاينة كطالب"
              >
                ${UI.icons.arrowRight}
                <span>معاينة كطالب</span>
              </a>

              ${UI.getThemeButtonHtml()}

              <!-- Logout -->
              <button 
                type="button" 
                id="rep-logout-btn" 
                class="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                title="تسجيل الخروج"
              >
                ${UI.icons.logout}
                <span class="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Body -->
        <main class="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <!-- Urgent Alert Management Button -->
          <div class="flex items-center justify-between mb-4">
            <button 
              type="button" 
              id="btn-add-urgent-alert" 
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              ${UI.icons.alert}
              <span>إدارة التنبيه العاجل</span>
            </button>
            ${shiftData.urgentAlert && shiftData.urgentAlert.active ? `
              <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5">
                ${UI.icons.check}
                <span>تنبيه مفعّل حالياً</span>
              </span>
            ` : `
              <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10">
                لا يوجد تنبيه مفعّل
              </span>
            `}
          </div>

          <!-- Workspace Tabs -->
          <div class="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-2xl mb-6 overflow-x-auto">
            <button 
              type="button" 
              data-rep-tab="lectures" 
              class="rep-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'lectures' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white glow-purple' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.calendar}
              <span>المحاضرات (${(shiftData.lectures || []).length})</span>
            </button>
            <button 
              type="button" 
              data-rep-tab="exams" 
              class="rep-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'exams' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white glow-purple' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.clock}
              <span>الامتحانات (${(shiftData.exams || []).length})</span>
            </button>
            <button 
              type="button" 
              data-rep-tab="assignments" 
              class="rep-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'assignments' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white glow-purple' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.checkCircle}
              <span>الواجبات (${assignmentsOnly.length})</span>
            </button>
            <button 
              type="button" 
              data-rep-tab="reports" 
              class="rep-tab-btn flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'reports' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white glow-purple' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.fileText}
              <span>التقارير (${reportsOnly.length})</span>
            </button>
          </div>

          <div id="rep-tab-view">
            ${this.renderActiveTabContent(shiftData, settings)}
          </div>
        </main>
      </div>
    `;

    UI.attachThemeToggle();
    this.bindDashboardEvents(container);
  },

  renderActiveTabContent(shiftData, settings) {
    if (this.activeTab === 'lectures') {
      return this.renderLecturesManager(shiftData.lectures || [], settings);
    } else if (this.activeTab === 'exams') {
      return this.renderExamsManager(shiftData.exams || [], settings);
    } else if (this.activeTab === 'assignments') {
      const assignments = (shiftData.assignments || []).filter(a => a.kind === 'assignment');
      return this.renderAssignmentsManager(assignments, 'assignment', 'الواجبات الدراسية');
    } else if (this.activeTab === 'reports') {
      const reports = (shiftData.assignments || []).filter(a => a.kind === 'report');
      return this.renderAssignmentsManager(reports, 'report', 'التقارير والأبحاث');
    }
    return '';
  },

  // Lectures CRUD
  renderLecturesManager(lectures, settings) {
    let filtered = lectures;
    if (this.dayFilter !== 'all') {
      filtered = filtered.filter(l => Number(l.day) === Number(this.dayFilter));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        (l.subject && l.subject.toLowerCase().includes(q)) || 
        (l.lecturer && l.lecturer.toLowerCase().includes(q)) ||
        (l.room && l.room.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => Number(a.day) - Number(b.day) || (a.start || '').localeCompare(b.start || ''));

    return `
      <div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div class="flex items-center gap-3 flex-1 max-w-md">
            <div class="relative flex-1">
              <input 
                type="text" 
                id="rep-search-input" 
                placeholder="بحث بالمادة أو المحاضر أو القاعة..." 
                value="${this.searchQuery}"
                class="w-full bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
              />
              <span class="absolute left-3 top-3 text-gray-400">${UI.icons.search}</span>
            </div>
            <select 
              id="rep-day-filter" 
              class="bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all" ${this.dayFilter === 'all' ? 'selected' : ''}>كل الأيام</option>
              ${UI.dayNames.map((name, i) => `<option value="${i}" ${Number(this.dayFilter) === i ? 'selected' : ''}>${name}</option>`).join('')}
            </select>
          </div>

          <button 
            type="button" 
            id="btn-add-lecture" 
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 glow-cyan cursor-pointer"
          >
            ${UI.icons.plus}
            <span>إضافة محاضرة جديدة</span>
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${UI.icons.calendar}
            </div>
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد محاضرات مطابقة</h4>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filtered.map(lec => `
              <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10 hover:border-purple-400 transition flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 px-2 py-0.5 rounded-lg">
                      ${UI.dayNames[lec.day]}
                    </span>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md ${lec.type === 'practical' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' : 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300'}">
                      ${lec.type === 'practical' ? 'عملي' : 'نظري'}
                    </span>
                  </div>

                  <h4 class="text-base font-bold text-gray-900 dark:text-white mb-2">${lec.subject}</h4>

                  <div class="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">${UI.icons.user}</span>
                      <span>${lec.lecturer || 'المحاضر غير محدد'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">${UI.icons.location}</span>
                      <span>${lec.room || 'القاعة غير محددة'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">${UI.icons.clock}</span>
                      <span class="font-mono-numeric dir-ltr text-cyan-700 dark:text-cyan-300">${lec.start} - ${lec.end}</span>
                    </div>
                    ${lec.classroomCode ? `
                      <div class="flex items-center gap-2 pt-1">
                        <span class="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Classroom:</span>
                        <span class="font-mono-numeric font-bold text-gray-800 dark:text-gray-200 bg-cyan-100/60 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-500/30 text-[11px]">${lec.classroomCode}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-2">
                  <button type="button" data-edit-lecture="${lec.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-300 transition cursor-pointer" title="تعديل">
                    ${UI.icons.edit}
                  </button>
                  <button type="button" data-delete-lecture="${lec.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition cursor-pointer" title="حذف">
                    ${UI.icons.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // Exams CRUD with Complete Status Toggle Button
  renderExamsManager(exams, settings) {
    let filtered = exams;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.subject && e.subject.toLowerCase().includes(q)) || 
        (e.room && e.room.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    return `
      <div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div class="relative flex-1 max-w-md">
            <input 
              type="text" 
              id="rep-search-input" 
              placeholder="بحث في الامتحانات..." 
              value="${this.searchQuery}"
              class="w-full bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
            />
            <span class="absolute left-3 top-3 text-gray-400">${UI.icons.search}</span>
          </div>

          <button 
            type="button" 
            id="btn-add-exam" 
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 glow-cyan cursor-pointer"
          >
            ${UI.icons.plus}
            <span>إضافة امتحان جديد</span>
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${UI.icons.clock}
            </div>
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد امتحانات مسجلة</h4>
          </div>
        ` : `
          <div class="space-y-3">
            ${filtered.map(exam => `
              <div class="p-5 rounded-2xl glass-panel border ${exam.isCompleted ? 'border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-white/10'} hover:border-purple-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                      ${exam.type === 'midterm' ? 'نصفي (ميد)' : exam.type === 'final' ? 'نهائي' : 'شهري'}
                    </span>

                    ${exam.isCompleted ? `
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        ${UI.icons.check}
                        <span>تم الإنجاز (منتهي عند الطلاب)</span>
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                        <span>امتحان نشط وقائم</span>
                      </span>
                    `}

                    <span class="text-xs text-gray-500 font-mono-numeric">${exam.date} | ${exam.time || '09:00'}</span>
                    <span class="text-xs text-gray-500">${exam.room || 'قاعة غير محددة'}</span>
                  </div>

                  <h4 class="text-base font-bold text-gray-900 dark:text-white mb-1 ${exam.isCompleted ? 'line-through text-gray-500' : ''}">${exam.subject}</h4>
                  ${exam.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${exam.notes}</p>` : ''}
                </div>

                <!-- Action Buttons: Done Toggle, Edit, Delete -->
                <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <!-- Complete Exam Toggle Button (Requested feature) -->
                  <button 
                    type="button" 
                    data-toggle-exam-done="${exam.id}" 
                    data-status="${exam.isCompleted ? 'done' : 'active'}"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${exam.isCompleted ? 'bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-200' : 'bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/20'}"
                    title="${exam.isCompleted ? 'إعادة الامتحان للوضع النشط' : 'تحديد الامتحان كمنتهي ليظهر للطلاب كمنجز'}"
                  >
                    ${UI.icons.checkDone}
                    <span>${exam.isCompleted ? 'إلغاء الإنهاء' : 'تحديد كمنتهي'}</span>
                  </button>

                  <!-- Edit -->
                  <button 
                    type="button" 
                    data-edit-exam="${exam.id}" 
                    class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-300 transition cursor-pointer"
                    title="تعديل"
                  >
                    ${UI.icons.edit}
                  </button>

                  <!-- Delete -->
                  <button 
                    type="button" 
                    data-delete-exam="${exam.id}" 
                    class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition cursor-pointer"
                    title="حذف"
                  >
                    ${UI.icons.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  // Assignments & Reports CRUD
  renderAssignmentsManager(items, kind, title) {
    let filtered = items;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        (i.title && i.title.toLowerCase().includes(q)) || 
        (i.subject && i.subject.toLowerCase().includes(q))
      );
    }

    return `
      <div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div class="relative flex-1 max-w-md">
            <input 
              type="text" 
              id="rep-search-input" 
              placeholder="بحث في ${title}..." 
              value="${this.searchQuery}"
              class="w-full bg-gray-50 dark:bg-[#15152a] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
            />
            <span class="absolute left-3 top-3 text-gray-400">${UI.icons.search}</span>
          </div>

          <button 
            type="button" 
            id="btn-add-item" 
            data-kind="${kind}"
            class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 glow-cyan cursor-pointer"
          >
            ${UI.icons.plus}
            <span>إضافة ${kind === 'report' ? 'تقرير جديد' : 'واجب جديد'}</span>
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${UI.icons.fileText}
            </div>
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد عناصر مسجلة</h4>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtered.map(item => `
              <div class="p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10 hover:border-purple-400 transition flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <span class="text-xs font-bold text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 px-2 py-0.5 rounded-lg">
                      ${item.subject}
                    </span>
                    <span class="text-[11px] text-gray-500 font-mono-numeric">
                      تسليم: ${item.dueDate ? item.dueDate.replace('T', ' ') : 'مفتوح'}
                    </span>
                  </div>

                  <h4 class="text-base font-bold text-gray-900 dark:text-white mb-2">${item.title}</h4>
                  ${item.description ? `<p class="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">${item.description}</p>` : ''}

                  <div class="text-xs text-gray-500 space-y-1 bg-gray-50 dark:bg-white/[0.02] p-2.5 rounded-xl mb-4 border border-gray-200 dark:border-white/5">
                    <div>طريقة التسليم: <span class="text-gray-800 dark:text-gray-200 font-medium">${item.submission || 'غير محدد'}</span></div>
                    ${item.pages ? `<div>المتطلبات: <span class="text-cyan-700 dark:text-cyan-300 font-medium">${item.pages}</span></div>` : ''}
                  </div>
                </div>

                <div class="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-end gap-2">
                  <button type="button" data-edit-assignment="${item.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-cyan-600 dark:text-cyan-300 transition cursor-pointer" title="تعديل">
                    ${UI.icons.edit}
                  </button>
                  <button type="button" data-delete-assignment="${item.id}" class="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition cursor-pointer" title="حذف">
                    ${UI.icons.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  bindDashboardEvents(container) {
    const btnM = container.querySelector('#shift-switch-morning');
    const btnE = container.querySelector('#shift-switch-evening');
    if (btnM) btnM.onclick = () => { this.currentShift = 'morning'; this.renderDashboard(container); };
    if (btnE) btnE.onclick = () => { this.currentShift = 'evening'; this.renderDashboard(container); };

    const logoutBtn = container.querySelector('#rep-logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        window.Auth.logoutRep();
        // Redirect directly to Landing page (#/) as requested
        window.location.hash = '#/';
      };
    }

    container.querySelectorAll('.rep-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.repTab;
        this.searchQuery = '';
        this.renderDashboard(container);
      };
    });

    const searchInput = container.querySelector('#rep-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value;
        const tabView = container.querySelector('#rep-tab-view');
        window.Store.getShiftData(this.currentShift).then(data => {
          tabView.innerHTML = this.renderActiveTabContent(data, {});
          this.bindActionsOnly(container);
        });
      };
    }

    const dayFilter = container.querySelector('#rep-day-filter');
    if (dayFilter) {
      dayFilter.onchange = (e) => {
        this.dayFilter = e.target.value;
        this.renderDashboard(container);
      };
    }

    this.bindActionsOnly(container);
  },

  bindActionsOnly(container) {
    // Toggle Exam Completed / Done Status
    container.querySelectorAll('[data-toggle-exam-done]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.toggleExamDone;
        const isDone = btn.dataset.status === 'done';
        const newStatus = !isDone;

        await window.Store.updateItem(this.currentShift, 'exams', id, { isCompleted: newStatus });
        UI.toast(newStatus ? 'تم تحديد الامتحان كمنتهي وسيعرض كمنجز لدى الطلاب ✓' : 'تمت إعادة تفعيل الامتحان كنشط', 'success');
        this.renderDashboard(container);
      };
    });

    // Add Lecture
    const addLecBtn = container.querySelector('#btn-add-lecture');
    if (addLecBtn) addLecBtn.onclick = () => this.showLectureModal(container);

    // Edit Lecture
    container.querySelectorAll('[data-edit-lecture]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.editLecture;
        const data = await window.Store.getShiftData(this.currentShift);
        const item = (data.lectures || []).find(l => l.id === id);
        if (item) this.showLectureModal(container, item);
      };
    });

    // Delete Lecture
    container.querySelectorAll('[data-delete-lecture]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.deleteLecture;
        const ok = await UI.confirm({
          title: 'حذف المحاضرة',
          message: 'هل أنت متأكد من حذف هذه المحاضرة نهائياً؟',
          isDestructive: true,
          confirmText: 'نعم، احذف'
        });
        if (ok) {
          await window.Store.deleteItem(this.currentShift, 'lectures', id);
          UI.toast('تم حذف المحاضرة بنجاح', 'success');
          this.renderDashboard(container);
        }
      };
    });

    // Add Exam
    const addExamBtn = container.querySelector('#btn-add-exam');
    if (addExamBtn) addExamBtn.onclick = () => this.showExamModal(container);

    // Edit Exam
    container.querySelectorAll('[data-edit-exam]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.editExam;
        const data = await window.Store.getShiftData(this.currentShift);
        const item = (data.exams || []).find(e => e.id === id);
        if (item) this.showExamModal(container, item);
      };
    });

    // Delete Exam
    container.querySelectorAll('[data-delete-exam]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.deleteExam;
        const ok = await UI.confirm({
          title: 'حذف الامتحان',
          message: 'هل أنت متأكد من حذف هذا الامتحان؟',
          isDestructive: true,
          confirmText: 'نعم، احذف'
        });
        if (ok) {
          await window.Store.deleteItem(this.currentShift, 'exams', id);
          UI.toast('تم حذف الامتحان بنجاح', 'success');
          this.renderDashboard(container);
        }
      };
    });

    // Add Assignment / Report
    const addItemBtn = container.querySelector('#btn-add-item');
    if (addItemBtn) {
      addItemBtn.onclick = () => {
        const kind = addItemBtn.dataset.kind;
        this.showAssignmentModal(container, null, kind);
      };
    }

    // Edit Assignment
    container.querySelectorAll('[data-edit-assignment]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.editAssignment;
        const data = await window.Store.getShiftData(this.currentShift);
        const item = (data.assignments || []).find(a => a.id === id);
        if (item) this.showAssignmentModal(container, item, item.kind);
      };
    });

    // Delete Assignment
    container.querySelectorAll('[data-delete-assignment]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.deleteAssignment;
        const ok = await UI.confirm({
          title: 'حذف التكليف',
          message: 'هل أنت متأكد من حذف هذا التكليف؟',
          isDestructive: true,
          confirmText: 'نعم، احذف'
        });
        if (ok) {
          await window.Store.deleteItem(this.currentShift, 'assignments', id);
          UI.toast('تم حذف التكليف بنجاح', 'success');
          this.renderDashboard(container);
        }
      };
    });

    // Urgent Alert
    const alertBtn = container.querySelector('#btn-add-urgent-alert');
    if (alertBtn) alertBtn.onclick = () => this.showUrgentAlertModal(container);
  },

  showLectureModal(container, item = null) {
    const isEdit = !!item;
    const content = `
      <form id="lecture-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اسم المادة *</label>
          <input type="text" id="lec-subject" required value="${item ? item.subject : ''}" placeholder="هندسة البرمجيات" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">المحاضر</label>
            <input type="text" id="lec-lecturer" value="${item ? item.lecturer || '' : ''}" placeholder="د. علي" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">اليوم *</label>
            <select id="lec-day" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
              ${[1, 2, 3, 4, 5, 0, 6].map((i) => `<option value="${i}" ${item ? Number(item.day) === i : i === 1 ? 'selected' : ''}>${UI.dayNames[i]}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">وقت البدء *</label>
            <input type="time" id="lec-start" required value="${item ? item.start : '08:30'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">وقت الانتهاء *</label>
            <input type="time" id="lec-end" required value="${item ? item.end : '10:00'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">القاعة</label>
            <input type="text" id="lec-room" value="${item ? item.room || '' : ''}" placeholder="قاعة 101" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">النوع</label>
            <select id="lec-type" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
              <option value="theory" ${item && item.type === 'theory' ? 'selected' : ''}>محاضرة نظرية</option>
              <option value="practical" ${item && item.type === 'practical' ? 'selected' : ''}>مختبر عملي</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">رمز Classroom (اختياري)</label>
          <input type="text" id="lec-classroom" value="${item ? item.classroomCode || '' : ''}" placeholder="مثال: cr-2026-xyz" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition" />
        </div>
      </form>
    `;

    UI.showModal({
      title: isEdit ? 'تعديل محاضرة' : 'إضافة محاضرة جديدة',
      content,
      size: 'max-w-md',
      footerButtons: [
        { text: 'إلغاء', onClick: (close) => close() },
        {
          text: isEdit ? 'حفظ التعديلات' : 'إضافة المحاضرة',
          isPrimary: true,
          onClick: async (close) => {
            const form = document.getElementById('lecture-form');
            if (!form.reportValidity()) return;

            const payload = {
              subject: document.getElementById('lec-subject').value,
              lecturer: document.getElementById('lec-lecturer').value,
              day: Number(document.getElementById('lec-day').value),
              start: document.getElementById('lec-start').value,
              end: document.getElementById('lec-end').value,
              room: document.getElementById('lec-room').value,
              type: document.getElementById('lec-type').value,
              classroomCode: document.getElementById('lec-classroom') ? document.getElementById('lec-classroom').value.trim() : ''
            };

            if (payload.end <= payload.start) {
              UI.toast('وقت الانتهاء يجب أن يكون بعد وقت البدء!', 'error');
              return;
            }

            if (isEdit) {
              await window.Store.updateItem(this.currentShift, 'lectures', item.id, payload);
              UI.toast('تم تحديث المحاضرة بنجاح', 'success');
            } else {
              await window.Store.addItem(this.currentShift, 'lectures', payload);
              UI.toast('تمت إضافة المحاضرة بنجاح', 'success');
            }
            close();
            this.renderDashboard(container);
          }
        }
      ]
    });
  },

  showExamModal(container, item = null) {
    const isEdit = !!item;
    const content = `
      <form id="exam-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">المادة الدراسية *</label>
          <input type="text" id="exm-subject" required value="${item ? item.subject : ''}" placeholder="قواعد البيانات" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">نوع الامتحان *</label>
            <select id="exm-type" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
              <option value="monthly" ${item && item.type === 'monthly' ? 'selected' : ''}>امتحان شهري</option>
              <option value="midterm" ${item && item.type === 'midterm' ? 'selected' : ''}>امتحان نصفي (ميد)</option>
              <option value="final" ${item && item.type === 'final' ? 'selected' : ''}>امتحان نهائي (فاينل)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">التاريخ *</label>
            <input type="date" id="exm-date" required value="${item ? item.date : '2026-11-15'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">الوقت</label>
            <input type="time" id="exm-time" value="${item ? item.time || '09:00' : '09:00'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">القاعة</label>
            <input type="text" id="exm-room" value="${item ? item.room || '' : ''}" placeholder="المدرج 2" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
          <textarea id="exm-notes" rows="2" placeholder="ملاحظات..." class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none">${item ? item.notes || '' : ''}</textarea>
        </div>
      </form>
    `;

    UI.showModal({
      title: isEdit ? 'تعديل امتحان' : 'إضافة امتحان جديد',
      content,
      size: 'max-w-md',
      footerButtons: [
        { text: 'إلغاء', onClick: (close) => close() },
        {
          text: isEdit ? 'حفظ التعديلات' : 'إضافة الامتحان',
          isPrimary: true,
          onClick: async (close) => {
            const form = document.getElementById('exam-form');
            if (!form.reportValidity()) return;

            const payload = {
              subject: document.getElementById('exm-subject').value,
              type: document.getElementById('exm-type').value,
              date: document.getElementById('exm-date').value,
              time: document.getElementById('exm-time').value,
              room: document.getElementById('exm-room').value,
              notes: document.getElementById('exm-notes').value,
              isCompleted: item ? (item.isCompleted || false) : false
            };

            if (isEdit) {
              await window.Store.updateItem(this.currentShift, 'exams', item.id, payload);
              UI.toast('تم تحديث بيانات الامتحان', 'success');
            } else {
              await window.Store.addItem(this.currentShift, 'exams', payload);
              UI.toast('تمت إضافة الامتحان بنجاح', 'success');
            }
            close();
            this.renderDashboard(container);
          }
        }
      ]
    });
  },

  showAssignmentModal(container, item = null, defaultKind = 'assignment') {
    const isEdit = !!item;
    const kind = item ? item.kind : defaultKind;
    const isReport = kind === 'report';

    const content = `
      <form id="asg-form" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">العنوان *</label>
          <input type="text" id="asg-title" required value="${item ? item.title : ''}" placeholder="${isReport ? 'بحث مقارن...' : 'حل تمارين...'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">المادة *</label>
            <input type="text" id="asg-subject" required value="${item ? item.subject : ''}" placeholder="هندسة البرمجيات" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">آخر موعد *</label>
            <input type="datetime-local" id="asg-due" required value="${item ? item.dueDate : '2026-11-10T23:59'}" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono-numeric text-gray-900 dark:text-white focus:outline-none" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">طريقة التسليم</label>
          <input type="text" id="asg-submission" value="${item ? item.submission || '' : ''}" placeholder="تسليم يدوي / رفع على البوابة" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none" />
        </div>
        ${isReport ? `
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">عدد الصفحات / المتطلبات</label>
            <input type="text" id="asg-pages" value="${item ? item.pages || '' : ''}" placeholder="8 - 10 صفحات" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none" />
          </div>
        ` : ''}
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">التفاصيل</label>
          <textarea id="asg-desc" rows="2" placeholder="تفاصيل..." class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none">${item ? item.description || '' : ''}</textarea>
        </div>
      </form>
    `;

    UI.showModal({
      title: isEdit ? `تعديل ${isReport ? 'التقرير' : 'الواجب'}` : `إضافة ${isReport ? 'تقرير جديد' : 'واجب جديد'}`,
      content,
      size: 'max-w-md',
      footerButtons: [
        { text: 'إلغاء', onClick: (close) => close() },
        {
          text: isEdit ? 'حفظ التعديلات' : 'إضافة',
          isPrimary: true,
          onClick: async (close) => {
            const form = document.getElementById('asg-form');
            if (!form.reportValidity()) return;

            const pagesInput = document.getElementById('asg-pages');
            const payload = {
              title: document.getElementById('asg-title').value,
              subject: document.getElementById('asg-subject').value,
              kind,
              dueDate: document.getElementById('asg-due').value,
              submission: document.getElementById('asg-submission').value,
              description: document.getElementById('asg-desc').value,
              ...(pagesInput ? { pages: pagesInput.value } : {})
            };

            if (isEdit) {
              await window.Store.updateItem(this.currentShift, 'assignments', item.id, payload);
              UI.toast('تم تحديث التكليف بنجاح', 'success');
            } else {
              await window.Store.addItem(this.currentShift, 'assignments', payload);
              UI.toast('تمت إضافة التكليف بنجاح', 'success');
            }
            close();
            this.renderDashboard(container);
          }
        }
      ]
    });
  },

  showUrgentAlertModal(container) {
    // Load current alert data
    window.Store.getUrgentAlert(this.currentShift).then(currentAlert => {
      const content = `
        <form id="alert-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">نص التنبيه *</label>
            <textarea id="alert-text" rows="3" required placeholder="مثال: تم تأجيل محاضرة قواعد البيانات ليوم الأربعاء..." class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 transition resize-none">${currentAlert.text || ''}</textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">نوع التنبيه</label>
            <select id="alert-type" class="w-full bg-gray-50 dark:bg-[#18182e] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none cursor-pointer">
              <option value="urgent" ${currentAlert.type === 'urgent' ? 'selected' : ''}>🔴 عاجل (أحمر)</option>
              <option value="warning" ${currentAlert.type === 'warning' ? 'selected' : ''}>🟡 تحذير (برتقالي)</option>
              <option value="info" ${currentAlert.type === 'info' ? 'selected' : ''}>🔵 معلومة (أزرق)</option>
            </select>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div>
              <span class="text-xs font-bold text-gray-700 dark:text-gray-300 block">تفعيل التنبيه</span>
              <span class="text-[11px] text-gray-500">عند التفعيل سيظهر للطلاب في أعلى الصفحة</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="alert-active" ${currentAlert.active ? 'checked' : ''} class="sr-only peer">
              <div class="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          ${currentAlert.updatedAt ? `
            <p class="text-[11px] text-gray-400 text-center">آخر تحديث: ${new Date(currentAlert.updatedAt).toLocaleString('ar-IQ')}</p>
          ` : ''}
        </form>
      `;

      UI.showModal({
        title: `${UI.icons.alert} إدارة التنبيه العاجل (${this.currentShift === 'morning' ? 'الصباحي' : 'المسائي'})`,
        content,
        size: 'max-w-md',
        footerButtons: [
          { text: 'إلغاء', onClick: (close) => close() },
          {
            text: 'حفظ التنبيه',
            isPrimary: true,
            onClick: async (close) => {
              const text = document.getElementById('alert-text').value.trim();
              const type = document.getElementById('alert-type').value;
              const active = document.getElementById('alert-active').checked;

              if (active && !text) {
                UI.toast('يرجى كتابة نص التنبيه قبل تفعيله', 'warning');
                return;
              }

              await window.Store.saveUrgentAlert(this.currentShift, { text, type, active });
              UI.toast(active ? 'تم تفعيل التنبيه العاجل وسيظهر للطلاب ✓' : 'تم حفظ التنبيه (معطّل حالياً)', 'success');
              close();
              this.renderDashboard(container);
            }
          }
        ]
      });
    });
  }
};

window.Rep = Rep;
