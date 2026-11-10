import React, { useState, useEffect, useMemo } from 'react';
import type { SurahReference, Collections, SavedItem, SurahData } from '../types';
import { safeLocalStorage } from '../utils/storage';
import { formatSurahNameForDisplay } from '../utils/text';
import { BookmarkIcon, TrashIcon, BookOpenIcon, ArrowRightIcon, ArrowLeftIcon } from './icons';
import SavedView from './SavedView';

export interface HistoryViewProps {
    surahList: SurahReference[];
    allQuranData?: { [key: string]: SurahData[] } | null;
    initialTab?: 'history' | 'saved';
    collections?: Collections;
    collectionId?: string | null;
    items?: SavedItem[];
    onDeleteCollection?: (collectionId: string) => void;
    onDeleteSavedItem?: (collectionId: string, itemId: string) => void;
    onUpdateNotes?: (collectionId: string, itemId: string, notes: string) => void;
    onUpdateItem?: (itemId: string, updates: { notes?: string; customText?: string | null }) => void;
    onExportNotebook?: () => Promise<string>;
    onImportNotebook?: (content: string) => Promise<void>;
    onClearAll?: () => void;
    onReorderItems?: (items: SavedItem[]) => void;
    onMoveItem?: (itemId: string, direction: 'up' | 'down') => void;
}

interface ReadingStop {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    pageNumber?: number;
    ayahText?: string;
    timestamp: number;
}

const formatFullArabicDate = (timestamp: number) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        
        const isToday = date.getDate() === now.getDate() && 
                        date.getMonth() === now.getMonth() && 
                        date.getFullYear() === now.getFullYear();
                        
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() && 
                            date.getMonth() === yesterday.getMonth() && 
                            date.getFullYear() === yesterday.getFullYear();

        const timeString = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (isToday) {
            return `اليوم، ${timeString}`;
        } else if (isYesterday) {
            return `أمس، ${timeString}`;
        } else {
            const dateString = date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
            return `${dateString}، ${timeString}`;
        }
    } catch {
        return '';
    }
};

const formatRelativeTime = (timestamp: number) => {
    try {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} د`;
        if (hours < 24) return `منذ ${hours} س`;
        return `منذ ${days} ي`;
    } catch {
        return '';
    }
};

const HistoryView: React.FC<HistoryViewProps> = ({
    surahList,
    allQuranData,
    initialTab,
    collections,
    collectionId,
    items: propsItems,
    onDeleteCollection,
    onDeleteSavedItem,
    onUpdateNotes,
    onUpdateItem,
    onExportNotebook,
    onImportNotebook,
    onClearAll,
    onReorderItems,
    onMoveItem,
}) => {
    // Tab state: 'history' or 'saved'
    const [activeTab, setActiveTab] = useState<'history' | 'saved'>(() => {
        if (initialTab) return initialTab;
        if (typeof window !== 'undefined' && window.location.hash.startsWith('#/saved')) {
            return 'saved';
        }
        return 'history';
    });

    const [stops, setStops] = useState<ReadingStop[]>([]);
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Sync active tab with location hash
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#/saved')) {
                setActiveTab('saved');
            } else if (hash.startsWith('#/history')) {
                setActiveTab('history');
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Load reading stops from local storage with legacy validation
    useEffect(() => {
        try {
            const stored = safeLocalStorage.getItem('qran_reading_stops');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    const validStops = parsed.filter(
                        (s: any) => s && typeof s === 'object' && Number(s.surahNumber) > 0 && Number(s.ayahNumber) > 0
                    );
                    setStops(validStops);
                }
            }
        } catch (e) {
            console.error("Failed to load reading stops in HistoryView", e);
        }
    }, []);

    // Count saved items for tab badge
    const totalSavedCount = useMemo(() => {
        if (propsItems) return propsItems.length;
        if (collections) {
            let count = 0;
            Object.values(collections).forEach(col => {
                if (col && Array.isArray(col.items)) {
                    count += col.items.length;
                }
            });
            return count;
        }
        return 0;
    }, [propsItems, collections]);

    const handleTabSwitch = (tab: 'history' | 'saved') => {
        setActiveTab(tab);
        if (tab === 'saved') {
            window.location.hash = '#/saved';
        } else {
            window.location.hash = '#/history';
        }
    };

    const handleDeleteStop = (e: React.MouseEvent, indexToDelete: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const updated = stops.filter((_, idx) => idx !== indexToDelete);
            setStops(updated);
            safeLocalStorage.setItem('qran_reading_stops', JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to delete reading stop", e);
        }
    };

    const handleClearAll = () => {
        try {
            setStops([]);
            safeLocalStorage.removeItem('qran_reading_stops');
            setShowConfirmClear(false);
        } catch (e) {
            console.error("Failed to clear reading stops", e);
        }
    };

    const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = '#/';
    };

    // Helper to find Ayah text if not present in stop object
    const getAyahText = (stop: ReadingStop): string => {
        if (stop.ayahText && stop.ayahText.trim().length > 0) {
            return stop.ayahText;
        }
        if (!allQuranData) return '';
        const datasets = ['quran-uthmani-quran-academy', 'quran-uthmani', 'quran-simple-clean'];
        for (const key of datasets) {
            const list = allQuranData[key];
            if (list && list.length > 0) {
                const s = list.find(item => item.number === stop.surahNumber);
                if (s && s.ayahs) {
                    const a = s.ayahs.find(item => item.numberInSurah === stop.ayahNumber);
                    if (a && a.text) return a.text;
                }
            }
        }
        return '';
    };

    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto px-3 sm:px-4 py-2" dir="rtl">
            {/* Top Navigation Row & Segmented Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-border-default">
                {/* Back Link */}
                <a 
                    href="#/" 
                    onClick={handleBackClick}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-muted hover:text-primary transition-colors cursor-pointer self-start"
                >
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>العودة للرئيسية</span>
                </a>

                {/* Unified Segmented Tabs */}
                <div className="inline-flex items-center bg-surface-subtle p-1 rounded-xl border border-border-subtle shadow-xs self-stretch sm:self-auto">
                    <button
                        type="button"
                        onClick={() => handleTabSwitch('history')}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'history'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>سجل التصفح</span>
                        {stops.length > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                            }`}>
                                {stops.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabSwitch('saved')}
                        className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'saved'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <BookmarkIcon className="w-4 h-4" />
                        <span>الدفتر (المحفوظات)</span>
                        {totalSavedCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                                activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                            }`}>
                                {totalSavedCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: Notebook (الدفتر) */}
            {activeTab === 'saved' && (
                <main className="w-full">
                    <SavedView 
                        collections={collections} 
                        collectionId={collectionId} 
                        items={propsItems}
                        allQuranData={allQuranData}
                        onDeleteCollection={onDeleteCollection} 
                        onDeleteSavedItem={onDeleteSavedItem} 
                        onUpdateNotes={onUpdateNotes} 
                        onUpdateItem={onUpdateItem}
                        onExportNotebook={onExportNotebook}
                        onImportNotebook={onImportNotebook}
                        onClearAll={onClearAll}
                        onReorderItems={onReorderItems}
                        onMoveItem={onMoveItem}
                    />
                </main>
            )}

            {/* TAB CONTENT: History (سجل التصفح) */}
            {activeTab === 'history' && (
                <main className="w-full">
                    {/* Header info bar */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary font-quran-title">
                                سجل التصفح
                            </h1>
                            <p className="text-xs text-text-secondary mt-0.5">
                                مواضع قراءتك وتصفحك مسجلة هنا تلقائياً لتمكنك من استئناف القراءة بسهولة
                            </p>
                        </div>

                        {stops.length > 0 && (
                            <div className="flex-shrink-0">
                                {!showConfirmClear ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmClear(true)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10 cursor-pointer"
                                        title="مسح جميع مواضع التصفح"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                        <span>مسح السجل</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-1 rounded-lg">
                                        <span className="text-[11px] text-red-500 font-semibold px-1">تأكيد؟</span>
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="px-2 py-0.5 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer"
                                        >
                                            امسح
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmClear(false)}
                                            className="px-2 py-0.5 text-[11px] font-semibold text-text-secondary bg-surface hover:bg-surface-hover border border-border-default rounded cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Compact ("منمنم") Reading Stops List */}
                    {stops.length > 0 ? (
                        <div className="space-y-2 sm:space-y-2.5">
                            {stops.map((stop, index) => {
                                const stopSurah = surahList.find(s => s.number === stop.surahNumber);
                                const displayName = stopSurah ? formatSurahNameForDisplay(stopSurah.name) : stop.surahName;
                                const linkUrl = stop.pageNumber ? `#/page/${stop.pageNumber}?ayah=${stop.ayahNumber}` : `#/surah/${stop.surahNumber}?ayah=${stop.ayahNumber}`;
                                const ayahText = getAyahText(stop);

                                return (
                                    <div 
                                        key={`history-stop-${index}-${stop.timestamp}`}
                                        className="group relative bg-surface border border-border-default/80 hover:border-primary/50 rounded-xl p-2.5 sm:p-3 transition-all duration-200 shadow-xs hover:shadow-sm"
                                    >
                                        {/* Top Meta & Action Row */}
                                        <div className="flex items-center justify-between gap-2">
                                            {/* Left side in RTL: Surah info and badges */}
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                <span className="text-sm font-bold text-text-primary">
                                                    سورة {displayName}
                                                </span>

                                                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                                                    الآية {stop.ayahNumber}
                                                </span>

                                                {stop.pageNumber && (
                                                    <span className="text-xs bg-surface-subtle border border-border-subtle text-text-secondary px-1.5 py-0.5 rounded-md font-mono">
                                                        ص {stop.pageNumber}
                                                    </span>
                                                )}

                                                <span className="text-[11px] text-text-muted flex items-center gap-1 mr-1">
                                                    <span>{formatRelativeTime(stop.timestamp)}</span>
                                                    {formatFullArabicDate(stop.timestamp) && (
                                                        <span className="hidden sm:inline text-text-muted/60">
                                                            • {formatFullArabicDate(stop.timestamp)}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <a
                                                    href={linkUrl}
                                                    className="px-2.5 py-1 bg-primary text-white hover:bg-primary-hover font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                                                    title="استئناف القراءة من هذا الموضع"
                                                >
                                                    <span>مواصلة</span>
                                                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                                                </a>

                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteStop(e, index)}
                                                    className="p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                                    title="حذف هذا الموضع"
                                                    aria-label="حذف"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Ayah Text Display (Compact, elegant, with font-uthmani) */}
                                        {ayahText ? (
                                            <div className="mt-1.5 pt-1.5 border-t border-border-subtle/50 text-right">
                                                <p className="text-sm text-text-primary/90 font-uthmani leading-relaxed line-clamp-2 select-text">
                                                    ﴿ {ayahText} ﴾
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 bg-surface rounded-xl border border-border-default shadow-xs max-w-md mx-auto mt-4">
                            <div className="w-12 h-12 bg-surface-subtle border border-border-subtle rounded-xl flex items-center justify-center text-text-muted/40 mx-auto mb-3">
                                <BookOpenIcon className="w-6 h-6" />
                            </div>
                            <h2 className="text-base font-bold text-text-primary mb-1">سجل التصفح فارغ</h2>
                            <p className="text-text-secondary text-xs leading-relaxed max-w-xs mx-auto mb-4">
                                عند تصفحك للسور والصفحات، سيتم تسجيل آخر مواضع قراءتك هنا تلقائياً لتعود إليها في أي لحظة.
                            </p>
                            <a
                                href="#/"
                                onClick={handleBackClick}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary-hover transition-all cursor-pointer"
                            >
                                <span>ابدأ القراءة الآن</span>
                            </a>
                        </div>
                    )}
                </main>
            )}
        </div>
    );
};

export default HistoryView;
