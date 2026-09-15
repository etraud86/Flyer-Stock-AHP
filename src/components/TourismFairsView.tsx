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

  // Breakdown by flyer material across all fairs
  const flyerSpendMap: Record<string, { name: string; sku: string; color: string; spent: number }> = {};
  flyers.forEach((fl) => {
    flyerSpendMap[fl.id] = { name: fl.name, sku: fl.sku, color: fl.color, spent: 0 };
  });

  fairs.forEach((fair) => {
    fair.items.forEach((item) => {
      if (flyerSpendMap[item.flyerTypeId]) {
        flyerSpendMap[item.flyerTypeId].spent += item.quantitySpent;
      }
    });
  });

  const sortedFlyerSpend = Object.values(flyerSpendMap).sort((a, b) => b.spent - a.spent);

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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span>Flyer Demand Breakdown Across Tourism Fairs</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {sortedFlyerSpend.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">{item.sku}</div>
                <div className="font-semibold text-slate-900 text-xs truncate" title={item.name}>
                  {item.name}
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-black text-purple-700">
                  {item.spent.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">spent</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fairs Cards & Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Participated Fairs &amp; Itemized Spending ({filteredFairs.length})
          </h2>
          <input
            type="text"
            placeholder="Search fairs by city, name, staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 w-64"
          />
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
                      <span>Edit</span>
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
                      <th className="py-2.5 px-4">Flyer SKU</th>
                      <th className="py-2.5 px-4">Flyer Title / Language</th>
                      <th className="py-2.5 px-4 text-right">Quantity Taken</th>
                      <th className="py-2.5 px-4 text-right">Quantity Returned</th>
                      <th className="py-2.5 px-4 text-right font-black text-purple-800">
                        Net Flyers Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fair.items.map((item, idx) => {
                      const fl = flyers.find((f) => f.id === item.flyerTypeId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                            {fl?.sku || 'UNKNOWN'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900">{fl?.name}</span>
                            <span className="text-slate-400 text-[11px] block">
                              {fl?.language}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                            {item.quantityTaken.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">
                            {item.quantityReturned > 0
                              ? `-${item.quantityReturned.toLocaleString()}`
                              : '0'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-purple-900 text-sm">
                            {item.quantitySpent.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tourism Fair / Exhibition Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. BTL Lisbon 2027, World Travel Market (WTM London)"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lisbon, Madrid, London"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Portugal, Spain, UK"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stand / Pavilion Number
                  </label>
                  <input
                    type="text"
                    value={standNumber}
                    onChange={(e) => setStandNumber(e.target.value)}
                    placeholder="e.g. Pavilion 2, Stand D14"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attending Staff
                  </label>
                  <input
                    type="text"
                    value={attendingStaff}
                    onChange={(e) => setAttendingStaff(e.target.value)}
                    placeholder="e.g. Ana Ramos, Tiago Mendes"
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
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
                    className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Flyer Row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {fairItems.map((fi, idx) => {
                    const selectedFlyer = flyers.find((f) => f.id === fi.flyerTypeId);
                    const spent = Math.max(0, fi.quantityTaken - fi.quantityReturned);

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg items-center shadow-2xs"
                        style={{ borderLeftColor: selectedFlyer?.color || '#a855f7', borderLeftWidth: '4px' }}
                      >
                        <div className="col-span-5 flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: selectedFlyer?.color || '#a855f7' }}
                            title={`Flyer brand color: ${selectedFlyer?.color}`}
                          />
                          <select
                            value={fi.flyerTypeId}
                            onChange={(e) => handleItemChange(idx, 'flyerTypeId', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white text-black text-slate-900 font-bold text-xs focus:ring-1 focus:ring-purple-500"
                          >
                            {flyers.map((f) => (
                              <option key={f.id} value={f.id} className="text-black text-slate-900 bg-white font-semibold">
                                {f.sku} - {f.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3">
                          <div className="relative">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Taken</span>
                            <input
                              type="number"
                              placeholder="Taken"
                              value={fi.quantityTaken}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'quantityTaken',
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-black text-slate-900 text-xs text-right font-bold focus:ring-1 focus:ring-purple-500"
                              title="Flyers taken to fair"
                            />
                          </div>
                        </div>

                        <div className="col-span-3">
                          <div className="relative">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Returned</span>
                            <input
                              type="number"
                              placeholder="Returned"
                              value={fi.quantityReturned}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  'quantityReturned',
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-black text-slate-900 text-xs text-right font-bold focus:ring-1 focus:ring-purple-500"
                              title="Flyers brought back unused"
                            />
                          </div>
                        </div>

                        <div className="col-span-1 text-center pt-3.5">
                          {fairItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fair Notes &amp; Observations
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Visitor interest, demand, trade contacts, feedback..."
                  className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
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
