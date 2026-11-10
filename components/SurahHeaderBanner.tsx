import React from 'react';
import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from '../utils/text';
import { CopyIcon, CheckIcon, ArrowUpTrayIcon, ShareIcon } from './icons';

interface SurahHeaderBannerProps {
  surahNumber: number;
  surahName: string;
  researchInfo?: { bookName: string; prophet: string; description?: string; evidenceAyah?: string } | null;
  onCopySurah?: () => void;
  isCopied?: boolean;
  onDownloadSurah?: () => void;
  onShareSurah?: () => void;
}

export const SurahHeaderBanner: React.FC<SurahHeaderBannerProps> = ({
  surahNumber,
  surahName,
  researchInfo,
  onCopySurah,
  isCopied,
  onDownloadSurah,
  onShareSurah
}) => {
  const info = QURAN_INDEX.find(s => s.number === surahNumber);
  const ayahsCount = info?.numberOfAyahs || 0;
  const formattedName = formatSurahNameForDisplay(surahName);

  return (
    <div className="my-1.5 w-full select-none text-center" dir="rtl">
      {/* Title, Meta and Actions in a single compact, elegant lockup */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <a 
          href={`#/surah/${surahNumber}`}
          className="inline-block transition-transform duration-150 hover:scale-105 cursor-pointer leading-tight"
          title={`سورة ${formattedName}`}
        >
          <h2 className="font-quran-title text-xl sm:text-2xl font-bold text-primary-text-strong hover:text-primary transition-colors tracking-wide">
            {formattedName}
          </h2>
        </a>

        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium bg-surface-subtle px-2 py-0.5 rounded-lg border border-border-subtle">
          <span>ترتيبها: <strong className="text-text-primary font-mono">{surahNumber}</strong></span>
          <span>•</span>
          <span>آياتها: <strong className="text-text-primary font-mono">{ayahsCount}</strong></span>
        </div>

        {/* Action buttons integrated compactly */}
        {(onCopySurah || onDownloadSurah || onShareSurah) && (
          <div className="inline-flex items-center gap-1 bg-surface-subtle px-1.5 py-0.5 rounded-lg border border-border-subtle text-xs">
            {onCopySurah && (
              <button
                type="button"
                onClick={onCopySurah}
                title="نسخ السورة كاملة"
                className="p-1 text-text-muted hover:text-primary rounded transition-colors cursor-pointer flex items-center gap-1"
              >
                {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-medium hidden sm:inline">{isCopied ? "تم النسخ" : "نسخ"}</span>
              </button>
            )}

            {onDownloadSurah && (
              <>
                <span className="w-px h-3 bg-border-default/60" />
                <button
                  type="button"
                  onClick={onDownloadSurah}
                  title="تحميل السورة كملف"
                  className="p-1 text-text-muted hover:text-primary rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">تحميل</span>
                </button>
              </>
            )}

            {onShareSurah && (
              <>
                <span className="w-px h-3 bg-border-default/60" />
                <button
                  type="button"
                  onClick={onShareSurah}
                  title="مشاركة السورة"
                  className="p-1 text-text-muted hover:text-primary rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ShareIcon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium hidden sm:inline">مشاركة</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Research Data (if available) */}
      {researchInfo && (
        <div className="mt-1 text-[11px] text-text-muted flex items-center justify-center gap-2">
          <span className="text-orange-600 dark:text-orange-400 font-semibold">{researchInfo.bookName}</span>
          <span>•</span>
          <span>الرسول المخاطب: <strong className="text-text-primary">{researchInfo.prophet}</strong></span>
        </div>
      )}
    </div>
  );
};

export default SurahHeaderBanner;
