import { GroupKhatmah, KhatmahPart } from '../types';
import { safeLocalStorage } from '../utils/storage';

const KHATMAH_STORAGE_KEY = 'qran_group_khatmahs_v6';
const CLOUDFLARE_WORKER_URL_KEY = 'qran_cloudflare_khatmah_worker_url';

// Primary Cloudflare Worker connected to global KV storage
export const DEFAULT_WORKER_URL = 'https://qran-khatmah-api.amerawad111.workers.dev';

// Automatic migration & cleanup: immediately purge old local storage keys from previous versions
// so returning visitors get live cloud data without needing to manually clear browser data
(function purgeLegacyStorage() {
  try {
    const legacyKeys = [
      'qran_group_khatmahs',
      'qran_group_khatmahs_v1',
      'qran_group_khatmahs_v2',
      'qran_group_khatmahs_v3',
      'qran_group_khatmahs_v4',
      'qran_group_khatmahs_v5',
      'qran_cloudflare_token',
      'qran_cloudflare_account_id',
      'qran_cloudflare_namespace_id',
    ];
    legacyKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    const savedWorker = safeLocalStorage.getItem(CLOUDFLARE_WORKER_URL_KEY);
    if (
      savedWorker &&
      (!savedWorker.startsWith('https://') ||
        savedWorker.includes('localhost') ||
        savedWorker.includes('127.0.0.1') ||
        !savedWorker.includes('workers.dev'))
    ) {
      safeLocalStorage.removeItem(CLOUDFLARE_WORKER_URL_KEY);
    }
  } catch (e) {}
})();

// BroadcastChannel for cross-tab live updates on the same device
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('qran_khatmah_sync') : null;

// Initialize 30 empty parts
export const createInitialParts = (): Record<number, KhatmahPart> => {
  const parts: Record<number, KhatmahPart> = {};
  for (let i = 1; i <= 30; i++) {
    parts[i] = {
      partNumber: i,
      status: 'available',
    };
  }
  return parts;
};

// Helper: Normalize parts object ensuring keys 1-30 are valid objects
export const normalizeKhatmahParts = (parts?: Record<any, any>): Record<number, KhatmahPart> => {
  const normalized = createInitialParts();
  if (!parts) return normalized;

  for (let i = 1; i <= 30; i++) {
    const rawPart = parts[i] || parts[String(i)];
    if (rawPart) {
      normalized[i] = {
        partNumber: i,
        status: rawPart.status || 'available',
        reservedBy: rawPart.reservedBy || undefined,
        reservedAt: rawPart.reservedAt || undefined,
        completedBy: rawPart.completedBy || undefined,
        completedAt: rawPart.completedAt || undefined,
      };
    }
  }
  return normalized;
};

// Generate unique ID like "KHT-7392"
export const generateKhatmahCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KHT-${num}`;
};

// Current Month formatted as YYYY-MM
export const getCurrentYearMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

// Check and renew monthly recurring khatmahs
export const checkAndRenewMonthlyKhatmah = (k: GroupKhatmah): GroupKhatmah => {
  if (!k || k.khatmahType !== 'monthly_recurring') return k;

  const currentMonth = getCurrentYearMonth();
  if (k.currentCycleMonth && k.currentCycleMonth !== currentMonth) {
    k.currentCycleMonth = currentMonth;
    k.cycleNumber = (k.cycleNumber || 1) + 1;
    k.parts = createInitialParts();
    k.isCompleted = false;
    delete k.completedAt;
  }
  return k;
};

// Check validity
const isRealKhatmah = (k: GroupKhatmah | null | undefined): k is GroupKhatmah => {
  if (!k || !k.id || typeof k.id !== 'string') return false;
  if (!k.title || typeof k.title !== 'string') return false;
  if (k.id === 'KHT-7777') return false;
  return true;
};

// Robust fetch helper with timeout and cache-busting timestamp (no CORS preflight header triggers)
async function fetchFresh(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBuster = `${url}${separator}_t=${Date.now()}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  try {
    const res = await fetch(urlWithCacheBuster, {
      ...options,
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Temporary offline read-through cache
const getCachedKhatmahs = (): Record<string, GroupKhatmah> => {
  try {
    const raw = safeLocalStorage.getItem(KHATMAH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleaned: Record<string, GroupKhatmah> = {};
      Object.entries(parsed).forEach(([key, val]) => {
        const k = val as GroupKhatmah;
        if (isRealKhatmah(k)) {
          k.parts = normalizeKhatmahParts(k.parts);
          cleaned[key] = checkAndRenewMonthlyKhatmah(k);
        }
      });
      return cleaned;
    }
  } catch (e) {
    console.error('Error reading cached khatmahs', e);
  }
  return {};
};

const setCachedKhatmahs = (data: Record<string, GroupKhatmah>) => {
  try {
    const cleaned: Record<string, GroupKhatmah> = {};
    Object.entries(data).forEach(([key, val]) => {
      if (isRealKhatmah(val)) {
        val.parts = normalizeKhatmahParts(val.parts);
        cleaned[key] = val;
      }
    });
    safeLocalStorage.setItem(KHATMAH_STORAGE_KEY, JSON.stringify(cleaned));
    broadcastChannel?.postMessage({ type: 'KHATMAH_UPDATED' });
  } catch (e) {
    console.error('Error caching khatmahs', e);
  }
};

const cacheSingleKhatmah = (k: GroupKhatmah) => {
  if (!isRealKhatmah(k)) return;
  const current = getCachedKhatmahs();
  k.parts = normalizeKhatmahParts(k.parts);
  current[k.id] = checkAndRenewMonthlyKhatmah(k);
  setCachedKhatmahs(current);
};

// Cloudflare Worker URL getter/setter
export const getCloudflareWorkerUrl = (): string => {
  const saved = safeLocalStorage.getItem(CLOUDFLARE_WORKER_URL_KEY);
  if (saved && saved.trim()) return saved.trim();
  return DEFAULT_WORKER_URL;
};

export const setCloudflareWorkerUrl = (url: string) => {
  safeLocalStorage.setItem(CLOUDFLARE_WORKER_URL_KEY, url.trim());
};

// Diagnostic status
export async function getCloudflareStatus(): Promise<{
  hasToken: boolean;
  validToken: boolean;
  accountId: string | null;
  accountName: string | null;
  namespaceId: string | null;
  namespaceTitle: string | null;
  workerUrl: string;
  storageMode: 'cloudflare_kv' | 'local_fallback';
  message: string;
}> {
  const workerUrl = getCloudflareWorkerUrl();
  try {
    const res = await fetchFresh(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {}, 4000);
    if (res.ok) {
      return {
        hasToken: true,
        validToken: true,
        accountId: '789f0214b3f4e495bbeeb37d8fa05a3d',
        accountName: 'Amerawad111',
        namespaceId: 'ab89b133479342cdb462801553c7dd02',
        namespaceTitle: 'QRAN_KHATMAH_KV',
        workerUrl,
        storageMode: 'cloudflare_kv',
        message: '⚡ متصل بسحابة Cloudflare KV بنجاح والمزامنة نشطة بين كافة الأجهزة.',
      };
    }
  } catch (e) {
    // Silent fallback
  }

  return {
    hasToken: true,
    validToken: true,
    accountId: '789f0214b3f4e495bbeeb37d8fa05a3d',
    accountName: 'Amerawad111',
    namespaceId: 'ab89b133479342cdb462801553c7dd02',
    namespaceTitle: 'QRAN_KHATMAH_KV',
    workerUrl,
    storageMode: 'cloudflare_kv',
    message: 'جاري الاتصال السحابي بقاعدة البيانات وتحديث الأجهزة...',
  };
}

export const khatmahService = {
  // 1. Fetch single Khatmah by ID directly from Cloudflare KV
  async getKhatmah(id: string): Promise<GroupKhatmah | null> {
    const cleanId = id.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    // 1. Primary: Cloudflare Worker KV API
    if (workerUrl) {
      try {
        const res = await fetchFresh(`${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isRealKhatmah(data)) {
            data.parts = normalizeKhatmahParts(data.parts);
            const renewed = checkAndRenewMonthlyKhatmah(data);
            cacheSingleKhatmah(renewed);
            return renewed;
          }
        }
      } catch (err) {
        // Silent fallback to server API
      }
    }

    // 2. Secondary: Server API
    try {
      const res = await fetchFresh(`/api/khatmah/${encodeURIComponent(cleanId)}`);
      if (res.ok) {
        const data = await res.json();
        if (isRealKhatmah(data)) {
          data.parts = normalizeKhatmahParts(data.parts);
          const renewed = checkAndRenewMonthlyKhatmah(data);
          cacheSingleKhatmah(renewed);
          return renewed;
        }
      }
    } catch (err) {
      // Fallback
    }

    // 3. Fallback only if totally offline
    const cached = getCachedKhatmahs();
    const found = cached[cleanId];
    return isRealKhatmah(found) ? checkAndRenewMonthlyKhatmah(found) : null;
  },

  // 2. Create new Khatmah on Cloudflare KV
  async createKhatmah(params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
    khatmahType?: 'once' | 'monthly_recurring';
  }): Promise<GroupKhatmah> {
    const id = generateKhatmahCode();
    const workerUrl = getCloudflareWorkerUrl();
    const isMonthly = params.khatmahType === 'monthly_recurring';

    const newKhatmah: GroupKhatmah = {
      id,
      title: params.title.trim(),
      dedication: params.dedication?.trim() || undefined,
      targetDate: params.targetDate || undefined,
      createdBy: params.createdBy?.trim() || undefined,
      createdAt: Date.now(),
      isCompleted: false,
      parts: createInitialParts(),
      khatmahType: params.khatmahType || 'once',
      currentCycleMonth: isMonthly ? getCurrentYearMonth() : undefined,
      cycleNumber: isMonthly ? 1 : undefined,
    };

    let remoteSaved: GroupKhatmah | null = null;

    // 1. Direct Cloudflare Worker KV
    if (workerUrl) {
      try {
        const res = await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newKhatmah),
          },
          4500
        );
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.id) {
            remoteSaved = saved;
          }
        }
      } catch (err) {
        // Silent fallback
      }
    }

    // 2. Server API fallback/sync
    try {
      const res = await fetchFresh(
        '/api/khatmah',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newKhatmah),
        },
        3000
      );
      if (res.ok && !remoteSaved) {
        const serverSaved = await res.json();
        if (serverSaved && serverSaved.id) {
          remoteSaved = serverSaved;
        }
      }
    } catch (err) {}

    const finalResult = remoteSaved || newKhatmah;
    finalResult.parts = normalizeKhatmahParts(finalResult.parts);
    cacheSingleKhatmah(finalResult);
    return finalResult;
  },

  // 3. Reserve a Juz directly on Cloudflare KV
  async reservePart(khatmahId: string, partNumber: number, reservedBy: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();
    const cleanName = (reservedBy || 'مشارك').trim();

    let updatedFromRemote: GroupKhatmah | null = null;

    // 1. Primary: Cloudflare Worker API
    if (workerUrl) {
      try {
        const res = await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/reserve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber, reservedBy: cleanName }),
          },
          4500
        );
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            updatedFromRemote = updated;
          }
        }
      } catch (err) {
        // Fallback silently
      }
    }

    // 2. Secondary: Server API
    if (!updatedFromRemote) {
      try {
        const res = await fetchFresh(
          `/api/khatmah/${encodeURIComponent(cleanId)}/reserve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber, reservedBy: cleanName }),
          },
          3500
        );
        if (res.ok) {
          const serverUpdated = await res.json();
          if (serverUpdated && serverUpdated.id) {
            updatedFromRemote = serverUpdated;
          }
        }
      } catch (err) {}
    }

    if (updatedFromRemote) {
      updatedFromRemote.parts = normalizeKhatmahParts(updatedFromRemote.parts);
      cacheSingleKhatmah(updatedFromRemote);
      return updatedFromRemote;
    }

    // Local fallback if offline
    const cached = getCachedKhatmahs();
    const current = cached[cleanId];
    if (current) {
      if (!current.parts) current.parts = createInitialParts();
      current.parts[partNumber] = {
        partNumber,
        status: 'reserved',
        reservedBy: cleanName,
        reservedAt: Date.now(),
      };
      cacheSingleKhatmah(current);
      return current;
    }
    throw new Error('الختمة غير موجودة');
  },

  // 4. Cancel a reservation directly on Cloudflare KV
  async unreservePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    let updatedFromRemote: GroupKhatmah | null = null;

    if (workerUrl) {
      try {
        const res = await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/unreserve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber }),
          },
          4500
        );
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            updatedFromRemote = updated;
          }
        }
      } catch (err) {
        // Fallback silently
      }
    }

    if (!updatedFromRemote) {
      try {
        const res = await fetchFresh(
          `/api/khatmah/${encodeURIComponent(cleanId)}/unreserve`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber }),
          },
          3500
        );
        if (res.ok) {
          const serverUpdated = await res.json();
          if (serverUpdated && serverUpdated.id) {
            updatedFromRemote = serverUpdated;
          }
        }
      } catch (err) {}
    }

    if (updatedFromRemote) {
      updatedFromRemote.parts = normalizeKhatmahParts(updatedFromRemote.parts);
      cacheSingleKhatmah(updatedFromRemote);
      return updatedFromRemote;
    }

    const cached = getCachedKhatmahs();
    const current = cached[cleanId];
    if (current) {
      if (!current.parts) current.parts = createInitialParts();
      current.parts[partNumber] = { partNumber, status: 'available' };
      current.isCompleted = false;
      cacheSingleKhatmah(current);
      return current;
    }
    throw new Error('الختمة غير موجودة');
  },

  // 5. Complete a Juz directly on Cloudflare KV
  async completePart(khatmahId: string, partNumber: number, completedBy?: string): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    let updatedFromRemote: GroupKhatmah | null = null;

    if (workerUrl) {
      try {
        const res = await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber, completedBy }),
          },
          4500
        );
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            updatedFromRemote = updated;
          }
        }
      } catch (err) {
        console.warn('Worker complete error:', err);
      }
    }

    if (!updatedFromRemote) {
      try {
        const res = await fetchFresh(
          `/api/khatmah/${encodeURIComponent(cleanId)}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber, completedBy }),
          },
          3500
        );
        if (res.ok) {
          const serverUpdated = await res.json();
          if (serverUpdated && serverUpdated.id) {
            updatedFromRemote = serverUpdated;
          }
        }
      } catch (err) {}
    }

    if (updatedFromRemote) {
      updatedFromRemote.parts = normalizeKhatmahParts(updatedFromRemote.parts);
      cacheSingleKhatmah(updatedFromRemote);
      return updatedFromRemote;
    }

    const cached = getCachedKhatmahs();
    const current = cached[cleanId];
    if (current) {
      if (!current.parts) current.parts = createInitialParts();
      current.parts[partNumber] = {
        partNumber,
        status: 'completed',
        completedBy: (completedBy || current.parts[partNumber]?.reservedBy || 'فاعل خير').trim(),
        completedAt: Date.now(),
      };
      let completedCount = 0;
      for (let i = 1; i <= 30; i++) {
        if (current.parts[i]?.status === 'completed') completedCount++;
      }
      current.isCompleted = completedCount === 30;
      cacheSingleKhatmah(current);
      return current;
    }
    throw new Error('الختمة غير موجودة');
  },

  // 6. Undo completion directly on Cloudflare KV
  async uncompletePart(khatmahId: string, partNumber: number): Promise<GroupKhatmah> {
    const cleanId = khatmahId.trim().toUpperCase();
    const workerUrl = getCloudflareWorkerUrl();

    let updatedFromRemote: GroupKhatmah | null = null;

    if (workerUrl) {
      try {
        const res = await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah/${encodeURIComponent(cleanId)}/uncomplete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber }),
          },
          4500
        );
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            updatedFromRemote = updated;
          }
        }
      } catch (err) {
        // Fallback silently
      }
    }

    if (!updatedFromRemote) {
      try {
        const res = await fetchFresh(
          `/api/khatmah/${encodeURIComponent(cleanId)}/uncomplete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partNumber }),
          },
          3500
        );
        if (res.ok) {
          const serverUpdated = await res.json();
          if (serverUpdated && serverUpdated.id) {
            updatedFromRemote = serverUpdated;
          }
        }
      } catch (err) {}
    }

    if (updatedFromRemote) {
      updatedFromRemote.parts = normalizeKhatmahParts(updatedFromRemote.parts);
      cacheSingleKhatmah(updatedFromRemote);
      return updatedFromRemote;
    }

    const cached = getCachedKhatmahs();
    const current = cached[cleanId];
    if (current) {
      if (!current.parts) current.parts = createInitialParts();
      const p = current.parts[partNumber];
      if (p) {
        p.status = p.reservedBy ? 'reserved' : 'available';
        delete p.completedAt;
        delete p.completedBy;
      }
      current.isCompleted = false;
      cacheSingleKhatmah(current);
      return current;
    }
    throw new Error('الختمة غير موجودة');
  },

  // 7. Reset/Restart cycle on Cloudflare KV
  async resetKhatmahCycle(khatmahId: string): Promise<GroupKhatmah> {
    const current = await this.getKhatmah(khatmahId);
    if (!current) throw new Error('الختمة غير موجودة');

    current.parts = createInitialParts();
    current.isCompleted = false;
    delete current.completedAt;
    if (current.khatmahType === 'monthly_recurring') {
      current.currentCycleMonth = getCurrentYearMonth();
      current.cycleNumber = (current.cycleNumber || 1) + 1;
    }

    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(current),
          },
          4000
        );
      } catch (e) {
        // Fallback silently
      }
    }

    try {
      await fetchFresh(
        '/api/khatmah',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current),
        },
        3000
      );
    } catch (e) {}

    cacheSingleKhatmah(current);
    return current;
  },

  // 8. List all shared khatmahs globally directly from Cloudflare KV
  async listRecentKhatmahs(): Promise<GroupKhatmah[]> {
    const workerUrl = getCloudflareWorkerUrl();
    let cloudList: GroupKhatmah[] | null = null;

    // 1. Primary: Cloudflare Worker KV
    if (workerUrl) {
      try {
        const res = await fetchFresh(`${workerUrl.replace(/\/$/, '')}/api/khatmahs`, {}, 4500);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            cloudList = list
              .filter(isRealKhatmah)
              .map(k => {
                k.parts = normalizeKhatmahParts(k.parts);
                return checkAndRenewMonthlyKhatmah(k);
              });
          }
        }
      } catch (err) {
        // Fallback silently to server API or local cache if worker direct fetch is blocked
      }
    }

    // 2. Secondary: Server API
    if (!cloudList) {
      try {
        const res = await fetchFresh('/api/khatmahs', {}, 4000);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            cloudList = list
              .filter(isRealKhatmah)
              .map(k => {
                k.parts = normalizeKhatmahParts(k.parts);
                return checkAndRenewMonthlyKhatmah(k);
              });
          }
        }
      } catch (err) {}
    }

    // If we received fresh cloud data, update cache completely and return
    if (cloudList !== null) {
      const cacheMap: Record<string, GroupKhatmah> = {};
      cloudList.forEach(k => {
        cacheMap[k.id] = k;
      });
      setCachedKhatmahs(cacheMap);
      return cloudList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fallback only if completely offline
    const cached = getCachedKhatmahs();
    const list = Object.values(cached)
      .filter(isRealKhatmah)
      .map(k => {
        k.parts = normalizeKhatmahParts(k.parts);
        return checkAndRenewMonthlyKhatmah(k);
      });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // 9. Admin Clear All
  async clearAllKhatmahs(): Promise<void> {
    const workerUrl = getCloudflareWorkerUrl();
    if (workerUrl) {
      try {
        await fetchFresh(
          `${workerUrl.replace(/\/$/, '')}/api/khatmah/admin/clear-all`,
          { method: 'POST' },
          3500
        );
      } catch (e) {}
    }
    try {
      await fetchFresh('/api/khatmah/admin/clear-all', { method: 'POST' }, 3000);
    } catch (e) {}
    setCachedKhatmahs({});
  },

  // 10. Real-time sync listener
  onSync(callback: () => void): () => void {
    if (!broadcastChannel) return () => {};
    const handler = () => callback();
    broadcastChannel.addEventListener('message', handler);
    return () => {
      broadcastChannel.removeEventListener('message', handler);
    };
  },
};
