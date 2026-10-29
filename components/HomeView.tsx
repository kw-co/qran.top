import React, { useState, useEffect, useMemo } from 'react';
import type { SurahReference } from '../types';
import SurahListItem from './SurahListItem';
import IndexItem from './IndexItem';
import {
  BookOpenIcon,
  QueueListIcon,
  JuzOneIcon,
  PaperIcon,
  ClearIcon,
  SearchIcon,
} from './icons';
import { useSettingsContext } from '../contexts/SettingsContext';
import { normalizeArabicText, formatSurahNameForDisplay, normalizeDigits } from '../utils/text';

interface HomeViewProps {
  surahList: SurahReference[];
  juzList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
  hizbList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
}

type ActiveTab = 'surahs' | 'pages' | 'juz' | 'hizbs';

const HomeView: React.FC<HomeViewProps> = ({ surahList, juzList, hizbList }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('surahs');
  const [searchFilter, setSearchFilter] = useState('');
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

  const enableUthmaniPageMode = () => {
    setFontStyle('mushaf');
    setSelectedEdition('quran-uthmani-quran-academy');
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

  const TabButton: React.FC<{ tab: ActiveTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm md:text-lg font-semibold transition-all duration-200 border-b-4 cursor-pointer ${
        activeTab === tab
          ? 'text-primary border-primary'
          : 'text-text-muted border-transparent hover:text-text-primary hover:border-border-default'
      }`}
      aria-current={activeTab === tab}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'pages':
        return Array.from({ length: 604 }, (_, i) => i + 1).map(pageNumber => (
          <li key={`page-${pageNumber}`}>
            <a
              href={`#/page/${pageNumber}`}
              onClick={(e) => {
                e.preventDefault();
                enableUthmaniPageMode();
                window.location.hash = `#/page/${pageNumber}`;
              }}
              className="flex items-center justify-center p-3 bg-surface rounded-xl shadow-xs hover:shadow-sm hover:bg-surface-hover hover:border-primary transition-all duration-200 cursor-pointer border border-border-default h-full"
              aria-label={`صفحة ${pageNumber}`}
            >
              <span className="text-lg font-bold text-text-primary">{pageNumber}</span>
            </a>
          </li>
        ));
      case 'juz':
        return juzList.map(juz => (
          <IndexItem
            key={`juz-${juz.number}`}
            type="الجزء"
            number={juz.number}
            startSurah={juz.startSurah}
            startAyah={juz.startAyah}
            startSurahName={juz.startSurahName}
          />
        ));
      case 'hizbs':
        return hizbList.map(hizb => (
          <IndexItem
            key={`hizb-${hizb.number}`}
            type="الحزب"
            number={hizb.number}
            startSurah={hizb.startSurah}
            startAyah={hizb.startAyah}
            startSurahName={hizb.startSurahName}
          />
        ));
      case 'surahs':
      default:
        if (searchFilter.trim() && filteredSurahs.length === 0) {
          return (
            <li className="col-span-full py-12 text-center text-text-secondary bg-surface rounded-2xl border border-border-default p-6 space-y-2">
              <p className="text-base font-bold text-text-primary">
                لم يتم العثور على سورة باسم «{searchFilter.trim()}»
              </p>
              <p className="text-xs text-text-muted">
                اضغط مفتاح Enter أو زر البحث في الأعلى للبحث الشامل في آيات المصحف الشريف
              </p>
            </li>
          );
        }
        return filteredSurahs.map(surah => (
          <SurahListItem key={surah.number} surah={surah} />
        ));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 animate-fade-in space-y-4">
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

      {/* Tabs */}
      <div className="bg-surface rounded-2xl shadow-xs border border-border-default overflow-hidden">
        <div className="flex items-stretch overflow-x-auto">
          <TabButton tab="surahs" label="السور" icon={<BookOpenIcon className="w-5 h-5" />} />
          <TabButton tab="pages" label="صفحات" icon={<PaperIcon className="w-5 h-5" />} />
          <TabButton tab="juz" label="الأجزاء" icon={<JuzOneIcon className="w-5 h-5" />} />
          <TabButton tab="hizbs" label="الأحزاب" icon={<QueueListIcon className="w-5 h-5" />} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="animate-fade-in">
        <ul
          className={`grid gap-2.5 sm:gap-3 ${
            activeTab === 'pages'
              ? 'grid-cols-4 min-[450px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
              : 'grid-cols-2 min-[450px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}
        >
          {renderContent()}
        </ul>
      </div>
    </div>
  );
};

export default HomeView;
