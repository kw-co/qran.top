import React from 'react';
import { 
    ALL_ARABIC_LETTERS_ORDERED, 
    PURE_NOORANI_LETTERS,
    normalizeCharForNoorani 
} from '../../utils/nooraniAyahs';
import { SparklesIcon, CheckIcon } from '../icons';

interface NooraniLetterMatrixProps {
    allowedLetters: string[];
    onToggleLetter: (letter: string) => void;
    onResetToPure: () => void;
    onResetWithWaw: () => void;
    onSelectHawamim?: () => void;
    onSelectAll?: () => void;
    onClearAll?: () => void;
    letterFrequencies?: { [key: string]: number };
    allowWaw: boolean;
    onToggleWaw: (allow: boolean) => void;
}

export const NooraniLetterMatrix: React.FC<NooraniLetterMatrixProps> = ({
    allowedLetters,
    onToggleLetter,
    onResetToPure,
    onResetWithWaw,
    onSelectHawamim,
    onSelectAll,
    onClearAll,
    letterFrequencies = {},
    allowWaw,
    onToggleWaw
}) => {
    const allowedSet = new Set(allowedLetters.map(normalizeCharForNoorani));
    const pureSet = new Set(PURE_NOORANI_LETTERS.map(normalizeCharForNoorani));
    const isHawamimOnly = allowedLetters.length === 2 && allowedSet.has('ح') && allowedSet.has('م');

    return (
        <div className="p-4 sm:p-5 bg-surface border border-border-default rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-primary" />
                        <span>مصفوفة الحروف الـ 28 (التحكم والتخصيص التفاعلي)</span>
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                        انقر على أي حرف لإضافته أو استبعاده من المسح اللحظي للآيات.
                    </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={onResetToPure}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !allowWaw && allowedLetters.length === 14 && !isHawamimOnly
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default'
                        }`}
                    >
                        النمط الصافي (14 حرفاً)
                    </button>

                    <button
                        onClick={onResetWithWaw}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            allowWaw && allowedLetters.length === 15 && !isHawamimOnly
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border border-border-default'
                        }`}
                    >
                        + حرف الواو (15 حرفاً)
                    </button>

                    {onSelectHawamim && (
                        <button
                            onClick={onSelectHawamim}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isHawamimOnly
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-surface-subtle hover:bg-surface-hover text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}
                            title="تحديد حروف الحواميم (ح، م) فقط"
                        >
                            <span>حروف الحواميم (ح، م)</span>
                        </button>
                    )}

                    {onSelectAll && (
                        <button
                            onClick={onSelectAll}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                allowedLetters.length === 28
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                            }`}
                            title="تحديد كافة حروف المعجم الـ 28"
                        >
                            تحديد الكل
                        </button>
                    )}

                    {onClearAll && (
                        <button
                            onClick={onClearAll}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface-hover text-rose-600 dark:text-rose-400 border border-border-default transition-all cursor-pointer"
                            title="إلغاء تحديد كافة الحروف"
                        >
                            مسح التحديد
                        </button>
                    )}
                </div>
            </div>

            {/* Matrix of 28 Letters */}
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 sm:gap-2 pt-1" dir="rtl">
                {ALL_ARABIC_LETTERS_ORDERED.map((letter) => {
                    const norm = normalizeCharForNoorani(letter);
                    const isAllowed = allowedSet.has(norm);
                    const isPureNoorani = pureSet.has(norm);
                    const isWaw = norm === 'و';
                    const freq = letterFrequencies[norm] || 0;

                    let bgStyle = 'bg-surface-subtle text-text-muted border-border-default opacity-60 hover:opacity-100';
                    if (isAllowed) {
                        if (isWaw) {
                            bgStyle = 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40 font-bold shadow-xs';
                        } else if (isPureNoorani) {
                            bgStyle = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold shadow-xs';
                        } else {
                            bgStyle = 'bg-primary/15 text-primary border-primary/40 font-bold shadow-xs';
                        }
                    }

                    return (
                        <button
                            key={letter}
                            onClick={() => {
                                if (isWaw) {
                                    onToggleWaw(!allowWaw);
                                } else {
                                    onToggleLetter(norm);
                                }
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 ${bgStyle}`}
                            title={`الحرف: ${letter} ${isPureNoorani ? '(نوراني)' : isWaw ? '(واو)' : '(غير نوراني)'} - التكرار: ${freq}`}
                        >
                            <span className="text-base sm:text-lg font-quran leading-none mb-1">
                                {letter}
                            </span>
                            <span className="text-[10px] opacity-75 leading-none">
                                {freq > 0 ? freq : '0'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] sm:text-xs text-text-muted border-t border-border-default/60">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/60 inline-block"></span>
                        <span>الحروف النورانية الـ 14 (مفعلة)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-sky-500/30 border border-sky-500/60 inline-block"></span>
                        <span>حرف الواو (و)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-surface-subtle border border-border-default inline-block opacity-60"></span>
                        <span>حروف أخرى (غير مفعلة)</span>
                    </span>
                </div>

                <span className="font-semibold text-text-primary">
                    الحروف المفعلة حالياً: {allowedLetters.length} من 28 حرفاً
                </span>
            </div>
        </div>
    );
};
