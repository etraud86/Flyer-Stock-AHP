import React from 'react';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { AHPCasteloIcon } from './AHPLogo';
import { InstitutionalCoFinancingLogos } from './InstitutionalCoFinancingLogos';
import { AuthUser, FlyerType, TourismOffice, DeliveryRecord } from '../types';

interface FooterProps {
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenChangePassword?: () => void;
  flyers?: FlyerType[];
  offices?: TourismOffice[];
  deliveries?: DeliveryRecord[];
}

export const Footer: React.FC<FooterProps> = ({
  currentUser,
  onLogout,
  onOpenChangePassword,
}) => {
  return (
    <footer className="w-full bg-neutral-950 text-neutral-300 border-t border-neutral-800/80 mt-auto transition-colors">
      {/* Main Base Footer Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          {/* Legal / Confidentiality notice */}
          <div className="flex items-start gap-3 text-center md:text-left">
            <div className="p-2 rounded bg-neutral-900 text-emerald-400 border border-neutral-800 hidden sm:block shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="font-bold text-white tracking-wide">
                  FLYER STOCK AHP &bull; LOGISTICS MANAGEMENT PORTAL
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  PRIVATE SOFTWARE &bull; NOT OPEN SOURCE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-xl leading-relaxed">
                Exclusive property of the Historical Villages of Portugal Tourism Development Association (Aldeias Históricas de Portugal). Unauthorized reproduction, distribution, reverse engineering, or disclosure of this software and internal inventory data is strictly prohibited.
              </p>
            </div>
          </div>

          {/* User Session & Security Actions */}
          {currentUser && (
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-900 w-full md:w-auto">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-white">{currentUser.name}</span>
                <span className="text-neutral-500 font-mono">({currentUser.role.toUpperCase()})</span>
              </div>

              {onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Change password for current user account"
                >
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  <span>Password</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 hover:border-red-700 font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Lock workstation and return to login screen"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Institutional Partners & Co-Financing Strip: PROVERE & CENTRO 2030 */}
        <div className="mt-5 pt-4 border-t border-neutral-900/90 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
              Parceiros Institucionais &amp; Financiamento:
            </span>
            <InstitutionalCoFinancingLogos showLabels={false} />
          </div>
          <div className="text-[11px] text-neutral-400 text-center md:text-right">
            <span>Estratégia de Eficiência Coletiva PROVERE &bull; Aldeias Históricas de Portugal</span>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-5 pt-4 border-t border-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <AHPCasteloIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>&copy; {new Date().getFullYear()} Aldeias Históricas de Portugal. All rights reserved.</span>
          </div>
          <span className="text-neutral-400 font-mono text-[10px]">
            Secure Version v2.6.4 &bull; Cloud Enterprise Infrastructure
          </span>
        </div>
      </div>
    </footer>
  );
};
