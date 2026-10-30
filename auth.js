/**
 * Auth - Authentication and Session Management for Representatives and Platform Admin
 * Features:
 * - Instant master access with password '00' (safe on file:// and all browsers)
 * - Brute-force rate limiting protection
 * - Silent login / logout (toasts disabled as requested)
 */

const AUTH_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 30 * 1000
};

const Auth = {
  getFailedAttempts() {
    try {
      const raw = sessionStorage.getItem('uni.auth.fails');
      return raw ? JSON.parse(raw) : { count: 0, lockedUntil: null };
    } catch {
      return { count: 0, lockedUntil: null };
    }
  },

  setFailedAttempts(count, lockedUntil = null) {
    sessionStorage.setItem('uni.auth.fails', JSON.stringify({ count, lockedUntil }));
  },

  resetFailedAttempts() {
    sessionStorage.removeItem('uni.auth.fails');
  },

  isLockedOut() {
    const attempts = this.getFailedAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }
    return { locked: false, remainingSeconds: 0 };
  },

  // Representative Login
  async loginRep(code, rememberMe = false) {
    const lockout = this.isLockedOut();
    if (lockout.locked) {
      throw new Error(`تم قفل المحاولات مؤقتاً. يرجى الانتظار ${lockout.remainingSeconds} ثانية.`);
    }

    if (!code || !code.trim()) {
      throw new Error('يرجى إدخال رمز الدخول الخاص بك.');
    }

    const cleanCode = code.trim().toUpperCase();
    const rep = await window.Store.getRepByCode(cleanCode);

    if (!rep) {
      const attempts = this.getFailedAttempts();
      const newCount = attempts.count + 1;
      let lockedUntil = null;
      if (newCount >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS) {
        lockedUntil = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION_MS;
      }
      this.setFailedAttempts(newCount, lockedUntil);

      const remainingTries = AUTH_CONFIG.MAX_FAILED_ATTEMPTS - newCount;
      if (remainingTries > 0) {
        throw new Error(`رمز الدخول غير صحيح! تبقى لديك ${remainingTries} محاولات.`);
      } else {
        throw new Error('تم تجاوز الحد الأقصى للمحاولات. تم قفل المحاولات مؤقتاً لمدة 30 ثانية.');
      }
    }

    if (!rep.active) {
      throw new Error('تم تعطيل هذا الحساب مؤقتاً من قبل الإدارة.');
    }

    this.resetFailedAttempts();
    await window.Store.updateRep(rep.id, { lastLoginAt: new Date().toISOString() });

    const sessionPayload = {
      repId: rep.id,
      name: rep.name,
      shifts: rep.shifts,
      loggedInAt: Date.now()
    };

    if (rememberMe) {
      localStorage.setItem('uni.session.rep', JSON.stringify(sessionPayload));
      sessionStorage.removeItem('uni.session.rep.temp');
    } else {
      sessionStorage.setItem('uni.session.rep.temp', JSON.stringify(sessionPayload));
      localStorage.removeItem('uni.session.rep');
    }

    window.dispatchEvent(new CustomEvent('uni-auth-rep-changed', { detail: { rep } }));
    return rep;
  },

  async getRepSession() {
    let raw = localStorage.getItem('uni.session.rep');
    let isPersistent = true;
    if (!raw) {
      raw = sessionStorage.getItem('uni.session.rep.temp');
      isPersistent = false;
    }

    if (!raw) return null;

    try {
      const session = JSON.parse(raw);
      const rep = await window.Store.getRepById(session.repId);
      if (!rep || !rep.active) {
        this.logoutRep();
        return null;
      }
      return {
        ...session,
        name: rep.name,
        shifts: rep.shifts,
        active: rep.active,
        isPersistent
      };
    } catch {
      this.logoutRep();
      return null;
    }
  },

  logoutRep() {
    localStorage.removeItem('uni.session.rep');
    sessionStorage.removeItem('uni.session.rep.temp');
    window.dispatchEvent(new CustomEvent('uni-auth-rep-changed', { detail: { rep: null } }));
  },

  // Admin Authentication - Direct and Fail-safe
  async loginAdmin(inputPassword) {
    if (!inputPassword || !inputPassword.trim()) {
      throw new Error('يرجى إدخال كلمة المرور.');
    }

    const cleanInput = inputPassword.trim();

    // Master check: '00' is immediately valid without needing any async crypto
    if (cleanInput === '00') {
      const sessionData = { role: 'admin', loggedInAt: Date.now() };
      sessionStorage.setItem('uni.session.admin', JSON.stringify(sessionData));
      window.dispatchEvent(new CustomEvent('uni-auth-admin-changed', { detail: { loggedIn: true } }));
      return true;
    }

    // Custom changed password check
    const settings = await window.Store.getSettings();
    const inputHash = await window.Store.sha256(cleanInput);

    if (inputHash !== settings.adminPasswordHash) {
      throw new Error('كلمة المرور غير صحيحة!');
    }

    const sessionData = { role: 'admin', loggedInAt: Date.now() };
    sessionStorage.setItem('uni.session.admin', JSON.stringify(sessionData));
    window.dispatchEvent(new CustomEvent('uni-auth-admin-changed', { detail: { loggedIn: true } }));
    return true;
  },

  getAdminSession() {
    try {
      const raw = sessionStorage.getItem('uni.session.admin');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logoutAdmin() {
    sessionStorage.removeItem('uni.session.admin');
    window.dispatchEvent(new CustomEvent('uni-auth-admin-changed', { detail: { loggedIn: false } }));
  }
};

window.Auth = Auth;
