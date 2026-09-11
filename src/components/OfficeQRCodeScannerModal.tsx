import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  QrCode,
  Scan,
  ShieldCheck,
  Building2,
  Calendar,
  Printer,
  User,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import {
  generateOfficePermanentQRCode,
  getOfficePermanentQRUrl,
} from '../utils/qrCodeGenerator';
import { AHPCasteloIcon } from './AHPLogo';

interface OfficeQRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: TourismOffice;
  pendingDeliveries?: DeliveryRecord[];
  allDeliveries: DeliveryRecord[];
  flyers: FlyerType[];
  onConfirmDelivery: (deliveryId: string, confirmedBy: string) => void;
  onOpenPrintSlip: (delivery: DeliveryRecord) => void;
}

export const OfficeQRCodeScannerModal: React.FC<OfficeQRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  office,
  allDeliveries,
  flyers,
  onConfirmDelivery,
  onOpenPrintSlip,
}) => {
  // Find pending deliveries for this office
  const pendingDeliveries = allDeliveries.filter(
    (d) => d.confirmationStatus !== 'confirmed'
  );
  const defaultDeliveryId = pendingDeliveries[0]?.id || allDeliveries[0]?.id || '';

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(defaultDeliveryId);
  const [staffName, setStaffName] = useState<string>(
    office.contactPerson || `${office.name} Reception`
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [confirmedDelivery, setConfirmedDelivery] = useState<DeliveryRecord | null>(null);
  const [permanentQrUrl, setPermanentQrUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !office) return;

    setSelectedDeliveryId(pendingDeliveries[0]?.id || allDeliveries[0]?.id || '');
    setStaffName(office.contactPerson || `${office.name} Reception`);
    setScannedSuccess(false);
    setConfirmedDelivery(null);

    generateOfficePermanentQRCode(office.code, office.id).then((url) => {
      setPermanentQrUrl(url);
    });
  }, [isOpen, office, pendingDeliveries.length, allDeliveries.length]);

  if (!isOpen) return null;

  const activeDelivery = allDeliveries.find((d) => d.id === selectedDeliveryId);
  const activeFlyer = flyers.find((f) => f.id === activeDelivery?.flyerTypeId);
  const permanentWebUrl = getOfficePermanentQRUrl(office.code, office.id);

  const handleSimulateScanAndConfirm = () => {
    if (!activeDelivery) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedSuccess(true);
      const updatedDelivery: DeliveryRecord = {
        ...activeDelivery,
        confirmationStatus: 'confirmed',
        confirmedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        confirmedBy: staffName,
        confirmationSignatureCode: `VERIFIED-AHP-${office.code}-${activeDelivery.deliveryRef.replace(/[^A-Z0-9]/gi, '').slice(-4)}`,
      };
      setConfirmedDelivery(updatedDelivery);
      onConfirmDelivery(activeDelivery.id, staffName);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-neutral-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center">
              <AHPCasteloIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Tourism Office Permanent QR</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {office.code}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {office.name} &bull; Constant Office QR Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {scannedSuccess && confirmedDelivery ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">
                  Delivery Automatically Confirmed!
                </h4>
                <p className="text-slate-600 mt-1 max-w-sm mx-auto text-xs">
                  Permanent QR Code scanned successfully. Received{' '}
                  <strong className="text-slate-900">
                    {confirmedDelivery.quantityDelivered.toLocaleString()} flyers
                  </strong>{' '}
                  of <em>&quot;{activeFlyer?.name}&quot;</em> at{' '}
                  <strong className="text-slate-900">{office.name}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Document Ref:</span>
                  <span className="font-bold text-slate-900">{confirmedDelivery.deliveryRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Confirmed By:</span>
                  <span className="text-slate-800">{staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Timestamp:</span>
                  <span className="text-emerald-700 font-bold">{confirmedDelivery.confirmedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Verification Stamp:</span>
                  <span className="text-emerald-800 font-semibold">
                    VERIFIED-AHP-{office.code}-{confirmedDelivery.deliveryRef.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenPrintSlip(confirmedDelivery);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>View &amp; Print Archive Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Permanent QR Visual & Explanation */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                <div className="shrink-0 bg-white p-2 rounded-lg border border-slate-300 shadow-2xs">
                  {permanentQrUrl ? (
                    <img
                      src={permanentQrUrl}
                      alt={`Permanent QR ${office.name}`}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center text-slate-400">
                      <QrCode className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Office QR Code</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    This QR code is unique and permanent to <strong>{office.name}</strong>.
                    Point any smartphone camera at it to automatically validate delivery reception!
                  </p>
                </div>
              </div>

              {/* Delivery Select */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Delivery for {office.name} *
                </label>
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => setSelectedDeliveryId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {allDeliveries.length === 0 ? (
                    <option value="">No deliveries recorded for this office yet</option>
                  ) : (
                    allDeliveries.map((del) => {
                      const fl = flyers.find((f) => f.id === del.flyerTypeId);
                      const isAlready = del.confirmationStatus === 'confirmed';
                      return (
                        <option key={del.id} value={del.id}>
                          {isAlready ? '✅ Confirmed' : '⏳ Pending'} &bull; {del.deliveryRef} &bull;{' '}
                          {del.quantityDelivered.toLocaleString()}x {fl?.name} ({del.date})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Active Delivery Summary Card */}
              {activeDelivery && (
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase font-semibold">
                        Dispatch Ref: {activeDelivery.deliveryRef}
                      </span>
                      <div className="font-bold text-slate-900 text-sm">{activeFlyer?.name}</div>
                      <span className="text-[11px] text-slate-500">
                        SKU: {activeFlyer?.sku} &bull; Language: {activeFlyer?.language}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800">
                        {activeDelivery.quantityDelivered.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">units</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Delivery Date:</span> {activeDelivery.date}
                    </div>
                    <div>
                      <span className="text-slate-400">Courier:</span> {activeDelivery.courier}
                    </div>
                  </div>

                  {activeDelivery.confirmationStatus === 'confirmed' && (
                    <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded text-emerald-900 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Already confirmed on {activeDelivery.confirmedAt} by {activeDelivery.confirmedBy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Confirmer Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tourism Office Staff / Receiver Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Maria Ferreira"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  disabled={isScanning || !activeDelivery}
                  onClick={handleSimulateScanAndConfirm}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Scan className="w-4 h-4 animate-spin" />
                      <span>Validating Permanent Office QR Code...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span>Scan Permanent QR &amp; Auto-Confirm</span>
                    </>
                  )}
                </button>

                {activeDelivery && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPrintSlip(activeDelivery);
                      onClose();
                    }}
                    className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>View &amp; Print Simplified Voucher Archive</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
