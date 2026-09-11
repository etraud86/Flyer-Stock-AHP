import * as XLSX from 'xlsx';
import {
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  OfficeFlyerMetricOverride,
} from '../types';
import { computeOfficeFlyerMetrics, computeWarehouseStock, getDaysDiff, TODAY_STR } from './calculations';

export function exportToExcelWorkbook(
  flyers: FlyerType[],
  offices: TourismOffice[],
  deliveries: DeliveryRecord[],
  batches: StockInBatch[],
  fairs: TourismFair[] = [],
  otherDeliveries: OtherDeliveryRecord[] = [],
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>
) {
  const wb = XLSX.utils.book_new();

  // 1. Warehouse Stock Sheet
  const stockSummary = computeWarehouseStock(flyers, deliveries, batches, fairs, otherDeliveries);
  const stockSheetData = [
    [
      'SKU',
      'Flyer Title & Type',
      'Category',
      'Language',
      'Total Printed (Stock-In)',
      'Circuit Deliveries',
      'Fairs Consumption',
      'Non-Circuit Deliveries',
      'Total Dispatched (All Channels)',
      'Current Warehouse On-Hand',
      'Min Alert Threshold',
      'Unit Print Cost ($)',
      'Stock Inventory Value ($)',
      'Stock Status',
    ],
    ...stockSummary.map((item) => {
      const value = item.currentWarehouseStock * item.flyer.unitCost;
      const status = item.isLowStock ? 'LOW STOCK ALERT' : 'OPTIMAL';
      return [
        item.flyer.sku,
        item.flyer.name,
        item.flyer.category,
        item.flyer.language,
        item.totalReceived,
        item.totalDispatchedCircuit,
        item.totalSpentFairs,
        item.totalSpentOther,
        item.totalDispatched,
        item.currentWarehouseStock,
        item.flyer.minThreshold,
        item.flyer.unitCost,
        Math.round(value * 100) / 100,
        status,
      ];
    }),
  ];
  const wsStock = XLSX.utils.aoa_to_sheet(stockSheetData);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stock_Warehouse');

  // 2. Deliveries Sheet
  const deliveriesSheetData = [
    [
      'Delivery Ref',
      'Dispatch Date',
      'Tourism Office Name',
      'Office Code',
      'Contact Email',
      'Flyer Type Title',
      'Amount Distributed in Delivery (Qty)',
      'Courier / Dispatcher',
      'New Request / Depletion Date',
      'Usage Time Lapse (Days)',
      'Burn Rate (Flyers / Day)',
      'Delivery Notes',
    ],
    ...deliveries.map((del) => {
      const office = offices.find((o) => o.id === del.officeId);
      const flyer = flyers.find((f) => f.id === del.flyerTypeId);
      const cycleEndDate = del.newRequestDate || del.depletedDate;
      const days = cycleEndDate
        ? getDaysDiff(del.date, cycleEndDate)
        : getDaysDiff(del.date, TODAY_STR);
      const rate = cycleEndDate
        ? Math.round((del.quantityDelivered / days) * 10) / 10
        : 'Active (Pending)';
      return [
        del.deliveryRef,
        del.date,
        office?.name || 'Unknown',
        office?.code || '',
        office?.email || '',
        flyer?.name || 'Unknown',
        del.quantityDelivered,
        del.courier,
        cycleEndDate || 'Still in Use (Active)',
        cycleEndDate ? days : `${days} (So Far)`,
        rate,
        del.notes || '',
      ];
    }),
  ];
  const wsDeliveries = XLSX.utils.aoa_to_sheet(deliveriesSheetData);
  XLSX.utils.book_append_sheet(wb, wsDeliveries, 'Deliveries_Dispatched');

  // 3. Tourism Fairs & Expos Sheet
  const fairsSheetData: (string | number)[][] = [
    [
      'Fair Title',
      'City',
      'Country',
      'Start Date',
      'End Date',
      'Stand Number',
      'Attending Staff',
      'Flyer SKU',
      'Flyer Name',
      'Quantity Taken',
      'Quantity Returned',
      'Net Flyers Spent',
      'Notes & Outcomes',
    ],
  ];

  fairs.forEach((fair) => {
    fair.items.forEach((item) => {
      const flyer = flyers.find((f) => f.id === item.flyerTypeId);
      fairsSheetData.push([
        fair.name,
        fair.city,
        fair.country,
        fair.startDate,
        fair.endDate,
        fair.standNumber,
        fair.attendingStaff,
        flyer?.sku || item.flyerTypeId,
        flyer?.name || '',
        item.quantityTaken,
        item.quantityReturned,
        item.quantitySpent,
        fair.notes || '',
      ]);
    });
  });
  const wsFairs = XLSX.utils.aoa_to_sheet(fairsSheetData);
  XLSX.utils.book_append_sheet(wb, wsFairs, 'Tourism_Fairs');

  // 4. Non-Circuit Deliveries Sheet (Guided tours, Historical village, Events)
  const otherSheetData = [
    [
      'Delivery Ref',
      'Date',
      'Channel Category',
      'Activity / Description Title',
      'Recipient Group / Station',
      'Flyer SKU',
      'Flyer Name',
      'Quantity Distributed',
      'Delivered By',
      'Notes',
    ],
    ...otherDeliveries.map((od) => {
      const flyer = flyers.find((f) => f.id === od.flyerTypeId);
      return [
        od.ref,
        od.date,
        od.category,
        od.title,
        od.recipientOrGroup,
        flyer?.sku || od.flyerTypeId,
        flyer?.name || '',
        od.quantity,
        od.deliveredBy,
        od.notes || '',
      ];
    }),
  ];
  const wsOther = XLSX.utils.aoa_to_sheet(otherSheetData);
  XLSX.utils.book_append_sheet(wb, wsOther, 'Non_Circuit_Deliveries');

  // 5. Office Depletion and Lifespan Analysis Sheet
  const metrics = computeOfficeFlyerMetrics(offices, flyers, deliveries, TODAY_STR, 21, metricOverrides);
  const depletionSheetData = [
    [
      'Office Code',
      'Tourism Office Name',
      'Flyer SKU',
      'Flyer Name',
      'Total Flyers Distributed',
      'Delivery Batches',
      'Last Delivery Date',
      'Last Amount Distributed',
      'Avg Usage Time Lapse (Days Till Request)',
      'Avg Daily Distribution Rate',
      'Estimated Current Stock',
      'Days Until Without Flyers',
      'Projected Runout Date',
      'Depletion Status',
      'Customized Override',
      'Recommended Restock Delivery (21-Day Buffer)',
    ],
    ...metrics.map((m) => [
      m.officeCode,
      m.officeName,
      m.flyerSku,
      m.flyerName,
      m.totalDelivered,
      m.deliveryCount,
      m.lastDeliveryDate,
      m.lastDeliveredQty,
      m.avgUsagePeriodDays,
      m.avgDailyDistributionRate,
      m.currentEstimatedStock,
      m.estimatedDaysRemaining,
      m.projectedRunoutDate,
      m.status.toUpperCase(),
      m.isCustomized ? 'YES (Manual Override in Grid)' : 'NO (Auto Formula)',
      m.recommendedDeliveryQty,
    ]),
  ];
  const wsDepletion = XLSX.utils.aoa_to_sheet(depletionSheetData);
  XLSX.utils.book_append_sheet(wb, wsDepletion, 'Depletion_and_BurnRate');

  // Trigger file download
  const dateSuffix = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Tourism_Flyers_Stock_And_Deliveries_${dateSuffix}.xlsx`);
}
