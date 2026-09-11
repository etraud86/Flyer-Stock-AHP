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
  FileCheck,
  Download,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  Package,
  Info,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import { generateDeliveryQRToken, generateQRCodeDataUrl, createQRVerificationPayload } from '../utils/qrCodeGenerator';
import { AHPLogo } from './AHPLogo';

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
  offices = [],
  flyers = [],
  onConfirmDelivery,
  onUpdateDelivery,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<boolean>(false);

  // Form edit states
  const [editRef, setEditRef] = useState<string>(delivery.deliveryRef);
  const [editDate, setEditDate] = useState<string>(delivery.date);
  const [editOfficeId, setEditOfficeId] = useState<string>(office.id);
  const [editFlyerId, setEditFlyerId] = useState<string>(flyer.id);
  const [editQuantity, setEditQuantity] = useState<number>(delivery.quantityDelivered);
  const [editCourier, setEditCourier] = useState<string>(delivery.courier);
  const [editNotes, setEditNotes] = useState<string>(delivery.notes || '');
  const [editConfirmedBy, setEditConfirmedBy] = useState<string>(
    delivery.confirmedBy || office.contactPerson || 'Posto de Turismo'
  );

  // Synchronize when active delivery or props change
  useEffect(() => {
    if (isOpen) {
      setEditRef(delivery.deliveryRef);
      setEditDate(delivery.date);
      setEditOfficeId(office.id);
      setEditFlyerId(flyer.id);
      setEditQuantity(delivery.quantityDelivered);
      setEditCourier(delivery.courier);
      setEditNotes(delivery.notes || '');
      setEditConfirmedBy(delivery.confirmedBy || office.contactPerson || 'Posto de Turismo');
      setIsEditing(false);
      setSavedSuccessNotice(false);
    }
  }, [isOpen, delivery, office, flyer]);

  const activeDisplayOffice = offices.find((o) => o.id === editOfficeId) || office;
  const activeDisplayFlyer = flyers.find((f) => f.id === editFlyerId) || flyer;

  const isConfirmed = delivery.confirmationStatus === 'confirmed';
  const confirmationToken = delivery.qrToken || generateDeliveryQRToken(editRef, activeDisplayOffice.code);
  const signatureCode =
    delivery.confirmationSignatureCode ||
    `VERIFIED-AHP-${activeDisplayOffice.code}-${editRef.replace(/[^A-Z0-9]/gi, '').slice(-6)}`;

  useEffect(() => {
    if (!isOpen) return;

    const payload = createQRVerificationPayload({
      deliveryRef: editRef,
      date: editDate,
      officeId: activeDisplayOffice.id,
      officeCode: activeDisplayOffice.code,
      officeName: activeDisplayOffice.name,
      flyerSku: activeDisplayFlyer.sku,
      flyerName: activeDisplayFlyer.name,
      quantity: editQuantity,
      courier: editCourier,
      token: confirmationToken,
      verifyUrl: `https://ahp-turismo.pt/confirm-delivery?ref=${encodeURIComponent(
        editRef
      )}&token=${encodeURIComponent(confirmationToken)}`,
    });

    setIsGeneratingQr(true);
    generateQRCodeDataUrl(payload)
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to generate QR code data URL', err))
      .finally(() => setIsGeneratingQr(false));
  }, [isOpen, editRef, editDate, activeDisplayOffice, activeDisplayFlyer, editQuantity, editCourier, confirmationToken]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleQuickConfirm = () => {
    if (onConfirmDelivery) {
      const staffName = editConfirmedBy || activeDisplayOffice.contactPerson || `${activeDisplayOffice.name} Reception Staff`;
      onConfirmDelivery(delivery.id, staffName);
    }
  };

  const handleSaveDocumentEdits = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedQty = Math.max(1, Math.min(1000000, Number(editQuantity) || 1));

    if (onUpdateDelivery) {
      onUpdateDelivery(delivery.id, {
        deliveryRef: editRef.trim() || delivery.deliveryRef,
        date: editDate,
        officeId: editOfficeId,
        flyerTypeId: editFlyerId,
        quantityDelivered: clampedQty,
        courier: editCourier.trim(),
        notes: editNotes.trim(),
        confirmedBy: editConfirmedBy.trim(),
      });
    }

    setEditQuantity(clampedQty);
    setIsEditing(false);
    setSavedSuccessNotice(true);
    setTimeout(() => setSavedSuccessNotice(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0 gap-2 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg border border-white/10 shrink-0 flex items-center justify-center">
              <AHPLogo variant="crest" inverted={true} className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Delivery Archive Voucher &amp; QR Confirmation</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Flyer Stock AHP
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Official document proof &bull; Aldeias Históricas de Portugal (1 destino que são 12) &bull; Gratuito
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Edit Document Button */}
            {onUpdateDelivery && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs ${
                  isEditing
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Visualizar Documento' : 'Editar Documento'}</span>
              </button>
            )}

            {!isConfirmed && onConfirmDelivery && (
              <button
                type="button"
                onClick={handleQuickConfirm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmar via QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Imprimir para Arquivo</span>
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

        {/* Saved Success Notice Banner */}
        {savedSuccessNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-semibold flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documento de entrega atualizado com sucesso! O comprovativo e o código QR foram recalculados.</span>
          </div>
        )}

        {/* EDITING MODE FORM (When user clicks "Editar Documento") */}
        {isEditing && (
          <form
            onSubmit={handleSaveDocumentEdits}
            className="p-6 bg-slate-50 border-b border-slate-300 space-y-4 text-xs print:hidden animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>Editar Campos do Comprovativo de Entrega &bull; Ref: {editRef}</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                Todos os folhetos são 100% gratuitos (Sem preço)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Document Reference */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Ref. Documento *</label>
                <input
                  type="text"
                  required
                  value={editRef}
                  onChange={(e) => setEditRef(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Data de Entrega *</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Destination Office */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Posto de Turismo Destinatário *</label>
                <select
                  value={editOfficeId}
                  onChange={(e) => setEditOfficeId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} — {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flyer Publication Material */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-800 mb-1">Material Promocional Entregue *</label>
                <select
                  value={editFlyerId}
                  onChange={(e) => setEditFlyerId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {flyers.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      {fl.sku} — {fl.name} ({fl.language})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Delivered (1 to 1,000,000) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">Qtd. Entregue (1 a 1.000.000) *</label>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000000}
                  step={1}
                  value={editQuantity}
                  onChange={(e) =>
                    setEditQuantity(Math.max(1, Math.min(1000000, parseInt(e.target.value) || 1)))
                  }
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-black text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Courier / Driver */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Transportador / Entregador *</label>
                <input
                  type="text"
                  required
                  value={editCourier}
                  onChange={(e) => setEditCourier(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Responsible Staff at Tourism Office */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Responsável / Receção Posto</label>
                <input
                  type="text"
                  value={editConfirmedBy}
                  onChange={(e) => setEditConfirmedBy(e.target.value)}
                  placeholder="Nome do funcionário de receção"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes / Observations */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Observações do Comprovativo</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Reforço de Stock de Época Alta, 10 caixas"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Quantity Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Quantidades Rápidas:</span>
              {[500, 1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditQuantity(preset)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    editQuantity === preset
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {preset.toLocaleString()} un.
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Alterações no Documento</span>
              </button>
            </div>
          </form>
        )}

        {/* PRINTABLE DOCUMENT BODY */}
        <div
          id="printable-archive-slip"
          className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:overflow-visible text-xs font-sans"
        >
          {/* Institutional Header with Official AHP Logo */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Official AHP Logo (Crest + Typography + Slogan) */}
                <div className="shrink-0 bg-white p-1">
                  <AHPLogo className="h-20 sm:h-24 w-auto object-contain print:h-20" />
                </div>

                <div className="sm:border-l-2 sm:border-slate-200 sm:pl-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-black tracking-wider text-xs uppercase">
                    <span>Aldeias Históricas de Portugal</span>
                    <span className="text-slate-300 font-light">&bull;</span>
                    <span className="text-slate-600 font-semibold text-[11px]">Rede de Destinos Turísticos</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight">
                    COMPROVATIVO OFICIAL DE ENTREGA E RECEPÇÃO
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Registo Digital de Distribuição de Material Promocional e Folhetos Informativos &bull;{' '}
                    <strong className="text-emerald-800">Distribuição Gratuita / Sem Custos</strong>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 self-start sm:self-auto">
                <div className="inline-block bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Ref. Documento</span>
                  <span className="font-mono text-sm font-black text-slate-900">{editRef}</span>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">Arquivo AHP Mod. 2026-LOG</span>
              </div>
            </div>
          </div>

          {/* 2-Column Details: Office and Dispatch Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {/* Destination Tourism Office */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Destinatário / Posto de Turismo
              </span>
              <div className="font-bold text-base text-slate-900">{activeDisplayOffice.name}</div>
              <div className="font-mono text-xs text-slate-500 mb-2">
                Código: {activeDisplayOffice.code} &bull; Zona: {activeDisplayOffice.zone}
              </div>

              <div className="space-y-1 text-slate-600 text-xs">
                <div>
                  <strong className="text-slate-700">Responsável / Receção:</strong>{' '}
                  {editConfirmedBy || activeDisplayOffice.contactPerson || 'Posto de Turismo'}
                </div>
                <div>
                  <strong className="text-slate-700">Email:</strong> {activeDisplayOffice.email}
                </div>
                <div>
                  <strong className="text-slate-700">Morada:</strong> {activeDisplayOffice.address || '—'}
                </div>
              </div>
            </div>

            {/* Dispatch / Logistics Details */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Dados da Expedição &amp; Transporte
              </span>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Data de Entrega:</span>
                  <span className="font-bold text-slate-900">{editDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Transportador / Entregador:</span>
                  <span className="font-semibold text-slate-900">{editCourier}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Modo de Validação:</span>
                  <span className="font-semibold text-emerald-800">Leitura Digital QR Code</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500">Custo / Valor Comercial:</span>
                  <span className="font-bold text-emerald-800">GRATUITO (0,00€ &bull; Sem Custos)</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Observações:</span>
                  <span className="text-slate-800 italic">{editNotes || 'Sem anotações complementares'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Material Delivery Manifest Table (PRICES REMOVED - TOTALLY FREE OF CHARGE) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Discriminação de Materiais Entregues
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Material de Distribuição 100% Gratuita (Sem Encargos)
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300">SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Designação do Folheto / Publicação</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Idioma</th>
                  <th className="py-2.5 px-3 text-right">Qtd. Entregue</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300 bg-white">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 border-r border-slate-300">
                    {activeDisplayFlyer.sku}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-300">
                    {activeDisplayFlyer.name}
                    <span className="block text-[10px] font-normal text-slate-500">{activeDisplayFlyer.category}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 border-r border-slate-300">
                    {activeDisplayFlyer.language}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-sm text-slate-900">
                    {editQuantity.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">unid.</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2 px-3 text-right text-slate-700 border-r border-slate-300 uppercase text-[10px]">
                    Total Geral de Exemplares Entregues:
                  </td>
                  <td className="py-2 px-3 text-right text-base font-black text-emerald-800">
                    {editQuantity.toLocaleString()} un.
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              <strong>Nota Informativa:</strong> Todos os desdobráveis, guias e mapas promocionais discriminados neste
              comprovativo são cedidos gratuitamente pela Associação de Desenvolvimento Turístico das Aldeias Históricas
              de Portugal para divulgação turística institucional, não constituindo qualquer encargo financeiro ou débito
              para o posto recetor.
            </div>
          </div>

          {/* QR CODE & DIGITAL VALIDATION / RECEPTION STAMP */}
          <div className="border-2 border-slate-900 rounded-xl p-5 bg-slate-50/50 mb-6 relative overflow-hidden">
            {/* Subtle Institutional Watermark */}
            <AHPLogo
              variant="crest"
              className="absolute -right-8 -bottom-8 w-44 h-44 text-slate-900 opacity-[0.05] pointer-events-none print:opacity-[0.07]"
            />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              {/* QR Code Canvas */}
              <div className="shrink-0 flex flex-col items-center bg-white p-3 rounded-lg border border-slate-300 shadow-xs">
                {isGeneratingQr ? (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    Gerando QR Code...
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code Delivery ${editRef}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <span className="font-mono text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tight">
                  Código Verificador QR
                </span>
              </div>

              {/* Confirmation Details & Signature Replacement Clause */}
              <div className="flex-1 space-y-2.5 text-left">
                <div className="flex items-center gap-2">
                  {isConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      RECEBIDO E CONFIRMADO DIGITALMENTE VIA QR CODE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      AGUARDA LEITURA DE QR CODE PELO POSTO DE TURISMO
                    </span>
                  )}
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">
                  <strong>Declaração de Conformidade:</strong> O Posto de Turismo de{' '}
                  <strong className="text-slate-900">{activeDisplayOffice.name}</strong> atesta ter recebido
                  integralmente as <strong className="text-slate-900">{editQuantity.toLocaleString()}</strong> unidades
                  referenciadas da publicação <em>&quot;{activeDisplayFlyer.name}&quot;</em> a título totalmente gratuito
                  e em perfeitas condições de distribuição.
                </p>

                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Validador / Funcionário:</span>
                    <span className="font-bold text-slate-900">
                      {editConfirmedBy || activeDisplayOffice.contactPerson || 'Receção Oficial do Posto de Turismo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data e Hora de Confirmação:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {delivery.confirmedAt || (isConfirmed ? `${editDate} 10:24:00` : 'Pendente de Leitura QR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assinatura Digital / Hash:</span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">
                      {signatureCode}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  * A presente autenticação por leitura de código QR substitui plenamente a assinatura manuscrita tradicional, conferindo plena validade jurídica e contabilística para arquivo e conferência de inventário da Associação de Desenvolvimento Turístico das Aldeias Históricas de Portugal.
                </div>
              </div>
            </div>
          </div>

          {/* Footer Archival Signatures Block */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic text-slate-800 font-bold">{editCourier}</span>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Responsável pelo Transporte / Distribuidor
              </div>
            </div>

            <div>
              <div className="h-10 flex items-center justify-center">
                {isConfirmed ? (
                  <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> [CONFIRMADO VIA QR CODE]
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Validação Digital via QR Code</span>
                )}
              </div>
              <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600 font-medium">
                Pelo Posto de Turismo de {activeDisplayOffice.name}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer (Hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Formato pronto para impressão em folha A4 e arquivo digital PDF &bull; Sem preços nem custos</span>
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
              <span>Imprimir para Arquivo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
