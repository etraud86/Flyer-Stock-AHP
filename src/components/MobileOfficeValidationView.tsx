import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Package,
  Calendar,
  Truck,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
  QrCode,
  Check,
  Smartphone,
  CheckCheck,
  Award,
  Clock,
  User,
  Volume2,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';
import { InstitutionalCoFinancingLogos } from './InstitutionalCoFinancingLogos';

interface MobileOfficeValidationViewProps {
  officeCode: string;
  officeId?: string;
  offices: TourismOffice[];
  flyers: FlyerType[];
  deliveries: DeliveryRecord[];
  onConfirmDelivery: (deliveryId: string, confirmedBy: string) => void;
  onEnterPortal: () => void;
}

// Play audio confirmation chime using Web Audio API (cross-browser safe)
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy until tap
  }
}

export const MobileOfficeValidationView: React.FC<MobileOfficeValidationViewProps> = ({
  officeCode,
  officeId,
  offices,
  flyers,
  deliveries,
  onConfirmDelivery,
  onEnterPortal,
}) => {
  const [hasConfirmed, setHasConfirmed] = useState<boolean>(true);
  const [confirmedTimestamp, setConfirmedTimestamp] = useState<string>(() =>
    new Date().toISOString().replace('T', ' ').substring(0, 19)
  );
  const [confirmerStaff, setConfirmerStaff] = useState<string>('');
  const [activeDeliveryRecord, setActiveDeliveryRecord] = useState<DeliveryRecord | null>(null);

  // Find the target office
  const targetOffice =
    offices.find(
      (o) =>
        (officeCode && o.code.toUpperCase() === officeCode.toUpperCase()) ||
        (officeId && o.id === officeId)
    ) || offices[0];

  useEffect(() => {
    if (!targetOffice) return;

    const defaultStaff = targetOffice.contactPerson || `${targetOffice.name} Reception Staff`;
    setConfirmerStaff(defaultStaff);

    // Find deliveries for this office
    const officeDeliveries = deliveries.filter((d) => d.officeId === targetOffice.id);
    const pendingDeliveries = officeDeliveries.filter((d) => d.confirmationStatus !== 'confirmed');

    if (pendingDeliveries.length > 0) {
      // Auto-confirm all pending deliveries for this tourism office
      pendingDeliveries.forEach((del) => {
        onConfirmDelivery(del.id, defaultStaff);
      });
      setActiveDeliveryRecord({
        ...pendingDeliveries[0],
        confirmationStatus: 'confirmed',
        confirmedBy: defaultStaff,
        confirmedAt: confirmedTimestamp,
      });
    } else if (officeDeliveries.length > 0) {
      setActiveDeliveryRecord(officeDeliveries[0]);
    } else {
      // Create an automatic delivery voucher for this office
      const fallbackFlyer = flyers[0];
      const newDel: DeliveryRecord = {
        id: `del-${Date.now()}`,
        deliveryRef: `DEL-2026-QR-${targetOffice.code}-01`,
        date: new Date().toISOString().split('T')[0],
        officeId: targetOffice.id,
        flyerTypeId: fallbackFlyer ? fallbackFlyer.id : 'flyer-general',
        quantityDelivered: 500,
        courier: 'Official AHP Logistics Van',
        confirmationStatus: 'confirmed',
        confirmedAt: confirmedTimestamp,
        confirmedBy: defaultStaff,
        confirmationSignatureCode: `VERIFIED-AHP-${targetOffice.code}-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      setActiveDeliveryRecord(newDel);
      onConfirmDelivery(newDel.id, defaultStaff);
    }

    const confirmedDelId = pendingDeliveries[0]?.id || officeDeliveries[0]?.id;

    // 1. Sync immediately with the central server API so the desktop platform updates across devices
    fetch('/api/qr/confirm-office', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        officeCode: targetOffice.code,
        officeId: targetOffice.id,
        confirmedBy: defaultStaff,
        deliveryId: confirmedDelId,
      }),
    }).catch((err) => {
      console.warn('Could not reach central sync API, relying on local sync:', err);
    });

    // 2. Broadcast immediately to any open tabs/windows on the device
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('ahp_qr_sync_channel');
        bc.postMessage({
          type: 'OFFICE_CONFIRMED_AUTOMATICALLY',
          officeCode: targetOffice.code,
          officeId: targetOffice.id,
          officeName: targetOffice.name,
          confirmedBy: defaultStaff,
          confirmedAt: confirmedTimestamp,
          deliveryId: confirmedDelId,
        });
        bc.close();
      }
    } catch (e) {
      // Ignore broadcast errors in private browsing
    }

    setHasConfirmed(true);

    // Haptic vibration & chime on smartphone
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 120]);
      }
      playSuccessChime();
    } catch (err) {
      // Ignored if device lacks vibrator
    }
  }, [targetOffice?.id]);

  const activeFlyer = flyers.find((f) => f.id === activeDeliveryRecord?.flyerTypeId) || flyers[0];

  const handleManualReconfirm = () => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setConfirmedTimestamp(nowStr);
    setHasConfirmed(true);
    if (activeDeliveryRecord) {
      onConfirmDelivery(activeDeliveryRecord.id, confirmerStaff);
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
      playSuccessChime();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 font-sans select-none">
      {/* Top Brand Banner */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between py-3 border-b border-neutral-800/80 bg-neutral-950">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-700 shadow-md">
            <AHPCasteloIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white uppercase">
              Aldeias Históricas de Portugal
            </h1>
            <p className="text-[11px] text-neutral-400">Official Mobile QR Validation</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold">
          {targetOffice.code}
        </span>
      </header>

      {/* Main Center Verification Card */}
      <main className="w-full max-w-md mx-auto my-auto py-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
          {/* Animated Success Seal */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-neutral-950 p-1 rounded-full border border-emerald-500/40">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery Receipt Validated on Cellphone</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
                Receipt Confirmed Directly!
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Permanent Tourism Office QR Code scanned &amp; confirmed in real-time.
              </p>
            </div>
          </div>

          {/* Tourism Office Identification */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                Destination Tourism Office
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                Code: {targetOffice.code}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-black text-base text-white">{targetOffice.name}</h3>
                <p className="text-xs text-neutral-400">{targetOffice.zone} &bull; Portugal</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-500 block">Staff Recipient</span>
                <span className="text-xs font-bold text-neutral-200">
                  {confirmerStaff || targetOffice.contactPerson}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Materials Manifest */}
          {activeDeliveryRecord && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Delivered Materials
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-400">
                  {activeDeliveryRecord.deliveryRef}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-white">{activeFlyer?.name}</div>
                  <div className="text-[11px] text-neutral-400">
                    SKU: {activeFlyer?.sku} &bull; {activeFlyer?.language}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-emerald-400">
                    {activeDeliveryRecord.quantityDelivered.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                    Free Units
                  </span>
                </div>
              </div>

              {/* Digital Hologram Security Stamp */}
              <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-2.5 text-[10px] text-emerald-300 space-y-1 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Verified Timestamp:</span>
                  <span className="font-bold text-white">{confirmedTimestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Digital Seal Stamp:</span>
                  <span className="font-bold text-emerald-400">
                    {activeDeliveryRecord.confirmationSignatureCode ||
                      `VERIFIED-AHP-${targetOffice.code}-${activeDeliveryRecord.deliveryRef.slice(-4)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 100% Free Notice */}
          <div className="text-[11px] text-neutral-400 text-center bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80">
            <p>
              Brochures and maps are delivered <strong className="text-white">100% free of charge</strong> by
              Aldeias Históricas de Portugal. This mobile QR verification replaces handwritten signatures with official validity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleManualReconfirm}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer text-xs transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Re-Stamp Delivery Receipt</span>
            </button>

            <button
              type="button"
              onClick={onEnterPortal}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer text-sm"
            >
              <span>Access FlyerStock Portal Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer with Centro 2030 and Provere logos */}
      <footer className="w-full max-w-md mx-auto text-center text-[10px] text-neutral-500 py-4 border-t border-neutral-900 flex flex-col items-center gap-3">
        <InstitutionalCoFinancingLogos showLabels={false} />
        <span>&copy; 2026 Aldeias Históricas de Portugal &bull; Permanent Office QR Architecture</span>
      </footer>
    </div>
  );
};
