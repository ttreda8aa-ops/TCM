/**
 * Store - University Platform Data Layer powered by Local Realm DB Engine
 * Features:
 * - Pure JavaScript SHA-256 fallback (ensures crypto.subtle never crashes in file:// or non-HTTPS contexts)
 * - Realm DB Local Engine with Schemas, Models, Transactions & Queries
 */

// ==========================================
// 1. Pure JS SHA-256 Fallback Implementation
// ==========================================
function sha256_pure(str) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = str.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  str += '\x80';
  while (str.length % 64 - 56) str += '\x00';
  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.pop();
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Universal Safe SHA-256: works in all browser contexts (file://, http, https)
async function sha256(text) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto not available, using pure JS SHA-256 fallback');
  }
  return sha256_pure(text);
}

// ==========================================
// 1.5 Appwrite Cloud Sync Helper
// ==========================================
const AppwriteSync = {
  isAvailable() {
    return typeof window !== 'undefined' && window.isAppwriteActive && window.isAppwriteActive();
  },

  async listDocuments(collectionName, queries = []) {
    if (!this.isAvailable()) return null;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      const res = await window.appwriteDatabases.listDocuments(
        window.AppwriteConfig.databaseId,
        colId,
        queries
      );
      return res.documents || [];
    } catch (e) {
      console.warn(`[Appwrite] listDocuments error on ${collectionName}:`, e.message);
      return null;
    }
  },

  async createDocument(collectionName, docId, data) {
    if (!this.isAvailable()) return null;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      const ID = window.Appwrite ? window.Appwrite.ID : { unique: () => 'doc_' + Date.now() };
      const actualId = docId || ID.unique();
      return await window.appwriteDatabases.createDocument(
        window.AppwriteConfig.databaseId,
        colId,
        actualId,
        data
      );
    } catch (e) {
      console.warn(`[Appwrite] createDocument error on ${collectionName}:`, e.message);
      return null;
    }
  },

  async updateDocument(collectionName, docId, data) {
    if (!this.isAvailable()) return null;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      return await window.appwriteDatabases.updateDocument(
        window.AppwriteConfig.databaseId,
        colId,
        docId,
        data
      );
    } catch (e) {
      console.warn(`[Appwrite] updateDocument error on ${collectionName}:`, e.message);
      return null;
    }
  },

  async deleteDocument(collectionName, docId) {
    if (!this.isAvailable()) return false;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      await window.appwriteDatabases.deleteDocument(
        window.AppwriteConfig.databaseId,
        colId,
        docId
      );
      return true;
    } catch (e) {
      console.warn(`[Appwrite] deleteDocument error on ${collectionName}:`, e.message);
      return false;
    }
  },

  subscribe(collectionName, callback) {
    if (!this.isAvailable() || !window.appwriteClient) return null;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      const channel = `databases.${window.AppwriteConfig.databaseId}.collections.${colId}.documents`;
      return window.appwriteClient.subscribe(channel, response => {
        if (callback) callback(response);
      });
    } catch (e) {
      console.warn(`[Appwrite] Realtime subscription error:`, e.message);
      return null;
    }
  }
};

// ==========================================
// 2. Local Realm DB Engine Definition
// ==========================================
class RealmLocalEngine {
  constructor(dbName = 'UniversityPlatformRealm') {
    this.dbName = dbName;
    this.schemas = {};
    this.storagePrefix = `realm_${this.dbName}_`;
  }

  registerSchema(name, schema) {
    this.schemas[name] = schema;
  }

  _getCollection(schemaName) {
    try {
      const raw = localStorage.getItem(`${this.storagePrefix}${schemaName}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  _setCollection(schemaName, items) {
    localStorage.setItem(`${this.storagePrefix}${schemaName}`, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('realm-collection-changed', { detail: { schema: schemaName } }));
  }

  objects(schemaName) {
    const items = this._getCollection(schemaName);
    return {
      all: () => [...items],
      filtered: (predicateFn) => items.filter(predicateFn),
      find: (predicateFn) => items.find(predicateFn) || null,
      sorted: (key, direction = 'asc') => {
        return [...items].sort((a, b) => {
          if (direction === 'desc') return (b[key] > a[key] ? 1 : -1);
          return (a[key] > b[key] ? 1 : -1);
        });
      }
    };
  }

  write(transactionFn) {
    const realmContext = {
      create: (schemaName, item) => {
        const items = this._getCollection(schemaName);
        const newItem = { ...item };
        if (!newItem.id) {
          newItem.id = `${schemaName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        }
        items.unshift(newItem);
        this._setCollection(schemaName, items);
        return newItem;
      },
      update: (schemaName, id, patch) => {
        const items = this._getCollection(schemaName);
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) throw new Error(`Element ${id} not found in ${schemaName}`);
        items[idx] = { ...items[idx], ...patch };
        this._setCollection(schemaName, items);
        return items[idx];
      },
      delete: (schemaName, id) => {
        let items = this._getCollection(schemaName);
        items = items.filter(i => i.id !== id);
        this._setCollection(schemaName, items);
        return true;
      },
      setAll: (schemaName, newItems) => {
        this._setCollection(schemaName, newItems);
      }
    };

    return transactionFn(realmContext);
  }
}

const localRealm = new RealmLocalEngine('UniAcademicDB');

const Schemas = {
  Settings: 'Settings',
  Representative: 'Representative',
  MorningLecture: 'MorningLecture',
  EveningLecture: 'EveningLecture',
  MorningExam: 'MorningExam',
  EveningExam: 'EveningExam',
  MorningAssignment: 'MorningAssignment',
  EveningAssignment: 'EveningAssignment',
  MorningAlert: 'MorningAlert',
  EveningAlert: 'EveningAlert',
  StudentDone: 'StudentDone'
};

Object.values(Schemas).forEach(name => localRealm.registerSchema(name, { name }));

function generateRepCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    result += chars[rand];
    if (i === 3) result += '-';
  }
  return result;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DEFAULT_SETTINGS = {
  platformName: 'المنصة الجامعية الموحدة',
  collegeName: '',
  departmentName: '',
  tagline: '',
  adminPasswordHash: '40bd001563085fc35165329ea1ff5c5ecbdbbeefd0f04020c2a21e6be31d9b4b',
  activeDays: [1, 2, 3, 4, 5], // الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس
  numberFormat: 'western',
  semesterName: '',
  shiftsEnabled: {
    morning: true,
    evening: true
  },
  announcement: {
    active: false,
    title: '',
    message: ''
  }
};

const DEFAULT_REPS = [
  {
    id: 'rep_demo_morning',
    name: 'أحمد محمود',
    code: 'K7M2-9QXP',
    shifts: ['morning'],
    active: true,
    createdAt: '2026-10-25T08:00:00Z',
    lastLoginAt: null
  },
  {
    id: 'rep_demo_evening',
    name: 'سارة خالد',
    code: 'V3R8-4TWY',
    shifts: ['evening'],
    active: true,
    createdAt: '2026-10-26T11:00:00Z',
    lastLoginAt: null
  },
  {
    id: 'rep_demo_both',
    name: 'مصطفى حيدر',
    code: 'B9P4-7KLZ',
    shifts: ['morning', 'evening'],
    active: true,
    createdAt: '2026-10-27T14:00:00Z',
    lastLoginAt: null
  }
];

const DEFAULT_MORNING_LECTURES = [
  { id: 'lec_m_1', subject: 'هندسة البرمجيات', lecturer: 'د. عمار', day: 1, start: '08:30', end: '10:00', room: 'قاعة 101', type: 'theory', classroomCode: 'swe-401' },
  { id: 'lec_m_2', subject: 'مختبر هندسة البرمجيات', lecturer: 'م. مروة', day: 1, start: '10:15', end: '12:15', room: 'مختبر 3', type: 'practical', classroomCode: 'swe-lab-2' },
  { id: 'lec_m_3', subject: 'قواعد البيانات', lecturer: 'د. ليث', day: 2, start: '09:00', end: '11:00', room: 'مدرج 2', type: 'theory', classroomCode: 'db-cloud-9' },
  { id: 'lec_m_4', subject: 'أمن الشبكات', lecturer: 'د. وسام', day: 3, start: '11:00', end: '13:00', room: 'قاعة 204', type: 'theory', classroomCode: 'sec-net-7' },
  { id: 'lec_m_5', subject: 'الذكاء الاصطناعي', lecturer: 'د. رغد', day: 4, start: '08:30', end: '10:30', room: 'قاعة 102', type: 'theory', classroomCode: 'ai-ml-5' },
  { id: 'lec_m_6', subject: 'نظم التشغيل الموزعة', lecturer: 'د. علي', day: 5, start: '10:00', end: '12:00', room: 'قاعة 201', type: 'theory', classroomCode: 'os-dist-3' }
];

const DEFAULT_EVENING_LECTURES = [
  { id: 'lec_e_1', subject: 'هندسة البرمجيات', lecturer: 'د. عمار', day: 1, start: '15:30', end: '17:00', room: 'قاعة 101', type: 'theory', classroomCode: 'swe-ev-1' },
  { id: 'lec_e_2', subject: 'قواعد البيانات', lecturer: 'د. ليث', day: 2, start: '16:00', end: '18:00', room: 'مدرج 2', type: 'theory', classroomCode: 'db-ev-8' },
  { id: 'lec_e_3', subject: 'أمن الشبكات', lecturer: 'د. وسام', day: 3, start: '16:30', end: '18:30', room: 'قاعة 204', type: 'theory', classroomCode: 'sec-ev-4' },
  { id: 'lec_e_4', subject: 'الذكاء الاصطناعي', lecturer: 'د. رغد', day: 4, start: '15:30', end: '17:30', room: 'قاعة 102', type: 'theory', classroomCode: 'ai-ev-2' }
];

const DEFAULT_MORNING_EXAMS = [
  { id: 'exm_m_1', subject: 'قواعد البيانات', type: 'midterm', date: '2026-11-04', time: '09:30', room: 'المدرج 2', notes: 'الفصول 1-4', isCompleted: false },
  { id: 'exm_m_2', subject: 'هندسة البرمجيات', type: 'monthly', date: '2026-11-12', time: '11:00', room: 'قاعة 101', notes: 'مخططات UML', isCompleted: false },
  { id: 'exm_m_3', subject: 'الرياضيات المتقطعة', type: 'monthly', date: '2026-10-15', time: '10:00', room: 'قاعة 101', notes: 'امتحان منجز', isCompleted: true }
];

const DEFAULT_EVENING_EXAMS = [
  { id: 'exm_e_1', subject: 'قواعد البيانات', type: 'midterm', date: '2026-11-05', time: '16:00', room: 'المدرج 2', notes: 'الفصول 1-4', isCompleted: false },
  { id: 'exm_e_2', subject: 'أمن الشبكات', type: 'monthly', date: '2026-11-15', time: '17:00', room: 'قاعة 204', notes: 'امتحان شهري', isCompleted: false }
];

const DEFAULT_MORNING_ASSIGNMENTS = [
  { id: 'asg_m_1', title: 'تصميم نموذج قاعدة بيانات NoSQL', subject: 'قواعد البيانات', kind: 'assignment', description: 'بناء مخطط JSON Schema متكامل.', dueDate: '2026-11-03T23:59', submission: 'رفع على البوابة' },
  { id: 'asg_m_2', title: 'تقرير تحليل متطلبات الأنظمة الأكاديمية', subject: 'هندسة البرمجيات', kind: 'report', description: 'إعداد وثيقة SRS متكاملة.', dueDate: '2026-11-08T18:00', submission: 'تسليم يدوي للممثل', pages: '10 صفحات' },
  { id: 'asg_m_3', title: 'خوارزمية تشفير RSA بلغة Python', subject: 'أمن الشبكات', kind: 'assignment', description: 'كتابة برنامج يشرح التشفير وفك التشفير.', dueDate: '2026-11-14T23:59', submission: 'مستودع GitHub' }
];

const DEFAULT_EVENING_ASSIGNMENTS = [
  { id: 'asg_e_1', title: 'تطبيق عملي: استعلامات MongoDB', subject: 'قواعد البيانات', kind: 'assignment', description: 'استعلامات تحليلية متقدمة.', dueDate: '2026-11-06T23:59', submission: 'ملف سكريبت JS' },
  { id: 'asg_e_2', title: 'بحث مقارن حول خوادم السحابة', subject: 'هندسة البرمجيات', kind: 'report', description: 'دراسة حالة حول التكاليف والأمان.', dueDate: '2026-11-10T20:00', submission: 'البريد الأكاديمي', pages: '8 صفحات' }
];

const Store = {
  realm: localRealm,
  sha256,
  generateRepCode,
  escapeHtml,

  async init() {
    const settingsList = localRealm.objects(Schemas.Settings).all();
    if (settingsList.length === 0) {
      await this.resetFactory(true);
    } else {
      // Ensure Sunday - Thursday (1 - 5) is set
      const s = settingsList[0];
      if (s.activeDays && s.activeDays.includes(0)) {
        s.activeDays = [1, 2, 3, 4, 5];
        localRealm.write(r => r.setAll(Schemas.Settings, [s]));
      }
    }

    // Initialize Appwrite Realtime Sync & Background Fetch
    this.initAppwriteSync();
  },

  async initAppwriteSync() {
    if (!AppwriteSync.isAvailable()) return;

    try {
      console.log('Connecting to Appwrite Realtime channels...');
      // Subscribe to Realtime events on collections
      ['lectures', 'exams', 'assignments', 'alerts', 'settings'].forEach(col => {
        AppwriteSync.subscribe(col, (response) => {
          console.log(`[Appwrite Realtime] Event on ${col}:`, response);
          window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { collection: col, source: 'appwrite' } }));

          // Trigger System Push Notification for Students
          if (window.NotificationsEngine && response && response.payload) {
            const p = response.payload;
            if (col === 'alerts' && p.active && p.text) {
              window.NotificationsEngine.sendNotification({
                title: 'تنبيه عاجل من ممثل الدفعة ⚠️',
                body: p.text,
                tag: 'urgent_alert_' + Date.now()
              });
            } else if (col === 'exams' && p.subject) {
              window.NotificationsEngine.sendNotification({
                title: 'امتحان جديد تم إدراجه 📅',
                body: `مادة: ${p.subject} | التاريخ: ${p.date || ''}`,
                tag: 'exam_alert_' + Date.now()
              });
            }
          }
        });
      });

      // Background sync from Appwrite to Local Cache
      this.syncFromAppwrite();
    } catch (e) {
      console.warn('Realtime init notice:', e.message);
    }
  },

  async syncFromAppwrite() {
    if (!AppwriteSync.isAvailable()) return;
    try {
      // 1. Fetch lectures from Appwrite
      const cloudLectures = await AppwriteSync.listDocuments('lectures');
      if (cloudLectures && cloudLectures.length > 0) {
        const morning = cloudLectures.filter(l => l.shift === 'morning');
        const evening = cloudLectures.filter(l => l.shift === 'evening');
        if (morning.length) localRealm.write(r => r.setAll(Schemas.MorningLecture, morning));
        if (evening.length) localRealm.write(r => r.setAll(Schemas.EveningLecture, evening));
      }

      // 2. Fetch exams
      const cloudExams = await AppwriteSync.listDocuments('exams');
      if (cloudExams && cloudExams.length > 0) {
        const morning = cloudExams.filter(e => e.shift === 'morning');
        const evening = cloudExams.filter(e => e.shift === 'evening');
        if (morning.length) localRealm.write(r => r.setAll(Schemas.MorningExam, morning));
        if (evening.length) localRealm.write(r => r.setAll(Schemas.EveningExam, evening));
      }

      // 3. Fetch alerts
      const cloudAlerts = await AppwriteSync.listDocuments('alerts');
      if (cloudAlerts && cloudAlerts.length > 0) {
        const morningAlert = cloudAlerts.find(a => a.shift === 'morning');
        const eveningAlert = cloudAlerts.find(a => a.shift === 'evening');
        if (morningAlert) localRealm.write(r => r.setAll(Schemas.MorningAlert, [morningAlert]));
        if (eveningAlert) localRealm.write(r => r.setAll(Schemas.EveningAlert, [eveningAlert]));
      }

      window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'appwrite-synced' } }));
    } catch (err) {
      console.warn('Background sync error (normal if collections are fresh):', err.message);
    }
  },

  async getSettings() {
    const list = localRealm.objects(Schemas.Settings).all();
    return list[0] ? list[0] : { ...DEFAULT_SETTINGS };
  },

  async saveSettings(patch) {
    const current = await this.getSettings();
    const updated = { ...current, ...patch };
    localRealm.write(r => {
      r.setAll(Schemas.Settings, [updated]);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'settings' } }));
    return updated;
  },

  async getReps() {
    if (AppwriteSync.isAvailable()) {
      try {
        const cloudDocs = await AppwriteSync.listDocuments('representatives');
        if (cloudDocs !== null) {
          const reps = cloudDocs.map(d => ({
            id: d.$id || d.id,
            name: d.name,
            code: d.code,
            shifts: typeof d.shifts === 'string' ? JSON.parse(d.shifts || '["morning"]') : (d.shifts || ['morning']),
            active: d.active !== undefined ? d.active : true,
            createdAt: d.createdAt || d.$createdAt,
            lastLoginAt: d.lastLoginAt || null
          }));
          localRealm.write(r => r.setAll(Schemas.Representative, reps));
          return reps;
        }
      } catch (err) {
        console.warn('Appwrite reps fetch fallback:', err.message);
      }
    }
    return localRealm.objects(Schemas.Representative).all();
  },

  async getRepById(id) {
    const reps = await this.getReps();
    return reps.find(r => r.id === id) || null;
  },

  async getRepByCode(code) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    const reps = await this.getReps();
    return reps.find(r => r.code && r.code.toUpperCase() === cleanCode) || null;
  },

  async addRep(repData) {
    const newRep = {
      name: escapeHtml(repData.name.trim()),
      code: repData.code || generateRepCode(),
      shifts: repData.shifts && repData.shifts.length ? repData.shifts : ['morning'],
      active: repData.active !== undefined ? repData.active : true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    };

    let created;
    localRealm.write(r => {
      created = r.create(Schemas.Representative, newRep);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      const cloudPayload = {
        name: newRep.name,
        code: newRep.code,
        shifts: JSON.stringify(newRep.shifts),
        active: newRep.active,
        createdAt: newRep.createdAt,
        lastLoginAt: ''
      };
      AppwriteSync.createDocument('representatives', created.id, cloudPayload).catch(e => {
        console.warn('Appwrite rep create sync error:', e.message);
      });
    }

    return created;
  },

  async updateRep(id, patch) {
    let updated;
    localRealm.write(r => {
      updated = r.update(Schemas.Representative, id, patch);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      const cloudPatch = { ...patch };
      if (cloudPatch.shifts && Array.isArray(cloudPatch.shifts)) {
        cloudPatch.shifts = JSON.stringify(cloudPatch.shifts);
      }
      AppwriteSync.updateDocument('representatives', id, cloudPatch).catch(e => {
        console.warn('Appwrite rep update sync error:', e.message);
      });
    }

    return updated;
  },

  async deleteRep(id) {
    localRealm.write(r => {
      r.delete(Schemas.Representative, id);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      AppwriteSync.deleteDocument('representatives', id).catch(e => {
        console.warn('Appwrite rep delete sync error:', e.message);
      });
    }

    return true;
  },

  async regenerateRepCode(id) {
    const newCode = generateRepCode();
    await this.updateRep(id, { code: newCode });
    return newCode;
  },

  _getSchemaName(shift, collection) {
    const isMorning = shift === 'morning';
    if (collection === 'lectures') return isMorning ? Schemas.MorningLecture : Schemas.EveningLecture;
    if (collection === 'exams') return isMorning ? Schemas.MorningExam : Schemas.EveningExam;
    if (collection === 'assignments') return isMorning ? Schemas.MorningAssignment : Schemas.EveningAssignment;
    throw new Error(`Unknown collection ${collection}`);
  },

  async getUrgentAlert(shift = 'morning') {
    if (AppwriteSync.isAvailable()) {
      try {
        const cloudAlerts = await AppwriteSync.listDocuments('alerts');
        if (cloudAlerts && cloudAlerts.length > 0) {
          const item = cloudAlerts.find(a => a.shift === shift);
          if (item) {
            return {
              active: !!item.active,
              text: item.text || '',
              type: item.type || 'urgent',
              updatedAt: item.updatedAt || null
            };
          }
        }
      } catch (e) {
        console.warn('Appwrite alert fetch fallback:', e.message);
      }
    }
    const schema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
    const list = localRealm.objects(schema).all();
    return list[0] || { active: false, text: '', type: 'urgent', updatedAt: null };
  },

  async saveUrgentAlert(shift = 'morning', alertData) {
    const schema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
    const payload = {
      id: `alert_${shift}`,
      shift,
      active: !!alertData.active,
      text: escapeHtml(alertData.text ? alertData.text.trim() : ''),
      type: alertData.type || 'urgent', // 'urgent' | 'warning' | 'info'
      updatedAt: new Date().toISOString()
    };
    localRealm.write(r => {
      r.setAll(schema, [payload]);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection: 'alert' } }));

    // Sync to Appwrite Cloud in background
    if (AppwriteSync.isAvailable()) {
      AppwriteSync.createDocument('alerts', payload.id, payload).catch(() => {
        AppwriteSync.updateDocument('alerts', payload.id, payload);
      });
    }

    return payload;
  },

  async getShiftData(shift = 'morning') {
    // 1. If Appwrite Cloud is available, fetch live documents directly
    if (AppwriteSync.isAvailable()) {
      try {
        const [cloudLec, cloudExm, cloudAsg, cloudAlerts] = await Promise.all([
          AppwriteSync.listDocuments('lectures'),
          AppwriteSync.listDocuments('exams'),
          AppwriteSync.listDocuments('assignments'),
          AppwriteSync.listDocuments('alerts')
        ]);

        if (cloudLec !== null && cloudExm !== null && cloudAsg !== null) {
          const lectures = cloudLec.filter(l => l.shift === shift);
          const exams = cloudExm.filter(e => e.shift === shift);
          const assignments = cloudAsg.filter(a => a.shift === shift);
          const alertItem = (cloudAlerts || []).find(a => a.shift === shift);
          const urgentAlert = alertItem ? {
            active: !!alertItem.active,
            text: alertItem.text || '',
            type: alertItem.type || 'urgent',
            updatedAt: alertItem.updatedAt || null
          } : { active: false, text: '', type: 'urgent', updatedAt: null };

          // Update local cache seamlessly
          const lecSchema = this._getSchemaName(shift, 'lectures');
          const exmSchema = this._getSchemaName(shift, 'exams');
          const asgSchema = this._getSchemaName(shift, 'assignments');
          const alertSchema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
          localRealm.write(r => {
            r.setAll(lecSchema, lectures);
            r.setAll(exmSchema, exams);
            r.setAll(asgSchema, assignments);
            r.setAll(alertSchema, alertItem ? [alertItem] : []);
          });

          return {
            lectures,
            exams,
            assignments,
            urgentAlert,
            updatedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('[Appwrite Cloud] live fetch fallback to local cache:', err.message);
      }
    }

    // 2. Offline / Local Fallback
    const lecSchema = this._getSchemaName(shift, 'lectures');
    const exmSchema = this._getSchemaName(shift, 'exams');
    const asgSchema = this._getSchemaName(shift, 'assignments');
    const alert = await this.getUrgentAlert(shift);

    return {
      lectures: localRealm.objects(lecSchema).all(),
      exams: localRealm.objects(exmSchema).all(),
      assignments: localRealm.objects(asgSchema).all(),
      urgentAlert: alert,
      updatedAt: new Date().toISOString()
    };
  },

  async addItem(shift, collection, item) {
    const schema = this._getSchemaName(shift, collection);
    const newItem = { ...item, shift };

    for (const k in newItem) {
      if (typeof newItem[k] === 'string' && !['dueDate', 'date', 'start', 'end'].includes(k)) {
        newItem[k] = escapeHtml(newItem[k].trim());
      }
    }

    let created;
    localRealm.write(r => {
      created = r.create(schema, newItem);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));

    // Sync to Appwrite Cloud in background
    if (AppwriteSync.isAvailable()) {
      const appwriteCol = collection; // 'lectures', 'exams', 'assignments'
      AppwriteSync.createDocument(appwriteCol, created.id, created).catch(err => {
        console.warn('[Appwrite sync addItem]:', err.message);
      });
    }

    return created;
  },

  async updateItem(shift, collection, id, patch) {
    const schema = this._getSchemaName(shift, collection);
    const sanitizedPatch = { ...patch };

    for (const k in sanitizedPatch) {
      if (typeof sanitizedPatch[k] === 'string' && !['dueDate', 'date', 'start', 'end'].includes(k)) {
        sanitizedPatch[k] = escapeHtml(sanitizedPatch[k].trim());
      }
    }

    let updated;
    localRealm.write(r => {
      updated = r.update(schema, id, sanitizedPatch);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));

    // Sync to Appwrite Cloud in background
    if (AppwriteSync.isAvailable()) {
      const appwriteCol = collection;
      AppwriteSync.updateDocument(appwriteCol, id, sanitizedPatch).catch(err => {
        console.warn('[Appwrite sync updateItem]:', err.message);
      });
    }

    return updated;
  },

  async deleteItem(shift, collection, id) {
    const schema = this._getSchemaName(shift, collection);
    localRealm.write(r => {
      r.delete(schema, id);
    });
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));

    // Sync to Appwrite Cloud in background
    if (AppwriteSync.isAvailable()) {
      const appwriteCol = collection;
      AppwriteSync.deleteDocument(appwriteCol, id).catch(err => {
        console.warn('[Appwrite sync deleteItem]:', err.message);
      });
    }

    return true;
  },

  async getStudentDone() {
    const records = localRealm.objects(Schemas.StudentDone).all();
    const map = {};
    records.forEach(r => { map[r.id] = r.done; });
    return map;
  },

  async toggleStudentDone(itemId) {
    const records = localRealm.objects(Schemas.StudentDone).all();
    const existing = records.find(r => r.id === itemId);
    const newStatus = existing ? !existing.done : true;

    localRealm.write(r => {
      if (existing) {
        r.update(Schemas.StudentDone, itemId, { done: newStatus });
      } else {
        r.create(Schemas.StudentDone, { id: itemId, done: true });
      }
    });

    window.dispatchEvent(new CustomEvent('uni-student-done-changed', { detail: { itemId, status: newStatus } }));
    return newStatus;
  },

  async resetFactory(loadDemo = true) {
    localRealm.write(r => {
      r.setAll(Schemas.Settings, [DEFAULT_SETTINGS]);
      r.setAll(Schemas.Representative, loadDemo ? DEFAULT_REPS : []);
      r.setAll(Schemas.MorningLecture, loadDemo ? DEFAULT_MORNING_LECTURES : []);
      r.setAll(Schemas.EveningLecture, loadDemo ? DEFAULT_EVENING_LECTURES : []);
      r.setAll(Schemas.MorningExam, loadDemo ? DEFAULT_MORNING_EXAMS : []);
      r.setAll(Schemas.EveningExam, loadDemo ? DEFAULT_EVENING_EXAMS : []);
      r.setAll(Schemas.MorningAssignment, loadDemo ? DEFAULT_MORNING_ASSIGNMENTS : []);
      r.setAll(Schemas.EveningAssignment, loadDemo ? DEFAULT_EVENING_ASSIGNMENTS : []);
      r.setAll(Schemas.MorningAlert, loadDemo ? [{ id: 'alert_morning', active: true, text: 'تنويه: تم نقل المحاضرة العملية للأسبوع القادم إلى مختبر الحاسوب المتقدم 3.', type: 'warning', updatedAt: new Date().toISOString() }] : []);
      r.setAll(Schemas.EveningAlert, []);
      r.setAll(Schemas.StudentDone, []);
    });

    localStorage.removeItem('uni.session.rep');
    sessionStorage.removeItem('uni.session.admin');
    sessionStorage.removeItem('uni.session.rep.temp');
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'all' } }));
    return true;
  },

  async exportAll() {
    const payload = {
      meta: {
        engine: 'RealmDB',
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      },
      settings: await this.getSettings(),
      reps: await this.getReps(),
      morning: await this.getShiftData('morning'),
      evening: await this.getShiftData('evening')
    };
    return JSON.stringify(payload, null, 2);
  },

  async importAll(jsonString) {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!data || !data.morning || !data.evening) {
      throw new Error('صيغة ملف النسخة الاحتياطية غير صالحة');
    }

    localRealm.write(r => {
      if (data.settings) r.setAll(Schemas.Settings, [data.settings]);
      if (data.reps) r.setAll(Schemas.Representative, data.reps);
      if (data.morning.lectures) r.setAll(Schemas.MorningLecture, data.morning.lectures);
      if (data.morning.exams) r.setAll(Schemas.MorningExam, data.morning.exams);
      if (data.morning.assignments) r.setAll(Schemas.MorningAssignment, data.morning.assignments);
      if (data.evening.lectures) r.setAll(Schemas.EveningLecture, data.evening.lectures);
      if (data.evening.exams) r.setAll(Schemas.EveningExam, data.evening.exams);
      if (data.evening.assignments) r.setAll(Schemas.EveningAssignment, data.evening.assignments);
    });

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'all' } }));
    return true;
  }
};

window.Store = Store;
