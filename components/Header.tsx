import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MenuIcon, LogoIcon } from './icons';
import SearchForm from './SearchForm';
import ThemeToggleButton from './ThemeToggleButton';
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

const Logo: React.FC = () => {
    const [adminClickCount, setAdminClickCount] = useState(0);
    const lastTapRef = React.useRef<number>(0);

    const triggerForceReload = () => {
        const win = window as any;
        if (typeof win.__qranForceReload === 'function') {
            win.__qranForceReload();
        } else {
            window.location.reload();
        }
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        const now = Date.now();
        // Support rapid double-tap on mobile (< 380ms) as well as desktop e.detail === 2
        if (e.detail === 2 || (now - lastTapRef.current > 0 && now - lastTapRef.current < 380)) {
            lastTapRef.current = 0;
            triggerForceReload();
            return;
        }
        lastTapRef.current = now;

        const newCount = adminClickCount + 1;
        setAdminClickCount(newCount);
        if (newCount >= 12) {
            window.location.hash = '#/admin';
            setAdminClickCount(0);
            return;
        }
        
        // Navigate home on single logo click
        if (window.location.hash !== '#/' && window.location.hash !== '') {
            window.location.hash = '#/';
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerForceReload();
    };

    return (
        <div 
            onClick={handleLogoClick} 
            onDoubleClick={handleDoubleClick}
            dir="ltr" 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none pl-0.5 sm:pl-1 active:scale-95 transition-transform" 
            title="انقر للرئيسية - انقر مرتين لتحديث التطبيق لأحدث إصدار"
        >
            <LogoIcon className="w-7 h-7 text-primary flex-shrink-0" />
            <span className="hidden md:inline text-lg sm:text-xl font-bold text-text-primary tracking-tighter whitespace-nowrap">
                الباحث
            </span>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({
    setIsSidePanelOpen,
    currentPath,
    onSearch,
    searchDisabled,
}) => {
    // Auto-hide search bar on scroll down, show on scroll up on mobile
    const [isSearchVisible, setIsSearchVisible] = useState(true);

    useEffect(() => {
        let lastY = window.scrollY;
        let scrollUpAccumulator = 0;
        let scrollDownAccumulator = 0;

        const handleScroll = () => {
            if (window.innerWidth >= 768) {
                setIsSearchVisible(true);
                return;
            }

            const currentScrollY = window.scrollY;
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
                scrollDownAccumulator += delta;
                scrollUpAccumulator = 0;
                if (scrollDownAccumulator > 30) {
                    setIsSearchVisible(false);
                    scrollDownAccumulator = 0;
                }
            } else if (delta < 0) {
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
    
    const { fontStyle, setFontStyle, setSelectedEdition } = useSettingsContext();

    const { isSurahOrPage, searchQuery } = useMemo(() => {
        const path = currentPath.split('?')[0];
        const isSearch = path.startsWith('#/search/');
        const isSurah = path.startsWith('#/surah/');
        const isPage = path.startsWith('#/page/');
        
        let query = "";
        if (isSearch) {
            const parts = path.split('/');
            if (parts[2] === 'number') {
                query = parts[3] ? decodeURIComponent(parts[3]) : '';
            } else {
                query = parts[2] ? decodeURIComponent(parts[2]) : '';
            }
        }

        return { 
            isSurahOrPage: isSurah || isPage, 
            searchQuery: query
        };
    }, [currentPath]);

    // Always revert to Uthmani display mode when exiting a Surah/Page
    useEffect(() => {
        if (!isSurahOrPage && fontStyle === 'mushaf') {
            setFontStyle('uthmani');
            setSelectedEdition('quran-uthmani-quran-academy');
        }
    }, [isSurahOrPage, fontStyle, setFontStyle, setSelectedEdition]);

    const handleSearchWithReset = useCallback((query: string) => {
        if (fontStyle === 'mushaf') {
            setFontStyle('uthmani');
            setSelectedEdition('quran-uthmani-quran-academy');
        }
        onSearch(query);
    }, [fontStyle, setFontStyle, setSelectedEdition, onSearch]);

    return (
        <header className={`sticky top-0 z-30 bg-surface/95 backdrop-blur-md shadow-xs border-b border-border-default transition-transform duration-150 ease-out ${
            isSearchVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        }`}>
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
                <div className="flex items-center justify-between h-13 sm:h-14 gap-1.5 sm:gap-3">
                    {/* Right Group: Menu Drawer (and Theme Toggle on Desktop only) */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={() => setIsSidePanelOpen(true)}
                            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-primary rounded-full bg-surface-subtle hover:bg-surface-hover transition-colors border border-border-default/60 shadow-xs active:scale-95 cursor-pointer"
                            aria-label="فتح القائمة"
                            title="القائمة الرئيسية"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>

                        <div className="hidden md:block">
                            <ThemeToggleButton />
                        </div>
                    </div>

                    {/* Center Group: Unified Single-Line Search Bar (Maximized Width on Mobile) */}
                    <div className="flex-1 flex items-center justify-center min-w-0 px-0.5 sm:px-3">
                        <div className="w-full max-w-xl">
                            <SearchForm onSearch={handleSearchWithReset} disabled={searchDisabled} initialQuery={searchQuery} />
                        </div>
                    </div>
                    
                    {/* Left Group: Brand Logo Icon */}
                    <div className="flex items-center flex-shrink-0">
                        <Logo />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;