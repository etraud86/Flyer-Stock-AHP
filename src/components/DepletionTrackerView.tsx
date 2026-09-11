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
} from 'lucide-react';
import { FlyerType, TourismOffice, DeliveryRecord, OfficeFlyerMetric, OfficeFlyerMetricOverride } from '../types';
import { computeOfficeFlyerMetrics, getDaysDiff, TODAY_STR } from '../utils/calculations';

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
}) => {

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'depleted' | 'critical' | 'healthy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRequestDelId, setActiveRequestDelId] = useState<string | null>(null);
  const [inputRequestDate, setInputRequestDate] = useState<string>(TODAY_STR);

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

  const handleSaveRequestDate = (deliveryId: string) => {
    if (onRecordNewRequest && inputRequestDate) {
      onRecordNewRequest(deliveryId, inputRequestDate);
    }
    setActiveRequestDelId(null);
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
            Measure the exact time lapse between delivery and new requests from each tourism office.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
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
            How the Time Lapse &amp; Flyer Consumption is Calculated
          </div>
          <p>
            Without needing day-to-day access inside remote tourism offices, you simply record the{' '}
            <strong>Delivery Date</strong> (when X flyers were delivered) and the{' '}
            <strong>New Request Date</strong> (when the office calls asking for more).
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

          return (
            <div
              key={`${item.officeId}-${item.flyerTypeId}`}
              className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                isDepleted
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
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
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

                  {/* Status Badge */}
                  <div>
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
                </div>

                {/* Quantitative Metrics Highlight */}
                <div className="py-3 bg-slate-50/60 rounded-lg my-3 px-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Usage Time Lapse
                        {item.hasCustomTimeLapse && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">⚡ Custom</span>
                        )}
                      </span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {item.avgUsagePeriodDays}{' '}
                        <span className="text-xs font-normal text-slate-500">days</span>
                      </div>
                      <span className="text-[10px] text-slate-400">delivery to request</span>
                    </div>

                    <div className="border-x border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Distribution Pace
                        {item.hasCustomBurnRate && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">⚡ Custom</span>
                        )}
                      </span>
                      <div className="text-base font-bold text-blue-700 mt-0.5">
                        {item.avgDailyDistributionRate}
                      </div>
                      <span className="text-[10px] text-slate-400">flyers / day</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium flex items-center justify-center gap-1">
                        Est. In Office
                        {item.hasCustomStock && (
                          <span className="text-[9px] text-purple-700 bg-purple-100 px-1 rounded font-bold">⚡ Custom</span>
                        )}
                      </span>
                      <div
                        className={`text-base font-bold mt-0.5 ${
                          isDepleted ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {item.currentEstimatedStock.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">units remaining</span>
                    </div>
                  </div>

                  {item.isCustomized && onResetMetricOverride && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <span className="text-purple-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Custom values entered in Excel Grid
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

                {/* Timeline & Runout details */}
                <div className="text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Delivery Amount:</span>
                    <span className="font-semibold text-slate-900">
                      {item.lastDeliveredQty.toLocaleString()} flyers ({item.lastDeliveryDate})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Days Elapsed:</span>
                    <span className="font-medium text-slate-800">
                      {item.daysSinceLastDelivery} days since delivery
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Next Replenishment Date:</span>
                    <span
                      className={`font-semibold ${
                        isDepleted ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {isDepleted
                        ? `Requested on ${item.projectedRunoutDate}`
                        : `Estimated new request on ${item.projectedRunoutDate}`}
                    </span>
                  </div>
                </div>

                {/* Historical Delivery Batches Log for this pair */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Delivery Cycles ({pairDeliveries.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Amount &amp; Time Lapse
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {pairDeliveries.map((del) => {
                      const cycleEnd = del.newRequestDate || del.depletedDate;
                      const days = cycleEnd
                        ? getDaysDiff(del.date, cycleEnd)
                        : getDaysDiff(del.date, TODAY_STR);
                      const rate = (del.quantityDelivered / Math.max(1, days)).toFixed(1);

                      return (
                        <div
                          key={del.id}
                          className="text-[11px] p-2 rounded bg-slate-50 border border-slate-100 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-800">
                                {del.quantityDelivered.toLocaleString()} flyers
                              </span>
                              <span className="text-slate-400 ml-1">({del.date})</span>
                            </div>
                            <div>
                              {cycleEnd ? (
                                <span className="text-slate-700">
                                  Lapse: <strong>{days} days</strong> ({rate}/day)
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium">
                                  Active ({days}d elapsed)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/50">
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
                                  <div className="flex items-center gap-1 mt-1">
                                    <input
                                      type="date"
                                      value={inputRequestDate}
                                      onChange={(e) => setInputRequestDate(e.target.value)}
                                      className="border border-slate-300 rounded px-1 py-0.5 text-[10px] bg-white"
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!isDepleted && latestDel && !latestDel.newRequestDate && (
                    <button
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
                      onClick={() => onOpenEmailModal(item.officeId)}
                      className="text-xs font-semibold px-2.5 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1"
                      title={`Send pre-built dispatch notice email to ${item.officeName}`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Notice</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() =>
                    onOpenNewDelivery(
                      item.officeId,
                      item.flyerTypeId,
                      item.recommendedDeliveryQty
                    )
                  }
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Deliver {item.recommendedDeliveryQty.toLocaleString()} Flyers</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

