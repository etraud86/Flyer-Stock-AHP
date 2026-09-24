import React from 'react';

interface InstitutionalCoFinancingLogosProps {
  className?: string;
  showLabels?: boolean;
}

/**
 * Official Co-Financing & Institutional Partner Logos:
 * - PROVERE (Programa de Valorização Económica de Recursos Endógenos - EEC Aldeias Históricas)
 * - CENTRO 2030 / PORTUGAL 2030 / UNIÃO EUROPEIA (FEDER)
 */
export const InstitutionalCoFinancingLogos: React.FC<InstitutionalCoFinancingLogosProps> = ({
  className = '',
  showLabels = true,
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 sm:gap-4 ${className}`}>
      {/* PROVERE Logo Container */}
      <div className="flex items-center gap-2">
        {showLabels && (
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold hidden sm:inline-block">
            Programa:
          </span>
        )}
        <a
          href="https://aldeiashistoricasdeportugal.com/provere-21-27/"
          target="_blank"
          rel="noopener noreferrer"
          title="Programa PROVERE - Aldeias Históricas de Portugal"
          className="inline-flex items-center justify-center bg-white px-2.5 py-1 rounded-md border border-neutral-700/80 shadow-xs hover:border-emerald-500/50 transition-all group"
        >
          <img
            src="/assets/provere_logo.png"
            alt="Logótipo PROVERE - Programa de Valorização Económica de Recursos Endógenos"
            className="h-6 w-auto object-contain transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </a>
      </div>

      {/* Centro 2030 / Portugal 2030 / União Europeia Co-Financing Bar */}
      <div className="flex items-center gap-2">
        {showLabels && (
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold hidden sm:inline-block">
            Co-Financiamento:
          </span>
        )}
        <a
          href="https://centro2030.pt/"
          target="_blank"
          rel="noopener noreferrer"
          title="Cofinanciado por Centro 2030, Portugal 2030 e União Europeia (FEDER)"
          className="inline-flex items-center justify-center bg-white px-2.5 py-1 rounded-md border border-neutral-700/80 shadow-xs hover:border-blue-500/50 transition-all group"
        >
          <img
            src="/assets/centro2030_barra.svg"
            alt="Centro 2030, Portugal 2030, Cofinanciado pela União Europeia"
            className="h-6 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        </a>
      </div>
    </div>
  );
};
