import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './index.css';
import type { SurahData, Ayah, SavedItem } from './types';
import { useQuranData } from './hooks/useQuranData';
import { useSettings } from './hooks/useSettings';
import { useRouting } from './hooks/useRouting';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useNotebook } from './hooks/useNotebook';
import { useSearch } from './hooks/useSearch';
import { useServiceWorkerUpdater } from './hooks/useServiceWorkerUpdater';
import { SettingsProvider } from './contexts/SettingsContext';
import { safeLocalStorage } from './utils/storage';
import AppRouter from './components/AppRouter';
import TopProgressBar from './components/TopProgressBar';
import SidePanel from './components/SidePanel';
import AudioPlayerBar from './components/AudioPlayerBar';
import Toolbox from './components/Toolbox';

import { ArrowUpIcon, RefreshIcon, WifiOffIcon, ArrowRightIcon, HomeIcon, CheckIcon } from './components/icons';
import Header from './components/Header';
import ExternalLinkModal from './components/ExternalLinkModal';
import DownloadMushafModal from './components/DownloadMushafModal';


const App: React.FC = () => {
    // --- State from Hooks ---
    const {
        allQuranData, isInitialLoading, isBackgroundLoading, loadingEditions,
        fetchCustomEditionData, dataSourceStatus, error: dataError, clearError
    } = useQuranData();

    const { currentPath, pathParts, queryParams } = useRouting();

    // Initialize settings hook here, then pass results to Provider
    const settings = useSettings();
    const { selectedEdition, selectedAudioEdition, setSelectedAudioEdition, displayEdition } = settings;
    
    const { 
        simpleSearchableAyahs, 
        tryParseAyahReference, 
        performSearch, 
        performSearchByAyahNumber 
    } = useSearch(allQuranData);

    const {
        playbackInfo, currentlyPlayingAyahGlobalNumber, selectedAudioEditionDetails,
        handleStartPlayback, handlePlayPause, handlePlay, handlePause, handleNext, handlePrev, 
        handleAyahEnded, handleClosePlayback,
        repeatAyahTarget, setRepeatAyahTarget, currentAyahRepeatCount,
        repeatPlaylistTarget, setRepeatPlaylistTarget, currentPlaylistCycle,
        delaySeconds, setDelaySeconds, playbackSpeed, setPlaybackSpeed
    } = useAudioPlayer(currentPath, allQuranData, selectedAudioEdition, setSelectedAudioEdition, fetchCustomEditionData);

    const {
        collections, handleSaveItem,
        handleDeleteCollection, handleDeleteSavedItem, handleExportNotebook,
        handleImportNotebook, updateItemNotes, updateSavedItem, handleClearAll,
        handleReorderItems, handleMoveItem,
    } = useNotebook();
    
    useServiceWorkerUpdater();
    
    const { isUpdateAvailable: isAppUpdateAvailable, applyUpdate: handleAppUpdate } = { isUpdateAvailable: false, applyUpdate: () => {} };
    
    // --- App-level State ---
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showScroll, setShowScroll] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [externalLinkUrl, setExternalLinkUrl] = useState<string | null>(null);
    const [appToast, setAppToast] = useState<{ message: string; type?: 'success' | 'info'; link?: string; linkText?: string } | null>(null);

    // Global Toast listener
    useEffect(() => {
        const handleToastEvent = (e: any) => {
            if (e.detail && e.detail.message) {
                setAppToast({
                    message: e.detail.message,
                    type: e.detail.type || 'success',
                    link: e.detail.link,
                    linkText: e.detail.linkText,
                });
                const timer = setTimeout(() => {
                    setAppToast(null);
                }, 3500);
                return () => clearTimeout(timer);
            }
        };

        window.addEventListener('app-toast', handleToastEvent);
        return () => window.removeEventListener('app-toast', handleToastEvent);
    }, []);

    useEffect(() => {
        const handleShowModal = (e: Event) => {
            const customEvent = e as CustomEvent<{ url: string }>;
            if (customEvent.detail?.url) {
                setExternalLinkUrl(customEvent.detail.url);
            }
        };
        window.addEventListener('show-external-link-modal', handleShowModal);
        return () => window.removeEventListener('show-external-link-modal', handleShowModal);
    }, []);
    
    // --- UI Effects ---
    const checkScrollTop = useCallback(() => {
        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        setShowScroll(scrollTop > 300);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', checkScrollTop, { passive: true });
        checkScrollTop();
        return () => window.removeEventListener('scroll', checkScrollTop);
    }, [currentPath, checkScrollTop]);

    useEffect(() => {
        if (!isInitialLoading) {
            const loader = document.querySelector('.static-loader');
            if (loader) {
                (loader as HTMLElement).style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }
        }
    }, [isInitialLoading]);

    // --- Search Handlers ---
    const handleSearch = (query: string, sourceEdition?: string, position?: { surah: number; ayah: number; wordIndex: number; }, isRootSearch?: boolean, targetSurahNumber?: number, exactMatchOverride?: boolean) => {
        const ayahRef = tryParseAyahReference(query);
        if (ayahRef && !position) {
            window.location.hash = `#/surah/${ayahRef.surah}?ayah=${ayahRef.ayah}`;
            return;
        }
        setIsSearching(true);
        let url = `#/search/${encodeURIComponent(query)}?search_edition=${sourceEdition || 'quran-simple-clean'}`;
        if (isRootSearch) url += `&mode=root`;
        if (targetSurahNumber) url += `&ts=${targetSurahNumber}`;
        if (position) url += `&s=${position.surah}&a=${position.ayah}&w=${position.wordIndex}`;
        if (exactMatchOverride) url += `&exact=1`;
        window.location.hash = url;
    };

    const handleSearchByAyahNumber = (ayahNumber: number) => {
        setIsSearching(true);
        window.location.hash = `#/search/number/${ayahNumber}`;
    };


    // --- Other Handlers ---
    const scrollToTop = () => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch {
            window.scrollTo(0, 0);
        }
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
    };

    // --- Data Derivations for Views ---
    const quranData = useMemo(() => allQuranData?.[selectedEdition], [allQuranData, selectedEdition]);
    
    const hizbQuarterStartMap = useMemo(() => {
        if (!simpleSearchableAyahs) return new Map<number, number>();
        const map = new Map<number, number>();
        simpleSearchableAyahs.forEach(ayah => {
            if (ayah.hizbQuarter && !map.has(ayah.hizbQuarter)) {
                map.set(ayah.hizbQuarter, ayah.number);
            }
        });
        return map;
    }, [simpleSearchableAyahs]);
    
    const isPageWithToolbox = useMemo(() => 
        currentPath.startsWith('#/surah/') || currentPath.startsWith('#/search/') || currentPath.startsWith('#/page/'), 
    [currentPath]);

    const isSearchDataReady = simpleSearchableAyahs.length > 0;

    // --- Retry Handler ---
    const handleRetryLoading = () => {
        window.location.reload();
    };

    // --- Intercept Back Button for Active Overlays or Error State ---
    useEffect(() => {
        const handlePopState = () => {
            if (dataError && !isSearchDataReady) {
                // If on error screen and user presses back, return to home and reset error
                clearError();
                window.location.hash = '#/';
            } else if (settings.isDownloadMushafModalOpen) {
                settings.closeDownloadMushafModal();
            } else if (isSidePanelOpen) {
                setIsSidePanelOpen(false);
            } else if (externalLinkUrl) {
                setExternalLinkUrl(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [dataError, isSearchDataReady, clearError, isSidePanelOpen, externalLinkUrl, settings.isDownloadMushafModalOpen, settings.closeDownloadMushafModal]);

    const handleReturnToHome = () => {
        clearError();
        window.location.hash = '#/';
    };

    if (dataError && !isSearchDataReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-text-primary p-4 text-center animate-fade-in" dir="rtl">
                <div className="max-w-sm w-full mx-auto p-6 rounded-2xl border border-border-default bg-surface shadow-xl flex flex-col items-center">
                    <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-4">
                        <WifiOffIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-text-primary">تعذر تحميل البيانات الأساسية</h2>
                    <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                        يبدو أن هناك مشكلة في الاتصال بالإنترنت. يحتاج التطبيق للاتصال بالشبكة عند الفتح لأول مرة لتحميل البيانات.
                    </p>
                    <div className="w-full flex flex-col gap-2.5">
                        <button 
                            onClick={handleRetryLoading}
                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-md text-sm cursor-pointer active:scale-95"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            <span>إعادة المحاولة</span>
                        </button>
                        <button 
                            onClick={handleReturnToHome}
                            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-subtle text-text-primary hover:text-primary font-semibold rounded-xl hover:bg-surface-hover transition-colors border border-border-default text-sm cursor-pointer active:scale-95"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                            <span>العودة إلى الفهرس</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SettingsProvider value={settings}>
            <div className="bg-background text-text-primary min-h-screen transition-colors duration-300">
                <TopProgressBar isSearching={isSearching || isBackgroundLoading || loadingEditions.length > 0 || settings.isDownloadingFonts} />
                    <SidePanel 
                        isOpen={isSidePanelOpen}
                        onClose={() => setIsSidePanelOpen(false)}
                        currentPath={currentPath}
                        onNavigate={(path) => {
                            const currentHash = window.location.hash || '#/';
                            if (currentHash !== path) {
                                window.location.hash = path;
                            }
                            setIsSidePanelOpen(false);
                        }}
                    />
                    <Header
                        setIsSidePanelOpen={setIsSidePanelOpen}
                        currentPath={currentPath}
                        dataSourceStatus={dataSourceStatus}
                        onSearch={handleSearch}
                        searchDisabled={isInitialLoading || !isSearchDataReady}
                        loadingEditions={loadingEditions}
                        onStartPlayback={handleStartPlayback}
                        isPlaybackLoading={!!playbackInfo?.trigger}
                    />
                    <main className="pt-8 pb-24">
                        <AppRouter
                            pathParts={pathParts}
                            queryParams={queryParams}
                            isInitialLoading={isInitialLoading}
                            quranData={quranData}
                            simpleSearchableAyahs={simpleSearchableAyahs}
                            collections={collections}
                            allQuranData={allQuranData}
                            fetchCustomEditionData={fetchCustomEditionData}
                            handleDeleteCollection={handleDeleteCollection}
                            handleDeleteSavedItem={handleDeleteSavedItem}
                            updateItemNotes={updateItemNotes}
                            updateSavedItem={updateSavedItem}
                            handleReorderItems={handleReorderItems}
                            handleMoveItem={handleMoveItem}
                            handleClearAll={handleClearAll}
                            handleExportNotebook={handleExportNotebook}
                            handleImportNotebook={handleImportNotebook}
                            handleSearch={handleSearch}
                            handleSaveItem={handleSaveItem as (item: SavedItem) => void}
                            handleSearchByAyahNumber={handleSearchByAyahNumber}
                            currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
                            playbackInfo={playbackInfo}
                            handleStartPlayback={handleStartPlayback as (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number, options?: any) => void}
                            hizbQuarterStartMap={hizbQuarterStartMap}
                            setIsSearching={setIsSearching}
                            performSearchByAyahNumber={performSearchByAyahNumber}
                            performSearch={performSearch}
                            setIsSidePanelOpen={setIsSidePanelOpen}
                        />
                    </main>

                    {/* Global Floating Toast for 1-Click Saving & Actions */}
                    {appToast && (
                        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 animate-fade-in max-w-md">
                            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900/95 dark:bg-neutral-800/95 text-white rounded-2xl shadow-2xl border border-neutral-700/60 backdrop-blur-md">
                                <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                                    <CheckIcon className="w-4 h-4" />
                                </div>
                                <div className="text-xs sm:text-sm font-medium flex-grow">
                                    {appToast.message}
                                </div>
                                {appToast.link && (
                                    <a
                                        href={appToast.link}
                                        onClick={() => setAppToast(null)}
                                        className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors flex-shrink-0"
                                    >
                                        {appToast.linkText || 'عرض'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {isPageWithToolbox && <Toolbox
                        isAudioPlayerVisible={!!playbackInfo}
                        onStartPlayback={handleStartPlayback as (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void}
                        isPlaybackLoading={!!playbackInfo?.trigger}
                        currentPath={currentPath}
                    />}
                    {externalLinkUrl && <ExternalLinkModal url={externalLinkUrl} onClose={() => setExternalLinkUrl(null)} />}
                    <DownloadMushafModal 
                        isOpen={settings.isDownloadMushafModalOpen} 
                        onClose={settings.closeDownloadMushafModal} 
                    />
                    {playbackInfo && <AudioPlayerBar 
                        playlist={playbackInfo.playlist} 
                        currentIndex={playbackInfo.currentIndex}
                        isPlaying={playbackInfo.isPlaying} 
                        isLoading={!!playbackInfo?.trigger}
                        onPlayPause={handlePlayPause} 
                        onPlay={handlePlay} 
                        onPause={handlePause} 
                        onNext={handleNext} 
                        onPrev={handlePrev}
                        onEnded={handleNext} 
                        onAyahEnded={handleAyahEnded}
                        onClose={handleClosePlayback}
                        audioEdition={selectedAudioEditionDetails}
                        repeatAyahTarget={repeatAyahTarget}
                        setRepeatAyahTarget={setRepeatAyahTarget}
                        currentAyahRepeatCount={currentAyahRepeatCount}
                        repeatPlaylistTarget={repeatPlaylistTarget}
                        setRepeatPlaylistTarget={setRepeatPlaylistTarget}
                        currentPlaylistCycle={currentPlaylistCycle}
                        delaySeconds={delaySeconds}
                        setDelaySeconds={setDelaySeconds}
                        playbackSpeed={playbackSpeed}
                        setPlaybackSpeed={setPlaybackSpeed}
                    />}
                    {showScroll && (
                        <button 
                            onClick={scrollToTop} 
                            className={`fixed left-4 sm:left-8 z-50 p-3.5 sm:p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-primary-hover active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 cursor-pointer ${
                                !!playbackInfo ? 'bottom-28' : 'bottom-8'
                            }`} 
                            aria-label="الانتقال إلى الأعلى"
                            title="الصعود للأعلى"
                        >
                            <ArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    )}
                
            </div>
        </SettingsProvider>
    );
};

export default App;