import React from 'react';

interface RuralRiseLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function RuralRiseLogo({
  className = '',
  size = 'md',
  showText = true,
  variant = 'light'
}: RuralRiseLogoProps) {
  const sizeMap = {
    sm: { icon: 'h-8 w-8', textTitle: 'text-base', textSub: 'text-[9px]' },
    md: { icon: 'h-11 w-11', textTitle: 'text-xl', textSub: 'text-[11px]' },
    lg: { icon: 'h-14 w-14', textTitle: 'text-2xl', textSub: 'text-xs' },
    xl: { icon: 'h-20 w-20', textTitle: 'text-3xl', textSub: 'text-sm' }
  };

  const { icon, textTitle, textSub } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Realistic Rural Rise & Gramonnati Emblem SVG */}
      <div className={`${icon} relative shrink-0 drop-shadow-md`}>
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            {/* Outer Circular Gradient */}
            <linearGradient id="emblemBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EAB308" />
              <stop offset="35%" stopColor="#22C55E" />
              <stop offset="70%" stopColor="#15803D" />
              <stop offset="100%" stopColor="#14532D" />
            </linearGradient>

            {/* Sky Dawn Gradient */}
            <radialGradient id="skySunGlow" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#FDE047" />
              <stop offset="75%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#BBF7D0" />
            </radialGradient>

            {/* Sun Rays Radial */}
            <radialGradient id="sunDisc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FACC15" />
              <stop offset="90%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#CA8A04" />
            </radialGradient>

            {/* Rolling Terraced Field Gradients */}
            <linearGradient id="hillFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="60%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#14532D" />
            </linearGradient>

            <linearGradient id="hillBack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="70%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>

            {/* Golden Wheat Shading */}
            <linearGradient id="goldenWheat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Border Ring with Premium Gold-Green Lustre */}
          <circle cx="60" cy="60" r="57" stroke="url(#emblemBorder)" strokeWidth="4" />
          <circle cx="60" cy="60" r="54" fill="url(#skySunGlow)" />

          {/* Sunbeams (Golden Rural Rise Rays) */}
          <g opacity="0.65">
            <line x1="60" y1="46" x2="60" y2="18" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="72" y1="48" x2="88" y2="28" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="48" y1="48" x2="32" y2="28" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="78" y1="56" x2="98" y2="44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="42" y1="56" x2="22" y2="44" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Rising Golden Sun (Rural Rise Horizon) */}
          <circle cx="60" cy="50" r="17" fill="url(#sunDisc)" filter="url(#softGlow)" />
          <circle cx="60" cy="50" r="14" fill="url(#sunDisc)" />

          {/* Distant Rolling Hills / Terraces */}
          <path 
            d="M8 88 C 24 72, 48 70, 72 78 C 92 84, 106 76, 112 80 L 112 114 L 8 114 Z" 
            fill="url(#hillBack)" 
            opacity="0.85"
          />

          {/* Closer Lush Green Terrace with Furrow Lines */}
          <path 
            d="M8 86 C 36 80, 56 94, 88 84 C 102 79, 110 82, 112 86 L 112 114 L 8 114 Z" 
            fill="url(#hillFront)" 
          />

          {/* Agricultural Furrow Curves */}
          <path d="M18 97 Q 52 92, 98 96" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" fill="none" />
          <path d="M26 104 Q 60 100, 102 103" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" fill="none" />

          {/* Left Wheat Stalk (Rich Golden Kernels) */}
          <g transform="translate(18, 48) rotate(-15)">
            <path d="M12 44 Q 10 22, 12 0" stroke="url(#goldenWheat)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Grains */}
            <ellipse cx="7" cy="8" rx="4.5" ry="2.5" transform="rotate(-30 7 8)" fill="url(#goldenWheat)" />
            <ellipse cx="17" cy="11" rx="4.5" ry="2.5" transform="rotate(30 17 11)" fill="url(#goldenWheat)" />
            <ellipse cx="7" cy="18" rx="4.5" ry="2.5" transform="rotate(-30 7 18)" fill="url(#goldenWheat)" />
            <ellipse cx="17" cy="21" rx="4.5" ry="2.5" transform="rotate(30 17 21)" fill="url(#goldenWheat)" />
            <ellipse cx="8" cy="28" rx="4.5" ry="2.5" transform="rotate(-30 8 28)" fill="url(#goldenWheat)" />
            <ellipse cx="16" cy="31" rx="4.5" ry="2.5" transform="rotate(30 16 31)" fill="url(#goldenWheat)" />
            <ellipse cx="12" cy="2" rx="4" ry="2" transform="rotate(-85 12 2)" fill="url(#goldenWheat)" />
          </g>

          {/* Right Wheat Stalk (Rich Golden Kernels) */}
          <g transform="translate(86, 44) rotate(15)">
            <path d="M12 44 Q 14 22, 12 0" stroke="url(#goldenWheat)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="7" cy="11" rx="4.5" ry="2.5" transform="rotate(-30 7 11)" fill="url(#goldenWheat)" />
            <ellipse cx="17" cy="8" rx="4.5" ry="2.5" transform="rotate(30 17 8)" fill="url(#goldenWheat)" />
            <ellipse cx="7" cy="21" rx="4.5" ry="2.5" transform="rotate(-30 7 21)" fill="url(#goldenWheat)" />
            <ellipse cx="17" cy="18" rx="4.5" ry="2.5" transform="rotate(30 17 18)" fill="url(#goldenWheat)" />
            <ellipse cx="8" cy="31" rx="4.5" ry="2.5" transform="rotate(-30 8 31)" fill="url(#goldenWheat)" />
            <ellipse cx="16" cy="28" rx="4.5" ry="2.5" transform="rotate(30 16 28)" fill="url(#goldenWheat)" />
            <ellipse cx="12" cy="2" rx="4" ry="2" transform="rotate(-95 12 2)" fill="url(#goldenWheat)" />
          </g>

          {/* Central Uplift Sprout (Gramonnati Leaf) */}
          <g transform="translate(48, 62)">
            {/* Left Leaf */}
            <path 
              d="M 12 26 C 2 20, 2 8, 12 2 C 12 12, 12 18, 12 26 Z" 
              fill="#86EFAC" 
              stroke="#15803D" 
              strokeWidth="1.2"
            />
            {/* Right Leaf */}
            <path 
              d="M 12 26 C 22 20, 22 8, 12 2 C 12 12, 12 18, 12 26 Z" 
              fill="#4ADE80" 
              stroke="#15803D" 
              strokeWidth="1.2"
            />
            {/* Stem */}
            <path d="M 12 28 L 12 2" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Spark of Rural Growth */}
          <circle cx="60" cy="62" r="2.5" fill="#FEF08A" />
        </svg>
      </div>

      {/* Brand Typography for Gramonnati & Rural Rise */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span 
              className={`font-serif font-black tracking-tight leading-none ${textTitle} ${
                variant === 'dark' ? 'text-white' : 'text-[#143d24]'
              }`}
            >
              Gramonnati
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 border border-amber-500/30">
              Rural Rise
            </span>
          </div>
          <span 
            className={`font-medium tracking-wide ${textSub} ${
              variant === 'dark' ? 'text-[#86efac]' : 'text-[#2d6a4f]'
            }`}
          >
            ग्रामीण उन्नती • Empowering Rural Bharat
          </span>
        </div>
      )}
    </div>
  );
}
