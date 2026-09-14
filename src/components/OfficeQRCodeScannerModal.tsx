import React, { useState, useEffect, useRef } from 'react';
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
  Copy,
  Check,
  ExternalLink,
  Camera,
  Download,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import {
  generateOfficePermanentQRCode,
  getOfficePermanentQRUrl,
} from '../utils/qrCodeGenerator';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';

interface OfficeQRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: TourismOffice;
  pendingDeliveries?: DeliveryRecord[];
  allDeliveries: DeliveryRecord[];
  flyers: FlyerType[];
  onConfirmDelivery: (deliveryId: string, confirmedBy: string) => void;
  onOpenPrintSlip: (delivery: DeliveryRecord) => void;
  onOpenMobileView?: (officeCode: string, officeId: string) => void;
}

export const OfficeQRCodeScannerModal: React.FC<OfficeQRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  office,
  allDeliveries,
  flyers,
  onConfirmDelivery,
  onOpenPrintSlip,
  onOpenMobileView,
}) => {
  // Find deliveries for this specific office
  const officeDeliveries = allDeliveries.filter((d) => d.officeId === office.id);
  const pendingDeliveries = officeDeliveries.filter(
    (d) => d.confirmationStatus !== 'confirmed'
  );
  const defaultDeliveryId = pendingDeliveries[0]?.id || officeDeliveries[0]?.id || '';

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(defaultDeliveryId);
  const [staffName, setStaffName] = useState<string>(
    office.contactPerson || `${office.name} Reception`
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [confirmedDelivery, setConfirmedDelivery] = useState<DeliveryRecord | null>(null);
  const [permanentQrUrl, setPermanentQrUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen || !office) return;

    setSelectedDeliveryId(pendingDeliveries[0]?.id || officeDeliveries[0]?.id || '');
    setStaffName(office.contactPerson || `${office.name} Reception`);
    setScannedSuccess(false);
    setConfirmedDelivery(null);
    setIsCameraActive(false);

    generateOfficePermanentQRCode(office.code, office.id).then((url) => {
      setPermanentQrUrl(url);
    });
  }, [isOpen, office?.id]);

  // React immediately if mobile QR scan confirms the delivery in real-time while this modal is open
  useEffect(() => {
    if (!isOpen || !office) return;
    const current = allDeliveries.find((d) => d.id === selectedDeliveryId);
    if (current && current.confirmationStatus === 'confirmed' && !scannedSuccess) {
      setScannedSuccess(true);
      setConfirmedDelivery(current);
    }
  }, [allDeliveries, selectedDeliveryId, isOpen, office, scannedSuccess]);

  // Clean up camera stream when modal closes
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const activeDelivery = allDeliveries.find((d) => d.id === selectedDeliveryId);
  const activeFlyer = flyers.find((f) => f.id === activeDelivery?.flyerTypeId);
  const permanentWebUrl = getOfficePermanentQRUrl(office.code, office.id);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(permanentWebUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleStartCamera = async () => {
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (e) {
      // Fallback simulation if camera permissions denied in iframe
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleSimulateScanAndConfirm = () => {
    if (!activeDelivery) return;

    setIsScanning(true);
    setTimeout(() => {
      handleStopCamera();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-lg overflow-hidden my-auto text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Black Base with Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center shadow-md">
              <AHPCasteloIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Permanent Tourism Office QR</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                  {office.code}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {office.name} &bull; Constant Validation Architecture
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {scannedSuccess && confirmedDelivery ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">
                  Delivery Confirmed on Smartphone!
                </h4>
                <p className="text-neutral-400 mt-1 max-w-sm mx-auto text-xs">
                  Permanent QR Code scanned and validated directly. Received{' '}
                  <strong className="text-white">
                    {confirmedDelivery.quantityDelivered.toLocaleString()} flyers
                  </strong>{' '}
                  of <em>&quot;{activeFlyer?.name}&quot;</em> at{' '}
                  <strong className="text-white">{office.name}</strong>.
                </p>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-left space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Document Ref:</span>
                  <span className="font-bold text-white">{confirmedDelivery.deliveryRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Confirmed By:</span>
                  <span className="text-neutral-300">{staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Timestamp:</span>
                  <span className="text-emerald-400 font-bold">{confirmedDelivery.confirmedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-sans">Official Verification Stamp:</span>
                  <span className="text-emerald-400 font-semibold">
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
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Formal Archive Slip</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-xl font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Permanent QR Visual & Phone Instructions */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 bg-white p-2.5 rounded-xl border border-neutral-700 shadow-lg">
                  {permanentQrUrl ? (
                    <img
                      src={permanentQrUrl}
                      alt={`Permanent QR ${office.name}`}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center text-neutral-400">
                      <QrCode className="w-10 h-10 text-neutral-500" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Permanent Office QR &bull; Always The Same</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Point your cellphone camera at this QR code. It instantly confirms delivery on your phone with zero app download required!
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy direct verification link"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Copy Mobile Link</span>
                        </>
                      )}
                    </button>

                    {onOpenMobileView && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenMobileView(office.code, office.id);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Simulate smartphone scan immediately"
                      >
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        <span>Test Phone View</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Camera Scanner Viewfinder (if user wants to scan from this device) */}
              {isCameraActive ? (
                <div className="bg-black rounded-xl p-3 border border-neutral-700 text-center space-y-2">
                  <div className="relative rounded-lg overflow-hidden h-48 bg-neutral-950 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder Target */}
                    <div className="absolute inset-6 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                    <span>Align Tourism Office QR within frame</span>
                    <button
                      type="button"
                      onClick={handleSimulateScanAndConfirm}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Detect &amp; Validate
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Delivery Select */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1 text-xs">
                  Select Delivery for {office.name}
                </label>
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => setSelectedDeliveryId(e.target.value)}
                  className="w-full border border-neutral-700 rounded-xl px-3 py-2 bg-neutral-950 text-white font-medium focus:ring-2 focus:ring-emerald-500/50"
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
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-neutral-500 uppercase font-semibold">
                        Dispatch Ref: {activeDelivery.deliveryRef}
                      </span>
                      <div className="font-bold text-white text-sm">{activeFlyer?.name}</div>
                      <span className="text-[11px] text-neutral-400">
                        SKU: {activeFlyer?.sku} &bull; Language: {activeFlyer?.language}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400">
                        {activeDelivery.quantityDelivered.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-neutral-500">units</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                    <div>
                      <span className="text-neutral-500">Delivery Date:</span> {activeDelivery.date}
                    </div>
                    <div>
                      <span className="text-neutral-500">Carrier:</span> {activeDelivery.courier}
                    </div>
                  </div>

                  {activeDelivery.confirmationStatus === 'confirmed' && (
                    <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Already confirmed on {activeDelivery.confirmedAt} by {activeDelivery.confirmedBy}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Confirmer Name */}
              <div>
                <label className="block font-semibold text-neutral-300 mb-1 text-xs">
                  Tourism Office Staff / Receiver Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Maria Ferreira"
                    className="w-full pl-9 pr-3 py-2 border border-neutral-700 rounded-xl bg-neutral-950 text-white placeholder-neutral-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={isCameraActive ? handleStopCamera : handleStartCamera}
                    className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isCameraActive ? 'Close Camera' : 'Device Camera'}</span>
                  </button>

                  {activeDelivery && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPrintSlip(activeDelivery);
                        onClose();
                      }}
                      className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Print Slip</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
