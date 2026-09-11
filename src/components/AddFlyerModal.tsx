import React, { useState } from 'react';
import { X, Plus, Package, Palette, Sparkles, Check } from 'lucide-react';
import { FlyerType } from '../types';

interface AddFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFlyer: (newFlyer: Omit<FlyerType, 'id'>, initialStock: number) => void;
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

const PRESET_CATEGORIES = [
  'Mapa Geral & Circuito',
  'Gastronomia & Vinhos',
  'Percursos & Outdoor (GR22)',
  'História, Castelos & Património',
  'Lendas, Tradições & Família',
  'Natureza & Geoparques',
  'Festivais & Eventos Medievais',
  'Outro / Temático',
];

export const AddFlyerModal: React.FC<AddFlyerModalProps> = ({
  isOpen,
  onClose,
  onAddFlyer,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [skuAuto, setSkuAuto] = useState(true);
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [language, setLanguage] = useState('Multilingual (PT/EN/ES/FR)');
  const [initialStock, setInitialStock] = useState<number>(10000);
  const [minThreshold, setMinThreshold] = useState<number>(3000);
  const [unitCost, setUnitCost] = useState<number>(0.16);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (skuAuto) {
      // Suggest automatic SKU code
      const clean = val
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9\s]/g, '');
      const words = clean.split(/\s+/).filter(Boolean);
      const code = words.slice(0, 2).map((w) => w.substring(0, 3)).join('-');
      if (code) {
        setSku(`AHP-${code}-${Math.floor(10 + Math.random() * 89)}`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === 'Outro / Temático' && customCategory.trim() ? customCategory.trim() : category;
    const finalSku = sku.trim() || `AHP-MAT-${Math.floor(100 + Math.random() * 900)}`;

    onAddFlyer(
      {
        sku: finalSku,
        name: name.trim(),
        category: finalCategory,
        language: language.trim(),
        warehouseStock: Number(initialStock) || 0,
        minThreshold: Number(minThreshold) || 2000,
        unitCost: Number(unitCost) || 0.15,
        color,
        description: description.trim() || `Material promocional oficial da rede das Aldeias Históricas de Portugal.`,
      },
      Number(initialStock) || 0
    );

    // Reset and close
    setName('');
    setSku('');
    setSkuAuto(true);
    setInitialStock(10000);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Add New Flyer Material to Stock
              </h3>
              <p className="text-xs text-slate-500">
                Register a new promotional flyer type and establish initial warehouse inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Flyer Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Flyer Title &amp; Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Roteiro dos Sabores, Tabernas &amp; Vinhas Históricas"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* SKU Code & Auto-generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">SKU Code *</label>
              <button
                type="button"
                onClick={() => setSkuAuto(!skuAuto)}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{skuAuto ? 'Auto-generating' : 'Manual SKU'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. AHP-SAB-07"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                setSkuAuto(false);
              }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {category === 'Outro / Temático' && (
                <input
                  type="text"
                  placeholder="Enter custom category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-1.5 w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. Multilingual (PT/EN/ES/FR)"
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Initial Warehouse Stock Available */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Initial Stock Available in Warehouse (Qty) *</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">Available Now</span>
            </div>
            <input
              type="number"
              min={0}
              step={100}
              required
              value={initialStock}
              onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border border-emerald-300 rounded-md px-3 py-2 bg-white text-slate-900 font-bold text-base focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <div className="flex items-center gap-1.5 mt-2">
              {[5000, 10000, 20000, 35000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setInitialStock(preset)}
                  className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +{preset.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-emerald-800 mt-2">
              This quantity will immediately be placed in central warehouse stock and made ready for distribution.
            </p>
          </div>

          {/* Min Threshold & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Min Safety Threshold (Alert)
              </label>
              <input
                type="number"
                min={500}
                step={500}
                value={minThreshold}
                onChange={(e) => setMinThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Print Cost (€ / $)
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Badge Accent Color</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the promotional material's content, targets, or editorial guidelines..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer buttons */}
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
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Flyer to Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
