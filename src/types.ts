export interface FlyerType {
  id: string;
  sku: string;
  name: string;
  category: string;
  language: string;
  warehouseStock: number;
  minThreshold: number;
  unitCost: number; // in currency units (e.g., 0.15)
  color: string;
  description: string;
}

export interface TourismOffice {
  id: string;
  code: string;
  name: string;
  zone: string;
  footfallTier: 'High' | 'Medium' | 'Low' | 'Seasonal Peak';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryRef: string;
  date: string; // YYYY-MM-DD: Date when flyers were delivered
  officeId: string;
  flyerTypeId: string;
  quantityDelivered: number; // Amount of flyers distributed in this delivery
  courier: string; // By who delivered (driver / courier / team member)
  notes?: string;
  
  // Pragmatic usage tracking:
  // Date when the tourism office contacted with a new request for replenishment:
  newRequestDate?: string; // YYYY-MM-DD
  // Depleted date (or runout date when new request occurred):
  depletedDate?: string; // YYYY-MM-DD
  
  surveyedStock?: number;
  surveyDate?: string;

  // Custom overrides directly editable in the spreadsheet grid:
  customTimeLapseDays?: number; // Custom usage time lapse in days
  customDailyBurnRate?: number; // Custom daily burn rate in units/day

  // Digital Signature & Verification Archive (tablet touch / stylus / mouse / PC)
  confirmationStatus?: 'pending' | 'confirmed';
  confirmedAt?: string; // e.g. "2026-09-10 10:14:32"
  confirmedBy?: string; // Name & title of the tourism office staff who confirmed the receipt
  signerRole?: string; // e.g. "Receção / Responsável Posto"
  signatureDataUrl?: string; // Digital handwritten signature captured via canvas (tablet touch / stylus / mouse / PC)
  qrToken?: string; // Cryptographic verification token
  confirmationSignatureCode?: string; // e.g. "VERIFIED-AHP-SORTELHA-89214"
  archiveNotes?: string;
}

export interface OfficeFlyerMetricOverride {
  avgUsagePeriodDays?: number; // Customized time lapse in days
  avgDailyDistributionRate?: number; // Customized daily distribution velocity
  currentEstimatedStock?: number; // Customized estimated stock remaining
  notes?: string;
}

export interface StockInBatch {
  id: string;
  batchRef: string;
  date: string;
  flyerTypeId: string;
  quantity: number;
  printerName: string;
  unitCost: number;
}

// Tourism Fair / Exhibition Record:
export interface FairFlyerSpend {
  flyerTypeId: string;
  quantityTaken: number;
  quantityReturned: number;
  quantitySpent: number; // quantityTaken - quantityReturned
}

export interface TourismFair {
  id: string;
  name: string; // e.g. "BTL Lisbon 2026", "FITUR Madrid 2026", "ITB Berlin"
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  standNumber?: string;
  attendingStaff: string; // e.g. "Ana Ramos, Tiago Mendes"
  items: FairFlyerSpend[];
  totalFlyersSpent: number;
  notes?: string;
}

// Non-Circuit Deliveries: Guided tours, historical village walk-ins, festivals/events, custom categories
export type OtherDeliveryCategory =
  | 'guided_tour'
  | 'historical_village_office'
  | 'event'
  | 'school_educational'
  | 'protocol_vip'
  | 'other'
  | (string & {});

export interface OtherDeliveryRecord {
  id: string;
  ref: string;
  date: string;
  category: OtherDeliveryCategory;
  title: string; // e.g. "Historical Village Walking Tour - Senior Excursion", "Central Village Reception Desk"
  flyerTypeId: string;
  quantity: number;
  deliveredBy: string; // Guide / staff member who handed them out
  recipientOrGroup: string; // Group leader, visitor desk, or festival booth
  notes?: string;
}

export interface OfficeFlyerMetric {
  key: string; // unique identifier `${officeId}_${flyerTypeId}`
  officeId: string;
  officeName: string;
  officeCode: string;
  flyerTypeId: string;
  flyerName: string;
  flyerSku: string;
  totalDelivered: number;
  deliveryCount: number;
  lastDeliveryDate: string;
  lastDeliveredQty: number;
  
  // Historical usage duration & time lapse between delivery and new request:
  completedCycles: number;
  avgUsagePeriodDays: number; // Time lapse (days) between delivery and new request
  avgDailyDistributionRate: number; // flyers distributed per day (Qty / Time Lapse)
  
  // Current active delivery status:
  currentEstimatedStock: number;
  daysSinceLastDelivery: number;
  estimatedDaysRemaining: number;
  projectedRunoutDate: string;
  isDepleted: boolean;
  status: 'depleted' | 'critical' | 'moderate' | 'healthy';
  recommendedDeliveryQty: number; // recommended quantity to restock for standard buffer (e.g. 21 days)

  // Customization indicators
  isCustomized?: boolean;
  hasCustomTimeLapse?: boolean;
  hasCustomBurnRate?: boolean;
  hasCustomStock?: boolean;
}

export interface OfficeFlyerMetricOverride {
  customAvgUsagePeriodDays?: number;
  customBurnRate?: number;
  customEstimatedStock?: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'spreadsheet'
  | 'depletion'
  | 'fairs'
  | 'other_deliveries'
  | 'offices';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'logistics_coordinator' | 'manager';
  lastLogin?: string;
  avatar?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
  rememberMe: boolean;
}

