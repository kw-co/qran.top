import { GroupKhatmah, KhatmahPart } from '../types';
import {
  checkAndInitCloudflare,
  getKvValue,
  putKvValue,
  clearAllKvKhatmahs,
} from './cloudflareService';

const DEFAULT_WORKER_URL = 'https://qran-khatmah-api.amerawad111.workers.dev';

// In-memory cache for ultra-fast response
const memoryKhatmahs = new Map<string, GroupKhatmah>();
let isInitialized = false;

function generateKhatmahId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'KHT-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function initializeEmptyParts(): Record<number, KhatmahPart> {
  const parts: Record<number, KhatmahPart> = {};
  for (let i = 1; i <= 30; i++) {
    parts[i] = {
      partNumber: i,
      status: 'available',
    };
  }
  return parts;
}

export function normalizeParts(parts?: Record<any, any>): Record<number, KhatmahPart> {
  const normalized = initializeEmptyParts();
  if (!parts) return normalized;
  for (let i = 1; i <= 30; i++) {
    const raw = parts[i] || parts[String(i)];
    if (raw) {
      normalized[i] = {
        partNumber: i,
        status: raw.status || 'available',
        reservedBy: raw.reservedBy || undefined,
        reservedAt: raw.reservedAt || undefined,
        completedBy: raw.completedBy || undefined,
        completedAt: raw.completedAt || undefined,
      };
    }
  }
  return normalized;
}

function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function checkAndRenewMonthlyKhatmah(k: GroupKhatmah): GroupKhatmah {
  if (!k || k.khatmahType !== 'monthly_recurring') return k;

  const currentMonth = getCurrentYearMonth();
  if (k.currentCycleMonth && k.currentCycleMonth !== currentMonth) {
    k.currentCycleMonth = currentMonth;
    k.cycleNumber = (k.cycleNumber || 1) + 1;
    k.parts = initializeEmptyParts();
    k.isCompleted = false;
    delete k.completedAt;
  }
  return k;
}

function isRealKhatmah(k: GroupKhatmah | null | undefined): k is GroupKhatmah {
  if (!k || !k.id) return false;
  if (!k.title || typeof k.title !== 'string') return false;
  // Exclude old dummy test IDs if any
  if (k.id === 'KHT-7777') return false;
  return true;
}

export async function clearAllBackendKhatmahs(): Promise<void> {
  memoryKhatmahs.clear();
  try {
    await clearAllKvKhatmahs();
  } catch (err) {
    console.error('Error clearing KV:', err);
  }
  try {
    await fetch(`${DEFAULT_WORKER_URL}/api/khatmah/admin/clear-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Ignore
  }
}

// Background sync from Cloudflare Worker to Memory
async function syncFromCloudflareWorker(): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${DEFAULT_WORKER_URL}/api/khatmahs?_t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        for (const item of list) {
          if (isRealKhatmah(item)) {
            item.parts = normalizeParts(item.parts);
            const renewed = checkAndRenewMonthlyKhatmah(item);
            memoryKhatmahs.set(renewed.id, renewed);
          }
        }
      }
    }
  } catch (err) {
    // Fallback quietly
  }
}

export async function initBackendStorage() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const status = await checkAndInitCloudflare();
    console.log('📦 Khatmah Backend initialized. Status:', status.message);

    if (status.storageMode === 'cloudflare_kv') {
      // Load initial index from KV
      const indexRaw = await getKvValue('khatmahs_index');
      if (indexRaw) {
        try {
          const items: any[] = JSON.parse(indexRaw);
          for (const item of items) {
            if (typeof item === 'object' && item && item.id && isRealKhatmah(item)) {
              item.parts = normalizeParts(item.parts);
              memoryKhatmahs.set(item.id, checkAndRenewMonthlyKhatmah(item));
            } else if (typeof item === 'string') {
              const id = item.toUpperCase();
              if (id === 'KHT-7777') continue;
              const dataRaw = (await getKvValue(`khatmah:${id}`)) || (await getKvValue(`khatmah_${id}`));
              if (dataRaw) {
                const k: GroupKhatmah = JSON.parse(dataRaw);
                if (isRealKhatmah(k)) {
                  k.parts = normalizeParts(k.parts);
                  memoryKhatmahs.set(k.id, checkAndRenewMonthlyKhatmah(k));
                }
              }
            }
          }
          console.log(`✅ Loaded ${memoryKhatmahs.size} active khatmahs from Cloudflare KV.`);
        } catch (e) {
          console.error('Error parsing index from KV', e);
        }
      }
    }

    // Also sync from Worker endpoint directly to ensure zero data loss
    await syncFromCloudflareWorker();
  } catch (err) {
    console.error('Error initializing backend storage:', err);
  }
}

async function saveKhatmah(khatmah: GroupKhatmah): Promise<void> {
  if (!isRealKhatmah(khatmah)) return;
  khatmah.parts = normalizeParts(khatmah.parts);
  memoryKhatmahs.set(khatmah.id, khatmah);

  // 1. Direct Cloudflare KV sync if direct token is present
  try {
    const status = await checkAndInitCloudflare();
    if (status.storageMode === 'cloudflare_kv') {
      const json = JSON.stringify(khatmah);
      await putKvValue(`khatmah:${khatmah.id}`, json);
      await putKvValue(`khatmah_${khatmah.id}`, json);

      const allList = Array.from(memoryKhatmahs.values()).filter(isRealKhatmah);
      await putKvValue('khatmahs_index', JSON.stringify(allList));
    }
  } catch (err) {
    console.error('Failed to sync to Cloudflare KV:', err);
  }

  // 2. Cloudflare Worker API sync (for global real-time synchronization across all devices)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    await fetch(`${DEFAULT_WORKER_URL}/api/khatmah`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(khatmah),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (err) {
    // Non-fatal
  }
}

export async function getAllKhatmahs(): Promise<GroupKhatmah[]> {
  await initBackendStorage();
  // Fast background re-sync
  syncFromCloudflareWorker().catch(() => {});

  const list = Array.from(memoryKhatmahs.values())
    .filter(isRealKhatmah)
    .map(k => {
      k.parts = normalizeParts(k.parts);
      return checkAndRenewMonthlyKhatmah(k);
    });
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getKhatmahById(id: string): Promise<GroupKhatmah | null> {
  await initBackendStorage();
  const normalizedId = id.toUpperCase();
  if (normalizedId === 'KHT-7777') return null;

  if (memoryKhatmahs.has(normalizedId)) {
    const k = memoryKhatmahs.get(normalizedId)!;
    k.parts = normalizeParts(k.parts);
    return checkAndRenewMonthlyKhatmah(k);
  }

  // Try fetching directly from Cloudflare KV if not in memory
  try {
    const raw = (await getKvValue(`khatmah:${normalizedId}`)) || (await getKvValue(`khatmah_${normalizedId}`));
    if (raw) {
      const parsed: GroupKhatmah = JSON.parse(raw);
      if (isRealKhatmah(parsed)) {
        parsed.parts = normalizeParts(parsed.parts);
        const renewed = checkAndRenewMonthlyKhatmah(parsed);
        memoryKhatmahs.set(renewed.id, renewed);
        return renewed;
      }
    }
  } catch (e) {
    console.error('Error checking KV for khatmah:', id, e);
  }

  // Try fetching from Worker
  try {
    const res = await fetch(`${DEFAULT_WORKER_URL}/api/khatmah/${encodeURIComponent(normalizedId)}?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (isRealKhatmah(data)) {
        data.parts = normalizeParts(data.parts);
        const renewed = checkAndRenewMonthlyKhatmah(data);
        memoryKhatmahs.set(renewed.id, renewed);
        return renewed;
      }
    }
  } catch (e) {}

  return null;
}

export async function createNewKhatmah(params: {
  title: string;
  dedication?: string;
  targetDate?: string;
  createdBy?: string;
  khatmahType?: 'once' | 'monthly_recurring';
}): Promise<GroupKhatmah> {
  await initBackendStorage();

  let id = generateKhatmahId();
  while (memoryKhatmahs.has(id)) {
    id = generateKhatmahId();
  }

  const isMonthly = params.khatmahType === 'monthly_recurring';

  const newKhatmah: GroupKhatmah = {
    id,
    title: params.title.trim(),
    dedication: params.dedication || '',
    targetDate: params.targetDate || '',
    createdBy: params.createdBy || 'فاعل خير',
    createdAt: Date.now(),
    parts: initializeEmptyParts(),
    isCompleted: false,
    khatmahType: params.khatmahType || 'once',
    currentCycleMonth: isMonthly ? getCurrentYearMonth() : undefined,
    cycleNumber: isMonthly ? 1 : undefined,
  };

  await saveKhatmah(newKhatmah);
  return newKhatmah;
}

export async function reserveKhatmahPart(
  khatmahId: string,
  partNumber: number,
  reservedBy: string
): Promise<GroupKhatmah> {
  let khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (partNumber < 1 || partNumber > 30) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }

  khatmah.parts = normalizeParts(khatmah.parts);

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'reserved';
  part.reservedBy = reservedBy.trim() || 'فاعل خير';
  part.reservedAt = Date.now();
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

export async function unreserveKhatmahPart(
  khatmahId: string,
  partNumber: number
): Promise<GroupKhatmah> {
  let khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (partNumber < 1 || partNumber > 30) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }

  khatmah.parts = normalizeParts(khatmah.parts);

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'available';
  delete part.reservedBy;
  delete part.reservedAt;
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

export async function completeKhatmahPart(
  khatmahId: string,
  partNumber: number,
  completedBy?: string
): Promise<GroupKhatmah> {
  let khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (partNumber < 1 || partNumber > 30) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }

  khatmah.parts = normalizeParts(khatmah.parts);

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  part.status = 'completed';
  part.completedBy = completedBy || part.reservedBy || 'فاعل خير';
  part.completedAt = Date.now();
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

export async function uncompleteKhatmahPart(
  khatmahId: string,
  partNumber: number
): Promise<GroupKhatmah> {
  let khatmah = await getKhatmahById(khatmahId);
  if (!khatmah) {
    throw new Error('الختمة غير موجودة');
  }

  if (partNumber < 1 || partNumber > 30) {
    throw new Error('رقم الجزء يجب أن يكون بين 1 و 30');
  }

  khatmah.parts = normalizeParts(khatmah.parts);

  const part = khatmah.parts[partNumber] || {
    partNumber,
    status: 'available',
  };

  if (part.reservedBy) {
    part.status = 'reserved';
  } else {
    part.status = 'available';
  }
  delete part.completedAt;
  delete part.completedBy;
  khatmah.parts[partNumber] = part;

  recomputeKhatmahStatus(khatmah);
  await saveKhatmah(khatmah);
  return khatmah;
}

function recomputeKhatmahStatus(k: GroupKhatmah) {
  let completedCount = 0;
  for (let i = 1; i <= 30; i++) {
    if (k.parts[i]?.status === 'completed') {
      completedCount++;
    }
  }
  k.isCompleted = completedCount === 30;
  if (k.isCompleted && !k.completedAt) {
    k.completedAt = Date.now();
  } else if (!k.isCompleted) {
    delete k.completedAt;
  }
}

