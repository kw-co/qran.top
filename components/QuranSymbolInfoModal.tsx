import React, { useState, useEffect } from 'react';
import { 
  ALL_15_SAJDAHS, 
  SAJDAH_DUAA, 
  JUZ_NAMES, 
  JUZ_PAGE_RANGES, 
  getHizbQuarterLabel,
  findSajdahByAyah,
  SajdahInfo
} from '../data/quranSymbolsData';
import { JUZ_INDEX, HIZB_INDEX } from '../quranPartitions';
import { QURAN_INDEX } from '../quranIndex';
import { CopyIcon, CheckIcon, PlayIcon, SparklesIcon } from './icons';

export type QuranSymbolModalType = 'sajdah' | 'hizb' | 'juz';

interface QuranSymbolInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: QuranSymbolModalType;
  initialSajdahNumber?: number; // 1 to 15
  initialHizbNumber?: number; // 1 to 60
  initialQuarterNumber?: number; // 1 to 240
  initialJuzNumber?: number; // 1 to 30
  onNavigateToAyah?: (surah: number, ayah: number) => void;
  onNavigateToPage?: (page: number) => void;
}

export const QuranSymbolInfoModal: React.FC<QuranSymbolInfoModalProps> = ({
  isOpen,
  onClose,
  initialType = 'sajdah',
  initialSajdahNumber = 1,
  initialHizbNumber = 1,
  initialQuarterNumber,
  initialJuzNumber = 1,
  onNavigateToAyah,
  onNavigateToPage
}) => {
  const [activeTab, setActiveTab] = useState<QuranSymbolModalType>(initialType);
  const [selectedSajdahIdx, setSelectedSajdahIdx] = useState<number>(Math.max(0, initialSajdahNumber - 1));
  const [selectedHizbNum, setSelectedHizbNum] = useState<number>(initialHizbNumber || 1);
  const [selectedQuarterNum, setSelectedQuarterNum] = useState<number | undefined>(initialQuarterNumber);
  const [selectedJuzNum, setSelectedJuzNum] = useState<number>(initialJuzNumber || 1);
  const [copiedDuaa, setCopiedDuaa] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      if (initialSajdahNumber) setSelectedSajdahIdx(Math.max(0, initialSajdahNumber - 1));
      if (initialQuarterNumber) {
        setSelectedQuarterNum(initialQuarterNumber);
        const computedHizb = Math.floor((initialQuarterNumber - 1) / 4) + 1;
        setSelectedHizbNum(computedHizb);
      } else if (initialHizbNumber) {
        setSelectedHizbNum(initialHizbNumber);
        setSelectedQuarterNum(undefined);
      }
      if (initialJuzNumber) setSelectedJuzNum(initialJuzNumber);
    }
  }, [isOpen, initialType, initialSajdahNumber, initialHizbNumber, initialQuarterNumber, initialJuzNumber]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSajdah = ALL_15_SAJDAHS[selectedSajdahIdx] || ALL_15_SAJDAHS[0];
  const currentJuzInfo = JUZ_INDEX.find(j => j.number === selectedJuzNum) || JUZ_INDEX[0];
  const currentJuzName = JUZ_NAMES[selectedJuzNum] || { title: `الجزء ${selectedJuzNum}`, commonName: `الجزء ${selectedJuzNum}`, summary: '' };
  const currentJuzPages = JUZ_PAGE_RANGES[selectedJuzNum] || { madinahStart: 1, madinahEnd: 21, shamarlyStart: 1, shamarlyEnd: 18, surahs: [] };
  const currentHizb = HIZB_INDEX.find(h => h.number === selectedHizbNum) || HIZB_INDEX[0];

  const handleCopyDuaa = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDuaa(true);
      setTimeout(() => setCopiedDuaa(false), 2000);
    });
  };

  const handleNavigate = (surah: number, ayah: number, page?: number) => {
    onClose();
    if (onNavigateToAyah) {
      onNavigateToAyah(surah, ayah);
    } else {
      window.location.hash = `#/surah/${surah}?ayah=${ayah}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div 
        className="bg-surface border border-border-default rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-text-primary"
        role="dialog"
        aria-modal="true"
        aria-label="دليل الرموز القرآنية"
      >
        {/* Header with Navigation Tabs */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-surface-subtle/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-primary/10 text-primary text-xl font-bold">
                {activeTab === 'sajdah' ? '۩' : (activeTab === 'hizb' ? '۞' : '📖')}
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-quran-title text-primary-text-strong">
                  دليل الرموز والعلامات القرآنية
                </h2>
                <p className="text-xs text-text-muted">
                  شرح كامل وتفصيلي لسجدات التلاوة والأحزاب والأجزاء
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer border border-border-subtle"
              title="إغلاق (Esc)"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* Segmented Control for Mode Switching */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface rounded-2xl border border-border-default text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('sajdah')}
              className={`py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'sajdah' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <span className="text-base font-serif">۩</span>
              <span>سجدات التلاوة ({ALL_15_SAJDAHS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('hizb')}
              className={`py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'hizb' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <span className="text-base font-serif">۞</span>
              <span>الأحزاب والأرباع</span>
            </button>
            <button
              onClick={() => setActiveTab('juz')}
              className={`py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'juz' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <span>📖</span>
              <span>الأجزاء الثلاثون</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: SAJDAH */}
          {activeTab === 'sajdah' && (
            <div className="space-y-5 animate-fade-in">
              {/* Sajdah Selector Carousel / Pills */}
              <div>
                <label className="text-xs font-bold text-text-muted mb-2 block">
                  اختر سجدة التلاوة من بين الـ 15 سجدة في المصحف:
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                  {ALL_15_SAJDAHS.map((sajdah, idx) => (
                    <button
                      key={sajdah.sajdahNumber}
                      onClick={() => setSelectedSajdahIdx(idx)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        idx === selectedSajdahIdx
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-105'
                          : 'bg-surface-subtle border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <span>۩</span>
                      <span>{sajdah.sajdahNumber}. {sajdah.surahName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Sajdah Details Card */}
              <div className="bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="absolute top-2 left-3 text-amber-500/20 text-6xl font-serif select-none pointer-events-none">
                  ۩
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {currentSajdah.sajdahNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-primary-text-strong">
                        سجدة سورة {currentSajdah.surahName} (الآية {currentSajdah.ayahNumber})
                      </h3>
                      <p className="text-xs text-text-muted">
                        السجدة رقم {currentSajdah.sajdahNumber} من 15 سجدة في القرآن الكريم
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    currentSajdah.agreementType === 'متفق عليها'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
                  }`}>
                    {currentSajdah.agreementType}
                  </span>
                </div>

                {/* Location Tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mb-4 text-text-secondary">
                  <span className="bg-surface px-2.5 py-1 rounded-lg border border-border-default">
                    الجزء: <strong className="text-primary font-bold">{currentSajdah.juz}</strong>
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-lg border border-border-default">
                    الحزب: <strong className="text-primary font-bold">{currentSajdah.hizb}</strong>
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-lg border border-border-default">
                    مصحف المدينة: صـ <strong className="text-primary font-bold">{currentSajdah.madinahPage}</strong>
                  </span>
                  <span className="bg-surface px-2.5 py-1 rounded-lg border border-border-default">
                    مصحف الشمرلي: صـ <strong className="text-primary font-bold">{currentSajdah.shamarlyPage}</strong>
                  </span>
                </div>

                {/* Ayah Verse Text */}
                <div className="bg-surface p-4 rounded-xl border border-amber-500/30 mb-3 shadow-xs">
                  <p className="text-sm text-text-muted mb-1.5 font-bold">نص الآية الكريمة وموضع السجود:</p>
                  <blockquote className="font-quran-uthmani text-base sm:text-xl leading-loose text-text-primary text-center py-2 px-1">
                    « {currentSajdah.ayahText} »
                  </blockquote>
                </div>

                {/* Significance & Fiqh Note */}
                <div className="space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed bg-surface/60 p-3 rounded-xl border border-border-subtle">
                  <div>
                    <strong className="text-primary-text font-bold">المعنى والدلالة: </strong>
                    <span>{currentSajdah.significance}</span>
                  </div>
                  <div>
                    <strong className="text-primary-text font-bold">الحكم الفقهي: </strong>
                    <span>{currentSajdah.agreementNotes}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleNavigate(currentSajdah.surahNumber, currentSajdah.ayahNumber, currentSajdah.madinahPage)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>الانتقال إلى موضع السجدة</span>
                    <span>←</span>
                  </button>
                </div>
              </div>

              {/* Supplications Box */}
              <div className="bg-surface-subtle border border-border-default rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm sm:text-base text-text-primary">
                      أدعية سجود التلاوة المأثورة
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyDuaa(`${SAJDAH_DUAA.primary}\n${SAJDAH_DUAA.secondary}`)}
                    className="text-xs flex items-center gap-1 text-primary hover:underline cursor-pointer font-bold"
                  >
                    {copiedDuaa ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                    <span>{copiedDuaa ? 'تم النسخ!' : 'نسخ الأدعية'}</span>
                  </button>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle space-y-1.5">
                  <p className="font-serif text-sm sm:text-base text-text-primary font-bold leading-relaxed">
                    « {SAJDAH_DUAA.primary} »
                  </p>
                  <p className="text-[11px] text-text-muted">{SAJDAH_DUAA.primarySource}</p>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle space-y-1.5">
                  <p className="font-serif text-sm sm:text-base text-text-primary font-bold leading-relaxed">
                    « {SAJDAH_DUAA.secondary} »
                  </p>
                  <p className="text-[11px] text-text-muted">{SAJDAH_DUAA.secondarySource}</p>
                </div>

                <p className="text-xs text-text-muted leading-relaxed pt-1">
                  💡 {SAJDAH_DUAA.ruling}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: HIZB & QUARTER */}
          {activeTab === 'hizb' && (
            <div className="space-y-5 animate-fade-in">
              {/* Hizb Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-text-muted">
                    اختر الحزب القرآني (1 - 60):
                  </label>
                  <span className="text-xs font-bold text-primary font-mono">
                    الحزب {selectedHizbNum} من 60
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                  {HIZB_INDEX.map((hizb) => (
                    <button
                      key={hizb.number}
                      onClick={() => {
                        setSelectedHizbNum(hizb.number);
                        setSelectedQuarterNum(undefined);
                      }}
                      className={`shrink-0 w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                        hizb.number === selectedHizbNum
                          ? 'bg-primary text-white border-primary shadow-xs scale-105'
                          : 'bg-surface-subtle border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">حزب</span>
                      <span>{hizb.number}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hizb & Quarter Card */}
              {(() => {
                const juzOfHizb = Math.floor((selectedHizbNum - 1) / 2) + 1;
                const startQuarterIdx = (selectedHizbNum - 1) * 4 + 1;
                const quarters = [
                  { index: startQuarterIdx, label: 'بداية الحزب (الربع الأول)' },
                  { index: startQuarterIdx + 1, label: 'ربع الحزب (الربع الثاني)' },
                  { index: startQuarterIdx + 2, label: 'نصف الحزب (الربع الثالث)' },
                  { index: startQuarterIdx + 3, label: 'ثلاثة أرباع الحزب (الربع الرابع)' }
                ];

                return (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl text-primary font-serif">۞</span>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-primary-text-strong">
                            الحزب {selectedHizbNum} (الجزء {juzOfHizb})
                          </h3>
                          <p className="text-xs text-text-muted">
                            يبدأ من: {currentHizb.startSurahName} (الآية {currentHizb.startAyah})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNavigate(currentHizb.startSurah, currentHizb.startAyah)}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>فتح الحزب</span>
                        <span>←</span>
                      </button>
                    </div>

                    {/* Explanatory notes about Hizbs and Quarters in Quran */}
                    <div className="text-xs text-text-secondary leading-relaxed bg-surface p-3.5 rounded-xl border border-border-subtle space-y-1">
                      <p>
                        📌 <strong>التقسيم القرآني:</strong> ينقسم القرآن الكريم إلى <strong>30 جزءاً</strong>، وكل جزء يحتوي على <strong>حزبين</strong> (المجموع 60 حزباً).
                      </p>
                      <p>
                        ۞ <strong>أرباع الأحزاب:</strong> ينقسم كل حزب إلى <strong>4 أرباع</strong>، بمجموع <strong>240 ربعاً</strong> في المصحف الشريف، ويرمز لبداية كل ربع في المصحف بالنجمة الثمانية «۞».
                      </p>
                    </div>

                    {/* 4 Quarters Breakdown for this Hizb */}
                    <div>
                      <h4 className="text-xs font-bold text-text-primary mb-2.5 flex items-center gap-1.5">
                        <span>أرباع الحزب {selectedHizbNum}:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {quarters.map((q) => {
                          const info = getHizbQuarterLabel(q.index);
                          const isSelectedQ = selectedQuarterNum === q.index;
                          return (
                            <div 
                              key={q.index}
                              onClick={() => setSelectedQuarterNum(q.index)}
                              className={`p-3 bg-surface rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                isSelectedQ 
                                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs' 
                                  : 'border-border-default hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold flex items-center gap-1 ${isSelectedQ ? 'text-primary-text-strong' : 'text-primary'}`}>
                                  <span>۞</span>
                                  <span>{q.label}</span>
                                </span>
                                <span className="text-[10px] font-mono text-text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                                  الربع {q.index} من 240
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary line-clamp-1 mb-2">
                                {info.fullLabel}
                              </p>
                              {q.index === startQuarterIdx && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(currentHizb.startSurah, currentHizb.startAyah);
                                  }}
                                  className="text-[11px] font-bold text-primary hover:underline text-right cursor-pointer"
                                >
                                  الانتقال إلى بداية هذا الربع ←
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: JUZ */}
          {activeTab === 'juz' && (
            <div className="space-y-5 animate-fade-in">
              {/* Juz Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-text-muted">
                    اختر الجزء القرآني (1 - 30):
                  </label>
                  <span className="text-xs font-bold text-primary font-mono">
                    الجزء {selectedJuzNum} من 30
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                  {JUZ_INDEX.map((juz) => (
                    <button
                      key={juz.number}
                      onClick={() => setSelectedJuzNum(juz.number)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                        juz.number === selectedJuzNum
                          ? 'bg-primary text-white border-primary shadow-xs scale-105'
                          : 'bg-surface-subtle border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <span>{juz.number}.</span>
                      <span>{JUZ_NAMES[juz.number]?.commonName || `الجزء ${juz.number}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Juz Information Card */}
              <div className="bg-surface-subtle border border-border-default rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base border border-primary/20">
                      {selectedJuzNum}
                    </span>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-primary-text-strong">
                        {currentJuzName.title} ({currentJuzName.commonName})
                      </h3>
                      <p className="text-xs text-text-muted">
                        يبدأ من: {currentJuzInfo.startSurahName} (الآية {currentJuzInfo.startAyah})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigate(currentJuzInfo.startSurah, currentJuzInfo.startAyah, currentJuzPages.madinahStart)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>فتح بداية الجزء</span>
                    <span>←</span>
                  </button>
                </div>

                {/* Juz Summary */}
                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle text-xs sm:text-sm text-text-secondary leading-relaxed">
                  <strong className="text-primary-text block mb-1">موضوعات وهدايات هذا الجزء:</strong>
                  <p>{currentJuzName.summary}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle text-center">
                    <span className="text-text-muted block text-[11px] mb-0.5">الأحزاب التابعة:</span>
                    <strong className="text-primary font-bold text-sm">
                      الحزب {(selectedJuzNum - 1) * 2 + 1} و {(selectedJuzNum - 1) * 2 + 2}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle text-center">
                    <span className="text-text-muted block text-[11px] mb-0.5">عدد الأحزاب:</span>
                    <strong className="text-primary font-bold text-sm">2 حزب (8 أرباع)</strong>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle text-center">
                    <span className="text-text-muted block text-[11px] mb-0.5">مصحف المدينة:</span>
                    <strong className="text-primary font-bold text-sm">
                      صـ {currentJuzPages.madinahStart} - {currentJuzPages.madinahEnd}
                    </strong>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle text-center">
                    <span className="text-text-muted block text-[11px] mb-0.5">مصحف الشمرلي:</span>
                    <strong className="text-primary font-bold text-sm">
                      صـ {currentJuzPages.shamarlyStart} - {currentJuzPages.shamarlyEnd}
                    </strong>
                  </div>
                </div>

                {/* Surahs in this Juz */}
                <div>
                  <h4 className="text-xs font-bold text-text-primary mb-2">
                    السور المتضمنة في هذا الجزء:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentJuzPages.surahs.map((sName, sIdx) => {
                      const matchedSurah = QURAN_INDEX.find(s => s.name === sName || s.name.includes(sName));
                      return (
                        <button
                          key={sIdx}
                          onClick={() => {
                            if (matchedSurah) {
                              onClose();
                              window.location.hash = `#/surah/${matchedSurah.number}`;
                            }
                          }}
                          className="px-2.5 py-1 bg-surface hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-semibold border border-border-subtle transition-colors cursor-pointer"
                        >
                          سورة {sName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-border-default bg-surface-subtle flex items-center justify-between">
          <p className="text-[11px] text-text-muted">
            {activeTab === 'sajdah' ? '۩ 15 موضعاً لسجدة التلاوة في المصحف' : (activeTab === 'hizb' ? '۞ 60 حزباً و240 ربعاً' : '📖 30 جزءاً في القرآن الكريم')}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-text-primary rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuranSymbolInfoModal;
