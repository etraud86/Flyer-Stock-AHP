import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  Plus,
  Trash2,
  ExternalLink,
  PackageCheck,
  Languages,
  Edit2,
  RotateCcw,
  Save,
  BookmarkCheck,
  Sparkles,
  Phone,
} from 'lucide-react';
import { FlyerType, TourismOffice } from '../types';
import { TODAY_STR } from '../utils/calculations';

interface DeliveryItemInput {
  flyerTypeId: string;
  quantity: number;
}

interface EmailDispatchNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offices: TourismOffice[];
  flyers: FlyerType[];
  preselectedOfficeId?: string;
  onLogDeliveries?: (
    deliveries: Array<{
      officeId: string;
      flyerTypeId: string;
      quantityDelivered: number;
      date: string;
      courier: string;
      notes: string;
    }>
  ) => void;
  onUpdateOffice?: (officeId: string, updatedData: Partial<TourismOffice>) => void;
  onOpenManageOffices?: () => void;
}

export const EmailDispatchNoticeModal: React.FC<EmailDispatchNoticeModalProps> = ({
  isOpen,
  onClose,
  offices,
  flyers,
  preselectedOfficeId,
  onLogDeliveries,
  onUpdateOffice,
  onOpenManageOffices,
}) => {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    preselectedOfficeId || offices[0]?.id || ''
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(TODAY_STR);
  const [courierName, setCourierName] = useState<string>('Carlos Ferreira (Regional Tourism Van)');
  const [timeWindow, setTimeWindow] = useState<string>('Morning (10:00 – 12:30)');
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [saveToDeliveries, setSaveToDeliveries] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [templateSavedToast, setTemplateSavedToast] = useState<boolean>(false);

  // Multi-item flyer delivery list
  const [items, setItems] = useState<DeliveryItemInput[]>([
    { flyerTypeId: flyers[0]?.id || '', quantity: 1500 },
    { flyerTypeId: flyers[1]?.id || '', quantity: 800 },
  ]);

  // Office Contact Inline Editing State
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [editEmail, setEditEmail] = useState<string>('');
  const [editContactPerson, setEditContactPerson] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [contactSavedToast, setContactSavedToast] = useState<boolean>(false);

  // Directly Editable Email Subject & Body
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [isTextCustomized, setIsTextCustomized] = useState<boolean>(false);

  const currentOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];

  // Initialize or reset contact editing inputs when current office changes
  useEffect(() => {
    if (currentOffice) {
      setEditEmail(currentOffice.email);
      setEditContactPerson(currentOffice.contactPerson || '');
      setEditPhone(currentOffice.phone || '');
    }
  }, [currentOffice?.id, currentOffice?.email]);

  useEffect(() => {
    if (preselectedOfficeId) {
      setSelectedOfficeId(preselectedOfficeId);
    }
  }, [preselectedOfficeId, isOpen]);

  // Helper to generate the standard default content
  const generateDefaultEmailContent = (
    targetOffice: TourismOffice,
    lang: 'pt' | 'en' | 'es',
    date: string,
    time: string,
    courier: string,
    deliveryItems: DeliveryItemInput[]
  ) => {
    const totalFlyers = deliveryItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const itemsListText = deliveryItems
      .map((item) => {
        const fl = flyers.find((f) => f.id === item.flyerTypeId);
        return `• ${item.quantity.toLocaleString()}x "${fl?.name || 'Flyer'}" [${fl?.sku || ''}]`;
      })
      .join('\n');

    // Check if user has saved a custom default template in localStorage for this language
    const savedCustomTemplate = localStorage.getItem(`flyerstock_email_template_${lang}`);
    if (savedCustomTemplate) {
      // Replace placeholders in saved custom template
      const replacedBody = savedCustomTemplate
        .replace(/\{office\}/g, targetOffice?.name || '')
        .replace(/\{code\}/g, targetOffice?.code || '')
        .replace(/\{contact\}/g, targetOffice?.contactPerson || 'Responsável')
        .replace(/\{address\}/g, targetOffice?.address || '')
        .replace(/\{date\}/g, date)
        .replace(/\{time\}/g, time)
        .replace(/\{courier\}/g, courier)
        .replace(/\{items\}/g, itemsListText)
        .replace(/\{total\}/g, totalFlyers.toLocaleString());

      const replacedSubject = lang === 'pt'
        ? `Aviso de Entrega de Folhetos – ${targetOffice?.name} – ${date}`
        : lang === 'es'
        ? `Aviso de Entrega de Folletos – ${targetOffice?.name} – ${date}`
        : `Notice of Promotional Flyers Delivery – ${targetOffice?.name} – ${date}`;

      return { subject: replacedSubject, body: replacedBody };
    }

    if (lang === 'pt') {
      const subject = `Aviso de Entrega de Folhetos Promocionais – ${targetOffice?.name} – ${date}`;
      const body = `Exmo(a). ${targetOffice?.contactPerson || 'Responsável'},

Informamos que foi agendada uma nova entrega de material promocional e folhetos turísticos para o Posto de Turismo:

Posto de Destino: ${targetOffice?.name} (${targetOffice?.code})
Morada: ${targetOffice?.address}
Data Prevista de Entrega: ${date}
Período Previsto: ${time}
Entregue por: ${courier}

Material / Folhetos a Entregar:
${itemsListText}

Total de exemplares: ${totalFlyers.toLocaleString()} folhetos.

Solicitamos que confirme a receção junto do motorista no momento do descarregamento. Caso necessite de qualquer ajuste de horário ou esclarecimento adicional, por favor responda diretamente a esta mensagem.

Com os melhores cumprimentos,
Gabinete de Distribuição e Promoção Turística
Rede de Aldeias e Postos de Turismo`;
      return { subject, body };
    }

    if (lang === 'es') {
      const subject = `Aviso de Entrega de Folletos Turísticos – ${targetOffice?.name} – ${date}`;
      const body = `Estimado/a ${targetOffice?.contactPerson || 'Responsable'},

Le informamos que se ha programado una entrega de folletos turísticos y material promocional para la oficina de turismo:

Oficina de Destino: ${targetOffice?.name} (${targetOffice?.code})
Dirección: ${targetOffice?.address}
Fecha Prevista: ${date}
Horario Estimado: ${time}
Entregado por: ${courier}

Detalle de folletos a entregar:
${itemsListText}

Total a entregar: ${totalFlyers.toLocaleString()} folletos.

Agradecemos que el personal disponible firme la nota de entrega al transportista. Si tiene alguna pregunta o solicitud adicional, responda directamente a este correo.

Atentamente,
Departamento de Distribución y Promoción Turística`;
      return { subject, body };
    }

    // Default English
    const subject = `Notice of Promotional Flyers Delivery – ${targetOffice?.name} – ${date}`;
    const body = `Dear ${targetOffice?.contactPerson || 'Tourism Officer'},

We are pleased to notify you that a new replenishment delivery of promotional flyers and visitor guides has been scheduled for your tourism office:

Destination Office: ${targetOffice?.name} (${targetOffice?.code})
Delivery Address: ${targetOffice?.address}
Scheduled Delivery Date: ${date}
Estimated Time Window: ${time}
Delivered by: ${courier}

Items & Flyer Quantities to be Received:
${itemsListText}

Total Flyers in Delivery: ${totalFlyers.toLocaleString()} units.

Please ensure a team member is available at reception to inspect and acknowledge receipt of the parcels. Should you have any questions or require schedule adjustments, please reply directly to this email.

Best regards,
Tourism Distribution & Promotion Office
Historic Villages & Regional Tourism Network`;
    return { subject, body };
  };

  // Sync auto-generated text whenever form fields change, UNLESS the user has already manually edited the text
  useEffect(() => {
    if (!currentOffice) return;
    if (!isTextCustomized) {
      const defaultContent = generateDefaultEmailContent(
        currentOffice,
        language,
        deliveryDate,
        timeWindow,
        courierName,
        items
      );
      setCustomSubject(defaultContent.subject);
      setCustomBody(defaultContent.body);
    }
  }, [
    selectedOfficeId,
    language,
    deliveryDate,
    timeWindow,
    courierName,
    items,
    isTextCustomized,
  ]);

  if (!isOpen) return null;

  const totalFlyers = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleAddItem = () => {
    const unselected = flyers.find((f) => !items.some((i) => i.flyerTypeId === f.id));
    setItems((prev) => [
      ...prev,
      { flyerTypeId: unselected?.id || flyers[0]?.id || '', quantity: 500 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof DeliveryItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveContactChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOffice || !onUpdateOffice) return;

    onUpdateOffice(currentOffice.id, {
      email: editEmail.trim(),
      contactPerson: editContactPerson.trim(),
      phone: editPhone.trim(),
    });

    setIsEditingContact(false);
    setContactSavedToast(true);
    setTimeout(() => setContactSavedToast(false), 3000);
  };

  // Reset or regenerate text using the latest parameters
  const handleRegenerateText = () => {
    if (!currentOffice) return;
    const defaultContent = generateDefaultEmailContent(
      currentOffice,
      language,
      deliveryDate,
      timeWindow,
      courierName,
      items
    );
    setCustomSubject(defaultContent.subject);
    setCustomBody(defaultContent.body);
    setIsTextCustomized(false);
  };

  // Save current body as default template for this language
  const handleSaveAsDefaultTemplate = () => {
    // Replace dynamic items with standard tokens if present
    let templateText = customBody;
    localStorage.setItem(`flyerstock_email_template_${language}`, templateText);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleResetSystemTemplate = () => {
    localStorage.removeItem(`flyerstock_email_template_${language}`);
    handleRegenerateText();
  };

  const handleCopyEmail = () => {
    const recipient = currentOffice?.email || '';
    const fullText = `To: ${currentOffice?.contactPerson || ''} <${recipient}>\nSubject: ${customSubject}\n\n${customBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenEmailClient = () => {
    // Save to deliveries if requested
    if (saveToDeliveries && onLogDeliveries) {
      const newDeliveries = items.map((item) => {
        return {
          officeId: currentOffice.id,
          flyerTypeId: item.flyerTypeId,
          quantityDelivered: Number(item.quantity),
          date: deliveryDate,
          courier: courierName,
          notes: `Delivery notice sent via email on ${deliveryDate}. Delivered by ${courierName}.`,
        };
      });
      onLogDeliveries(newDeliveries);
    }

    // Build mailto URI
    const recipient = currentOffice?.email || 'office@tourism.org';
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      customSubject
    )}&body=${encodeURIComponent(customBody)}`;

    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-linear-to-r from-blue-700 to-indigo-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Send Delivery Notice Email to Tourism Office</h3>
              <p className="text-xs text-blue-100">
                Directly edit email text, manage tourism office email contacts, and send dispatch notices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto flex-1">
          {/* Left Column: Form Controls & Office Contact Management */}
          <div className="lg:col-span-5 p-5 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                1. Delivery &amp; Office Info
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <Languages className="w-3.5 h-3.5 text-slate-500 ml-1" />
                {(['pt', 'en', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setIsTextCustomized(false);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                      language === lang
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Destination Tourism Office */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Destination Tourism Office *
                </label>
                {onOpenManageOffices && (
                  <button
                    type="button"
                    onClick={onOpenManageOffices}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                  >
                    All 12 Offices &rarr;
                  </button>
                )}
              </div>
              <select
                value={selectedOfficeId}
                onChange={(e) => {
                  setSelectedOfficeId(e.target.value);
                  setIsEditingContact(false);
                }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </select>

              {/* Office Contact Details Banner with Inline Editor */}
              {currentOffice && (
                <div className="mt-2 p-3 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>{currentOffice.name} ({currentOffice.code})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{currentOffice.contactPerson || 'Posto de Turismo'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-800 font-mono font-semibold">
                        <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{currentOffice.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingContact(!isEditingContact)}
                      className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-2xs"
                      title="Correct this office's email address or contact person"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isEditingContact ? 'Cancel' : 'Edit Contact'}</span>
                    </button>
                  </div>

                  {contactSavedToast && (
                    <div className="p-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded text-[11px] font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Contact email address updated and saved!</span>
                    </div>
                  )}

                  {/* Inline Form to change email address and contact */}
                  {isEditingContact && (
                    <form
                      onSubmit={handleSaveContactChanges}
                      className="p-2.5 bg-white border border-blue-300 rounded-md space-y-2 mt-2 animate-in fade-in duration-100"
                    >
                      <div className="text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1">
                        <Edit2 className="w-3 h-3 text-amber-600" />
                        <span>Change Contact Details for {currentOffice.name}</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-0.5">
                          Verified Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="e.g. turismo.castelonovo@municipio.pt"
                          className="w-full border-2 border-amber-300 focus:border-blue-500 rounded px-2 py-1 text-xs font-semibold text-slate-900 bg-amber-50/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-0.5">
                            Contact Person
                          </label>
                          <input
                            type="text"
                            value={editContactPerson}
                            onChange={(e) => setEditContactPerson(e.target.value)}
                            placeholder="Posto de Turismo"
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-0.5">
                            Phone
                          </label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+351 275..."
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingContact(false)}
                          className="px-2 py-1 border border-slate-300 rounded text-[10px] font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Save Contact</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Date & Time Window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Time Window
                </label>
                <input
                  type="text"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  placeholder="e.g. Morning (10:00 – 12:30)"
                  className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Delivered By */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Delivered By (Driver / Courier / Staff) *
              </label>
              <input
                type="text"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. Carlos Ferreira (Regional Tourism Van)"
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Flyers Being Delivered (Multi-Item) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  2. Flyers &amp; Quantities to Deliver
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Flyer Item</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md"
                  >
                    <select
                      value={item.flyerTypeId}
                      onChange={(e) => handleItemChange(idx, 'flyerTypeId', e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-2 py-1 bg-white text-[11px] focus:ring-1 focus:ring-blue-500"
                    >
                      {flyers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.sku} - {f.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step={100}
                      min={100}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-24 border border-slate-300 rounded px-2 py-1 bg-white text-[11px] font-bold text-slate-900 text-right focus:ring-1 focus:ring-blue-500"
                      placeholder="Qty"
                    />

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remove flyer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-2 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-900 font-semibold text-xs">
                <span>Total Flyers in this Dispatch:</span>
                <span className="text-sm font-bold text-indigo-700">
                  {totalFlyers.toLocaleString()} units
                </span>
              </div>
            </div>

            {/* Checkbox: Log to system deliveries */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToDeliveries}
                  onChange={(e) => setSaveToDeliveries(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium text-xs">
                  Also save and record these {items.length} delivery row(s) in the system
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Directly Editable Email Office Text */}
          <div className="lg:col-span-7 p-5 bg-slate-50 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-3">
              {/* Header & Controls for text editing */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    <span>Email Text Editor (Directly Editable)</span>
                  </div>

                  {isTextCustomized && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                      Modified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRegenerateText}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 cursor-pointer shadow-2xs"
                    title="Regenerate email text from current flyer items and delivery date"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsDefaultTemplate}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-[11px] font-semibold text-indigo-700 cursor-pointer shadow-2xs"
                    title="Save this edited text as your default template for this language"
                  >
                    <BookmarkCheck className="w-3 h-3" />
                    <span>Save Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {templateSavedToast && (
                <div className="p-2 bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-md text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-indigo-600" />
                    <span>This customized text has been saved as your default template for [{language.toUpperCase()}]!</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSystemTemplate}
                    className="text-[11px] underline text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    Reset to original
                  </button>
                </div>
              )}

              {/* Envelope Recipient & Subject Header */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs shadow-2xs">
                {/* To Recipient */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold w-16 shrink-0">To:</span>
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <span className="font-semibold text-slate-900 truncate">
                      {currentOffice?.contactPerson} &lt;{currentOffice?.email}&gt;
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(true)}
                      className="text-[11px] text-blue-600 hover:underline shrink-0"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                {/* Editable Subject */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold w-16 shrink-0">Subject:</span>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => {
                      setCustomSubject(e.target.value);
                      setIsTextCustomized(true);
                    }}
                    className="flex-1 border border-slate-200 focus:border-blue-500 rounded px-2 py-1 text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none"
                    placeholder="Email Subject line..."
                  />
                </div>
              </div>

              {/* Directly Editable Email Body Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                  <span>Directly edit the message text below before sending:</span>
                  <span className="font-mono text-[10px]">
                    {customBody.length} characters &bull; {customBody.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  value={customBody}
                  onChange={(e) => {
                    setCustomBody(e.target.value);
                    setIsTextCustomized(true);
                  }}
                  rows={14}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3.5 text-slate-800 text-xs font-sans leading-relaxed shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-y select-text"
                  placeholder="Type or modify email message text directly here..."
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard' : 'Copy Email Body'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEmailClient}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email Client (Send to {currentOffice?.email})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
