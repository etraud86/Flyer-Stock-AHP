import React, { useState } from 'react';
import {
  Package,
  Truck,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  Plus,
  Tent,
  Footprints,
  Upload,
  Sliders,
  Edit3,
} from 'lucide-react';
import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  ActiveTab,
} from '../types';
import { computeOfficeFlyerMetrics, computeWarehouseStock } from '../utils/calculations';

interface DashboardViewProps {
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs?: TourismFair[];
  otherDeliveries?: OtherDeliveryRecord[];
  metricOverrides?: Record<string, import('../types').OfficeFlyerMetricOverride>;
  onOpenNewDelivery: (officeId?: string, flyerTypeId?: string, defaultQty?: number) => void;
  onOpenAddStock: (flyerTypeId?: string) => void;
  onMarkDepleted: (officeId: string, flyerTypeId: string) => void;
  onNavigateToTab: (tab: ActiveTab) => void;
  onOpenUploadExcel: () => void;
  onOpenAddFlyer: () => void;
  onOpenEditFlyerStock: (flyerId: string) => void;
  onOpenOfficesDirectory?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  flyers,
  offices,
  deliveries,
  batches,
  fairs = [],
  otherDeliveries = [],
  metricOverrides = {},
  onOpenNewDelivery,
  onOpenAddStock,
  onMarkDepleted,
  onNavigateToTab,
  onOpenUploadExcel,
  onOpenAddFlyer,
  onOpenEditFlyerStock,
  onOpenOfficesDirectory,
}) => {
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all');
  const [selectedFlyerFilter, setSelectedFlyerFilter] = useState<string>('all');
  const [targetBufferDays, setTargetBufferDays] = useState<number>(21);

  // Computed data
  const metrics = computeOfficeFlyerMetrics(offices, flyers, deliveries, undefined, targetBufferDays, metricOverrides);
  const warehouseStock = computeWarehouseStock(flyers, deliveries, batches, fairs, otherDeliveries);

  // High-level aggregates
  const totalWarehouseUnits = warehouseStock.reduce((sum, w) => sum + w.currentWarehouseStock, 0);
  const lowStockFlyersCount = warehouseStock.filter((w) => w.isLowStock).length;
  const totalDeliveredFlyers = deliveries.reduce((sum, d) => sum + d.quantityDelivered, 0);
  const totalFairsSpent = fairs.reduce((sum, f) => sum + f.totalFlyersSpent, 0);
  const totalOtherDeliveries = otherDeliveries.reduce((sum, od) => sum + od.quantity, 0);
  const grandTotalDistributed = totalDeliveredFlyers + totalFairsSpent + totalOtherDeliveries;


  const depletedCount = metrics.filter((m) => m.status === 'depleted').length;
  const criticalCount = metrics.filter((m) => m.status === 'critical').length;

  const validPeriods = metrics.filter((m) => m.avgUsagePeriodDays > 0);
  const overallAvgPeriodDays =
    validPeriods.length > 0
      ? Math.round(validPeriods.reduce((sum, m) => sum + m.avgUsagePeriodDays, 0) / validPeriods.length)
      : 25;

  // Filter metrics
  const filteredMetrics = metrics.filter((m) => {
    if (selectedOfficeFilter !== 'all' && m.officeId !== selectedOfficeFilter) return false;
    if (selectedFlyerFilter !== 'all' && m.flyerTypeId !== selectedFlyerFilter) return false;
    return true;
  });

  // Sort: Depleted first, then Critical, then Moderate, then Healthy
  const statusWeight: Record<string, number> = {
    depleted: 0,
    critical: 1,
    moderate: 2,
    healthy: 3,
  };
  const sortedMetrics = [...filteredMetrics].sort(
    (a, b) => statusWeight[a.status] - statusWeight[b.status] || a.estimatedDaysRemaining - b.estimatedDaysRemaining
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Distribution &amp; Stock Depletion Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor flyer inventory, batch deliveries per tourism office, and depletion period until stockout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('spreadsheet')}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Open in Excel Grid</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Warehouse Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Warehouse Stock On-Hand
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {totalWarehouseUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">flyers</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between pt-2 border-t border-slate-100">
            {lowStockFlyersCount > 0 ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                {lowStockFlyersCount} flyer types low on stock
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All flyer stocks healthy
              </span>
            )}
            <button
              onClick={() => onOpenAddStock()}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              + Stock In
            </button>
          </div>
        </div>

        {/* Card 2: Total Distributed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total dispatched to tourism offices
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {totalDeliveredFlyers.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>{deliveries.length} batch deliveries logged</span>
            <span className="font-semibold text-slate-700">{offices.length} offices served</span>
          </div>
        </div>

        {/* Card 3: Stockout & Critical Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              offices without flyers
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                depletedCount > 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                depletedCount > 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {depletedCount}
            </span>
            <span className="text-xs text-slate-500">depleted</span>
            {criticalCount > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-auto">
                +{criticalCount} critical
              </span>
            )}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-500">Require immediate restock</span>
            <button
              onClick={() => onNavigateToTab('depletion')}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              View List →
            </button>
          </div>
        </div>

        {/* Card 4: Avg Depletion Period */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Avg Office Usage Period
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {overallAvgPeriodDays}
            </span>
            <span className="text-xs text-slate-500">days per delivery</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Time until office runs empty</span>
            <span className="text-purple-700 font-semibold">Distribution Velocity</span>
          </div>
        </div>
      </div>

      {/* Multi-Channel Distribution Channel Breakdown Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Complete Distribution Network Coverage
            </span>
            <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
              <span>{grandTotalDistributed.toLocaleString()} Flyers Dispatched Across All Channels</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Tracks circuit deliveries to tourism offices, promotional material spent in tourism fairs, and other direct deliveries (guided tours, village visitors, festivals).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            {/* Circuit Offices */}
            <button
              onClick={() => onNavigateToTab('depletion')}
              className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-2.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[11px] text-blue-300 font-medium">
                <Truck className="w-3.5 h-3.5" />
                <span>Offices</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-1">
                {totalDeliveredFlyers.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{deliveries.length} dispatches</div>
            </button>

            {/* Tourism Fairs */}
            <button
              onClick={() => onNavigateToTab('fairs')}
              className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-2.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <Tent className="w-3.5 h-3.5" />
                <span>Fairs/Expos</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-1">
                {totalFairsSpent.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fairs.length} fairs spent</div>
            </button>

            {/* Other Deliveries */}
            <button
              onClick={() => onNavigateToTab('other_deliveries')}
              className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg p-2.5 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
                <Footprints className="w-3.5 h-3.5" />
                <span>Non-Circuit</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white mt-1">
                {totalOtherDeliveries.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{otherDeliveries.length} events/tours</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Office Deliveries, Amount Distributed & Runout Countdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Tourism Office Deliveries &amp; Depletion Tracker</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Amount distributed in each delivery, burn rate, and exact period until the office runs out of flyers.
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="filter-office"
                aria-label="Filter by Tourism Office"
                value={selectedOfficeFilter}
                onChange={(e) => setSelectedOfficeFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Tourism Offices ({offices.length})</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} - {o.name}
                  </option>
                ))}
              </select>

              <select
                id="filter-flyer"
                aria-label="Filter by Flyer Type"
                value={selectedFlyerFilter}
                onChange={(e) => setSelectedFlyerFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Flyer Types ({flyers.length})</option>
                {flyers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onOpenNewDelivery()}
                className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Delivery</span>
              </button>

              {onOpenOfficesDirectory && (
                <button
                  type="button"
                  onClick={onOpenOfficesDirectory}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="View and edit tourism offices contacts, emails, and phone numbers"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Office Contacts &amp; Emails</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table of Deliveries & Usage Periods */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tourism Office</th>
                <th className="px-4 py-3">Flyer Type &amp; SKU</th>
                <th className="px-4 py-3 text-right">Last Delivered</th>
                <th className="px-4 py-3 text-right">Daily Burn Rate</th>
                <th className="px-4 py-3 text-right">Usage Period</th>
                <th className="px-4 py-3 text-right">Est. Current Stock</th>
                <th className="px-4 py-3">Period Till Without Flyers</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedMetrics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    No delivery records match the selected filters.
                  </td>
                </tr>
              ) : (
                sortedMetrics.map((item) => {
                  const flyer = flyers.find((f) => f.id === item.flyerTypeId);
                  const isDepleted = item.status === 'depleted';
                  const isCritical = item.status === 'critical';

                  // Calculate percentage bar for stock remaining
                  const percentLeft = Math.max(
                    0,
                    Math.min(100, Math.round((item.currentEstimatedStock / Math.max(1, item.lastDeliveredQty)) * 100))
                  );

                  return (
                    <tr
                      key={`${item.officeId}-${item.flyerTypeId}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        isDepleted ? 'bg-red-50/40' : isCritical ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Office Name & Code */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.officeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.officeCode}</div>
                      </td>

                      {/* Flyer Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: flyer?.color || '#2563eb' }}
                          />
                          <div>
                            <div className="font-medium text-slate-800">{item.flyerName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{item.flyerSku}</div>
                          </div>
                        </div>
                      </td>

                      {/* Last Delivered Amount */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">
                          {item.lastDeliveredQty.toLocaleString()}{' '}
                          <span className="font-normal text-[11px] text-slate-500">flyers</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          on {item.lastDeliveryDate} ({item.daysSinceLastDelivery}d ago)
                        </div>
                      </td>

                      {/* Daily Burn Rate */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-slate-800">
                          {item.avgDailyDistributionRate}
                          <span className="font-normal text-[11px] text-slate-500">/day</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.completedCycles} cycle{item.completedCycles !== 1 ? 's' : ''} audited
                        </div>
                      </td>

                      {/* Usage Period (Days used per delivery until empty) */}
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-slate-800">
                          {item.avgUsagePeriodDays}{' '}
                          <span className="font-normal text-[11px] text-slate-500">days</span>
                        </div>
                        <div className="text-[10px] text-slate-400">full batch lifespan</div>
                      </td>

                      {/* Est. Current Stock */}
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`font-bold ${
                            isDepleted
                              ? 'text-red-600'
                              : isCritical
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.currentEstimatedStock.toLocaleString()}{' '}
                          <span className="font-normal text-[11px] text-slate-500">left</span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-20 ml-auto mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDepleted
                                ? 'bg-red-500 w-0'
                                : isCritical
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentLeft}%` }}
                          />
                        </div>
                      </td>

                      {/* Period till without flyers */}
                      <td className="px-4 py-3">
                        {isDepleted ? (
                          <div className="text-red-700 font-bold flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            <span>OUT OF FLYERS</span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{item.estimatedDaysRemaining} days remaining</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Empty by {item.projectedRunoutDate}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {item.status === 'depleted' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Depleted
                          </span>
                        )}
                        {item.status === 'critical' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Critical (&lt;5d)
                          </span>
                        )}
                        {item.status === 'moderate' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Moderate
                          </span>
                        )}
                        {item.status === 'healthy' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Healthy (&gt;14d)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              onOpenNewDelivery(
                                item.officeId,
                                item.flyerTypeId,
                                item.recommendedDeliveryQty
                              )
                            }
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[11px] transition-colors cursor-pointer"
                            title={`Deliver flyers to ${item.officeName}`}
                          >
                            Restock
                          </button>
                          {!isDepleted && (
                            <button
                              onClick={() => onMarkDepleted(item.officeId, item.flyerTypeId)}
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded font-medium text-[11px] transition-colors cursor-pointer"
                              title="Mark this batch as completely depleted today"
                            >
                              Empty
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
      </div>

      {/* Two-Column Section: Warehouse Material Stock & Next Delivery Replenishment Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Warehouse Stocking Material Inventory */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Warehouse Stocking Material</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Central storage stock ready for dispatch to tourism offices.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={onOpenUploadExcel}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded transition-colors cursor-pointer"
                title="Upload Excel spreadsheet to bulk update or add flyers"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Excel</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddFlyer}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer"
                title="Add a new flyer type to stock catalog"
              >
                <Plus className="w-3 h-3" />
                <span>+ Flyer</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddStock()}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded transition-colors cursor-pointer"
                title="Receive printed batch into warehouse"
              >
                <span>+ Batch</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {warehouseStock.map((item) => (
              <div
                key={item.flyer.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.flyer.color }}
                    />
                    <span className="font-semibold text-slate-800 text-xs truncate">
                      {item.flyer.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span className="font-mono">{item.flyer.sku}</span>
                    <span>&bull;</span>
                    <span>Printed: {item.totalReceived.toLocaleString()}</span>
                    <span>&bull;</span>
                    <span>Dispatched: {item.totalDispatched.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span
                        className={`text-sm font-bold ${
                          item.isLowStock ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {item.currentWarehouseStock.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500">left</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Min: {item.flyer.minThreshold.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenEditFlyerStock(item.flyer.id)}
                    className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-md border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                    title="Change available stock or edit flyer details"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Change Stock</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Recommended Next Restock Deliveries */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Next Delivery Order Planner</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prevent offices from running out by replenishing based on target usage days.
              </p>
            </div>

            {/* Target Buffer Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-500">Buffer:</span>
              {[14, 21, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setTargetBufferDays(days)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    targetBufferDays === days
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {sortedMetrics
              .filter((m) => m.status === 'depleted' || m.status === 'critical')
              .map((item) => (
                <div
                  key={`rec-${item.officeId}-${item.flyerTypeId}`}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      {item.officeName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-slate-700">{item.flyerName}</span>
                      <span>&bull;</span>
                      <span
                        className={
                          item.status === 'depleted'
                            ? 'text-red-600 font-bold'
                            : 'text-amber-600 font-semibold'
                        }
                      >
                        {item.status === 'depleted'
                          ? 'Empty now'
                          : `${item.estimatedDaysRemaining}d remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-blue-700">
                        +{item.recommendedDeliveryQty.toLocaleString()} flyers
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {targetBufferDays}-day coverage
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        onOpenNewDelivery(
                          item.officeId,
                          item.flyerTypeId,
                          item.recommendedDeliveryQty
                        )
                      }
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Deliver
                    </button>
                  </div>
                </div>
              ))}

            {sortedMetrics.filter((m) => m.status === 'depleted' || m.status === 'critical').length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                All offices have adequate flyers for the selected buffer period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
