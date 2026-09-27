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
    const { mushafFrameStyle } = useSettingsContext();
    const { theme } = useTheme();
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [useFallbackUrl, setUseFallbackUrl] = useState(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [isJumping, setIsJumping] = useState(false);
    const [jumpInput, setJumpInput] = useState<string>('');
    const [showSurahPicker, setShowSurahPicker] = useState(false);

    const safePage = Math.min(Math.max(1, pageNumber), SHAMARLY_TOTAL_PAGES);
    const pageInfo = getShamarlyPageInfo(safePage);
    const primarySurahData = QURAN_INDEX.find(s => s.number === pageInfo.primarySurah);
    const surahDisplayName = primarySurahData ? String(primarySurahData.name).replace(/^سُورَةُ\s*/, '') : '';
    const isOddPage = safePage % 2 !== 0;

    const pageScrollContainerRef = useRef<HTMLDivElement>(null);
    const surahPickerRef = useRef<HTMLDivElement>(null);
    const jumpInputRef = useRef<HTMLInputElement>(null);

    // Preload next and previous pages for instant response
    useEffect(() => {
        preloadAdjacentShamarlyPages(safePage);
    }, [safePage]);

    // Reset loading state and scroll position on page change
    useEffect(() => {
        setImageLoading(true);
        setImageError(false);
        setUseFallbackUrl(false);
        setIsJumping(false);
        setShowSurahPicker(false);
        if (pageScrollContainerRef.current) {
            pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [safePage]);

    // Focus jump input when active
    useEffect(() => {
        if (isJumping && jumpInputRef.current) {
            setJumpInput(String(safePage));
            jumpInputRef.current.focus();
            jumpInputRef.current.select();
        }
    }, [isJumping, safePage]);

    // Close surah picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (surahPickerRef.current && !surahPickerRef.current.contains(e.target as Node)) {
                setShowSurahPicker(false);
            }
        };
        if (showSurahPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSurahPicker]);

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
            } else if (e.key === 'Escape') {
                setShowSurahPicker(false);
                setIsJumping(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [safePage, onPageChange]);

    // Touch gesture swipe for natural page flipping
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        // If not zoomed and prominent horizontal swipe, turn page
        if (zoomLevel === 1 && Math.abs(deltaX) > 60 && Math.abs(deltaY) < 45) {
            if (deltaX < 0) {
                // Swiped left (in RTL, next page)
                handleNextPage();
            } else {
                // Swiped right (in RTL, previous page)
                handlePrevPage();
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

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
        const p = parseInt(jumpInput, 10);
        if (!isNaN(p) && p >= 1 && p <= SHAMARLY_TOTAL_PAGES) {
            onPageChange(p);
        }
        setIsJumping(false);
    };

    const handleSurahSelect = (surahNum: number) => {
        const targetPage = getShamarlyPageForSurah(surahNum);
        onPageChange(targetPage);
        setShowSurahPicker(false);
    };

    const imageUrl = useFallbackUrl 
        ? getShamarlyFallbackUrl(safePage) 
        : getShamarlyPageUrl(safePage);

    // Dynamic, automatic appearance blending tailored to the app's native theme:
    // Zero custom themes or foreign toggles.
    const isDarkTheme = theme === 'dark' || theme === 'isha';
    let imageFilter = 'none';
    let blendMode: React.CSSProperties['mixBlendMode'] = undefined;

    if (theme === 'dark') {
        // Slate Charcoal Navy: Invert white paper to dark slate, text to readable ivory,
        // preserving warm golden surah banners via hue-rotate(180deg).
        imageFilter = 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.15)';
    } else if (theme === 'isha') {
        // Deep Olive Forest: Invert with olive-adjusted hues
        imageFilter = 'invert(0.92) hue-rotate(140deg) brightness(0.93) contrast(1.15)';
    } else if (theme === 'light') {
        // Warm Paper (نهاري 1): Multiply blend mode seamlessly dissolves scanned white paper
        // directly into the warm parchment surface of the app without any boxy edge clashing.
        imageFilter = 'contrast(1.04) brightness(0.99)';
        blendMode = 'multiply';
    } else if (theme === 'duha') {
        // Cool Academic Light (نهاري 2): Crisp clear reproduction
        imageFilter = 'contrast(1.05)';
        blendMode = 'multiply';
    }

    const frameClass = `frame-${mushafFrameStyle || 'classic'}`;
    const isZoomed = zoomLevel > 1;

    return (
        <div 
            className={`mushaf-page ${frameClass} mx-auto w-full max-w-2xl shadow-2xl relative select-text`}
            dir="rtl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Native Mushaf Header: Identical layout to Madinah Mushaf */}
            <header className="mushaf-header flex justify-between items-center px-4 font-bold text-amber-700/80 dark:text-amber-500/80 text-xs sm:text-sm border-b border-amber-200/50 pb-2 mb-2 sm:mb-4 select-none relative">
                {isOddPage ? (
                    <>
                        {/* Right: Surah Name with Dropdown Trigger */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowSurahPicker(!showSurahPicker)}
                                className="flex items-center gap-1 hover:text-amber-900 dark:hover:text-amber-300 transition-colors cursor-pointer group"
                                title="اختر سورة للانتقال إليها في مصحف الشمرلي"
                            >
                                <span>سورة {surahDisplayName || 'الفاتحة'}</span>
                                <span className="text-[10px] text-amber-600/70 group-hover:text-primary transition-transform">
                                    {showSurahPicker ? '▲' : '▼'}
                                </span>
                            </button>
                        </div>

                        {/* Center: Integrated Subtle Zoom Controls */}
                        <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                            {isZoomed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setZoomLevel(1);
                                        if (pageScrollContainerRef.current) {
                                            pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-slate-800 text-amber-800 dark:text-amber-300 cursor-pointer"
                                    title="إعادة التعيين (100%)"
                                >
                                    100%
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.min(Math.round((prev + 0.2) * 100) / 100, 2.0))}
                                disabled={zoomLevel >= 2.0}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                                title="تكبير الصفحة"
                                aria-label="تكبير"
                            >
                                +
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.max(Math.round((prev - 0.2) * 100) / 100, 0.8))}
                                disabled={zoomLevel <= 0.8}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                                title="تصغير الصفحة"
                                aria-label="تصغير"
                            >
                                -
                            </button>
                        </div>

                        {/* Left: Juz Number */}
                        <span>الجزء {pageInfo.juzNumber.toLocaleString('ar-EG')}</span>
                    </>
                ) : (
                    <>
                        {/* Right: Juz Number */}
                        <span>الجزء {pageInfo.juzNumber.toLocaleString('ar-EG')}</span>

                        {/* Center: Integrated Subtle Zoom Controls */}
                        <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
                            {isZoomed && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setZoomLevel(1);
                                        if (pageScrollContainerRef.current) {
                                            pageScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-slate-800 text-amber-800 dark:text-amber-300 cursor-pointer"
                                    title="إعادة التعيين (100%)"
                                >
                                    100%
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.min(Math.round((prev + 0.2) * 100) / 100, 2.0))}
                                disabled={zoomLevel >= 2.0}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                                title="تكبير الصفحة"
                                aria-label="تكبير"
                            >
                                +
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.max(Math.round((prev - 0.2) * 100) / 100, 0.8))}
                                disabled={zoomLevel <= 0.8}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                                title="تصغير الصفحة"
                                aria-label="تصغير"
                            >
                                -
                            </button>
                        </div>

                        {/* Left: Surah Name with Dropdown Trigger */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowSurahPicker(!showSurahPicker)}
                                className="flex items-center gap-1 hover:text-amber-900 dark:hover:text-amber-300 transition-colors cursor-pointer group"
                                title="اختر سورة للانتقال إليها في مصحف الشمرلي"
                            >
                                <span>سورة {surahDisplayName || 'الفاتحة'}</span>
                                <span className="text-[10px] text-amber-600/70 group-hover:text-primary transition-transform">
                                    {showSurahPicker ? '▲' : '▼'}
                                </span>
                            </button>
                        </div>
                    </>
                )}

                {/* Compact Inline Surah Selector Popover */}
                {showSurahPicker && (
                    <div 
                        ref={surahPickerRef}
                        className="absolute top-full mt-1.5 inset-x-2 bg-surface border border-border-default rounded-2xl p-3 shadow-xl z-30 animate-fade-in max-h-72 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                            <span className="text-xs font-bold text-text-primary">الانتقال إلى سورة في مصحف الشمرلي:</span>
                            <button
                                type="button"
                                onClick={() => setShowSurahPicker(false)}
                                className="text-xs text-text-muted hover:text-text-primary cursor-pointer px-1.5 py-0.5 rounded hover:bg-surface-hover"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {QURAN_INDEX.map(s => {
                                const startPage = SHAMARLY_SURAH_START_PAGES[s.number] || 2;
                                const isCurrent = pageInfo.primarySurah === s.number;
                                return (
                                    <button
                                        key={s.number}
                                        type="button"
                                        onClick={() => handleSurahSelect(s.number)}
                                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-right ${
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
            </header>

            {/* Main Page Image Container (Integrated cleanly, fully scrollable when zoomed in) */}
            <main 
                ref={pageScrollContainerRef}
                tabIndex={0}
                className="relative flex flex-col items-center justify-start w-full min-h-[60vh] overflow-y-auto overflow-x-auto focus:outline-none transition-all"
                style={{ 
                    maxHeight: isZoomed ? '82vh' : undefined,
                    scrollBehavior: 'smooth'
                }}
            >
                {/* Native Loading Spinner */}
                {imageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-2xs z-20 space-y-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs font-semibold text-text-secondary">
                            جاري تحميل صفحة مصحف الشمرلي {safePage}...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {imageError && (
                    <div className="p-8 text-center space-y-3 z-20 my-auto">
                        <div className="w-10 h-10 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-base">
                            ✕
                        </div>
                        <h4 className="text-xs font-bold text-text-primary">تعذر تحميل صفحة المصحف</h4>
                        <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                            تحقق من الاتصال بالإنترنت، أو حمل صفحات المصحف كاملاً للأوفلاين من الإعدادات.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setImageLoading(true);
                                setImageError(false);
                                setUseFallbackUrl(prev => !prev);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                )}

                {/* Scanned Page Image (Blends organically into native frame) */}
                <div 
                    className="w-full flex justify-center items-start transition-all duration-200 ease-out py-0.5"
                    style={{ minHeight: '100%' }}
                >
                    <img
                        key={`shamarly-p-${safePage}-${useFallbackUrl ? 'fallback' : 'primary'}`}
                        src={imageUrl}
                        alt={`مصحف الشمرلي - صفحة ${safePage}`}
                        style={{
                            filter: imageFilter,
                            mixBlendMode: blendMode,
                            width: zoomLevel > 1 ? `${Math.round(zoomLevel * 100)}%` : undefined,
                            maxWidth: zoomLevel > 1 ? `${Math.round(zoomLevel * 720)}px` : '100%',
                            maxHeight: zoomLevel > 1 ? 'none' : '78vh',
                            height: 'auto',
                            transform: zoomLevel < 1 ? `scale(${zoomLevel})` : undefined,
                            transformOrigin: 'top center'
                        }}
                        className={`transition-opacity duration-300 object-contain ${
                            imageLoading ? 'opacity-0' : 'opacity-100'
                        } ${isDarkTheme ? 'ring-1 ring-white/10 rounded-sm' : ''}`}
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
                    <div className="sticky bottom-2 mt-4 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md border border-border-default shadow-md text-[11px] text-text-secondary flex items-center gap-2 z-10 animate-fade-in select-none">
                        <span>↕ اسحب لتصفح باقي الصفحة</span>
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
                            إعادة (100%)
                        </button>
                    </div>
                )}
            </main>

            {/* Native Mushaf Footer: Identical layout to Madinah Mushaf */}
            <footer className="mushaf-footer flex items-center justify-between mt-4 sm:mt-6 pt-2 border-t border-amber-200/50 select-none">
                <button 
                    type="button"
                    onClick={handlePrevPage}
                    disabled={safePage <= 1}
                    className="px-3 py-1 bg-amber-100/70 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 rounded disabled:opacity-40 cursor-pointer text-xs sm:text-sm font-semibold transition-colors"
                    title="الصفحة السابقة"
                >
                    السابق
                </button>

                {/* Center Page Number (Click to jump to any page) */}
                {isJumping ? (
                    <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
                        <input
                            ref={jumpInputRef}
                            type="number"
                            min={1}
                            max={SHAMARLY_TOTAL_PAGES}
                            value={jumpInput}
                            onChange={(e) => setJumpInput(e.target.value)}
                            onBlur={() => setIsJumping(false)}
                            className="w-14 text-center font-mono font-bold text-base bg-surface border border-primary rounded px-1 py-0.5 text-text-primary focus:outline-none"
                        />
                        <span className="text-xs text-text-muted font-mono">/ {SHAMARLY_TOTAL_PAGES}</span>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsJumping(true)}
                        className="group flex items-baseline gap-1 cursor-pointer"
                        title="انقر للانتقال المباشر لرقم صفحة"
                    >
                        <span className="font-bold font-mono text-lg text-amber-800 dark:text-amber-500 group-hover:underline">
                            {safePage.toLocaleString('ar-EG')}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">
                            / {SHAMARLY_TOTAL_PAGES.toLocaleString('ar-EG')}
                        </span>
                    </button>
                )}

                <button 
                    type="button"
                    onClick={handleNextPage}
                    disabled={safePage >= SHAMARLY_TOTAL_PAGES}
                    className="px-3 py-1 bg-amber-100/70 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 rounded disabled:opacity-40 cursor-pointer text-xs sm:text-sm font-semibold transition-colors"
                    title="الصفحة التالية"
                >
                    التالي
                </button>
            </footer>
        </div>
    );
};

export default ShamarlyPageView;
