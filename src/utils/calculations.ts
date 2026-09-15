import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  OfficeFlyerMetric,
  OfficeFlyerMetricOverride,
  TourismFair,
  OtherDeliveryRecord,
} from '../types';

export const TODAY_STR = '2026-09-07';

export function getDaysDiff(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + Math.round(days));
  return date.toISOString().split('T')[0];
}

/**
 * Calculates metrics for each (Office, FlyerType) combination
 * Based directly on user's operational formula:
 * Time Lapse of Usage = (New Request Date || Depleted Date) - Delivery Date
 * Supports customized overrides directly from the spreadsheet grid.
 */
export function computeOfficeFlyerMetrics(
  offices: TourismOffice[],
  flyers: FlyerType[],
  deliveries: DeliveryRecord[],
  currentDateStr: string = TODAY_STR,
  targetBufferDays: number = 21,
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>
): OfficeFlyerMetric[] {
  const metrics: OfficeFlyerMetric[] = [];

  for (const office of offices) {
    for (const flyer of flyers) {
      // Find all deliveries for this office and flyer type, sorted by date asc
      const matchingDeliveries = deliveries
        .filter((d) => d.officeId === office.id && d.flyerTypeId === flyer.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (matchingDeliveries.length === 0) continue;

      const totalDelivered = matchingDeliveries.reduce((sum, d) => sum + d.quantityDelivered, 0);
      const deliveryCount = matchingDeliveries.length;
      const latestDelivery = matchingDeliveries[matchingDeliveries.length - 1];

      // Calculate historical usage time lapses from completed cycles or customized values:
      // Priority: del.customTimeLapseDays > del.newRequestDate > del.depletedDate > next delivery's date
      const historicalPeriods: { days: number; qty: number; dailyRate: number }[] = [];

      for (let i = 0; i < matchingDeliveries.length; i++) {
        const del = matchingDeliveries[i];
        const nextDeliveryDate = i < matchingDeliveries.length - 1 ? matchingDeliveries[i + 1].date : null;
        const cycleEndDate = del.newRequestDate || del.depletedDate || nextDeliveryDate;

        if (del.customTimeLapseDays !== undefined && del.customTimeLapseDays > 0) {
          const days = del.customTimeLapseDays;
          const rate = del.customDailyBurnRate !== undefined && del.customDailyBurnRate > 0
            ? del.customDailyBurnRate
            : Math.round((del.quantityDelivered / days) * 10) / 10;
          historicalPeriods.push({ days, qty: del.quantityDelivered, dailyRate: rate });
        } else if (cycleEndDate) {
          const days = getDaysDiff(del.date, cycleEndDate);
          const rate = del.customDailyBurnRate !== undefined && del.customDailyBurnRate > 0
            ? del.customDailyBurnRate
            : del.quantityDelivered / days;
          historicalPeriods.push({ days, qty: del.quantityDelivered, dailyRate: rate });
        }
      }

      // Compute average daily rate and average cycle duration
      let avgDailyDistributionRate = 45; // baseline fallback
      let avgUsagePeriodDays = 25; // baseline fallback
      const completedCycles = historicalPeriods.length;

      if (historicalPeriods.length > 0) {
        const sumRates = historicalPeriods.reduce((acc, p) => acc + p.dailyRate, 0);
        avgDailyDistributionRate = Math.round((sumRates / historicalPeriods.length) * 10) / 10;

        const sumDays = historicalPeriods.reduce((acc, p) => acc + p.days, 0);
        avgUsagePeriodDays = Math.round(sumDays / historicalPeriods.length);
      } else {
        // Estimate based on footfall tier if no past cycle yet
        if (office.footfallTier === 'High') {
          avgDailyDistributionRate = 75;
        } else if (office.footfallTier === 'Seasonal Peak') {
          avgDailyDistributionRate = 95;
        } else {
          avgDailyDistributionRate = 35;
        }
        avgUsagePeriodDays = Math.round(latestDelivery.quantityDelivered / avgDailyDistributionRate);
      }

      // Check if user has provided manual customization for this office + flyer in the grid
      const metricKey = `${office.id}_${flyer.id}`;
      const override = metricOverrides?.[metricKey];
      let isCustomized = false;
      let hasCustomTimeLapse = false;
      let hasCustomBurnRate = false;
      let hasCustomStock = false;

      if (override?.avgUsagePeriodDays !== undefined && override.avgUsagePeriodDays > 0) {
        avgUsagePeriodDays = override.avgUsagePeriodDays;
        isCustomized = true;
        hasCustomTimeLapse = true;
      }

      if (override?.avgDailyDistributionRate !== undefined && override.avgDailyDistributionRate > 0) {
        avgDailyDistributionRate = override.avgDailyDistributionRate;
        isCustomized = true;
        hasCustomBurnRate = true;
      }

      // Evaluate active (latest) delivery status
      const daysSinceLatest = getDaysDiff(latestDelivery.date, currentDateStr);

      let currentEstimatedStock = 0;
      let estimatedDaysRemaining = 0;
      let isDepleted = false;
      let projectedRunoutDate = '';

      if (override?.currentEstimatedStock !== undefined && override.currentEstimatedStock >= 0) {
        currentEstimatedStock = override.currentEstimatedStock;
        isCustomized = true;
        hasCustomStock = true;
        if (currentEstimatedStock === 0) {
          isDepleted = true;
          estimatedDaysRemaining = 0;
          projectedRunoutDate = currentDateStr;
        } else {
          estimatedDaysRemaining = Math.max(1, Math.round(currentEstimatedStock / Math.max(0.1, avgDailyDistributionRate)));
          projectedRunoutDate = addDays(currentDateStr, estimatedDaysRemaining);
        }
      } else if (latestDelivery.newRequestDate || latestDelivery.depletedDate) {
        // Explicitly reported new request / depleted
        const markDate = latestDelivery.newRequestDate || latestDelivery.depletedDate!;
        currentEstimatedStock = 0;
        estimatedDaysRemaining = 0;
        isDepleted = true;
        projectedRunoutDate = markDate;
      } else {
        // Active delivery awaiting new request
        const distributedSoFar = Math.round(daysSinceLatest * avgDailyDistributionRate);
        currentEstimatedStock = Math.max(0, latestDelivery.quantityDelivered - distributedSoFar);

        if (currentEstimatedStock <= 0) {
          isDepleted = true;
          estimatedDaysRemaining = 0;
          const daysToDeplete = Math.round(latestDelivery.quantityDelivered / Math.max(0.1, avgDailyDistributionRate));
          projectedRunoutDate = addDays(latestDelivery.date, daysToDeplete);
        } else {
          estimatedDaysRemaining = Math.max(1, Math.round(currentEstimatedStock / Math.max(0.1, avgDailyDistributionRate)));
          projectedRunoutDate = addDays(currentDateStr, estimatedDaysRemaining);
        }
      }

      // Determine Status
      let status: 'depleted' | 'critical' | 'moderate' | 'healthy' = 'healthy';
      if (isDepleted || currentEstimatedStock === 0 || estimatedDaysRemaining <= 0) {
        status = 'depleted';
      } else if (estimatedDaysRemaining <= 5) {
        status = 'critical';
      } else if (estimatedDaysRemaining <= 14) {
        status = 'moderate';
      } else {
        status = 'healthy';
      }

      // Recommended delivery quantity for target buffer:
      const rawNeeded = targetBufferDays * avgDailyDistributionRate - currentEstimatedStock;
      const recommendedDeliveryQty = Math.max(200, Math.ceil(Math.max(0, rawNeeded) / 100) * 100);

      metrics.push({
        key: metricKey,
        officeId: office.id,
        officeName: office.name,
        officeCode: office.code,
        flyerTypeId: flyer.id,
        flyerName: flyer.name,
        flyerSku: flyer.sku,
        totalDelivered,
        deliveryCount,
        lastDeliveryDate: latestDelivery.date,
        lastDeliveredQty: latestDelivery.quantityDelivered,
        completedCycles,
        avgUsagePeriodDays,
        avgDailyDistributionRate,
        currentEstimatedStock,
        daysSinceLastDelivery: daysSinceLatest,
        estimatedDaysRemaining,
        projectedRunoutDate,
        isDepleted,
        status,
        recommendedDeliveryQty,
        isCustomized,
        hasCustomTimeLapse,
        hasCustomBurnRate,
        hasCustomStock,
      });
    }
  }

  return metrics;
}

/**
 * Calculates current warehouse inventory levels after all channels:
 * - Deliveries to Circuit Tourism Offices
 * - Tourism Fairs & Expos
 * - Non-Circuit Deliveries (Guided tours, Historical Village walk-in visitors, Events)
 */
export function computeWarehouseStock(
  flyers: FlyerType[],
  deliveries: DeliveryRecord[],
  batches: { flyerTypeId: string; quantity: number }[],
  fairs: TourismFair[] = [],
  otherDeliveries: OtherDeliveryRecord[] = []
): {
  flyer: FlyerType;
  totalReceived: number;
  totalDispatchedCircuit: number;
  totalSpentFairs: number;
  totalSpentOther: number;
  totalDispatched: number;
  currentWarehouseStock: number;
  isLowStock: boolean;
  stockHealthPercent: number;
}[] {
  return flyers.map((flyer) => {
    const totalReceivedFromBatches = batches
      .filter((b) => b.flyerTypeId === flyer.id)
      .reduce((sum, b) => sum + b.quantity, 0);

    // Guaranteed baseline warehouse stock for this flyer (e.g. 10,000 units):
    // If flyer has registered warehouseStock, or is AHP-ROT-45 (10,000 flyers),
    // ensure base stock is connected and accounted for in central warehouse stock.
    let baseRegisteredStock = flyer.warehouseStock && flyer.warehouseStock > 0 ? flyer.warehouseStock : 0;
    if (
      (flyer.sku === 'AHP-ROT-45' || flyer.name?.toLowerCase().includes('roteiro')) &&
      baseRegisteredStock < 10000
    ) {
      baseRegisteredStock = 10000;
    }

    const totalReceived = Math.max(totalReceivedFromBatches, baseRegisteredStock);

    const totalDispatchedCircuit = deliveries
      .filter((d) => d.flyerTypeId === flyer.id)
      .reduce((sum, d) => sum + d.quantityDelivered, 0);

    // Flyers spent at tourism fairs
    let totalSpentFairs = 0;
    for (const fair of fairs) {
      for (const item of fair.items) {
        if (item.flyerTypeId === flyer.id) {
          totalSpentFairs += item.quantitySpent;
        }
      }
    }

    // Flyers distributed in other non-circuit events / guided tours / village office
    const totalSpentOther = otherDeliveries
      .filter((od) => od.flyerTypeId === flyer.id)
      .reduce((sum, od) => sum + od.quantity, 0);

    const totalDispatched = totalDispatchedCircuit + totalSpentFairs + totalSpentOther;
    const currentWarehouseStock = Math.max(0, totalReceived - totalDispatched);
    const isLowStock = currentWarehouseStock <= flyer.minThreshold;
    const stockHealthPercent = Math.min(
      100,
      Math.round((currentWarehouseStock / Math.max(1, flyer.minThreshold * 3)) * 100)
    );

    return {
      flyer,
      totalReceived,
      totalDispatchedCircuit,
      totalSpentFairs,
      totalSpentOther,
      totalDispatched,
      currentWarehouseStock,
      isLowStock,
      stockHealthPercent,
    };
  });
}

