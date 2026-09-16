import React, { useState, useMemo } from 'react';
import {
  Share2,
  Calendar,
  User,
  Plus,
  Filter,
  Search,
  Building,
  Footprints,
  Sparkles,
  GraduationCap,
  Award,
  HelpCircle,
  TrendingUp,
  Tag,
  Edit2,
  Trash2,
  Check,
  Zap,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { FlyerType, OtherDeliveryRecord, OtherDeliveryCategory } from '../types';
import { TODAY_STR } from '../utils/calculations';

interface OtherDeliveriesViewProps {
  records: OtherDeliveryRecord[];
  flyers: FlyerType[];
  onAddRecord: (record: Omit<OtherDeliveryRecord, 'id'>) => void;
  onUpdateRecord?: (id: string, patch: Partial<OtherDeliveryRecord>) => void;
  onDeleteRecord?: (id: string) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; badge: string }
> = {
  guided_tour: {
    label: 'Guided Tours & Itineraries',
    icon: <Footprints className="w-3.5 h-3.5" />,
    color: 'emerald',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  historical_village_office: {
    label: 'Historical Village Reception Desk (Walk-in Visitors)',
    icon: <Building className="w-3.5 h-3.5" />,
    color: 'amber',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  event: {
    label: 'Cultural Events & Medieval Festivals',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'rose',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  school_educational: {
    label: 'Schools & Educational Visits',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    color: 'blue',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  protocol_vip: {
    label: 'VIP Delegations & Press Trips',
    icon: <Award className="w-3.5 h-3.5" />,
    color: 'purple',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  other: {
    label: 'Other Ad-hoc Dispatches',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: 'slate',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export const getCategoryMeta = (cat: string) => {
  if (CATEGORY_CONFIG[cat]) {
    return CATEGORY_CONFIG[cat];
  }
  const matched = Object.values(CATEGORY_CONFIG).find(
    (c) => c.label.toLowerCase() === (cat || '').toLowerCase()
  );
  if (matched) return matched;

  return {
    label: cat || 'Custom Delivery',
    icon: <Tag className="w-3.5 h-3.5" />,
    color: 'teal',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
  };
};

export const OtherDeliveriesView: React.FC<OtherDeliveriesViewProps> = ({
  records,
  flyers,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInlineEditMode, setIsInlineEditMode] = useState<boolean>(true);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteModalConfirm, setDeleteModalConfirm] = useState(false);

  // Form State
  const [ref, setRef] = useState('');
  const [category, setCategory] = useState<string>('historical_village_office');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(TODAY_STR);
  const [flyerTypeId, setFlyerTypeId] = useState(flyers[0]?.id || '');
  const [quantity, setQuantity] = useState(250);
  const [deliveredBy, setDeliveredBy] = useState('Miguel Silva (Heritage Office)');
  const [recipientOrGroup, setRecipientOrGroup] = useState(
    'Historical Village Central Desk (Direct Walk-in Visitors)'
  );
  const [notes, setNotes] = useState('');

  const handleOpenAddRecord = () => {
    setEditingRecordId(null);
    setRef(`OD-2026-${(records.length + 1).toString().padStart(3, '0')}`);
    setCategory('historical_village_office');
    setIsCustomCategory(false);
    setDeleteModalConfirm(false);
    setTitle('');
    setDate(TODAY_STR);
    setFlyerTypeId(flyers[0]?.id || '');
    setQuantity(250);
    setDeliveredBy('Miguel Silva (Heritage Office)');
    setRecipientOrGroup('Historical Village Central Desk (Direct Walk-in Visitors)');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditRecord = (record: OtherDeliveryRecord) => {
    setEditingRecordId(record.id);
    setRef(record.ref || '');
    setCategory(record.category);
    setIsCustomCategory(!CATEGORY_CONFIG[record.category]);
    setDeleteModalConfirm(false);
    setTitle(record.title);
    setDate(record.date);
    setFlyerTypeId(record.flyerTypeId);
    setQuantity(record.quantity);
    setDeliveredBy(record.deliveredBy);
    setRecipientOrGroup(record.recipientOrGroup);
    setNotes(record.notes || '');
    setIsModalOpen(true);
  };

  // Direct quick add row
  const handleQuickAddRow = () => {
    const padNum = (records.length + 1).toString().padStart(3, '0');
    const newRef = `OD-2026-${padNum}`;
    onAddRecord({
      ref: newRef,
      date: TODAY_STR,
      category: 'historical_village_office',
      title: 'Historical Village Reception Desk (Walk-ins)',
      flyerTypeId: flyers[0]?.id || 'flyer-1',
      quantity: 300,
      deliveredBy: 'Miguel Silva (Heritage Office)',
      recipientOrGroup: 'Direct Walk-in Visitors',
      notes: 'Quick logged delivery',
    });
  };

  // Total metrics
  const totalFlyersDistributed = records.reduce((sum, r) => sum + r.quantity, 0);
  const totalDispatches = records.length;

  // Breakdown by category (standard + all user-entered custom categories)
  const allCategories = Array.from(
    new Set([...Object.keys(CATEGORY_CONFIG), ...records.map((r) => r.category).filter(Boolean)])
  );

  const categoryStats = allCategories.map((cat) => {
    const catRecords = records.filter((r) => r.category === cat);
    const count = catRecords.length;
    const qty = catRecords.reduce((sum, r) => sum + r.quantity, 0);
    return {
      category: cat,
      config: getCategoryMeta(cat),
      count,
      qty,
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedQuantity = Math.min(
      100000,
      Math.max(1, parseInt(String(quantity).replace(/[.,]/g, ''), 10) || 1)
    );
    if (!title || sanitizedQuantity <= 0) return;

    if (editingRecordId && onUpdateRecord) {
      onUpdateRecord(editingRecordId, {
        ref: ref || `OD-2026-${Date.now().toString().slice(-4)}`,
        date,
        category,
        title,
        flyerTypeId,
        quantity: sanitizedQuantity,
        deliveredBy,
        recipientOrGroup,
        notes,
      });
    } else {
      const finalRef =
        ref ||
        `OD-2026-${(records.length + 1).toString().padStart(3, '0')}`;

      onAddRecord({
        ref: finalRef,
        date,
        category,
        title,
        flyerTypeId,
        quantity: sanitizedQuantity,
        deliveredBy,
        recipientOrGroup,
        notes,
      });
    }

    setIsModalOpen(false);
    setEditingRecordId(null);
    setTitle('');
    setNotes('');
  };

  const filteredRecords = records
    .filter((r) => categoryFilter === 'all' || r.category === categoryFilter)
    .filter(
      (r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.recipientOrGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deliveredBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.ref && r.ref.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const knownStaffMembers = useMemo(() => {
    const defaults = ['Miguel Silva', 'Inês Valente', 'Sofia Costa', 'Carlos Pereira', 'Ana Ramos', 'Tiago Mendes'];
    const fromRecords = records.map((r) => r.deliveredBy).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromRecords]));
  }, [records]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Non-Circuit &amp; Special Deliveries
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800">
              Guided Tours &bull; Walk-ins &bull; Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track and edit deliveries outside the standard tourism office circuit: direct walk-in visitors at
            the historical village reception, guided tour groups, cultural events, festivals, and schools.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsInlineEditMode(!isInlineEditMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              isInlineEditMode
                ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-300'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{isInlineEditMode ? 'Exit Direct Cell Edit' : 'Quick In-Cell Editing'}</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            title="Quickly add a new delivery row"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Quick Row</span>
          </button>

          <button
            onClick={handleOpenAddRecord}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Delivery</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Dispatches Logged
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">{totalDispatches}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Outside standard circuit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Non-Circuit Flyers
          </span>
          <div className="mt-1 text-2xl font-black text-teal-700">
            {totalFlyersDistributed.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            Direct public &amp; event consumption
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Historical Village Desk
          </span>
          <div className="mt-1 text-2xl font-black text-amber-700">
            {records
              .filter((r) => r.category === 'historical_village_office')
              .reduce((s, r) => s + r.quantity, 0)
              .toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Handed to direct walk-ins</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Guided Tours &amp; Festivals
          </span>
          <div className="mt-1 text-2xl font-black text-rose-700">
            {records
              .filter((r) => r.category === 'guided_tour' || r.category === 'event')
              .reduce((s, r) => s + r.quantity, 0)
              .toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Itineraries &amp; medieval fairs</span>
        </div>
      </div>

      {/* Category Pills Breakdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-teal-600" />
          <span>Distribution Channels Outside Standard Circuit</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoryStats.map((stat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setCategoryFilter(categoryFilter === stat.category ? 'all' : stat.category)
              }
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                categoryFilter === stat.category
                  ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-1.5 text-slate-700 text-[11px] font-semibold">
                {stat.config.icon}
                <span className="truncate">{stat.config.label.split('(')[0]}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-black text-slate-900">
                  {stat.qty.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {stat.count} log{stat.count === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Table of Non-Circuit Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Delivery Logs ({filteredRecords.length})
            </h2>
            {categoryFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
                Filter: {getCategoryMeta(categoryFilter)?.label.split('(')[0]}
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="hover:text-teal-950 font-bold ml-1 cursor-pointer"
                >
                  &times;
                </button>
              </span>
            )}
            {isInlineEditMode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                ⚡ In-Cell Editing Active: Edit inputs directly!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event, guide, recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-black font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 w-56 sm:w-64"
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date &amp; Ref</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Activity / Recipient</th>
                <th className="py-3 px-4">Flyer Material</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Delivered By</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Edit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No non-circuit deliveries match your filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const fl = flyers.find((f) => f.id === rec.flyerTypeId);
                  const catCfg = getCategoryMeta(rec.category);

                  return (
                    <tr
                      key={rec.id}
                      onDoubleClick={() => handleOpenEditRecord(rec)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      title="Double click to edit delivery record"
                    >
                      {/* Date & Ref */}
                      <td className="py-3 px-4">
                        {isInlineEditMode && onUpdateRecord ? (
                          <div className="space-y-1.5">
                            <input
                              type="date"
                              value={rec.date}
                              onChange={(e) => onUpdateRecord(rec.id, { date: e.target.value })}
                              className="border-2 border-slate-300 rounded px-2 py-1 text-xs bg-white text-black font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-500 block shadow-2xs"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            />
                            <input
                              type="text"
                              value={rec.ref}
                              onChange={(e) => onUpdateRecord(rec.id, { ref: e.target.value })}
                              className="border-2 border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold bg-white text-black w-28 block shadow-2xs"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {rec.date}
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block">{rec.ref}</span>
                          </>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {isInlineEditMode && onUpdateRecord ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={rec.category}
                              onChange={(e) =>
                                onUpdateRecord(rec.id, { category: e.target.value })
                              }
                              list="category-suggestions-list"
                              placeholder="Category..."
                              className="border-2 border-teal-400 rounded px-2 py-1 text-xs bg-white text-black font-bold focus:ring-1 focus:ring-teal-500 w-40 shadow-2xs"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                              title="Editable delivery category. Type custom category or pick from suggestions."
                            />
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catCfg.badge}`}
                          >
                            {catCfg.icon}
                            <span>{catCfg.label.split('(')[0]}</span>
                          </span>
                        )}
                      </td>

                      {/* Activity / Recipient */}
                      <td className="py-3 px-4 min-w-[200px]">
                        {isInlineEditMode && onUpdateRecord ? (
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                                Activity / Description
                              </span>
                              <input
                                type="text"
                                value={rec.title}
                                onChange={(e) => onUpdateRecord(rec.id, { title: e.target.value })}
                                placeholder="Activity title..."
                                className="border-2 border-slate-300 rounded px-2 py-1 text-xs bg-white text-black font-bold w-full shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">
                                Target Recipient / Group
                              </span>
                              <input
                                type="text"
                                value={rec.recipientOrGroup}
                                onChange={(e) =>
                                  onUpdateRecord(rec.id, { recipientOrGroup: e.target.value })
                                }
                                placeholder="Target recipient or group..."
                                className="border-2 border-slate-300 rounded px-2 py-1 text-xs bg-white text-black font-bold w-full shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block leading-tight">
                              {rec.title}
                            </span>
                            <span className="text-slate-600 text-xs block font-medium">
                              Recipient: <strong className="text-black">{rec.recipientOrGroup}</strong>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Flyer Material */}
                      <td className="py-3 px-4 min-w-[220px]">
                        {isInlineEditMode && onUpdateRecord ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: fl?.color || '#059669' }}
                              title={`Color: ${fl?.color}`}
                            />
                            <select
                              value={rec.flyerTypeId}
                              onChange={(e) => onUpdateRecord(rec.id, { flyerTypeId: e.target.value })}
                              className="w-full border-2 border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-black font-bold shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            >
                              {flyers.map((flItem) => (
                                <option
                                  key={flItem.id}
                                  value={flItem.id}
                                  className="text-black font-bold bg-white py-1"
                                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                >
                                  {flItem.sku} — {flItem.name} ({flItem.language})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: fl?.color || '#059669' }}
                              title={`Flyer brand color: ${fl?.color}`}
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{fl?.name}</span>
                              <span className="text-slate-500 text-[11px] block font-mono font-medium">
                                {fl?.sku} &bull; {fl?.language}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-right">
                        {isInlineEditMode && onUpdateRecord ? (
                          <input
                            type="number"
                            min={1}
                            max={100000}
                            step={1}
                            value={rec.quantity}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[.,]/g, '');
                              const parsed = parseInt(clean, 10);
                              onUpdateRecord(rec.id, {
                                quantity: isNaN(parsed)
                                  ? 1
                                  : Math.min(100000, Math.max(1, parsed)),
                              });
                            }}
                            className="border-2 border-slate-300 rounded px-2 py-1 text-xs text-right font-black text-black w-24 bg-white shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          />
                        ) : (
                          <>
                            <span className="text-sm font-black text-teal-800">
                              {rec.quantity}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">units</span>
                          </>
                        )}
                      </td>

                      {/* Delivered By */}
                      <td className="py-3 px-4 min-w-[170px]">
                        {isInlineEditMode && onUpdateRecord ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              list="staff-options-datalist"
                              value={rec.deliveredBy}
                              onChange={(e) => onUpdateRecord(rec.id, { deliveredBy: e.target.value })}
                              placeholder="Select or type staff..."
                              className="border-2 border-slate-300 rounded px-2 py-1 text-xs bg-white text-black font-bold w-full shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            />
                            <select
                              value={rec.deliveredBy}
                              onChange={(e) => onUpdateRecord(rec.id, { deliveredBy: e.target.value })}
                              className="w-full text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-black font-semibold"
                              style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            >
                              <option value="" disabled>Staff Options</option>
                              {knownStaffMembers.map((sm) => (
                                <option key={sm} value={sm} className="text-black bg-white font-bold" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                                  {sm}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{rec.deliveredBy}</span>
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px] truncate">
                        {isInlineEditMode && onUpdateRecord ? (
                          <input
                            type="text"
                            value={rec.notes || ''}
                            onChange={(e) => onUpdateRecord(rec.id, { notes: e.target.value })}
                            placeholder="Add notes..."
                            className="border-2 border-slate-300 rounded px-2 py-1 text-xs bg-white text-black font-semibold w-full shadow-2xs focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          />
                        ) : (
                          rec.notes || '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditRecord(rec)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            title="Edit delivery details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>Edit</span>
                          </button>

                          {onDeleteRecord && (
                            deleteConfirmId === rec.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 animate-in fade-in">
                                <span className="text-[10px] font-bold text-red-700">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteRecord(rec.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer shadow-2xs"
                                  title="Confirm delete"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                  title="Cancel"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(rec.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete delivery record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
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

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-teal-700 text-white">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingRecordId ? 'Edit Non-Circuit Delivery Record' : 'Log Delivery Outside Normal Circuit'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-md cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reference Code
                  </label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="e.g. OD-2026-001"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-black font-bold font-mono focus:ring-1 focus:ring-teal-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 text-xs">
                    Delivery Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
                  >
                    {isCustomCategory ? '← Choose from Preset List' : '✏️ Edit / Custom Category'}
                  </button>
                </div>
                {isCustomCategory ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Type custom category name (e.g. Tourism Fair, Festival, Guided Excursion)..."
                      className="w-full border-2 border-teal-600 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-medium">Quick presets:</span>
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategory(cfg.label)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          {cfg.label.split('(')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        setCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  >
                    {Object.keys(CATEGORY_CONFIG).map((cat) => (
                      <option key={cat} value={cat} className="text-black bg-white font-bold" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                    {records
                      .map((r) => r.category)
                      .filter((c, i, a) => c && !CATEGORY_CONFIG[c] && a.indexOf(c) === i)
                      .map((customCat) => (
                        <option key={customCat} value={customCat} className="text-black bg-white font-bold" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                          Custom: {customCat}
                        </option>
                      ))}
                    <option value="__custom__" className="text-purple-700 bg-white font-bold" style={{ color: '#6b21a8', backgroundColor: '#ffffff' }}>✨ + Enter Custom Category...</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Activity / Description Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Historical Village Central Reception (Walk-ins), Guided Tour #4"
                  className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Flyer Publication *
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                      style={{
                        backgroundColor:
                          flyers.find((f) => f.id === flyerTypeId)?.color || '#059669',
                      }}
                      title="Flyer theme color"
                    />
                    <select
                      value={flyerTypeId}
                      onChange={(e) => setFlyerTypeId(e.target.value)}
                      className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    >
                      {flyers.map((fl) => (
                        <option key={fl.id} value={fl.id} className="text-black font-bold bg-white" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                          {fl.sku} — {fl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantity Delivered *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100000}
                    step={1}
                    value={quantity === 0 ? '' : quantity}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[.,]/g, '');
                      if (raw === '') {
                        setQuantity(0);
                        return;
                      }
                      const num = parseInt(raw, 10);
                      if (!isNaN(num)) {
                        setQuantity(Math.min(100000, Math.max(1, num)));
                      }
                    }}
                    onBlur={() => {
                      if (!quantity || quantity < 1) {
                        setQuantity(1);
                      } else if (quantity > 100000) {
                        setQuantity(100000);
                      }
                    }}
                    placeholder="Enter 1 to 100000"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-black focus:ring-1 focus:ring-teal-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                  <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                    Allowed: 1 to 100000 (integers only, no period)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Delivered By *
                  </label>
                  <input
                    type="text"
                    required
                    list="staff-options-datalist"
                    value={deliveredBy}
                    onChange={(e) => setDeliveredBy(e.target.value)}
                    placeholder="e.g. Miguel Silva, Inês Valente"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-500 font-bold self-center">Options:</span>
                    {knownStaffMembers.map((sm) => (
                      <button
                        key={sm}
                        type="button"
                        onClick={() => setDeliveredBy(sm)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          deliveredBy === sm
                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                            : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 font-medium'
                        }`}
                      >
                        {sm}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Recipient Group / Contact
                  </label>
                  <input
                    type="text"
                    value={recipientOrGroup}
                    onChange={(e) => setRecipientOrGroup(e.target.value)}
                    placeholder="e.g. Village Front Desk, Senior Tour Group"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-teal-500"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Itinerary, language requirement, event schedule..."
                  className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-black font-medium focus:ring-1 focus:ring-teal-500"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                {editingRecordId && onDeleteRecord ? (
                  deleteModalConfirm ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-2.5 py-1">
                      <span className="text-xs text-red-800 font-bold">Delete this record?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteRecord(editingRecordId);
                          setIsModalOpen(false);
                          setDeleteModalConfirm(false);
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteModalConfirm(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteModalConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-semibold text-xs cursor-pointer transition-colors"
                      title="Delete this delivery log"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete Log</span>
                    </button>
                  )
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setDeleteModalConfirm(false);
                    }}
                    className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingRecordId ? 'Save Delivery Changes' : 'Save Non-Circuit Delivery'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Category suggestions datalist */}
      <datalist id="category-suggestions-list">
        {Object.values(CATEGORY_CONFIG).map((c, i) => (
          <option key={i} value={c.label} />
        ))}
        {records
          .map((r) => r.category)
          .filter((c, i, a) => c && !CATEGORY_CONFIG[c] && a.indexOf(c) === i)
          .map((customCat) => (
            <option key={customCat} value={customCat} />
          ))}
      </datalist>

      {/* Global Staff options datalist */}
      <datalist id="staff-options-datalist">
        {knownStaffMembers.map((sm, i) => (
          <option key={i} value={sm} />
        ))}
      </datalist>
    </div>
  );
};
