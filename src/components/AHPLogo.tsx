import React from 'react';

interface AHPLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'crest';
  inverted?: boolean;
}

// Exact Fortress Crest Vector Path from the Official Brand Identity of Aldeias Históricas de Portugal
const OFFICIAL_CREST_PATH =
  'M267 748 c-8 -24 -67 -191 -130 -373 -63 -181 -118 -338 -122 -347 -7 -17 5 -18 167 -18 l174 0 26 78 c43 126 198 555 202 560 2 2 10 -14 16 -35 11 -34 39 -113 176 -495 l39 -108 172 0 172 0 -29 82 c-15 46 -63 182 -105 303 -42 121 -91 259 -107 308 -27 80 -32 87 -56 87 -26 0 -27 -2 -27 -62 l0 -62 -32 -2 -33 -2 0 64 0 64 -40 0 -40 0 0 -63 0 -63 -30 0 c-16 0 -31 3 -31 8 -1 4 -2 32 -3 61 l-1 52 -40 0 -40 0 0 -61 0 -60 -32 -1 c-18 -1 -33 2 -34 5 -1 4 -2 32 -3 62 l-1 55 -37 3 -38 3 0 -64 c0 -69 3 -67 -62 -58 -5 1 -8 28 -8 61 0 57 -1 60 -24 60 -19 0 -27 -8 -39 -42z';

export const AHPLogo: React.FC<AHPLogoProps> = ({
  className = 'h-16 w-auto',
  variant = 'full',
  inverted = false,
}) => {
  // If only the fortress crest watermark is requested
  if (variant === 'crest') {
    return (
      <svg
        viewBox="0 0 105 80"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Aldeias Históricas de Portugal Crest"
      >
        <g transform="translate(0, 80) scale(0.1, -0.1)" stroke="none">
          <path d={OFFICIAL_CREST_PATH} />
        </g>
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
