import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FlyerType, StockInBatch, DeliveryRecord, TourismFair, OtherDeliveryRecord } from '../types';
import {
  parseExcelStockFile,
  downloadExcelStockTemplate,
  ParsedExcelStockRow,
  ExcelImportResult,
} from '../utils/excelImport';
import { getFlyerTotalDispatched, applyTargetStockToBatches } from '../utils/stockAdjustment';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyers: FlyerType[];
  batches: StockInBatch[];
  deliveries: DeliveryRecord[];
  fairs: TourismFair[];
  otherDeliveries: OtherDeliveryRecord[];
  warehouseStockMap: Record<string, number>;
  onApplyImport: (
    updatedFlyers: FlyerType[],
    updatedBatches: StockInBatch[],
    importedCount: number,
    newFlyersCount: number
  ) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  flyers,
  batches,
  deliveries,
  fairs,
  otherDeliveries,
  warehouseStockMap,
  onApplyImport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await parseExcelStockFile(file, flyers, warehouseStockMap);
      if (result.rows.length === 0) {
        throw new Error('No valid flyer stock rows found in the uploaded file.');
      }
      setImportResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing Excel file. Please verify format.');
      setImportResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleToggleRow = (index: number) => {
    if (!importResult) return;
    const newRows = [...importResult.rows];
    newRows[index].selected = !newRows[index].selected;
    setImportResult({ ...importResult, rows: newRows });
  };

  const handleSelectAll = (select: boolean) => {
    if (!importResult) return;
    const newRows = importResult.rows.map((r) => ({ ...r, selected: select }));
    setImportResult({ ...importResult, rows: newRows });
  };

  const handleApply = () => {
    if (!importResult) return;

    const selectedRows = importResult.rows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setErrorMessage('Please select at least one flyer row to update.');
      return;
    }

    let updatedFlyers = [...flyers];
    let updatedBatches = [...batches];
    let newFlyersAdded = 0;
    let existingFlyersUpdated = 0;

    for (const row of selectedRows) {
      if (row.isExisting && row.existingFlyerId) {
        // Update existing flyer
        const flyerId = row.existingFlyerId;
        const totalDispatched = getFlyerTotalDispatched(flyerId, deliveries, fairs, otherDeliveries);

        // Update flyer details if needed
        updatedFlyers = updatedFlyers.map((f) => {
          if (f.id === flyerId) {
            return {
              ...f,
              warehouseStock: row.stockAvailable,
              minThreshold: row.minThreshold || f.minThreshold,
              unitCost: row.unitCost || f.unitCost,
            };
          }
          return f;
        });

        // Adjust batches to match the new stock available exactly
        updatedBatches = applyTargetStockToBatches(
          flyerId,
          row.stockAvailable,
          updatedBatches,
          totalDispatched,
          row.unitCost,
          `Excel Stock Import (${importResult.fileName})`
        );
        existingFlyersUpdated++;
      } else {
        // Create new flyer
        const newFlyerId = `flyer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newFlyer: FlyerType = {
          id: newFlyerId,
          sku: row.sku,
          name: row.name,
          category: row.category || 'General Circuit',
          language: row.language || 'Multilingual',
          warehouseStock: row.stockAvailable,
          minThreshold: row.minThreshold || 3000,
          unitCost: row.unitCost || 0.16,
          color: row.color || '#2563eb',
          description: row.description || 'Imported from Excel stock inventory.',
        };

        updatedFlyers.push(newFlyer);

        // Create initial batch for this new flyer
        updatedBatches = applyTargetStockToBatches(
          newFlyerId,
          row.stockAvailable,
          updatedBatches,
          0,
          row.unitCost,
          `Initial Stock via Excel Import (${importResult.fileName})`
        );
        newFlyersAdded++;
      }
    }

    onApplyImport(updatedFlyers, updatedBatches, existingFlyersUpdated, newFlyersAdded);
    onClose();
  };

  const selectedCount = importResult?.rows.filter((r) => r.selected).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Upload Excel — Import &amp; Update Stock
              </h3>
              <p className="text-xs text-slate-500">
                Synchronize all flyer types and current stock available from an Excel workbook (.xlsx / .xls / .csv)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* File Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 text-sm">
              Click to select or drag and drop your Excel file here
            </div>
            <p className="text-slate-500 mt-1">
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, and <strong>.csv</strong> spreadsheets.
            </p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                Matches columns: SKU, Flyer Title, Stock Available, Category, Language
              </span>
            </div>
          </div>

          {/* Quick Helper: Download Excel Template */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-600">
                Need a pre-formatted template with all current flyers to fill in your warehouse counts?
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadExcelStockTemplate(flyers, warehouseStockMap)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-md font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Parsing spreadsheet and matching flyer catalog...</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {importResult && !isLoading && (
            <div className="space-y-3">
              {/* Summary Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950">
                <div>
                  <span className="font-bold">File Parsed: {importResult.fileName}</span>
                  <div className="text-[11px] text-emerald-800 mt-0.5 flex items-center gap-3">
                    <span>Total items: {importResult.totalRows}</span>
                    <span>&bull;</span>
                    <span className="text-blue-700 font-semibold">
                      {importResult.existingCount} existing flyers to update
                    </span>
                    <span>&bull;</span>
                    <span className="text-emerald-700 font-semibold">
                      {importResult.newCount} new flyers to add
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 rounded text-[11px] font-semibold text-emerald-900 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2 py-1 bg-white border border-emerald-300 hover:bg-emerald-100 rounded text-[11px] font-semibold text-emerald-900 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Table of Parsed Items */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="w-8 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount === importResult.rows.length && importResult.rows.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Flyer Title &amp; SKU</th>
                      <th className="px-3 py-2 text-right">Current Stock</th>
                      <th className="px-3 py-2 text-right">Excel Stock</th>
                      <th className="px-3 py-2 text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {importResult.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          !row.selected ? 'opacity-50 bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleRow(idx)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {row.isExisting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <RefreshCw className="w-2.5 h-2.5" />
                              Update Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Plus className="w-2.5 h-2.5" />
                              New Flyer
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-800">{row.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {row.sku} &bull; {row.category} ({row.language})
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-500">
                          {row.isExisting ? row.currentStock.toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {row.stockAvailable.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.isExisting ? (
                            <span
                              className={`font-semibold ${
                                row.stockDiff > 0
                                  ? 'text-emerald-600'
                                  : row.stockDiff < 0
                                  ? 'text-red-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {row.stockDiff > 0 ? `+${row.stockDiff.toLocaleString()}` : row.stockDiff.toLocaleString()}
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-600">
                              +{row.stockAvailable.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {importResult && (
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleApply}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Stock Update ({selectedCount} selected)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
