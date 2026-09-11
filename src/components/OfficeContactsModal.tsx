import React, { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Search,
  Edit2,
  Check,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { TourismOffice } from '../types';
import { AHPCasteloIcon } from './AHPLogo';

interface OfficeContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offices: TourismOffice[];
  onUpdateOffice: (officeId: string, updatedData: Partial<TourismOffice>) => void;
  onAddOffice?: (newOffice: Omit<TourismOffice, 'id'>) => void;
  onDeleteOffice?: (officeId: string) => void;
  onComposeEmail?: (officeId: string) => void;
}

export const OfficeContactsModal: React.FC<OfficeContactsModalProps> = ({
  isOpen,
  onClose,
  offices,
  onUpdateOffice,
  onAddOffice,
  onDeleteOffice,
  onComposeEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<TourismOffice>>({});

  // New office form state
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

  if (!isOpen) return null;

  const filteredOffices = offices.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.contactPerson.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q) ||
      o.zone.toLowerCase().includes(q)
    );
  });

  const handleStartEdit = (office: TourismOffice) => {
    setEditingOfficeId(office.id);
    setFormData({
      name: office.name,
      code: office.code,
      zone: office.zone,
      footfallTier: office.footfallTier,
      contactPerson: office.contactPerson,
      email: office.email,
      phone: office.phone,
      address: office.address,
    });
    setIsAddingNew(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficeId) return;

    onUpdateOffice(editingOfficeId, formData);
    setEditingOfficeId(null);
  };

  const handleCreateOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficeData.name.trim() || !newOfficeData.email.trim()) return;

    if (onAddOffice) {
      onAddOffice({
        ...newOfficeData,
        code: newOfficeData.code.trim() || `AHP-${newOfficeData.name.slice(0, 4).toUpperCase()}`,
      });
    }

    setIsAddingNew(false);
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
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center p-2 text-white shadow-xs">
              <AHPCasteloIcon className="w-full h-full text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Tourism Offices &bull; Contact Directory</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  12 Destinations
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Verified contacts, delivery slip emails, phone numbers, and official addresses across the AHP network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by office name, village, email, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-200/80 rounded-md">
              {offices.length} Tourism Offices Registered
            </span>

            {onAddOffice && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(!isAddingNew);
                  setEditingOfficeId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNew ? 'Cancel Add' : 'Add Office'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Scrollable list or Edit forms */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* ADD NEW OFFICE FORM */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateOffice}
              className="p-5 bg-blue-50/60 border-2 border-blue-200 rounded-xl space-y-4 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Register New Tourism Office Destination</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Office Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Belmonte, Sortelha"
                    value={newOfficeData.name}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Office Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AHP-BELM"
                    value={newOfficeData.code}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Verified Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. turismo@aldeiasdeportugal.pt"
                    value={newOfficeData.email}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person / Desk</label>
                  <input
                    type="text"
                    placeholder="e.g. Posto de Turismo, Maria Silva"
                    value={newOfficeData.contactPerson}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, contactPerson: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +351 275 911 488"
                    value={newOfficeData.phone}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zone / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Serra da Estrela, Cova da Beira"
                    value={newOfficeData.zone}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, zone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Physical Delivery Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Castelo de Belmonte, Largo do Castelo, 6250-048 Belmonte"
                    value={newOfficeData.address}
                    onChange={(e) => setNewOfficeData({ ...newOfficeData, address: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save New Office
                </button>
              </div>
            </form>
          )}

          {/* EDIT ACTIVE OFFICE FORM (INLINE) */}
          {editingOfficeId && (
            <form
              onSubmit={handleSaveEdit}
              className="p-5 bg-amber-50/70 border-2 border-amber-300 rounded-xl space-y-4 shadow-sm animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <Edit2 className="w-4 h-4 text-amber-600" />
                  <span>Update Contacts for: {formData.name} ({formData.code})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOfficeId(null)}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Close Editor &times;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Office Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Contact Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" />
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. posto.turismo@municipio.pt"
                      className="w-full pl-8 pr-2.5 py-1.5 border-2 border-amber-400 rounded bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium">
                    This email receives the dispatch notices and deliveries confirmation.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Contact Person / Desk
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Zone / Region
                  </label>
                  <input
                    type="text"
                    value={formData.zone || ''}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Footfall Tier
                  </label>
                  <select
                    value={formData.footfallTier || 'Medium'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        footfallTier: e.target.value as 'High' | 'Medium' | 'Seasonal Peak',
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Seasonal Peak">Seasonal Peak</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Physical Delivery Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setEditingOfficeId(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          )}

          {/* OFFICES LIST CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredOffices.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No tourism offices found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredOffices.map((office) => {
                const isCurrentlyEditing = editingOfficeId === office.id;
                const isCopied = copiedEmailId === office.id;

                return (
                  <div
                    key={office.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isCurrentlyEditing
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{office.name}</h4>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                            {office.code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                            {office.zone}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{office.contactPerson || 'Posto de Turismo'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(office)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit email address and contacts"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Edit Contact</span>
                        </button>

                        {onComposeEmail && (
                          <button
                            type="button"
                            onClick={() => {
                              onComposeEmail(office.id);
                              onClose();
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Compose delivery notice email to this office"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email address prominent section */}
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-mono text-xs font-semibold text-slate-800 truncate" title={office.email}>
                          {office.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(office.email, office.id)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded cursor-pointer"
                          title="Copy email address"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`mailto:${office.email}`}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded cursor-pointer"
                          title="Direct mail link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Additional Details: Phone & Address */}
                    <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                      {office.phone && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{office.phone}</span>
                        </div>
                      )}

                      {office.address && (
                        <div className="flex items-start gap-2 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{office.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Changes to email addresses are saved immediately across all delivery forms and notice generators.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
