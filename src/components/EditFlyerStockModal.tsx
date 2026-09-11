import React, { useState, useEffect } from 'react';
import { X, Save, Package, Trash2, Sliders, Palette, Check, AlertTriangle } from 'lucide-react';
import { FlyerType } from '../types';

interface EditFlyerStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyer: FlyerType | null;
  currentWarehouseStock: number;
  onUpdateFlyerStock: (
    flyerId: string,
    newStock: number,
    updatedFlyerDetails: Partial<FlyerType>,
    reason: string
  ) => void;
  onDeleteFlyer?: (flyerId: string) => void;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#b91c1c', // Deep Red
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#d97706', // Amber / Gold
  '#059669', // Emerald Green
  '#db2777', // Pink / Rose
  '#4f46e5', // Indigo
  '#ea580c', // Orange
  '#475569', // Slate
];

export const EditFlyerStockModal: React.FC<EditFlyerStockModalProps> = ({
  isOpen,
  onClose,
  flyer,
  currentWarehouseStock,
  onUpdateFlyerStock,
  onDeleteFlyer,
}) => {
  const [newStock, setNewStock] = useState<number>(0);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('');
  const [minThreshold, setMinThreshold] = useState<number>(3000);
  const [unitCost, setUnitCost] = useState<number>(0.16);
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('Stock Count Recount / Physical Audit');
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'details'>('stock');

  useEffect(() => {
    if (flyer) {
      setNewStock(currentWarehouseStock);
      setName(flyer.name);
      setSku(flyer.sku);
      setCategory(flyer.category);
      setLanguage(flyer.language);
      setMinThreshold(flyer.minThreshold);
      setUnitCost(flyer.unitCost);
      setColor(flyer.color);
      setDescription(flyer.description || '');
      setReason('Direct Stock Adjustment');
    }
  }, [flyer, currentWarehouseStock, isOpen]);

  if (!isOpen || !flyer) return null;

  const stockDifference = newStock - currentWarehouseStock;

  const handleQuickAdd = (delta: number) => {
    setNewStock((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFlyerStock(
      flyer.id,
      Number(newStock),
      {
        name: name.trim() || flyer.name,
        sku: sku.trim() || flyer.sku,
        category: category.trim() || flyer.category,
        language: language.trim() || flyer.language,
        minThreshold: Number(minThreshold) || flyer.minThreshold,
        unitCost: Number(unitCost) || flyer.unitCost,
        color,
        description: description.trim(),
      },
      reason.trim() || 'Direct Stock Adjustment'
    );
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteFlyer && window.confirm(`Are you sure you want to remove flyer "${flyer.name}" from the catalog?`)) {
      onDeleteFlyer(flyer.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-xs font-bold"
              style={{ backgroundColor: color }}
            >
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs">
                {flyer.name}
              </h3>
              <div className="text-xs text-slate-500 font-mono">
                {flyer.sku} &bull; Current: {currentWarehouseStock.toLocaleString()} on-hand
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs: Quick Stock Adjustment vs Edit Details */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 text-xs px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('stock')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'stock'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Change Stock Available</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('details')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'details'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Flyer Specs</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* TAB 1: CHANGE STOCK AVAILABLE */}
          {activeSubTab === 'stock' && (
            <div className="space-y-4">
              {/* Primary Stock Counter Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider">
                    Adjust Warehouse Stock Available Now
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Previous: <strong>{currentWarehouseStock.toLocaleString()}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="shrink-0 text-right min-w-24">
                    <div className="text-[10px] text-slate-400">Difference</div>
                    <div
                      className={`text-sm font-bold ${
                        stockDifference > 0
                          ? 'text-emerald-600'
                          : stockDifference < 0
                          ? 'text-red-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {stockDifference > 0
                        ? `+${stockDifference.toLocaleString()}`
                        : stockDifference.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[+500, +1000, +2500, +5000, +10000].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleQuickAdd(d)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      +{d.toLocaleString()}
                    </button>
                  ))}
                  {[-1000, -5000].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleQuickAdd(d)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      {d.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Notes for Audit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Stock Change
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Physical warehouse recount, Surplus delivered, Damaged batch write-off..."
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                Updating available stock will recalculate warehouse inventory, depletion projections, and Excel matrix rows across all 12 tourism offices.
              </div>
            </div>
          )}

          {/* TAB 2: EDIT FLYER DETAILS */}
          {activeSubTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Flyer Name &amp; Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Cost (€ / $)</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={unitCost}
                    onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span>Color</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          color === c ? 'ring-2 ring-offset-1 ring-slate-900 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {onDeleteFlyer && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Remove from flyer catalog</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Flyer</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Stock Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
