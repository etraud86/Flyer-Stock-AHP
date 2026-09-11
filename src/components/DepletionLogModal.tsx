import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { FlyerType, TourismOffice, DeliveryRecord } from '../types';
import { TODAY_STR, getDaysDiff } from '../utils/calculations';

interface DepletionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deliveryId: string, depletedDate: string) => void;
  offices: TourismOffice[];
  flyers: FlyerType[];
  deliveries: DeliveryRecord[];
  targetOfficeId?: string;
  targetFlyerTypeId?: string;
}

export const DepletionLogModal: React.FC<DepletionLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  offices,
  flyers,
  deliveries,
  targetOfficeId,
  targetFlyerTypeId,
}) => {
  const [selectedOfficeId, setSelectedOfficeId] = useState(targetOfficeId || offices[0]?.id || '');
  const [selectedFlyerTypeId, setSelectedFlyerTypeId] = useState(targetFlyerTypeId || flyers[0]?.id || '');
  const [depletedDate, setDepletedDate] = useState<string>(TODAY_STR);

  useEffect(() => {
    if (targetOfficeId) setSelectedOfficeId(targetOfficeId);
    if (targetFlyerTypeId) setSelectedFlyerTypeId(targetFlyerTypeId);
  }, [targetOfficeId, targetFlyerTypeId, isOpen]);

  if (!isOpen) return null;

  // Find the most recent active delivery for this office & flyer
  const candidateDeliveries = deliveries
    .filter((d) => d.officeId === selectedOfficeId && d.flyerTypeId === selectedFlyerTypeId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const targetDelivery = candidateDeliveries[0];

  // Calculate usage period preview
  const daysUsed = targetDelivery
    ? getDaysDiff(targetDelivery.date, depletedDate)
    : 0;
  const burnRate =
    targetDelivery && daysUsed > 0
      ? Math.round((targetDelivery.quantityDelivered / daysUsed) * 10) / 10
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDelivery) return;
    onSubmit(targetDelivery.id, depletedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Record Stockout / Depletion Date
              </h3>
              <p className="text-xs text-slate-500">
                Register when the office ran completely out of this flyer
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
          {/* Office Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tourism Office *
            </label>
            <select
              value={selectedOfficeId}
              onChange={(e) => setSelectedOfficeId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            >
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Flyer Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Flyer Type *
            </label>
            <select
              value={selectedFlyerTypeId}
              onChange={(e) => setSelectedFlyerTypeId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            >
              {flyers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sku} — {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Delivery Info */}
          {targetDelivery ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Batch Dispatched:</span>
                <span className="font-semibold text-slate-900">
                  {targetDelivery.quantityDelivered.toLocaleString()} flyers
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Date:</span>
                <span className="font-semibold text-slate-900">{targetDelivery.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Slip:</span>
                <span className="font-mono text-blue-700">{targetDelivery.deliveryRef}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
              No delivery records found for this office and flyer type combination.
            </div>
          )}

          {/* Depletion Date Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Date Office Ran Out of Flyers *
            </label>
            <input
              type="date"
              value={depletedDate}
              min={targetDelivery?.date || '2026-01-01'}
              onChange={(e) => setDepletedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>

          {/* Real-time calculated period */}
          {targetDelivery && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
              <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Calculated Depletion Lifespan:</span>
              </div>
              <div className="mt-1 text-xs">
                This batch lasted <strong>{daysUsed} days</strong> until empty.
              </div>
              <div className="text-[11px] text-blue-700">
                Distribution velocity: <strong>{burnRate} flyers / day</strong>.
              </div>
            </div>
          )}

          {/* Buttons */}
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
              disabled={!targetDelivery}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Stockout</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
