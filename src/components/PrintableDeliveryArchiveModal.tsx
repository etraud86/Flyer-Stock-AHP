import React, { useEffect, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  QrCode,
  Building2,
  Calendar,
  Truck,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import {
  generateOfficePermanentQRCode,
  getOfficePermanentQRUrl,
} from '../utils/qrCodeGenerator';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';

interface PrintableDeliveryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord;
  office: TourismOffice;
  flyer: FlyerType;
  offices?: TourismOffice[];
  flyers?: FlyerType[];
  onConfirmDelivery?: (deliveryId: string, confirmedBy: string) => void;
  onUpdateDelivery?: (deliveryId: string, patch: Partial<DeliveryRecord>) => void;
}

export const PrintableDeliveryArchiveModal: React.FC<PrintableDeliveryArchiveModalProps> = ({
  isOpen,
  onClose,
  delivery,
  office,
  flyer,
  onConfirmDelivery,
}) => {
  const [permanentQrDataUrl, setPermanentQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [isSimulatingScan, setIsSimulatingScan] = useState<boolean>(false);

  const isConfirmed = delivery.confirmationStatus === 'confirmed';
  const permanentValidationUrl = getOfficePermanentQRUrl(office.code, office.id);

  // Generate the permanent QR code for this specific tourism office
  useEffect(() => {
    if (!isOpen || !office) return;

    setIsGeneratingQr(true);
    generateOfficePermanentQRCode(office.code, office.id)
      .then((url) => {
        setPermanentQrDataUrl(url);
        setIsGeneratingQr(false);
      })
      .catch((err) => {
        console.error('Failed to generate office permanent QR code', err);
        setIsGeneratingQr(false);
      });
  }, [isOpen, office]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateMobileScan = () => {
    if (!onConfirmDelivery) return;
    setIsSimulatingScan(true);
    setTimeout(() => {
      onConfirmDelivery(
        delivery.id,
        office.contactPerson || `${office.name} Staff (Mobile QR Scan)`
      );
      setIsSimulatingScan(false);
    }, 600);
  };

  const signatureCode =
    delivery.confirmationSignatureCode ||
    `VERIFIED-AHP-${office.code}-${delivery.deliveryRef.replace(/[^A-Z0-9]/gi, '').slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-neutral-950 text-white shrink-0 gap-2 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-neutral-900 rounded-lg border border-neutral-700/80 shrink-0 flex items-center justify-center">
              <AHPCasteloIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Delivery Archive Voucher</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Permanent Office QR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Aldeias Históricas de Portugal &bull; {office.name} ({office.code}) &bull; Free of Charge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConfirmed && onConfirmDelivery && (
              <button
                type="button"
                onClick={handleSimulateMobileScan}
                disabled={isSimulatingScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Simulate smartphone camera reading this office's permanent QR code"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isSimulatingScan ? 'Validating on Mobile...' : 'Simulate Mobile Scan'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print Voucher (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE ARCHIVE BODY (SIMPLIFIED & CLEAN) */}
        <div
          id="printable-archive-slip"
          className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:overflow-visible text-xs font-sans"
        >
          {/* Official AHP Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="shrink-0 bg-white p-1">
                  <AHPLogo className="h-20 sm:h-24 w-auto object-contain print:h-20" />
                </div>

                <div className="sm:border-l-2 sm:border-slate-200 sm:pl-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-black tracking-wider text-xs uppercase">
                    <span>Aldeias Históricas de Portugal</span>
                    <span className="text-slate-300 font-light">&bull;</span>
                    <span className="text-slate-600 font-semibold text-[11px]">Tourism Destination Network</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight">
                    OFFICIAL DELIVERY &amp; RECEPTION VOUCHER
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Brochures &amp; Information Material Distribution Record &bull;{' '}
                    <strong className="text-emerald-800">100% Free / Zero Cost</strong>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 self-start sm:self-auto">
                <div className="inline-block bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Voucher Ref.</span>
                  <span className="font-mono text-sm font-black text-slate-900">{delivery.deliveryRef}</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">Date: {delivery.date}</span>
              </div>
            </div>
          </div>

          {/* 2-Column: Destination Office and Transport Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {/* Destination Tourism Office */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Recipient / Tourism Office
              </span>
              <div className="font-bold text-base text-slate-900">{office.name}</div>
              <div className="font-mono text-xs text-slate-500 mb-2">
                Code: <strong>{office.code}</strong> &bull; Zone: {office.zone}
              </div>

              <div className="space-y-1 text-slate-600 text-xs">
                <div>
                  <strong className="text-slate-700">Staff / Reception:</strong>{' '}
                  {delivery.confirmedBy || office.contactPerson || 'Tourism Office Reception'}
                </div>
                <div>
                  <strong className="text-slate-700">Email:</strong> {office.email}
                </div>
                <div>
                  <strong className="text-slate-700">Address:</strong> {office.address || '—'}
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Logistics &amp; Transport
              </span>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Delivery Date:</span>
                  <span className="font-bold text-slate-900">{delivery.date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Courier / Carrier:</span>
                  <span className="font-semibold text-slate-900">{delivery.courier}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Commercial Value:</span>
                  <span className="font-bold text-emerald-800">FREE (0.00€ &bull; No Invoicing)</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Observations:</span>
                  <span className="text-slate-800 italic">{delivery.notes || 'Routine stock replenishment'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivered Materials Manifest */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Delivered Promotional Materials
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                100% Free of Charge &bull; Zero Fees
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300">SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Flyer Title / Publication</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Language</th>
                  <th className="py-2.5 px-3 text-right">Quantity Delivered</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300 bg-white">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 border-r border-slate-300">
                    {flyer.sku}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-300">
                    {flyer.name}
                    <span className="block text-[10px] font-normal text-slate-500">{flyer.category}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 border-r border-slate-300">
                    {flyer.language}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-sm text-slate-900">
                    {delivery.quantityDelivered.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">units</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2 px-3 text-right text-slate-700 border-r border-slate-300 uppercase text-[10px]">
                    Total Units Received:
                  </td>
                  <td className="py-2 px-3 text-right text-base font-black text-emerald-800">
                    {delivery.quantityDelivered.toLocaleString()} units
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PERMANENT TOURISM OFFICE QR CODE SECTION */}
          <div className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50/50 mb-6 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 text-slate-900 opacity-[0.05] pointer-events-none print:opacity-[0.07]">
              <AHPCasteloIcon className="w-full h-full" />
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              {/* Permanent QR Code */}
              <div className="shrink-0 flex flex-col items-center bg-white p-3 rounded-lg border border-slate-300 shadow-xs">
                {isGeneratingQr ? (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR Code...
                  </div>
                ) : permanentQrDataUrl ? (
                  <img
                    src={permanentQrDataUrl}
                    alt={`Office QR Code ${office.name}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <span className="font-mono text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tight">
                  Permanent QR: {office.code}
                </span>
              </div>

              {/* QR Verification Explanation and Status */}
              <div className="flex-1 space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  {isConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      DIGITALLY VALIDATED &bull; CONFIRMED VIA SMARTPHONE QR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      AWAITING MOBILE PHONE QR SCAN &bull; {office.code}
                    </span>
                  )}
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>Permanent Tourism Office QR Code:</strong> This QR code belongs exclusively to{' '}
                  <strong className="text-slate-900">{office.name} ({office.code})</strong> and is always the same.
                  When read on any smartphone camera, it automatically validates the delivery receipt for this tourism office.
                </p>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipient Office:</span>
                    <span className="font-bold text-slate-900">{office.name} ({office.code})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validation Status:</span>
                    <span className="font-semibold text-emerald-800">
                      {isConfirmed ? 'Validated & Confirmed' : 'Ready to Scan'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confirmation Date / Seal:</span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">
                      {delivery.confirmedAt || (isConfirmed ? `${delivery.date} 10:24` : 'Pending Smartphone Scan')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Audit Signature Code:</span>
                    <span className="font-mono text-[11px] text-slate-800">
                      {signatureCode}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  * Digital QR validation replaces physical handwritten signatures with full administrative and audit validity across the Aldeias Históricas de Portugal network.
                </div>
              </div>
            </div>
          </div>

          {/* Simple Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic text-slate-800 font-bold">{delivery.courier}</span>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Courier / Carrier Signature
              </div>
            </div>

            <div>
              <div className="h-10 flex items-center justify-center">
                {isConfirmed ? (
                  <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> [CONFIRMED VIA OFFICE QR]
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Scan QR with smartphone to confirm</span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Posto de Turismo de {office.name}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer (Hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Simplified A4 archive voucher &bull; Permanent Office QR Code &bull; Free Material</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
