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
// Appwrite document IDs live in `$id` and the collections have no `id` attribute.
// Keep a single local identifier (`id`) but strip it before every cloud write.
function toCloudPayload(data) {
  const payload = {};
  if (!data || typeof data !== 'object') return payload;
  Object.keys(data).forEach((key) => {
    if (key === 'id' || key.startsWith('$')) return;
    if (data[key] === undefined) return;
    payload[key] = data[key];
  });
  return payload;
}

function normalizeCloudDocument(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const normalized = {};
  Object.keys(doc).forEach((key) => {
    if (key.startsWith('$')) return;
    normalized[key] = doc[key];
  });
  normalized.id = doc.id || doc.$id;
  return normalized;
}

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
      return (res.documents || []).map(normalizeCloudDocument);
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
      const created = await window.appwriteDatabases.createDocument(
        window.AppwriteConfig.databaseId,
        colId,
        actualId,
        toCloudPayload(data)
      );
      return normalizeCloudDocument(created);
    } catch (e) {
      console.warn(`[Appwrite] createDocument error on ${collectionName}:`, e.message);
      throw e;
    }
  },

  async updateDocument(collectionName, docId, data) {
    if (!this.isAvailable()) return null;
    try {
      const colId = window.AppwriteConfig.collections[collectionName] || collectionName;
      const updated = await window.appwriteDatabases.updateDocument(
        window.AppwriteConfig.databaseId,
        colId,
        docId,
        toCloudPayload(data)
      );
      return normalizeCloudDocument(updated);
    } catch (e) {
      console.warn(`[Appwrite] updateDocument error on ${collectionName}:`, e.message);
      throw e;
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
      throw e;
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

// Demo IDs must never be uploaded to the cloud automatically.
const DEMO_CONTENT_IDS = new Set([
  ...DEFAULT_REPS,
  ...DEFAULT_MORNING_LECTURES,
  ...DEFAULT_EVENING_LECTURES,
  ...DEFAULT_MORNING_EXAMS,
  ...DEFAULT_EVENING_EXAMS,
  ...DEFAULT_MORNING_ASSIGNMENTS,
  ...DEFAULT_EVENING_ASSIGNMENTS
].map((item) => item.id).concat(['alert_morning']));

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
    await this.bootstrapLocalContentToCloud();
    this.initAppwriteSync();
  },

  _emitCloudError(action, error, extra = {}) {
    const message = error && error.message ? error.message : String(error);
    console.warn(`[Appwrite] ${action} sync failed:`, message);
    window.dispatchEvent(new CustomEvent('cloud-sync-error', {
      detail: { action, message, ...extra }
    }));
  },

  _isValidDocId(id) {
    return typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/.test(id);
  },

  _getLocalShiftContent(shift) {
    const alertSchema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
    return {
      lectures: localRealm.objects(this._getSchemaName(shift, 'lectures')).all(),
      exams: localRealm.objects(this._getSchemaName(shift, 'exams')).all(),
      assignments: localRealm.objects(this._getSchemaName(shift, 'assignments')).all(),
      alert: localRealm.objects(alertSchema).all()[0] || null
    };
  },

  _getAllLocalContent() {
    const collect = (schema, shift) => localRealm.objects(schema).all().map((item) => ({ ...item, shift }));
    return {
      lectures: [
        ...collect(Schemas.MorningLecture, 'morning'),
        ...collect(Schemas.EveningLecture, 'evening')
      ],
      exams: [
        ...collect(Schemas.MorningExam, 'morning'),
        ...collect(Schemas.EveningExam, 'evening')
      ],
      assignments: [
        ...collect(Schemas.MorningAssignment, 'morning'),
        ...collect(Schemas.EveningAssignment, 'evening')
      ],
      alerts: [
        ...collect(Schemas.MorningAlert, 'morning'),
        ...collect(Schemas.EveningAlert, 'evening')
      ]
    };
  },

  _hasCustomLocalContent() {
    const local = this._getAllLocalContent();
    return Object.values(local).some((rows) => rows.some((row) => row.id && !DEMO_CONTENT_IDS.has(row.id)));
  },

  // One-time upload of legacy local custom data (demo fixtures are skipped).
  async bootstrapLocalContentToCloud() {
    if (!AppwriteSync.isAvailable()) return 0;
    const bootstrapKey = 'uni.cloud.bootstrap.v1';
    if (localStorage.getItem(bootstrapKey)) return 0;
    if (!this._hasCustomLocalContent()) {
      localStorage.setItem(bootstrapKey, new Date().toISOString());
      return 0;
    }

    const local = this._getAllLocalContent();
    let uploaded = 0;
    let completed = true;

    for (const collectionName of ['lectures', 'exams', 'assignments', 'alerts']) {
      const cloudDocs = await AppwriteSync.listDocuments(collectionName);
      if (cloudDocs === null) {
        completed = false;
        continue;
      }

      for (const shift of ['morning', 'evening']) {
        const cloudShiftDocs = cloudDocs.filter((doc) => doc.shift === shift);
        if (cloudShiftDocs.length > 0) continue;

        const rows = local[collectionName].filter(
          (row) => row.shift === shift && row.id && !DEMO_CONTENT_IDS.has(row.id)
        );

        for (const row of rows) {
          try {
            await AppwriteSync.createDocument(
              collectionName,
              this._isValidDocId(row.id) ? row.id : undefined,
              row
            );
            uploaded += 1;
          } catch (err) {
            if (err && err.code === 409) continue;
            completed = false;
            this._emitCloudError('bootstrap', err, { collection: collectionName, shift });
          }
        }
      }
    }

    if (uploaded > 0) {
      console.log(`[Appwrite] Bootstrap uploaded ${uploaded} local document(s) to the cloud.`);
      window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'cloud-bootstrap' } }));
    }

    // Only mark the one-time bootstrap as done after a fully successful pass,
    // so a temporary network failure can retry on the next load.
    if (completed) {
      localStorage.setItem(bootstrapKey, new Date().toISOString());
    }
    return uploaded;
  },

  // Manual full push (used by backup restore). `replace` mirrors local data exactly.
  async pushLocalContentToCloud({ replace = false, silent = false } = {}) {
    if (!AppwriteSync.isAvailable()) {
      return { ok: false, uploaded: 0, deleted: 0, errors: ['unavailable'] };
    }

    const local = this._getAllLocalContent();
    const report = { ok: true, uploaded: 0, deleted: 0, errors: [] };

    for (const collectionName of ['lectures', 'exams', 'assignments', 'alerts']) {
      let cloudDocs = await AppwriteSync.listDocuments(collectionName);
      if (cloudDocs === null) {
        report.ok = false;
        report.errors.push(`تعذر قراءة ${collectionName} من السحابة`);
        continue;
      }

      if (replace) {
        for (const doc of cloudDocs) {
          try {
            await AppwriteSync.deleteDocument(collectionName, doc.id);
            report.deleted += 1;
          } catch (err) {
            if (err && err.code === 404) continue;
            report.ok = false;
            report.errors.push(`${collectionName}: ${err.message}`);
            this._emitCloudError('push-replace', err, { collection: collectionName });
          }
        }
        cloudDocs = [];
      }

      if (cloudDocs.length > 0) continue;

      for (const row of local[collectionName]) {
        if (!replace && (!row.id || DEMO_CONTENT_IDS.has(row.id))) continue;
        try {
          await AppwriteSync.createDocument(
            collectionName,
            this._isValidDocId(row.id) ? row.id : undefined,
            row
          );
          report.uploaded += 1;
        } catch (err) {
          if (err && err.code === 409) continue;
          report.ok = false;
          report.errors.push(`${collectionName}: ${err.message}`);
          this._emitCloudError('push', err, { collection: collectionName });
        }
      }
    }

    if (!silent && (report.uploaded > 0 || report.deleted > 0)) {
      window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'cloud-push' } }));
    }
    return report;
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
      const [cloudLectures, cloudExams, cloudAssignments, cloudAlerts] = await Promise.all([
        AppwriteSync.listDocuments('lectures'),
        AppwriteSync.listDocuments('exams'),
        AppwriteSync.listDocuments('assignments'),
        AppwriteSync.listDocuments('alerts')
      ]);

      const applyPerShift = (docs, collectionName) => {
        if (!docs) return;
        ['morning', 'evening'].forEach((shift) => {
          const rows = docs.filter((doc) => doc.shift === shift);
          const schema = this._getSchemaName(shift, collectionName);
          localRealm.write((r) => r.setAll(schema, rows));
        });
      };

      applyPerShift(cloudLectures, 'lectures');
      applyPerShift(cloudExams, 'exams');
      applyPerShift(cloudAssignments, 'assignments');

      if (cloudAlerts && cloudAlerts.length > 0) {
        ['morning', 'evening'].forEach((shift) => {
          const item = cloudAlerts.find((alert) => alert.shift === shift);
          if (!item) return;
          const schema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
          localRealm.write((r) => r.setAll(schema, [item]));
        });
      }

      window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'appwrite-synced' } }));
    } catch (err) {
      console.warn('Background sync error (normal if collections are fresh):', err.message);
    }
  },

  async getSettings() {
    if (AppwriteSync.isAvailable()) {
      try {
        const cloudDocs = await AppwriteSync.listDocuments('settings');
        if (cloudDocs && cloudDocs.length > 0) {
          const doc = cloudDocs[0];
          const parsed = typeof doc.data === 'string' ? JSON.parse(doc.data) : (doc.data || {});
          const merged = { ...DEFAULT_SETTINGS, ...parsed };
          localRealm.write(r => r.setAll(Schemas.Settings, [merged]));
          return merged;
        }
      } catch (e) {
        console.warn('Appwrite settings fetch fallback:', e.message);
      }
    }
    const list = localRealm.objects(Schemas.Settings).all();
    return list[0] ? list[0] : { ...DEFAULT_SETTINGS };
  },

  async saveSettings(patch) {
    const current = await this.getSettings();
    const updated = { ...current, ...patch };
    localRealm.write(r => {
      r.setAll(Schemas.Settings, [updated]);
    });

    await this._pushSettingsData(updated);
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'settings' } }));
    return updated;
  },

  async _pushSettingsData(settings) {
    if (!AppwriteSync.isAvailable()) return false;
    const payload = { data: JSON.stringify(settings) };
    try {
      try {
        await AppwriteSync.updateDocument('settings', 'app_settings', payload);
      } catch (err) {
        if (err && err.code === 404) {
          await AppwriteSync.createDocument('settings', 'app_settings', payload);
        } else {
          throw err;
        }
      }
      return true;
    } catch (err) {
      this._emitCloudError('saveSettings', err);
      return false;
    }
  },

  async getReps() {
    if (AppwriteSync.isAvailable()) {
      try {
        const cloudDocs = await AppwriteSync.listDocuments('representatives');
        if (cloudDocs !== null && cloudDocs.length > 0) {
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
      try {
        await AppwriteSync.createDocument(
          'representatives',
          this._isValidDocId(created.id) ? created.id : undefined,
          cloudPayload
        );
      } catch (err) {
        if (!err || err.code !== 409) this._emitCloudError('addRep', err);
      }
    }

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));
    return created;
  },

  async updateRep(id, patch) {
    let updated;
    localRealm.write(r => {
      updated = r.update(Schemas.Representative, id, patch);
    });

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      const cloudPatch = { ...patch };
      if (cloudPatch.shifts && Array.isArray(cloudPatch.shifts)) {
        cloudPatch.shifts = JSON.stringify(cloudPatch.shifts);
      }
      try {
        await AppwriteSync.updateDocument('representatives', id, cloudPatch);
      } catch (err) {
        if (err && err.code === 404 && this._isValidDocId(id)) {
          try {
            await AppwriteSync.createDocument('representatives', id, {
              ...updated,
              shifts: JSON.stringify(updated.shifts || ['morning']),
              lastLoginAt: updated.lastLoginAt || ''
            });
          } catch (createErr) {
            this._emitCloudError('updateRep', createErr);
          }
        } else {
          this._emitCloudError('updateRep', err);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));
    return updated;
  },

  async deleteRep(id) {
    localRealm.write(r => {
      r.delete(Schemas.Representative, id);
    });

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      try {
        await AppwriteSync.deleteDocument('representatives', id);
      } catch (err) {
        if (!err || err.code !== 404) this._emitCloudError('deleteRep', err);
      }
    }

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'reps' } }));
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

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      try {
        const cloudDocs = await AppwriteSync.listDocuments('alerts');
        const existing = (cloudDocs || []).find((doc) => doc.shift === shift);
        const cloudData = {
          shift,
          active: payload.active,
          text: payload.text,
          type: payload.type,
          updatedAt: payload.updatedAt
        };
        if (existing) {
          await AppwriteSync.updateDocument('alerts', existing.id, cloudData);
        } else {
          await AppwriteSync.createDocument('alerts', this._isValidDocId(payload.id) ? payload.id : undefined, cloudData);
        }
      } catch (err) {
        this._emitCloudError('saveUrgentAlert', err, { shift });
      }
    }

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection: 'alert' } }));
    return payload;
  },

  async getShiftData(shift = 'morning') {
    const local = this._getLocalShiftContent(shift);
    const isCustom = (row) => !!row && !!row.id && !DEMO_CONTENT_IDS.has(row.id);

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
          const lectures = cloudLec.filter((item) => item.shift === shift);
          const exams = cloudExm.filter((item) => item.shift === shift);
          const assignments = cloudAsg.filter((item) => item.shift === shift);

          // The cloud is authoritative once reachable: bootstrap has already uploaded
          // any legacy local data before the first render, so mirroring empty results
          // is safe and prevents deleted items from resurrecting from the local cache.
          const lecSchema = this._getSchemaName(shift, 'lectures');
          const exmSchema = this._getSchemaName(shift, 'exams');
          const asgSchema = this._getSchemaName(shift, 'assignments');
          const alertSchema = shift === 'morning' ? Schemas.MorningAlert : Schemas.EveningAlert;
          localRealm.write(r => {
            r.setAll(lecSchema, lectures);
            r.setAll(exmSchema, exams);
            r.setAll(asgSchema, assignments);
          });

          const alertItem = (cloudAlerts || []).find((item) => item.shift === shift);
          let urgentAlert;
          if (alertItem) {
            urgentAlert = {
              active: !!alertItem.active,
              text: alertItem.text || '',
              type: alertItem.type || 'urgent',
              updatedAt: alertItem.updatedAt || null
            };
            localRealm.write(r => r.setAll(alertSchema, [alertItem]));
          } else if (isCustom(local.alert)) {
            urgentAlert = {
              active: !!local.alert.active,
              text: local.alert.text || '',
              type: local.alert.type || 'urgent',
              updatedAt: local.alert.updatedAt || null
            };
          } else {
            urgentAlert = { active: false, text: '', type: 'urgent', updatedAt: null };
          }

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
    const alert = await this.getUrgentAlert(shift);

    return {
      lectures: local.lectures,
      exams: local.exams,
      assignments: local.assignments,
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

    // Sync to Appwrite Cloud (awaited so the UI re-render sees the cloud state)
    if (AppwriteSync.isAvailable()) {
      try {
        await AppwriteSync.createDocument(
          collection,
          this._isValidDocId(created.id) ? created.id : undefined,
          created
        );
      } catch (err) {
        if (err && err.code === 409) {
          try {
            await AppwriteSync.updateDocument(collection, created.id, created);
          } catch (updateErr) {
            this._emitCloudError('addItem', updateErr, { shift, collection });
          }
        } else {
          this._emitCloudError('addItem', err, { shift, collection });
        }
      }
    }

    // Redraw only after the cloud write settles, to avoid a stale fetch overwriting local data.
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));
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

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      try {
        await AppwriteSync.updateDocument(collection, id, sanitizedPatch);
      } catch (err) {
        // Legacy local-only items may not exist in the cloud yet.
        if (err && err.code === 404 && this._isValidDocId(id) && updated) {
          try {
            await AppwriteSync.createDocument(collection, id, updated);
          } catch (createErr) {
            this._emitCloudError('updateItem', createErr, { shift, collection });
          }
        } else {
          this._emitCloudError('updateItem', err, { shift, collection });
        }
      }
    }

    // Redraw only after the cloud write settles.
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));
    return updated;
  },

  async deleteItem(shift, collection, id) {
    const schema = this._getSchemaName(shift, collection);
    localRealm.write(r => {
      r.delete(schema, id);
    });

    // Sync to Appwrite Cloud
    if (AppwriteSync.isAvailable()) {
      try {
        await AppwriteSync.deleteDocument(collection, id);
      } catch (err) {
        if (!err || err.code !== 404) this._emitCloudError('deleteItem', err, { shift, collection });
      }
    }

    // Redraw only after the cloud delete settles; otherwise a stale fetch can restore the item.
    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { shift, collection } }));
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

  async resetFactory(loadDemo = true, syncCloud = false) {
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

    // Cloud content must be cleared too, otherwise the next fetch restores removed data.
    if (syncCloud && AppwriteSync.isAvailable()) {
      for (const collectionName of ['lectures', 'exams', 'assignments', 'alerts']) {
        const cloudDocs = await AppwriteSync.listDocuments(collectionName);
        if (!cloudDocs) continue;
        for (const doc of cloudDocs) {
          try {
            await AppwriteSync.deleteDocument(collectionName, doc.id);
          } catch (err) {
            if (!err || err.code !== 404) {
              this._emitCloudError('resetFactory', err, { collection: collectionName });
            }
          }
        }
      }
      await this._pushSettingsData(DEFAULT_SETTINGS);
    }

    // Redraw after the cloud clearing settles.
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

  async _replaceCloudReps(reps) {
    if (!AppwriteSync.isAvailable()) return false;
    const cloudDocs = await AppwriteSync.listDocuments('representatives');
    if (cloudDocs === null) return false;

    const incoming = Array.isArray(reps) ? reps : [];
    const incomingIds = new Set(incoming.map((rep) => rep.id).filter((id) => this._isValidDocId(id)));

    for (const doc of cloudDocs) {
      if (incomingIds.has(doc.id)) continue;
      try {
        await AppwriteSync.deleteDocument('representatives', doc.id);
      } catch (err) {
        if (!err || err.code !== 404) this._emitCloudError('importReps', err, { id: doc.id });
      }
    }

    for (const rep of incoming) {
      const payload = {
        name: rep.name || '',
        code: rep.code || '',
        shifts: JSON.stringify(Array.isArray(rep.shifts) ? rep.shifts : ['morning']),
        active: rep.active !== false,
        createdAt: rep.createdAt || new Date().toISOString(),
        lastLoginAt: rep.lastLoginAt || ''
      };
      try {
        if (cloudDocs.some((doc) => doc.id === rep.id)) {
          await AppwriteSync.updateDocument('representatives', rep.id, payload);
        } else {
          await AppwriteSync.createDocument(
            'representatives',
            this._isValidDocId(rep.id) ? rep.id : undefined,
            payload
          );
        }
      } catch (err) {
        if (!err || err.code !== 409) this._emitCloudError('importReps', err, { id: rep.id });
      }
    }
    return true;
  },

  async importAll(jsonString, syncCloud = false) {
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

    if (syncCloud && AppwriteSync.isAvailable()) {
      const report = await this.pushLocalContentToCloud({ replace: true, silent: true });
      if (data.settings) {
        await this._pushSettingsData({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      if (data.reps) {
        await this._replaceCloudReps(data.reps);
      }
      // Redraw once everything is mirrored to the cloud.
      window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'all' } }));
      return report;
    }

    window.dispatchEvent(new CustomEvent('uni-data-changed', { detail: { key: 'all' } }));
    return { ok: true, uploaded: 0, deleted: 0, errors: [] };
  }
};

window.Store = Store;
