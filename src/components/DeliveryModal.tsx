import React, { useState, useEffect } from 'react';
import { X, Truck, AlertTriangle, Check } from 'lucide-react';
import { FlyerType, TourismOffice, DeliveryRecord } from '../types';
import { TODAY_STR } from '../utils/calculations';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newDelivery: Omit<DeliveryRecord, 'id' | 'deliveryRef'>) => void;
  offices: TourismOffice[];
  flyers: FlyerType[];
  preselectedOfficeId?: string;
  preselectedFlyerTypeId?: string;
  defaultQty?: number;
  warehouseStockMap: Record<string, number>;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  offices,
  flyers,
  preselectedOfficeId,
  preselectedFlyerTypeId,
  defaultQty,
  warehouseStockMap,
}) => {
  const [officeId, setOfficeId] = useState(offices[0]?.id || '');
  const [flyerTypeId, setFlyerTypeId] = useState(flyers[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1000);
  const [date, setDate] = useState<string>(TODAY_STR);
  const [courier, setCourier] = useState<string>('Express Courier Dispatch');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (preselectedOfficeId) setOfficeId(preselectedOfficeId);
    if (preselectedFlyerTypeId) setFlyerTypeId(preselectedFlyerTypeId);
    if (defaultQty && defaultQty > 0) setQuantity(defaultQty);
  }, [preselectedOfficeId, preselectedFlyerTypeId, defaultQty, isOpen]);

  if (!isOpen) return null;

  const currentAvailableWarehouseStock = warehouseStockMap[flyerTypeId] || 0;
  const isStockInsufficient = quantity > currentAvailableWarehouseStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || !flyerTypeId || quantity <= 0) return;

    onSubmit({
      officeId,
      flyerTypeId,
      quantityDelivered: Number(quantity),
      date,
      courier,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Deliver Flyers to Tourism Office
              </h3>
              <p className="text-xs text-slate-500">
                Log flyer dispatch amount and record delivery slip
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
          {/* Tourism Office Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Destination Tourism Office *
            </label>
            <select
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name} ({o.footfallTier} Footfall)
                </option>
              ))}
            </select>
          </div>

          {/* Flyer Type Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Flyer Material / SKU *
            </label>
            <select
              value={flyerTypeId}
              onChange={(e) => setFlyerTypeId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {flyers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sku} — {f.name}
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Warehouse stock available:</span>
              <span
                className={`font-semibold ${
                  currentAvailableWarehouseStock < 1000 ? 'text-amber-600' : 'text-slate-700'
                }`}
              >
                {currentAvailableWarehouseStock.toLocaleString()} units
              </span>
            </div>
          </div>

          {/* Quantity Delivered */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Amount of Flyers to Distribute in this Delivery (Qty) *
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
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setQuantity(Math.max(1, Math.min(1000000, val)));
                }}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <div className="flex flex-wrap gap-1">
                {[500, 1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setQuantity(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      quantity === preset
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            {isStockInsufficient && (
              <div className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Warning: Requested quantity ({quantity.toLocaleString()}) exceeds warehouse balance ({currentAvailableWarehouseStock.toLocaleString()}).
                </span>
              </div>
            )}
          </div>

          {/* Dispatch Date & Courier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dispatch Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Courier / Van Ref
              </label>
              <input
                type="text"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                placeholder="e.g. City Cargo - Van 1"
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Delivery Notes / Special Event (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Restock for upcoming weekend festival peak"
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Log Delivery</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
