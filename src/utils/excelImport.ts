import * as XLSX from 'xlsx';
import { FlyerType, StockInBatch } from '../types';
import { TODAY_STR } from './calculations';

export interface ParsedExcelStockRow {
  sku: string;
  name: string;
  category: string;
  language: string;
  stockAvailable: number;
  minThreshold: number;
  unitCost: number;
  color?: string;
  description?: string;
  isExisting: boolean;
  existingFlyerId?: string;
  currentStock: number;
  stockDiff: number;
  selected: boolean;
}

export interface ExcelImportResult {
  fileName: string;
  totalRows: number;
  rows: ParsedExcelStockRow[];
  existingCount: number;
  newCount: number;
  errors: string[];
}

/**
 * Normalizes string keys for flexible column matching
 */
function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Detects if a key matches standard column synonyms
 */
function isSkuKey(k: string): boolean {
  const norm = normalizeKey(k);
  return ['sku', 'codigo', 'code', 'ref', 'reference', 'codigomaterial', 'identificador'].includes(norm);
}

function isNameKey(k: string): boolean {
  const norm = normalizeKey(k);
  return [
    'name',
    'flyer',
    'flyertitle',
    'flyertitletype',
    'title',
    'titulo',
    'designacao',
    'folheto',
    'material',
    'nome',
    'descricaomaterial',
    'flyername',
  ].includes(norm);
}

function isStockKey(k: string): boolean {
  const norm = normalizeKey(k);
  return [
    'stock',
    'stockavailable',
    'availablenow',
    'currentwarehouseonhand',
    'currentstock',
    'warehousebalance',
    'stockatual',
    'saldo',
    'quantidade',
    'saldoatual',
    'emstock',
    'disponivel',
    'stockonhand',
    'stockdisponivel',
    'stockwarehouse',
    'onhand',
    'qtd',
    'stockexistente',
    'totalstock',
    'balance',
  ].includes(norm);
}

function isCategoryKey(k: string): boolean {
  const norm = normalizeKey(k);
  return ['category', 'categoria', 'tipo', 'theme', 'tema', 'classificacao'].includes(norm);
}

function isLanguageKey(k: string): boolean {
  const norm = normalizeKey(k);
  return ['language', 'idioma', 'lingua', 'lang'].includes(norm);
}

function isMinThresholdKey(k: string): boolean {
  const norm = normalizeKey(k);
  return [
    'minthreshold',
    'minimumthreshold',
    'minimo',
    'alerta',
    'alertaminimo',
    'minalertthreshold',
    'minalert',
    'threshold',
    'stockminimo',
  ].includes(norm);
}

function isUnitCostKey(k: string): boolean {
  const norm = normalizeKey(k);
  return [
    'unitcost',
    'cost',
    'custo',
    'precountario',
    'precounitario',
    'preco',
    'precodeimpressao',
    'unitprintcost',
    'valormaterial',
  ].includes(norm);
}

function isDescriptionKey(k: string): boolean {
  const norm = normalizeKey(k);
  return ['description', 'descricao', 'notas', 'notes', 'detalhes'].includes(norm);
}

/**
 * Reads and parses an uploaded Excel (.xlsx, .xls) or CSV file containing flyer stock
 */
export async function parseExcelStockFile(
  file: File,
  currentFlyers: FlyerType[],
  warehouseStockMap: Record<string, number>
): Promise<ExcelImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Priority search for stock-related sheet names
  let targetSheetName = workbook.SheetNames[0];
  const preferredSheetNames = [
    'Stock_Warehouse',
    'Stock',
    'Flyers',
    'Inventário',
    'Inventario',
    'Stock_Inventory',
    'Folhetos',
    'Stock Available',
    'Sheet1',
  ];

  for (const pref of preferredSheetNames) {
    const found = workbook.SheetNames.find(
      (sn) => sn.toLowerCase().trim() === pref.toLowerCase().trim()
    );
    if (found) {
      targetSheetName = found;
      break;
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('Unable to read sheet from the uploaded Excel file.');
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The uploaded sheet is empty or contains no readable data rows.');
  }

  const parsedRows: ParsedExcelStockRow[] = [];
  const errors: string[] = [];

  const defaultColors = [
    '#2563eb', // Blue
    '#b91c1c', // Red
    '#0d9488', // Teal
    '#7c3aed', // Purple
    '#d97706', // Amber
    '#059669', // Emerald
    '#db2777', // Pink
    '#4f46e5', // Indigo
  ];

  rawRows.forEach((row, idx) => {
    // Find fields dynamically
    let skuVal = '';
    let nameVal = '';
    let stockVal: number | null = null;
    let categoryVal = 'General Circuit';
    let languageVal = 'Multilingual (PT/EN/ES/FR)';
    let minThresholdVal = 3000;
    let unitCostVal = 0.16;
    let descriptionVal = '';

    for (const [colName, val] of Object.entries(row)) {
      if (isSkuKey(colName) && val) {
        skuVal = String(val).trim();
      } else if (isNameKey(colName) && val) {
        nameVal = String(val).trim();
      } else if (isStockKey(colName) && val !== '') {
        const parsedNum = Number(String(val).replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsedNum)) stockVal = Math.max(0, parsedNum);
      } else if (isCategoryKey(colName) && val) {
        categoryVal = String(val).trim();
      } else if (isLanguageKey(colName) && val) {
        languageVal = String(val).trim();
      } else if (isMinThresholdKey(colName) && val !== '') {
        const num = Number(String(val).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) minThresholdVal = Math.max(0, num);
      } else if (isUnitCostKey(colName) && val !== '') {
        const num = Number(String(val).replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) unitCostVal = Math.max(0, num);
      } else if (isDescriptionKey(colName) && val) {
        descriptionVal = String(val).trim();
      }
    }

    // If stockVal wasn't found through specific key, check if there's any numeric column named with numbers
    if (stockVal === null) {
      for (const [colName, val] of Object.entries(row)) {
        if (!isSkuKey(colName) && !isNameKey(colName) && val !== '') {
          const num = Number(String(val).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num) && num >= 0 && num > 100) {
            stockVal = num;
            break;
          }
        }
      }
    }

    // Default stock if still null
    if (stockVal === null) {
      stockVal = 0;
    }

    // Must have at least a Name or SKU to be considered a flyer row
    if (!nameVal && !skuVal) {
      return; // Skip empty/header junk row
    }

    if (!nameVal && skuVal) {
      nameVal = `Flyer Material ${skuVal}`;
    }

    if (!skuVal) {
      // Auto-generate clean SKU
      const words = nameVal.split(/\s+/).filter(Boolean);
      const code = words
        .slice(0, 3)
        .map((w) => w.substring(0, 3).toUpperCase())
        .join('-');
      skuVal = `AHP-${code || 'MAT'}-${(idx + 1).toString().padStart(2, '0')}`;
    }

    // Match with current system flyers
    const normalizedSku = skuVal.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedName = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');

    const existingFlyer = currentFlyers.find((f) => {
      const fSku = f.sku.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fName = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return fSku === normalizedSku || fName === normalizedName;
    });

    const isExisting = Boolean(existingFlyer);
    const existingFlyerId = existingFlyer?.id;
    const currentStock = existingFlyer ? warehouseStockMap[existingFlyer.id] ?? existingFlyer.warehouseStock : 0;
    const stockDiff = stockVal - currentStock;

    parsedRows.push({
      sku: existingFlyer ? existingFlyer.sku : skuVal,
      name: existingFlyer ? existingFlyer.name : nameVal,
      category: existingFlyer ? existingFlyer.category : categoryVal,
      language: existingFlyer ? existingFlyer.language : languageVal,
      stockAvailable: stockVal,
      minThreshold: existingFlyer ? existingFlyer.minThreshold : minThresholdVal,
      unitCost: existingFlyer ? existingFlyer.unitCost : unitCostVal,
      color: existingFlyer?.color || defaultColors[parsedRows.length % defaultColors.length],
      description: existingFlyer?.description || descriptionVal || 'Promotional flyer for Historical Villages of Portugal.',
      isExisting,
      existingFlyerId,
      currentStock,
      stockDiff,
      selected: true,
    });
  });

  const existingCount = parsedRows.filter((r) => r.isExisting).length;
  const newCount = parsedRows.filter((r) => !r.isExisting).length;

  return {
    fileName: file.name,
    totalRows: parsedRows.length,
    rows: parsedRows,
    existingCount,
    newCount,
    errors,
  };
}

/**
 * Generates and downloads a clean Excel template pre-formatted for entering or updating flyer stock
 */
export function downloadExcelStockTemplate(currentFlyers: FlyerType[], warehouseStockMap: Record<string, number>) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'SKU',
    'Flyer Title & Name',
    'Category',
    'Language',
    'Current Stock Available Now (Qty)',
    'Min Alert Threshold',
    'Unit Cost ($)',
    'Description / Notes',
  ];

  const dataRows = currentFlyers.map((f) => [
    f.sku,
    f.name,
    f.category,
    f.language,
    warehouseStockMap[f.id] ?? f.warehouseStock,
    f.minThreshold,
    f.unitCost,
    f.description,
  ]);

  // Add 2 blank example rows for adding new flyers
  dataRows.push([
    'AHP-NOVO-07',
    'Guia das Rotas Equestres & Trilhos Medievais',
    'Percursos & Outdoor',
    'Português / Inglês',
    12500,
    3000,
    0.18,
    'Novo folheto promocional de percursos a cavalo pelas 12 Aldeias.',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // SKU
    { wch: 45 }, // Flyer Title
    { wch: 25 }, // Category
    { wch: 25 }, // Language
    { wch: 32 }, // Stock Available
    { wch: 20 }, // Min Threshold
    { wch: 15 }, // Unit Cost
    { wch: 50 }, // Description
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Stock_Warehouse');
  XLSX.writeFile(wb, 'Flyer_Stock_Upload_Template.xlsx');
}
