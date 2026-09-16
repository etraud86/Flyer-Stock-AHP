import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  Truck,
  RotateCw,
  Building2,
  Layers,
  Search,
  CalendarCheck2,
  Info,
  Mail,
  Sparkles,
  RotateCcw,
  Pencil,
  Check,
  Plus,
  Trash2,
  X,
  Edit3,
} from 'lucide-react';
import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  OfficeFlyerMetric,
  OfficeFlyerMetricOverride,
} from '../types';
import {
  computeOfficeFlyerMetrics,
  getDaysDiff,
  TODAY_STR,
} from '../utils/calculations';

interface DepletionTrackerViewProps {
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
  onUpdateMetricOverride?: (key: string, override: Partial<OfficeFlyerMetricOverride>) => void;
  onResetMetricOverride?: (key: string) => void;
  onOpenNewDelivery: (officeId?: string, flyerTypeId?: string, defaultQty?: number) => void;
  onMarkDepleted: (officeId: string, flyerTypeId: string) => void;
  onRecordNewRequest?: (deliveryId: string, newRequestDate: string) => void;
  onOpenEmailModal?: (officeId?: string) => void;
  onUpdateDelivery?: (deliveryId: string, patch: Partial<DeliveryRecord>) => void;
  onDeleteDelivery?: (deliveryId: string) => void;
  onAddDelivery?: (deliveryData: Partial<DeliveryRecord>) => void;
}

export const DepletionTrackerView: React.FC<DepletionTrackerViewProps> = ({
  flyers,
  offices,
  deliveries,
  metricOverrides = {},
  onUpdateMetricOverride,
  onResetMetricOverride,
  onOpenNewDelivery,
  onMarkDepleted,
  onRecordNewRequest,
  onOpenEmailModal,
  onUpdateDelivery,
  onDeleteDelivery,
  onAddDelivery,
}) => {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'depleted' | 'critical' | 'healthy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global toggle for making all cards editable at once
  const [editAllBoxes, setEditAllBoxes] = useState<boolean>(false);
  // Per-card edit toggles
  const [cardEditModes, setCardEditModes] = useState<Record<string, boolean>>({});

  // Cycle request date editing
  const [activeRequestDelId, setActiveRequestDelId] = useState<string | null>(null);
  const [inputRequestDate, setInputRequestDate] = useState<string>(TODAY_STR);

  // Inline "Add Cycle" state for a specific card
  const [addingCycleToCard, setAddingCycleToCard] = useState<string | null>(null);
  const [newCycleQty, setNewCycleQty] = useState<number>(1000);
  const [newCycleDate, setNewCycleDate] = useState<string>(TODAY_STR);
  const [newCycleRequestDate, setNewCycleRequestDate] = useState<string>('');

  const metrics = computeOfficeFlyerMetrics(offices, flyers, deliveries, TODAY_STR, 21, metricOverrides);

  const filteredMetrics = metrics.filter((m) => {
    if (selectedOfficeId !== 'all' && m.officeId !== selectedOfficeId) return false;
    if (statusFilter === 'depleted' && m.status !== 'depleted') return false;
    if (statusFilter === 'critical' && m.status !== 'critical') return false;
    if (statusFilter === 'healthy' && m.status !== 'healthy' && m.status !== 'moderate') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.officeName.toLowerCase().includes(q) ||
        m.flyerName.toLowerCase().includes(q) ||
        m.officeCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isCardEditing = (key: string) => {
    return editAllBoxes || !!cardEditModes[key];
  };

  const toggleCardEditing = (key: string) => {
    setCardEditModes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const sanitizeQty = (raw: string, min = 1, max = 100000): number => {
    const cleaned = raw.replace(/[.,]/g, '');
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
  };

  const handleSaveRequestDate = (deliveryId: string) => {
    if (onRecordNewRequest && inputRequestDate) {
      onRecordNewRequest(deliveryId, inputRequestDate);
    }
    setActiveRequestDelId(null);
  };

  const handleSaveNewCycle = (officeId: string, flyerTypeId: string) => {
    if (!onAddDelivery) return;
    onAddDelivery({
      officeId,
      flyerTypeId,
      quantityDelivered: newCycleQty,
      date: newCycleDate,
      newRequestDate: newCycleRequestDate || undefined,
      depletedDate: newCycleRequestDate || undefined,
      courier: 'Direct Courier / AHP',
    });
    setAddingCycleToCard(null);
    setNewCycleQty(1000);
    setNewCycleDate(TODAY_STR);
    setNewCycleRequestDate('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Usage Time Lapse &amp; Distribution Velocity</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Measure the exact time lapse between delivery and new requests. All fields within the boxes can be edited directly.
          </p>
        </div>

        {/* Filter & Global Edit controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Master Edit Toggle */}
          <button
            type="button"
            onClick={() => setEditAllBoxes(!editAllBoxes)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              editAllBoxes
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-400'
                : 'bg-white border border-blue-600 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {editAllBoxes ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>All Boxes Editable (Click to Lock)</span>
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit All Boxes</span>
              </>
            )}
          </button>

          <select
            aria-label="Select Office"
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Tourism Offices ({offices.length})</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} - {o.name}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-md border border-slate-300 p-0.5 bg-white text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('depleted')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                statusFilter === 'depleted' ? 'bg-red-600 text-white font-semibold' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Needs Stock
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                statusFilter === 'critical' ? 'bg-amber-600 text-white font-semibold' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                statusFilter === 'healthy' ? 'bg-emerald-600 text-white font-semibold' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Healthy
            </button>
          </div>
        </div>
      </div>

      {/* Operational Formula Banner */}
      <div className="p-4 bg-linear-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-xl flex items-start gap-3 shadow-2xs">
        <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900 text-sm">
            Interactive Depletion Box &amp; Formula
          </div>
          <p>
            You can record or edit the <strong>Delivery Date &amp; Quantity</strong>, the <strong>New Request Date</strong>, or directly override the <strong>Usage Time Lapse</strong>, <strong>Distribution Pace</strong>, and <strong>Current Stock</strong> inside each box.
          </p>
          <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-blue-950 font-semibold">
            <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">
              Time Lapse = New Request Date - Delivery Date
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">
              Distribution Pace = Flyers Delivered / Time Lapse Days
            </span>
          </div>
        </div>
      </div>

      {/* Office Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMetrics.map((item) => {
          const flyer = flyers.find((f) => f.id === item.flyerTypeId);
          const office = offices.find((o) => o.id === item.officeId);

          // Get past deliveries for this specific pair
          const pairDeliveries = deliveries
            .filter((d) => d.officeId === item.officeId && d.flyerTypeId === item.flyerTypeId)
            .sort((a, b) => b.date.localeCompare(a.date));

          const latestDel = pairDeliveries[0];
          const isDepleted = item.status === 'depleted';
          const isCritical = item.status === 'critical';
          const isEditing = isCardEditing(item.key);

          return (
            <div
              key={item.key}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isEditing
                  ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
                  : isDepleted
                  ? 'border-red-300 ring-1 ring-red-200'
                  : isCritical
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                        {item.officeCode}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {item.officeName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: flyer?.color || '#2563eb' }}
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {item.flyerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({item.flyerSku})
                      </span>
                    </div>
                  </div>

                  {/* Top Right Box Actions: Status & Edit Mode */}
                  <div className="flex items-center gap-2">
                    {/* Status Badge / Dropdown */}
                    {isEditing ? (
                      <select
                        value={item.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as 'depleted' | 'critical' | 'moderate' | 'healthy';
                          onUpdateMetricOverride?.(item.key, {
                            status: newStatus,
                            currentEstimatedStock: newStatus === 'depleted' ? 0 : item.currentEstimatedStock || 500,
                          });
                        }}
                        className="text-xs font-bold rounded-md px-2 py-1 border-2 border-blue-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      >
                        <option value="depleted">● New Request Needed</option>
                        <option value="critical">● Critical Stock</option>
                        <option value="moderate">● Moderate Stock</option>
                        <option value="healthy">● Healthy Stock</option>
                      </select>
                    ) : (
                      <div
                        onClick={() => toggleCardEditing(item.key)}
                        className="cursor-pointer"
                        title="Click to edit status"
                      >
                        {isDepleted ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1 border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            New Request Needed
                          </span>
                        ) : isCritical ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {item.estimatedDaysRemaining}d till new request
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {item.estimatedDaysRemaining}d remaining
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Edit Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleCardEditing(item.key)}
                      className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                        isEditing
                          ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                      }`}
                      title={isEditing ? 'Finish editing this box' : 'Edit values in this box'}
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>Edit Box</span>
                        </>
                      )}
                    </button>

                    {/* Reset to Formula button if customized */}
                    {item.isCustomized && onResetMetricOverride && (
                      <button
                        type="button"
                        onClick={() => onResetMetricOverride(item.key)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Reset this box back to formula calculation"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantitative Metrics Highlight: Editable or Display */}
                <div className={`py-3 rounded-lg my-3 px-3 transition-colors ${
                  isEditing ? 'bg-blue-50/70 border border-blue-200' : 'bg-slate-50/60'
                }`}>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* 1. USAGE TIME LAPSE */}
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Usage Time Lapse
                        {item.hasCustomTimeLapse && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">Custom</span>
                        )}
                      </span>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            step={1}
                            value={item.avgUsagePeriodDays}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const val = sanitizeQty(e.target.value, 1, 365);
                              onUpdateMetricOverride?.(item.key, { avgUsagePeriodDays: val });
                            }}
                            className="w-18 mx-auto text-center border-2 border-blue-500 rounded px-1 py-0.5 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            title="Edit Usage Time Lapse in days"
                          />
                          <span className="text-[10px] text-slate-500 block font-medium">days</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleCardEditing(item.key)}
                          className="text-base font-bold text-slate-900 mt-0.5 cursor-pointer hover:text-blue-600 transition-colors"
                          title="Click to edit Usage Time Lapse"
                        >
                          {item.avgUsagePeriodDays}{' '}
                          <span className="text-xs font-normal text-slate-500">days</span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block">delivery to request</span>
                    </div>

                    {/* 2. DISTRIBUTION PACE */}
                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Distribution Pace
                        {item.hasCustomBurnRate && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">Custom</span>
                        )}
                      </span>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="number"
                            min={0.1}
                            max={10000}
                            step={0.1}
                            value={item.avgDailyDistributionRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              onUpdateMetricOverride?.(item.key, {
                                avgDailyDistributionRate: isNaN(val) ? 1 : Math.max(0.1, val),
                              });
                            }}
                            className="w-22 mx-auto text-center border-2 border-blue-500 rounded px-1 py-0.5 text-sm font-black text-blue-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            style={{ color: '#1e3a8a', backgroundColor: '#ffffff' }}
                            title="Edit Distribution Pace flyers/day"
                          />
                          <span className="text-[10px] text-slate-500 block font-medium">flyers / day</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleCardEditing(item.key)}
                          className="text-base font-bold text-blue-700 mt-0.5 cursor-pointer hover:text-blue-900 transition-colors"
                          title="Click to edit Distribution Pace"
                        >
                          {item.avgDailyDistributionRate}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block">flyers / day</span>
                    </div>

                    {/* 3. EST. IN OFFICE */}
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Est. In Office
                        {item.hasCustomStock && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">Custom</span>
                        )}
                      </span>
                      {isEditing ? (
                        <div className="mt-1">
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            step={1}
                            value={item.currentEstimatedStock}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const val = sanitizeQty(e.target.value, 0, 100000);
                              onUpdateMetricOverride?.(item.key, {
                                currentEstimatedStock: val,
                                status: val === 0 ? 'depleted' : undefined,
                              });
                            }}
                            className="w-22 mx-auto text-center border-2 border-blue-500 rounded px-1 py-0.5 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            title="Edit Current Estimated Stock"
                          />
                          <span className="text-[10px] text-slate-500 block font-medium">units</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleCardEditing(item.key)}
                          className={`text-base font-bold mt-0.5 cursor-pointer hover:opacity-80 transition-opacity ${
                            isDepleted ? 'text-red-600' : 'text-slate-900'
                          }`}
                          title="Click to edit Est. In Office"
                        >
                          {item.currentEstimatedStock}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 block">units remaining</span>
                    </div>
                  </div>

                  {item.isCustomized && onResetMetricOverride && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="text-purple-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Customized values active in this box
                      </span>
                      <button
                        type="button"
                        onClick={() => onResetMetricOverride(item.key)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset formula
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline & Runout details (Editable in Edit Mode) */}
                <div className="text-xs space-y-2 text-slate-600">
                  {/* Last Delivery Amount & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 py-1">
                    <span className="text-slate-500 font-medium">Last Delivery Amount:</span>
                    {isEditing && latestDel ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          step={1}
                          value={latestDel.quantityDelivered}
                          onKeyDown={(e) => {
                            if (e.key === '.' || e.key === ',') e.preventDefault();
                          }}
                          onChange={(e) => {
                            const val = sanitizeQty(e.target.value, 1, 100000);
                            onUpdateDelivery?.(latestDel.id, { quantityDelivered: val });
                          }}
                          className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right font-bold text-slate-900 bg-white"
                          style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          title="Edit last delivery quantity"
                        />
                        <span className="text-slate-400">flyers on</span>
                        <input
                          type="date"
                          value={latestDel.date}
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateDelivery?.(latestDel.id, { date: e.target.value });
                            }
                          }}
                          className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-white"
                          style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          title="Edit last delivery date"
                        />
                      </div>
                    ) : (
                      <span
                        onClick={() => toggleCardEditing(item.key)}
                        className="font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                        title="Click to edit last delivery"
                      >
                        {item.lastDeliveredQty} flyers ({item.lastDeliveryDate})
                      </span>
                    )}
                  </div>

                  {/* Days Elapsed */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Days Elapsed:</span>
                    <span className="font-medium text-slate-800">
                      {item.daysSinceLastDelivery} days since delivery
                    </span>
                  </div>

                  {/* Next Replenishment Date */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 py-1">
                    <span className="text-slate-500 font-medium">Next Replenishment Date:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${isDepleted ? 'text-red-600' : 'text-blue-600'}`}>
                          {isDepleted ? 'Requested:' : 'Projected:'}
                        </span>
                        <input
                          type="date"
                          value={item.projectedRunoutDate || TODAY_STR}
                          onChange={(e) => {
                            if (e.target.value) {
                              onUpdateMetricOverride?.(item.key, { projectedRunoutDate: e.target.value });
                              if (latestDel && onUpdateDelivery && isDepleted) {
                                onUpdateDelivery(latestDel.id, { newRequestDate: e.target.value });
                              }
                            }
                          }}
                          className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-900 bg-white"
                          style={{ color: '#000000', backgroundColor: '#ffffff' }}
                        />
                      </div>
                    ) : (
                      <span
                        onClick={() => toggleCardEditing(item.key)}
                        className={`font-semibold cursor-pointer hover:underline ${
                          isDepleted ? 'text-red-600' : 'text-slate-800'
                        }`}
                        title="Click to edit replenishment date"
                      >
                        {isDepleted
                          ? `Requested on ${item.projectedRunoutDate}`
                          : `Estimated new request on ${item.projectedRunoutDate}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Historical Delivery Cycles Log for this pair */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Delivery Cycles ({pairDeliveries.length})</span>
                    <div className="flex items-center gap-2">
                      {/* Button to add a new cycle row directly to this box */}
                      <button
                        type="button"
                        onClick={() =>
                          setAddingCycleToCard(addingCycleToCard === item.key ? null : item.key)
                        }
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Cycle</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Form to Add a New Delivery Cycle */}
                  {addingCycleToCard === item.key && (
                    <div className="mb-2 p-2.5 bg-blue-50/80 border border-blue-300 rounded-lg space-y-2 text-xs">
                      <div className="font-bold text-blue-950 flex items-center justify-between">
                        <span>Record New Delivery Cycle</span>
                        <button
                          type="button"
                          onClick={() => setAddingCycleToCard(null)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block">Quantity Delivered</label>
                          <input
                            type="number"
                            min={1}
                            max={100000}
                            step={1}
                            value={newCycleQty}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') e.preventDefault();
                            }}
                            onChange={(e) => setNewCycleQty(sanitizeQty(e.target.value, 1, 100000))}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-bold text-slate-900 bg-white"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            placeholder="e.g. 1000"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block">Delivery Date</label>
                          <input
                            type="date"
                            value={newCycleDate}
                            onChange={(e) => setNewCycleDate(e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-semibold text-slate-900 bg-white"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">
                          Office Request Date (Optional - leave empty if active)
                        </label>
                        <input
                          type="date"
                          value={newCycleRequestDate}
                          onChange={(e) => setNewCycleRequestDate(e.target.value)}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-slate-900 bg-white"
                          style={{ color: '#000000', backgroundColor: '#ffffff' }}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAddingCycleToCard(null)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNewCycle(item.officeId, item.flyerTypeId)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                        >
                          Save Cycle
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {pairDeliveries.map((del) => {
                      const cycleEnd = del.newRequestDate || del.depletedDate;
                      const days = cycleEnd
                        ? getDaysDiff(del.date, cycleEnd)
                        : getDaysDiff(del.date, TODAY_STR);
                      const rate = (del.quantityDelivered / Math.max(1, days)).toFixed(1);

                      return (
                        <div
                          key={del.id}
                          className="text-[11px] p-2 rounded bg-slate-50 border border-slate-200 space-y-1.5 transition-colors hover:bg-slate-100/60"
                        >
                          {/* Row Top: Quantity, Date & Lapse */}
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={100000}
                                  step={1}
                                  value={del.quantityDelivered}
                                  onKeyDown={(e) => {
                                    if (e.key === '.' || e.key === ',') e.preventDefault();
                                  }}
                                  onChange={(e) => {
                                    const val = sanitizeQty(e.target.value, 1, 100000);
                                    onUpdateDelivery?.(del.id, { quantityDelivered: val });
                                  }}
                                  className="w-20 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right font-black text-slate-900 bg-white"
                                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                  title="Edit delivery quantity"
                                />
                                <span className="text-slate-400">flyers</span>
                                <input
                                  type="date"
                                  value={del.date}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onUpdateDelivery?.(del.id, { date: e.target.value });
                                    }
                                  }}
                                  className="border border-slate-300 rounded px-1 py-0.5 text-[11px] font-semibold text-slate-900 bg-white"
                                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                  title="Edit delivery date"
                                />
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-slate-900">
                                  {del.quantityDelivered} flyers
                                </span>
                                <span className="text-slate-400 ml-1">({del.date})</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {cycleEnd ? (
                                <span className="text-slate-700 text-[10px]">
                                  Lapse: <strong>{days} days</strong> ({rate}/d)
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Active ({days}d)
                                </span>
                              )}

                              {/* Delete cycle button */}
                              {isEditing && onDeleteDelivery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete this delivery record of ${del.quantityDelivered} flyers?`)) {
                                      onDeleteDelivery(del.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                  title="Delete this delivery cycle"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row Bottom: Request Date & Quick Action */}
                          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70 gap-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-600">Office Request:</span>
                                  <input
                                    type="date"
                                    value={del.newRequestDate || ''}
                                    onChange={(e) => {
                                      onUpdateDelivery?.(del.id, {
                                        newRequestDate: e.target.value || undefined,
                                        depletedDate: e.target.value || undefined,
                                      });
                                    }}
                                    className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 bg-white"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                  />
                                </div>
                                {del.newRequestDate ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateDelivery?.(del.id, {
                                        newRequestDate: undefined,
                                        depletedDate: undefined,
                                      });
                                    }}
                                    className="text-amber-700 hover:text-amber-900 underline font-medium cursor-pointer"
                                  >
                                    Clear (Make Active)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateDelivery?.(del.id, {
                                        newRequestDate: TODAY_STR,
                                        depletedDate: TODAY_STR,
                                      });
                                    }}
                                    className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                                  >
                                    Set Requested Today
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                <span>
                                  {del.newRequestDate
                                    ? `New Request: ${del.newRequestDate}`
                                    : del.depletedDate
                                    ? `Out of stock: ${del.depletedDate}`
                                    : 'Awaiting office request date'}
                                </span>

                                {/* Quick button to set new request date for active delivery */}
                                {!cycleEnd && (
                                  <div>
                                    {activeRequestDelId === del.id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="date"
                                          value={inputRequestDate}
                                          onChange={(e) => setInputRequestDate(e.target.value)}
                                          className="border border-slate-300 rounded px-1 py-0.5 text-[10px] bg-white font-semibold text-slate-900"
                                          style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveRequestDate(del.id)}
                                          className="px-1.5 py-0.5 bg-blue-600 text-white rounded font-bold cursor-pointer"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setActiveRequestDelId(null)}
                                          className="text-slate-400 hover:text-slate-600 px-1"
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveRequestDelId(del.id);
                                          setInputRequestDate(TODAY_STR);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline flex items-center gap-0.5"
                                      >
                                        <CalendarCheck2 className="w-3 h-3" />
                                        <span>Set New Request Date</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Restock Delivery Qty */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isDepleted && latestDel && !latestDel.newRequestDate && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onRecordNewRequest) {
                          onRecordNewRequest(latestDel.id, TODAY_STR);
                        } else {
                          onMarkDepleted(item.officeId, item.flyerTypeId);
                        }
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 text-amber-800 hover:bg-amber-50 rounded transition-colors cursor-pointer border border-amber-200 flex items-center gap-1"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      <span>Office Requested Today</span>
                    </button>
                  )}

                  {onOpenEmailModal && (
                    <button
                      type="button"
                      onClick={() => onOpenEmailModal(item.officeId)}
                      className="text-xs font-semibold px-2.5 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1"
                      title={`Send pre-built dispatch notice email to ${item.officeName}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Notice</span>
                    </button>
                  )}
                </div>

                {/* Restock Delivery Trigger (with editable restock qty when in edit mode) */}
                <div className="ml-auto flex items-center gap-2">
                  {isEditing && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Restock:</span>
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        step={100}
                        value={item.recommendedDeliveryQty}
                        onKeyDown={(e) => {
                          if (e.key === '.' || e.key === ',') e.preventDefault();
                        }}
                        onChange={(e) => {
                          const val = sanitizeQty(e.target.value, 1, 100000);
                          onUpdateMetricOverride?.(item.key, { recommendedDeliveryQty: val });
                        }}
                        className="w-20 border border-blue-400 rounded px-1.5 py-0.5 text-xs text-right font-black text-blue-900 bg-white"
                        style={{ color: '#1e3a8a', backgroundColor: '#ffffff' }}
                        title="Edit recommended restock delivery quantity"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onOpenNewDelivery(
                        item.officeId,
                        item.flyerTypeId,
                        item.recommendedDeliveryQty
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Deliver {item.recommendedDeliveryQty} Flyers</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
