import React, { useState } from 'react';
import type { AyahNooraniAnalysis } from '../../utils/nooraniAyahs';
import type { SavedAyahItem } from '../../types';
import { 
    BookOpenIcon, 
    CopyIcon, 
    CheckIcon, 
    SparklesIcon, 
    SpeakerWaveIcon 
} from '../icons';

interface NooraniAyahCardProps {
    item: AyahNooraniAnalysis;
    onSaveAyah?: (item: SavedAyahItem) => void;
    onPlayAyah?: (ayahNumberGlobal: number) => void;
    isPlaying?: boolean;
    displayMode?: 'words' | 'text';
}

export const NooraniAyahCard: React.FC<NooraniAyahCardProps> = ({
    item,
    onSaveAyah,
    onPlayAyah,
    isPlaying = false,
    displayMode = 'text'
}) => {
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = `${item.textOriginal} [سورة ${item.surahName}: ${item.ayahNumberInSurah}]`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSaveAyah) {
            onSaveAyah({
                type: 'ayah',
                id: `${item.surahNumber}:${item.ayahNumberInSurah}`,
                surah: item.surahNumber,
                ayah: item.ayahNumberInSurah,
                text: item.textOriginal,
                createdAt: Date.now(),
                notes: `آية نورانية (${item.percentage}% نقاوة نورانية)`
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
    };

    const navigateToMushaf = () => {
        window.location.hash = `#/surah/${item.surahNumber}?ayah=${item.ayahNumberInSurah}`;
    };

    return (
        <div 
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 bg-surface ${
                item.isPure 
                    ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-xs hover:shadow-md' 
                    : 'border-border-default hover:border-border-hover shadow-xs'
            }`}
        >
            {/* Top Bar / Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-4 bg-surface-subtle border-b border-border-default/60">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={navigateToMushaf}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                        title="انتقل لقراءة الآية في المصحف"
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>سورة {item.surahName} : {item.ayahNumberInSurah}</span>
                    </button>

                    <span className="text-[11px] sm:text-xs text-text-muted">
                        صفحة {item.page} • جزء {item.juz}
                    </span>

                    {item.isMeccan ? (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium border border-amber-500/20">
                            مكية
                        </span>
                    ) : (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium border border-blue-500/20">
                            مدنية
                        </span>
                    )}

                    {item.isFatihahMuqattaa && (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold border border-purple-500/20">
                            فاتحة مقطعة
                        </span>
                    )}
                </div>

                {/* Purity Badge */}
                <div className="flex items-center gap-2">
                    {item.isPure ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30">
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span>100% نورانية خالصة</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            <span>{item.percentage}% نورانية</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Ayah Text Display */}
            <div className="p-4 sm:p-6">
                <div 
                    onClick={navigateToMushaf}
                    className="text-right font-quran-text text-xl sm:text-2xl lg:text-3xl text-text-primary leading-loose sm:leading-loose cursor-pointer hover:text-primary transition-colors select-text"
                    dir="rtl"
                >
                    {displayMode === 'words' ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                            {item.words.map((w, wIdx) => (
                                <span 
                                    key={wIdx}
                                    className={`inline-block px-2 py-0.5 rounded-lg text-lg sm:text-2xl transition-all ${
                                        w.isPureNoorani
                                            ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-500/20'
                                            : 'bg-surface-subtle text-text-primary border border-border-default'
                                    }`}
                                    title={w.isPureNoorani ? 'كلمة نورانية خالصة' : `تحتوي على حرف غير نوراني: ${w.nonNooraniLetters.join(', ')}`}
                                >
                                    {w.originalText}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="tracking-wide">
                            {item.textOriginal}
                        </p>
                    )}
                </div>

                {/* Non-noorani letters summary if any */}
                {!item.isPure && item.nonNooraniLettersFound.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border-default/60 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                        <span className="font-semibold text-text-muted">الأحرف غير النورانية بالآية:</span>
                        {item.nonNooraniLettersFound.map((l, lIdx) => (
                            <span 
                                key={lIdx} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/20"
                            >
                                <span>{l.letter}</span>
                                <span className="text-[10px] opacity-75">({l.count})</span>
                            </span>
                        ))}
                    </div>
                )}

                {/* Word Stats breakdown collapsible */}
                {showBreakdown && (
                    <div className="mt-4 p-3 bg-surface-subtle rounded-xl border border-border-default/80 text-xs space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-surface rounded-lg border border-border-default">
                                <div className="text-text-muted text-[11px]">عدد الكلمات</div>
                                <div className="text-sm font-bold text-text-primary">{item.words.length}</div>
                            </div>
                            <div className="p-2 bg-surface rounded-lg border border-border-default">
                                <div className="text-text-muted text-[11px]">إجمالي الحروف</div>
                                <div className="text-sm font-bold text-text-primary">{item.totalLetters}</div>
                            </div>
                            <div className="p-2 bg-surface rounded-lg border border-border-default">
                                <div className="text-text-muted text-[11px]">الحروف النورانية</div>
                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.nooraniLettersCount}</div>
                            </div>
                            <div className="p-2 bg-surface rounded-lg border border-border-default">
                                <div className="text-text-muted text-[11px]">الحروف الأخرى</div>
                                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{item.nonNooraniLettersCount}</div>
                            </div>
                        </div>

                        {item.longestNooraniWordStreak.length > 1 && (
                            <div className="pt-2 text-right">
                                <span className="text-text-muted font-semibold">أطول مقطع نوراني متصل: </span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                    "{item.longestNooraniWordStreak.text}" ({item.longestNooraniWordStreak.length} كلمات)
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-subtle/50 border-t border-border-default/60">
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs text-text-muted hover:text-primary transition-colors font-medium cursor-pointer"
                >
                    {showBreakdown ? 'إخفاء التحليل الإحصائي' : 'عرض تفاصيل الحروف والكلمات'}
                </button>

                <div className="flex items-center gap-1 sm:gap-2">
                    {onPlayAyah && (
                        <button
                            onClick={() => onPlayAyah(item.ayahNumberGlobal)}
                            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isPlaying 
                                    ? 'bg-primary text-white shadow-xs' 
                                    : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border-default'
                            }`}
                            title="استماع للآية"
                        >
                            <SpeakerWaveIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isPlaying ? 'تشغيل...' : 'استماع'}</span>
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            saved 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                        title="حفظ في الدفتر"
                    >
                        {saved ? <CheckIcon className="w-3.5 h-3.5" /> : <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="hidden sm:inline">{saved ? 'تم الحفظ' : 'الدفتر'}</span>
                    </button>

                    <button
                        onClick={handleCopy}
                        className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-hover text-text-secondary border border-border-default flex items-center gap-1 transition-colors cursor-pointer"
                        title="نسخ نص الآية"
                    >
                        {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>

                    <button
                        onClick={navigateToMushaf}
                        className="p-1.5 sm:px-3 sm:py-1 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                        <span>قراءة</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
