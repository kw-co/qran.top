import React from 'react';
import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from '../utils/text';

interface SurahHeaderBannerProps {
  surahNumber: number;
  surahName: string;
  researchInfo?: { bookName: string; prophet: string; description?: string; evidenceAyah?: string } | null;
}

/**
 * Compact Islamic Arabesque Palmette Wing for Surah Title Flanking
 * Symmetrically balanced and vertically centered with the text baseline
 */
const SurahTitleWing: React.FC<{ flip?: boolean; className?: string }> = ({ flip = false, className = "w-5 h-5 sm:w-6 sm:h-6" }) => (
  <svg 
    viewBox="0 0 48 32" 
    className={`${className} text-primary select-none pointer-events-none shrink-0 transition-transform duration-300 ${flip ? 'transform -scale-x-100' : ''}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Central almond / palmette core */}
    <path 
      d="M24 16 C20 10, 8 13, 3 16 C8 19, 20 22, 24 16 Z" 
      fill="currentColor" 
      opacity="0.85" 
    />
    {/* Upper floral scrolling leaf */}
    <path 
      d="M24 16 C22 9, 29 4, 38 6 C32 10, 29 13, 24 16 Z" 
      fill="currentColor" 
      opacity="0.75" 
    />
    {/* Lower floral scrolling leaf */}
    <path 
      d="M24 16 C22 23, 29 28, 38 26 C32 22, 29 19, 24 16 Z" 
      fill="currentColor" 
      opacity="0.75" 
    />
    {/* Outer finial scroll tip */}
    <path 
      d="M38 6 C43 7, 46 11, 44 14 C42 12, 40 10, 38 10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M38 26 C43 25, 46 21, 44 18 C42 20, 40 22, 38 22" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    {/* Central jewel bead */}
    <circle cx="16" cy="16" r="2.2" fill="currentColor" opacity="0.95" />
    <circle cx="7" cy="16" r="1.4" fill="currentColor" opacity="0.9" />
    <circle cx="31" cy="16" r="1.8" fill="currentColor" opacity="0.9" />
    <circle cx="43" cy="16" r="2" fill="currentColor" />
  </svg>
);

/**
 * Compact Islamic Corner Arabesque Bracket
 */
const SurahCornerOrnament: React.FC<{ position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' }> = ({ position }) => {
  let transformClass = '';
  let positionClass = '';

  switch (position) {
    case 'top-right':
      positionClass = 'top-0 right-0';
      transformClass = '';
      break;
    case 'top-left':
      positionClass = 'top-0 left-0';
      transformClass = '-scale-x-100';
      break;
    case 'bottom-right':
      positionClass = 'bottom-0 right-0';
      transformClass = '-scale-y-100';
      break;
    case 'bottom-left':
      positionClass = 'bottom-0 left-0';
      transformClass = '-scale-x-100 -scale-y-100';
      break;
  }

  return (
    <div className={`absolute ${positionClass} w-6 h-6 sm:w-8 sm:h-8 pointer-events-none select-none text-primary opacity-70 z-10 transform ${transformClass}`}>
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L36 0 L36 6 C18 6, 6 18, 6 36 L0 36 Z" fill="currentColor" opacity="0.12" />
        <path d="M0 3 L32 3 C26 12, 18 18, 10 28 L3 32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
  );
};

export const SurahHeaderBanner: React.FC<SurahHeaderBannerProps> = ({
  surahNumber,
  surahName,
  researchInfo
}) => {
  const info = QURAN_INDEX.find(s => s.number === surahNumber);
  const ayahsCount = info?.numberOfAyahs || 0;
  const formattedName = formatSurahNameForDisplay(surahName);

  return (
    <div className="my-2.5 sm:my-3.5 w-full select-none" dir="rtl">
      {/* Outer Slim Islamic Cartouche Container */}
      <div className="relative border-2 border-primary/45 rounded-xl p-1 sm:p-1.5 bg-gradient-to-r from-primary/15 via-primary/5 to-primary/15 shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Crisp, Lightweight SVG Islamic Interlacing Background Grid */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none text-primary" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern 
              id={`islamic-fretwork-slim-${surahNumber}`} 
              width="28" 
              height="28" 
              patternUnits="userSpaceOnUse"
            >
              <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="currentColor" strokeWidth="0.7" />
              <rect x="10" y="10" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 14 14)" />
              <circle cx="14" cy="14" r="1.3" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#islamic-fretwork-slim-${surahNumber})`} />
        </svg>

        {/* 4 Compact Corner Ornaments */}
        <SurahCornerOrnament position="top-right" />
        <SurahCornerOrnament position="top-left" />
        <SurahCornerOrnament position="bottom-right" />
        <SurahCornerOrnament position="bottom-left" />

        {/* Inner Border Box: Single Sleek Row (Compact height ~38-44px) */}
        <div className="relative border border-primary/30 rounded-lg px-2.5 py-1 sm:px-4 sm:py-1.5 flex items-center justify-between gap-1.5 sm:gap-3 bg-surface/90 backdrop-blur-xs transition-colors duration-300">
          
          {/* Right Information Badge: Order in Quran */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-text-secondary shrink-0">
            <span className="text-text-muted hidden xs:inline">ترتيبها:</span>
            <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs sm:text-sm">
              {surahNumber}
            </span>
          </div>

          {/* Central Title with Perfectly Centered Arabesque Finial Wings */}
          <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 px-1">
            {/* Right Islamic Wing */}
            <SurahTitleWing flip={false} className="w-5 h-5 sm:w-6 sm:h-6 text-primary opacity-80" />

            {/* Surah Title Link */}
            <a 
              href={`#/surah/${surahNumber}`}
              className="inline-block transition-transform duration-200 hover:scale-105 cursor-pointer leading-none"
              title={`فتح سورة ${formattedName}`}
            >
              <h2 className="font-quran-title text-xl sm:text-2xl font-bold text-primary-text-strong hover:text-primary transition-colors tracking-wide leading-none">
                {formattedName}
              </h2>
            </a>

            {/* Left Islamic Wing */}
            <SurahTitleWing flip={true} className="w-5 h-5 sm:w-6 sm:h-6 text-primary opacity-80" />
          </div>

          {/* Left Information Badge: Ayahs Count */}
          <div className="flex items-center justify-end gap-1 text-[11px] sm:text-xs font-semibold text-text-secondary shrink-0">
            <span className="text-text-muted hidden xs:inline">آياتها:</span>
            <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs sm:text-sm">
              {ayahsCount}
            </span>
          </div>

        </div>

        {/* Research Data (if available) - Sleek compact badge */}
        {researchInfo && (
          <div className="mt-1.5 pt-1.5 border-t border-primary/15 w-full flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/50">
              {researchInfo.bookName}
            </span>
            <span className="text-[10px] sm:text-[11px] text-text-secondary">
              الرسول المخاطب: <strong className="text-text-primary">{researchInfo.prophet}</strong>
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default SurahHeaderBanner;
