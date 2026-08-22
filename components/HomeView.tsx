import React, { useState } from 'react';
import type { SurahReference } from '../types';
import SurahListItem from './SurahListItem';
import IndexItem from './IndexItem';
import {
  BookOpenIcon,
  QueueListIcon,
  JuzOneIcon,
  PaperIcon,
  PlusIcon,
  CopyIcon,
  WhatsAppIcon,
  TelegramIcon,
} from './icons';
import { safeLocalStorage } from '../utils/storage';
import { useSettingsContext } from '../contexts/SettingsContext';
import CreateKhatmahModal from './khatmiyah/CreateKhatmahModal';
import { khatmahService } from '../services/khatmahService';

interface HomeViewProps {
  surahList: SurahReference[];
  juzList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
  hizbList: { number: number; startAyah: number; startSurah: number; startSurahName: string }[];
}

type ActiveTab = 'surahs' | 'pages' | 'juz' | 'hizbs';

const HomeView: React.FC<HomeViewProps> = ({ surahList, juzList, hizbList }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('surahs');
  const [isCreateKhatmahOpen, setIsCreateKhatmahOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { setFontStyle, setSelectedEdition, setBrowsingMode } = useSettingsContext();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const enableUthmaniPageMode = () => {
    setFontStyle('mushaf');
    setSelectedEdition('quran-uthmani-quran-academy');
    setBrowsingMode('page');
  };

  // Social sharing helpers for the main page (icon only)
  const getHomeShareUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const handleCopyLink = async () => {
    const url = getHomeShareUrl();
    const textToCopy = `🌿 برنامج الباحث في القرآن الكريم (QRAN.TOP)\nتصفح القرآن الكريم، البحث الدقيق، والختمات القرآنية الجماعية المباركة:\n${url}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('تم نسخ الرابط بنجاح!');
    } catch {
      const input = document.createElement('input');
      input.value = textToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('تم نسخ الرابط بنجاح!');
    }
  };

  const handleWhatsAppShare = () => {
    const url = getHomeShareUrl();
    const text = `🌿 *برنامج الباحث في القرآن الكريم (QRAN.TOP)*\nتصفح القرآن الكريم، البحث اللغوي الدقيق، والختمات القرآنية الجماعية:\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const url = getHomeShareUrl();
    const text = `🌿 برنامج الباحث في القرآن الكريم (QRAN.TOP)\nتصفح القرآن الكريم والختمات القرآنية الجماعية:\n${url}`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank');
  };

  const handleCreateKhatmah = async (params: {
    title: string;
    dedication?: string;
    targetDate?: string;
    createdBy?: string;
    khatmahType?: 'once' | 'monthly_recurring';
  }) => {
    const created = await khatmahService.createKhatmah(params);
    window.location.hash = `#/khatmah/${created.id}`;
    return created.id;
  };

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
        return surahList.map(surah => (
          <SurahListItem key={surah.number} surah={surah} />
        ));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 animate-fade-in space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-text-primary text-surface px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-border-default animate-fade-in font-medium text-sm">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Khatmah & Actions Toolbar on Home View (with "إنشاء ختمة جديدة" and Icon-only share links) */}
      <div className="bg-surface border border-border-default rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Khatmah info & navigation */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-text-primary">الختمات القرآنية الجماعية</h2>
              <a
                href="#/khatmah"
                className="text-[11px] font-bold text-primary hover:underline"
              >
                تصفح الختمات ←
              </a>
            </div>
            <p className="text-xs text-text-muted">
              أنشئ ختمة خاصة بالأهل والأصدقاء وشارك الأجر
            </p>
          </div>
        </div>

        {/* Action: Create New Khatmah & Social Share Icons (Icons only without text) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Create New Khatmah Button */}
          <button
            type="button"
            onClick={() => setIsCreateKhatmahOpen(true)}
            className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>إنشاء ختمة جديدة</span>
          </button>

          {/* Social Share Icons only */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-9 h-9 flex items-center justify-center bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-primary rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            title="نسخ الرابط"
            aria-label="نسخ الرابط"
          >
            <CopyIcon className="w-4 h-4 text-primary" />
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-9 h-9 flex items-center justify-center bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] rounded-xl border border-[#25D366]/30 transition-all cursor-pointer shadow-xs active:scale-95"
            title="واتساب"
            aria-label="واتساب"
          >
            <WhatsAppIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTelegramShare}
            className="w-9 h-9 flex items-center justify-center bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#0088cc] rounded-xl border border-[#0088cc]/30 transition-all cursor-pointer shadow-xs active:scale-95"
            title="تيليجرام"
            aria-label="تيليجرام"
          >
            <TelegramIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

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

      {/* Create Khatmah Modal */}
      {isCreateKhatmahOpen && (
        <CreateKhatmahModal
          onClose={() => setIsCreateKhatmahOpen(false)}
          onCreate={handleCreateKhatmah}
        />
      )}
    </div>
  );
};

export default HomeView;
