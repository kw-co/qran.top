import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MenuIcon, LogoIcon, BookmarkIcon, UthmaniScriptIcon, MadinahMushafIcon } from './icons';
import { QURAN_INDEX } from '../quranIndex';
import { formatSurahNameForDisplay } from '../utils/text';
import SearchForm from './SearchForm';
import ThemeToggleButton from './ThemeToggleButton';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSettingsContext } from '../contexts/SettingsContext';
import type { Ayah } from '../types';

interface HeaderProps {
    setIsSidePanelOpen: (open: boolean) => void;
    currentPath: string;
    dataSourceStatus: 'primary' | 'fallback';
    onSearch: (query: string) => void;
    searchDisabled: boolean;
    loadingEditions: string[];
    onStartPlayback?: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    isPlaybackLoading?: boolean;
}

const Logo: React.FC<{ dataSourceStatus: 'primary' | 'fallback'; isHomePage: boolean }> = ({ dataSourceStatus, isHomePage }) => {
    const [adminClickCount, setAdminClickCount] = useState(0);

    const handleLogoClick = (e: React.MouseEvent) => {
        if (e.detail === 2) {
            window.location.reload();
            return;
        }
        const newCount = adminClickCount + 1;
        setAdminClickCount(newCount);
        if (newCount >= 12) {
            window.location.hash = '#/admin';
            setAdminClickCount(0);
            return;
        }
        
        // Always navigate home on logo click
        window.location.hash = '#/';
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.reload();
    };

    const dotColorClass = dataSourceStatus === 'primary' ? 'text-green-500' : 'text-red-500';

    return (
        <div 
            onClick={handleLogoClick} 
            onDoubleClick={handleDoubleClick}
            dir="ltr" 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none pl-1 active:scale-95 transition-transform" 
            title="انقر للرئيسية - انقر مرتين لإعادة تحميل وتحديث التطبيق"
        >
            <LogoIcon className="w-7 h-7 text-primary flex-shrink-0" />
            <span className="text-lg sm:text-xl font-bold text-text-primary tracking-tighter whitespace-nowrap">
                الباحث
            </span>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({
    setIsSidePanelOpen,
    currentPath,
    dataSourceStatus,
    onSearch,
    searchDisabled,
    loadingEditions,
    onStartPlayback,
    isPlaybackLoading,
}) => {
    const isOnline = useNetworkStatus();
    
    // Auto-hide search bar on scroll down, show on scroll up
    const [isSearchVisible, setIsSearchVisible] = useState(true);

    useEffect(() => {
        let lastY = window.scrollY;
        let scrollUpAccumulator = 0;
        let scrollDownAccumulator = 0;

        const handleScroll = () => {
            // Keep permanently visible on tablet and computer screens (width >= 768px)
            if (window.innerWidth >= 768) {
                setIsSearchVisible(true);
                return;
            }

            const currentScrollY = window.scrollY;
            
            // If near top, always show
            if (currentScrollY <= 40) {
                setIsSearchVisible(true);
                scrollUpAccumulator = 0;
                scrollDownAccumulator = 0;
                lastY = currentScrollY;
                return;
            }

            const delta = currentScrollY - lastY;
            lastY = currentScrollY;

            if (delta > 0) {
                // Scrolling down
                scrollDownAccumulator += delta;
                scrollUpAccumulator = 0;
                
                if (scrollDownAccumulator > 30) {
                    setIsSearchVisible(false);
                    scrollDownAccumulator = 0;
                }
            } else if (delta < 0) {
                // Scrolling up
                scrollUpAccumulator += Math.abs(delta);
                scrollDownAccumulator = 0;

                if (scrollUpAccumulator > 30) {
                    setIsSearchVisible(true);
                    scrollUpAccumulator = 0;
                }
            }
        };

        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSearchVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    // Consume Settings from Context
    const { 
        fontStyle, setFontStyle, selectedEdition, setSelectedEdition, selectedAudioEdition,
        isMushafDownloaded, openDownloadMushafModal
    } = useSettingsContext();

    const { pageTitle, isSurahOrPage, isRelevantPageForToggle, isSearchPage, isHomePage, searchQuery } = useMemo(() => {
        const path = currentPath.split('?')[0];
        const isHome = path === '#/';
        const isSearch = path.startsWith('#/search/');
        const isSurah = path.startsWith('#/surah/');
        const isPage = path.startsWith('#/page/');
        const isRelevant = isSurah || isPage || isSearch;
        
        let title = "الباحث في المصحف الشريف";
        let searchQuery = "";

        if (!isHome) {
            if (isSurah) {
                const surahNum = parseInt(path.split('/')[2], 10);
                const surah = QURAN_INDEX.find(s => s.number === surahNum);
                if (surah) title = formatSurahNameForDisplay(surah.name);
            } else if (isPage) {
                const pageNum = path.split('/')[2];
                title = `الصفحة ${pageNum}`;
            } else if (isSearch) {
                title = "نتائج البحث";
                const parts = path.split('/');
                if (parts[2] === 'number') {
                    searchQuery = parts[3] ? decodeURIComponent(parts[3]) : '';
                } else {
                    searchQuery = parts[2] ? decodeURIComponent(parts[2]) : '';
                }
            }
        } else {
            title = "الفهرس";
        }

        return { 
            pageTitle: title, 
            isSurahOrPage: isSurah || isPage, 
            isRelevantPageForToggle: isRelevant,
            isSearchPage: isSearch,
            isHomePage: isHome,
            searchQuery
        };
    }, [currentPath]);

    const isUthmaniLoading = useMemo(() => {
        return loadingEditions.includes('quran-uthmani-quran-academy');
    }, [loadingEditions]);

    const handleUthmaniClick = useCallback(() => {
        if (fontStyle !== 'mushaf') {
            // Already in Uthmani, clicking it toggles to Mushaf
            if (!isMushafDownloaded) {
                openDownloadMushafModal();
                return;
            }
            setFontStyle('mushaf');
            setSelectedEdition('quran-uthmani-quran-academy');
        } else {
            // Switch to Uthmani
            setFontStyle('uthmani');
            setSelectedEdition('quran-uthmani-quran-academy');
        }
    }, [fontStyle, isMushafDownloaded, setFontStyle, setSelectedEdition, openDownloadMushafModal]);

    const handleMushafClick = useCallback(() => {
        if (fontStyle === 'mushaf') {
            // Already in Mushaf, clicking it toggles to Uthmani
            setFontStyle('uthmani');
            setSelectedEdition('quran-uthmani-quran-academy');
        } else {
            // Switch to Mushaf
            if (!isMushafDownloaded) {
                openDownloadMushafModal();
                return;
            }
            setFontStyle('mushaf');
            setSelectedEdition('quran-uthmani-quran-academy');
        }
    }, [fontStyle, isMushafDownloaded, setFontStyle, setSelectedEdition, openDownloadMushafModal]);

    const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = '#/';
    };

    return (
        <header className={`sticky top-0 z-30 bg-surface/90 backdrop-blur-md shadow-sm border-b border-border-default transition-transform duration-150 ease-out ${
            isSearchVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        }`}>
            <div className="w-full max-w-7xl mx-auto px-4">
                {/* Row 1: Menu & Actions (Right), Center Search, and Brand Logo (Left) */}
                <div className="flex items-center justify-between h-14 gap-2">
                    {/* Right Group: Menu & Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {/* Menu Drawer Button */}
                        <button
                            onClick={() => setIsSidePanelOpen(true)}
                            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-primary rounded-full bg-surface-subtle hover:bg-surface-hover transition-colors border border-border-default/60 shadow-xs active:scale-95 cursor-pointer"
                            aria-label="فتح القائمة"
                            title="القائمة الرئيسية"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        {/* Theme Toggle Button */}
                        <ThemeToggleButton />

                        {/* Mode Switcher: Uthmani Script & Madinah Mushaf (Always visible, intuitive icons) */}
                        <div 
                            className="flex items-center bg-surface-subtle p-0.5 rounded-full border border-border-default/80 shadow-xs" 
                            role="group" 
                            aria-label="التبديل بين الرسم العثماني ومصحف المدينة"
                        >
                            {/* زر الرسم العثماني */}
                            <button
                                type="button"
                                onClick={handleUthmaniClick}
                                disabled={isUthmaniLoading && fontStyle === 'mushaf'}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
                                    fontStyle !== 'mushaf'
                                        ? 'bg-primary text-white shadow-xs font-bold'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                                }`}
                                title="الرسم العثماني (نص رقمي متتابع)"
                                aria-label="الرسم العثماني"
                            >
                                <UthmaniScriptIcon className="w-4 h-4 flex-shrink-0" />
                            </button>

                            {/* زر مصحف المدينة */}
                            <button
                                type="button"
                                onClick={handleMushafClick}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-95 relative ${
                                    fontStyle === 'mushaf'
                                        ? 'bg-primary text-white shadow-xs font-bold'
                                        : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                                }`}
                                title={isMushafDownloaded ? "مصحف المدينة (مطابق للمصحف الورقي المطبوع)" : "مصحف المدينة (انقر للتنزيل والتفعيل)"}
                                aria-label="مصحف المدينة"
                            >
                                <MadinahMushafIcon className="w-4 h-4 flex-shrink-0" />
                                {!isMushafDownloaded && (
                                    <span 
                                        className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 left-1 ring-1 ring-surface" 
                                        title="يتطلب تنزيل الخطوط" 
                                    />
                                )}
                            </button>
                        </div>

                        {/* Bookmark / Reading History Button */}
                        <a
                            href="#/history"
                            className="w-9 h-9 rounded-full transition-all border border-border-default text-text-primary hover:text-primary hover:bg-surface-hover bg-surface-subtle shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                            title="سجل القراءة ومواضع التوقف"
                            aria-label="سجل القراءة"
                        >
                            <BookmarkIcon className="w-4 h-4 text-primary" />
                        </a>
                    </div>

                    {/* Center Group: Desktop Search */}
                    <div className="flex-grow flex items-center justify-center min-w-0 px-2 sm:px-4">
                        <div className="hidden lg:block w-full max-w-md">
                            <SearchForm onSearch={onSearch} disabled={searchDisabled} initialQuery={searchQuery} />
                        </div>
                    </div>
                    
                    {/* Left Group: Brand Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Logo dataSourceStatus={dataSourceStatus} isHomePage={isHomePage} />
                    </div>
                </div>

                {/* Row 2: Search Form - Always open and prominent on a separate line (hidden on desktop) */}
                <div className="lg:hidden pb-3 pt-1.5 border-t border-border-default/10">
                    <div className="w-full max-w-xl mx-auto">
                        <SearchForm onSearch={onSearch} disabled={searchDisabled} initialQuery={searchQuery} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;