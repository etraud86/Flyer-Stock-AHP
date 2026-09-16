import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Users,
  Plus,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  TrendingUp,
  Edit2,
} from 'lucide-react';
import { FlyerType, TourismFair, FairFlyerSpend } from '../types';
import { TODAY_STR } from '../utils/calculations';

interface TourismFairsViewProps {
  fairs: TourismFair[];
  flyers: FlyerType[];
  onAddFair: (newFair: Omit<TourismFair, 'id'>) => void;
  onUpdateFair?: (id: string, updatedFair: Partial<TourismFair>) => void;
  onDeleteFair?: (id: string) => void;
}

export const TourismFairsView: React.FC<TourismFairsViewProps> = ({
  fairs,
  flyers,
  onAddFair,
  onUpdateFair,
  onDeleteFair,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFairId, setEditingFairId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDemandEditMode, setIsDemandEditMode] = useState(true);
  const [expandedFlyerDetailId, setExpandedFlyerDetailId] = useState<string | null>(null);
  const [isFairsTableInlineEdit, setIsFairsTableInlineEdit] = useState(true);

  // Fair Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Portugal');
  const [startDate, setStartDate] = useState(TODAY_STR);
  const [endDate, setEndDate] = useState(TODAY_STR);
  const [standNumber, setStandNumber] = useState('');
  const [attendingStaff, setAttendingStaff] = useState('');
  const [notes, setNotes] = useState('');
  const [fairItems, setFairItems] = useState<
    { flyerTypeId: string; quantityTaken: number; quantityReturned: number }[]
  >([
    { flyerTypeId: flyers[0]?.id || '', quantityTaken: 2000, quantityReturned: 150 },
    { flyerTypeId: flyers[1]?.id || '', quantityTaken: 1500, quantityReturned: 100 },
  ]);

  const handleOpenAddFair = () => {
    setEditingFairId(null);
    setName('');
    setCity('');
    setCountry('Portugal');
    setStartDate(TODAY_STR);
    setEndDate(TODAY_STR);
    setStandNumber('');
    setAttendingStaff('');
    setNotes('');
    setFairItems([
      { flyerTypeId: flyers[0]?.id || '', quantityTaken: 2000, quantityReturned: 150 },
      { flyerTypeId: flyers[1]?.id || '', quantityTaken: 1500, quantityReturned: 100 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditFair = (fair: TourismFair) => {
    setEditingFairId(fair.id);
    setName(fair.name);
    setCity(fair.city);
    setCountry(fair.country);
    setStartDate(fair.startDate);
    setEndDate(fair.endDate);
    setStandNumber(fair.standNumber || '');
    setAttendingStaff(fair.attendingStaff || '');
    setNotes(fair.notes || '');
    setFairItems(
      fair.items.map((it) => ({
        flyerTypeId: it.flyerTypeId,
        quantityTaken: it.quantityTaken,
        quantityReturned: it.quantityReturned,
      }))
    );
    setIsModalOpen(true);
  };

  // Aggregate stats
  const totalFairs = fairs.length;
  const totalTaken = fairs.reduce(
    (acc, f) => acc + f.items.reduce((sum, item) => sum + item.quantityTaken, 0),
    0
  );
  const totalReturned = fairs.reduce(
    (acc, f) => acc + f.items.reduce((sum, item) => sum + item.quantityReturned, 0),
    0
  );
  const totalSpent = fairs.reduce((acc, f) => acc + f.totalFlyersSpent, 0);
  const avgSpentPerFair = totalFairs > 0 ? Math.round(totalSpent / totalFairs) : 0;

  // Breakdown by flyer material across all fairs with rich fair breakdowns
  const flyerSpendMap: Record<
    string,
    {
      id: string;
      name: string;
      sku: string;
      color: string;
      spent: number;
      taken: number;
      returned: number;
      fairBreakdowns: {
        fairId: string;
        fairName: string;
        city: string;
        taken: number;
        returned: number;
        spent: number;
      }[];
    }
  > = {};

  flyers.forEach((fl) => {
    flyerSpendMap[fl.id] = {
      id: fl.id,
      name: fl.name,
      sku: fl.sku,
      color: fl.color,
      spent: 0,
      taken: 0,
      returned: 0,
      fairBreakdowns: [],
    };
  });

  fairs.forEach((fair) => {
    fair.items.forEach((item) => {
      if (flyerSpendMap[item.flyerTypeId]) {
        flyerSpendMap[item.flyerTypeId].spent += item.quantitySpent;
        flyerSpendMap[item.flyerTypeId].taken += item.quantityTaken;
        flyerSpendMap[item.flyerTypeId].returned += item.quantityReturned;
        flyerSpendMap[item.flyerTypeId].fairBreakdowns.push({
          fairId: fair.id,
          fairName: fair.name,
          city: fair.city,
          taken: item.quantityTaken,
          returned: item.quantityReturned,
          spent: item.quantitySpent,
        });
      }
    });
  });

  const sortedFlyerSpend = Object.values(flyerSpendMap).sort((a, b) => b.spent - a.spent);

  // Direct In-Cell Item Update Handler
  const handleQuickUpdateFairItem = (
    fairId: string,
    itemIndex: number,
    field: 'flyerTypeId' | 'quantityTaken' | 'quantityReturned',
    val: any
  ) => {
    if (!onUpdateFair) return;
    const targetFair = fairs.find((f) => f.id === fairId);
    if (!targetFair) return;

    const newItems = targetFair.items.map((it, idx) => {
      if (idx !== itemIndex) return it;
      const updated = { ...it, [field]: val };
      const taken = Number(updated.quantityTaken) || 0;
      const returned = Number(updated.quantityReturned) || 0;
      return {
        ...updated,
        quantityTaken: taken,
        quantityReturned: returned,
        quantitySpent: Math.max(0, taken - returned),
      };
    });

    const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
    onUpdateFair(fairId, { items: newItems, totalFlyersSpent: newTotalSpent });
  };

  // Add Item to a Fair directly
  const handleQuickAddFairItem = (fairId: string) => {
    if (!onUpdateFair) return;
    const targetFair = fairs.find((f) => f.id === fairId);
    if (!targetFair) return;
    const unselected = flyers.find((fl) => !targetFair.items.some((it) => it.flyerTypeId === fl.id));
    const newFlyerId = unselected?.id || flyers[0]?.id || '';
    const newItems = [
      ...targetFair.items,
      {
        flyerTypeId: newFlyerId,
        quantityTaken: 500,
        quantityReturned: 0,
        quantitySpent: 500,
      },
    ];
    const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
    onUpdateFair(fairId, { items: newItems, totalFlyersSpent: newTotalSpent });
  };

  // Remove Item from a Fair directly
  const handleQuickDeleteFairItem = (fairId: string, itemIndex: number) => {
    if (!onUpdateFair) return;
    const targetFair = fairs.find((f) => f.id === fairId);
    if (!targetFair || targetFair.items.length <= 1) return;
    const newItems = targetFair.items.filter((_, idx) => idx !== itemIndex);
    const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
    onUpdateFair(fairId, { items: newItems, totalFlyersSpent: newTotalSpent });
  };

  // Edit flyer demand directly across fairs
  const handleUpdateFlyerDemand = (flyerId: string, newTotalSpent: number) => {
    if (!onUpdateFair) return;
    const targetVal = Math.max(0, newTotalSpent);
    const fairsWithFlyer = fairs.filter((f) => f.items.some((it) => it.flyerTypeId === flyerId));

    if (fairsWithFlyer.length === 0) {
      if (fairs.length > 0) {
        const firstFair = fairs[0];
        const newItems = [
          ...firstFair.items,
          {
            flyerTypeId: flyerId,
            quantityTaken: targetVal,
            quantityReturned: 0,
            quantitySpent: targetVal,
          },
        ];
        const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
        onUpdateFair(firstFair.id, { items: newItems, totalFlyersSpent: newTotalSpent });
      }
      return;
    }

    if (fairsWithFlyer.length === 1) {
      const fair = fairsWithFlyer[0];
      const newItems = fair.items.map((it) => {
        if (it.flyerTypeId !== flyerId) return it;
        const taken = targetVal + (it.quantityReturned || 0);
        return {
          ...it,
          quantityTaken: taken,
          quantitySpent: targetVal,
        };
      });
      const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
      onUpdateFair(fair.id, { items: newItems, totalFlyersSpent: newTotalSpent });
    } else {
      const currentTotal = fairsWithFlyer.reduce(
        (sum, f) => sum + (f.items.find((it) => it.flyerTypeId === flyerId)?.quantitySpent || 0),
        0
      );
      const delta = targetVal - currentTotal;
      const firstFair = fairsWithFlyer[0];
      const newItems = firstFair.items.map((it) => {
        if (it.flyerTypeId !== flyerId) return it;
        const newSpent = Math.max(0, it.quantitySpent + delta);
        return {
          ...it,
          quantityTaken: newSpent + (it.quantityReturned || 0),
          quantitySpent: newSpent,
        };
      });
      const newTotalSpent = newItems.reduce((sum, item) => sum + item.quantitySpent, 0);
      onUpdateFair(firstFair.id, { items: newItems, totalFlyersSpent: newTotalSpent });
    }
  };

  // Form handlers
  const handleAddItemRow = () => {
    const unselected = flyers.find((f) => !fairItems.some((i) => i.flyerTypeId === f.id));
    setFairItems((prev) => [
      ...prev,
      { flyerTypeId: unselected?.id || flyers[0]?.id || '', quantityTaken: 1000, quantityReturned: 0 },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (fairItems.length <= 1) return;
    setFairItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setFairItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || fairItems.length === 0) return;

    const items: FairFlyerSpend[] = fairItems.map((fi) => {
      const taken = Number(fi.quantityTaken) || 0;
      const returned = Number(fi.quantityReturned) || 0;
      return {
        flyerTypeId: fi.flyerTypeId,
        quantityTaken: taken,
        quantityReturned: returned,
        quantitySpent: Math.max(0, taken - returned),
      };
    });

    const totalFlyersSpent = items.reduce((sum, item) => sum + item.quantitySpent, 0);

    if (editingFairId && onUpdateFair) {
      onUpdateFair(editingFairId, {
        name,
        city,
        country,
        startDate,
        endDate,
        standNumber,
        attendingStaff,
        items,
        totalFlyersSpent,
        notes,
      });
    } else {
      onAddFair({
        name,
        city,
        country,
        startDate,
        endDate,
        standNumber,
        attendingStaff,
        items,
        totalFlyersSpent,
        notes,
      });
    }

    setIsModalOpen(false);
    setEditingFairId(null);
    // Reset
    setName('');
    setCity('');
    setNotes('');
  };

  const filteredFairs = fairs.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.attendingStaff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              Tourism Fairs &amp; Exhibitions Tracker
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
              BTL &bull; FITUR &bull; Expos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Track promotional flyers spent per each national and international tourism fair.
            Monitor stock taken vs. returned to compute exact event consumption.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenAddFair}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fair Participation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fairs Participated
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">{totalFairs}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            National &amp; International expos
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Flyers Spent at Fairs
          </span>
          <div className="mt-1 text-2xl font-black text-purple-700">
            {totalSpent.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            Distributed to travel trade &amp; public
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Gross Taken vs Returned
          </span>
          <div className="mt-1 text-lg font-black text-slate-800">
            {totalTaken.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">taken</span>
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
            {totalReturned.toLocaleString()} returned to warehouse
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Average Spend / Fair
          </span>
          <div className="mt-1 text-2xl font-black text-blue-700">
            {avgSpentPerFair.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">flyers per stand appearance</span>
        </div>
      </div>

      {/* Flyer Distribution across Fairs Breakdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Flyer Demand Breakdown Across Tourism Fairs</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Editable demand totals across fairs. Edit demand numbers directly or expand to edit fair by fair.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDemandEditMode(!isDemandEditMode)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                isDemandEditMode
                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{isDemandEditMode ? '⚡ Demand Editing: Active' : 'Enable Demand Editing'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {sortedFlyerSpend.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border-2 border-slate-200 bg-slate-50/70 flex flex-col justify-between shadow-2xs hover:border-purple-300 transition-colors"
              style={{ borderTopColor: item.color || '#9333ea', borderTopWidth: '4px' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                    {item.sku}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                    style={{ backgroundColor: item.color || '#9333ea' }}
                    title={`Brand color: ${item.color}`}
                  />
                </div>
                <div
                  className="font-bold text-slate-900 text-xs truncate mt-0.5"
                  title={item.name}
                >
                  {item.name}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold mb-1">
                  <span>DEMAND (SPENT)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFlyerDetailId(
                        expandedFlyerDetailId === item.id ? null : item.id
                      )
                    }
                    className="text-[10px] text-purple-700 hover:text-purple-900 underline font-semibold cursor-pointer"
                    title="View & fine-tune breakdown per fair"
                  >
                    {item.fairBreakdowns.length} fair{item.fairBreakdowns.length === 1 ? '' : 's'}
                  </button>
                </div>

                {isDemandEditMode && onUpdateFair ? (
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={1}
                      value={item.spent}
                      onKeyDown={(e) => {
                        if (e.key === '.' || e.key === ',') e.preventDefault();
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[.,]/g, '');
                        const val = parseInt(clean, 10);
                        handleUpdateFlyerDemand(
                          item.id,
                          isNaN(val) ? 0 : Math.min(100000, Math.max(0, val))
                        );
                      }}
                      className="w-full border-2 border-purple-300 rounded px-2 py-1 text-xs text-right font-black text-black bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                      title="Edit total flyer demand across fairs"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Taken: {item.taken}</span>
                      <span>Ret: {item.returned}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-base font-black text-purple-800">
                      {item.spent.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 block">units spent</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded detail per fair for selected flyer */}
        {expandedFlyerDetailId && (
          <div className="mt-4 p-3 bg-purple-50/70 border border-purple-200 rounded-lg animate-in fade-in">
            {(() => {
              const selectedItem = sortedFlyerSpend.find(
                (fl) => fl.id === expandedFlyerDetailId
              );
              if (!selectedItem) return null;

              const fairsWithoutThisFlyer = fairs.filter(
                (f) => !f.items.some((it) => it.flyerTypeId === selectedItem.id)
              );

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedItem.color }}
                      />
                      <span className="font-bold text-xs text-purple-950">
                        Detailed Demand Breakdown for: {selectedItem.sku} — {selectedItem.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedFlyerDetailId(null)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
                    >
                      &times; Close
                    </button>
                  </div>

                  {selectedItem.fairBreakdowns.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">
                      This flyer is not yet assigned to any fair. You can add it below.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse bg-white rounded border border-purple-100">
                        <thead>
                          <tr className="bg-purple-100/70 text-purple-900 font-bold text-[10px] uppercase">
                            <th className="py-2 px-3">Tourism Fair</th>
                            <th className="py-2 px-3 text-right">Flyers Taken</th>
                            <th className="py-2 px-3 text-right">Flyers Returned</th>
                            <th className="py-2 px-3 text-right font-black">Net Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                          {selectedItem.fairBreakdowns.map((fb, fidx) => {
                            const targetFair = fairs.find((f) => f.id === fb.fairId);
                            const itemIdx =
                              targetFair?.items.findIndex(
                                (it) => it.flyerTypeId === selectedItem.id
                              ) ?? -1;

                            return (
                              <tr key={fidx} className="hover:bg-purple-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {fb.fairName}{' '}
                                  <span className="text-slate-400 font-normal">
                                    ({fb.city})
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {onUpdateFair && itemIdx >= 0 ? (
                                    <input
                                      type="number"
                                      min={0}
                                      value={fb.taken}
                                      onChange={(e) =>
                                        handleQuickUpdateFairItem(
                                          fb.fairId,
                                          itemIdx,
                                          'quantityTaken',
                                          Math.max(0, parseInt(e.target.value) || 0)
                                        )
                                      }
                                      className="border-2 border-slate-300 rounded px-2 py-0.5 text-xs text-right font-bold text-black bg-white w-24"
                                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                    />
                                  ) : (
                                    fb.taken.toLocaleString()
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {onUpdateFair && itemIdx >= 0 ? (
                                    <input
                                      type="number"
                                      min={0}
                                      value={fb.returned}
                                      onChange={(e) =>
                                        handleQuickUpdateFairItem(
                                          fb.fairId,
                                          itemIdx,
                                          'quantityReturned',
                                          Math.max(0, parseInt(e.target.value) || 0)
                                        )
                                      }
                                      className="border-2 border-slate-300 rounded px-2 py-0.5 text-xs text-right font-bold text-black bg-white w-24"
                                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                    />
                                  ) : (
                                    fb.returned.toLocaleString()
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-purple-900">
                                  {fb.spent.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Option to add this flyer to other fairs */}
                  {fairsWithoutThisFlyer.length > 0 && onUpdateFair && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-600 font-medium">
                        Add this flyer to:
                      </span>
                      {fairsWithoutThisFlyer.map((fair) => (
                        <button
                          key={fair.id}
                          type="button"
                          onClick={() => {
                            const newItems = [
                              ...fair.items,
                              {
                                flyerTypeId: selectedItem.id,
                                quantityTaken: 500,
                                quantityReturned: 0,
                                quantitySpent: 500,
                              },
                            ];
                            const newTotal = newItems.reduce(
                              (s, it) => s + it.quantitySpent,
                              0
                            );
                            onUpdateFair(fair.id, {
                              items: newItems,
                              totalFlyersSpent: newTotal,
                            });
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold cursor-pointer shadow-2xs"
                        >
                          + {fair.name} ({fair.city})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Fairs Cards & Details */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Participated Fairs &amp; Itemized Spending ({filteredFairs.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Directly view and edit flyer material options, taken &amp; returned quantities per fair.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFairsTableInlineEdit(!isFairsTableInlineEdit)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                isFairsTableInlineEdit
                  ? 'bg-purple-50 text-purple-900 border-purple-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{isFairsTableInlineEdit ? '⚡ In-Cell Table Active' : 'Enable In-Cell Table'}</span>
            </button>
            <input
              type="text"
              placeholder="Search fairs by city, name, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-xs bg-white text-black font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 w-56 sm:w-64 shadow-2xs"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredFairs.map((fair) => (
            <div
              key={fair.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Fair Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-slate-900">{fair.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {fair.city}, {fair.country}
                    </span>
                    {fair.standNumber && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">
                        Stand: {fair.standNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {fair.startDate} to {fair.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Staff: <strong>{fair.attendingStaff}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right bg-purple-50 sm:bg-transparent p-2 sm:p-0 rounded border sm:border-0 border-purple-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                      Net Flyers Spent
                    </span>
                    <span className="text-xl font-black text-purple-900">
                      {fair.totalFlyersSpent.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">flyers</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:border-l sm:border-slate-200 sm:pl-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditFair(fair)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
                      title="Edit fair information and flyer quantities"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Fair</span>
                    </button>
                    {onDeleteFair && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete tourism fair "${fair.name}"?`)) {
                            onDeleteFair(fair.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete fair record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-4 w-12">Color</th>
                      <th className="py-2.5 px-4">Flyer Material &amp; Language</th>
                      <th className="py-2.5 px-4 text-right">Quantity Taken</th>
                      <th className="py-2.5 px-4 text-right">Quantity Returned</th>
                      <th className="py-2.5 px-4 text-right font-black text-purple-800">
                        Net Flyers Spent
                      </th>
                      {isFairsTableInlineEdit && onUpdateFair && (
                        <th className="py-2.5 px-4 text-center w-16">Remove</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fair.items.map((item, idx) => {
                      const fl = flyers.find((f) => f.id === item.flyerTypeId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4">
                            <span
                              className="w-4 h-4 rounded-full block border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: fl?.color || '#a855f7' }}
                              title={`Flyer brand color: ${fl?.color}`}
                            />
                          </td>

                          {/* Flyer Material */}
                          <td className="py-2.5 px-4">
                            {isFairsTableInlineEdit && onUpdateFair ? (
                              <select
                                value={item.flyerTypeId}
                                onChange={(e) =>
                                  handleQuickUpdateFairItem(
                                    fair.id,
                                    idx,
                                    'flyerTypeId',
                                    e.target.value
                                  )
                                }
                                className="w-full max-w-xs border-2 border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-black font-bold focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                              >
                                {flyers.map((flOption) => (
                                  <option
                                    key={flOption.id}
                                    value={flOption.id}
                                    className="text-black font-bold bg-white py-1"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                  >
                                    {flOption.sku} — {flOption.name} ({flOption.language})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {fl?.name}
                                </span>
                                <span className="text-slate-500 text-[11px] block font-mono">
                                  {fl?.sku} &bull; {fl?.language}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Quantity Taken */}
                          <td className="py-2.5 px-4 text-right">
                            {isFairsTableInlineEdit && onUpdateFair ? (
                              <input
                                type="number"
                                min={0}
                                max={100000}
                                step={1}
                                value={item.quantityTaken}
                                onKeyDown={(e) => {
                                  if (e.key === '.' || e.key === ',') e.preventDefault();
                                }}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/[.,]/g, '');
                                  const val = parseInt(clean, 10);
                                  handleQuickUpdateFairItem(
                                    fair.id,
                                    idx,
                                    'quantityTaken',
                                    isNaN(val) ? 0 : Math.min(100000, Math.max(0, val))
                                  );
                                }}
                                className="border-2 border-slate-300 rounded px-2 py-1 text-xs text-right font-black text-black bg-white w-28 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                title="Flyers taken to fair"
                              />
                            ) : (
                              <span className="font-medium text-slate-700">
                                {item.quantityTaken.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Quantity Returned */}
                          <td className="py-2.5 px-4 text-right">
                            {isFairsTableInlineEdit && onUpdateFair ? (
                              <input
                                type="number"
                                min={0}
                                max={100000}
                                step={1}
                                value={item.quantityReturned}
                                onKeyDown={(e) => {
                                  if (e.key === '.' || e.key === ',') e.preventDefault();
                                }}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/[.,]/g, '');
                                  const val = parseInt(clean, 10);
                                  handleQuickUpdateFairItem(
                                    fair.id,
                                    idx,
                                    'quantityReturned',
                                    isNaN(val) ? 0 : Math.min(100000, Math.max(0, val))
                                  );
                                }}
                                className="border-2 border-slate-300 rounded px-2 py-1 text-xs text-right font-black text-black bg-white w-28 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                title="Flyers brought back unused"
                              />
                            ) : (
                              <span className="text-emerald-700 font-medium">
                                {item.quantityReturned > 0
                                  ? `-${item.quantityReturned.toLocaleString()}`
                                  : '0'}
                              </span>
                            )}
                          </td>

                          {/* Net Spent */}
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className="font-black text-black text-sm px-2.5 py-1 bg-purple-50 rounded border border-purple-200 inline-block shadow-2xs"
                              style={{ color: '#000000' }}
                            >
                              {item.quantitySpent.toLocaleString()}
                            </span>
                          </td>

                          {/* Action remove row */}
                          {isFairsTableInlineEdit && onUpdateFair && (
                            <td className="py-2.5 px-4 text-center">
                              {fair.items.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickDeleteFairItem(fair.id, idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                  title="Remove flyer item row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add item row button in table footer */}
              {isFairsTableInlineEdit && onUpdateFair && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleQuickAddFairItem(fair.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Flyer Material Row to {fair.name}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Changes save instantly to fair record
                  </span>
                </div>
              )}

              {/* Notes footer */}
              {fair.notes && (
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                  <span className="font-semibold text-slate-700 shrink-0">Notes &amp; Outcomes:</span>
                  <span>{fair.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Fair Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-purple-700 text-white">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingFairId ? 'Edit Tourism Fair / Exhibition' : 'Record Tourism Fair Participation & Flyer Spend'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-md cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Tourism Fair / Exhibition Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BTL Lisbon 2027, World Travel Market (WTM London)"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lisbon, Madrid, London"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Portugal, Spain, UK"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Stand / Pavilion Number
                  </label>
                  <input
                    type="text"
                    value={standNumber}
                    onChange={(e) => setStandNumber(e.target.value)}
                    placeholder="e.g. Pavilion 2, Stand D14"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Attending Staff
                  </label>
                  <input
                    type="text"
                    value={attendingStaff}
                    onChange={(e) => setAttendingStaff(e.target.value)}
                    placeholder="e.g. Ana Ramos, Tiago Mendes"
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 bg-white text-black font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>

              {/* Items Table in Form */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Flyers Taken, Returned &amp; Spent
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-1 rounded border border-purple-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Flyer Row</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {fairItems.map((fi, idx) => {
                    const selectedFlyer = flyers.find((f) => f.id === fi.flyerTypeId);
                    const spent = Math.max(0, fi.quantityTaken - fi.quantityReturned);

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg items-center shadow-2xs"
                        style={{ borderLeftColor: selectedFlyer?.color || '#a855f7', borderLeftWidth: '5px' }}
                      >
                        <div className="col-span-5 flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: selectedFlyer?.color || '#a855f7' }}
                            title={`Flyer brand color: ${selectedFlyer?.color}`}
                          />
                          <select
                            value={fi.flyerTypeId}
                            onChange={(e) => handleItemChange(idx, 'flyerTypeId', e.target.value)}
                            className="w-full border-2 border-slate-300 rounded px-2 py-1.5 bg-white text-black font-bold text-xs focus:ring-1 focus:ring-purple-500"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                          >
                            {flyers.map((f) => (
                              <option
                                key={f.id}
                                value={f.id}
                                className="text-black font-bold bg-white"
                                style={{ color: '#000000', backgroundColor: '#ffffff' }}
                              >
                                {f.sku} — {f.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-slate-600 uppercase block mb-0.5">Taken</span>
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            step={1}
                            placeholder="Taken"
                            value={fi.quantityTaken}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[.,]/g, '');
                              const val = parseInt(clean, 10);
                              handleItemChange(
                                idx,
                                'quantityTaken',
                                isNaN(val) ? 0 : Math.min(100000, Math.max(0, val))
                              );
                            }}
                            className="w-full border-2 border-slate-300 rounded px-2 py-1 bg-white text-black text-xs text-right font-black focus:ring-1 focus:ring-purple-500"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            title="Flyers taken to fair"
                          />
                        </div>

                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-slate-600 uppercase block mb-0.5">Returned</span>
                          <input
                            type="number"
                            min={0}
                            max={100000}
                            step={1}
                            placeholder="Returned"
                            value={fi.quantityReturned}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === ',') e.preventDefault();
                            }}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[.,]/g, '');
                              const val = parseInt(clean, 10);
                              handleItemChange(
                                idx,
                                'quantityReturned',
                                isNaN(val) ? 0 : Math.min(100000, Math.max(0, val))
                              );
                            }}
                            className="w-full border-2 border-slate-300 rounded px-2 py-1 bg-white text-black text-xs text-right font-black focus:ring-1 focus:ring-purple-500"
                            style={{ color: '#000000', backgroundColor: '#ffffff' }}
                            title="Flyers brought back unused"
                          />
                        </div>

                        <div className="col-span-2 text-right">
                          <span className="text-[9px] font-bold text-purple-800 uppercase block mb-0.5">Spent</span>
                          <div
                            className="border-2 border-purple-300 bg-purple-50 rounded px-2 py-1 text-xs text-right font-black text-black"
                            style={{ color: '#000000' }}
                            title="Net flyers spent (Taken - Returned)"
                          >
                            {spent.toLocaleString()}
                          </div>
                        </div>

                        <div className="col-span-1 text-center pt-3">
                          {fairItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Fair Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Visitor interest, demand, trade contacts, feedback..."
                  className="w-full border-2 border-slate-300 rounded px-3 py-1.5 bg-white text-black font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingFairId ? 'Save Fair Changes' : 'Save Fair Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
