import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ExcelSheetView } from './components/ExcelSheetView';
import { DepletionTrackerView } from './components/DepletionTrackerView';
import { TourismFairsView } from './components/TourismFairsView';
import { OtherDeliveriesView } from './components/OtherDeliveriesView';
import { TourismOfficesHubView } from './components/TourismOfficesHubView';
import { PrintableDeliveryArchiveModal } from './components/PrintableDeliveryArchiveModal';
import { OfficeQRCodeScannerModal } from './components/OfficeQRCodeScannerModal';
import { DeliveryModal } from './components/DeliveryModal';
import { StockInModal } from './components/StockInModal';
import { DepletionLogModal } from './components/DepletionLogModal';
import { EmailDispatchNoticeModal } from './components/EmailDispatchNoticeModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { AddFlyerModal } from './components/AddFlyerModal';
import { EditFlyerStockModal } from './components/EditFlyerStockModal';
import { OfficeContactsModal } from './components/OfficeContactsModal';
import { EnterLoginPage } from './components/EnterLoginPage';
import { ChangePasswordModal } from './components/ChangePasswordModal';
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
  FLYERS: 'flyerstock_flyers_v2',
  OFFICES: 'flyerstock_offices_v2',
  DELIVERIES: 'flyerstock_deliveries_v2',
  BATCHES: 'flyerstock_batches_v2',
  FAIRS: 'flyerstock_fairs_v2',
  OTHER_DELIVERIES: 'flyerstock_other_deliveries_v2',
};

export default function App() {
  // Load persistent state or fallback to rich initial data
  const [flyers, setFlyers] = useState<FlyerType[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLYERS);
    return saved ? JSON.parse(saved) : INITIAL_FLYER_TYPES;
  });

  const [offices, setOffices] = useState<TourismOffice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFICES);
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
    const parsed: DeliveryRecord[] = saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
    const hasHqDeliveries = parsed.some((d) => d.officeId === 'off-headquarters-ahp');
    if (!hasHqDeliveries) {
      const hqDeliveries = INITIAL_DELIVERIES.filter((d) => d.officeId === 'off-headquarters-ahp');
      return [...parsed, ...hqDeliveries];
    }
    return parsed;
  });

  const [batches, setBatches] = useState<StockInBatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [fairs, setFairs] = useState<TourismFair[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAIRS);
    return saved ? JSON.parse(saved) : INITIAL_FAIRS;
  });

  const [otherDeliveries, setOtherDeliveries] = useState<OtherDeliveryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OTHER_DELIVERIES);
    return saved ? JSON.parse(saved) : INITIAL_OTHER_DELIVERIES;
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
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    showToast('Sessão terminada. Acesso seguro bloqueado.');
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

  // Digital Delivery QR Confirmation & Printable Archive Slip Modals
  const [isArchiveSlipOpen, setIsArchiveSlipOpen] = useState(false);
  const [archiveSlipDelivery, setArchiveSlipDelivery] = useState<DeliveryRecord | null>(null);
  const [archiveSlipOffice, setArchiveSlipOffice] = useState<TourismOffice | null>(null);
  const [archiveSlipFlyer, setArchiveSlipFlyer] = useState<FlyerType | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerOffice, setScannerOffice] = useState<TourismOffice | null>(null);

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
    setDeliveryPreselect({ officeId, flyerTypeId, qty: defaultQty });
    setIsDeliveryModalOpen(true);
  };

  const handleOpenAddStock = (flyerTypeId?: string) => {
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

  const handleOpenPrintSlip = (delivery: DeliveryRecord, office?: TourismOffice, flyer?: FlyerType) => {
    const targetOffice = office || offices.find((o) => o.id === delivery.officeId) || offices[0];
    const targetFlyer = flyer || flyers.find((f) => f.id === delivery.flyerTypeId) || flyers[0];
    setArchiveSlipDelivery(delivery);
    setArchiveSlipOffice(targetOffice);
    setArchiveSlipFlyer(targetFlyer);
    setIsArchiveSlipOpen(true);
  };

  const handleOpenScanner = (office: TourismOffice) => {
    setScannerOffice(office);
    setIsScannerOpen(true);
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
    const flyer = flyers.find((f) => f.id === newDelivery.flyerTypeId);
    showToast(
      `Dispatched ${newDelivery.quantityDelivered.toLocaleString()} "${flyer?.name}" flyers to ${office?.name}!`
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
    const created: TourismFair = {
      ...newFair,
      id: `fair-${Date.now()}`,
    };
    setFairs((prev) => [created, ...prev]);
    showToast(`Recorded fair "${created.name}" with ${created.totalFlyersSpent.toLocaleString()} flyers spent!`);
  };

  const handleDeleteFair = (id: string) => {
    setFairs((prev) => prev.filter((f) => f.id !== id));
    showToast('Removed fair record from inventory subtraction.');
  };

  const handleAddOtherDelivery = (newRecord: Omit<OtherDeliveryRecord, 'id'>) => {
    const padNum = (otherDeliveries.length + 1).toString().padStart(3, '0');
    const created: OtherDeliveryRecord = {
      ...newRecord,
      id: `od-${Date.now()}`,
      ref: `OD-2026-${padNum}`,
    };
    setOtherDeliveries((prev) => [created, ...prev]);
    const flyer = flyers.find((f) => f.id === newRecord.flyerTypeId);
    showToast(`Logged delivery "${newRecord.title}" (${newRecord.quantity.toLocaleString()} ${flyer?.name})!`);
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
    if (window.confirm('Reset all flyers, deliveries, tourism fairs, and non-circuit records back to sample demo state?')) {
      setFlyers(INITIAL_FLYER_TYPES);
      setOffices(INITIAL_OFFICES);
      setDeliveries(INITIAL_DELIVERIES);
      setBatches(INITIAL_BATCHES);
      setFairs(INITIAL_FAIRS);
      setOtherDeliveries(INITIAL_OTHER_DELIVERIES);
      showToast('Reset to default demonstration data.');
    }
  };

  // If user is not authenticated, render the Enterprise Login Enter Page
  if (!session) {
    return (
      <EnterLoginPage
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          showToast(`Bem-vindo, ${newSession.user.name}! Sessão iniciada com segurança.`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
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
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
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

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
            onAddDelivery={handleCreateDelivery}
            onUpdateDelivery={handleUpdateDelivery}
            onDeleteDelivery={handleDeleteDelivery}
            onConfirmDelivery={handleConfirmDelivery}
            onOpenPrintSlip={handleOpenPrintSlip}
            onOpenScanner={handleOpenScanner}
            onOpenEditOffice={(office) => {
              setIsOfficeContactsModalOpen(true);
            }}
            onUpdateOffice={handleUpdateOffice}
            onAddOffice={handleAddOffice}
            onDeleteOffice={handleDeleteOffice}
            onComposeEmail={handleOpenEmailModal}
          />
        )}
      </main>

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

      {/* Tourism Office QR Code Scanner & Reader Modal */}
      {scannerOffice && (
        <OfficeQRCodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setScannerOffice(null);
          }}
          office={scannerOffice}
          pendingDeliveries={deliveries.filter(
            (d) => d.officeId === scannerOffice.id && d.confirmationStatus !== 'confirmed'
          )}
          allDeliveries={deliveries.filter((d) => d.officeId === scannerOffice.id)}
          flyers={flyers}
          onConfirmDelivery={handleConfirmDelivery}
          onOpenPrintSlip={(del) => {
            const fl = flyers.find((f) => f.id === del.flyerTypeId) || flyers[0];
            handleOpenPrintSlip(del, scannerOffice, fl);
          }}
        />
      )}

      {/* Change Password Modal */}
      {session && (
        <ChangePasswordModal
          user={session.user}
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={() => {
            showToast('Palavra-passe atualizada com sucesso!');
          }}
        />
      )}
    </div>
  );
}

