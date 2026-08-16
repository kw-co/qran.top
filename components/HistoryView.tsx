import React, { useState, useEffect } from 'react';
import type { SurahReference } from '../types';
import { safeLocalStorage } from '../utils/storage';
import { formatSurahNameForDisplay } from '../utils/text';
import { BookmarkIcon, TrashIcon, FlagIcon, BookOpenIcon, ArrowRightIcon } from './icons';

interface HistoryViewProps {
    surahList: SurahReference[];
}

interface ReadingStop {
    browsingMode: 'page' | 'full' | string;
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    pageNumber?: number;
    timestamp: number;
}

const formatFullArabicDate = (timestamp: number) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        
        // Check if today
        const isToday = date.getDate() === now.getDate() && 
                        date.getMonth() === now.getMonth() && 
                        date.getFullYear() === now.getFullYear();
                        
        // Check if yesterday
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
            const dateString = date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return `${dateString}، ${timeString}`;
        }
    } catch (e) {
        return 'تاريخ غير معروف';
    }
};

const formatRelativeTime = (timestamp: number) => {
    try {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        return `منذ ${days} يوم`;
    } catch (e) {
        return '';
    }
};

const HistoryView: React.FC<HistoryViewProps> = ({ surahList }) => {
    const [stops, setStops] = useState<ReadingStop[]>([]);
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    useEffect(() => {
        try {
            const stored = safeLocalStorage.getItem('qran_reading_stops');
            if (stored) {
                setStops(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load reading stops in HistoryView", e);
        }
    }, []);

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

    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto px-4" dir="rtl">
            {/* Back Navigation */}
            <div className="mb-6">
                <a 
                    href="#/" 
                    onClick={handleBackClick}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                    <span>العودة للرئيسية</span>
                </a>
            </div>

            {/* Header section with Clear All action */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-default pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight font-quran-title">
                        سجل التصفح ومواضع الحفظ
                    </h1>
                    <p className="text-text-secondary mt-2 text-sm sm:text-base leading-relaxed">
                        مواضع قراءتك وتصفحك تُحفظ هنا تلقائياً لتمكنك من العودة والمواصلة من آخر آية وقفت عندها.
                    </p>
                </div>

                {stops.length > 0 && (
                    <div className="flex-shrink-0">
                        {!showConfirmClear ? (
                            <button
                                onClick={() => setShowConfirmClear(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/10 cursor-pointer"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>مسح السجل بالكامل</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2 rounded-lg">
                                <span className="text-xs text-red-500 font-semibold px-2">هل أنت متأكد؟</span>
                                <button
                                    onClick={handleClearAll}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer"
                                >
                                    نعم، امسح
                                </button>
                                <button
                                    onClick={() => setShowConfirmClear(false)}
                                    className="px-3 py-1.5 text-xs font-semibold text-text-secondary bg-surface hover:bg-surface-hover border border-border-default rounded cursor-pointer"
                                >
                                    إلغاء
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main>
                {stops.length > 0 ? (
                    <div className="space-y-4">
                        {stops.map((stop, index) => {
                            const stopSurah = surahList.find(s => s.number === stop.surahNumber);
                            const displayName = stopSurah ? formatSurahNameForDisplay(stopSurah.name) : stop.surahName;
                            const linkUrl = stop.browsingMode === 'page' ? `#/page/${stop.pageNumber}?ayah=${stop.ayahNumber}` : `#/surah/${stop.surahNumber}?ayah=${stop.ayahNumber}`;

                            return (
                                <div 
                                    key={`history-stop-${index}-${stop.timestamp}`}
                                    className="group relative bg-surface border border-border-default rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                >
                                    {/* Stop metadata & title */}
                                    <div className="flex items-start gap-4 flex-grow">
                                        <div className="p-3 bg-primary/10 text-primary rounded-xl flex-shrink-0 flex items-center justify-center">
                                            {stop.browsingMode === 'page' ? (
                                                <BookOpenIcon className="w-6 h-6" />
                                            ) : (
                                                <FlagIcon className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-xl font-bold text-text-primary">
                                                    سورة {displayName}
                                                </h2>
                                                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                    {stop.browsingMode === 'page' ? 'عرض بالصفحات' : 'عرض بالسورة'}
                                                </span>
                                            </div>
                                            
                                            <p className="text-sm text-text-secondary">
                                                {stop.browsingMode === 'page' ? (
                                                    <>الصفحة <strong className="text-text-primary font-bold">{stop.pageNumber}</strong> • الآية <strong className="text-text-primary font-bold">{stop.ayahNumber}</strong></>
                                                ) : (
                                                    <>الآية <strong className="text-text-primary font-bold">{stop.ayahNumber}</strong></>
                                                )}
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                                                <span className="font-mono bg-surface-subtle px-2 py-1 rounded border border-border-subtle">
                                                    {formatFullArabicDate(stop.timestamp)}
                                                </span>
                                                <span className="text-[11px] text-primary font-semibold">
                                                    ({formatRelativeTime(stop.timestamp)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2.5 sm:self-center justify-end">
                                        <a
                                            href={linkUrl}
                                            className="px-5 py-2.5 bg-primary text-white hover:bg-primary-hover font-bold text-sm rounded-lg transition-all shadow-sm shadow-primary/20 hover:shadow flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>مواصلة القراءة</span>
                                        </a>

                                        <button
                                            onClick={(e) => handleDeleteStop(e, index)}
                                            className="p-2.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                                            title="حذف هذا الموضع"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-surface rounded-2xl border border-border-default shadow-sm max-w-xl mx-auto mt-6">
                        <div className="w-16 h-16 bg-surface-subtle border border-border-subtle rounded-2xl flex items-center justify-center text-text-muted/40 mx-auto mb-4">
                            <BookmarkIcon className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">سجل تصفحك خالٍ تماماً</h2>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto mb-6">
                            لا توجد أي مواضع قراءة محفوظة حتى الآن. عند تصفحك للسور والصفحات، سيتم حفظ مواضع قراءتك هنا تلقائياً لتعود إليها في أي وقت.
                        </p>
                        <a
                            href="#/"
                            onClick={handleBackClick}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/10 cursor-pointer"
                        >
                            <span>ابدأ القراءة الآن</span>
                        </a>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryView;
