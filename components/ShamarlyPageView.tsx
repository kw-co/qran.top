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
import { useTheme } from '../hooks/useTheme';
import { safeLocalStorage } from '../utils/storage';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    BookOpenIcon, 
    PlusIcon, 
    MinusIcon,
    SunIcon,
    MoonIcon
} from './icons';

interface ShamarlyPageViewProps {
    pageNumber: number;
    onPageChange: (newPage: number) => void;
    currentlyPlayingAyahGlobalNumber?: number | null;
}

export type ShamarlyPageColorMode = 'auto' | 'dark' | 'light' | 'sepia';

export const ShamarlyPageView: React.FC<ShamarlyPageViewProps> = ({
    pageNumber,
    onPageChange,
    currentlyPlayingAyahGlobalNumber
}) => {
    const { isShamarlyDownloaded } = useSettingsContext();
    const { isDark } = useTheme();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [useFallbackUrl, setUseFallbackUrl] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [jumpPageInput, setJumpPageInput] = useState<string>(String(pageNumber));
    const [showSurahPicker, setShowSurahPicker] = useState(false);
    
    // Page Color Mode: 'auto' (matches app theme), 'dark' (night inverted paper), 'light' (original paper), 'sepia' (warm paper)
    const [colorMode, setColorMode] = useState<ShamarlyPageColorMode>(() => {
        const saved = safeLocalStorage.getItem('shamarly_page_color_mode');
        if (saved === 'dark' || saved === 'light' || saved === 'sepia' || saved === 'auto') {
            return saved;
        }
        return 'auto';
    });

    const safePage = Math.min(Math.max(1, pageNumber), SHAMARLY_TOTAL_PAGES);
    const pageInfo = getShamarlyPageInfo(safePage);
    const primarySurahData = QURAN_INDEX.find(s => s.number === pageInfo.primarySurah);
    const surahDisplayName = primarySurahData ? String(primarySurahData.name).replace(/^سُورَةُ\s*/, '') : '';

    const pageScrollContainerRef = useRef<HTMLDivElement>(null);

    // Determine if night mode filter should be active
    const isAppDark = isDark || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
    const isNightActive = colorMode === 'dark' || (colorMode === 'auto' && isAppDark);
    const isSepiaActive = colorMode === 'sepia';

    // Preload next and previous pages
    useEffect(() => {
        preloadAdjacentShamarlyPages(safePage);
    }, [safePage]);

    // Reset loading state and scroll position on page change
    useEffect(() => {
        setImageLoading(true);
        setImageError(false);
        setUseFallbackUrl(false);
        setJumpPageInput(String(safePage));
        if (pageScrollContainerRef.current) {
            pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [safePage]);

    // Save color mode preference
    const handleSetColorMode = (mode: ShamarlyPageColorMode) => {
        setColorMode(mode);
        safeLocalStorage.setItem('shamarly_page_color_mode', mode);
    };

    // Toggle between night mode and light mode
    const toggleNightMode = () => {
        const nextMode = isNightActive ? 'light' : 'dark';
        handleSetColorMode(nextMode);
    };

    // Keyboard navigation (Arrow keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) {
                return;
            }

            if (e.key === 'ArrowLeft') {
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

    // CSS filter for comfortable night / sepia reading
    let pageFilter = 'none';
    if (isNightActive) {
        // High fidelity inverted night mode:
        // Inverts white paper to dark slate/black, black text to readable ivory.
        // hue-rotate(180deg) preserves original warm hues of gold, red and green surah headers!
        pageFilter = 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.15)';
    } else if (isSepiaActive) {
        pageFilter = 'sepia(0.38) brightness(0.96) contrast(1.06)';
    }

    const isZoomed = zoomLevel > 1;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none" dir="rtl">
            {/* Top Toolbar */}
            <div className="w-full bg-surface-subtle border border-border-default rounded-2xl p-2.5 sm:p-4 mb-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                {/* Right: Surah & Juz Badge */}
                <div className="flex items-center gap-1.5 sm:gap-2">
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

                    <span className="hidden md:inline-block px-2.5 py-1 rounded-xl bg-surface border border-border-subtle text-text-secondary text-xs font-medium">
                        مصحف الشمرلي (٥٢٢ صفحة)
                    </span>
                </div>

                {/* Left Controls: Night Mode Toggle, Zoom, Page Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {/* Paper Appearance / Night Mode Button */}
                    <div className="flex items-center bg-surface rounded-xl border border-border-default p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={toggleNightMode}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isNightActive
                                    ? 'bg-slate-800 text-amber-300 ring-1 ring-amber-400/30'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title={isNightActive ? "التبديل إلى الورق الطبيعي (نهاري)" : "تفعيل العرض الليلي المريح لصفحة المصحف"}
                            aria-label="تبديل العرض الليلي للورق"
                        >
                            {isNightActive ? (
                                <>
                                    <MoonIcon className="w-3.5 h-3.5 text-amber-300" />
                                    <span className="text-[11px]">ليلي معتم</span>
                                </>
                            ) : (
                                <>
                                    <SunIcon className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-[11px]">ورق أصلي</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Zoom Buttons */}
                    <div className="flex items-center bg-surface rounded-xl border border-border-default p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.min(Math.round((prev + 0.2) * 100) / 100, 2.0))}
                            disabled={zoomLevel >= 2.0}
                            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-surface-hover cursor-pointer"
                            title="تكبير الصفحة"
                            aria-label="تكبير"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setZoomLevel(1);
                                if (pageScrollContainerRef.current) {
                                    pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold text-text-secondary hover:text-primary cursor-pointer"
                            title="إعادة التعيين لملء الشاشة (100%)"
                        >
                            {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoomLevel(prev => Math.max(Math.round((prev - 0.2) * 100) / 100, 0.8))}
                            disabled={zoomLevel <= 0.8}
                            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 rounded-lg hover:bg-surface-hover cursor-pointer"
                            title="تصغير الصفحة"
                            aria-label="تصغير"
                        >
                            <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Page Step Buttons & Jump */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handlePrevPage}
                            disabled={safePage <= 1}
                            className="p-1.5 sm:p-2 rounded-xl bg-surface border border-border-default text-text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="الصفحة السابقة (السهم الأيمن)"
                            aria-label="الصفحة السابقة"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>

                        <form onSubmit={handleJumpSubmit} className="flex items-center">
                            <div className="flex items-center bg-surface border border-border-default rounded-xl px-2 py-1 shadow-2xs">
                                <input
                                    type="number"
                                    min={1}
                                    max={SHAMARLY_TOTAL_PAGES}
                                    value={jumpPageInput}
                                    onChange={(e) => setJumpPageInput(e.target.value)}
                                    className="w-10 sm:w-12 text-center text-xs sm:text-sm font-bold bg-transparent text-text-primary focus:outline-none"
                                    aria-label="رقم الصفحة"
                                />
                                <span className="text-[11px] text-text-muted font-mono">/ {SHAMARLY_TOTAL_PAGES}</span>
                            </div>
                        </form>

                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={safePage >= SHAMARLY_TOTAL_PAGES}
                            className="p-1.5 sm:p-2 rounded-xl bg-surface border border-border-default text-text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="الصفحة التالية (السهم الأيسر)"
                            aria-label="الصفحة التالية"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                    </div>
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

            {/* Main Quran Page Image Container (Fully scrollable when zoomed in) */}
            <div 
                ref={pageScrollContainerRef}
                tabIndex={0}
                className={`relative w-full flex flex-col items-center justify-start rounded-2xl p-2 sm:p-4 border transition-all overflow-y-auto overflow-x-auto focus:outline-none ${
                    isNightActive
                        ? 'bg-slate-950/95 border-slate-800 shadow-2xl'
                        : 'bg-amber-50/40 dark:bg-slate-900/60 border-amber-900/15 dark:border-amber-500/15 shadow-xl'
                }`}
                style={{ 
                    maxHeight: '83vh',
                    minHeight: '480px',
                    scrollBehavior: 'smooth'
                }}
            >
                {/* Loading Spinner */}
                {imageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/75 backdrop-blur-2xs z-20 space-y-3 rounded-2xl">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs font-semibold text-text-secondary">
                            جاري تحميل صفحة مصحف الشمرلي {safePage}...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {imageError && (
                    <div className="p-8 text-center space-y-3 z-20 my-auto">
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

                {/* Zoomable Image Wrapper */}
                <div 
                    className="w-full flex justify-center items-start transition-all duration-200 ease-out py-1"
                    style={{ minHeight: '100%' }}
                >
                    <img
                        key={`shamarly-p-${safePage}-${useFallbackUrl ? 'fallback' : 'primary'}`}
                        src={imageUrl}
                        alt={`مصحف الشمرلي - صفحة ${safePage}`}
                        style={{
                            filter: pageFilter,
                            width: zoomLevel > 1 ? `${Math.round(zoomLevel * 100)}%` : undefined,
                            maxWidth: zoomLevel > 1 ? `${Math.round(zoomLevel * 720)}px` : '100%',
                            maxHeight: zoomLevel > 1 ? 'none' : '78vh',
                            height: 'auto',
                            transform: zoomLevel < 1 ? `scale(${zoomLevel})` : undefined,
                            transformOrigin: 'top center'
                        }}
                        className={`rounded-lg transition-opacity duration-300 object-contain shadow-md ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                        } ${isNightActive ? 'ring-1 ring-white/10' : ''}`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            if (!useFallbackUrl) {
                                setUseFallbackUrl(true);
                            } else {
                                setImageLoading(false);
                                setImageError(true);
                            }
                        }}
                    />
                </div>

                {/* Floating scroll cue when zoomed in */}
                {isZoomed && !imageLoading && !imageError && (
                    <div className="sticky bottom-2 mt-4 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-border-default shadow-lg text-[11px] text-text-secondary flex items-center gap-2 z-10 animate-fade-in">
                        <span>↕ اسحب لأسفل لتصفح باقي الصفحة</span>
                        <span className="text-text-muted">•</span>
                        <button
                            type="button"
                            onClick={() => {
                                setZoomLevel(1);
                                if (pageScrollContainerRef.current) {
                                    pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="text-primary hover:underline font-bold cursor-pointer"
                        >
                            إعادة للوضع الطبيعي (100%)
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Footer Info & Quick Navigation */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-2 py-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                    <span>الصفحة {safePage.toLocaleString('ar-EG')} من {SHAMARLY_TOTAL_PAGES.toLocaleString('ar-EG')}</span>
                    <span>•</span>
                    <span>طبعة الشمرلي الشهيرة (٥٢٢ صفحة)</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Page Tone Indicators */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                            type="button"
                            onClick={() => handleSetColorMode('dark')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${colorMode === 'dark' ? 'font-bold text-amber-400 bg-amber-400/10' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            🌙 ليلي
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            onClick={() => handleSetColorMode('light')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${colorMode === 'light' ? 'font-bold text-primary bg-primary/10' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            ☀️ ورقي
                        </button>
                        <span>|</span>
                        <button
                            type="button"
                            onClick={() => handleSetColorMode('sepia')}
                            className={`px-1.5 py-0.5 rounded cursor-pointer ${colorMode === 'sepia' ? 'font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10' : 'text-text-muted hover:text-text-primary'}`}
                        >
                            📜 دافئ
                        </button>
                    </div>

                    {!isShamarlyDownloaded && (
                        <div className="text-[11px] text-primary flex items-center gap-1">
                            <a href="#/settings?tab=reading" className="hover:underline font-semibold">
                                حفظ بدون إنترنت
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShamarlyPageView;
