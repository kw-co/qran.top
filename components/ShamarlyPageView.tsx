import React, { useState, useEffect, useRef } from 'react';
import { 
    SHAMARLY_TOTAL_PAGES, 
    SHAMARLY_SURAH_START_PAGES, 
    getShamarlyPageInfo, 
    getShamarlyPageForSurah 
} from '../data/shamarlyIndex';
import { 
    getShamarlyPageUrl, 
    getShamarlyFallbackUrl, 
    preloadAdjacentShamarlyPages 
} from '../utils/shamarlyMushaf';
import { QURAN_INDEX } from '../quranIndex';
import { useSettingsContext } from '../contexts/SettingsContext';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, PlusIcon, MinusIcon } from './icons';

interface ShamarlyPageViewProps {
    pageNumber: number;
    onPageChange: (newPage: number) => void;
    currentlyPlayingAyahGlobalNumber?: number | null;
}

export const ShamarlyPageView: React.FC<ShamarlyPageViewProps> = ({
    pageNumber,
    onPageChange,
    currentlyPlayingAyahGlobalNumber
}) => {
    const { isShamarlyDownloaded } = useSettingsContext();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [useFallbackUrl, setUseFallbackUrl] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [jumpPageInput, setJumpPageInput] = useState<string>(String(pageNumber));
    const [showSurahPicker, setShowSurahPicker] = useState(false);

    const safePage = Math.min(Math.max(1, pageNumber), SHAMARLY_TOTAL_PAGES);
    const pageInfo = getShamarlyPageInfo(safePage);
    const primarySurahData = QURAN_INDEX.find(s => s.number === pageInfo.primarySurah);
    const surahDisplayName = primarySurahData ? String(primarySurahData.name).replace(/^سُورَةُ\s*/, '') : '';

    const containerRef = useRef<HTMLDivElement>(null);

    // Preload next and previous pages
    useEffect(() => {
        preloadAdjacentShamarlyPages(safePage);
    }, [safePage]);

    // Reset loading state on page change
    useEffect(() => {
        setImageLoading(true);
        setImageError(false);
        setUseFallbackUrl(false);
        setJumpPageInput(String(safePage));
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [safePage]);

    // Keyboard navigation (Arrow keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                // In RTL Quran, arrow left usually goes to next page
                if (safePage < SHAMARLY_TOTAL_PAGES) {
                    onPageChange(safePage + 1);
                }
            } else if (e.key === 'ArrowRight') {
                if (safePage > 1) {
                    onPageChange(safePage - 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [safePage, onPageChange]);

    const handleNextPage = () => {
        if (safePage < SHAMARLY_TOTAL_PAGES) {
            onPageChange(safePage + 1);
        }
    };

    const handlePrevPage = () => {
        if (safePage > 1) {
            onPageChange(safePage - 1);
        }
    };

    const handleJumpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(jumpPageInput, 10);
        if (!isNaN(p) && p >= 1 && p <= SHAMARLY_TOTAL_PAGES) {
            onPageChange(p);
        } else {
            setJumpPageInput(String(safePage));
        }
    };

    const handleSurahSelect = (surahNum: number) => {
        const targetPage = getShamarlyPageForSurah(surahNum);
        onPageChange(targetPage);
        setShowSurahPicker(false);
    };

    const imageUrl = useFallbackUrl 
        ? getShamarlyFallbackUrl(safePage) 
        : getShamarlyPageUrl(safePage);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none" dir="rtl" ref={containerRef}>
            {/* Top Toolbar */}
            <div className="w-full bg-surface-subtle border border-border-default rounded-2xl p-3 sm:p-4 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Right: Surah & Juz Badge */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowSurahPicker(!showSurahPicker)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-default hover:border-primary text-xs sm:text-sm font-bold text-text-primary hover:text-primary transition-all cursor-pointer shadow-2xs"
                        title="اختيار سورة في مصحف الشمرلي"
                    >
                        <BookOpenIcon className="w-4 h-4 text-primary" />
                        <span>سورة {surahDisplayName || 'الفاتحة'}</span>
                        <span className="text-[10px] text-text-muted">▼</span>
                    </button>

                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
                        الجزء {pageInfo.juzNumber.toLocaleString('ar-EG')}
                    </span>

                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-surface border border-border-subtle text-text-secondary text-xs font-medium">
                        مصحف الشمرلي (٥٢٢ صفحة)
                    </span>
                </div>

                {/* Center / Left: Page Navigation Controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Zoom Buttons */}
                    <div className="flex items-center bg-surface rounded-xl border border-border-default p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
                            disabled={zoomLevel >= 1.6}
                            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-surface-hover cursor-pointer"
                            title="تكبير الصفحة"
                            aria-label="تكبير"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(1)}
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold text-text-secondary hover:text-primary cursor-pointer"
                            title="إعادة التعيين"
                        >
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
                            disabled={zoomLevel <= 0.85}
                            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-surface-hover cursor-pointer"
                            title="تصغير الصفحة"
                            aria-label="تصغير"
                        >
                            <MinusIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Page Step Buttons */}
                    <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={safePage <= 1}
                        className="p-2 rounded-xl bg-surface border border-border-default text-text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="الصفحة السابقة (السهم الأيمن)"
                        aria-label="الصفحة السابقة"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>

                    {/* Direct Page Input */}
                    <form onSubmit={handleJumpSubmit} className="flex items-center">
                        <div className="flex items-center bg-surface border border-border-default rounded-xl px-2 py-1 shadow-2xs">
                            <input
                                type="number"
                                min={1}
                                max={SHAMARLY_TOTAL_PAGES}
                                value={jumpPageInput}
                                onChange={(e) => setJumpPageInput(e.target.value)}
                                className="w-12 text-center text-xs sm:text-sm font-bold bg-transparent text-text-primary focus:outline-none"
                                aria-label="رقم الصفحة"
                            />
                            <span className="text-xs text-text-muted">/ {SHAMARLY_TOTAL_PAGES}</span>
                        </div>
                    </form>

                    <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={safePage >= SHAMARLY_TOTAL_PAGES}
                        className="p-2 rounded-xl bg-surface border border-border-default text-text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer active:scale-95"
                        title="الصفحة التالية (السهم الأيسر)"
                        aria-label="الصفحة التالية"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick Surah Picker Modal / Dropdown */}
            {showSurahPicker && (
                <div 
                    className="w-full bg-surface border border-border-default rounded-2xl p-4 mb-4 shadow-lg animate-fade-in max-h-72 overflow-y-auto"
                >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-subtle">
                        <h4 className="text-xs font-bold text-text-primary">الانتقال إلى سورة في مصحف الشمرلي:</h4>
                        <button
                            type="button"
                            onClick={() => setShowSurahPicker(false)}
                            className="text-xs text-text-muted hover:text-text-primary cursor-pointer px-2 py-0.5 rounded-md hover:bg-surface-hover"
                        >
                            إغلاق ✕
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {QURAN_INDEX.map(s => {
                            const startPage = SHAMARLY_SURAH_START_PAGES[s.number] || 2;
                            const isCurrent = pageInfo.primarySurah === s.number;
                            return (
                                <button
                                    key={s.number}
                                    type="button"
                                    onClick={() => handleSurahSelect(s.number)}
                                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-right ${
                                        isCurrent 
                                            ? 'bg-primary text-white font-bold' 
                                            : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-subtle'
                                    }`}
                                >
                                    <span className="truncate">{s.number}. {s.name.replace(/^سُورَةُ\s*/, '')}</span>
                                    <span className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-text-muted'} font-mono`}>
                                        ص {startPage}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Quran Page Image Container */}
            <div 
                className="relative w-full flex justify-center items-center bg-amber-50/40 dark:bg-slate-900/50 rounded-2xl p-2 sm:p-4 border-2 border-amber-900/15 dark:border-amber-500/15 shadow-xl transition-all overflow-hidden"
                style={{ minHeight: '500px' }}
            >
                {/* Loading Spinner */}
                {imageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/70 backdrop-blur-2xs z-10 space-y-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs font-semibold text-text-secondary">
                            جاري تحميل صفحة مصحف الشمرلي {safePage}...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {imageError && (
                    <div className="p-8 text-center space-y-3 z-10">
                        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-lg">
                            ✕
                        </div>
                        <h4 className="text-sm font-bold text-text-primary">تعذر تحميل صفحة المصحف</h4>
                        <p className="text-xs text-text-muted max-w-sm">
                            تأكد من الاتصال بالإنترنت، أو يمكنك تنزيل مصحف الشمرلي كاملاً للعمل بدون إنترنت من الإعدادات.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setImageLoading(true);
                                setImageError(false);
                                setUseFallbackUrl(prev => !prev);
                            }}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {/* Page Image */}
                <div 
                    className="transition-transform duration-200 ease-out max-w-full flex justify-center"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                >
                    <img
                        key={`shamarly-p-${safePage}-${useFallbackUrl ? 'fallback' : 'primary'}`}
                        src={imageUrl}
                        alt={`مصحف الشمرلي - صفحة ${safePage}`}
                        className={`rounded-lg shadow-md transition-opacity duration-300 max-h-[82vh] w-auto object-contain ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            if (!useFallbackUrl) {
                                // Try fallback once
                                setUseFallbackUrl(true);
                            } else {
                                setImageLoading(false);
                                setImageError(true);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Bottom Footer Info & Quick Jump */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                    <span>الصفحة {safePage.toLocaleString('ar-EG')} من {SHAMARLY_TOTAL_PAGES.toLocaleString('ar-EG')}</span>
                    <span>•</span>
                    <span>طبعة الشمرلي الشهيرة</span>
                </div>

                {!isShamarlyDownloaded && (
                    <div className="text-[11px] text-primary flex items-center gap-1">
                        <span>💡</span>
                        <a href="#/settings" className="hover:underline font-semibold">
                            هل تود حفظ مصحف الشمرلي كاملاً للقراءة بدون إنترنت؟ متاح في الإعدادات
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShamarlyPageView;
