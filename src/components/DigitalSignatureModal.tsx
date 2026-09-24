import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  PenTool,
  RotateCcw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Package,
  Clock,
  Printer,
  Calendar,
  Type,
  Check,
} from 'lucide-react';
import { DeliveryRecord, FlyerType, TourismOffice } from '../types';
import { AHPCasteloIcon } from './AHPLogo';
import { InstitutionalCoFinancingLogos } from './InstitutionalCoFinancingLogos';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord;
  office: TourismOffice;
  flyer: FlyerType;
  pendingOfficeDeliveries?: DeliveryRecord[];
  onSaveSignature: (
    deliveryId: string,
    confirmedBy: string,
    signerRole: string,
    signatureDataUrl: string,
    signAllPending?: boolean
  ) => void;
  onOpenPrintSlip?: (del: DeliveryRecord, off: TourismOffice, fl: FlyerType) => void;
}

type Mode = 'draw' | 'type';

interface Point {
  x: number;
  y: number;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  delivery,
  office,
  flyer,
  pendingOfficeDeliveries = [],
  onSaveSignature,
  onOpenPrintSlip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>('draw');

  // Signer inputs
  const [signerName, setSignerName] = useState(
    delivery.confirmedBy || office.contactPerson || ''
  );
  const [signerRole, setSignerRole] = useState(
    delivery.signerRole || 'Receção / Técnico de Turismo'
  );
  const [signAllPending, setSignAllPending] = useState(true);

  // Canvas drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e3a8a'); // Classic blue signing ink
  const [penWidth, setPenWidth] = useState<number>(3);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  // Type signature fallback
  const [typedFontIndex, setTypedFontIndex] = useState(0);

  // Status
  const isAlreadySigned = delivery.confirmationStatus === 'confirmed';

  // Initialize signer info
  useEffect(() => {
    if (delivery) {
      setSignerName(delivery.confirmedBy || office.contactPerson || '');
      setSignerRole(delivery.signerRole || 'Receção / Técnico de Turismo');
      setHasDrawn(Boolean(delivery.signatureDataUrl));
    }
  }, [delivery, office]);

  // Canvas Setup & Scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Only resize if different to avoid clearing canvas on minor re-renders
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setupCanvas();
      redrawAllStrokes();
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, setupCanvas]);

  // Redraw strokes
  const redrawAllStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // If already has saved signature data and strokes are empty, draw image
    if (delivery.signatureDataUrl && strokesRef.current.length === 0) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = delivery.signatureDataUrl;
      return;
    }

    // Draw baseline guideline
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 40);
    ctx.lineTo(rect.width - 30, rect.height - 40);
    ctx.stroke();
    ctx.restore();

    // Draw strokes
    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        const xc = (stroke[i].x + stroke[i - 1].x) / 2;
        const yc = (stroke[i].y + stroke[i - 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i - 1].x, stroke[i - 1].y, xc, yc);
      }
      ctx.stroke();
    });
  };

  // Pointer event handlers (Tablet Touch, Stylus, Mouse)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAlreadySigned && !strokesRef.current.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Capture pointer to handle touch/pen smoothly without scroll or interruptions
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const pt = getCanvasCoords(e);
    currentStrokeRef.current = [pt];

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pt = getCanvasCoords(e);
    currentStrokeRef.current.push(pt);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const stroke = currentStrokeRef.current;
      if (stroke.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const prev = stroke[stroke.length - 2];
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
    setIsDrawing(false);
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
      setHasDrawn(true);
    }
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasDrawn(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Redraw baseline
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(30, rect.height - 40);
    ctx.lineTo(rect.width - 30, rect.height - 40);
    ctx.stroke();
    ctx.restore();
  };

  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    setHasDrawn(strokesRef.current.length > 0);
    redrawAllStrokes();
  };

  // Convert typed text to canvas signature if typed mode is used
  const renderTypedSignatureToCanvas = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Create a temporary clean canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rect.width * dpr;
    tempCanvas.height = rect.height * dpr;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    ctx.fillStyle = penColor;

    const fonts = [
      'italic bold 32px "Caveat", "Brush Script MT", "Segoe Script", cursive',
      'italic 34px "Dancing Script", "Snell Roundhand", "Bradley Hand", cursive',
      'italic bold 28px "Playfair Display", Georgia, serif',
    ];

    ctx.font = fonts[typedFontIndex] || fonts[0];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName.trim() || 'Assinatura', rect.width / 2, rect.height / 2);

    // Draw baseline flourish
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const textWidth = ctx.measureText(signerName.trim() || 'Assinatura').width;
    const startX = Math.max(30, (rect.width - textWidth) / 2 - 15);
    const endX = Math.min(rect.width - 30, (rect.width + textWidth) / 2 + 15);
    ctx.moveTo(startX, rect.height / 2 + 25);
    ctx.quadraticCurveTo(rect.width / 2, rect.height / 2 + 35, endX, rect.height / 2 + 22);
    ctx.stroke();

    return tempCanvas.toDataURL('image/png');
  };

  const handleConfirmSignature = () => {
    const name = signerName.trim() || office.contactPerson || `${office.name} Staff`;
    const role = signerRole.trim() || 'Receção / Posto de Turismo';

    let signatureUrl = '';

    if (mode === 'type') {
      signatureUrl = renderTypedSignatureToCanvas() || '';
    } else {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        signatureUrl = canvas.toDataURL('image/png');
      } else if (delivery.signatureDataUrl) {
        signatureUrl = delivery.signatureDataUrl;
      }
    }

    if (!signatureUrl && !hasDrawn && mode !== 'type') {
      alert('Por favor, assine com o dedo, caneta ou rato no quadro de assinatura antes de confirmar.');
      return;
    }

    onSaveSignature(
      delivery.id,
      name,
      role,
      signatureUrl,
      pendingOfficeDeliveries.length > 1 ? signAllPending : false
    );
    onClose();
  };

  if (!isOpen) return null;

  const otherPendingCount = pendingOfficeDeliveries.filter((d) => d.id !== delivery.id).length;

  return (
    <div
      id="digital-signature-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {isAlreadySigned ? 'Comprovativo de Assinatura Digital' : 'Assinatura Digital de Entrega'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tablet &bull; PC &bull; Touch
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {office.name} &bull; Ref. {delivery.deliveryRef}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Dispatch summary banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-700">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-sm">{flyer.name}</span>
                <span className="text-slate-500">
                  {delivery.quantityDelivered.toLocaleString()} exemplares &bull; Transporte:{' '}
                  <strong>{delivery.courier}</strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Data de Entrega:</span>
              <span className="font-mono font-bold text-slate-900">{delivery.date}</span>
            </div>
          </div>

          {/* If already signed banner */}
          {isAlreadySigned && delivery.signatureDataUrl && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Entrega Validada e Assinada Digitalmente
                </span>
                <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                  {delivery.confirmedAt}
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                Assinado por <strong>{delivery.confirmedBy}</strong> ({delivery.signerRole || 'Receção'}).
              </p>
              <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-center">
                <img
                  src={delivery.signatureDataUrl}
                  alt="Rubrica Digital"
                  className="max-h-24 object-contain"
                />
              </div>
            </div>
          )}

          {/* Signer Information Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Responsável / Rececionista *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ex: Maria João Fernandes"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cargo / Função no Posto de Turismo
              </label>
              <input
                type="text"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="Ex: Responsável de Receção"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Mode Tabs: Touch/Stylus Canvas vs Typed Signoff */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Rubrica / Assinatura:</span>
                <span className="text-[11px] text-slate-500">
                  (assine diretamente com o dedo, caneta stylus ou rato)
                </span>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mode === 'draw'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Desenhar (Touch / Rato)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('type')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mode === 'type'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Teclado / Formal</span>
                </button>
              </div>
            </div>

            {mode === 'draw' ? (
              <div className="space-y-2">
                {/* Canvas Drawing Surface */}
                <div className="relative border-2 border-slate-300 rounded-xl bg-slate-50/70 overflow-hidden shadow-inner focus-within:border-emerald-500">
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{ touchAction: 'none' }}
                    className="w-full h-44 cursor-crosshair block select-none bg-white"
                  />

                  {/* Canvas watermark guide */}
                  {!hasDrawn && !isAlreadySigned && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 select-none">
                      <PenTool className="w-6 h-6 mb-1 text-slate-300 stroke-[1.5]" />
                      <span className="text-xs font-medium">
                        Assine aqui no ecrã (Touch / Stylus / Rato)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Compatível com Tablets, iPads, telemóveis e computadores
                      </span>
                    </div>
                  )}

                  {/* Official seal watermark in corner */}
                  <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-1.5 opacity-30 text-slate-900">
                    <AHPCasteloIcon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-mono uppercase font-bold">
                      AHP &bull; {office.code}
                    </span>
                  </div>
                </div>

                {/* Canvas Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-3">
                    {/* Pen Ink Color */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="text-[11px] font-medium">Tinta:</span>
                      <button
                        type="button"
                        onClick={() => setPenColor('#1e3a8a')}
                        className={`w-5 h-5 rounded-full bg-blue-900 cursor-pointer border-2 transition-transform ${
                          penColor === '#1e3a8a' ? 'scale-115 border-slate-900' : 'border-transparent'
                        }`}
                        title="Caneta Azul Formal"
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor('#0f172a')}
                        className={`w-5 h-5 rounded-full bg-slate-900 cursor-pointer border-2 transition-transform ${
                          penColor === '#0f172a' ? 'scale-115 border-slate-900' : 'border-transparent'
                        }`}
                        title="Tinta Preta Formal"
                      />
                    </div>

                    {/* Pen Width */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 ml-2">
                      <span className="text-[11px] font-medium">Traço:</span>
                      <button
                        type="button"
                        onClick={() => setPenWidth(2)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          penWidth === 2 ? 'bg-slate-200 text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Fino
                      </button>
                      <button
                        type="button"
                        onClick={() => setPenWidth(3)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          penWidth === 3 ? 'bg-slate-200 text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        Médio
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer transition-colors"
                      title="Desfazer último traço"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Desfazer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer transition-colors"
                      title="Limpar e recomeçar assinatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Typed Signature Mode */
              <div className="border-2 border-slate-300 rounded-xl p-5 bg-slate-50 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  A assinatura será gerada eletronicamente com base no nome inserido:
                </p>
                <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs min-h-[90px] flex items-center justify-center">
                  <span
                    className="text-3xl text-blue-900 select-none tracking-wide"
                    style={{
                      fontFamily:
                        typedFontIndex === 0
                          ? 'cursive, "Brush Script MT"'
                          : typedFontIndex === 1
                          ? '"Dancing Script", cursive'
                          : 'Georgia, serif',
                      fontStyle: 'italic',
                    }}
                  >
                    {signerName.trim() || 'Assinatura Digital'}
                  </span>
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTypedFontIndex(idx)}
                      className={`px-3 py-1 rounded text-xs border cursor-pointer ${
                        typedFontIndex === idx
                          ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Estilo {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bulk sign other pending deliveries for this office if available */}
          {otherPendingCount > 0 && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <input
                type="checkbox"
                id="sign-all-pending-check"
                checked={signAllPending}
                onChange={(e) => setSignAllPending(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="sign-all-pending-check" className="cursor-pointer">
                <strong>Assinar também as outras {otherPendingCount} entregas pendentes</strong> deste posto de turismo
                ({office.name}) de uma só vez com esta mesma rubrica.
              </label>
            </div>
          )}

          {/* Legal / Audit compliance note */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Certificação em conformidade com o Regulamento Interno de Logística e Gestão de Materiais Promocionais das
              Aldeias Históricas de Portugal.
            </span>
          </div>

          {/* Institutional Partners Logos */}
          <div className="pt-2 flex flex-col items-center justify-center border-t border-slate-200 gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
              Financiamento &bull; Estratégia PROVERE &bull; Centro 2030
            </span>
            <InstitutionalCoFinancingLogos showLabels={false} />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{office.name}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isAlreadySigned && onOpenPrintSlip && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrintSlip(delivery, office, flyer);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprovativo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmSignature}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Gravar e Confirmar Assinatura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
