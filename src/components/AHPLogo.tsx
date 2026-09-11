import React from 'react';

interface AHPLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'crest' | 'symbol';
  inverted?: boolean;
}

// Exact Fortress Crest Vector from the Official Brand Identity (CASTELO-01) of Aldeias Históricas de Portugal
export const CASTELO_SVG_PATH =
  'M 155,60 L 188,60 L 188,122 L 220,122 L 220,60 L 252,60 L 252,122 L 284,122 L 284,60 L 316,60 L 316,122 L 348,122 L 348,60 L 380,60 L 380,122 L 412,122 L 412,60 L 445,60 L 548,420 L 395,420 L 300,122 L 205,420 L 52,420 Z';

/**
 * Standalone Official Castle Symbol of Aldeias Históricas de Portugal (CASTELO-01)
 */
export const AHPCasteloIcon: React.FC<{ className?: string; fill?: string }> = ({
  className = 'w-6 h-6',
  fill = 'currentColor',
}) => (
  <svg
    viewBox="0 0 600 480"
    className={className}
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Aldeias Históricas de Portugal - Castelo"
  >
    <path d={CASTELO_SVG_PATH} />
  </svg>
);

export const AHPLogo: React.FC<AHPLogoProps> = ({
  className = 'h-16 w-auto',
  variant = 'full',
  inverted = false,
}) => {
  // If only the fortress crest / castle symbol is requested
  if (variant === 'crest' || variant === 'symbol') {
    return (
      <svg
        viewBox="0 0 600 480"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Aldeias Históricas de Portugal Crest"
      >
        <path d={CASTELO_SVG_PATH} />
      </svg>
    );
  }

  // Compact variant (crest + ALDEIAS HISTÓRICAS DE PORTUGAL logotype)
  if (variant === 'compact') {
    const src = inverted ? '/logo_ahp_white.svg' : '/logo_ahp.svg';
    return (
      <img
        src={src}
        alt="Aldeias Históricas de Portugal"
        className={`${className} object-contain ${inverted ? 'brightness-0 invert' : ''}`}
        loading="eager"
      />
    );
  }

  // Full official signature variant: Crest + Logotype + "1 destino que são 12"
  const src = inverted ? '/logo_ahp_white.svg' : '/logo_ahp_assinatura.svg';

  return (
    <img
      src={src}
      alt="Aldeias Históricas de Portugal - 1 destino que são 12"
      className={`${className} object-contain ${inverted ? 'brightness-0 invert' : ''}`}
      loading="eager"
    />
  );
};

