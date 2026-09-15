import React, { useState, useEffect } from 'react';
import { X, Truck, AlertTriangle, Check } from 'lucide-react';
import { FlyerType, TourismOffice, DeliveryRecord } from '../types';
import { TODAY_STR } from '../utils/calculations';
import { AHPCasteloIcon } from './AHPLogo';

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
  onQuickReceiveStock?: (flyerTypeId: string, quantity: number) => void;
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
  onQuickReceiveStock,
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
  const isStockDepleted = currentAvailableWarehouseStock <= 0;
  const isStockInsufficient = quantity > currentAvailableWarehouseStock;
  const isSubmitDisabled = isStockDepleted || isStockInsufficient || quantity <= 0;

  // Auto-adjust quantity when changing flyer material if it exceeds available stock
  const handleFlyerChange = (newFlyerId: string) => {
    setFlyerTypeId(newFlyerId);
    const stock = warehouseStockMap[newFlyerId] || 0;
    if (stock > 0 && quantity > stock) {
      setQuantity(stock);
    }
  };

  const handleSetMaxAvailable = () => {
    if (currentAvailableWarehouseStock > 0) {
      setQuantity(currentAvailableWarehouseStock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || !flyerTypeId || quantity <= 0) return;

    // Strict warehouse stock dependency check
    if (quantity > currentAvailableWarehouseStock || isStockDepleted) {
      return;
    }

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 text-white flex items-center justify-center p-1.5 shadow-xs">
              <AHPCasteloIcon className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Record Dispatch / New Delivery Slip
              </h3>
              <p className="text-xs text-neutral-400">
                Historical Villages of Portugal &bull; Material delivery to tourism office
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
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
              onChange={(e) => handleFlyerChange(e.target.value)}
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
              <span className="text-slate-500 font-medium">Available in Central Warehouse:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold ${
                    isStockDepleted
                      ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200'
                      : currentAvailableWarehouseStock < 1000
                      ? 'text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                      : 'text-emerald-700 font-mono font-bold'
                  }`}
                >
                  {currentAvailableWarehouseStock.toLocaleString()} units
                </span>
                {isStockDepleted && onQuickReceiveStock && (
                  <button
                    type="button"
                    onClick={() => onQuickReceiveStock(flyerTypeId, 10000)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    + Connect 10,000 to Warehouse
                  </button>
                )}
                {currentAvailableWarehouseStock > 0 && quantity !== currentAvailableWarehouseStock && (
                  <button
                    type="button"
                    onClick={handleSetMaxAvailable}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Set Max ({currentAvailableWarehouseStock.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quantity Delivered */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Amount of Flyers to Distribute (Warehouse Stock Dependent) *
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Max Available: {currentAvailableWarehouseStock.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center">
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, currentAvailableWarehouseStock)}
                  step={1}
                  value={quantity}
                  disabled={isStockDepleted}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setQuantity(val);
                  }}
                  className={`w-full border rounded-md px-3 py-2 bg-white font-bold text-sm focus:outline-none focus:ring-1 ${
                    isStockInsufficient || isStockDepleted
                      ? 'border-red-500 text-red-700 focus:ring-red-500 bg-red-50/40'
                      : 'border-slate-300 text-slate-900 focus:ring-blue-500'
                  }`}
                  required
                />
                {currentAvailableWarehouseStock > 0 && (
                  <button
                    type="button"
                    onClick={handleSetMaxAvailable}
                    className="absolute right-2 px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors cursor-pointer"
                    title="Fill the maximum available quantity currently in warehouse"
                  >
                    Max Stock
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {[500, 1000, 2500, 5000, 10000, 25000, 50000].map((preset) => {
                  const isDisabled = currentAvailableWarehouseStock > 0 && preset > currentAvailableWarehouseStock;
                  return (
                    <button
                      type="button"
                      key={preset}
                      disabled={isDisabled || isStockDepleted}
                      onClick={() => setQuantity(preset)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        isDisabled || isStockDepleted
                          ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                          : quantity === preset
                          ? 'bg-blue-700 text-white border-blue-800 cursor-pointer'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 cursor-pointer'
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Stock Validation Notice */}
            {isStockDepleted ? (
              <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-red-900">Warehouse Stock Depleted (0 Available)</strong>
                    <span>
                      Tourism office deliveries are strictly dependent on warehouse inventory. A print production batch must be received into the warehouse before dispatches can be fulfilled.
                    </span>
                  </div>
                </div>
                {onQuickReceiveStock && (
                  <button
                    type="button"
                    onClick={() => onQuickReceiveStock(flyerTypeId, 10000)}
                    className="shrink-0 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Receive 10,000 to Stock
                  </button>
                )}
              </div>
            ) : isStockInsufficient ? (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-950">
                    Cannot Dispatch: Exceeds Available Warehouse Stock
                  </strong>
                  <span>
                    Requested {quantity.toLocaleString()} units, but only {currentAvailableWarehouseStock.toLocaleString()} units are in the warehouse. Click "Max Stock" or reduce delivery quantity.
                  </span>
                </div>
              </div>
            ) : null}
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
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-500">
              {isSubmitDisabled ? (
                <span className="text-red-600 font-medium">⚠️ Blocked: Stock dependency not met</span>
              ) : (
                <span className="text-emerald-700 font-medium">✓ Validated against warehouse stock</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`px-4 py-2 rounded-md font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                  isSubmitDisabled
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Log Delivery</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
