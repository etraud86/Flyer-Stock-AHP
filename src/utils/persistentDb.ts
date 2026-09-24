import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  OfficeFlyerMetricOverride,
} from '../types';
import {
  INITIAL_FLYER_TYPES,
  INITIAL_OFFICES,
  INITIAL_BATCHES,
} from '../data/initialData';

export interface DatabaseState {
  version: string;
  updatedAt: string;
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs: TourismFair[];
  otherDeliveries: OtherDeliveryRecord[];
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
}

// Permanent, version-invariant keys that are never wiped or renamed
export const PERMANENT_STORAGE_KEYS = {
  FLYERS: 'ahp_db_flyers',
  OFFICES: 'ahp_db_offices',
  DELIVERIES: 'ahp_db_deliveries',
  BATCHES: 'ahp_db_batches',
  FAIRS: 'ahp_db_fairs',
  OTHER_DELIVERIES: 'ahp_db_other_deliveries',
  METRICS: 'ahp_db_metric_overrides',
  FULL_BACKUP: 'ahp_db_emergency_snapshot',
};

// Prior legacy keys in order of precedence to salvage any historical records entered on netlify.app
const LEGACY_KEYS = {
  FLYERS: [
    'ahp_db_flyers',
    'flyerstock_clean_prod_v6',
    'flyerstock_clean_flyers_v5',
    'flyerstock_clean_flyers_v4',
    'flyerstock_flyers_v3',
  ],
  OFFICES: [
    'ahp_db_offices',
    'flyerstock_clean_offices_prod_v6',
    'flyerstock_clean_offices_v5',
    'flyerstock_offices_v2',
  ],
  DELIVERIES: [
    'ahp_db_deliveries',
    'flyerstock_clean_deliveries_prod_v6',
    'flyerstock_clean_deliveries_v5',
    'flyerstock_clean_deliveries_v4',
    'flyerstock_deliveries_v3',
  ],
  BATCHES: [
    'ahp_db_batches',
    'flyerstock_clean_batches_prod_v6',
    'flyerstock_clean_batches_v5',
    'flyerstock_clean_batches_v4',
  ],
  FAIRS: [
    'ahp_db_fairs',
    'flyerstock_clean_fairs_prod_v6',
    'flyerstock_clean_fairs_v5',
    'flyerstock_clean_fairs_v4',
  ],
  OTHER_DELIVERIES: [
    'ahp_db_other_deliveries',
    'flyerstock_clean_other_deliveries_prod_v6',
    'flyerstock_clean_other_deliveries_v5',
    'flyerstock_clean_other_deliveries_v4',
  ],
};

// -----------------------------------------------------------------
// INDEXEDDB MULTI-LAYER HARDENED PERSISTENCE
// -----------------------------------------------------------------
const IDB_NAME = 'ahp_permanent_database';
const IDB_STORE = 'app_state_store';
const IDB_KEY = 'latest_active_database';

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[IndexedDB] Could not open database, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function saveToIndexedDb(data: DatabaseState): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(data, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadFromIndexedDb(): Promise<DatabaseState | null> {
  const db = await openIndexedDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// -----------------------------------------------------------------
// LOCAL STORAGE RESILIENT EXTRACTION
// -----------------------------------------------------------------
function extractFromFirstValidKey<T>(keys: string[], fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) ? parsed.length > 0 : parsed != null) {
          return parsed as T;
        }
      }
    } catch {}
  }
  return fallback;
}

/**
 * Loads database state from permanent storage or salvages from any previous version on netlify.app
 */
export function loadInitialDatabaseState(): DatabaseState {
  const flyers = extractFromFirstValidKey<FlyerType[]>(
    LEGACY_KEYS.FLYERS,
    INITIAL_FLYER_TYPES
  );
  const offices = extractFromFirstValidKey<TourismOffice[]>(
    LEGACY_KEYS.OFFICES,
    INITIAL_OFFICES
  );
  const deliveries = extractFromFirstValidKey<DeliveryRecord[]>(
    LEGACY_KEYS.DELIVERIES,
    []
  );
  const batches = extractFromFirstValidKey<StockInBatch[]>(
    LEGACY_KEYS.BATCHES,
    INITIAL_BATCHES
  );
  const fairs = extractFromFirstValidKey<TourismFair[]>(
    LEGACY_KEYS.FAIRS,
    []
  );
  const otherDeliveries = extractFromFirstValidKey<OtherDeliveryRecord[]>(
    LEGACY_KEYS.OTHER_DELIVERIES,
    []
  );

  let metricOverrides: Record<string, OfficeFlyerMetricOverride> = {};
  try {
    const rawMetrics =
      localStorage.getItem(PERMANENT_STORAGE_KEYS.METRICS) ||
      localStorage.getItem('flyerstock_metric_overrides_v1');
    if (rawMetrics) {
      metricOverrides = JSON.parse(rawMetrics);
    }
  } catch {}

  // Guarantee Headquarters exists in tourism offices
  const hasHq = offices.some(
    (o) => o.id === 'off-headquarters-ahp' || o.name?.toLowerCase().includes('headquarters')
  );
  const cleanOffices = hasHq
    ? offices
    : [INITIAL_OFFICES[0], ...offices];

  return {
    version: '1.0.1',
    updatedAt: new Date().toISOString(),
    flyers,
    offices: cleanOffices,
    deliveries,
    batches,
    fairs,
    otherDeliveries,
    metricOverrides,
  };
}

/**
 * Persists the complete database state across multiple redundant layers:
 * 1. Permanent LocalStorage keys
 * 2. Full Emergency Backup Snapshot
 * 3. Browser IndexedDB database
 */
export function persistDatabaseState(state: {
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs: TourismFair[];
  otherDeliveries: OtherDeliveryRecord[];
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
}) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Write individual permanent stores
    localStorage.setItem(PERMANENT_STORAGE_KEYS.FLYERS, JSON.stringify(state.flyers));
    localStorage.setItem(PERMANENT_STORAGE_KEYS.OFFICES, JSON.stringify(state.offices));
    localStorage.setItem(PERMANENT_STORAGE_KEYS.DELIVERIES, JSON.stringify(state.deliveries));
    localStorage.setItem(PERMANENT_STORAGE_KEYS.BATCHES, JSON.stringify(state.batches));
    localStorage.setItem(PERMANENT_STORAGE_KEYS.FAIRS, JSON.stringify(state.fairs));
    localStorage.setItem(PERMANENT_STORAGE_KEYS.OTHER_DELIVERIES, JSON.stringify(state.otherDeliveries));
    if (state.metricOverrides) {
      localStorage.setItem(PERMANENT_STORAGE_KEYS.METRICS, JSON.stringify(state.metricOverrides));
    }

    // 2. Full emergency composite snapshot
    const compositeSnapshot: DatabaseState = {
      version: '1.0.1',
      updatedAt: new Date().toISOString(),
      ...state,
    };
    localStorage.setItem(
      PERMANENT_STORAGE_KEYS.FULL_BACKUP,
      JSON.stringify(compositeSnapshot)
    );

    // 3. Mirror into persistent IndexedDB asynchronously
    saveToIndexedDb(compositeSnapshot).catch(() => {});
  } catch (err) {
    console.warn('[Database] LocalStorage write warning:', err);
  }
}

/**
 * Non-destructive Safe Merge:
 * Merges incoming remote/server data without EVER wiping user-inserted records.
 * If incoming array is empty, local user data is preserved 100%.
 */
export function mergeDatabaseSafely(
  current: {
    flyers: FlyerType[];
    offices: TourismOffice[];
    deliveries: DeliveryRecord[];
    batches: StockInBatch[];
    fairs: TourismFair[];
    otherDeliveries: OtherDeliveryRecord[];
  },
  incoming: Partial<{
    flyers: FlyerType[];
    offices: TourismOffice[];
    deliveries: DeliveryRecord[];
    batches: StockInBatch[];
    fairs: TourismFair[];
    otherDeliveries: OtherDeliveryRecord[];
  }>
) {
  // Deliveries: keep all current, merge any new from remote by ID
  let mergedDeliveries = [...current.deliveries];
  if (Array.isArray(incoming.deliveries) && incoming.deliveries.length > 0) {
    const existingIds = new Set(current.deliveries.map((d) => d.id));
    incoming.deliveries.forEach((d) => {
      if (!existingIds.has(d.id)) {
        mergedDeliveries.push(d);
        existingIds.add(d.id);
      }
    });
  }

  // Fairs: keep all current, merge any new by ID
  let mergedFairs = [...current.fairs];
  if (Array.isArray(incoming.fairs) && incoming.fairs.length > 0) {
    const existingIds = new Set(current.fairs.map((f) => f.id));
    incoming.fairs.forEach((f) => {
      if (!existingIds.has(f.id)) {
        mergedFairs.push(f);
        existingIds.add(f.id);
      }
    });
  }

  // OtherDeliveries: keep all current, merge any new by ID
  let mergedOther = [...current.otherDeliveries];
  if (Array.isArray(incoming.otherDeliveries) && incoming.otherDeliveries.length > 0) {
    const existingIds = new Set(current.otherDeliveries.map((o) => o.id));
    incoming.otherDeliveries.forEach((o) => {
      if (!existingIds.has(o.id)) {
        mergedOther.push(o);
        existingIds.add(o.id);
      }
    });
  }

  // Batches: keep all current, merge any new by ID
  let mergedBatches = [...current.batches];
  if (Array.isArray(incoming.batches) && incoming.batches.length > 0) {
    const existingIds = new Set(current.batches.map((b) => b.id));
    incoming.batches.forEach((b) => {
      if (!existingIds.has(b.id)) {
        mergedBatches.push(b);
        existingIds.add(b.id);
      }
    });
  }

  // Flyers: keep all user flyers, update or append
  let mergedFlyers = [...current.flyers];
  if (Array.isArray(incoming.flyers) && incoming.flyers.length > 0) {
    const existingIds = new Set(current.flyers.map((f) => f.id));
    incoming.flyers.forEach((f) => {
      if (!existingIds.has(f.id)) {
        mergedFlyers.push(f);
        existingIds.add(f.id);
      }
    });
  }

  // Offices: keep all current, merge any new by ID
  let mergedOffices = [...current.offices];
  if (Array.isArray(incoming.offices) && incoming.offices.length > 0) {
    const existingIds = new Set(current.offices.map((o) => o.id));
    incoming.offices.forEach((o) => {
      if (!existingIds.has(o.id)) {
        mergedOffices.push(o);
        existingIds.add(o.id);
      }
    });
  }

  return {
    flyers: mergedFlyers,
    offices: mergedOffices,
    deliveries: mergedDeliveries,
    batches: mergedBatches,
    fairs: mergedFairs,
    otherDeliveries: mergedOther,
  };
}

/**
 * Downloads a complete JSON backup file of the database
 */
export function exportDatabaseBackup(state: {
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs: TourismFair[];
  otherDeliveries: OtherDeliveryRecord[];
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
}) {
  const exportPayload: DatabaseState = {
    version: '1.0.1',
    updatedAt: new Date().toISOString(),
    ...state,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `AHP_Logistics_Backup_v1.0.1_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
