/**
 * Student View - Read-only Portal for Morning and Evening Students
 * Features:
 * - Direct isolated view for the chosen shift (Shift switch button removed)
 * - Department subtitle removed
 * - Separate dedicated tabs: Weekly Schedule, Exams, Assignments (الواجبات), Reports (التقارير)
 * - Exam isCompleted status support (marked by representatives)
 * - Real-time Digital Clock & Live Countdown Timer
 * - Individual Local Submission Tracker per item
 * - Theme Switcher (White / Dark)
 */

const Student = {
  currentShift: 'morning',
  activeTab: 'lectures', // 'lectures' | 'exams' | 'assignments' | 'reports'
  selectedDay: null,
  countdownInterval: null,
  clockInterval: null,
  assignmentFilter: 'all', // 'all' | 'upcoming' | 'past'
  reportFilter: 'all',

  async render(container, shift = 'morning') {
    this.currentShift = shift;
    this.cleanup();

    const settings = await window.Store.getSettings();
    const activeDays = [1, 2, 3, 4, 5]; // الأحد إلى الخميس
    const todayAcademic = UI.getAcademicDayIndex();

    if (this.selectedDay === null || (this.selectedDay !== 'all' && !activeDays.includes(Number(this.selectedDay)))) {
      this.selectedDay = activeDays.includes(todayAcademic) ? todayAcademic : 1;
    }

    const data = await window.Store.getShiftData(shift);
    const studentDone = await window.Store.getStudentDone();

    const isMorning = shift === 'morning';
    const shiftTitle = isMorning ? 'الدراسة الصباحية' : 'الدراسة المسائية';
    const glowClass = isMorning ? 'glow-cyan' : 'glow-purple';

    const assignmentsOnly = (data.assignments || []).filter(a => a.kind === 'assignment');
    const reportsOnly = (data.assignments || []).filter(a => a.kind === 'report');
    const completedExams = (data.exams || []).filter(e => e.isCompleted === true);

    container.innerHTML = `
      <div class="min-h-screen pb-16 relative overflow-hidden">
        <!-- Ambient Neon Lights -->
        <div class="ambient-orb w-80 h-80 ${isMorning ? 'bg-cyan-500/15' : 'bg-purple-600/15'} top-0 right-0"></div>
        <div class="ambient-orb w-80 h-80 ${isMorning ? 'bg-blue-600/10' : 'bg-pink-600/10'} bottom-10 left-0" style="animation-delay: -5s;"></div>

        <!-- Top Navigation Bar -->
        <header class="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0a14]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 sm:px-6 py-3.5 mb-6 shadow-sm">
          <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <!-- Left: Back Button & Clean Title (Department removed) -->
            <div class="flex items-center gap-3">
              <a 
                href="#/" 
                class="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 transition cursor-pointer flex items-center justify-center"
                title="العودة للرئيسية"
                aria-label="العودة للرئيسية"
              >
                ${UI.icons.arrowRight}
              </a>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-base sm:text-lg font-black text-gray-900 dark:text-white">${shiftTitle}</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isMorning ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'}">
                    جدول وتكاليف
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Notifications, Clock & Theme Toggle -->
            <div class="flex items-center gap-2 sm:gap-3">
              <button 
                type="button" 
                id="btn-toggle-notifications"
                class="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="تفعيل إشعارات التنبيهات على الهاتف والجهاز"
              >
                <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span class="text-xs font-bold hidden md:inline notif-status-text">تفعيل الإشعارات</span>
              </button>

              <div id="live-digital-clock" class="text-left font-mono-numeric text-xs sm:text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl hidden sm:block">
                --:--:--
              </div>

              ${UI.getThemeButtonHtml()}
            </div>
          </div>
        </header>

        <!-- Urgent Alert Banner -->
        ${data.urgentAlert && data.urgentAlert.active && data.urgentAlert.text ? `
          <div id="student-urgent-alert" class="max-w-6xl mx-auto px-4 sm:px-6 mb-4 relative z-10">
            <div class="p-4 rounded-2xl border flex items-start gap-3 animate-fade-in ${
              data.urgentAlert.type === 'urgent' 
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200' 
                : data.urgentAlert.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200'
                : 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-200'
            }">
              <div class="flex-shrink-0 mt-0.5 ${
                data.urgentAlert.type === 'urgent' ? 'text-rose-500' 
                : data.urgentAlert.type === 'warning' ? 'text-amber-500' 
                : 'text-cyan-500'
              }">
                ${data.urgentAlert.type === 'info' ? UI.icons.info : UI.icons.alert}
              </div>
              <div class="flex-1">
                <span class="text-xs font-bold block mb-0.5">${
                  data.urgentAlert.type === 'urgent' ? '⚠️ تنبيه عاجل من ممثل الدفعة' 
                  : data.urgentAlert.type === 'warning' ? '📢 تنبيه تحذيري' 
                  : 'ℹ️ إعلان معلوماتي'
                }</span>
                <p class="text-sm leading-relaxed">${data.urgentAlert.text}</p>
              </div>
              <button type="button" id="close-urgent-alert" class="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer opacity-60 hover:opacity-100">
                ${UI.icons.x}
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Main Body -->
        <main class="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          ${this.renderSummaryCards({
            lectures: (data.lectures || []).length,
            exams: (data.exams || []).length,
            reports: reportsOnly.length,
            assignments: assignmentsOnly.length,
            completedExams: completedExams.length
          }, settings)}

          <!-- 4 Distinct Separate Tabs (Assignments and Reports separated) -->
          <div class="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-2xl mb-6 overflow-x-auto">
            <!-- Tab 1: Lectures -->
            <button 
              type="button" 
              data-tab-target="lectures" 
              class="student-tab-btn flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'lectures' ? `bg-gradient-to-r from-cyan-600 to-purple-600 text-white ${glowClass}` : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.calendar}
              <span>الجدول الدراسي</span>
            </button>

            <!-- Tab 2: Exams -->
            <button 
              type="button" 
              data-tab-target="exams" 
              class="student-tab-btn flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'exams' ? `bg-gradient-to-r from-cyan-600 to-purple-600 text-white ${glowClass}` : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.clock}
              <span>الامتحانات</span>
              <span class="w-2 h-2 rounded-full bg-rose-500 pulse-badge"></span>
            </button>

            <!-- Tab 3: Assignments (Dedicated) -->
            <button 
              type="button" 
              data-tab-target="assignments" 
              class="student-tab-btn flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'assignments' ? `bg-gradient-to-r from-cyan-600 to-purple-600 text-white ${glowClass}` : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.checkCircle}
              <span>الواجبات (${assignmentsOnly.length})</span>
            </button>

            <!-- Tab 4: Reports (Dedicated) -->
            <button 
              type="button" 
              data-tab-target="reports" 
              class="student-tab-btn flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${this.activeTab === 'reports' ? `bg-gradient-to-r from-cyan-600 to-purple-600 text-white ${glowClass}` : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              ${UI.icons.fileText}
              <span>التقارير (${reportsOnly.length})</span>
            </button>
          </div>

          <!-- Section 1: Lectures -->
          <section id="tab-content-lectures" class="${this.activeTab === 'lectures' ? 'block' : 'hidden'} animate-fade-in">
            ${this.renderLecturesSection(data.lectures || [], settings)}
          </section>

          <!-- Section 2: Exams -->
          <section id="tab-content-exams" class="${this.activeTab === 'exams' ? 'block' : 'hidden'} animate-fade-in">
            ${this.renderExamsSection(data.exams || [], settings)}
          </section>

          <!-- Section 3: Assignments Only -->
          <section id="tab-content-assignments" class="${this.activeTab === 'assignments' ? 'block' : 'hidden'} animate-fade-in">
            ${this.renderDedicatedSection(assignmentsOnly, studentDone, 'assignment', 'الواجبات الدراسية')}
          </section>

          <!-- Section 4: Reports Only -->
          <section id="tab-content-reports" class="${this.activeTab === 'reports' ? 'block' : 'hidden'} animate-fade-in">
            ${this.renderDedicatedSection(reportsOnly, studentDone, 'report', 'التقارير والأبحاث')}
          </section>
        </main>
      </div>
    `;

    UI.attachThemeToggle();
    this.bindEvents(container);
    this.startLiveClock();
    this.startExamCountdowns();
  },

  // 0. Summary Cards (5 compact rectangular cards above the tabs)
  renderSummaryCards(stats, settings) {
    const fmt = (value) => UI.formatNumber(value, settings.numberFormat);
    const cards = [
      {
        label: 'المحاضرات الأسبوعية',
        value: stats.lectures,
        icon: UI.icons.calendar,
        iconClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
      },
      {
        label: 'الامتحانات',
        value: stats.exams,
        icon: UI.icons.clock,
        iconClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      },
      {
        label: 'التقارير',
        value: stats.reports,
        icon: UI.icons.fileText,
        iconClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      },
      {
        label: 'الواجبات',
        value: stats.assignments,
        icon: UI.icons.checkCircle,
        iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      },
      {
        label: 'الامتحانات المنجزة',
        value: stats.completedExams,
        icon: UI.icons.checkDone,
        iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }
    ];

    return `
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-5">
        ${cards.map((card, index) => `
          <div class="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition ${index === cards.length - 1 ? 'col-span-2 sm:col-span-1' : ''}">
            <div class="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl border flex items-center justify-center ${card.iconClass}">
              ${card.icon}
            </div>
            <div class="min-w-0">
              <div class="font-mono-numeric text-lg sm:text-xl font-black leading-none text-gray-900 dark:text-white">${fmt(card.value)}</div>
              <div class="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1 leading-tight">${card.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // 1. Lectures Section (Sunday to Thursday)
  renderLecturesSection(lectures, settings) {
    const activeDays = [1, 2, 3, 4, 5]; // الأحد إلى الخميس
    const todayAcademic = UI.getAcademicDayIndex();

    let daysHtml = `
      <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-6 custom-scroll">
        <button 
          type="button" 
          data-day-filter="all" 
          class="day-filter-btn flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${this.selectedDay === 'all' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 glow-cyan' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          عرض الأسبوع بالكامل
        </button>
    `;

    activeDays.forEach(dayIndex => {
      const isToday = dayIndex === todayAcademic;
      const isSelected = this.selectedDay === dayIndex;
      daysHtml += `
        <button 
          type="button" 
          data-day-filter="${dayIndex}" 
          class="day-filter-btn flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-500 text-gray-900 dark:text-white glow-mixed' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
        >
          <span>${UI.dayNames[dayIndex]}</span>
          ${isToday ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">اليوم</span>' : ''}
        </button>
      `;
    });
    daysHtml += `</div>`;

    let filtered = lectures;
    if (this.selectedDay !== 'all') {
      filtered = lectures.filter(l => Number(l.day) === Number(this.selectedDay));
    }
    filtered.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    const now = new Date();
    const currentAcademicDay = UI.getAcademicDayIndex(now);
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return `
      <div>
        <div class="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">الجدول الدراسي الأسبوعي</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">تصفح المحاضرات والقاعات والتوقيت</p>
          </div>
          <button 
            type="button" 
            id="btn-download-schedule"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            ${UI.icons.download}
            <span>تحميل الجدول</span>
          </button>
        </div>
        ${daysHtml}
        ${filtered.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-lg mx-auto">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-4">
              ${UI.icons.calendar}
            </div>
            <h3 class="text-base font-bold text-gray-700 dark:text-gray-300">لا توجد محاضرات مجدولة لهذا اليوم</h3>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filtered.map(lec => {
              const isToday = Number(lec.day) === currentAcademicDay;
              const isOngoing = isToday && currentTimeStr >= lec.start && currentTimeStr <= lec.end;
              const isUpcomingToday = isToday && currentTimeStr < lec.start;
              const isPractical = lec.type === 'practical';

              let borderClasses = 'border-gray-200 dark:border-white/10';
              let badgeHtml = '';

              if (isOngoing) {
                borderClasses = 'border-cyan-500 glow-cyan ring-1 ring-cyan-500';
                badgeHtml = `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500 pulse-badge">
                    <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
                    جارية الآن
                  </span>
                `;
              } else if (isUpcomingToday) {
                badgeHtml = `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    المحاضرة التالية
                  </span>
                `;
              }

              return `
                <div class="p-5 rounded-2xl glass-panel relative ${borderClasses} flex flex-col justify-between hover:border-cyan-500/50 transition">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <span class="text-xs font-semibold px-2.5 py-1 rounded-lg ${isPractical ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30' : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'}">
                        ${isPractical ? 'مختبر عملي' : 'محاضرة نظرية'}
                      </span>
                      ${badgeHtml || `<span class="text-xs text-gray-500">${UI.dayNames[lec.day]}</span>`}
                    </div>

                    <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">${lec.subject}</h3>

                    <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300 mb-3">
                      <div class="flex items-center gap-2">
                        <span class="text-gray-400">${UI.icons.user}</span>
                        <span>${lec.lecturer || 'غير محدد'}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-gray-400">${UI.icons.location}</span>
                        <span>${lec.room || 'القاعة غير محددة'}</span>
                      </div>
                    </div>

                    ${lec.classroomCode ? `
                      <div class="flex items-center justify-between text-xs bg-cyan-50/70 dark:bg-white/[0.03] p-2 rounded-xl border border-cyan-200 dark:border-white/5 mb-3">
                        <div class="flex items-center gap-1.5">
                          <span class="text-cyan-700 dark:text-cyan-400 font-bold text-[11px]">رمز Classroom:</span>
                          <span class="font-mono-numeric font-bold text-gray-900 dark:text-gray-200 text-xs">${lec.classroomCode}</span>
                        </div>
                        <button 
                          type="button" 
                          data-copy-code="${lec.classroomCode}" 
                          class="p-1 px-2 rounded-lg bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-white text-[11px] flex items-center gap-1 transition cursor-pointer border border-gray-200 dark:border-transparent shadow-sm"
                          title="نسخ رمز Classroom"
                        >
                          ${UI.icons.copy}
                          <span>نسخ</span>
                        </button>
                      </div>
                    ` : ''}
                  </div>

                  <div class="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-mono-numeric">
                    <span class="text-gray-500">التوقيت:</span>
                    <span class="font-bold text-cyan-700 dark:text-cyan-300 dir-ltr bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                      ${UI.formatNumber(lec.start, settings.numberFormat)} - ${UI.formatNumber(lec.end, settings.numberFormat)}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 2. Exams Section with isCompleted Support
  renderExamsSection(exams, settings) {
    const now = new Date();
    const sorted = [...exams].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

    const upcomingExams = [];
    const pastExams = [];

    sorted.forEach(exam => {
      const examDate = new Date(`${exam.date}T${exam.time || '00:00'}`);
      // An exam is considered past if representative marked isCompleted === true OR date has passed
      if (exam.isCompleted || examDate < now) {
        pastExams.push(exam);
      } else {
        upcomingExams.push(exam);
      }
    });

    const getExamTypeLabel = (type) => UI.getExamTypeLabel(type);

    return `
      <div>
        <div class="mb-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">جدول الامتحانات الرسمية</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">مواعيد الامتحانات مع عداد تنازلي دقيق وحالة الإنجاز</p>
        </div>

        ${upcomingExams.length === 0 ? `
          <div class="text-center py-12 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${UI.icons.checkCircle}
            </div>
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد امتحانات قادمة غير منجزة</h3>
          </div>
        ` : `
          <div class="space-y-4">
            ${upcomingExams.map((exam, index) => {
              const isNearest = index === 0;
              const targetIso = `${exam.date}T${exam.time || '09:00'}`;

              return `
                <div 
                  class="p-5 sm:p-6 rounded-2xl glass-panel relative ${isNearest ? 'border-cyan-500 glow-mixed ring-1 ring-cyan-500/50' : 'border-gray-200 dark:border-white/10'} hover:border-cyan-500/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                  data-exam-timer="${targetIso}"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                        ${getExamTypeLabel(exam.type)}
                      </span>
                      ${isNearest ? `
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 pulse-badge">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          الامتحان الأقرب
                        </span>
                      ` : ''}
                      <span class="text-xs text-gray-500 font-mono-numeric">
                        ${UI.formatNumber(exam.date, settings.numberFormat)}
                      </span>
                    </div>

                    <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">${exam.subject}</h3>

                    <div class="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                      <div class="flex items-center gap-1.5">
                        <span class="text-gray-400">${UI.icons.clock}</span>
                        <span class="font-mono-numeric dir-ltr">${UI.formatNumber(exam.time || '09:00', settings.numberFormat)}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-gray-400">${UI.icons.location}</span>
                        <span>${exam.room || 'القاعة غير محددة'}</span>
                      </div>
                    </div>

                    ${exam.notes ? `
                      <div class="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                        <span class="text-cyan-600 dark:text-cyan-400 font-semibold">ملاحظات:</span> ${exam.notes}
                      </div>
                    ` : ''}
                  </div>

                  <!-- Live Countdown Box -->
                  <div class="w-full md:w-auto flex-shrink-0">
                    <div class="exam-countdown-box p-3.5 rounded-2xl bg-gray-100 dark:bg-[#0e0e1e] border border-gray-200 dark:border-white/10 text-center flex items-center justify-center gap-2 sm:gap-3">
                      <div class="text-center px-2">
                        <span class="block text-xl font-bold font-mono-numeric text-gray-900 dark:text-white count-days">00</span>
                        <span class="text-[10px] text-gray-500">أيام</span>
                      </div>
                      <span class="text-gray-400 font-bold">:</span>
                      <div class="text-center px-2">
                        <span class="block text-xl font-bold font-mono-numeric text-gray-900 dark:text-white count-hours">00</span>
                        <span class="text-[10px] text-gray-500">ساعات</span>
                      </div>
                      <span class="text-gray-400 font-bold">:</span>
                      <div class="text-center px-2">
                        <span class="block text-xl font-bold font-mono-numeric text-gray-900 dark:text-white count-minutes">00</span>
                        <span class="text-[10px] text-gray-500">دقائق</span>
                      </div>
                      <span class="text-gray-400 font-bold">:</span>
                      <div class="text-center px-2">
                        <span class="block text-xl font-bold font-mono-numeric text-cyan-600 dark:text-cyan-400 count-seconds">00</span>
                        <span class="text-[10px] text-gray-500">ثوانٍ</span>
                      </div>
                    </div>
                    <div class="exam-urgency-badge text-center mt-2 text-[11px] font-semibold text-gray-500">
                      جاري حساب الوقت...
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Past / Completed Exams List -->
        ${pastExams.length > 0 ? `
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <button 
              type="button" 
              id="toggle-past-exams-btn"
              class="w-full p-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
            >
              <div class="flex items-center gap-2">
                ${UI.icons.checkDone}
                <span>الامتحانات المنتهية أو المنجزة (${pastExams.length})</span>
              </div>
              <div id="past-exams-icon" class="transition transform duration-200">
                ${UI.icons.chevronDown}
              </div>
            </button>

            <div id="past-exams-list" class="hidden mt-4 space-y-3">
              ${pastExams.map(exam => `
                <div class="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-gray-900 dark:text-gray-300 block mb-1">${exam.subject} (${getExamTypeLabel(exam.type)})</span>
                    <span class="text-gray-500 font-mono-numeric">${exam.date} | ${exam.room || 'قاعة غير محددة'}</span>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-bold flex items-center gap-1">
                    ${UI.icons.check}
                    <span>امتحان منتهي</span>
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // 3 & 4. Dedicated Section for Assignments OR Reports (Separated Workflows)
  renderDedicatedSection(items, studentDone, kind, title) {
    const now = new Date();
    const isReport = kind === 'report';

    const totalCount = items.length;
    const completedCount = items.filter(a => studentDone[a.id]).length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return `
      <div>
        <!-- Individual Progress Card -->
        <div class="mb-6 p-5 rounded-2xl glass-panel border border-gray-200 dark:border-white/10">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>تتبع إنجاز ${title}</span>
                <span class="text-xs text-cyan-600 dark:text-cyan-400 font-mono-numeric">(${completedCount} من ${totalCount})</span>
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">يتم حفظ حالة الإنجاز في جهازك الشخصي</p>
            </div>
            <div class="text-sm font-black font-mono-numeric text-cyan-600 dark:text-cyan-300">
              ${progressPercent}%
            </div>
          </div>
          <div class="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-500" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        ${items.length === 0 ? `
          <div class="text-center py-16 px-4 rounded-3xl glass-panel border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-3">
              ${isReport ? UI.icons.fileText : UI.icons.checkCircle}
            </div>
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد ${title} مسجلة حالياً</h3>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${items.map(item => {
              const isDone = !!studentDone[item.id];
              const dueDateObj = new Date(item.dueDate);
              const isPast = dueDateObj < now;

              let diffMs = dueDateObj - now;
              let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              let diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

              let timeBadgeClass = 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30';
              let timeText = `متبقي ${diffDays} يوم و ${diffHours} ساعة`;

              if (isPast) {
                timeBadgeClass = 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-white/5';
                timeText = 'انتهى موعد التسليم';
              } else if (diffDays < 2) {
                timeBadgeClass = 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40';
                timeText = diffDays === 0 ? `متبقي ${diffHours} ساعة فقط!` : `متبقي يوم واحد!`;
              }

              return `
                <div class="p-5 rounded-2xl glass-panel relative ${isDone ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-[#0d1c16]/50' : 'border-gray-200 dark:border-white/10'} hover:border-cyan-500/50 transition flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <span class="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                        ${item.subject}
                      </span>
                      <span class="px-2 py-0.5 rounded-lg text-[11px] font-bold border ${timeBadgeClass}">
                        ${timeText}
                      </span>
                    </div>

                    <h4 class="text-base font-bold text-gray-900 dark:text-white mb-2 ${isDone ? 'line-through text-gray-400' : ''}">
                      ${item.title}
                    </h4>

                    ${item.description ? `
                      <p class="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">${item.description}</p>
                    ` : ''}

                    <div class="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl mb-4 border border-gray-200 dark:border-white/5">
                      <div class="flex items-center justify-between">
                        <span>طريقة التسليم:</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${item.submission || 'غير محدد'}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span>آخر موعد:</span>
                        <span class="font-mono-numeric dir-ltr text-gray-800 dark:text-gray-200">${item.dueDate ? item.dueDate.replace('T', ' ') : 'مفتوح'}</span>
                      </div>
                      ${item.pages ? `
                        <div class="flex items-center justify-between">
                          <span>المتطلبات / الصفحات:</span>
                          <span class="text-cyan-700 dark:text-cyan-300 font-medium">${item.pages}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Completion checkbox -->
                  <div class="pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <label class="flex items-center gap-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        data-toggle-done="${item.id}"
                        ${isDone ? 'checked' : ''} 
                        class="w-5 h-5 rounded-lg bg-gray-100 dark:bg-black/40 border-gray-300 dark:border-white/20 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <span class="text-xs font-semibold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}">
                        ${isDone ? 'تم التسليم من قبلي ✓' : 'تحديد كمنجز'}
                      </span>
                    </label>

                    ${isDone ? `
                      <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ${UI.icons.check}
                        <span>مكتمل</span>
                      </span>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  bindEvents(container) {
    container.querySelectorAll('.student-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.tabTarget;
        this.render(container, this.currentShift);
      };
    });

    container.querySelectorAll('.day-filter-btn').forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.dayFilter;
        this.selectedDay = val === 'all' ? 'all' : Number(val);
        this.render(container, this.currentShift);
      };
    });

    container.querySelectorAll('[data-toggle-done]').forEach(chk => {
      chk.onchange = async () => {
        const id = chk.dataset.toggleDone;
        const newStatus = await window.Store.toggleStudentDone(id);
        UI.toast(newStatus ? 'تم تحديد التكليف كمنجز في جهازك ✓' : 'تم إلغاء التحديد', 'info', 2000);
        this.render(container, this.currentShift);
      };
    });

    container.querySelectorAll('[data-copy-code]').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.copyCode;
        navigator.clipboard.writeText(code).then(() => {
          UI.toast(`تم نسخ رمز Classroom (${code}) بنجاح ✓`, 'success', 2500);
        });
      };
    });

    const pastBtn = container.querySelector('#toggle-past-exams-btn');
    if (pastBtn) {
      pastBtn.onclick = () => {
        const list = container.querySelector('#past-exams-list');
        const icon = container.querySelector('#past-exams-icon');
        if (list) {
          list.classList.toggle('hidden');
          icon.classList.toggle('rotate-180');
        }
      };
    }

    // Close urgent alert banner
    const closeAlertBtn = container.querySelector('#close-urgent-alert');
    if (closeAlertBtn) {
      closeAlertBtn.onclick = () => {
        const alertEl = container.querySelector('#student-urgent-alert');
        if (alertEl) {
          alertEl.style.transition = 'all 0.3s ease-out';
          alertEl.style.opacity = '0';
          alertEl.style.transform = 'translateY(-10px)';
          setTimeout(() => alertEl.remove(), 300);
        }
      };
    }

    // Download schedule button
    const downloadBtn = container.querySelector('#btn-download-schedule');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const scheduleSection = container.querySelector('#tab-content-lectures');
        if (!scheduleSection) {
          UI.toast('لا يوجد جدول لتحميله حالياً', 'warning');
          return;
        }

        if (typeof html2canvas === 'undefined') {
          UI.toast('مكتبة التصدير غير متوفرة. تأكد من اتصالك بالإنترنت وأعد تحميل الصفحة.', 'error');
          return;
        }

        // Show loading state
        downloadBtn.disabled = true;
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `${UI.icons.download} <span>جاري التصدير...</span>`;

        html2canvas(scheduleSection, {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a14' : '#f8fafc',
          scale: 2,
          useCORS: true,
          logging: false
        }).then(canvas => {
          const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (typeof jsPDF !== 'undefined' ? jsPDF : null);
          if (jsPDFClass) {
            const pdf = new jsPDFClass('l', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
            pdf.save('الجدول_الدراسي.pdf');
            UI.toast('تم تحميل الجدول بصيغة PDF بنجاح ✓', 'success');
          } else {
            const link = document.createElement('a');
            link.download = 'الجدول_الدراسي.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            UI.toast('تم تحميل الجدول كصورة PNG بنجاح ✓', 'success');
          }
        }).catch(err => {
          console.error('Schedule export error:', err);
          UI.toast('حدث خطأ أثناء تصدير الجدول', 'error');
        }).finally(() => {
          downloadBtn.disabled = false;
          downloadBtn.innerHTML = originalText;
        });
      };
    }

    // Toggle push notifications button
    const notifBtn = container.querySelector('#btn-toggle-notifications');
    if (notifBtn) {
      const updateNotifUi = () => {
        if (!notifBtn.isConnected) return;
        const perm = window.NotificationsEngine ? window.NotificationsEngine.getPermission() : 'unsupported';
        const txt = notifBtn.querySelector('.notif-status-text');
        if (perm === 'granted') {
          if (txt) txt.textContent = 'الإشعارات مفعلة ✓';
          notifBtn.classList.add('text-emerald-600', 'dark:text-emerald-400');
          notifBtn.classList.remove('text-rose-500');
        } else if (perm === 'denied') {
          if (txt) txt.textContent = 'الإشعارات محظورة';
          notifBtn.classList.add('text-rose-500');
          notifBtn.classList.remove('text-emerald-600', 'dark:text-emerald-400');
        } else {
          if (txt) txt.textContent = 'تفعيل الإشعارات';
          notifBtn.classList.remove('text-emerald-600', 'dark:text-emerald-400', 'text-rose-500');
        }
      };
      updateNotifUi();

      // Keep the bell label in sync when OneSignal or the browser changes
      // permission (including the return from the system settings page).
      this.notifUiSync = updateNotifUi;
      window.addEventListener('push-ready', updateNotifUi);
      window.addEventListener('push-permission-changed', updateNotifUi);
      window.addEventListener('notification-permission-changed', updateNotifUi);

      notifBtn.onclick = async () => {
        const engine = window.PushEngine || window.NotificationsEngine;
        if (!engine || typeof engine.requestPermission !== 'function') return;
        notifBtn.disabled = true;
        try {
          await engine.requestPermission();
        } finally {
          notifBtn.disabled = false;
          updateNotifUi();
        }
      };
    }
  },

  startLiveClock() {
    const clockEl = document.getElementById('live-digital-clock');
    if (!clockEl) return;
    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('ar-IQ', { hour12: true });
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  },

  startExamCountdowns() {
    const update = () => {
      const boxes = document.querySelectorAll('[data-exam-timer]');
      const now = Date.now();

      boxes.forEach(box => {
        const iso = box.dataset.examTimer;
        const target = new Date(iso).getTime();
        const diff = target - now;

        const daysEl = box.querySelector('.count-days');
        const hoursEl = box.querySelector('.count-hours');
        const minEl = box.querySelector('.count-minutes');
        const secEl = box.querySelector('.count-seconds');
        const badgeEl = box.querySelector('.exam-urgency-badge');

        if (!daysEl) return;

        if (diff <= 0) {
          daysEl.textContent = '00';
          hoursEl.textContent = '00';
          minEl.textContent = '00';
          secEl.textContent = '00';
          if (badgeEl) {
            badgeEl.textContent = 'الامتحان جارٍ أو منتهي';
            badgeEl.className = 'exam-urgency-badge text-center mt-2 text-[11px] font-bold text-gray-400';
          }
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minEl.textContent = String(minutes).padStart(2, '0');
        secEl.textContent = String(seconds).padStart(2, '0');

        if (badgeEl) {
          if (days < 3) {
            badgeEl.textContent = 'موعد عاجل ومقترب (< 3 أيام)';
            badgeEl.className = 'exam-urgency-badge text-center mt-2 text-[11px] font-bold text-rose-500';
          } else if (days <= 7) {
            badgeEl.textContent = 'خلال الأسبوع القادم (3 - 7 أيام)';
            badgeEl.className = 'exam-urgency-badge text-center mt-2 text-[11px] font-bold text-amber-500';
          } else {
            badgeEl.textContent = 'الوقت متاح للاستعداد (> 7 أيام)';
            badgeEl.className = 'exam-urgency-badge text-center mt-2 text-[11px] font-bold text-emerald-500';
          }
        }
      });
    };

    update();
    this.countdownInterval = setInterval(update, 1000);
  },

  cleanup() {
    if (this.notifUiSync) {
      window.removeEventListener('push-ready', this.notifUiSync);
      window.removeEventListener('push-permission-changed', this.notifUiSync);
      window.removeEventListener('notification-permission-changed', this.notifUiSync);
      this.notifUiSync = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }
};

window.Student = Student;
