import React, { useState } from 'react';
import {
  FileSpreadsheet,
  LayoutDashboard,
  Clock,
  PlusCircle,
  PackagePlus,
  Download,
  AlertTriangle,
  RotateCcw,
  Tent,
  Footprints,
  Mail,
  Upload,
  Plus,
  Building2,
  Lock,
  LogOut,
  KeyRound,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  ActiveTab,
  FlyerType,
  TourismOffice,
  DeliveryRecord,
  StockInBatch,
  TourismFair,
  OtherDeliveryRecord,
  OfficeFlyerMetricOverride,
  AuthUser,
} from '../types';
import { exportToExcelWorkbook } from '../utils/excelExport';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewDelivery: () => void;
  onOpenAddStock: () => void;
  onOpenDepletionModal: () => void;
  onOpenEmailModal: () => void;
  onOpenUploadExcel: () => void;
  onOpenAddFlyer: () => void;
  onOpenOfficesDirectory?: () => void;
  onResetDemoData: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  flyers: FlyerType[];
  offices: TourismOffice[];
  deliveries: DeliveryRecord[];
  batches: StockInBatch[];
  fairs: TourismFair[];
  otherDeliveries: OtherDeliveryRecord[];
  depletedCount: number;
  criticalCount: number;
  metricOverrides?: Record<string, OfficeFlyerMetricOverride>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewDelivery,
  onOpenAddStock,
  onOpenDepletionModal,
  onOpenEmailModal,
  onOpenUploadExcel,
  onOpenAddFlyer,
  onOpenOfficesDirectory,
  onResetDemoData,
  currentUser,
  onLogout,
  onOpenChangePassword,
  flyers,
  offices,
  deliveries,
  batches,
  fairs,
  otherDeliveries,
  depletedCount,
  criticalCount,
  metricOverrides,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleExport = () => {
    exportToExcelWorkbook(flyers, offices, deliveries, batches, fairs, otherDeliveries, metricOverrides);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Notification Bar if stockouts exist */}
      {(depletedCount > 0 || criticalCount > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Distribution Alert:</strong> {depletedCount} office flyer type(s) are currently <strong>out of flyers</strong>, and {criticalCount} are in critical runout (&lt; 5 days).
            </span>
          </div>
          <button
            onClick={() => setActiveTab('depletion')}
            className="text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer ml-4"
          >
            Review Depletions →
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 px-2 rounded-lg bg-slate-950 text-white flex items-center justify-center gap-1.5 shadow-xs border border-slate-800">
              <img
                src="/logo_ahp_white.svg"
                alt="Aldeias Históricas de Portugal"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm sm:text-base leading-none tracking-tight">
                  Flyer Stock AHP
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 tracking-wide">
                  Aldeias Históricas
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                Tourism Office Delivery &amp; Time Lapse Tracker &bull; 1 destino que são 12
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              id="tab-spreadsheet-btn"
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Grid</span>
            </button>

            <button
              id="tab-depletion-btn"
              onClick={() => setActiveTab('depletion')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'depletion'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Time Lapse</span>
              {depletedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                  {depletedCount}
                </span>
              )}
            </button>

            <button
              id="tab-fairs-btn"
              onClick={() => setActiveTab('fairs')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'fairs'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Tent className="w-3.5 h-3.5 text-amber-600" />
              <span>Tourism Fairs</span>
            </button>

            <button
              id="tab-other-deliveries-btn"
              onClick={() => setActiveTab('other_deliveries')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'other_deliveries'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 text-indigo-600" />
              <span>Other Deliveries</span>
            </button>

            <button
              id="tab-offices-hub-btn"
              onClick={() => setActiveTab('offices')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'offices'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Offices &amp; QR Hub</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tourism Offices & Contacts Directory Button */}
            {onOpenOfficesDirectory && (
              <button
                id="btn-offices-directory"
                onClick={onOpenOfficesDirectory}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Manage tourism offices contacts, emails, and address directory"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Offices &amp; Contacts</span>
              </button>
            )}

            {/* Email Dispatch Notice Button */}
            <button
              id="btn-email-notice"
              onClick={onOpenEmailModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Compose pre-built delivery notice email to a tourism office"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email Office</span>
            </button>

            <button
              id="btn-new-delivery"
              onClick={onOpenNewDelivery}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Record flyer dispatch to a tourism office"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Deliver Flyers</span>
            </button>

            <button
              id="btn-add-stock"
              onClick={onOpenAddStock}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Receive printed batch into warehouse stock"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Stock In</span>
            </button>

            {/* Add New Flyer Button */}
            <button
              id="btn-add-flyer-nav"
              onClick={onOpenAddFlyer}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Add a new flyer material type to stock catalog"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Flyer</span>
            </button>

            {/* Upload Excel Stock Button */}
            <button
              id="btn-upload-excel"
              onClick={onOpenUploadExcel}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Upload Excel (.xlsx/.xls/.csv) to import and update flyer stock available"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Excel</span>
            </button>

            <button
              id="btn-export-excel"
              onClick={handleExport}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download real multi-sheet Excel Workbook (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .XLSX</span>
            </button>

            <button
              id="btn-reset-demo"
              onClick={onResetDemoData}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Reset to initial demo data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Authenticated User & Security Dropdown */}
            {currentUser && (
              <div className="relative pl-1 border-l border-slate-200 ml-1">
                <button
                  id="btn-user-profile"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  title="Gestão de Sessão e Segurança"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs relative">
                    <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
                  </div>
                  <div className="hidden xl:block leading-tight">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {currentUser.name || 'AHP Portal'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Logística'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Card */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2.5 z-50 text-xs animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{currentUser.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {currentUser.role === 'admin' ? 'ADMIN' : 'OPERADOR'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] font-mono mt-0.5">{currentUser.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Software Privado AHP &bull; Não Open Source</span>
                        </div>
                      </div>

                      <div className="py-1">
                        {onOpenChangePassword && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenChangePassword();
                            }}
                            className="w-full px-3.5 py-2 flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 text-left cursor-pointer transition-colors"
                          >
                            <KeyRound className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="font-medium text-slate-800">Alterar Palavra-passe</p>
                              <p className="text-[10px] text-slate-400">Atualizar credencial de acesso</p>
                            </div>
                          </button>
                        )}

                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-700 hover:bg-red-50 text-left cursor-pointer transition-colors border-t border-slate-100 mt-1"
                          >
                            <LogOut className="w-4 h-4 text-red-600" />
                            <div>
                              <p className="font-semibold text-red-700">Terminar Sessão</p>
                              <p className="text-[10px] text-red-500/80">Bloquear e voltar à página de entrada</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Tab Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'dashboard' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'spreadsheet' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Excel Sheet
          </button>
          <button
            onClick={() => setActiveTab('depletion')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'depletion' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Time Lapse ({depletedCount})
          </button>
          <button
            onClick={() => setActiveTab('fairs')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'fairs' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Tourism Fairs
          </button>
          <button
            onClick={() => setActiveTab('other_deliveries')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'other_deliveries' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Other Deliveries
          </button>
          <button
            onClick={() => setActiveTab('offices')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'offices' ? 'bg-emerald-800 text-white font-semibold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Offices &amp; QR Hub
          </button>
          {onOpenOfficesDirectory && (
            <button
              onClick={onOpenOfficesDirectory}
              className="px-2.5 py-1 rounded whitespace-nowrap font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Offices &amp; Contacts</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 rounded whitespace-nowrap font-medium bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 ml-auto"
              title="Terminar Sessão"
            >
              <LogOut className="w-3 h-3 text-red-600" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

