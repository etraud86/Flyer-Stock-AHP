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
  UserPlus,
  Users,
  ChevronDown,
  Layers,
  Sparkles,
  PenTool,
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
import { AHPCasteloIcon } from './AHPLogo';

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
  onOpenUserManagement?: (tab?: 'change_password' | 'register_user' | 'users_list') => void;
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
  onOpenUserManagement,
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
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);

  const handleExport = () => {
    exportToExcelWorkbook(
      flyers,
      offices,
      deliveries,
      batches,
      fairs,
      otherDeliveries,
      metricOverrides
    );
  };

  return (
    <header className="bg-neutral-950 border-b border-neutral-800/90 text-neutral-100 sticky top-0 z-30 shadow-md">
      {/* Top Notification Bar if stockouts exist */}
      {(depletedCount > 0 || criticalCount > 0) && (
        <div className="bg-amber-950/90 border-b border-amber-900/60 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Distribution Alert:</strong> {depletedCount} office(s) are currently{' '}
              <strong>out of flyers</strong>, and {criticalCount} in critical runout (&lt; 5 days).
            </span>
          </div>
          <button
            onClick={() => setActiveTab('depletion')}
            className="text-amber-300 hover:text-white font-semibold underline cursor-pointer ml-4 transition-colors"
          >
            Review Stockouts →
          </button>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Identity with Official Castle Emblem */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-center p-2 shadow-xs shrink-0 text-white hover:border-neutral-600 transition-colors">
              <AHPCasteloIcon className="w-full h-full text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm sm:text-base leading-none tracking-tight">
                  Flyer Stock AHP
                </span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 tracking-wide">
                  Historical Villages
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 hidden md:block">
                Promotional Flyers &amp; Tourism Offices Logistics &bull; 1 Destination That Is 12
              </p>
            </div>
          </div>

          {/* Header Action Buttons (Fully Adaptive to Screen Width) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Primary Action: New Delivery (Always Visible, adapts label) */}
            <button
              id="btn-new-delivery"
              onClick={onOpenNewDelivery}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
              title="Record new flyer delivery slip to a tourism office"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New Delivery</span>
              <span className="sm:hidden">Delivery</span>
            </button>

            {/* Desktop Exclusive Direct Buttons (Visible on xl+ >= 1280px) */}
            <button
              id="btn-add-stock-xl"
              onClick={onOpenAddStock}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Record warehouse stock-in batch from litho printer"
            >
              <PackagePlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Receive Batch</span>
            </button>

            <button
              id="btn-add-flyer-xl"
              onClick={onOpenAddFlyer}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-800/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Add new flyer publication to catalog"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Flyer</span>
            </button>

            <button
              id="btn-upload-excel-xl"
              onClick={onOpenUploadExcel}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Upload Excel spreadsheet to synchronize inventory"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Excel</span>
            </button>

            <button
              id="btn-export-excel-xl"
              onClick={handleExport}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Export complete workbook to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export .XLSX</span>
            </button>

            <button
              id="btn-email-notice-xl"
              onClick={onOpenEmailModal}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-800/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Compose dispatch notification email to tourism office"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email Office</span>
            </button>

            {/* Responsive Excel Dropdown (Visible on md to 2xl) */}
            <div className="relative hidden md:block 2xl:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsExcelMenuOpen(!isExcelMenuOpen);
                  setIsActionsMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Excel import and export operations"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
              </button>

              {isExcelMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExcelMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        setIsExcelMenuOpen(false);
                        onOpenUploadExcel();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-white">Upload Excel</p>
                        <p className="text-[10px] text-neutral-400">Import .xlsx/.csv data file</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExcelMenuOpen(false);
                        handleExport();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer border-t border-neutral-800"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">Export .XLSX Workbook</p>
                        <p className="text-[10px] text-neutral-400">Download complete dataset</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Responsive Actions Menu (Visible on all screens below xl, or full menu on mobile) */}
            <div className="relative xl:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen(!isActionsMenuOpen);
                  setIsExcelMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Additional quick operations"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Actions</span>
                <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
              </button>

              {isActionsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsActionsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        onOpenAddStock();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Receive Batch</p>
                        <p className="text-[10px] text-neutral-400">Warehouse stock-in entry</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        onOpenAddFlyer();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">+ New Flyer</p>
                        <p className="text-[10px] text-neutral-400">Create new catalog material</p>
                      </div>
                    </button>

                    {/* On mobile, also expose Excel options inside actions dropdown */}
                    <div className="md:hidden border-t border-neutral-800 my-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          onOpenUploadExcel();
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Upload Excel</p>
                          <p className="text-[10px] text-neutral-400">Import spreadsheet file</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          handleExport();
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Export .XLSX</p>
                          <p className="text-[10px] text-neutral-400">Download complete workbook</p>
                        </div>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        onOpenEmailModal();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left transition-colors cursor-pointer border-t border-neutral-800"
                    >
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Email Office</p>
                        <p className="text-[10px] text-neutral-400">Pre-formatted dispatch alert</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        onResetDemoData();
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-left transition-colors cursor-pointer border-t border-neutral-800"
                    >
                      <RotateCcw className="w-4 h-4 text-neutral-400 shrink-0" />
                      <div>
                        <p className="font-semibold">Reset Demo Data</p>
                        <p className="text-[10px] text-neutral-500">Restore default demo catalog</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Quick Reset icon on desktop */}
            <button
              id="btn-reset-demo"
              onClick={onResetDemoData}
              className="hidden sm:inline-flex p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Reset default sample inventory data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* User Profile & Security Dropdown */}
            {currentUser && (
              <div className="relative pl-1 sm:pl-2 border-l border-neutral-800 ml-1">
                <button
                  id="btn-user-profile"
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                    setIsActionsMenuOpen(false);
                    setIsExcelMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  title="Session Management & Security"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs relative">
                    <span>{currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-900" />
                  </div>
                  <div className="hidden lg:block leading-tight">
                    <p className="text-xs font-bold text-white truncate max-w-[120px]">
                      {currentUser.name || 'AHP Portal'}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {currentUser.role === 'admin' ? 'Administrator' : 'Logistics Operator'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu Card */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-700/90 py-2.5 z-50 text-xs animate-fadeIn text-neutral-200">
                      <div className="px-3.5 py-2.5 border-b border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{currentUser.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {currentUser.role === 'admin' ? 'ADMIN' : 'OPERATOR'}
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px] font-mono mt-0.5">{currentUser.email}</p>

                        <div className="mt-2.5 p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                          <AHPCasteloIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="leading-tight">
                            <p className="text-[10px] font-bold text-white">Aldeias Históricas de Portugal</p>
                            <p className="text-[9px] text-neutral-400">Private Enterprise Software &bull; Not Open Source</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenUserManagement) {
                              onOpenUserManagement('change_password');
                            } else if (onOpenChangePassword) {
                              onOpenChangePassword();
                            }
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left cursor-pointer transition-colors"
                        >
                          <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-medium text-white">Change Password</p>
                            <p className="text-[10px] text-neutral-400">Update account credentials</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenUserManagement) {
                              onOpenUserManagement('register_user');
                            }
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left cursor-pointer transition-colors"
                        >
                          <UserPlus className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <p className="font-medium text-white">Register More Users</p>
                            <p className="text-[10px] text-neutral-400">Add operators &amp; manage workstation access</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenUserManagement) {
                              onOpenUserManagement('users_list');
                            }
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-neutral-200 hover:bg-neutral-800 text-left cursor-pointer transition-colors"
                        >
                          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <p className="font-medium text-white">Manage Users Directory</p>
                            <p className="text-[10px] text-neutral-400">View accounts &amp; reset passwords</p>
                          </div>
                        </button>

                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-400 hover:bg-red-950/60 text-left cursor-pointer transition-colors border-t border-neutral-800 mt-1"
                          >
                            <LogOut className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="font-semibold text-red-300">Sign Out</p>
                              <p className="text-[10px] text-red-400/80">Lock workstation and return to login</p>
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
      </div>

      {/* Secondary Navigation Tabs Bar (Scrolls seamlessly on small screens, stretches cleanly on desktop) */}
      <div className="border-t border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md px-2 sm:px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto py-1.5 gap-1 text-xs scrollbar-none">
          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span>Overview</span>
          </button>

          <button
            id="tab-spreadsheet-btn"
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'spreadsheet'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Warehouse Stock</span>
          </button>

          <button
            id="tab-depletion-btn"
            onClick={() => setActiveTab('depletion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'depletion'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Time Lapse &amp; Stockouts</span>
            {depletedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                {depletedCount}
              </span>
            )}
          </button>

          <button
            id="tab-fairs-btn"
            onClick={() => setActiveTab('fairs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'fairs'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Tent className="w-3.5 h-3.5 shrink-0" />
            <span>Tourism Fairs</span>
          </button>

          <button
            id="tab-other-deliveries-btn"
            onClick={() => setActiveTab('other_deliveries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'other_deliveries'
                ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 shrink-0" />
            <span>Other Dispatches</span>
          </button>

          <button
            id="tab-offices-btn"
            onClick={() => setActiveTab('offices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'offices'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 shrink-0" />
            <span>Offices &amp; Signatures</span>
          </button>

          {onOpenOfficesDirectory && (
            <button
              onClick={onOpenOfficesDirectory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer text-neutral-400 hover:text-white hover:bg-neutral-900 ml-auto"
              title="Open verified directory and contact information for the 12 tourism offices"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Offices Directory</span>
              <span className="sm:hidden">Directory</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
