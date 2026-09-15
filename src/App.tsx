import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExcelSheetView } from './components/ExcelSheetView';
import { DepletionTrackerView } from './components/DepletionTrackerView';
import { TourismFairsView } from './components/TourismFairsView';
import { OtherDeliveriesView } from './components/OtherDeliveriesView';
import { TourismOfficesHubView } from './components/TourismOfficesHubView';
import { PrintableDeliveryArchiveModal } from './components/PrintableDeliveryArchiveModal';
import { DigitalSignatureModal } from './components/DigitalSignatureModal';
import { MobileOfficeValidationView } from './components/MobileOfficeValidationView';
import { DeliveryModal } from './components/DeliveryModal';
import { StockInModal } from './components/StockInModal';
import { DepletionLogModal } from './components/DepletionLogModal';
import { EmailDispatchNoticeModal } from './components/EmailDispatchNoticeModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { AddFlyerModal } from './components/AddFlyerModal';
import { EditFlyerStockModal } from './components/EditFlyerStockModal';
import { OfficeContactsModal } from './components/OfficeContactsModal';
import { EnterLoginPage } from './components/EnterLoginPage';
import { UserManagementModal } from './components/UserManagementModal';
import { Footer } from './components/Footer';
import { applyTargetStockToBatches, getFlyerTotalDispatched } from './utils/stockAdjustment';
import { getCurrentSession, clearSession } from './utils/auth';

import {
  ActiveTab,
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  OfficeFlyerMetricOverride,
  AuthSession,
  AuthUser,
} from './types';
import {
  INITIAL_FLYER_TYPES,
  INITIAL_OFFICES,
  INITIAL_DELIVERIES,
  INITIAL_BATCHES,
  INITIAL_FAIRS,
  INITIAL_OTHER_DELIVERIES,
} from './data/initialData';
import { computeOfficeFlyerMetrics, computeWarehouseStock, TODAY_STR } from './utils/calculations';
import { CheckCircle } from 'lucide-react';

const STORAGE_KEYS = {
  FLYERS: 'flyerstock_clean_prod_v6',
  OFFICES: 'flyerstock_clean_offices_prod_v6',
  DELIVERIES: 'flyerstock_clean_deliveries_prod_v6',
  BATCHES: 'flyerstock_clean_batches_prod_v6',
  FAIRS: 'flyerstock_clean_fairs_prod_v6',
  OTHER_DELIVERIES: 'flyerstock_clean_other_deliveries_prod_v6',
};

// Known demo flyer identifiers to purge completely
const DEMO_FLYER_SKUS = new Set([
  'AHP-MAP-01',
  'AHP-GAS-02',
  'AHP-GR22-03',
  'AHP-JUD-04',
  'AHP-FAM-05',
  'AHP-NAT-06',
]);
const DEMO_FLYER_IDS = new Set([
  'flyer-1',
  'flyer-2',
  'flyer-3',
  'flyer-4',
  'flyer-5',
  'flyer-6',
  'flyer-custom-fallback',
]);

const isDemoFlyer = (f: FlyerType) =>
  DEMO_FLYER_IDS.has(f.id) ||
  DEMO_FLYER_SKUS.has(f.sku) ||
  (f.sku && f.sku.startsWith('AHP-DEMO'));

export default function App() {
  // Purge legacy demo storage keys to guarantee a 100% clean application slate
  useEffect(() => {
    const legacyKeys = [
      'flyerstock_clean_flyers_v4',
      'flyerstock_clean_deliveries_v4',
      'flyerstock_clean_batches_v4',
      'flyerstock_clean_fairs_v4',
      'flyerstock_clean_other_deliveries_v4',
      'flyerstock_clean_flyers_v5',
      'flyerstock_clean_deliveries_v5',
      'flyerstock_clean_batches_v5',
      'flyerstock_clean_fairs_v5',
      'flyerstock_clean_other_deliveries_v5',
      'flyerstock_flyers_v3',
      'flyerstock_deliveries_v3',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }, []);

  // Load persistent state or fallback to clean initial data
  const [flyers, setFlyers] = useState<FlyerType[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLYERS);
    if (!saved) return INITIAL_FLYER_TYPES;
    try {
      const parsed: FlyerType[] = JSON.parse(saved);
      const filtered = parsed.filter((f) => !isDemoFlyer(f));
      if (filtered.length === 0) return INITIAL_FLYER_TYPES;
      return filtered.map((f) => {
        // Guarantee that Roteiro (AHP-ROT-45) or any flyer initialized with 10,000 has its central warehouse stock set
        if (f.sku === 'AHP-ROT-45' || f.name?.toLowerCase().includes('roteiro')) {
          return {
            ...f,
            warehouseStock: f.warehouseStock && f.warehouseStock > 0 ? f.warehouseStock : 10000,
          };
        }
        return f;
      });
    } catch {
      return INITIAL_FLYER_TYPES;
    }
  });

  const [offices, setOffices] = useState<TourismOffice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFICES) || localStorage.getItem('flyerstock_offices_v2');
    const parsed: TourismOffice[] = saved ? JSON.parse(saved) : INITIAL_OFFICES;
    const hqExists = parsed.some((o) => o.id === 'off-headquarters-ahp' || o.name.toLowerCase().includes('headquarters'));
    if (!hqExists) {
      const hq = INITIAL_OFFICES.find((o) => o.id === 'off-headquarters-ahp');
      if (hq) {
        return [hq, ...parsed];
      }
    }
    return parsed;
  });

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    if (!saved) return [];
    try {
      const parsed: DeliveryRecord[] = JSON.parse(saved);
      return parsed.filter((d) => !DEMO_FLYER_IDS.has(d.flyerTypeId));
    } catch {
      return [];
    }
  });

  const [batches, setBatches] = useState<StockInBatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (!saved) return INITIAL_BATCHES;
    try {
      const parsed: StockInBatch[] = JSON.parse(saved);
      const filtered = parsed.filter((b) => !DEMO_FLYER_IDS.has(b.flyerTypeId));
      return filtered.length > 0 ? filtered : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [fairs, setFairs] = useState<TourismFair[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAIRS);
    if (!saved) return [];
    try {
      const parsed: TourismFair[] = JSON.parse(saved);
      return parsed.filter((f) => !f.items?.some((it) => DEMO_FLYER_IDS.has(it.flyerTypeId)));
    } catch {
      return [];
    }
  });

  const [otherDeliveries, setOtherDeliveries] = useState<OtherDeliveryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OTHER_DELIVERIES);
    if (!saved) return [];
    try {
      const parsed: OtherDeliveryRecord[] = JSON.parse(saved);
      return parsed.filter((od) => !DEMO_FLYER_IDS.has(od.flyerTypeId));
    } catch {
      return [];
    }
  });

  // User customizations for depletion, burn rates, and time lapses
  const [metricOverrides, setMetricOverrides] = useState<Record<string, OfficeFlyerMetricOverride>>(() => {
    const saved = localStorage.getItem('flyerstock_metric_overrides_v1');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('flyerstock_metric_overrides_v1', JSON.stringify(metricOverrides));
  }, [metricOverrides]);

  const handleUpdateMetricOverride = (key: string, override: Partial<OfficeFlyerMetricOverride>) => {
    setMetricOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...override,
      },
    }));
    showToast('Customized metrics updated in Excel grid and models.');
  };

  const handleResetMetricOverride = (key: string) => {
    setMetricOverrides((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    showToast('Reverted metric to auto-calculated formula.');
  };

  // Safe Authentication Session State (Enterprise Private Portal - Not Open Source)
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState<'change_password' | 'register_user' | 'users_list'>('change_password');

  const handleOpenUserManagement = (tab: 'change_password' | 'register_user' | 'users_list' = 'change_password') => {
    setUserModalTab(tab);
    setIsUserManagementModalOpen(true);
  };

  // Mobile QR Code Auto-Validation State (triggered when scanned on mobile phone)
  const [mobileValidationOffice, setMobileValidationOffice] = useState<{
    code: string;
    id?: string;
  } | null>(() => {
    if (typeof window !== 'undefined' && window.location) {
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('officeValidate') || searchParams.get('officeCode') || '';
      let id = searchParams.get('officeId') || '';

      if (!code && window.location.hash) {
        const hashStr = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashStr);
        code = hashParams.get('officeValidate') || hashParams.get('officeCode') || '';
        id = id || hashParams.get('officeId') || '';
      }

      if (code || id) {
        return {
          code: code || '',
          id: id || undefined,
        };
      }
    }
    return null;
  });

  const handleLogout = () => {
    clearSession();
    setSession(null);
    showToast('Session ended. Workstation locked.');
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal control states
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryPreselect, setDeliveryPreselect] = useState<{
    officeId?: string;
    flyerTypeId?: string;
    qty?: number;
  }>({});

  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInPreselectFlyer, setStockInPreselectFlyer] = useState<string | undefined>();

  const [isDepletionModalOpen, setIsDepletionModalOpen] = useState(false);
  const [depletionPreselect, setDepletionPreselect] = useState<{
    officeId?: string;
    flyerTypeId?: string;
  }>({});

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailPreselectedOfficeId, setEmailPreselectedOfficeId] = useState<string | undefined>();

  // Excel Upload, Add Flyer, and Stock Edit Modals
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false);
  const [isAddFlyerModalOpen, setIsAddFlyerModalOpen] = useState(false);
  const [isEditFlyerModalOpen, setIsEditFlyerModalOpen] = useState(false);
  const [editingFlyerId, setEditingFlyerId] = useState<string | null>(null);

  // Tourism Offices & Contacts Directory Modal
  const [isOfficeContactsModalOpen, setIsOfficeContactsModalOpen] = useState(false);

  // Digital Delivery Signature & Printable Archive Slip Modals
  const [isArchiveSlipOpen, setIsArchiveSlipOpen] = useState(false);
  const [archiveSlipDelivery, setArchiveSlipDelivery] = useState<DeliveryRecord | null>(null);
  const [archiveSlipOffice, setArchiveSlipOffice] = useState<TourismOffice | null>(null);
  const [archiveSlipFlyer, setArchiveSlipFlyer] = useState<FlyerType | null>(null);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureDelivery, setSignatureDelivery] = useState<DeliveryRecord | null>(null);
  const [signatureOffice, setSignatureOffice] = useState<TourismOffice | null>(null);
  const [signatureFlyer, setSignatureFlyer] = useState<FlyerType | null>(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLYERS, JSON.stringify(flyers));
  }, [flyers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OFFICES, JSON.stringify(offices));
  }, [offices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAIRS, JSON.stringify(fairs));
  }, [fairs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OTHER_DELIVERIES, JSON.stringify(otherDeliveries));
  }, [otherDeliveries]);

  // Keep warehouse stock batches strictly connected to registered flyer materials
  useEffect(() => {
    if (flyers.length === 0) return;

    let batchesChanged = false;
    let nextBatches = [...batches];

    flyers.forEach((f) => {
      const fBatches = nextBatches.filter((b) => b.flyerTypeId === f.id);
      const totalBatchQty = fBatches.reduce((acc, b) => acc + b.quantity, 0);
      const targetBaseStock =
        f.sku === 'AHP-ROT-45' || f.name?.toLowerCase().includes('roteiro')
          ? Math.max(f.warehouseStock || 0, 10000)
          : f.warehouseStock || 0;

      if (totalBatchQty === 0 && targetBaseStock > 0) {
        const padNum = (nextBatches.length + 1).toString().padStart(3, '0');
        nextBatches.push({
          id: `bat-auto-${f.id}`,
          batchRef: `PO-2026-PRINT-${padNum}`,
          date: TODAY_STR,
          flyerTypeId: f.id,
          quantity: targetBaseStock,
          printerName: 'Lote Central AHP - Gráfica Oficial',
          unitCost: f.unitCost || 0.16,
        });
        batchesChanged = true;
      }
    });

    if (batchesChanged) {
      setBatches(nextBatches);
    }
  }, [flyers, batches]);

  // Keep server synchronized with the current deliveries list for cross-device visibility
  useEffect(() => {
    if (deliveries && deliveries.length > 0) {
      fetch('/api/qr/sync-deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveries }),
      }).catch(() => {});
    }
  }, [deliveries]);

  // -------------------------------------------------------------
  // REAL-TIME CROSS-DEVICE QR CONFIRMATION SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Cross-tab BroadcastChannel listener for zero-latency local updates
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('ahp_qr_sync_channel');
        bc.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'OFFICE_CONFIRMED_AUTOMATICALLY') {
            handleRealTimeOfficeConfirmation(data.officeCode, data.officeId, data.confirmedBy, data.officeName);
          }
        };
      }
    } catch (e) {}

    // 2. Cross-device Server Polling: Polls /api/qr/sync every 1500ms
    // This immediately captures smartphone camera scans from external mobile devices!
    let isCancelled = false;
    let lastProcessedTime = Date.now() - 10000;

    const pollServerSync = async () => {
      try {
        const res = await fetch(`/api/qr/sync?since=${lastProcessedTime}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isCancelled || !json.success) return;

        if (Array.isArray(json.events) && json.events.length > 0) {
          json.events.forEach((evt: any) => {
            handleRealTimeOfficeConfirmation(evt.officeCode, evt.officeId, evt.confirmedBy);
          });
          lastProcessedTime = json.serverTime || Date.now();
        }
      } catch (err) {
        // Dev server or offline, ignore silently
      }
    };

    const interval = setInterval(pollServerSync, 1500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [offices]);

  const handleRealTimeOfficeConfirmation = (
    officeCode: string,
    officeId?: string,
    confirmedBy?: string,
    officeName?: string
  ) => {
    const cleanCode = (officeCode || '').toUpperCase();
    const targetOffice = offices.find(
      (o) => (cleanCode && o.code.toUpperCase() === cleanCode) || (officeId && o.id === officeId)
    );
    const resolvedOfficeId = targetOffice?.id || officeId;
    const resolvedName = targetOffice?.name || officeName || cleanCode || 'Tourism Office';
    const staff = confirmedBy || `${resolvedName} Reception Staff`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let updatedCount = 0;

    setDeliveries((prev) => {
      const updated = prev.map((d) => {
        const matches =
          (resolvedOfficeId && d.officeId === resolvedOfficeId) ||
          (targetOffice && d.officeId === targetOffice.id);

        if (matches && d.confirmationStatus !== 'confirmed') {
          updatedCount++;
          const sigCode = `VERIFIED-AHP-${d.deliveryRef.replace(/[^A-Z0-9]/gi, '')}-${Math.floor(
            1000 + Math.random() * 9000
          )}`;
          return {
            ...d,
            confirmationStatus: 'confirmed' as const,
            confirmedAt: nowStr,
            confirmedBy: staff,
            confirmationSignatureCode: sigCode,
          };
        }
        return d;
      });

      return updated;
    });

    if (updatedCount > 0) {
      showToast(`✓ QR Scan: ${updatedCount} delivery for ${resolvedName} confirmed in real time!`);
    }
  };

  // Immediate auto-confirmation as soon as a mobile phone scan reading is detected
  useEffect(() => {
    if (mobileValidationOffice?.code || mobileValidationOffice?.id) {
      handleRealTimeOfficeConfirmation(
        mobileValidationOffice.code,
        mobileValidationOffice.id,
        'Mobile Phone Camera'
      );
    }
  }, [mobileValidationOffice?.code, mobileValidationOffice?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Multi-channel warehouse inventory calculation
  const metrics = computeOfficeFlyerMetrics(offices, flyers, deliveries, TODAY_STR, 21, metricOverrides);
  const warehouseStock = computeWarehouseStock(flyers, deliveries, batches, fairs, otherDeliveries);
  const warehouseStockMap: Record<string, number> = {};
  warehouseStock.forEach((w) => {
    warehouseStockMap[w.flyer.id] = w.currentWarehouseStock;
  });

  const depletedCount = metrics.filter((m) => m.status === 'depleted').length;
  const criticalCount = metrics.filter((m) => m.status === 'critical').length;

  // Handlers
  const handleOpenNewDelivery = (officeId?: string, flyerTypeId?: string, defaultQty?: number) => {
    if (flyers.length === 0) {
      showToast('Please add your first flyer publication to start recording deliveries.');
      setIsAddFlyerModalOpen(true);
      return;
    }
    setDeliveryPreselect({ officeId, flyerTypeId, qty: defaultQty });
    setIsDeliveryModalOpen(true);
  };

  const handleOpenAddStock = (flyerTypeId?: string) => {
    if (flyers.length === 0) {
      showToast('Please add your first flyer publication to start receiving warehouse stock batches.');
      setIsAddFlyerModalOpen(true);
      return;
    }
    setStockInPreselectFlyer(flyerTypeId);
    setIsStockInModalOpen(true);
  };

  const handleOpenDepletionModal = (officeId?: string, flyerTypeId?: string) => {
    setDepletionPreselect({ officeId, flyerTypeId });
    setIsDepletionModalOpen(true);
  };

  const handleOpenEmailModal = (officeId?: string) => {
    setEmailPreselectedOfficeId(officeId);
    setIsEmailModalOpen(true);
  };

  const handleOpenUploadExcel = () => {
    setIsUploadExcelModalOpen(true);
  };

  const handleOpenAddFlyer = () => {
    setIsAddFlyerModalOpen(true);
  };

  const handleOpenEditFlyerStock = (flyerId: string) => {
    setEditingFlyerId(flyerId);
    setIsEditFlyerModalOpen(true);
  };

  const handleOpenOfficesDirectory = () => {
    setIsOfficeContactsModalOpen(true);
  };

  const handleUpdateOffice = (officeId: string, updatedData: Partial<TourismOffice>) => {
    setOffices((prev) =>
      prev.map((o) => (o.id === officeId ? { ...o, ...updatedData } : o))
    );
    const existing = offices.find((o) => o.id === officeId);
    showToast(`Updated contact details for ${updatedData.name || existing?.name || 'tourism office'}!`);
  };

  const handleAddOffice = (newOfficeData: Omit<TourismOffice, 'id'>) => {
    const newOffice: TourismOffice = {
      ...newOfficeData,
      id: `off-${Date.now()}`,
    };
    setOffices((prev) => [...prev, newOffice]);
    showToast(`Registered new tourism office "${newOffice.name}"!`);
  };

  const handleDeleteOffice = (officeId: string) => {
    const office = offices.find((o) => o.id === officeId);
    setOffices((prev) => prev.filter((o) => o.id !== officeId));
    showToast(`Removed "${office?.name || officeId}" from directory.`);
  };

  const DEFAULT_FALLBACK_FLYER: FlyerType = {
    id: 'flyer-custom-fallback',
    sku: 'AHP-MAT-01',
    name: 'Material Promocional AHP',
    category: 'Geral',
    language: 'Português',
    warehouseStock: 0,
    minThreshold: 500,
    unitCost: 0.15,
    color: '#059669',
    description: 'Publicação oficial Aldeias Históricas de Portugal',
  };

  const handleOpenPrintSlip = (delivery: DeliveryRecord, office?: TourismOffice, flyer?: FlyerType) => {
    const targetOffice = office || offices.find((o) => o.id === delivery.officeId) || offices[0];
    const targetFlyer = flyer || flyers.find((f) => f.id === delivery.flyerTypeId) || flyers[0] || DEFAULT_FALLBACK_FLYER;
    setArchiveSlipDelivery(delivery);
    setArchiveSlipOffice(targetOffice);
    setArchiveSlipFlyer(targetFlyer);
    setIsArchiveSlipOpen(true);
  };

  const handleOpenSignatureModal = (
    delivery: DeliveryRecord,
    office: TourismOffice,
    flyer?: FlyerType
  ) => {
    const targetFlyer = flyer || flyers.find((f) => f.id === delivery.flyerTypeId) || flyers[0] || DEFAULT_FALLBACK_FLYER;
    setSignatureDelivery(delivery);
    setSignatureOffice(office);
    setSignatureFlyer(targetFlyer);
    setIsSignatureModalOpen(true);
  };

  const handleSaveDigitalSignature = (
    deliveryId: string,
    confirmedBy: string,
    signerRole: string,
    signatureDataUrl: string,
    signAllPending?: boolean
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setDeliveries((prev) => {
      const target = prev.find((d) => d.id === deliveryId);
      const targetOfficeId = target?.officeId;

      return prev.map((d) => {
        const isTarget = d.id === deliveryId;
        const isBatchSign =
          signAllPending &&
          targetOfficeId &&
          d.officeId === targetOfficeId &&
          d.confirmationStatus !== 'confirmed';

        if (isTarget || isBatchSign) {
          const sigCode = `SIG-AHP-${d.deliveryRef.replace(/[^A-Z0-9]/gi, '')}-${Math.floor(
            1000 + Math.random() * 9000
          )}`;
          return {
            ...d,
            confirmationStatus: 'confirmed',
            confirmedAt: nowStr,
            confirmedBy: confirmedBy || 'Responsável Posto de Turismo',
            signerRole: signerRole || 'Receção / Técnico de Turismo',
            signatureDataUrl: signatureDataUrl,
            confirmationSignatureCode: sigCode,
          };
        }
        return d;
      });
    });

    setArchiveSlipDelivery((prev) => {
      if (prev && prev.id === deliveryId) {
        return {
          ...prev,
          confirmationStatus: 'confirmed',
          confirmedAt: nowStr,
          confirmedBy,
          signerRole,
          signatureDataUrl,
        };
      }
      return prev;
    });

    showToast(`Receção assinada e confirmada digitalmente por ${confirmedBy}!`);
  };

  const handleConfirmDelivery = (deliveryId: string, confirmedBy: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const sigCode = `VERIFIED-AHP-${d.deliveryRef.replace(/[^A-Z0-9]/gi, '')}-${Math.floor(
            1000 + Math.random() * 9000
          )}`;
          return {
            ...d,
            confirmationStatus: 'confirmed',
            confirmedAt: nowStr,
            confirmedBy: confirmedBy || 'Tourism Office Staff',
            confirmationSignatureCode: sigCode,
          };
        }
        return d;
      })
    );
    fetch('/api/qr/confirm-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryId, confirmedBy }),
    }).catch(() => {});
    showToast(`Receipt confirmed via QR Code by ${confirmedBy}!`);
  };

  const handleApplyExcelImport = (
    updatedFlyers: FlyerType[],
    updatedBatches: StockInBatch[],
    existingCount: number,
    newCount: number
  ) => {
    setFlyers(updatedFlyers);
    setBatches(updatedBatches);
    showToast(
      `Excel Import successful! Updated stock for ${existingCount} flyer(s) and created ${newCount} new flyer(s).`
    );
  };

  const handleAddFlyer = (newFlyerData: Omit<FlyerType, 'id'>, initialStock: number) => {
    const newFlyerId = `flyer-${Date.now()}`;
    const newFlyer: FlyerType = {
      ...newFlyerData,
      id: newFlyerId,
      warehouseStock: initialStock,
    };

    setFlyers((prev) => [...prev, newFlyer]);

    // Create initial stock-in batch so warehouse stock displays the initial stock
    if (initialStock > 0) {
      const padNum = (batches.length + 1).toString().padStart(3, '0');
      const newBatch: StockInBatch = {
        id: `bat-${Date.now()}`,
        batchRef: `PO-2026-PRINT-${padNum}`,
        date: TODAY_STR,
        flyerTypeId: newFlyerId,
        quantity: initialStock,
        printerName: 'Initial Print Lot / Direct Setup',
        unitCost: newFlyer.unitCost,
      };
      setBatches((prev) => [...prev, newBatch]);
    }

    showToast(
      `Added new flyer "${newFlyer.name}" with ${initialStock.toLocaleString()} units placed in warehouse stock!`
    );
  };

  const handleUpdateFlyerStock = (
    flyerId: string,
    newStock: number,
    updatedFlyerDetails: Partial<FlyerType>,
    reason: string
  ) => {
    // 1. Update flyer metadata
    setFlyers((prev) =>
      prev.map((f) => {
        if (f.id === flyerId) {
          return {
            ...f,
            ...updatedFlyerDetails,
            warehouseStock: newStock,
          };
        }
        return f;
      })
    );

    // 2. Adjust batches so warehouseStock equals newStock
    const totalDispatched = getFlyerTotalDispatched(flyerId, deliveries, fairs, otherDeliveries);
    const flyer = flyers.find((f) => f.id === flyerId);
    const adjustedBatches = applyTargetStockToBatches(
      flyerId,
      newStock,
      batches,
      totalDispatched,
      updatedFlyerDetails.unitCost || flyer?.unitCost || 0.16,
      reason
    );
    setBatches(adjustedBatches);

    showToast(
      `Updated stock for "${flyer?.name}" to ${newStock.toLocaleString()} available in warehouse.`
    );
  };

  const handleDeleteFlyer = (flyerId: string) => {
    const flyer = flyers.find((f) => f.id === flyerId);
    setFlyers((prev) => prev.filter((f) => f.id !== flyerId));
    setBatches((prev) => prev.filter((b) => b.flyerTypeId !== flyerId));
    showToast(`Removed flyer "${flyer?.name || flyerId}" from the catalog.`);
  };

  const handleCreateDelivery = (newDelivery: Omit<DeliveryRecord, 'id' | 'deliveryRef'>) => {
    // Strict warehouse stock dependency check
    const availableStock = warehouseStockMap[newDelivery.flyerTypeId] ?? 0;
    const flyer = flyers.find((f) => f.id === newDelivery.flyerTypeId);
    if (availableStock <= 0) {
      showToast(
        `Cannot dispatch: Central warehouse stock is depleted (0 available for "${flyer?.name || 'this flyer'}"). Receive a print batch first.`
      );
      return;
    }
    if (newDelivery.quantityDelivered > availableStock) {
      showToast(
        `Cannot dispatch: Requested ${newDelivery.quantityDelivered.toLocaleString()} units exceeds central warehouse balance (${availableStock.toLocaleString()} available).`
      );
      return;
    }

    const padNum = (deliveries.length + 1).toString().padStart(3, '0');
    const dateFormatted = newDelivery.date.replace(/-/g, '').slice(4);
    const deliveryRef = `DEL-2026-${dateFormatted}-${padNum}`;

    const createdRecord: DeliveryRecord = {
      ...newDelivery,
      id: `del-${Date.now()}`,
      deliveryRef,
    };

    setDeliveries((prev) => [createdRecord, ...prev]);

    const office = offices.find((o) => o.id === newDelivery.officeId);
    showToast(
      `Dispatched ${newDelivery.quantityDelivered.toLocaleString()} "${flyer?.name}" flyers from warehouse to ${office?.name}!`
    );
    return createdRecord;
  };

  const handleCreateStockBatch = (newBatch: Omit<StockInBatch, 'id' | 'batchRef'>) => {
    const batchNum = (batches.length + 1).toString().padStart(3, '0');
    const batchRef = `PO-2026-PRINT-${batchNum}`;

    const createdBatch: StockInBatch = {
      ...newBatch,
      id: `bat-${Date.now()}`,
      batchRef,
    };

    setBatches((prev) => [...prev, createdBatch]);

    const flyer = flyers.find((f) => f.id === newBatch.flyerTypeId);
    showToast(
      `Received ${newBatch.quantity.toLocaleString()} flyers for "${flyer?.name}" into warehouse inventory.`
    );
  };

  const handleQuickReceiveStock = (flyerTypeId: string, quantity: number = 10000) => {
    const flyer = flyers.find((f) => f.id === flyerTypeId);
    const batchNum = (batches.length + 1).toString().padStart(3, '0');
    const batchRef = `PO-2026-PRINT-${batchNum}`;

    const newBatch: StockInBatch = {
      id: `bat-quick-${Date.now()}`,
      batchRef,
      date: TODAY_STR,
      flyerTypeId,
      quantity,
      printerName: 'Lote Central AHP - Gráfica Oficial',
      unitCost: flyer?.unitCost || 0.16,
    };

    setBatches((prev) => [...prev, newBatch]);

    // Also ensure the flyer object itself has its warehouseStock updated
    setFlyers((prev) =>
      prev.map((f) => (f.id === flyerTypeId ? { ...f, warehouseStock: (f.warehouseStock || 0) + quantity } : f))
    );

    showToast(
      `Received ${quantity.toLocaleString()} units of "${flyer?.name || 'Flyer'}" into central warehouse stock!`
    );
  };

  const handleRecordDepletion = (deliveryId: string, depletedDate: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, depletedDate } : d))
    );
    showToast(`Recorded stockout on ${depletedDate}. Burn rate and usage time lapse re-calculated!`);
  };

  const handleRecordNewRequest = (deliveryId: string, newRequestDate: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, newRequestDate } : d))
    );
    showToast(`Recorded new replenishment request date (${newRequestDate}). Time lapse updated!`);
  };

  const handleAddFair = (newFair: Omit<TourismFair, 'id'>) => {
    // Strict warehouse stock dependency check for all fair items
    for (const item of newFair.items) {
      const available = warehouseStockMap[item.flyerTypeId] ?? 0;
      if (item.quantitySpent > available) {
        const fl = flyers.find((f) => f.id === item.flyerTypeId);
        showToast(
          `Cannot log tourism fair: Material "${fl?.name || item.flyerTypeId}" spent quantity (${item.quantitySpent.toLocaleString()}) exceeds warehouse balance (${available.toLocaleString()} available).`
        );
        return;
      }
    }

    const created: TourismFair = {
      ...newFair,
      id: `fair-${Date.now()}`,
    };
    setFairs((prev) => [created, ...prev]);
    showToast(`Recorded fair "${created.name}" with ${created.totalFlyersSpent.toLocaleString()} flyers spent from warehouse!`);
  };

  const handleDeleteFair = (id: string) => {
    setFairs((prev) => prev.filter((f) => f.id !== id));
    showToast('Removed fair record from inventory subtraction.');
  };

  const handleAddOtherDelivery = (newRecord: Omit<OtherDeliveryRecord, 'id'>) => {
    // Strict warehouse stock dependency check
    const available = warehouseStockMap[newRecord.flyerTypeId] ?? 0;
    const flyer = flyers.find((f) => f.id === newRecord.flyerTypeId);
    if (available <= 0) {
      showToast(
        `Cannot dispatch: Central warehouse stock is depleted (0 available for "${flyer?.name || 'this flyer'}").`
      );
      return;
    }
    if (newRecord.quantity > available) {
      showToast(
        `Cannot dispatch: Requested ${newRecord.quantity.toLocaleString()} units exceeds warehouse balance (${available.toLocaleString()} available).`
      );
      return;
    }

    const padNum = (otherDeliveries.length + 1).toString().padStart(3, '0');
    const created: OtherDeliveryRecord = {
      ...newRecord,
      id: `od-${Date.now()}`,
      ref: `OD-2026-${padNum}`,
    };
    setOtherDeliveries((prev) => [created, ...prev]);
    showToast(`Logged delivery "${newRecord.title}" (${newRecord.quantity.toLocaleString()} ${flyer?.name} from warehouse)!`);
  };

  const handleDeleteOtherDelivery = (id: string) => {
    setOtherDeliveries((prev) => prev.filter((od) => od.id !== id));
    showToast('Removed delivery record.');
  };

  // Called when user clicks "Log Deliveries" inside the Email Notice Modal
  const handleEmailLoggedDeliveries = (
    newDels: Array<{
      officeId: string;
      flyerTypeId: string;
      quantityDelivered: number;
      date: string;
      courier: string;
      notes: string;
    }>
  ) => {
    const createdList: DeliveryRecord[] = newDels.map((nd, idx) => {
      const padNum = (deliveries.length + idx + 1).toString().padStart(3, '0');
      const dateFormatted = nd.date.replace(/-/g, '').slice(4);
      return {
        ...nd,
        id: `del-${Date.now()}-${idx}`,
        deliveryRef: `DEL-2026-${dateFormatted}-${padNum}`,
      };
    });

    setDeliveries((prev) => [...createdList, ...prev]);
    showToast(`Created ${createdList.length} delivery record(s) matching the email dispatch notification!`);
  };

  const handleAddDeliveryDirectRow = () => {
    if (flyers.length === 0) {
      showToast('Please add at least one flyer publication before creating delivery rows.');
      setIsAddFlyerModalOpen(true);
      return;
    }
    const padNum = (deliveries.length + 1).toString().padStart(3, '0');
    const newDelivery: DeliveryRecord = {
      id: `del-${Date.now()}`,
      deliveryRef: `CIRCUIT-2026-${padNum}`,
      date: TODAY_STR,
      officeId: offices[0]?.id || 'off-1',
      flyerTypeId: flyers[0]?.id || 'flyer-1',
      quantityDelivered: 500,
      courier: 'Carris / CTT Express',
      notes: '',
    };
    setDeliveries((prev) => [newDelivery, ...prev]);
    showToast(`Added new delivery row "${newDelivery.deliveryRef}" directly to the spreadsheet!`);
  };

  const handleUpdateDelivery = (deliveryId: string, patch: Partial<DeliveryRecord>) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...patch } : d))
    );
    showToast('Updated delivery record in spreadsheet.');
  };

  const handleDeleteDelivery = (deliveryId: string) => {
    setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
    showToast('Removed delivery record.');
  };

  const handleUpdateFair = (fairId: string, patch: Partial<TourismFair>) => {
    setFairs((prev) =>
      prev.map((f) => (f.id === fairId ? { ...f, ...patch } : f))
    );
    showToast('Updated tourism fair record.');
  };

  const handleUpdateOtherDelivery = (recordId: string, patch: Partial<OtherDeliveryRecord>) => {
    setOtherDeliveries((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, ...patch } : r))
    );
    showToast('Updated other delivery record.');
  };

  const handleUpdateFlyerDirect = (flyerId: string, patch: Partial<FlyerType>) => {
    setFlyers((prev) =>
      prev.map((f) => (f.id === flyerId ? { ...f, ...patch } : f))
    );
    showToast('Updated flyer information.');
  };

  const handleQuickUpdateFlyerStock = (flyerId: string, targetStock: number) => {
    handleUpdateFlyerStock(flyerId, targetStock, {}, 'Direct Excel cell adjustment');
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset application to a clean slate (empty flyers and records ready for your data)?')) {
      setFlyers([]);
      setDeliveries([]);
      setBatches([]);
      setFairs([]);
      setOtherDeliveries([]);
      showToast('Application reset to a clean state. Ready for your flyer information!');
    }
  };

  // If user scanned the Tourism Office permanent QR code on a mobile phone, render the auto-validation mobile screen
  if (mobileValidationOffice) {
    return (
      <MobileOfficeValidationView
        officeCode={mobileValidationOffice.code}
        officeId={mobileValidationOffice.id}
        offices={offices}
        flyers={flyers}
        deliveries={deliveries}
        onConfirmDelivery={handleConfirmDelivery}
        onEnterPortal={() => {
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          setMobileValidationOffice(null);
        }}
      />
    );
  }

  // If user is not authenticated, render the Enterprise Login Enter Page
  if (!session) {
    return (
      <EnterLoginPage
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          showToast(`Welcome, ${newSession.user.name}! Secure session started.`);
        }}
      />
    );
  }

  return (
    <div
      id="main-app-shell"
      className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="main-app-toast"
          className="fixed bottom-5 right-5 z-50 bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 print:hidden"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <div id="main-app-navbar" className="print:hidden">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewDelivery={() => handleOpenNewDelivery()}
          onOpenAddStock={() => handleOpenAddStock()}
          onOpenDepletionModal={() => handleOpenDepletionModal()}
          onOpenEmailModal={() => handleOpenEmailModal()}
          onOpenUploadExcel={handleOpenUploadExcel}
          onOpenAddFlyer={handleOpenAddFlyer}
          onOpenOfficesDirectory={handleOpenOfficesDirectory}
          onResetDemoData={handleResetDemoData}
          currentUser={session.user}
          onLogout={handleLogout}
          onOpenChangePassword={() => handleOpenUserManagement('change_password')}
          onOpenUserManagement={handleOpenUserManagement}
          flyers={flyers}
          offices={offices}
          deliveries={deliveries}
          batches={batches}
          fairs={fairs}
          otherDeliveries={otherDeliveries}
          depletedCount={depletedCount}
          criticalCount={criticalCount}
          metricOverrides={metricOverrides}
        />
      </div>

      {/* Main View Container */}
      <main
        id="main-app-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full pb-10 print:hidden"
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            flyers={flyers}
            offices={offices}
            deliveries={deliveries}
            batches={batches}
            fairs={fairs}
            otherDeliveries={otherDeliveries}
            metricOverrides={metricOverrides}
            onOpenNewDelivery={handleOpenNewDelivery}
            onOpenAddStock={handleOpenAddStock}
            onMarkDepleted={handleOpenDepletionModal}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenUploadExcel={handleOpenUploadExcel}
            onOpenAddFlyer={handleOpenAddFlyer}
            onOpenEditFlyerStock={handleOpenEditFlyerStock}
            onOpenOfficesDirectory={handleOpenOfficesDirectory}
          />
        )}

        {activeTab === 'spreadsheet' && (
          <ExcelSheetView
            flyers={flyers}
            offices={offices}
            deliveries={deliveries}
            batches={batches}
            fairs={fairs}
            otherDeliveries={otherDeliveries}
            metricOverrides={metricOverrides}
            onUpdateMetricOverride={handleUpdateMetricOverride}
            onResetMetricOverride={handleResetMetricOverride}
            onOpenNewDelivery={() => handleOpenNewDelivery()}
            onOpenAddStock={() => handleOpenAddStock()}
            onMarkDepleted={handleOpenDepletionModal}
            onOpenUploadExcel={handleOpenUploadExcel}
            onOpenAddFlyer={handleOpenAddFlyer}
            onOpenEditFlyerStock={handleOpenEditFlyerStock}
            onUpdateDelivery={handleUpdateDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onAddDeliveryRow={handleAddDeliveryDirectRow}
            onAddFair={handleAddFair}
            onUpdateFair={handleUpdateFair}
            onDeleteFair={handleDeleteFair}
            onAddOtherDelivery={handleAddOtherDelivery}
            onUpdateOtherDelivery={handleUpdateOtherDelivery}
            onDeleteOtherDelivery={handleDeleteOtherDelivery}
            onUpdateFlyer={handleUpdateFlyerDirect}
            onQuickUpdateFlyerStock={handleQuickUpdateFlyerStock}
            onUpdateOffice={handleUpdateOffice}
            onAddOffice={handleAddOffice}
            onDeleteOffice={handleDeleteOffice}
          />
        )}

        {activeTab === 'depletion' && (
          <DepletionTrackerView
            flyers={flyers}
            offices={offices}
            deliveries={deliveries}
            metricOverrides={metricOverrides}
            onUpdateMetricOverride={handleUpdateMetricOverride}
            onResetMetricOverride={handleResetMetricOverride}
            onOpenNewDelivery={handleOpenNewDelivery}
            onMarkDepleted={handleOpenDepletionModal}
            onRecordNewRequest={handleRecordNewRequest}
            onOpenEmailModal={handleOpenEmailModal}
          />
        )}

        {activeTab === 'fairs' && (
          <TourismFairsView
            fairs={fairs}
            flyers={flyers}
            onAddFair={handleAddFair}
            onUpdateFair={handleUpdateFair}
            onDeleteFair={handleDeleteFair}
          />
        )}

        {activeTab === 'other_deliveries' && (
          <OtherDeliveriesView
            records={otherDeliveries}
            flyers={flyers}
            onAddRecord={handleAddOtherDelivery}
            onUpdateRecord={handleUpdateOtherDelivery}
            onDeleteRecord={handleDeleteOtherDelivery}
          />
        )}

        {activeTab === 'offices' && (
          <TourismOfficesHubView
            offices={offices}
            flyers={flyers}
            deliveries={deliveries}
            warehouseStockMap={warehouseStockMap}
            onAddDelivery={handleCreateDelivery}
            onUpdateDelivery={handleUpdateDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onConfirmDelivery={handleConfirmDelivery}
            onOpenPrintSlip={handleOpenPrintSlip}
            onOpenSignatureModal={handleOpenSignatureModal}
            onOpenEditOffice={(office) => {
              setIsOfficeContactsModalOpen(true);
            }}
            onUpdateOffice={handleUpdateOffice}
            onAddOffice={handleAddOffice}
            onDeleteOffice={handleDeleteOffice}
            onComposeEmail={handleOpenEmailModal}
            onOpenAddStock={handleOpenAddStock}
          />
        )}
      </main>

      {/* Black Base Institutional Footer with Official Castle Logo & Metrics */}
      <div id="main-app-footer" className="print:hidden">
        <Footer
          currentUser={session.user}
          onLogout={handleLogout}
          onOpenChangePassword={() => handleOpenUserManagement('change_password')}
          flyers={flyers}
          offices={offices}
          deliveries={deliveries}
        />
      </div>

      {/* Modals */}
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSubmit={handleCreateDelivery}
        offices={offices}
        flyers={flyers}
        preselectedOfficeId={deliveryPreselect.officeId}
        preselectedFlyerTypeId={deliveryPreselect.flyerTypeId}
        defaultQty={deliveryPreselect.qty}
        warehouseStockMap={warehouseStockMap}
        onQuickReceiveStock={handleQuickReceiveStock}
      />

      <StockInModal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        onSubmit={handleCreateStockBatch}
        flyers={flyers}
        preselectedFlyerTypeId={stockInPreselectFlyer}
      />

      <DepletionLogModal
        isOpen={isDepletionModalOpen}
        onClose={() => setIsDepletionModalOpen(false)}
        onSubmit={handleRecordDepletion}
        offices={offices}
        flyers={flyers}
        deliveries={deliveries}
        targetOfficeId={depletionPreselect.officeId}
        targetFlyerTypeId={depletionPreselect.flyerTypeId}
      />

      <EmailDispatchNoticeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        offices={offices}
        flyers={flyers}
        preselectedOfficeId={emailPreselectedOfficeId}
        onLogDeliveries={handleEmailLoggedDeliveries}
        onUpdateOffice={handleUpdateOffice}
        onOpenManageOffices={handleOpenOfficesDirectory}
      />

      {/* Tourism Offices & Contacts Directory Modal */}
      <OfficeContactsModal
        isOpen={isOfficeContactsModalOpen}
        onClose={() => setIsOfficeContactsModalOpen(false)}
        offices={offices}
        onUpdateOffice={handleUpdateOffice}
        onAddOffice={handleAddOffice}
        onDeleteOffice={handleDeleteOffice}
      />

      {/* Upload Excel Stock Modal */}
      <ExcelUploadModal
        isOpen={isUploadExcelModalOpen}
        onClose={() => setIsUploadExcelModalOpen(false)}
        flyers={flyers}
        batches={batches}
        deliveries={deliveries}
        fairs={fairs}
        otherDeliveries={otherDeliveries}
        warehouseStockMap={warehouseStockMap}
        onApplyImport={handleApplyExcelImport}
      />

      {/* Add New Flyer Modal */}
      <AddFlyerModal
        isOpen={isAddFlyerModalOpen}
        onClose={() => setIsAddFlyerModalOpen(false)}
        onAddFlyer={handleAddFlyer}
      />

      {/* Edit Flyer & Adjust Stock Modal */}
      <EditFlyerStockModal
        isOpen={isEditFlyerModalOpen}
        onClose={() => {
          setIsEditFlyerModalOpen(false);
          setEditingFlyerId(null);
        }}
        flyer={flyers.find((f) => f.id === editingFlyerId) || null}
        currentWarehouseStock={editingFlyerId ? (warehouseStockMap[editingFlyerId] ?? 0) : 0}
        onUpdateFlyerStock={handleUpdateFlyerStock}
        onDeleteFlyer={handleDeleteFlyer}
      />

      {/* Printable Delivery Archive Voucher Modal */}
      {archiveSlipDelivery && archiveSlipOffice && archiveSlipFlyer && (
        <PrintableDeliveryArchiveModal
          isOpen={isArchiveSlipOpen}
          onClose={() => {
            setIsArchiveSlipOpen(false);
            setArchiveSlipDelivery(null);
          }}
          delivery={archiveSlipDelivery}
          office={archiveSlipOffice}
          flyer={archiveSlipFlyer}
          offices={offices}
          flyers={flyers}
          onConfirmDelivery={handleConfirmDelivery}
          onOpenSignatureModal={handleOpenSignatureModal}
          onUpdateDelivery={(deliveryId, patch) => {
            handleUpdateDelivery(deliveryId, patch);
            setArchiveSlipDelivery((prev) => (prev && prev.id === deliveryId ? { ...prev, ...patch } : prev));
            if (patch.officeId) {
              const matchedOff = offices.find((o) => o.id === patch.officeId);
              if (matchedOff) setArchiveSlipOffice(matchedOff);
            }
            if (patch.flyerTypeId) {
              const matchedFl = flyers.find((f) => f.id === patch.flyerTypeId);
              if (matchedFl) setArchiveSlipFlyer(matchedFl);
            }
          }}
        />
      )}

      {/* Digital Signature Modal (Signable on Tablets, iPads, Touchscreens & PCs) */}
      {signatureDelivery && signatureOffice && signatureFlyer && (
        <DigitalSignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSignatureDelivery(null);
            setSignatureOffice(null);
            setSignatureFlyer(null);
          }}
          delivery={signatureDelivery}
          office={signatureOffice}
          flyer={signatureFlyer}
          pendingOfficeDeliveries={deliveries.filter(
            (d) => d.officeId === signatureOffice.id && d.confirmationStatus !== 'confirmed'
          )}
          onSaveSignature={handleSaveDigitalSignature}
          onOpenPrintSlip={(del, off, fl) => {
            handleOpenPrintSlip(del, off, fl);
          }}
        />
      )}

      {/* User Accounts & Password Security Administration Modal */}
      {session && (
        <UserManagementModal
          currentUser={session.user}
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          onSuccessToast={(msg) => {
            showToast(msg);
          }}
          initialTab={userModalTab}
        />
      )}
    </div>
  );
}

