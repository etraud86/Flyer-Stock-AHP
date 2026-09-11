import { StockInBatch, FlyerType, DeliveryRecord, TourismFair, OtherDeliveryRecord } from '../types';
import { TODAY_STR } from './calculations';

/**
 * Calculates total dispatched units for a flyer across all 3 channels:
 * 1. Deliveries to Tourism Offices
 * 2. Tourism Fairs & Expos
 * 3. Non-Circuit Deliveries
 */
export function getFlyerTotalDispatched(
  flyerId: string,
  deliveries: DeliveryRecord[],
  fairs: TourismFair[] = [],
  otherDeliveries: OtherDeliveryRecord[] = []
): number {
  const circuitDelivered = deliveries
    .filter((d) => d.flyerTypeId === flyerId)
    .reduce((sum, d) => sum + d.quantityDelivered, 0);

  let fairsSpent = 0;
  for (const fair of fairs) {
    for (const item of fair.items) {
      if (item.flyerTypeId === flyerId) {
        fairsSpent += item.quantitySpent;
      }
    }
  }

  const otherSpent = otherDeliveries
    .filter((od) => od.flyerTypeId === flyerId)
    .reduce((sum, od) => sum + od.quantity, 0);

  return circuitDelivered + fairsSpent + otherSpent;
}

/**
 * Adjusts or creates stock batches so that the flyer's warehouse balance
 * equals the target stock available now.
 */
export function applyTargetStockToBatches(
  flyerId: string,
  targetAvailableStock: number,
  currentBatches: StockInBatch[],
  totalDispatched: number,
  unitCost: number = 0.16,
  reason: string = 'Stock Adjustment'
): StockInBatch[] {
  const targetTotalReceived = totalDispatched + Math.max(0, targetAvailableStock);

  // Filter batches for this flyer and other flyers
  const otherFlyerBatches = currentBatches.filter((b) => b.flyerTypeId !== flyerId);
  const flyerBatches = currentBatches.filter((b) => b.flyerTypeId === flyerId);

  const currentTotalReceived = flyerBatches.reduce((sum, b) => sum + b.quantity, 0);
  const delta = targetTotalReceived - currentTotalReceived;

  if (delta === 0) {
    return currentBatches;
  }

  if (delta > 0) {
    // Add an adjustment / stock-in batch with the delta
    const newBatch: StockInBatch = {
      id: `bat-adj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      batchRef: `PO-ADJ-${TODAY_STR.replace(/-/g, '')}`,
      date: TODAY_STR,
      flyerTypeId: flyerId,
      quantity: delta,
      printerName: reason,
      unitCost,
    };
    return [...currentBatches, newBatch];
  } else {
    // Need to reduce total received by Math.abs(delta)
    let neededReduction = Math.abs(delta);
    // Clone flyer batches, sorted newest to oldest
    const updatedFlyerBatches = [...flyerBatches];

    for (let i = updatedFlyerBatches.length - 1; i >= 0 && neededReduction > 0; i--) {
      const batch = updatedFlyerBatches[i];
      if (batch.quantity >= neededReduction) {
        batch.quantity -= neededReduction;
        neededReduction = 0;
      } else {
        neededReduction -= batch.quantity;
        batch.quantity = 0;
      }
    }

    // Filter out 0-quantity batches if there are multiple, keep at least one
    const validFlyerBatches = updatedFlyerBatches.filter((b) => b.quantity > 0);
    if (validFlyerBatches.length === 0) {
      validFlyerBatches.push({
        id: `bat-base-${Date.now()}`,
        batchRef: `PO-BASE-${TODAY_STR.replace(/-/g, '')}`,
        date: TODAY_STR,
        flyerTypeId: flyerId,
        quantity: targetTotalReceived,
        printerName: reason,
        unitCost,
      });
    }

    return [...otherFlyerBatches, ...validFlyerBatches];
  }
}
