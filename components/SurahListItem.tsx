import React from 'react';
import type { SurahReference } from '../types';
import { formatSurahNameForDisplay } from '../utils/text';
import { useResearchData } from '../hooks/useResearchData';
import { SparklesIcon } from './icons';

interface SurahListItemProps {
  surah: SurahReference;
}

const SurahListItem: React.FC<SurahListItemProps> = ({ surah }) => {
  const formattedName = formatSurahNameForDisplay(surah.name);
  const researchData = useResearchData();
  const surahResearch = researchData ? researchData[surah.number] : null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetHash = e.currentTarget.getAttribute('href');
    if (targetHash) {
      window.location.hash = targetHash;
    }
  };

  return (
    <li className="relative group">
      <a
        href={`#/surah/${surah.number}`}
        onClick={handleClick}
        className="flex items-center gap-2 p-2 bg-surface rounded-md shadow-sm hover:shadow-md hover:bg-surface-hover transition-all duration-200 cursor-pointer border border-border-subtle h-full pl-8"
        aria-label={`سورة ${formattedName}`}
      >
        <span className="text-xs font-mono bg-surface-active text-primary-text-strong rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
          {surah.number}
        </span>
        <div className="flex-grow min-w-0">
          <span className="text-md text-text-secondary font-semibold truncate block" title={formattedName}>
            {formattedName}
          </span>
          {surahResearch && (
            <span className="text-[10px] text-orange-600 dark:text-orange-400 truncate block mt-0.5" title={surahResearch.bookName}>
              {surahResearch.bookName} - {surahResearch.prophet}
            </span>
          )}
        </div>
      </a>
      <a
        href={`#/pairs/${surah.number}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        title={`اكتشف زوج سورة ${formattedName} والآيات الأكثر تطابقاً`}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-text-muted hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors z-10"
      >
        <SparklesIcon className="w-4 h-4" />
      </a>
    </li>
  );
};

export default SurahListItem;
