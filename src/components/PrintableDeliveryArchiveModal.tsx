import React from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Building2,
  Calendar,
  Truck,
  ShieldCheck,
  AlertCircle,
  PenTool,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import { AHPLogo, AHPCasteloIcon } from './AHPLogo';
import { InstitutionalCoFinancingLogos } from './InstitutionalCoFinancingLogos';

interface PrintableDeliveryArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord;
  office: TourismOffice;
  flyer: FlyerType;
  offices?: TourismOffice[];
  flyers?: FlyerType[];
  onConfirmDelivery?: (deliveryId: string, confirmedBy: string) => void;
  onOpenSignatureModal?: (del: DeliveryRecord, off: TourismOffice, fl: FlyerType) => void;
  onUpdateDelivery?: (deliveryId: string, patch: Partial<DeliveryRecord>) => void;
}

export const PrintableDeliveryArchiveModal: React.FC<PrintableDeliveryArchiveModalProps> = ({
  isOpen,
  onClose,
  delivery,
  office,
  flyer,
  onOpenSignatureModal,
}) => {
  const isConfirmed = delivery.confirmationStatus === 'confirmed';

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-delivery-slip-active');
    const cleanup = () => {
      document.body.classList.remove('printing-delivery-slip-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 60);
  };

  const signatureCode =
    delivery.confirmationSignatureCode ||
    `SIG-AHP-${office.code}-${delivery.deliveryRef.replace(/[^A-Z0-9]/gi, '').slice(-4)}`;

  return (
    <div
      id="printable-delivery-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:m-0 print:bg-white print:static print:overflow-visible"
    >
      <div
        id="printable-delivery-modal-card"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 print:p-0"
      >
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
                  Digital Signature Certified
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Aldeias Históricas de Portugal &bull; {office.name} ({office.code}) &bull; Free of Charge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConfirmed && onOpenSignatureModal && (
              <button
                type="button"
                onClick={() => onOpenSignatureModal(delivery, office, flyer)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Sign this delivery voucher on tablet or PC"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Sign on Tablet / PC</span>
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

        {/* Printable Voucher Body (A4 Style) */}
        <div id="printable-delivery-slip" className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible">
          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-5 mb-6 print:pb-2.5 print:mb-2.5 gap-4">
            <div className="flex items-start gap-4">
              <AHPLogo className="h-12 w-auto object-contain shrink-0 print:h-10" />
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  Aldeias Históricas de Portugal
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Associação de Desenvolvimento Turístico &bull; Logística Central
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Guia de Remessa e Auto de Receção de Materiais Promocionais
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <div className="inline-block bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
                Ref: {delivery.deliveryRef}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Data de Emissão: <strong>{delivery.date}</strong>
              </div>
              <div className="text-[11px] font-bold text-emerald-800 uppercase mt-0.5">
                {isConfirmed ? '● Validado & Assinado' : '○ Aguarda Assinatura'}
              </div>
            </div>
          </div>

          {/* Institutional Co-Financing Bar */}
          <div className="mb-6 print:mb-2.5 py-2 print:py-1 px-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Financiamento &bull; Estratégia PROVERE &bull; Centro 2030
            </span>
            <InstitutionalCoFinancingLogos showLabels={false} />
          </div>

          {/* Office and Dispatch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2.5 mb-6 print:mb-2.5">
            {/* Recipient Tourism Office */}
            <div className="p-4 print:p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Posto de Turismo Destinatário
              </span>
              <h3 className="font-bold text-sm text-slate-900 mb-1">{office.name}</h3>
              <div className="text-xs text-slate-600 mb-2">
                Código: <strong>{office.code}</strong> &bull; Zona: {office.zone}
              </div>

              <div className="space-y-1 text-slate-600 text-xs">
                <div>
                  <strong className="text-slate-700">Responsável / Receção:</strong>{' '}
                  {delivery.confirmedBy || office.contactPerson || 'Posto de Turismo'}
                </div>
                <div>
                  <strong className="text-slate-700">Email:</strong> {office.email}
                </div>
                <div>
                  <strong className="text-slate-700">Morada:</strong> {office.address || '—'}
                </div>
              </div>
            </div>

            {/* Logistics & Dispatch Info */}
            <div className="p-4 print:p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Logística &amp; Transporte
              </span>
              <div className="space-y-1.5 text-slate-700 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Data de Entrega:</span>
                  <span className="font-bold text-slate-900">{delivery.date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Transportador / Motorista:</span>
                  <span className="font-semibold text-slate-900">{delivery.courier}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Valor Comercial:</span>
                  <span className="font-bold text-emerald-800">GRATUITO (0,00€ &bull; Sem Cobrança)</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Observações:</span>
                  <span className="text-slate-800 italic">{delivery.notes || 'Reposição de stock regular'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivered Materials Manifest */}
          <div className="mb-6 print:mb-2.5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Materiais Promocionais Entregues
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                100% Gratuito &bull; Sem Faturação
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-300">SKU</th>
                  <th className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-300">Título / Publicação</th>
                  <th className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-300">Idioma</th>
                  <th className="py-2 px-3 print:py-1 print:px-2 text-right">Quantidade Entregue</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300 bg-white">
                  <td className="py-2.5 px-3 print:py-1.5 print:px-2 font-mono font-bold text-slate-900 border-r border-slate-300">
                    {flyer.sku}
                  </td>
                  <td className="py-2.5 px-3 print:py-1.5 print:px-2 font-semibold text-slate-900 border-r border-slate-300">
                    {flyer.name}
                    <span className="block text-[10px] font-normal text-slate-500">{flyer.category}</span>
                  </td>
                  <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-slate-700 border-r border-slate-300">
                    {flyer.language}
                  </td>
                  <td className="py-2.5 px-3 print:py-1.5 print:px-2 text-right font-black text-sm text-slate-900">
                    {delivery.quantityDelivered.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">unidades</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="py-1.5 px-3 print:py-1 print:px-2 text-right text-slate-700 border-r border-slate-300 uppercase text-[10px]">
                    Total de Unidades Recebidas:
                  </td>
                  <td className="py-1.5 px-3 print:py-1 print:px-2 text-right text-base font-black text-emerald-800">
                    {delivery.quantityDelivered.toLocaleString()} unidades
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* OFFICIAL RECEIPT & DIGITAL SIGNATURE CERTIFICATE */}
          <div className="border-2 border-slate-900 rounded-xl p-5 print:p-3 bg-slate-50/70 mb-6 print:mb-2.5 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-44 h-44 text-slate-900 opacity-[0.05] pointer-events-none print:opacity-[0.07]">
              <AHPCasteloIcon className="w-full h-full" />
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 print:gap-4 relative z-10">
              <div className="space-y-2 print:space-y-1 text-left flex-1">
                <div className="flex items-center gap-2">
                  {isConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      AUTO DE RECEÇÃO VALIDADO &bull; ASSINATURA REGISTADA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      AGUARDA ASSINATURA DIGITAL NO TABLET OU PC
                    </span>
                  )}
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  Declaro que foram conferidos e recebidos nas devidas condições os materiais promocionais especificados nesta
                  guia, destinados à promoção turística do território de{' '}
                  <strong className="text-slate-900">{office.name}</strong>.
                </p>

                <div className="bg-white p-2.5 print:p-2 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Posto de Turismo Recetor:</span>
                    <span className="font-bold text-slate-900">{office.name} ({office.code})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Responsável Signatário:</span>
                    <span className="font-semibold text-slate-900">
                      {delivery.confirmedBy || office.contactPerson || 'A aguardar assinatura'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data e Hora de Registo:</span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">
                      {delivery.confirmedAt || (isConfirmed ? `${delivery.date} 10:24` : 'Pendente de validação')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Código de Certificação Digital:</span>
                    <span className="font-mono text-[11px] text-slate-800 font-semibold">
                      {signatureCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Visual Block */}
              <div className="w-64 shrink-0 bg-white p-3 print:p-2 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-center text-center min-h-[130px] print:min-h-[110px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Rubrica do Destinatário
                </span>

                {delivery.signatureDataUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={delivery.signatureDataUrl}
                      alt="Assinatura Digital Capturada"
                      className="max-h-20 w-auto object-contain my-1"
                    />
                    <div className="w-full border-t border-slate-300 pt-1 mt-1">
                      <span className="text-[11px] font-bold text-slate-800 block">
                        {delivery.confirmedBy}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {delivery.signerRole || 'Receção / Posto de Turismo'}
                      </span>
                    </div>
                  </div>
                ) : isConfirmed ? (
                  <div className="py-4">
                    <span className="font-serif italic text-base font-bold text-blue-900 block">
                      {delivery.confirmedBy || office.contactPerson}
                    </span>
                    <div className="w-full border-t border-slate-300 pt-1 mt-2">
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">
                        [Assinatura Eletrónica Válida]
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 flex flex-col items-center justify-center space-y-2">
                    <div className="w-40 border-b border-dashed border-slate-400 pb-4 text-[10px] text-slate-400 italic">
                      (espaço para rubrica / assinatura)
                    </div>
                    {onOpenSignatureModal && (
                      <button
                        type="button"
                        onClick={() => onOpenSignatureModal(delivery, office, flyer)}
                        className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Assinar no Tablet/PC</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simple Signatures Dual Footer */}
          <div className="grid grid-cols-2 gap-8 print:gap-4 pt-4 print:pt-2 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic text-slate-800 font-bold">{delivery.courier}</span>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Pelo Transportador / Distribuidor AHP
              </div>
            </div>

            <div>
              <div className="h-10 flex items-center justify-center">
                {delivery.signatureDataUrl ? (
                  <span className="text-emerald-700 font-mono font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {delivery.confirmedBy} (Assinado)
                  </span>
                ) : isConfirmed ? (
                  <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> [ASSINADO DIGITALMENTE]
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Aguardando rubrica no tablet/PC</span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Pelo Posto de Turismo de {office.name}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer (Hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auto de Receção em A4 &bull; Assinatura Digital Tablet/PC &bull; Material Gratuito</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Guia</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
