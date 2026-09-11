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
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';

interface MobileOfficeValidationViewProps {
  officeCode: string;
  officeId?: string;
  offices: TourismOffice[];
  flyers: FlyerType[];
  deliveries: DeliveryRecord[];
  onConfirmDelivery: (deliveryId: string, confirmedBy: string) => void;
  onEnterPortal: () => void;
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
  const [hasAutoValidated, setHasAutoValidated] = useState<boolean>(false);
  const [validatedDeliveryIds, setValidatedDeliveryIds] = useState<string[]>([]);
  const [receiverName, setReceiverName] = useState<string>('');

  // Find the target office
  const targetOffice =
    offices.find(
      (o) =>
        (officeCode && o.code.toUpperCase() === officeCode.toUpperCase()) ||
        (officeId && o.id === officeId)
    ) || offices[0];

  // Find deliveries for this office
  const officeDeliveries = deliveries.filter((d) => d.officeId === targetOffice?.id);
  const pendingDeliveries = officeDeliveries.filter((d) => d.confirmationStatus !== 'confirmed');

  useEffect(() => {
    if (!targetOffice) return;

    const defaultStaff = targetOffice.contactPerson || `${targetOffice.name} Reception`;
    setReceiverName(defaultStaff);

    // If there are pending deliveries for this office, auto-validate them when scanned
    if (pendingDeliveries.length > 0 && !hasAutoValidated) {
      const ids: string[] = [];
      pendingDeliveries.forEach((del) => {
        onConfirmDelivery(del.id, defaultStaff);
        ids.push(del.id);
      });
      setValidatedDeliveryIds(ids);
      setHasAutoValidated(true);
    }
  }, [targetOffice, pendingDeliveries.length, hasAutoValidated, onConfirmDelivery]);

  const allOfficeDeliveriesNow = deliveries.filter((d) => d.officeId === targetOffice?.id);
  const latestDelivery = allOfficeDeliveriesNow[0];
  const latestFlyer = flyers.find((f) => f.id === latestDelivery?.flyerTypeId);

  const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Banner */}
      <header className="w-full max-w-lg flex items-center justify-between py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-700">
            <AHPCasteloIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              Aldeias Históricas de Portugal
            </h1>
            <p className="text-[11px] text-neutral-400">Official Mobile QR Validation</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Permanent QR
        </span>
      </header>

      {/* Main Validation Card */}
      <main className="w-full max-w-lg my-auto py-6">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Animated Success Seal */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>Delivery Automatically Validated</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                Receipt Confirmed via QR
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Office QR Code scanned &amp; verified on mobile phone.
              </p>
            </div>
          </div>

          {/* Tourism Office Identification */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
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
                <span className="text-[10px] text-neutral-500 block">Staff / Reception</span>
                <span className="text-xs font-bold text-neutral-300">
                  {receiverName || targetOffice.contactPerson}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Details Manifest */}
          {latestDelivery && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  Delivered Materials
                </span>
                <span className="font-mono text-[11px] font-bold text-neutral-300">
                  {latestDelivery.deliveryRef}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-white">{latestFlyer?.name}</div>
                  <div className="text-[11px] text-neutral-400">
                    SKU: {latestFlyer?.sku} &bull; Language: {latestFlyer?.language}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-emerald-400">
                    {latestDelivery.quantityDelivered.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-neutral-500">free units</span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                <div>
                  <span className="text-neutral-500">Carrier:</span> {latestDelivery.courier}
                </div>
                <div>
                  <span className="text-neutral-500">Delivery Date:</span> {latestDelivery.date}
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-2 text-[10px] text-emerald-300 space-y-0.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Verified Timestamp:</span>
                  <span>{latestDelivery.confirmedAt || nowFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Digital Seal:</span>
                  <span className="font-bold text-emerald-400">
                    {latestDelivery.confirmationSignatureCode ||
                      `VERIFIED-AHP-${targetOffice.code}-${latestDelivery.deliveryRef.slice(-4)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Legal / Institutional Free Notice */}
          <div className="text-[11px] text-neutral-400 text-center bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
            <p>
              All brochures and maps are provided <strong className="text-white">100% free of charge</strong> by
              Aldeias Históricas de Portugal. This mobile QR verification replaces handwritten signatures
              with full administrative validity.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onEnterPortal}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer text-sm"
            >
              <span>Access FlyerStock Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-lg text-center text-[10px] text-neutral-500 py-3 border-t border-neutral-900">
        &copy; 2026 Aldeias Históricas de Portugal &bull; Permanent Office QR Code Architecture
      </footer>
    </div>
  );
};
