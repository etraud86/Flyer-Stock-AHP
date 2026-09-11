import React, { useState } from 'react';
import {
  Building2,
  QrCode,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Edit2,
  Edit3,
  Trash2,
  Save,
  X,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { TourismOffice, FlyerType, DeliveryRecord } from '../types';
import { TODAY_STR } from '../utils/calculations';
import { generateDeliveryQRToken } from '../utils/qrCodeGenerator';

interface TourismOfficesHubViewProps {
  offices: TourismOffice[];
  flyers: FlyerType[];
  deliveries: DeliveryRecord[];
  onAddDelivery: (newDelivery: Omit<DeliveryRecord, 'id' | 'deliveryRef'>) => DeliveryRecord | void;
  onUpdateDelivery?: (id: string, patch: Partial<DeliveryRecord>) => void;
  onDeleteDelivery?: (id: string) => void;
  onConfirmDelivery: (deliveryId: string, confirmedBy: string) => void;
  onOpenPrintSlip: (delivery: DeliveryRecord, office: TourismOffice, flyer: FlyerType) => void;
  onOpenScanner: (office: TourismOffice) => void;
  onOpenEditOffice?: (office: TourismOffice) => void;
  onUpdateOffice?: (officeId: string, updatedData: Partial<TourismOffice>) => void;
  onAddOffice?: (newOffice: Omit<TourismOffice, 'id'>) => void;
  onDeleteOffice?: (officeId: string) => void;
  onComposeEmail?: (officeId: string) => void;
}

export const TourismOfficesHubView: React.FC<TourismOfficesHubViewProps> = ({
  offices,
  flyers,
  deliveries,
  onAddDelivery,
  onUpdateDelivery,
  onDeleteDelivery,
  onConfirmDelivery,
  onOpenPrintSlip,
  onOpenScanner,
  onOpenEditOffice,
  onUpdateOffice,
  onAddOffice,
  onDeleteOffice,
  onComposeEmail,
}) => {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(offices[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  // Quick Dispatch Form in this Office
  const [isDispatchFormOpen, setIsDispatchFormOpen] = useState<boolean>(false);
  const [dispatchFlyerId, setDispatchFlyerId] = useState<string>(flyers[0]?.id || '');
  const [dispatchQty, setDispatchQty] = useState<number>(1000);
  const [dispatchDate, setDispatchDate] = useState<string>(TODAY_STR);
  const [dispatchCourier, setDispatchCourier] = useState<string>('Express Distribution Circuit AHP');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');

  // Office Editing State
  const [isEditingOffice, setIsEditingOffice] = useState<boolean>(false);
  const [officeFormData, setOfficeFormData] = useState<Partial<TourismOffice>>({});
  const [officeSavedToast, setOfficeSavedToast] = useState<string>('');

  // Add New Office State
  const [isAddingOffice, setIsAddingOffice] = useState<boolean>(false);
  const [newOfficeData, setNewOfficeData] = useState<Omit<TourismOffice, 'id'>>({
    name: '',
    code: '',
    zone: 'Beira Interior',
    footfallTier: 'Medium',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  // Delivery Editing State (QR Hub)
  const [editingDelivery, setEditingDelivery] = useState<DeliveryRecord | null>(null);
  const [delEditRef, setDelEditRef] = useState<string>('');
  const [delEditDate, setDelEditDate] = useState<string>('');
  const [delEditFlyerId, setDelEditFlyerId] = useState<string>('');
  const [delEditQty, setDelEditQty] = useState<number>(1000);
  const [delEditCourier, setDelEditCourier] = useState<string>('');
  const [delEditNotes, setDelEditNotes] = useState<string>('');
  const [delEditStatus, setDelEditStatus] = useState<'pending' | 'confirmed'>('pending');
  const [delEditConfirmedBy, setDelEditConfirmedBy] = useState<string>('');
  const [delEditOfficeId, setDelEditOfficeId] = useState<string>('');
  const [deliverySavedToast, setDeliverySavedToast] = useState<string>('');

  const activeOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];

  // Deliveries for the active office
  const officeDeliveries = deliveries
    .filter((d) => d.officeId === activeOffice?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const pendingDeliveries = officeDeliveries.filter((d) => d.confirmationStatus !== 'confirmed');
  const confirmedDeliveries = officeDeliveries.filter((d) => d.confirmationStatus === 'confirmed');

  const filteredDeliveries = officeDeliveries.filter((d) => {
    if (statusFilter === 'pending' && d.confirmationStatus === 'confirmed') return false;
    if (statusFilter === 'confirmed' && d.confirmationStatus !== 'confirmed') return false;
    return true;
  });

  const totalFlyersReceivedByOffice = officeDeliveries.reduce((sum, d) => sum + d.quantityDelivered, 0);

  // Quick Dispatch submit
  const handleCreateOfficeDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffice || !dispatchFlyerId) return;

    const clampedQty = Math.max(1, Math.min(1000000, Number(dispatchQty) || 1));
    const qrToken = generateDeliveryQRToken(`DEL-${Date.now().toString().slice(-4)}`, activeOffice.code);

    const createdRecord = onAddDelivery({
      officeId: activeOffice.id,
      flyerTypeId: dispatchFlyerId,
      quantityDelivered: clampedQty,
      date: dispatchDate,
      courier: dispatchCourier,
      notes: dispatchNotes,
      confirmationStatus: 'pending',
      qrToken,
    });

    setIsDispatchFormOpen(false);
    setDispatchNotes('');

    if (createdRecord) {
      const fl = flyers.find((f) => f.id === dispatchFlyerId) || flyers[0];
      onOpenPrintSlip(createdRecord, activeOffice, fl);
    }
  };

  // Office Editing Handlers
  const handleStartEditOffice = () => {
    if (!activeOffice) return;
    setOfficeFormData({
      name: activeOffice.name,
      code: activeOffice.code,
      zone: activeOffice.zone,
      footfallTier: activeOffice.footfallTier,
      contactPerson: activeOffice.contactPerson,
      email: activeOffice.email,
      phone: activeOffice.phone,
      address: activeOffice.address,
    });
    setIsEditingOffice(true);
  };

  const handleSaveOfficeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOffice) return;
    if (onUpdateOffice) {
      onUpdateOffice(activeOffice.id, officeFormData);
    }
    setIsEditingOffice(false);
    setOfficeSavedToast('Office details updated successfully!');
    setTimeout(() => setOfficeSavedToast(''), 3500);
  };

  const handleDeleteOfficeClick = (offId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove office "${name}" from the network?`)) {
      if (onDeleteOffice) {
        onDeleteOffice(offId);
        const remaining = offices.filter((o) => o.id !== offId);
        if (remaining.length > 0) {
          setSelectedOfficeId(remaining[0].id);
        }
      }
    }
  };

  const handleCreateNewOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeData.name.trim()) return;
    if (onAddOffice) {
      onAddOffice(newOfficeData);
    }
    setIsAddingOffice(false);
    setNewOfficeData({
      name: '',
      code: '',
      zone: 'Beira Interior',
      footfallTier: 'Medium',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
    });
    setOfficeSavedToast('New tourism office registered successfully!');
    setTimeout(() => setOfficeSavedToast(''), 3500);
  };

  // Delivery Editing Handlers (QR Hub)
  const handleStartEditDelivery = (del: DeliveryRecord) => {
    setEditingDelivery(del);
    setDelEditRef(del.deliveryRef);
    setDelEditDate(del.date);
    setDelEditFlyerId(del.flyerTypeId);
    setDelEditQty(del.quantityDelivered);
    setDelEditCourier(del.courier);
    setDelEditNotes(del.notes || '');
    setDelEditStatus(del.confirmationStatus || 'pending');
    setDelEditConfirmedBy(del.confirmedBy || activeOffice?.contactPerson || '');
    setDelEditOfficeId(del.officeId);
  };

  const handleSaveDeliveryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery || !onUpdateDelivery) return;

    const clampedQty = Math.max(1, Math.min(1000000, Number(delEditQty) || 1));
    const patch: Partial<DeliveryRecord> = {
      deliveryRef: delEditRef.trim() || editingDelivery.deliveryRef,
      date: delEditDate,
      flyerTypeId: delEditFlyerId,
      quantityDelivered: clampedQty,
      courier: delEditCourier.trim(),
      notes: delEditNotes.trim(),
      confirmationStatus: delEditStatus,
      officeId: delEditOfficeId || editingDelivery.officeId,
      confirmedBy: delEditStatus === 'confirmed' ? delEditConfirmedBy.trim() || 'Posto de Turismo' : undefined,
      confirmedAt:
        delEditStatus === 'confirmed'
          ? editingDelivery.confirmedAt || `${delEditDate} 12:00:00`
          : undefined,
    };

    onUpdateDelivery(editingDelivery.id, patch);
    setEditingDelivery(null);
    setDeliverySavedToast('Delivery record & QR details saved successfully!');
    setTimeout(() => setDeliverySavedToast(''), 3500);
  };

  const handleDeleteDeliveryClick = (delId: string, ref: string) => {
    if (window.confirm(`Are you sure you want to delete delivery record "${ref}"?`)) {
      if (onDeleteDelivery) {
        onDeleteDelivery(delId);
        setDeliverySavedToast('Delivery record deleted.');
        setTimeout(() => setDeliverySavedToast(''), 3000);
      }
    }
  };

  const filteredOffices = offices.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.zone.toLowerCase().includes(q) ||
      o.contactPerson.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast notifications */}
      {(officeSavedToast || deliverySavedToast) && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{officeSavedToast || deliverySavedToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Tourism Offices &amp; QR Delivery Verification Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              Paperless Digital Signatures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Each tourism office has a dedicated area where flyer dispatches generate an automatic
            QR code. All offices and delivery records are fully editable with instant synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenScanner(activeOffice)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Read Office QR Code</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Hub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Tourism Offices List / Selector */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Tourism Offices ({offices.length})</span>
            </div>

            {onAddOffice && (
              <button
                type="button"
                onClick={() => setIsAddingOffice(!isAddingOffice)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer transition-colors"
                title="Register a new village tourism office"
              >
                <Plus className="w-3 h-3" />
                <span>Add Office</span>
              </button>
            )}
          </div>

          {/* Quick Add Office Form Drawer */}
          {isAddingOffice && (
            <form
              onSubmit={handleCreateNewOffice}
              className="p-3.5 bg-emerald-50/70 border-b border-emerald-200 text-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  New Tourism Office
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingOffice(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Office Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Posto de Turismo de Marialva"
                  value={newOfficeData.name}
                  onChange={(e) => setNewOfficeData({ ...newOfficeData, name: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Code (3-4 Letters)</label>
                  <input
                    type="text"
                    placeholder="e.g. MRV"
                    value={newOfficeData.code}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, code: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white uppercase font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Zone / Region</label>
                  <input
                    type="text"
                    value={newOfficeData.zone}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, zone: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Contact Staff</label>
                  <input
                    type="text"
                    placeholder="Staff / Receção"
                    value={newOfficeData.contactPerson}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, contactPerson: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Email *</label>
                  <input
                    type="email"
                    placeholder="turismo@aldeia.pt"
                    value={newOfficeData.email}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, email: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Phone</label>
                  <input
                    type="tel"
                    placeholder="+351 271..."
                    value={newOfficeData.phone}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, phone: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Footfall Tier</label>
                  <select
                    value={newOfficeData.footfallTier}
                    onChange={(e) =>
                      setNewOfficeData({
                        ...newOfficeData,
                        footfallTier: e.target.value as 'Low' | 'Medium' | 'High' | 'Ultra-High',
                      })
                    }
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Low">Low (Tranquilo)</option>
                    <option value="Medium">Medium (Regular)</option>
                    <option value="High">High (Elevado)</option>
                    <option value="Ultra-High">Ultra-High (Intenso)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Address</label>
                <input
                  type="text"
                  placeholder="Largo do Castelo, ..."
                  value={newOfficeData.address}
                  onChange={(e) => setNewOfficeData({ ...newOfficeData, address: e.target.value })}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingOffice(false)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-2xs cursor-pointer"
                >
                  Save Office
                </button>
              </div>
            </form>
          )}

          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100">
            {filteredOffices.map((office) => {
              const isSelected = office.id === activeOffice.id;
              const officeDels = deliveries.filter((d) => d.officeId === office.id);
              const pendingCount = officeDels.filter((d) => d.confirmationStatus !== 'confirmed').length;
              const confirmedCount = officeDels.filter((d) => d.confirmationStatus === 'confirmed').length;

              return (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => {
                    setSelectedOfficeId(office.id);
                    setIsDispatchFormOpen(false);
                    setIsEditingOffice(false);
                  }}
                  className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{office.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold shrink-0">
                        {office.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {office.contactPerson || office.zone}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {pendingCount > 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>{pendingCount} QR scan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{confirmedCount} confirmed</span>
                      </span>
                    )}
                    <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                      {officeDels.length} dispatches
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Dedicated Office Area & Delivery QR Hub */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Office Profile Card (with Inline Editing) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all">
            {isEditingOffice ? (
              /* IN-PLACE OFFICE EDIT FORM */
              <form onSubmit={handleSaveOfficeEdit} className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Edit Tourism Office Details</h2>
                      <p className="text-[11px] text-slate-500">
                        Update official contact information, code, zone, or address for {activeOffice.name}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingOffice(false)}
                      className="px-2.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Office Name *</label>
                    <input
                      type="text"
                      required
                      value={officeFormData.name || ''}
                      onChange={(e) => setOfficeFormData({ ...officeFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Code</label>
                      <input
                        type="text"
                        value={officeFormData.code || ''}
                        onChange={(e) =>
                          setOfficeFormData({ ...officeFormData, code: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Zone / Region</label>
                      <input
                        type="text"
                        value={officeFormData.zone || ''}
                        onChange={(e) => setOfficeFormData({ ...officeFormData, zone: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person / Staff</label>
                    <input
                      type="text"
                      value={officeFormData.contactPerson || ''}
                      onChange={(e) => setOfficeFormData({ ...officeFormData, contactPerson: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g. Maria Santos / Posto de Turismo"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={officeFormData.email || ''}
                      onChange={(e) => setOfficeFormData({ ...officeFormData, email: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={officeFormData.phone || ''}
                      onChange={(e) => setOfficeFormData({ ...officeFormData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Footfall Tier</label>
                    <select
                      value={officeFormData.footfallTier || 'Medium'}
                      onChange={(e) =>
                        setOfficeFormData({
                          ...officeFormData,
                          footfallTier: e.target.value as 'Low' | 'Medium' | 'High' | 'Ultra-High',
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="Low">Low (Tranquilo)</option>
                      <option value="Medium">Medium (Regular)</option>
                      <option value="High">High (Elevado)</option>
                      <option value="Ultra-High">Ultra-High (Intenso)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={officeFormData.address || ''}
                      onChange={(e) => setOfficeFormData({ ...officeFormData, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </form>
            ) : (
              /* ACTIVE OFFICE DISPLAY CARD */
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {activeOffice.code}
                      </span>
                      <h2 className="text-xl font-black text-slate-900">{activeOffice.name}</h2>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {activeOffice.zone}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong className="text-slate-700">Staff / Reception:</strong>{' '}
                          {activeOffice.contactPerson || 'Posto de Turismo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate" title={activeOffice.email}>
                          {activeOffice.email}
                        </span>
                      </div>
                      {activeOffice.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{activeOffice.phone}</span>
                        </div>
                      )}
                      {activeOffice.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{activeOffice.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Direct Edit Office Button */}
                    <button
                      type="button"
                      onClick={handleStartEditOffice}
                      className="px-2.5 py-1.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Edit office details (name, code, contacts, address)"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Office</span>
                    </button>

                    {/* Permanent Office QR Code Plaque & Scanner */}
                    <button
                      type="button"
                      onClick={() => onOpenScanner(activeOffice)}
                      className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-md border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="View the permanent QR code for this Tourism Office"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Permanent QR</span>
                    </button>

                    {/* Delete Office Button */}
                    {onDeleteOffice && offices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteOfficeClick(activeOffice.id, activeOffice.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 text-xs cursor-pointer transition-colors"
                        title="Remove office from network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Deliver Flyers / Generate QR */}
                    <button
                      type="button"
                      onClick={() => setIsDispatchFormOpen(!isDispatchFormOpen)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDispatchFormOpen ? 'Cancel Delivery' : 'Deliver Flyers (Generate QR)'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick KPI stats row for this office */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Flyers Sent</span>
                    <span className="text-base font-black text-slate-900">
                      {totalFlyersReceivedByOffice.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/60">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Confirmed QR Receipts</span>
                    <span className="text-base font-black text-emerald-800">{confirmedDeliveries.length}</span>
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">Awaiting Office Scan</span>
                    <span className="text-base font-black text-amber-800">{pendingDeliveries.length}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Dispatches</span>
                    <span className="text-base font-black text-slate-900">{officeDeliveries.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DISPATCH NEW DELIVERY FORM (INLINE AREA) */}
          {isDispatchFormOpen && (
            <form
              onSubmit={handleCreateOfficeDelivery}
              className="bg-emerald-50/60 border-2 border-emerald-300 rounded-xl p-5 space-y-4 shadow-sm animate-in fade-in duration-150 text-xs"
            >
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Dispatch New Delivery to {activeOffice.name} &bull; Auto-Generate QR Code Receipt</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDispatchFormOpen(false)}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-800 mb-1">Flyer Publication Material *</label>
                  <select
                    value={dispatchFlyerId}
                    onChange={(e) => setDispatchFlyerId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    {flyers.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.sku} &bull; {fl.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-800">
                      Amount of Flyers to Distribute (Qty) *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      1 a 1.000.000 un. (Gratuito &bull; Sem Custos)
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      step={1}
                      value={dispatchQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDispatchQty(Math.max(1, Math.min(1000000, val)));
                      }}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-black text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <div className="flex flex-wrap gap-1">
                      {[500, 1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setDispatchQty(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            dispatchQty === preset
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Courier / Driver</label>
                  <input
                    type="text"
                    value={dispatchCourier}
                    onChange={(e) => setDispatchCourier(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Logistics team"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-800 mb-1">Notes / Special Instructions</label>
                  <input
                    type="text"
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Leave directly at reception counter"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Generating this delivery creates an official QR code and updates the inventory log.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDispatchFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Create Delivery &amp; Generate QR</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* DELIVERIES ARCHIVE & QR STATUS TABLE (EDITABLE QR HUB) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Deliveries &amp; QR Receipts for {activeOffice.name} ({filteredDeliveries.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All delivery dispatches and QR verification records are editable. Click &quot;Edit&quot; on any row
                  to adjust quantities, dates, or status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    All ({officeDeliveries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-white text-amber-900 font-bold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Pending QR ({pendingDeliveries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('confirmed')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === 'confirmed'
                        ? 'bg-white text-emerald-900 font-bold shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Confirmed ({confirmedDeliveries.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenScanner(activeOffice)}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Open Office QR Scanner"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Delivery Ref &amp; Date</th>
                    <th className="py-3 px-4">Flyer Material</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Courier / Driver</th>
                    <th className="py-3 px-4">QR Confirmation Status</th>
                    <th className="py-3 px-4 text-right">Actions &amp; Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No deliveries recorded for this office under the &quot;{statusFilter}&quot; filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((del) => {
                      const fl = flyers.find((f) => f.id === del.flyerTypeId);
                      const isConfirmed = del.confirmationStatus === 'confirmed';

                      return (
                        <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{del.deliveryRef}</span>
                            </div>
                            <span className="text-slate-500 text-[11px] block flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {del.date}
                            </span>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900">{fl?.name}</div>
                            <div className="text-slate-400 text-[10px] font-mono">
                              {fl?.sku} &bull; {fl?.language}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-sm text-slate-900">
                              {del.quantityDelivered.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">unid.</span>
                          </td>

                          <td className="py-3 px-4 text-slate-700">
                            <span className="font-medium">{del.courier}</span>
                            {del.notes && (
                              <span className="block text-[10px] text-slate-400 truncate max-w-xs italic mt-0.5">
                                {del.notes}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isConfirmed ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Confirmed via QR</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  by {del.confirmedBy || activeOffice.contactPerson} on{' '}
                                  {del.confirmedAt || del.date}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Pending Office Scan</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onConfirmDelivery(
                                      del.id,
                                      activeOffice.contactPerson || `${activeOffice.name} Reception`
                                    )
                                  }
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold underline block mt-0.5 cursor-pointer"
                                >
                                  Click to Quick Confirm
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Delivery Button */}
                              {onUpdateDelivery && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDelivery(del)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                                  title="Edit delivery quantity, date, courier, or details"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {/* Simplified Voucher Archive & Permanent QR Button */}
                              <button
                                type="button"
                                onClick={() => fl && onOpenPrintSlip(del, activeOffice, fl)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
                                title="View & Print simplified delivery archive voucher with permanent Office QR"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Voucher &amp; QR</span>
                              </button>

                              {/* Delete Delivery Button */}
                              {onDeleteDelivery && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeliveryClick(del.id, del.deliveryRef)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 cursor-pointer transition-colors"
                                  title="Delete delivery record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED EDIT DELIVERY & QR DETAILS MODAL */}
      {editingDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Delivery Record &bull; {editingDelivery.deliveryRef}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update delivery quantity, date, courier, material, or QR verification status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDelivery(null)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Reference Code</label>
                  <input
                    type="text"
                    value={delEditRef}
                    onChange={(e) => setDelEditRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dispatch Date *</label>
                  <input
                    type="date"
                    value={delEditDate}
                    onChange={(e) => setDelEditDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Destination Tourism Office *</label>
                  <select
                    value={delEditOfficeId}
                    onChange={(e) => setDelEditOfficeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code} &bull; {o.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Flyer Publication Material *</label>
                  <select
                    value={delEditFlyerId}
                    onChange={(e) => setDelEditFlyerId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-semibold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    {flyers.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.sku} &bull; {fl.language})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Delivered Quantity (Qty) *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      1 a 1.000.000 un. (Material Gratuito)
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      step={1}
                      value={delEditQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDelEditQty(Math.max(1, Math.min(1000000, val)));
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-black text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <div className="flex flex-wrap gap-1">
                      {[500, 1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setDelEditQty(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            delEditQty === preset
                              ? 'bg-blue-700 text-white border-blue-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Courier / Driver</label>
                  <input
                    type="text"
                    value={delEditCourier}
                    onChange={(e) => setDelEditCourier(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">QR Confirmation Status</label>
                  <select
                    value={delEditStatus}
                    onChange={(e) => setDelEditStatus(e.target.value as 'pending' | 'confirmed')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending QR Scan (Pendente)</option>
                    <option value="confirmed">Confirmed via QR (Confirmado)</option>
                  </select>
                </div>

                {delEditStatus === 'confirmed' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirmed By (Receiving Staff)
                    </label>
                    <input
                      type="text"
                      value={delEditConfirmedBy}
                      onChange={(e) => setDelEditConfirmedBy(e.target.value)}
                      placeholder="e.g. Maria Santos / Posto de Turismo"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Notes / Special Instructions</label>
                  <input
                    type="text"
                    value={delEditNotes}
                    onChange={(e) => setDelEditNotes(e.target.value)}
                    placeholder="e.g. Delivered directly to storage room"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDelivery(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Delivery Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
