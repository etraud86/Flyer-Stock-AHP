import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Check } from 'lucide-react';
import { FlyerType, StockInBatch } from '../types';
import { TODAY_STR } from '../utils/calculations';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newBatch: Omit<StockInBatch, 'id' | 'batchRef'>) => void;
  flyers: FlyerType[];
  preselectedFlyerTypeId?: string;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  flyers,
  preselectedFlyerTypeId,
}) => {
  const [flyerTypeId, setFlyerTypeId] = useState(flyers[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10000);
  const [date, setDate] = useState<string>(TODAY_STR);
  const [printerName, setPrinterName] = useState<string>('Apex Precision Litho Press');

  useEffect(() => {
    if (preselectedFlyerTypeId) {
      setFlyerTypeId(preselectedFlyerTypeId);
    }
  }, [preselectedFlyerTypeId, isOpen]);

  const handleFlyerChange = (id: string) => {
    setFlyerTypeId(id);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyerTypeId || quantity <= 0) return;

    const selectedFlyer = flyers.find((f) => f.id === flyerTypeId);
    onSubmit({
      flyerTypeId,
      quantity: Number(quantity),
      date,
      printerName,
      unitCost: selectedFlyer?.unitCost || 0.16,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Receive Stock Batch into Warehouse
              </h3>
              <p className="text-xs text-slate-500">
                Replenish promotional flyer inventory from print suppliers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Flyer Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Flyer Material Title *
            </label>
            <select
              value={flyerTypeId}
              onChange={(e) => handleFlyerChange(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            >
              {flyers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sku} — {f.name} ({f.language})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Received */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity Received (Flyers Printed) *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={500}
                step={500}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <div className="flex gap-1">
                {[5000, 10000, 20000].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setQuantity(preset)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                  >
                    {(preset / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Print House */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Printer / Supplier
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add to Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
