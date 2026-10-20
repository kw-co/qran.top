import React from 'react';
import { formatSurahNameForDisplay } from '../utils/text';
import { useSettingsContext } from '../contexts/SettingsContext';
import { openQuranSymbolModal } from '../data/quranSymbolsData';

interface IndexItemProps {
  type: 'الجزء' | 'الحزب';
  number: number;
  startSurah: number;
  startAyah: number;
  startSurahName: string;
}

const IndexItem: React.FC<IndexItemProps> = ({ type, number, startSurah, startAyah, startSurahName }) => {
  const { setFontStyle, setSelectedEdition } = useSettingsContext();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setFontStyle('mushaf');
    setSelectedEdition('quran-uthmani-quran-academy');
    const targetHash = e.currentTarget.getAttribute('href');
    if (targetHash) {
      window.location.hash = targetHash;
    }
  };

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuranSymbolModal({
      type: type === 'الجزء' ? 'juz' : 'hizb',
      ...(type === 'الجزء' ? { juzNumber: number } : { hizbNumber: number })
    });
  };

  return (
    <li className="relative group">
      <a
        href={`#/surah/${startSurah}?ayah=${startAyah}&navOnly=true`}
        onClick={handleClick}
        className="flex items-center gap-1.5 p-2.5 bg-surface rounded-xl shadow-xs hover:shadow-md hover:bg-surface-hover hover:border-primary/50 transition-all duration-200 cursor-pointer border border-border-default h-full flex-col text-center justify-between"
        aria-label={`${type} ${number}`}
      >
        <div className="flex-grow min-w-0 py-1">
            <span className="text-base text-text-primary font-bold block">
                {type} {number}
            </span>
            <span className="text-xs text-text-muted font-semibold block mt-1" title={startSurahName}>
                يبدأ من سورة {formatSurahNameForDisplay(startSurahName)}
            </span>
        </div>
        <button
            type="button"
            onClick={handleOpenInfo}
            className="w-full mt-2 py-1 px-2 rounded-lg text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/15 border border-primary/15 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title={`شرح ومعلومات كاملة عن ${type} ${number}`}
        >
            <span>{type === 'الجزء' ? '📖' : '۞'}</span>
            <span>شرح وتفاصيل</span>
        </button>
      </a>
    </li>
  );
};

export default IndexItem;
