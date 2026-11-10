import React, { useState, useEffect, useMemo } from 'react';
import type { SurahReference } from '../types';
import SurahListItem from './SurahListItem';
import {
  BookOpenIcon,
  QueueListIcon,
  JuzOneIcon,
  PaperIcon,
  ClearIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  ArrowLeftIcon,
} from './icons';
import { useSettingsContext } from '../contexts/SettingsContext';
import { normalizeArabicText, formatSurahNameForDisplay, normalizeDigits } from '../utils/text';
import { ALL_604_PAGES_METADATA, PageMetadata } from '../data/madinahPagesData';
import { 
  ALL_15_SAJDAHS, 
  SAJDAH_DUAA, 
  JUZ_NAMES, 
  JUZ_PAGE_RANGES, 
  SajdahInfo 
} from '../data/quranSymbolsData';

interface HomeViewProps {
  surahList: SurahReference[];
  juzList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
  hizbList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
}

type ActiveTab = 'surahs' | 'pages' | 'juz' | 'hizbs' | 'symbols';

// Stop/Waqf and notation symbols dictionary
const QURAN_NOTATION_SIGNS = [
  {
    symbol: 'م',
    name: 'الوقف اللازم',
    meaning: 'يلزم الوقف عنده قطعا للبس المعنى، وإذا وصل القارئ يوهم معنى غير مراد.',
    example: '﴿إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ ۘ وَالْمَوْتَىٰ يَبْعَثُهُمُ اللَّهُ﴾ [الأنعام: 36]'
  },
  {
    symbol: 'لا',
    name: 'الوقف الممنوع',
    meaning: 'يمنع الوقف عليه لأن ما بعده متصل بما قبله لفظاً ومعنى، فلا يحسن الوقف إلا إذا كان رأس آية.',
    example: '﴿الَّذِينَ تَتَوَفَّاهُمُ الْمَلَائِكَةُ طَيِّبِينَ ۙ يَقُولُونَ سَلَامٌ عَلَيْكُمُ﴾ [النحل: 32]'
  },
  {
    symbol: 'ج',
    name: 'الوقف الجائز',
    meaning: 'يجوز الوقف والوصل باستواء الطرفين، ولا يترتب على أحدهما فساد في المعنى.',
    example: '﴿نَحْنُ نَقُصُّ عَلَيْكَ نَبَأَهُم بِالْحَقِّ ۚ إِنَّهُمْ فِتْيَةٌ آمَنُوا بِرَبِّهِمْ﴾ [الكهف: 13]'
  },
  {
    symbol: 'صلى',
    name: 'الوصل أولى مع جواز الوقف',
    meaning: 'يجوز الوقف مع كون الاستمرار في القراءة والوصل أتم وأولى لمعنى الآية.',
    example: '﴿وَإِن يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ ۖ وَإِن يَمْسَسْكَ بِخَيْرٍ﴾ [الأنعام: 17]'
  },
  {
    symbol: 'قلى',
    name: 'الوقف أولى مع جواز الوصل',
    meaning: 'يجوز الوصل مع كون الوقف أتم وأظهر للتمام، وهو أولى.',
    example: '﴿قُل رَّبِّي أَعْلَمُ بِعِدَّتِهِم مَّا يَعْلَمُهُمْ إِلَّا قَلِيلٌ ۗ فَلَا تُمَارِ فِيهِمْ﴾ [الكهف: 22]'
  },
  {
    symbol: '∴ ∴',
    name: 'تعانق الوقف (المراقبة)',
    meaning: 'نقطتان ثلاثيتان؛ إذا وُقف على الموضع الأول امتنع الوقف على الموضع الثاني، والعكس بالعكس.',
    example: '﴿ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ﴾ [البقرة: 2]'
  },
  {
    symbol: '۞',
    name: 'علامة الحزب وأرباعه',
    meaning: 'تشير إلى بداية الحزب الجديد أو ربع الحزب أو نصفه أو ثلاثة أرباعه (240 ربعاً في القرآن).',
    example: 'توضع في حاشية الآية أو مطلعها للإشارة لمقدار التقسيم القرآني.'
  },
  {
    symbol: '۩',
    name: 'علامة سجدة التلاوة',
    meaning: 'توضع عند ختام الآية التي فيها أمر بالسجود أو خضوع الخلائق لله تعالى، ويُسن عندها السجود.',
    example: 'تكررت في المصحف الشريف 15 مرة في 14 سورة كريمة.'
  }
];

const HomeView: React.FC<HomeViewProps> = ({ surahList, juzList, hizbList }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('surahs');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Pages Tab Filter States
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [pageQuickFilter, setPageQuickFilter] = useState<'all' | 'sajdah' | 'juz_start'>('all');
  
  // Duaa copy state
  const [copiedDuaaPrimary, setCopiedDuaaPrimary] = useState(false);
  const [copiedDuaaSecondary, setCopiedDuaaSecondary] = useState(false);

  const { setFontStyle, setSelectedEdition } = useSettingsContext();

  // Listen to live typing from search bar
  useEffect(() => {
    const handleLiveSearch = (e: any) => {
      const q = typeof e?.detail?.query === 'string' ? e.detail.query : '';
      setSearchFilter(q);
      if (q.trim()) {
        setActiveTab('surahs');
      }
    };

    window.addEventListener('quran-live-search', handleLiveSearch);
    return () => window.removeEventListener('quran-live-search', handleLiveSearch);
  }, []);

  // Sync tab with URL hash if specified (e.g. #/?tab=symbols)
  useEffect(() => {
    const checkHashTab = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=symbols') || hash.includes('tab=sajdah')) {
        setActiveTab('symbols');
      } else if (hash.includes('tab=pages')) {
        setActiveTab('pages');
      } else if (hash.includes('tab=juz')) {
        setActiveTab('juz');
      } else if (hash.includes('tab=hizbs')) {
        setActiveTab('hizbs');
      }
    };
    checkHashTab();
    window.addEventListener('hashchange', checkHashTab);
    return () => window.removeEventListener('hashchange', checkHashTab);
  }, []);

  const enableUthmaniPageMode = () => {
    setFontStyle('uthmani');
    setSelectedEdition('quran-uthmani-quran-academy');
  };

  const handleCopyDuaa = (text: string, isPrimary: boolean) => {
    navigator.clipboard.writeText(text).then(() => {
      if (isPrimary) {
        setCopiedDuaaPrimary(true);
        setTimeout(() => setCopiedDuaaPrimary(false), 2000);
      } else {
        setCopiedDuaaSecondary(true);
        setTimeout(() => setCopiedDuaaSecondary(false), 2000);
      }
    });
  };

  // Filter surahs in real-time when user types in search bar
  const filteredSurahs = useMemo(() => {
    const trimmed = searchFilter.trim();
    if (!trimmed) return surahList;

    const normQ = normalizeArabicText(trimmed);
    const cleanQ = trimmed.replace(/^(سُورَةُ|سورة)\s*/, '').trim();
    const normCleanQ = normalizeArabicText(cleanQ);
    const queryNum = parseInt(normalizeDigits(trimmed), 10);

    return surahList.filter(surah => {
      if (!isNaN(queryNum) && surah.number === queryNum) return true;
      const rawName = surah.name || '';
      const normName = normalizeArabicText(rawName);
      const cleanName = formatSurahNameForDisplay(rawName);
      const normCleanName = normalizeArabicText(cleanName);
      const eng = (surah.englishName || '').toLowerCase();
      const engTrans = (surah.englishNameTranslation || '').toLowerCase();
      const lower = trimmed.toLowerCase();

      return (
        normName.includes(normQ) ||
        normCleanName.includes(normCleanQ) ||
        normName.includes(normCleanQ) ||
        normCleanName.includes(normQ) ||
        eng.includes(lower) ||
        engTrans.includes(lower)
      );
    });
  }, [surahList, searchFilter]);

  // Filtered pages for Pages tab
  const filteredPages = useMemo(() => {
    let result = ALL_604_PAGES_METADATA;

    if (pageQuickFilter === 'sajdah') {
      result = result.filter(p => !!p.sajdah);
    } else if (pageQuickFilter === 'juz_start') {
      result = result.filter(p => p.isJuzStart);
    }

    const q = pageSearchQuery.trim();
    if (q) {
      const qNum = parseInt(normalizeDigits(q), 10);
      const normQ = normalizeArabicText(q);
      result = result.filter(p => {
        if (!isNaN(qNum) && p.pageNumber === qNum) return true;
        const normSurah = normalizeArabicText(p.surahName);
        return normSurah.includes(normQ);
      });
    }

    return result;
  }, [pageQuickFilter, pageSearchQuery]);

  const TabButton: React.FC<{ tab: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }> = ({ 
    tab, label, icon, badge 
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-2 text-xs sm:text-base md:text-lg font-semibold transition-all duration-200 border-b-4 cursor-pointer whitespace-nowrap ${
        activeTab === tab
          ? 'text-primary border-primary bg-primary/5 font-bold'
          : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
      }`}
      aria-current={activeTab === tab}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
      {badge !== undefined && (
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-xs font-mono font-bold ${
          activeTab === tab ? 'bg-primary text-white' : 'bg-surface-subtle text-text-muted border border-border-subtle'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 animate-fade-in space-y-4" dir="rtl">
      {/* Live Surah Search Feedback Indicator */}
      {searchFilter.trim() && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/25 rounded-xl text-xs md:text-sm text-primary font-bold animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <SearchIcon className="w-4 h-4 shrink-0 text-primary" />
            <span>
              تصفية السور: «{searchFilter.trim()}» ({filteredSurahs.length} سورة)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('');
              window.dispatchEvent(new CustomEvent('quran-live-search', { detail: { query: '' } }));
              const input = document.getElementById('search-quran-input') as HTMLInputElement | null;
              if (input) input.value = '';
            }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-surface text-text-secondary hover:text-text-primary border border-border-default hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <ClearIcon className="w-3.5 h-3.5" />
            <span>إلغاء التصفية</span>
          </button>
        </div>
      )}

      {/* Tabs Bar: Surahs, Pages, Juz, Hizbs, and Symbols & Sajdahs */}
      <div className="bg-surface rounded-2xl shadow-xs border border-border-default overflow-hidden">
        <div className="flex items-stretch overflow-x-auto no-scrollbar">
          <TabButton tab="surahs" label="السور" icon={<BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5" />} badge={114} />
          <TabButton tab="pages" label="صفحات" icon={<PaperIcon className="w-4 h-4 sm:w-5 sm:h-5" />} badge={604} />
          <TabButton tab="juz" label="الأجزاء" icon={<JuzOneIcon className="w-4 h-4 sm:w-5 sm:h-5" />} badge={30} />
          <TabButton tab="hizbs" label="الأحزاب" icon={<QueueListIcon className="w-4 h-4 sm:w-5 sm:h-5" />} badge={60} />
          <TabButton 
            tab="symbols" 
            label="الرموز والسجدات" 
            icon={<span className="text-base sm:text-lg font-serif text-amber-500 font-bold">۩</span>} 
            badge={15}
          />
        </div>
      </div>

      {/* TAB 1: السور (Surahs) */}
      {activeTab === 'surahs' && (
        <div className="animate-fade-in">
          <ul className="grid gap-2.5 sm:gap-3 grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredSurahs.length > 0 ? (
              filteredSurahs.map(surah => (
                <SurahListItem key={surah.number} surah={surah} />
              ))
            ) : (
              <li className="col-span-full py-12 text-center text-text-secondary bg-surface rounded-2xl border border-border-default p-6 space-y-2">
                <p className="text-base font-bold text-text-primary">
                  لم يتم العثور على سورة باسم «{searchFilter.trim()}»
                </p>
                <p className="text-xs text-text-muted">
                  اضغط مفتاح Enter أو زر البحث في الأعلى للبحث الشامل في آيات المصحف الشريف
                </p>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* TAB 2: صفحات (Pages - Explained & Interactive) */}
      {activeTab === 'pages' && (
        <div className="animate-fade-in space-y-3">
          {/* Explanatory Header & Filter Bar */}
          <div className="bg-surface rounded-2xl p-3.5 sm:p-4 border border-border-default shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary font-quran-title">
                  صفحات المصحف الشريف (604 صفحة)
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  مرتبة بحسب مصحف المدينة النبوية، مع بيان السورة والجزء ومواضع سجدات التلاوة ومطالع الأجزاء.
                </p>
              </div>

              {/* Quick Filter Chips */}
              <div className="inline-flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-border-subtle text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPageQuickFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pageQuickFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  الكل (604)
                </button>
                <button
                  type="button"
                  onClick={() => setPageQuickFilter('sajdah')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    pageQuickFilter === 'sajdah'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                  title="صفحات سجدات التلاوة الـ 15"
                >
                  <span>السجدات</span>
                  <span className="font-serif">۩ (15)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPageQuickFilter('juz_start')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pageQuickFilter === 'juz_start'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="صفحات بداية الأجزاء الثلاثين"
                >
                  مطالع الأجزاء (30)
                </button>
              </div>
            </div>

            {/* Live Search within Pages */}
            <div className="relative">
              <input
                type="text"
                value={pageSearchQuery}
                onChange={(e) => setPageSearchQuery(e.target.value)}
                placeholder="ابحث برقم الصفحة (مثال: 450) أو اسم السورة (مثال: الكهف)..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-surface-subtle border border-border-default focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all text-text-primary"
              />
              {pageSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPageSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  title="مسح البحث"
                >
                  <ClearIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid of 604 Pages with rich explanations */}
          <ul className="grid gap-2 sm:gap-2.5 grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {filteredPages.map(pageMeta => {
              const { pageNumber, surahName, juzNumber, isJuzStart, sajdah } = pageMeta;
              return (
                <li key={`page-${pageNumber}`}>
                  <a
                    href={`#/page/${pageNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      enableUthmaniPageMode();
                      window.location.hash = `#/page/${pageNumber}`;
                    }}
                    className={`group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer h-full ${
                      sajdah
                        ? 'bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/40 shadow-xs ring-1 ring-amber-500/20'
                        : isJuzStart
                        ? 'bg-primary/5 hover:bg-primary/10 border-primary/40 shadow-xs'
                        : 'bg-surface hover:bg-surface-hover border-border-default hover:border-primary/50 shadow-2xs'
                    }`}
                    title={`صفحة ${pageNumber} • سورة ${surahName} • الجزء ${juzNumber}${sajdah ? ` • سجدة تلاوة: آية ${sajdah.ayahNumber}` : ''}`}
                    aria-label={`صفحة ${pageNumber}`}
                  >
                    {/* Top row: Page number & Badges */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                        {pageNumber}
                      </span>

                      {sajdah ? (
                        <span 
                          className="text-xs font-serif text-amber-500 font-bold bg-amber-500/15 px-1 py-0.2 rounded"
                          title={`سجدة تلاوة: سورة ${sajdah.surahName} (${sajdah.ayahNumber})`}
                        >
                          ۩
                        </span>
                      ) : isJuzStart ? (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-1 py-0.2 rounded">
                          مطلع
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted font-mono">
                          جـ{juzNumber}
                        </span>
                      )}
                    </div>

                    {/* Bottom row: Surah Name on that page */}
                    <div className="mt-1 pt-1 border-t border-border-subtle/50 text-right">
                      <span className="text-[11px] sm:text-xs font-bold text-text-primary group-hover:text-primary transition-colors block truncate">
                        {surahName}
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* TAB 3: الأجزاء (Juz - Rich Pedagogical Cards) */}
      {activeTab === 'juz' && (
        <div className="animate-fade-in space-y-3">
          <div className="bg-surface rounded-2xl p-3.5 sm:p-4 border border-border-default shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-text-primary font-quran-title">
              أجزاء القرآن الكريم الثلاثون (30 جزءاً)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              مبيّنة بأسمائها الشائعة (مثل جزء عمّ وجزء تبارك)، نطاق صفحاتها وسورها، وموجز هدايات وموضوعات كل جزء.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {juzList.map(juz => {
              const nameInfo = JUZ_NAMES[juz.number] || { title: `الجزء ${juz.number}`, commonName: `الجزء ${juz.number}`, summary: '' };
              const pageRange = JUZ_PAGE_RANGES[juz.number] || { madinahStart: 1, madinahEnd: 21, shamarlyStart: 1, shamarlyEnd: 18, surahs: [] };
              const sajdahsInJuz = ALL_15_SAJDAHS.filter(s => s.juz === juz.number);

              return (
                <div
                  key={`juz-card-${juz.number}`}
                  className="bg-surface border border-border-default hover:border-primary/50 rounded-2xl p-4 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-border-subtle pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-bold text-text-primary">
                            {nameInfo.title}
                          </span>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                            {nameInfo.commonName}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted mt-1 block">
                          الصفحات: ص {pageRange.madinahStart} إلى ص {pageRange.madinahEnd} (مصحف المدينة)
                        </span>
                      </div>
                      <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center font-mono text-sm shrink-0">
                        {juz.number}
                      </span>
                    </div>

                    {/* Surahs included */}
                    <div className="text-xs text-text-secondary">
                      <span className="font-bold text-text-primary">السور المندرجة: </span>
                      <span>{pageRange.surahs.join('، ')}</span>
                    </div>

                    {/* Summary */}
                    {nameInfo.summary && (
                      <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle p-2.5 rounded-xl border border-border-subtle">
                        {nameInfo.summary}
                      </p>
                    )}

                    {/* Sajdah Indicator if present */}
                    {sajdahsInJuz.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        <span className="font-serif font-bold text-sm">۩</span>
                        <span className="font-semibold">
                          يشتمل على {sajdahsInJuz.length} سجدة تلاوة: {sajdahsInJuz.map(s => `سورة ${s.surahName}`).join('، ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Read Juz Button */}
                  <a
                    href={`#/surah/${juz.startSurah}?ayah=${juz.startAyah}&navOnly=true`}
                    onClick={(e) => {
                      e.preventDefault();
                      enableUthmaniPageMode();
                      window.location.hash = `#/surah/${juz.startSurah}?ayah=${juz.startAyah}&navOnly=true`;
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>قراءة الجزء من مطلع {formatSurahNameForDisplay(juz.startSurahName)}</span>
                    <ArrowLeftIcon className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: الأحزاب (Hizbs - 60 Hizbs) */}
      {activeTab === 'hizbs' && (
        <div className="animate-fade-in space-y-3">
          <div className="bg-surface rounded-2xl p-3.5 sm:p-4 border border-border-default shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-text-primary font-quran-title">
              أحزاب القرآن الكريم الستون (60 حزباً)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              كل جزء ينقسم إلى حزبين، وكل حزب ينقسم إلى 4 أرباع (بداية الحزب، ربع، نصف، ثلاثة أرباع).
            </p>
          </div>

          <div className="grid gap-2.5 sm:gap-3 grid-cols-2 min-[450px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {hizbList.map(hizb => {
              const belongingJuz = Math.floor((hizb.number - 1) / 2) + 1;
              return (
                <div
                  key={`hizb-${hizb.number}`}
                  className="bg-surface border border-border-default hover:border-primary/50 rounded-xl p-3 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-2 text-right"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base text-text-primary">
                        الحزب {hizb.number}
                      </span>
                      <span className="text-amber-500 font-serif font-bold text-base">۞</span>
                    </div>

                    <span className="text-[11px] text-text-muted block">
                      الجزء {belongingJuz}
                    </span>

                    <span className="text-xs text-text-secondary font-medium block">
                      يبدأ من سورة {formatSurahNameForDisplay(hizb.startSurahName)} (آية {hizb.startAyah})
                    </span>
                  </div>

                  <a
                    href={`#/surah/${hizb.startSurah}?ayah=${hizb.startAyah}&navOnly=true`}
                    onClick={(e) => {
                      e.preventDefault();
                      enableUthmaniPageMode();
                      window.location.hash = `#/surah/${hizb.startSurah}?ayah=${hizb.startAyah}&navOnly=true`;
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-surface-subtle hover:bg-primary hover:text-white text-text-primary font-bold text-xs text-center border border-border-default hover:border-primary transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>قراءة الحزب</span>
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: الرموز والعلامات القرآنية وسجدات التلاوة (Integrated Symbols Tab) */}
      {activeTab === 'symbols' && (
        <div className="animate-fade-in space-y-6">
          {/* Section 1: علامات وضوابط الوقف في المصحف الشريف */}
          <section className="bg-surface rounded-2xl p-4 sm:p-5 border border-border-default shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <SparklesIcon className="w-5 h-5" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-text-primary font-quran-title">
                  علامات الوقف والمصطلحات في المصحف الشريف
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                دليل شامل لعلامات وضوابط الوقف والوصل المعتمدة في مصحف المدينة النبوية لمعرفة المعنى التام وتجنب الوقف الممنوع.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {QURAN_NOTATION_SIGNS.map((sign, idx) => (
                <div 
                  key={`sign-${idx}`}
                  className="bg-surface-subtle rounded-xl p-3 border border-border-subtle space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-bold text-text-primary">
                        {sign.name}
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-serif font-bold text-lg flex items-center justify-center border border-amber-500/25">
                        {sign.symbol}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {sign.meaning}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border-subtle/60 text-[11px] text-text-muted font-uthmani">
                    {sign.example}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: دعاء سجود التلاوة وأحكامه الفقهية */}
          <section className="bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-serif text-amber-500">۩</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary font-quran-title">
                    أدعية سجود التلاوة وصفتها
                  </h3>
                  <p className="text-xs text-text-secondary">
                    يُسن للمسلم عند تلاوة آية السجدة أو سماعها أن يسجد سجدة واحدة ويقول ما تيسر من هذه الأدعية النبوية.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {/* Primary Duaa */}
              <div className="bg-surface rounded-xl p-3.5 border border-border-default flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-primary">الدعاء المأثور الأول (الأشهر)</span>
                    <button
                      type="button"
                      onClick={() => handleCopyDuaa(SAJDAH_DUAA.primary, true)}
                      className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedDuaaPrimary ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      <span>{copiedDuaaPrimary ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-uthmani text-text-primary leading-relaxed">
                    «{SAJDAH_DUAA.primary}»
                  </p>
                </div>
                <span className="text-[11px] text-text-muted block pt-1 border-t border-border-subtle">
                  {SAJDAH_DUAA.primarySource}
                </span>
              </div>

              {/* Secondary Duaa */}
              <div className="bg-surface rounded-xl p-3.5 border border-border-default flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-primary">الدعاء المأثور الثاني (دعاء داود عليه السلام)</span>
                    <button
                      type="button"
                      onClick={() => handleCopyDuaa(SAJDAH_DUAA.secondary, false)}
                      className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors cursor-pointer"
                    >
                      {copiedDuaaSecondary ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      <span>{copiedDuaaSecondary ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-uthmani text-text-primary leading-relaxed">
                    «{SAJDAH_DUAA.secondary}»
                  </p>
                </div>
                <span className="text-[11px] text-text-muted block pt-1 border-t border-border-subtle">
                  {SAJDAH_DUAA.secondarySource}
                </span>
              </div>
            </div>

            {/* Ruling */}
            <p className="text-xs text-text-secondary leading-relaxed bg-surface/70 p-3 rounded-xl border border-border-subtle">
              <strong className="text-text-primary font-bold">الحكم الفقهي: </strong>
              {SAJDAH_DUAA.ruling}
            </p>
          </section>

          {/* Section 3: سجدات التلاوة الـ 15 كاملة ومفصلة */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-quran-title">
                  سجدات التلاوة الـ 15 في القرآن الكريم
                </h3>
                <p className="text-xs text-text-secondary">
                  مواضع السجود الـ 15 كاملة بنصوص آياتها ومواضعها وأحكامها الفقهية ودلالاتها الإيمانية.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                15 سجدة في 14 سورة
              </span>
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {ALL_15_SAJDAHS.map((sajdah: SajdahInfo) => (
                <div 
                  key={`sajdah-card-${sajdah.sajdahNumber}`}
                  className="bg-surface rounded-2xl border border-border-default hover:border-amber-500/40 p-4 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Top Row */}
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold font-mono text-xs flex items-center justify-center">
                          {sajdah.sajdahNumber}
                        </span>
                        <div>
                          <span className="font-bold text-sm sm:text-base text-text-primary block">
                            سورة {sajdah.surahName}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            الآية {sajdah.ayahNumber} • ص {sajdah.madinahPage} • جـ {sajdah.juz}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sajdah.agreementType === 'متفق عليها'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      }`}>
                        {sajdah.agreementType}
                      </span>
                    </div>

                    {/* Ayah Text in Uthmani Script */}
                    <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle text-right">
                      <p className="text-sm font-uthmani text-text-primary leading-relaxed">
                        {sajdah.ayahText}
                      </p>
                      <div className="mt-2 pt-1 border-t border-border-subtle/50 flex items-center justify-between text-xs">
                        <span className="text-text-muted text-[11px]">موضع السجود:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 font-uthmani">
                          «{sajdah.sajdahWord}»
                        </span>
                      </div>
                    </div>

                    {/* Significance & Fiqh Note */}
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {sajdah.significance}
                    </p>
                  </div>

                  {/* Direct Navigate to Ayah Button */}
                  <a
                    href={`#/page/${sajdah.madinahPage}?ayah=${sajdah.ayahNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      enableUthmaniPageMode();
                      window.location.hash = `#/page/${sajdah.madinahPage}?ayah=${sajdah.ayahNumber}`;
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>الانتقال لموضع السجدة في المصحف (ص {sajdah.madinahPage})</span>
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HomeView;
