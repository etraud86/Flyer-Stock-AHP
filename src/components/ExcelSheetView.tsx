import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Plus,
  Check,
  Upload,
  Sliders,
  Calendar,
  CalendarDays,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  RotateCcw,
  Share2,
  Flame,
  Tag,
  Compass,
  Building,
} from 'lucide-react';
import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  OtherDeliveryCategory,
  OfficeFlyerMetricOverride,
} from '../types';
import { computeOfficeFlyerMetrics, computeWarehouseStock, getDaysDiff, TODAY_STR } from '../utils/calculations';
import { exportToExcelWorkbook } from '../utils/excelExport';

interface ExcelSheetViewProps {
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs?: TourismFair[];
  otherDeliveries?: OtherDeliveryRecord[];
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
  onUpdateMetricOverride?: (key: string, override: Partial<OfficeFlyerMetricOverride>) => void;
  onResetMetricOverride?: (key: string) => void;
  onOpenNewDelivery: () => void;
  onOpenAddStock: () => void;
  onMarkDepleted: (officeId: string, flyerTypeId: string) => void;
  onOpenUploadExcel?: () => void;
  onOpenAddFlyer?: () => void;
  onOpenEditFlyerStock?: (flyerId: string) => void;
  onUpdateDelivery?: (deliveryId: string, patch: Partial<DeliveryRecord>) => void;
  onDeleteDelivery?: (deliveryId: string) => void;
  onAddDeliveryRow?: () => void;
  onAddFair?: (fair: Omit<TourismFair, 'id'>) => void;
  onUpdateFair?: (fairId: string, patch: Partial<TourismFair>) => void;
  onDeleteFair?: (fairId: string) => void;
  onAddOtherDelivery?: (record: Omit<OtherDeliveryRecord, 'id'>) => void;
  onUpdateOtherDelivery?: (recordId: string, patch: Partial<OtherDeliveryRecord>) => void;
  onDeleteOtherDelivery?: (recordId: string) => void;
  onUpdateFlyer?: (flyerId: string, patch: Partial<FlyerType>) => void;
  onQuickUpdateFlyerStock?: (flyerId: string, targetStock: number) => void;
  onUpdateOffice?: (officeId: string, patch: Partial<TourismOffice>) => void;
  onAddOffice?: (office: Omit<TourismOffice, 'id'>) => void;
  onDeleteOffice?: (officeId: string) => void;
}

type SheetName = 'deliveries' | 'fairs' | 'other_deliveries' | 'stock' | 'depletion' | 'offices' | 'summary';

interface ActiveCell {
  row: number;
  col: number;
  ref: string;
  formula: string;
  value: string;
  field?: string;
  recordId?: string;
  sheet?: SheetName;
  isEditable?: boolean;
}

export const ExcelSheetView: React.FC<ExcelSheetViewProps> = ({
  flyers,
  offices,
  deliveries,
  batches,
  fairs = [],
  otherDeliveries = [],
  metricOverrides = {},
  onUpdateMetricOverride,
  onResetMetricOverride,
  onOpenNewDelivery,
  onOpenAddStock,
  onMarkDepleted,
  onOpenUploadExcel,
  onOpenAddFlyer,
  onOpenEditFlyerStock,
  onUpdateDelivery,
  onDeleteDelivery,
  onAddDeliveryRow,
  onAddFair,
  onUpdateFair,
  onDeleteFair,
  onAddOtherDelivery,
  onUpdateOtherDelivery,
  onDeleteOtherDelivery,
  onUpdateFlyer,
  onQuickUpdateFlyerStock,
  onUpdateOffice,
  onAddOffice,
  onDeleteOffice,
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetName>('deliveries');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  // Selected cell & formula bar state
  const [selectedCell, setSelectedCell] = useState<ActiveCell>({
    row: 1,
    col: 1,
    ref: 'A1',
    formula: 'Delivery Ref',
    value: 'Delivery Ref',
  });
  const [formulaBarInput, setFormulaBarInput] = useState<string>('Delivery Ref');

  // Inline editing state for arbitrary cells
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Modals state for customizing Tourism Fairs directly in Grid
  const [isFairModalOpen, setIsFairModalOpen] = useState(false);
  const [editingFairId, setEditingFairId] = useState<string | null>(null);
  const [fairName, setFairName] = useState('');
  const [fairCity, setFairCity] = useState('');
  const [fairCountry, setFairCountry] = useState('Portugal');
  const [fairStartDate, setFairStartDate] = useState(TODAY_STR);
  const [fairEndDate, setFairEndDate] = useState(TODAY_STR);
  const [fairStandNumber, setFairStandNumber] = useState('');
  const [fairAttendingStaff, setFairAttendingStaff] = useState('');
  const [fairNotes, setFairNotes] = useState('');
  const [fairQuantities, setFairQuantities] = useState<Record<string, { taken: number; returned: number }>>({});

  // Modals state for customizing Other Deliveries directly in Grid
  const [isOtherDeliveryModalOpen, setIsOtherDeliveryModalOpen] = useState(false);
  const [editingOtherDeliveryId, setEditingOtherDeliveryId] = useState<string | null>(null);
  const [odDate, setOdDate] = useState(TODAY_STR);
  const [odCategory, setOdCategory] = useState<OtherDeliveryCategory>('historical_village_office');
  const [odTitle, setOdTitle] = useState('');
  const [odFlyerId, setOdFlyerId] = useState(flyers[0]?.id || '');
  const [odQuantity, setOdQuantity] = useState(250);
  const [odDeliveredBy, setOdDeliveredBy] = useState('Miguel Silva (Heritage Office)');
  const [odRecipient, setOdRecipient] = useState('');
  const [odNotes, setOdNotes] = useState('');

  useEffect(() => {
    if (editingCellKey && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingCellKey]);

  // Calculations with overrides
  const stockSummary = computeWarehouseStock(flyers, deliveries, batches, fairs, otherDeliveries);
  const metrics = computeOfficeFlyerMetrics(offices, flyers, deliveries, TODAY_STR, 21, metricOverrides);

  const notifyChange = (msg: string) => {
    setLastSavedMessage(msg);
    setTimeout(() => {
      setLastSavedMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Helper to convert index to column letter (0 -> A, 1 -> B, etc.)
  const getColLetter = (index: number) => String.fromCharCode(65 + index);

  const handleCellClick = (
    row: number,
    col: number,
    formula: string,
    value: string,
    meta?: { field?: string; recordId?: string; isEditable?: boolean; sheet?: string }
  ) => {
    const colLetter = getColLetter(col);
    const cellRef = `${colLetter}${row + 1}`;
    setSelectedCell({
      row: row + 1,
      col: col + 1,
      ref: cellRef,
      formula,
      value,
      sheet: meta?.sheet || activeSheet,
      ...meta,
    });
    setFormulaBarInput(formula || value);
  };

  // Modal openers and submitters for Fairs
  const handleOpenAddFair = () => {
    setEditingFairId(null);
    setFairName('');
    setFairCity('Lisbon');
    setFairCountry('Portugal');
    setFairStartDate(TODAY_STR);
    setFairEndDate(TODAY_STR);
    setFairStandNumber('Stand A-12');
    setFairAttendingStaff('Rita Gomes (Promotion Team)');
    setFairNotes('');
    const initialQty: Record<string, { taken: number; returned: number }> = {};
    flyers.forEach((fl) => {
      initialQty[fl.id] = { taken: 150, returned: 0 };
    });
    setFairQuantities(initialQty);
    setIsFairModalOpen(true);
  };

  const handleOpenEditFair = (fair: TourismFair) => {
    setEditingFairId(fair.id);
    setFairName(fair.name);
    setFairCity(fair.city);
    setFairCountry(fair.country);
    setFairStartDate(fair.startDate);
    setFairEndDate(fair.endDate);
    setFairStandNumber(fair.standNumber || '');
    setFairAttendingStaff(fair.attendingStaff || '');
    setFairNotes(fair.notes || '');
    const currentQty: Record<string, { taken: number; returned: number }> = {};
    flyers.forEach((fl) => {
      const match = fair.items.find((it) => it.flyerTypeId === fl.id);
      currentQty[fl.id] = {
        taken: match?.quantityTaken || 0,
        returned: match?.quantityReturned || 0,
      };
    });
    setFairQuantities(currentQty);
    setIsFairModalOpen(true);
  };

  const handleSubmitFair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fairName.trim()) return;

    const items = flyers
      .map((fl) => {
        const q = fairQuantities[fl.id] || { taken: 0, returned: 0 };
        const taken = Number(q.taken) || 0;
        const returned = Number(q.returned) || 0;
        return {
          flyerTypeId: fl.id,
          quantityTaken: taken,
          quantityReturned: returned,
          quantitySpent: Math.max(0, taken - returned),
        };
      })
      .filter((it) => it.quantityTaken > 0 || it.quantityReturned > 0);

    const totalSpent = items.reduce((sum, it) => sum + it.quantitySpent, 0);

    if (editingFairId && onUpdateFair) {
      onUpdateFair(editingFairId, {
        name: fairName,
        city: fairCity,
        country: fairCountry,
        startDate: fairStartDate,
        endDate: fairEndDate,
        standNumber: fairStandNumber,
        attendingStaff: fairAttendingStaff,
        notes: fairNotes,
        items,
        totalFlyersSpent: totalSpent,
      });
      notifyChange(`Updated tourism fair "${fairName}"`);
    } else if (onAddFair) {
      onAddFair({
        name: fairName,
        city: fairCity,
        country: fairCountry,
        startDate: fairStartDate,
        endDate: fairEndDate,
        standNumber: fairStandNumber,
        attendingStaff: fairAttendingStaff,
        notes: fairNotes,
        items,
        totalFlyersSpent: totalSpent,
      });
      notifyChange(`Created tourism fair "${fairName}"`);
    }

    setIsFairModalOpen(false);
  };

  // Modal openers and submitters for Other Deliveries
  const handleOpenAddOtherDelivery = () => {
    setEditingOtherDeliveryId(null);
    setOdDate(TODAY_STR);
    setOdCategory('historical_village_office');
    setOdTitle('');
    setOdFlyerId(flyers[0]?.id || '');
    setOdQuantity(250);
    setOdDeliveredBy('Miguel Silva (Heritage Office)');
    setOdRecipient('Historical Village Reception Desk (Direct Walk-in Visitors)');
    setOdNotes('');
    setIsOtherDeliveryModalOpen(true);
  };

  const handleOpenEditOtherDelivery = (od: OtherDeliveryRecord) => {
    setEditingOtherDeliveryId(od.id);
    setOdDate(od.date);
    setOdCategory(od.category);
    setOdTitle(od.title);
    setOdFlyerId(od.flyerTypeId);
    setOdQuantity(od.quantity);
    setOdDeliveredBy(od.deliveredBy);
    setOdRecipient(od.recipientOrGroup);
    setOdNotes(od.notes || '');
    setIsOtherDeliveryModalOpen(true);
  };

  const handleSubmitOtherDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!odTitle.trim() || odQuantity <= 0) return;

    if (editingOtherDeliveryId && onUpdateOtherDelivery) {
      onUpdateOtherDelivery(editingOtherDeliveryId, {
        date: odDate,
        category: odCategory,
        title: odTitle,
        flyerTypeId: odFlyerId,
        quantity: odQuantity,
        deliveredBy: odDeliveredBy,
        recipientOrGroup: odRecipient,
        notes: odNotes,
      });
      notifyChange(`Updated non-circuit delivery "${odTitle}"`);
    } else if (onAddOtherDelivery) {
      const ref = `NOC-${odDate.replace(/-/g, '').substring(0, 8)}-${Math.floor(10 + Math.random() * 90)}`;
      onAddOtherDelivery({
        ref,
        date: odDate,
        category: odCategory,
        title: odTitle,
        flyerTypeId: odFlyerId,
        quantity: odQuantity,
        deliveredBy: odDeliveredBy,
        recipientOrGroup: odRecipient,
        notes: odNotes,
      });
      notifyChange(`Logged non-circuit delivery "${odTitle}"`);
    }

    setIsOtherDeliveryModalOpen(false);
  };

  const handleCommitFormulaBar = () => {
    if (!selectedCell.isEditable || !selectedCell.field || !selectedCell.recordId) {
      return;
    }
    const val = formulaBarInput.trim();
    applyCellUpdate(selectedCell.sheet || activeSheet, selectedCell.recordId, selectedCell.field, val);
  };

  const applyCellUpdate = (sheet: SheetName, recordId: string, field: string, value: string) => {
    if (sheet === 'deliveries' && onUpdateDelivery) {
      if (field === 'quantityDelivered') {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
          onUpdateDelivery(recordId, { quantityDelivered: num });
          notifyChange(`Updated quantity to ${num.toLocaleString()}`);
        }
      } else if (field === 'date') {
        onUpdateDelivery(recordId, { date: value });
        notifyChange(`Updated dispatch date to ${value}`);
      } else if (field === 'depletedDate') {
        onUpdateDelivery(recordId, { depletedDate: value || undefined });
        notifyChange(value ? `Set depleted date to ${value}` : 'Marked active in use');
      } else if (field === 'courier') {
        onUpdateDelivery(recordId, { courier: value });
        notifyChange(`Updated courier to "${value}"`);
      } else if (field === 'notes') {
        onUpdateDelivery(recordId, { notes: value });
        notifyChange(`Updated notes`);
      } else if (field === 'deliveryRef') {
        onUpdateDelivery(recordId, { deliveryRef: value });
        notifyChange(`Updated reference to ${value}`);
      } else if (field === 'officeId') {
        onUpdateDelivery(recordId, { officeId: value });
        const off = offices.find((o) => o.id === value);
        notifyChange(`Assigned to ${off?.name || 'office'}`);
      } else if (field === 'flyerTypeId') {
        onUpdateDelivery(recordId, { flyerTypeId: value });
        const fl = flyers.find((f) => f.id === value);
        notifyChange(`Assigned flyer: ${fl?.name || 'flyer'}`);
      } else if (field === 'customTimeLapseDays') {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          onUpdateDelivery(recordId, { customTimeLapseDays: num });
          notifyChange(`Customized usage time lapse to ${num} days`);
        } else {
          onUpdateDelivery(recordId, { customTimeLapseDays: undefined });
          notifyChange(`Reverted usage time lapse to calendar formula`);
        }
      } else if (field === 'customDailyBurnRate') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          onUpdateDelivery(recordId, { customDailyBurnRate: Math.round(num * 10) / 10 });
          notifyChange(`Customized daily burn rate to ${num} flyers/day`);
        } else {
          onUpdateDelivery(recordId, { customDailyBurnRate: undefined });
          notifyChange(`Reverted burn rate to formula`);
        }
      }
    } else if (sheet === 'depletion') {
      if (field === 'customAvgUsagePeriodDays') {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num > 0) {
          onUpdateMetricOverride?.(recordId, { customAvgUsagePeriodDays: num });
          notifyChange(`Customized average usage time lapse to ${num} days`);
        } else {
          onUpdateMetricOverride?.(recordId, { customAvgUsagePeriodDays: undefined });
          notifyChange(`Reverted usage time lapse to auto formula`);
        }
      } else if (field === 'customBurnRate') {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
          onUpdateMetricOverride?.(recordId, { customBurnRate: Math.round(num * 10) / 10 });
          notifyChange(`Customized daily burn rate to ${num} flyers/day`);
        } else {
          onUpdateMetricOverride?.(recordId, { customBurnRate: undefined });
          notifyChange(`Reverted burn rate to auto formula`);
        }
      } else if (field === 'customEstimatedStock') {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
          onUpdateMetricOverride?.(recordId, { customEstimatedStock: num });
          notifyChange(`Customized estimated stock on-hand to ${num.toLocaleString()}`);
        } else {
          onUpdateMetricOverride?.(recordId, { customEstimatedStock: undefined });
          notifyChange(`Reverted estimated stock to auto formula`);
        }
      }
    } else if (sheet === 'fairs' && onUpdateFair) {
      const fair = fairs.find((f) => f.id === recordId);
      if (fair) {
        if (field === 'name') {
          onUpdateFair(recordId, { name: value });
          notifyChange(`Updated fair name to "${value}"`);
        } else if (field === 'startDate') {
          onUpdateFair(recordId, { startDate: value });
          notifyChange(`Updated fair start date to ${value}`);
        } else if (field === 'endDate') {
          onUpdateFair(recordId, { endDate: value });
          notifyChange(`Updated fair end date to ${value}`);
        } else if (field === 'city') {
          onUpdateFair(recordId, { city: value });
          notifyChange(`Updated fair location to ${value}`);
        } else if (field === 'country') {
          onUpdateFair(recordId, { country: value });
          notifyChange(`Updated fair country to ${value}`);
        } else if (field === 'attendingStaff') {
          onUpdateFair(recordId, { attendingStaff: value });
          notifyChange(`Updated attending staff to "${value}"`);
        } else if (field === 'notes') {
          onUpdateFair(recordId, { notes: value });
          notifyChange(`Updated fair notes`);
        } else if (field.startsWith('itemTaken-')) {
          const flyerId = field.replace('itemTaken-', '');
          const qty = parseInt(value, 10) || 0;
          const updatedItems = fair.items.map((it) =>
            it.flyerTypeId === flyerId
              ? { ...it, quantityTaken: qty, quantitySpent: Math.max(0, qty - it.quantityReturned) }
              : it
          );
          onUpdateFair(recordId, { items: updatedItems });
          notifyChange(`Updated taken quantity to ${qty}`);
        } else if (field.startsWith('itemReturned-')) {
          const flyerId = field.replace('itemReturned-', '');
          const qty = parseInt(value, 10) || 0;
          const updatedItems = fair.items.map((it) =>
            it.flyerTypeId === flyerId
              ? { ...it, quantityReturned: qty, quantitySpent: Math.max(0, it.quantityTaken - qty) }
              : it
          );
          onUpdateFair(recordId, { items: updatedItems });
          notifyChange(`Updated returned quantity to ${qty}`);
        }
      }
    } else if (sheet === 'other_deliveries' && onUpdateOtherDelivery) {
      if (field === 'ref') {
        onUpdateOtherDelivery(recordId, { ref: value });
        notifyChange(`Updated ref code to "${value}"`);
      } else if (field === 'date') {
        onUpdateOtherDelivery(recordId, { date: value });
        notifyChange(`Updated date to ${value}`);
      } else if (field === 'quantity') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          onUpdateOtherDelivery(recordId, { quantity: num });
          notifyChange(`Updated quantity to ${num.toLocaleString()}`);
        }
      } else if (field === 'title') {
        onUpdateOtherDelivery(recordId, { title: value });
        notifyChange(`Updated title to "${value}"`);
      } else if (field === 'deliveredBy') {
        onUpdateOtherDelivery(recordId, { deliveredBy: value });
        notifyChange(`Updated delivered by: "${value}"`);
      } else if (field === 'recipientOrGroup') {
        onUpdateOtherDelivery(recordId, { recipientOrGroup: value });
        notifyChange(`Updated recipient to "${value}"`);
      } else if (field === 'notes') {
        onUpdateOtherDelivery(recordId, { notes: value });
        notifyChange(`Updated delivery notes`);
      } else if (field === 'flyerTypeId') {
        onUpdateOtherDelivery(recordId, { flyerTypeId: value });
        const fl = flyers.find((f) => f.id === value);
        notifyChange(`Assigned flyer material: ${fl?.name || 'flyer'}`);
      } else if (field === 'category') {
        onUpdateOtherDelivery(recordId, { category: value as any });
        notifyChange(`Updated category to ${value}`);
      }
    } else if (sheet === 'stock') {
      if (field === 'currentStock' && onQuickUpdateFlyerStock) {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
          onQuickUpdateFlyerStock(recordId, num);
          notifyChange(`Updated warehouse stock on-hand to ${num.toLocaleString()}`);
        }
      } else if (field === 'minThreshold' && onUpdateFlyer) {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
          onUpdateFlyer(recordId, { minThreshold: num });
          notifyChange(`Updated minimum threshold to ${num.toLocaleString()}`);
        }
      } else if (field === 'name' && onUpdateFlyer) {
        onUpdateFlyer(recordId, { name: value });
        notifyChange(`Updated flyer title to "${value}"`);
      } else if (field === 'sku' && onUpdateFlyer) {
        onUpdateFlyer(recordId, { sku: value });
        notifyChange(`Updated SKU to "${value}"`);
      } else if (field === 'category' && onUpdateFlyer) {
        onUpdateFlyer(recordId, { category: value });
        notifyChange(`Updated category to "${value}"`);
      } else if (field === 'language' && onUpdateFlyer) {
        onUpdateFlyer(recordId, { language: value });
        notifyChange(`Updated language to "${value}"`);
      } else if (field === 'unitCost' && onUpdateFlyer) {
        const cost = parseFloat(value);
        if (!isNaN(cost) && cost >= 0) {
          onUpdateFlyer(recordId, { unitCost: cost });
          notifyChange(`Updated unit cost to €${cost.toFixed(2)}`);
        }
      }
    } else if (sheet === 'offices' && onUpdateOffice) {
      if (field === 'name') {
        onUpdateOffice(recordId, { name: value });
        notifyChange(`Updated office name to "${value}"`);
      } else if (field === 'code') {
        onUpdateOffice(recordId, { code: value });
        notifyChange(`Updated office code to "${value}"`);
      } else if (field === 'zone') {
        onUpdateOffice(recordId, { zone: value });
        notifyChange(`Updated zone to "${value}"`);
      } else if (field === 'footfallTier') {
        onUpdateOffice(recordId, { footfallTier: value as any });
        notifyChange(`Updated footfall tier to "${value}"`);
      } else if (field === 'contactPerson') {
        onUpdateOffice(recordId, { contactPerson: value });
        notifyChange(`Updated contact person to "${value}"`);
      } else if (field === 'email') {
        onUpdateOffice(recordId, { email: value });
        notifyChange(`Updated email to "${value}"`);
      } else if (field === 'phone') {
        onUpdateOffice(recordId, { phone: value });
        notifyChange(`Updated phone to "${value}"`);
      } else if (field === 'address') {
        onUpdateOffice(recordId, { address: value });
        notifyChange(`Updated address to "${value}"`);
      }
    }

    setEditingCellKey(null);
  };

  const handleExport = () => {
    exportToExcelWorkbook(flyers, offices, deliveries, batches, fairs, otherDeliveries, metricOverrides);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Interactive Excel Grid</span>
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Live In-App Editing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click directly on any date, quantity, office, or note cell to update it immediately. No VBA or external software needed.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 w-44 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {onOpenUploadExcel && (
            <button
              onClick={onOpenUploadExcel}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Upload Excel file to update flyer stock"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Excel</span>
            </button>
          )}

          <button
            onClick={onOpenNewDelivery}
            className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Delivery</span>
          </button>

          <button
            onClick={handleExport}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .XLSX</span>
          </button>
        </div>
      </div>

      {/* Real-time Save Confirmation Banner */}
      {lastSavedMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-md flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{lastSavedMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">Synchronized with App Ledger</span>
        </div>
      )}

      {/* Spreadsheet Formula & Cell Edit Bar */}
      <div className="bg-white rounded-lg border border-slate-300 p-1.5 flex items-center gap-2 shadow-xs text-xs font-mono">
        {/* Cell Coordinate Box */}
        <div className="bg-slate-100 border border-slate-300 px-3 py-1 rounded text-slate-700 font-bold min-w-[50px] text-center select-none">
          {selectedCell.ref}
        </div>

        {/* fx symbol */}
        <div className="text-slate-400 font-serif italic text-sm px-1 border-r border-slate-200 select-none">
          fx
        </div>

        {/* Formula Input / Direct Cell Editor */}
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={formulaBarInput}
            onChange={(e) => setFormulaBarInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommitFormulaBar();
              }
            }}
            placeholder="Select a cell or type a value / date here and press Enter..."
            className="w-full px-2 py-0.5 text-xs text-slate-800 font-mono focus:outline-none focus:bg-blue-50/50 rounded border border-transparent focus:border-blue-300"
          />
          {selectedCell.isEditable && (
            <button
              onClick={handleCommitFormulaBar}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              title="Apply change to selected cell"
            >
              <Check className="w-3 h-3" />
              <span>Apply</span>
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 font-sans border-l border-slate-200 pl-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any date cell to change</span>
        </div>
      </div>

      {/* Main Excel Grid Container */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        {/* Helper Hint Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Edit2 className="w-3 h-3 text-emerald-600" /> Direct Grid Editing:
            </span>
            <span>Click any date to pick a new date directly</span>
            <span className="text-slate-300">|</span>
            <span>Click on quantity, courier, or notes to edit in place</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
            <span>Press Tab/Enter to move</span>
          </div>
        </div>

        {/* SHEET CONTENT BASED ON ACTIVE SHEET */}
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          {/* SHEET 1: DELIVERIES DISPATCHED */}
          {activeSheet === 'deliveries' && (
            <div>
              {/* Sheet Sub-Header Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Tourism Circuit Deliveries Ledger
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    All cells are directly editable in the spreadsheet. Type in reference, dates, office, flyer, quantity, courier, or notes directly.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onAddDeliveryRow && (
                    <button
                      type="button"
                      onClick={onAddDeliveryRow}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Insert a new delivery row directly into this grid"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Quick Add Delivery Row</span>
                    </button>
                  )}
                  {onOpenNewDelivery && (
                    <button
                      type="button"
                      onClick={onOpenNewDelivery}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Delivery (Modal)</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                {/* Column Headers (A, B, C, D...) */}
                <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                  <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                    #
                  </th>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((col) => (
                    <th
                      key={col}
                      className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700"
                    >
                      {col}
                    </th>
                  ))}
                </tr>

                {/* Table Field Labels (Row 1 in Excel) */}
                <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                  <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                    1
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">Delivery Ref</td>
                  <td className="px-3 py-2 border-r border-slate-200 flex items-center justify-between">
                    <span>Dispatch Date</span>
                    <Calendar className="w-3 h-3 text-emerald-700 inline" />
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">Tourism Office</td>
                  <td className="px-3 py-2 border-r border-slate-200">Flyer Type</td>
                  <td className="px-3 py-2 text-right border-r border-slate-200">
                    Amount Distributed (Qty)
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">Courier / Van</td>
                  <td className="px-3 py-2 border-r border-slate-200 flex items-center justify-between">
                    <span>Depleted Date</span>
                    <Calendar className="w-3 h-3 text-emerald-700 inline" />
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200">
                    Usage Period (Days)
                  </td>
                  <td className="px-3 py-2 text-right border-r border-slate-200">
                    Daily Burn Rate (Units/Day)
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">Notes</td>
                  <td className="px-2 py-2 text-center">Action</td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deliveries
                  .filter((del) => {
                    if (!searchTerm) return true;
                    const text = `${del.deliveryRef} ${del.courier} ${del.notes}`.toLowerCase();
                    return text.includes(searchTerm.toLowerCase());
                  })
                  .map((del, rowIndex) => {
                    const office = offices.find((o) => o.id === del.officeId);
                    const flyer = flyers.find((f) => f.id === del.flyerTypeId);
                    const excelRowNum = rowIndex + 2;

                    const autoDays = del.depletedDate
                      ? getDaysDiff(del.date, del.depletedDate)
                      : getDaysDiff(del.date, TODAY_STR);
                    const days = del.customTimeLapseDays !== undefined ? del.customTimeLapseDays : autoDays;
                    const autoRate = del.depletedDate
                      ? Math.round((del.quantityDelivered / Math.max(1, days)) * 10) / 10
                      : Math.round((del.quantityDelivered / Math.max(1, days)) * 10) / 10;
                    const rate = del.customDailyBurnRate !== undefined ? del.customDailyBurnRate : autoRate;

                    const formulaPeriod = del.customTimeLapseDays !== undefined
                      ? `=CUSTOM_DAYS(${del.customTimeLapseDays})`
                      : del.depletedDate
                      ? `=DATEDIF(B${excelRowNum}, G${excelRowNum}, "d")`
                      : `=DATEDIF(B${excelRowNum}, TODAY(), "d")`;
                    const formulaRate = del.customDailyBurnRate !== undefined
                      ? `=CUSTOM_RATE(${del.customDailyBurnRate})`
                      : `=ROUND(E${excelRowNum} / H${excelRowNum}, 1)`;

                    const isEditingRef = editingCellKey === `${del.id}-ref`;
                    const isEditingCourier = editingCellKey === `${del.id}-courier`;
                    const isEditingNotes = editingCellKey === `${del.id}-notes`;
                    const isEditingQty = editingCellKey === `${del.id}-qty`;

                    return (
                      <tr
                        key={del.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          del.depletedDate ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        {/* Row Index */}
                        <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500 select-none">
                          {excelRowNum}
                        </td>

                        {/* Col A: Delivery Ref */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 0, del.deliveryRef, del.deliveryRef, {
                              field: 'deliveryRef',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 font-mono font-medium text-blue-700 border-r border-slate-200"
                        >
                          <input
                            type="text"
                            value={del.deliveryRef}
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'deliveryRef', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs font-mono font-medium text-blue-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Directly edit delivery reference"
                          />
                        </td>

                        {/* Col B: Dispatch Date (DIRECT EDITABLE IN APP) */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 1, del.date, del.date, {
                              field: 'date',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 border-r border-slate-200 cursor-cell bg-emerald-50/20"
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={del.date}
                              onChange={(e) => {
                                if (e.target.value) {
                                  applyCellUpdate('deliveries', del.id, 'date', e.target.value);
                                }
                              }}
                              title="Click to update dispatch date directly"
                              className="px-1.5 py-0.5 text-xs font-medium text-slate-800 bg-white hover:bg-emerald-50 focus:bg-white border border-slate-200 hover:border-emerald-400 focus:border-emerald-500 rounded cursor-pointer transition-colors shadow-2xs"
                            />
                            {del.date === TODAY_STR && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1 rounded">
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col C: Office (Direct Select) */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 2, office?.name || '', office?.name || '', {
                              field: 'officeId',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 font-medium text-slate-900 border-r border-slate-200"
                        >
                          <select
                            value={del.officeId}
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'officeId', e.target.value)}
                            className="w-full text-xs py-0.5 px-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 focus:border-blue-400 rounded cursor-pointer truncate"
                          >
                            {offices.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name} ({o.region})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Col D: Flyer (Direct Select) */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 3, flyer?.name || '', flyer?.name || '', {
                              field: 'flyerTypeId',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 text-slate-800 border-r border-slate-200"
                        >
                          <select
                            value={del.flyerTypeId}
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'flyerTypeId', e.target.value)}
                            className="w-full text-xs py-0.5 px-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 focus:border-blue-400 rounded cursor-pointer truncate"
                          >
                            {flyers.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.language})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Col E: Amount Distributed (Direct Edit) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              rowIndex + 1,
                              4,
                              String(del.quantityDelivered),
                              del.quantityDelivered.toLocaleString(),
                              { field: 'quantityDelivered', recordId: del.id, isEditable: true }
                            )
                          }
                          className="px-2 py-1 text-right border-r border-slate-200"
                        >
                          <input
                            type="number"
                            min="1"
                            value={del.quantityDelivered}
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'quantityDelivered', e.target.value)}
                            className="w-24 text-right px-1.5 py-0.5 text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Directly edit amount distributed"
                          />
                        </td>

                        {/* Col F: Courier (Direct Edit) */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 5, del.courier, del.courier, {
                              field: 'courier',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 text-slate-600 border-r border-slate-200"
                        >
                          <input
                            type="text"
                            value={del.courier}
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'courier', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Directly edit courier service"
                          />
                        </td>

                        {/* Col G: Depleted Date (DIRECT EDITABLE IN APP) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              rowIndex + 1,
                              6,
                              del.depletedDate || 'Active',
                              del.depletedDate || 'Active',
                              { field: 'depletedDate', recordId: del.id, isEditable: true }
                            )
                          }
                          className="px-2 py-1 border-r border-slate-200 cursor-cell bg-slate-50/50"
                        >
                          <div className="flex items-center gap-1.5">
                            {del.depletedDate ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={del.depletedDate}
                                  onChange={(e) =>
                                    applyCellUpdate('deliveries', del.id, 'depletedDate', e.target.value)
                                  }
                                  title="Change depleted date"
                                  className="px-1.5 py-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-300 rounded cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyCellUpdate('deliveries', del.id, 'depletedDate', '');
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                                  title="Clear depleted date (set active in use)"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyCellUpdate('deliveries', del.id, 'depletedDate', TODAY_STR);
                                  }}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 cursor-pointer transition-colors"
                                  title="Mark depleted as of today, or click date input to pick another date"
                                >
                                  Active in Use
                                </button>
                                <input
                                  type="date"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      applyCellUpdate('deliveries', del.id, 'depletedDate', e.target.value);
                                    }
                                  }}
                                  title="Pick date when depleted"
                                  className="w-6 h-6 opacity-40 hover:opacity-100 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Col H: Usage Period (Time Lapse - Customizable) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              rowIndex + 1,
                              7,
                              del.customTimeLapseDays !== undefined
                                ? String(del.customTimeLapseDays)
                                : formulaPeriod,
                              `${days} days`,
                              { field: 'customTimeLapseDays', recordId: del.id, isEditable: true, sheet: 'deliveries' }
                            )
                          }
                          className={`px-2 py-1 text-right border-r border-slate-200 cursor-cell ${
                            del.customTimeLapseDays !== undefined ? 'bg-purple-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="1"
                              value={days}
                              onChange={(e) =>
                                applyCellUpdate('deliveries', del.id, 'customTimeLapseDays', e.target.value)
                              }
                              className={`w-16 px-1.5 py-0.5 text-xs text-right font-bold rounded border transition-colors ${
                                del.customTimeLapseDays !== undefined
                                  ? 'border-purple-400 bg-white text-purple-900 font-bold focus:ring-1 focus:ring-purple-500'
                                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400'
                              }`}
                              title="Click to customize usage period (time lapse in days)"
                            />
                            <span className="text-[11px] text-slate-500">d</span>
                            {del.customTimeLapseDays !== undefined && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCellUpdate('deliveries', del.id, 'customTimeLapseDays', '');
                                }}
                                title="Reset to auto time lapse"
                                className="p-0.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Col I: Daily Burn Rate (Customizable) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              rowIndex + 1,
                              8,
                              del.customDailyBurnRate !== undefined
                                ? String(del.customDailyBurnRate)
                                : formulaRate,
                              `${rate} / day`,
                              { field: 'customDailyBurnRate', recordId: del.id, isEditable: true, sheet: 'deliveries' }
                            )
                          }
                          className={`px-2 py-1 text-right border-r border-slate-200 cursor-cell ${
                            del.customDailyBurnRate !== undefined ? 'bg-purple-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={rate}
                              onChange={(e) =>
                                applyCellUpdate('deliveries', del.id, 'customDailyBurnRate', e.target.value)
                              }
                              className={`w-16 px-1.5 py-0.5 text-xs text-right font-bold rounded border transition-colors ${
                                del.customDailyBurnRate !== undefined
                                  ? 'border-purple-400 bg-white text-purple-900 font-bold focus:ring-1 focus:ring-purple-500'
                                  : 'border-slate-200 bg-white text-blue-800 hover:border-blue-400'
                              }`}
                              title="Click to customize daily burn rate"
                            />
                            <span className="text-[10px] text-slate-500">/d</span>
                            {del.customDailyBurnRate !== undefined && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCellUpdate('deliveries', del.id, 'customDailyBurnRate', '');
                                }}
                                title="Reset to formula burn rate"
                                className="p-0.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Col J: Notes (Direct Edit) */}
                        <td
                          onClick={() =>
                            handleCellClick(rowIndex + 1, 9, del.notes, del.notes, {
                              field: 'notes',
                              recordId: del.id,
                              isEditable: true,
                            })
                          }
                          className="px-2 py-1 border-r border-slate-200"
                        >
                          <input
                            type="text"
                            value={del.notes || ''}
                            placeholder="Add notes..."
                            onChange={(e) => applyCellUpdate('deliveries', del.id, 'notes', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs text-slate-600 italic bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Directly edit delivery notes"
                          />
                        </td>

                        {/* Col K: Action */}
                        <td className="px-2 py-1.5 text-center">
                          {onDeleteDelivery && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete delivery record ${del.deliveryRef}?`)) {
                                  onDeleteDelivery(del.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete this delivery row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </div>
          )}

          {/* SHEET 2: TOURISM FAIRS */}
          {activeSheet === 'fairs' && (
            <div>
              {/* Sheet Sub-Header Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    Tourism Fairs &amp; Exhibitions Ledger
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    Customize dates &amp; quantities directly in the cells below, or click <strong>Edit Details</strong> to customize all fair parameters.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onAddFair && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum = fairs.length + 1;
                        onAddFair({
                          name: `International Tourism Expo ${nextNum}`,
                          city: 'Lisbon',
                          country: 'Portugal',
                          startDate: TODAY_STR,
                          endDate: TODAY_STR,
                          attendingStaff: 'Outreach Team',
                          notes: 'General promotion',
                          items: flyers.map((f, i) => ({
                            flyerTypeId: f.id,
                            quantityTaken: i === 0 ? 300 : 150,
                            quantityReturned: 0,
                            quantitySpent: i === 0 ? 300 : 150,
                          })),
                        });
                        notifyChange('Added new Tourism Fair row to grid');
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Insert a new fair row directly into this grid"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Quick Add Fair Row</span>
                    </button>
                  )}
                  {(onAddFair || onUpdateFair) && (
                    <button
                      type="button"
                      onClick={handleOpenAddFair}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tourism Fair (Modal)</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                    <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                      #
                    </th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((col) => (
                      <th key={col} className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                    <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                      1
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Fair / Expo Name</td>
                    <td className="px-3 py-2 border-r border-slate-200">Location (City, Country)</td>
                    <td className="px-3 py-2 border-r border-slate-200 flex items-center justify-between">
                      <span>Dates (Start - End)</span>
                      <Calendar className="w-3 h-3 text-emerald-700 inline" />
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Flyer SKU</td>
                    <td className="px-3 py-2 border-r border-slate-200">Flyer Name</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">Taken (Qty)</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">Returned (Qty)</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200 font-bold">Flyers Spent (Net)</td>
                    <td className="px-3 py-2 border-r border-slate-200">Staff &amp; Notes</td>
                    <td className="px-2 py-2 text-center">Action</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fairs.flatMap((fair, fairIndex) =>
                    fair.items.map((item, itemIdx) => {
                      const flyer = flyers.find((f) => f.id === item.flyerTypeId);
                      const rowIdx = fairIndex * 10 + itemIdx + 2;
                      return (
                        <tr key={`${fair.id}-${item.flyerTypeId}`} className="hover:bg-blue-50/40 transition-colors">
                          <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                            {rowIdx}
                          </td>
                          <td className="px-2 py-1 font-medium text-slate-900 border-r border-slate-200">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={fair.name}
                                onChange={(e) => applyCellUpdate('fairs', fair.id, 'name', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded"
                                title="Edit fair name directly"
                              />
                              {onUpdateFair && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditFair(fair)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-1 py-0.5 rounded cursor-pointer shrink-0"
                                  title="Open full fair modal"
                                >
                                  Modal
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1 text-slate-700 border-r border-slate-200">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={fair.city}
                                placeholder="City"
                                onChange={(e) => applyCellUpdate('fairs', fair.id, 'city', e.target.value)}
                                className="w-20 px-1 py-0.5 text-xs text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded"
                                title="Edit city"
                              />
                              <span className="text-slate-400">,</span>
                              <input
                                type="text"
                                value={fair.country}
                                placeholder="Country"
                                onChange={(e) => applyCellUpdate('fairs', fair.id, 'country', e.target.value)}
                                className="w-20 px-1 py-0.5 text-xs text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded"
                                title="Edit country"
                              />
                            </div>
                          </td>
                          {/* Direct Editable Dates in Fair Grid */}
                          <td className="px-2 py-1 border-r border-slate-200 bg-emerald-50/20">
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={fair.startDate}
                                onChange={(e) => {
                                  if (e.target.value) applyCellUpdate('fairs', fair.id, 'startDate', e.target.value);
                                }}
                                className="px-1 py-0.5 text-[11px] font-mono border border-slate-300 rounded bg-white hover:border-emerald-500"
                                title="Update fair start date"
                              />
                              <span className="text-slate-400 text-xs">to</span>
                              <input
                                type="date"
                                value={fair.endDate}
                                onChange={(e) => {
                                  if (e.target.value) applyCellUpdate('fairs', fair.id, 'endDate', e.target.value);
                                }}
                                className="px-1 py-0.5 text-[11px] font-mono border border-slate-300 rounded bg-white hover:border-emerald-500"
                                title="Update fair end date"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600 border-r border-slate-200">
                            {flyer?.sku || item.flyerTypeId}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200">
                            {flyer?.name}
                          </td>
                          {/* Taken Quantity (Direct Edit) */}
                          <td className="px-2 py-1 text-right border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              value={item.quantityTaken}
                              onChange={(e) =>
                                applyCellUpdate('fairs', fair.id, `itemTaken-${item.flyerTypeId}`, e.target.value)
                              }
                              className="w-20 px-1.5 py-0.5 text-right font-medium text-slate-800 border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded bg-white"
                            />
                          </td>
                          {/* Returned Quantity (Direct Edit) */}
                          <td className="px-2 py-1 text-right border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              value={item.quantityReturned}
                              onChange={(e) =>
                                applyCellUpdate('fairs', fair.id, `itemReturned-${item.flyerTypeId}`, e.target.value)
                              }
                              className="w-20 px-1.5 py-0.5 text-right font-medium text-slate-600 border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded bg-white"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-amber-900 bg-amber-50/50 border-r border-slate-200 font-mono">
                            {item.quantitySpent.toLocaleString()}
                          </td>
                          <td className="px-2 py-1 border-r border-slate-200">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={fair.attendingStaff || ''}
                                placeholder="Staff..."
                                onChange={(e) => applyCellUpdate('fairs', fair.id, 'attendingStaff', e.target.value)}
                                className="w-28 px-1 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded"
                                title="Edit attending staff"
                              />
                              <input
                                type="text"
                                value={fair.notes || ''}
                                placeholder="Notes..."
                                onChange={(e) => applyCellUpdate('fairs', fair.id, 'notes', e.target.value)}
                                className="w-32 px-1 py-0.5 text-xs text-slate-500 italic bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded"
                                title="Edit notes"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {onUpdateFair && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditFair(fair);
                                  }}
                                  className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-emerald-50 cursor-pointer"
                                  title="Edit full tourism fair record"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteFair && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete tourism fair "${fair.name}"?`)) {
                                      onDeleteFair(fair.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                                  title="Delete fair record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SHEET 3: NON-CIRCUIT DELIVERIES */}
          {activeSheet === 'other_deliveries' && (
            <div>
              {/* Sheet Sub-Header Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Other Deliveries &amp; Non-Circuit Distributions
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    Customize dates &amp; quantities directly in the cells below, or click <strong>Edit Details</strong> to customize all delivery parameters.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onAddOtherDelivery && (
                    <button
                      type="button"
                      onClick={() => {
                        const padNum = (otherDeliveries.length + 1).toString().padStart(3, '0');
                        onAddOtherDelivery({
                          ref: `OD-2026-${padNum}`,
                          date: TODAY_STR,
                          category: 'historical_village_office',
                          title: 'Special Direct Distribution',
                          flyerTypeId: flyers[0]?.id || 'flyer-1',
                          quantity: 200,
                          deliveredBy: 'Outreach Staff',
                          recipientOrGroup: 'Regional Visitor Center',
                          notes: 'Spreadsheet direct entry',
                        });
                        notifyChange('Added new other delivery row to spreadsheet');
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Insert a new row directly into this grid"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Quick Add Row</span>
                    </button>
                  )}
                  {(onAddOtherDelivery || onUpdateOtherDelivery) && (
                    <button
                      type="button"
                      onClick={handleOpenAddOtherDelivery}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Non-Circuit Delivery (Modal)</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                    <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                      #
                    </th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((col) => (
                      <th key={col} className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                    <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                      1
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Ref Code</td>
                    <td className="px-3 py-2 border-r border-slate-200 flex items-center justify-between">
                      <span>Date</span>
                      <Calendar className="w-3 h-3 text-emerald-700 inline" />
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Category / Type</td>
                    <td className="px-3 py-2 border-r border-slate-200">Activity / Recipient Title</td>
                    <td className="px-3 py-2 border-r border-slate-200">Flyer Distributed</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">Amount (Qty)</td>
                    <td className="px-3 py-2 border-r border-slate-200">Delivered By</td>
                    <td className="px-3 py-2 border-r border-slate-200">Notes</td>
                    <td className="px-2 py-2 text-center">Action</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {otherDeliveries.map((od, idx) => {
                    return (
                      <tr key={od.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                          {idx + 2}
                        </td>
                        {/* Ref Code (Direct Edit) */}
                        <td className="px-2 py-1 font-mono font-medium text-slate-900 border-r border-slate-200">
                          <input
                            type="text"
                            value={od.ref}
                            onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'ref', e.target.value)}
                            className="w-28 px-1.5 py-0.5 text-xs font-mono font-medium text-indigo-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded"
                            title="Edit reference code directly"
                          />
                        </td>
                        {/* Direct Date Edit */}
                        <td className="px-2 py-1 border-r border-slate-200 bg-emerald-50/20">
                          <input
                            type="date"
                            value={od.date}
                            onChange={(e) => {
                              if (e.target.value) applyCellUpdate('other_deliveries', od.id, 'date', e.target.value);
                            }}
                            className="px-1.5 py-0.5 text-xs font-medium text-slate-800 border border-slate-200 hover:border-emerald-500 rounded bg-white cursor-pointer"
                            title="Click to update date"
                          />
                        </td>
                        {/* Category (Direct Select) */}
                        <td className="px-2 py-1 border-r border-slate-200">
                          <select
                            value={od.category}
                            onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'category', e.target.value)}
                            className="text-xs py-0.5 px-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded cursor-pointer font-medium text-indigo-700"
                          >
                            <option value="historical_village_office">Historical Village Office Desk</option>
                            <option value="guided_tour">Guided Tours &amp; Itineraries</option>
                            <option value="event">Cultural Event / Festival</option>
                            <option value="school_educational">Schools &amp; Educational Group</option>
                            <option value="protocol_vip">VIP / Institutional Protocol</option>
                            <option value="other">Other Direct Distribution</option>
                          </select>
                        </td>
                        {/* Title & Recipient (Direct Edit) */}
                        <td className="px-2 py-1 font-medium text-slate-900 border-r border-slate-200">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={od.title}
                                onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'title', e.target.value)}
                                className="w-full px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded"
                                title="Edit title directly"
                              />
                              {onUpdateOtherDelivery && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditOtherDelivery(od)}
                                  className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1 py-0.5 rounded cursor-pointer shrink-0"
                                  title="Edit full delivery details in modal"
                                >
                                  Modal
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={od.recipientOrGroup || ''}
                              placeholder="Recipient / organization..."
                              onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'recipientOrGroup', e.target.value)}
                              className="w-full px-1.5 py-0.5 text-[11px] text-slate-500 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded"
                              title="Edit recipient or organization"
                            />
                          </div>
                        </td>
                        {/* Flyer Distributed (Direct Select) */}
                        <td className="px-2 py-1 text-slate-800 border-r border-slate-200">
                          <select
                            value={od.flyerTypeId}
                            onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'flyerTypeId', e.target.value)}
                            className="w-full text-xs py-0.5 px-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded cursor-pointer truncate"
                          >
                            {flyers.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.language})
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Direct Quantity Edit */}
                        <td className="px-2 py-1 text-right border-r border-slate-200">
                          <input
                            type="number"
                            min="1"
                            value={od.quantity}
                            onChange={(e) =>
                              applyCellUpdate('other_deliveries', od.id, 'quantity', e.target.value)
                            }
                            className="w-24 px-1.5 py-0.5 text-right font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded transition-colors"
                            title="Edit quantity directly"
                          />
                        </td>
                        {/* Delivered By (Direct Edit) */}
                        <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                          <input
                            type="text"
                            value={od.deliveredBy}
                            onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'deliveredBy', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded transition-colors"
                            title="Edit delivered by staff/courier"
                          />
                        </td>
                        {/* Notes (Direct Edit) */}
                        <td className="px-2 py-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={od.notes || ''}
                            placeholder="Notes..."
                            onChange={(e) => applyCellUpdate('other_deliveries', od.id, 'notes', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs text-slate-500 italic bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded transition-colors"
                            title="Edit delivery notes"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onUpdateOtherDelivery && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditOtherDelivery(od);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-700 rounded hover:bg-indigo-50 cursor-pointer"
                                title="Edit delivery record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteOtherDelivery && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete non-circuit delivery ${od.ref}?`)) {
                                    onDeleteOtherDelivery(od.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete delivery record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SHEET 4: STOCK INVENTORY (WAREHOUSE) */}
          {activeSheet === 'stock' && (
            <div>
              {/* Stock Management Action Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800">Central Warehouse Stock Ledger</span>
                  <span className="text-slate-400 text-xs">&bull;</span>
                  <span className="text-xs text-slate-600 font-medium">{stockSummary.length} flyer materials registered</span>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenUploadExcel && (
                    <button
                      type="button"
                      onClick={onOpenUploadExcel}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded shadow-xs cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Excel Stock</span>
                    </button>
                  )}

                  {onOpenAddFlyer && (
                    <button
                      type="button"
                      onClick={onOpenAddFlyer}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Flyer</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                    <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                      #
                    </th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((col) => (
                      <th
                        key={col}
                        className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                    <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                      1
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">SKU</td>
                    <td className="px-3 py-2 border-r border-slate-200">Flyer Title</td>
                    <td className="px-3 py-2 border-r border-slate-200">Category</td>
                    <td className="px-3 py-2 border-r border-slate-200">Language</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Total Printed Received
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Dispatched Total
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200 bg-emerald-100/60 font-bold">
                      Warehouse Balance (On-Hand)
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Min Threshold
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Unit Cost
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Status Alert</td>
                    <td className="px-3 py-2 text-center">Actions</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stockSummary.map((item, index) => {
                    const row = index + 2;
                    const formulaBalance = `=E${row}-F${row}`;
                    return (
                      <tr key={item.flyer.id} className="hover:bg-blue-50/30">
                        <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500 select-none">
                          {row}
                        </td>
                        <td className="px-2 py-1 font-mono text-blue-700 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.flyer.sku}
                            onChange={(e) => applyCellUpdate('stock', item.flyer.id, 'sku', e.target.value)}
                            className="w-28 px-1.5 py-0.5 text-xs font-mono font-medium text-blue-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Edit flyer SKU directly"
                          />
                        </td>
                        <td className="px-2 py-1 font-semibold text-slate-900 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.flyer.name}
                            onChange={(e) => applyCellUpdate('stock', item.flyer.id, 'name', e.target.value)}
                            className="w-full px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Edit flyer title directly"
                          />
                        </td>
                        <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.flyer.category}
                            onChange={(e) => applyCellUpdate('stock', item.flyer.id, 'category', e.target.value)}
                            className="w-24 px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Edit flyer category directly"
                          />
                        </td>
                        <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                          <input
                            type="text"
                            value={item.flyer.language}
                            onChange={(e) => applyCellUpdate('stock', item.flyer.id, 'language', e.target.value)}
                            className="w-20 px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                            title="Edit language directly"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800 border-r border-slate-200">
                          {item.totalReceived.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800 border-r border-slate-200">
                          {item.totalDispatched.toLocaleString()}
                        </td>
                        {/* Direct Stock Adjustment in Grid */}
                        <td className="px-2 py-1 text-right font-bold text-slate-900 border-r border-slate-200 bg-emerald-50/40">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={item.currentWarehouseStock}
                              onChange={(e) =>
                                applyCellUpdate('stock', item.flyer.id, 'currentStock', e.target.value)
                              }
                              className="w-24 px-1.5 py-0.5 text-right font-mono font-bold text-emerald-900 border border-emerald-300 hover:border-emerald-500 rounded bg-white"
                              title="Directly update warehouse stock on-hand"
                            />
                          </div>
                        </td>
                        {/* Direct Min Threshold Edit */}
                        <td className="px-2 py-1 text-right text-slate-600 border-r border-slate-200">
                          <input
                            type="number"
                            min="0"
                            value={item.flyer.minThreshold}
                            onChange={(e) =>
                              applyCellUpdate('stock', item.flyer.id, 'minThreshold', e.target.value)
                            }
                            className="w-20 px-1 py-0.5 text-right text-slate-700 border border-slate-200 hover:border-blue-400 rounded bg-white"
                            title="Update minimum safety threshold"
                          />
                        </td>
                        <td className="px-2 py-1 text-right text-slate-600 border-r border-slate-200">
                          <div className="flex items-center justify-end gap-0.5">
                            <span className="text-slate-400">€</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.flyer.unitCost}
                              onChange={(e) => applyCellUpdate('stock', item.flyer.id, 'unitCost', e.target.value)}
                              className="w-16 text-right px-1 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded"
                              title="Edit unit cost directly"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200">
                          {item.isLowStock ? (
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              OPTIMAL
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {onOpenEditFlyerStock && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditFlyerStock(item.flyer.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 rounded font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              title="Change stock on-hand or edit flyer details"
                            >
                              <Sliders className="w-3 h-3 text-blue-600" />
                              <span>Configure</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SHEET 5: DEPLETION ANALYSIS */}
          {activeSheet === 'depletion' && (
            <div>
              {/* Sheet Sub-Header Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    Depletion &amp; Burn Rate Ledger
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    Directly customize <strong>Avg Usage Period (Time Lapse)</strong>, <strong>Daily Burn Rate</strong>, or <strong>Est. Stock</strong> in any cell.
                  </span>
                </div>

                {metrics.some((m) => m.isCustomized) && (
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border border-purple-200">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      {metrics.filter((m) => m.isCustomized).length} Custom Overrides Active
                    </span>
                    {onResetMetricOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Reset all custom metric overrides back to automated formulas?')) {
                            metrics.filter((m) => m.isCustomized).forEach((m) => onResetMetricOverride(m.key));
                            notifyChange('Reset all metric overrides to dynamic formulas');
                          }
                        }}
                        className="text-[11px] px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-500" />
                        <span>Reset All</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                    <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                      #
                    </th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((col) => (
                      <th
                        key={col}
                        className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                    <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                      1
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Office Code</td>
                    <td className="px-3 py-2 border-r border-slate-200">Tourism Office</td>
                    <td className="px-3 py-2 border-r border-slate-200">Flyer Type</td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Last Qty Delivered
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Avg Usage Period (Days)
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Daily Burn Rate
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Est. Stock Left
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-200">
                      Days Till Empty
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200 flex items-center justify-between">
                      <span>Projected Runout</span>
                      <Calendar className="w-3 h-3 text-emerald-700 inline" />
                    </td>
                    <td className="px-3 py-2">Stockout Status &amp; Action</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {metrics.map((m, index) => {
                    const row = index + 2;
                    const formulaDaysTillEmpty = `=ROUND(G${row}/F${row}, 0)`;
                    return (
                      <tr
                        key={`${m.officeId}-${m.flyerTypeId}`}
                        className={`hover:bg-slate-50 ${
                          m.status === 'depleted'
                            ? 'bg-red-50/50'
                            : m.status === 'critical'
                            ? 'bg-amber-50/40'
                            : m.isCustomized
                            ? 'bg-purple-50/20'
                            : ''
                        }`}
                      >
                        <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500 select-none">
                          {row}
                        </td>
                        <td className="px-3 py-2 font-mono text-blue-700 border-r border-slate-200">
                          {m.officeCode}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900 border-r border-slate-200">
                          {m.officeName}
                        </td>
                        <td className="px-3 py-2 text-slate-800 border-r border-slate-200">
                          {m.flyerName}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800 border-r border-slate-200">
                          {m.lastDeliveredQty.toLocaleString()}
                        </td>

                        {/* Col E: Avg Usage Period (Time Lapse - Customizable) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              4,
                              m.hasCustomTimeLapse ? String(m.avgUsagePeriodDays) : `=AVERAGE_PERIOD`,
                              `${m.avgUsagePeriodDays} days`,
                              { field: 'customAvgUsagePeriodDays', recordId: m.key, isEditable: true, sheet: 'depletion' }
                            )
                          }
                          className={`px-2 py-1 text-right border-r border-slate-200 cursor-cell ${
                            m.hasCustomTimeLapse ? 'bg-purple-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="1"
                              value={m.avgUsagePeriodDays}
                              onChange={(e) =>
                                applyCellUpdate('depletion', m.key, 'customAvgUsagePeriodDays', e.target.value)
                              }
                              className={`w-16 px-1.5 py-0.5 text-xs text-right font-semibold rounded border transition-colors ${
                                m.hasCustomTimeLapse
                                  ? 'border-purple-400 bg-white text-purple-900 font-bold focus:ring-1 focus:ring-purple-500'
                                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400'
                              }`}
                              title="Click to customize average usage period (time lapse in days)"
                            />
                            <span className="text-[11px] text-slate-500">d</span>
                            {m.hasCustomTimeLapse && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCellUpdate('depletion', m.key, 'customAvgUsagePeriodDays', '');
                                }}
                                title="Reset to auto formula"
                                className="p-0.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Col F: Daily Burn Rate (Customizable) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              5,
                              m.hasCustomBurnRate ? String(m.avgDailyDistributionRate) : `=LAST_QTY / USAGE_DAYS`,
                              `${m.avgDailyDistributionRate}/day`,
                              { field: 'customBurnRate', recordId: m.key, isEditable: true, sheet: 'depletion' }
                            )
                          }
                          className={`px-2 py-1 text-right border-r border-slate-200 cursor-cell ${
                            m.hasCustomBurnRate ? 'bg-purple-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={m.avgDailyDistributionRate}
                              onChange={(e) =>
                                applyCellUpdate('depletion', m.key, 'customBurnRate', e.target.value)
                              }
                              className={`w-16 px-1.5 py-0.5 text-xs text-right font-bold rounded border transition-colors ${
                                m.hasCustomBurnRate
                                  ? 'border-purple-400 bg-white text-purple-900 font-bold focus:ring-1 focus:ring-purple-500'
                                  : 'border-slate-200 bg-white text-blue-800 hover:border-blue-400'
                              }`}
                              title="Click to customize daily burn rate (flyers/day)"
                            />
                            <span className="text-[10px] text-slate-500">/d</span>
                            {m.hasCustomBurnRate && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCellUpdate('depletion', m.key, 'customBurnRate', '');
                                }}
                                title="Reset to auto formula"
                                className="p-0.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Col G: Est. Stock Left (Customizable) */}
                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              6,
                              m.hasCustomStock ? String(m.currentEstimatedStock) : `=LAST_DELIVERY - (DAYS * BURN_RATE)`,
                              m.currentEstimatedStock.toLocaleString(),
                              { field: 'customEstimatedStock', recordId: m.key, isEditable: true, sheet: 'depletion' }
                            )
                          }
                          className={`px-2 py-1 text-right border-r border-slate-200 cursor-cell ${
                            m.hasCustomStock ? 'bg-purple-50/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              value={m.currentEstimatedStock}
                              onChange={(e) =>
                                applyCellUpdate('depletion', m.key, 'customEstimatedStock', e.target.value)
                              }
                              className={`w-20 px-1.5 py-0.5 text-xs text-right font-bold rounded border transition-colors ${
                                m.hasCustomStock
                                  ? 'border-purple-400 bg-white text-purple-900 font-bold focus:ring-1 focus:ring-purple-500'
                                  : 'border-slate-200 bg-white text-slate-900 hover:border-blue-400'
                              }`}
                              title="Click to customize estimated stock remaining"
                            />
                            {m.hasCustomStock && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCellUpdate('depletion', m.key, 'customEstimatedStock', '');
                                }}
                                title="Reset to auto formula"
                                className="p-0.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td
                          onClick={() =>
                            handleCellClick(
                              row,
                              7,
                              formulaDaysTillEmpty,
                              `${m.estimatedDaysRemaining} days`
                            )
                          }
                          className="px-3 py-2 text-right font-bold border-r border-slate-200 cursor-cell"
                        >
                          {m.status === 'depleted' ? (
                            <span className="text-red-700 font-bold">0 days (EMPTY)</span>
                          ) : (
                            <span
                              className={
                                m.status === 'critical' ? 'text-amber-700 font-bold' : 'text-slate-800'
                              }
                            >
                              {m.estimatedDaysRemaining} days
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700 font-mono text-xs border-r border-slate-200">
                          {m.projectedRunoutDate}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              {m.status === 'depleted' && (
                                <span className="font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                                  🔴 OUT OF STOCK
                                </span>
                              )}
                              {m.status === 'critical' && (
                                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                                  🟠 CRITICAL
                                </span>
                              )}
                              {m.status === 'moderate' && (
                                <span className="font-medium text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded text-[11px]">
                                  🟡 MODERATE
                                </span>
                              )}
                              {m.status === 'healthy' && (
                                <span className="font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                  🟢 HEALTHY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {m.isCustomized && onResetMetricOverride && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onResetMetricOverride(m.key);
                                    notifyChange(`Reset overrides for ${m.officeName} to dynamic formula`);
                                  }}
                                  className="text-[11px] px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  title="Reset custom overrides for this row back to auto formula"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset</span>
                                </button>
                              )}
                              {m.status !== 'depleted' && (
                                <button
                                  type="button"
                                  onClick={() => onMarkDepleted(m.officeId, m.flyerTypeId)}
                                  className="text-[11px] px-2 py-0.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded font-semibold transition-colors cursor-pointer"
                                >
                                  Mark Depleted
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SHEET 6: PIVOT OFFICE SUMMARY */}
          {activeSheet === 'summary' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Pivot Table: Total Distribution Matrix (Office × Flyer Type)
                </h3>
                <span className="text-xs text-slate-500">
                  Calculated dynamically from delivery log
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Tourism Office</th>
                      {flyers.map((f) => (
                        <th key={f.id} className="p-2.5 text-right whitespace-nowrap">
                          {f.name}
                        </th>
                      ))}
                      <th className="p-2.5 text-right bg-emerald-50 text-emerald-900 font-bold">
                        Total Office Flyers
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {offices.map((office) => {
                      let officeTotal = 0;
                      return (
                        <tr key={office.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-900">
                            {office.name}
                          </td>
                          {flyers.map((flyer) => {
                            const delivered = deliveries
                              .filter(
                                (d) => d.officeId === office.id && d.flyerTypeId === flyer.id
                              )
                              .reduce((sum, d) => sum + d.quantityDelivered, 0);
                            officeTotal += delivered;
                            return (
                              <td
                                key={flyer.id}
                                className="p-2.5 text-right font-mono text-slate-700"
                              >
                                {delivered > 0 ? delivered.toLocaleString() : '—'}
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-right font-bold text-slate-900 bg-emerald-50/50">
                            {officeTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td className="p-2.5 text-slate-900">Grand Total</td>
                      {flyers.map((flyer) => {
                        const colTotal = deliveries
                          .filter((d) => d.flyerTypeId === flyer.id)
                          .reduce((sum, d) => sum + d.quantityDelivered, 0);
                        return (
                          <td key={flyer.id} className="p-2.5 text-right font-mono text-blue-800">
                            {colTotal.toLocaleString()}
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-right font-bold text-emerald-800 bg-emerald-100">
                        {deliveries
                          .reduce((sum, d) => sum + d.quantityDelivered, 0)
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SHEET 7: TOURISM OFFICES LEDGER */}
          {activeSheet === 'offices' && (
            <div>
              {/* Sheet Sub-Header Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Tourism Reception Offices Directory
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    Directly edit office code, name, zone, footfall tier, contacts, and physical address in the cells below.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onAddOffice && (
                    <button
                      type="button"
                      onClick={() => {
                        const num = offices.length + 1;
                        onAddOffice({
                          code: `AHP-OFF${num.toString().padStart(2, '0')}`,
                          name: `Tourism Office ${num}`,
                          zone: 'Historical Route',
                          footfallTier: 'Medium',
                          contactPerson: 'Reception Desk',
                          email: 'turismo@aldeiashistoricas.pt',
                          phone: '+351 270 000 000',
                          address: 'Largo Central',
                        });
                        notifyChange('Added new Tourism Office row directly to spreadsheet');
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Insert a new office row directly into this grid"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Quick Add Office Row</span>
                    </button>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-600 font-mono text-center select-none border-b border-slate-300">
                    <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-200 text-slate-500 font-normal">
                      #
                    </th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((col) => (
                      <th key={col} className="py-1 px-3 border-r border-slate-300 font-semibold text-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-900 font-semibold border-b border-slate-300">
                    <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                      1
                    </td>
                    <td className="px-3 py-2 border-r border-slate-200">Office Code</td>
                    <td className="px-3 py-2 border-r border-slate-200">Office Name</td>
                    <td className="px-3 py-2 border-r border-slate-200">Geographic Zone</td>
                    <td className="px-3 py-2 border-r border-slate-200">Footfall Tier</td>
                    <td className="px-3 py-2 border-r border-slate-200">Contact Person</td>
                    <td className="px-3 py-2 border-r border-slate-200">Email</td>
                    <td className="px-3 py-2 border-r border-slate-200">Phone</td>
                    <td className="px-3 py-2 border-r border-slate-200">Physical Address</td>
                    <td className="px-2 py-2 text-center">Action</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {offices.map((office, idx) => (
                    <tr key={office.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="text-center font-mono py-2 px-2 border-r border-slate-300 bg-slate-100 text-slate-500">
                        {idx + 2}
                      </td>
                      {/* Code */}
                      <td className="px-2 py-1 font-mono font-medium text-slate-900 border-r border-slate-200">
                        <input
                          type="text"
                          value={office.code}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'code', e.target.value)}
                          className="w-24 px-1.5 py-0.5 text-xs font-mono font-medium text-blue-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded transition-colors"
                          title="Directly edit office code"
                        />
                      </td>
                      {/* Name */}
                      <td className="px-2 py-1 font-semibold text-slate-900 border-r border-slate-200">
                        <input
                          type="text"
                          value={office.name}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'name', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit office name"
                        />
                      </td>
                      {/* Zone */}
                      <td className="px-2 py-1 text-slate-700 border-r border-slate-200">
                        <input
                          type="text"
                          value={office.zone}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'zone', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit zone"
                        />
                      </td>
                      {/* Footfall Tier */}
                      <td className="px-2 py-1 border-r border-slate-200">
                        <select
                          value={office.footfallTier}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'footfallTier', e.target.value)}
                          className="text-xs py-0.5 px-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded cursor-pointer font-medium text-slate-800"
                        >
                          <option value="High">High Footfall</option>
                          <option value="Medium">Medium Footfall</option>
                          <option value="Seasonal Peak">Seasonal Peak</option>
                        </select>
                      </td>
                      {/* Contact Person */}
                      <td className="px-2 py-1 text-slate-700 border-r border-slate-200">
                        <input
                          type="text"
                          value={office.contactPerson}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'contactPerson', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit contact person"
                        />
                      </td>
                      {/* Email */}
                      <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                        <input
                          type="email"
                          value={office.email}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'email', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-xs text-slate-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit email"
                        />
                      </td>
                      {/* Phone */}
                      <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                        <input
                          type="tel"
                          value={office.phone}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'phone', e.target.value)}
                          className="w-28 px-1.5 py-0.5 text-xs text-slate-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit phone"
                        />
                      </td>
                      {/* Address */}
                      <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                        <input
                          type="text"
                          value={office.address}
                          onChange={(e) => applyCellUpdate('offices', office.id, 'address', e.target.value)}
                          className="w-full px-1.5 py-0.5 text-xs text-slate-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded transition-colors"
                          title="Directly edit physical address"
                        />
                      </td>
                      {/* Action */}
                      <td className="px-2 py-1.5 text-center">
                        {onDeleteOffice && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete office "${office.name}" (${office.code})?`)) {
                                onDeleteOffice(office.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete this office row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BOTTOM EXCEL SHEET TABS */}
        <div className="bg-slate-200 border-t border-slate-300 px-3 py-1.5 flex items-center gap-1 overflow-x-auto select-none">
          <button
            onClick={() => setActiveSheet('deliveries')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'deliveries'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🚚 Circuit_Deliveries</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              {deliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('fairs')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'fairs'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🎪 Tourism_Fairs</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              {fairs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('other_deliveries')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'other_deliveries'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🚶 Non_Circuit_Deliveries</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">
              {otherDeliveries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('stock')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'stock'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📦 Stock_Warehouse</span>
          </button>

          <button
            onClick={() => setActiveSheet('depletion')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'depletion'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>⏱️ Depletion_and_BurnRate</span>
          </button>

          <button
            onClick={() => setActiveSheet('offices')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'offices'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🏢 Tourism_Offices</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">
              {offices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('summary')}
            className={`px-3 py-1 text-xs rounded-t font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSheet === 'summary'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                : 'bg-slate-300/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📊 Pivot_Office_Matrix</span>
          </button>
        </div>
      </div>

      {/* TOURISM FAIR CUSTOMIZATION MODAL */}
      {isFairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingFairId ? 'Customize Tourism Fair Record' : 'Add New Tourism Fair & Event'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFairModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFair} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fair / Exhibition Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fairName}
                    onChange={(e) => setFairName(e.target.value)}
                    placeholder="e.g. BTL Lisboa 2026, FITUR Madrid"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Venue
                  </label>
                  <input
                    type="text"
                    value={fairCity}
                    onChange={(e) => setFairCity(e.target.value)}
                    placeholder="e.g. Lisbon, Porto, Madrid"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={fairCountry}
                    onChange={(e) => setFairCountry(e.target.value)}
                    placeholder="e.g. Portugal, Spain"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={fairStartDate}
                    onChange={(e) => setFairStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={fairEndDate}
                    onChange={(e) => setFairEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stand / Pavilion Number
                  </label>
                  <input
                    type="text"
                    value={fairStandNumber}
                    onChange={(e) => setFairStandNumber(e.target.value)}
                    placeholder="e.g. Pavilion 2 - Stand D04"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Staff
                  </label>
                  <input
                    type="text"
                    value={fairAttendingStaff}
                    onChange={(e) => setFairAttendingStaff(e.target.value)}
                    placeholder="e.g. Rita Gomes (Promotion Team)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Flyer Items Allocation Table */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Flyer Stock Allocations (Taken vs Returned)
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Flyer Material</th>
                        <th className="p-2 text-right w-24">Taken (Qty)</th>
                        <th className="p-2 text-right w-24">Returned (Qty)</th>
                        <th className="p-2 text-right w-24 bg-amber-50 text-amber-900">Net Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {flyers.map((fl) => {
                        const cur = fairQuantities[fl.id] || { taken: 0, returned: 0 };
                        const spent = Math.max(0, (cur.taken || 0) - (cur.returned || 0));
                        return (
                          <tr key={fl.id} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">
                              {fl.name}
                              <div className="text-[10px] text-slate-500 font-mono">{fl.sku}</div>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={cur.taken}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setFairQuantities((prev) => ({
                                    ...prev,
                                    [fl.id]: {
                                      taken: val,
                                      returned: prev[fl.id]?.returned || 0,
                                    },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-right border border-slate-300 rounded text-xs font-semibold"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={cur.returned}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setFairQuantities((prev) => ({
                                    ...prev,
                                    [fl.id]: {
                                      taken: prev[fl.id]?.taken || 0,
                                      returned: val,
                                    },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-right border border-slate-300 rounded text-xs font-semibold"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-amber-800 bg-amber-50/50">
                              {spent.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={fairNotes}
                  onChange={(e) => setFairNotes(e.target.value)}
                  placeholder="e.g. High demand on weekend; extra brochures requested."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFairModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingFairId ? 'Save Fair Changes' : 'Create Fair Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTHER DELIVERIES (NON-CIRCUIT) CUSTOMIZATION MODAL */}
      {isOtherDeliveryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingOtherDeliveryId ? 'Customize Non-Circuit Delivery' : 'Log Non-Circuit Distribution'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOtherDeliveryModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-indigo-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOtherDelivery} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Distribution Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={odDate}
                    onChange={(e) => setOdDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={odCategory}
                    onChange={(e) => setOdCategory(e.target.value as OtherDeliveryCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="historical_village_office">Historical Village Office / Reception Desk</option>
                    <option value="guided_tour">Guided Tour / Walking Group</option>
                    <option value="event">Regional Festival / Cultural Event</option>
                    <option value="school_educational">School &amp; Educational Group</option>
                    <option value="protocol_vip">VIP / Institutional Protocol</option>
                    <option value="other">Other Direct Distribution</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity / Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={odTitle}
                    onChange={(e) => setOdTitle(e.target.value)}
                    placeholder="e.g. Historical Village Reception Desk - Walk-in Visitors"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Group / Location
                  </label>
                  <input
                    type="text"
                    value={odRecipient}
                    onChange={(e) => setOdRecipient(e.target.value)}
                    placeholder="e.g. Monsaraz Central Information Desk, Porto Tourist Group #4"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flyer Material *
                  </label>
                  <select
                    value={odFlyerId}
                    onChange={(e) => setOdFlyerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {flyers.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Distributed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={odQuantity}
                    onChange={(e) => setOdQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivered By (Staff / Guide)
                  </label>
                  <input
                    type="text"
                    value={odDeliveredBy}
                    onChange={(e) => setOdDeliveredBy(e.target.value)}
                    placeholder="e.g. Miguel Silva (Heritage Coordinator)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes &amp; Context
                  </label>
                  <textarea
                    rows={2}
                    value={odNotes}
                    onChange={(e) => setOdNotes(e.target.value)}
                    placeholder="e.g. Handed over directly for weekend tourism influx."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOtherDeliveryModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingOtherDeliveryId ? 'Save Delivery Changes' : 'Log Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
