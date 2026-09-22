import React, { useState, useMemo } from 'react';
import { BookOpenIcon, ArrowRightIcon, CopyIcon, CheckIcon, SparklesIcon } from '../icons';
import { 
    FlatWord, 
    ExtractionStrategy, 
    ScanDirection, 
    extractAlphabetSequence, 
    ARABIC_LETTERS 
} from '../../utils/alphabetCipher';

interface ScannerResultCardProps {
    res: {
        L: number;
        R: number;
        length: number;
        targetIndex: number;
        scanMode: 'shortest' | 'forward' | 'backward' | 'optimal';
        strategy?: ExtractionStrategy;
        targetLetterCount?: number;
        ayahsSpanned?: number;
    };
    idx: number;
    flatWords: FlatWord[];
    onOpenInspector: (startWordIndex: number, strategy: ExtractionStrategy, direction: ScanDirection, targetLetterCount?: number) => void;
}

export const ScannerResultCard: React.FC<ScannerResultCardProps> = ({
    res,
    idx,
    flatWords,
    onOpenInspector
}) => {
    const [strategy, setStrategy] = useState<ExtractionStrategy>(res.strategy || 'first_letter');
    const [isReversed, setIsReversed] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const targetCount = res.targetLetterCount ?? 27;

    // Compute extraction based on chosen strategy and target letter count
    const extraction = useMemo(() => {
        if (res.scanMode === 'shortest') {
            return extractAlphabetSequence(flatWords, res.targetIndex, strategy, 'shortest', undefined, targetCount);
        }
        const dir: ScanDirection = res.scanMode === 'backward' ? 'backward' : 'forward';
        const startIdx = res.scanMode === 'backward' ? res.R : res.L;
        return extractAlphabetSequence(flatWords, startIdx, strategy, dir, undefined, targetCount);
    }, [res, flatWords, strategy, targetCount]);

    const displaySequence = isReversed ? [...extraction.sequence].reverse() : extraction.sequence;
    const isDenseCluster = targetCount < 27 || extraction.missingLetters.length > 0;
    const densityPercent = ((displaySequence.length / Math.max(1, res.length)) * 100).toFixed(0);

    const handleCopy = () => {
        const textToCopy = displaySequence.join(' - ');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="bg-surface border border-border-default rounded-xl overflow-hidden hover:shadow-md transition-shadow space-y-0">
            {/* Card Header */}
            <div className="bg-surface-subtle px-4 py-3 border-b border-border-default flex flex-wrap gap-x-6 gap-y-2 items-center justify-between text-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 font-bold text-primary">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                            {idx + 1}
                        </div>
                        <span className="flex items-center gap-1.5">
                            {res.scanMode === 'optimal' ? (
                                <>
                                    <SparklesIcon className="w-4 h-4 text-amber-500 inline" />
                                    <span>المسح الذكي</span>
                                </>
                            ) : res.scanMode === 'backward' ? (
                                'مسح تراجعي'
                            ) : res.scanMode === 'forward' ? (
                                'مسح تقدمي'
                            ) : (
                                'أقصر نافذة محيطة'
                            )} 
                            <span>({res.length} كلمة)</span>
                        </span>
                    </div>

                    {res.ayahsSpanned !== undefined && res.ayahsSpanned > 0 && (
                        <span className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold">
                            {res.ayahsSpanned} آيات فقط
                        </span>
                    )}

                    {isDenseCluster ? (
                        <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>كتلة مكتنزة: {displaySequence.length} من 27 حرفاً</span>
                            <span className="text-[10px] text-text-muted">({densityPercent}% كثافة)</span>
                        </span>
                    ) : (
                        <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-bold">
                            اكتمال تام (27 حرفاً - دون الواو)
                        </span>
                    )}

                    <div className="text-text-secondary flex items-center gap-1.5 text-xs sm:text-sm">
                        <BookOpenIcon className="w-4 h-4 text-primary/70" />
                        من: <span className="font-bold text-text-primary">{flatWords[res.L]?.surahName}</span> (آية {flatWords[res.L]?.ayah})
                    </div>

                    <div className="text-text-secondary flex items-center gap-1.5 text-xs sm:text-sm">
                        <ArrowRightIcon className="w-4 h-4 rotate-180 text-primary/70" />
                        إلى: <span className="font-bold text-text-primary">{flatWords[res.R]?.surahName}</span> (آية {flatWords[res.R]?.ayah})
                    </div>
                </div>

                {/* Open Inspector Action */}
                <button
                    onClick={() => onOpenInspector(res.targetIndex, strategy, res.scanMode, targetCount)}
                    className="flex items-center gap-1.5 text-xs font-bold bg-primary text-white hover:bg-primary-focus px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                    <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>فحص الشيفرة بالمستكشف</span>
                </button>
            </div>

            {/* Quranic Text with Clickable Words */}
            <div className="p-5 font-amiri text-xl leading-loose text-text-primary text-justify" dir="rtl">
                {(() => {
                    const words = [];
                    for (let i = res.L; i <= res.R; i++) {
                        const fw = flatWords[i];
                        if (!fw) continue;
                        const isTarget = i === res.targetIndex;
                        words.push(
                            <button
                                key={`w-${i}`}
                                onClick={() => onOpenInspector(i, strategy, res.scanMode, targetCount)}
                                className={`inline-block transition-all cursor-pointer rounded px-1 mx-0.5 ${
                                    isTarget 
                                        ? "text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 ring-1 ring-amber-400" 
                                        : "hover:bg-primary/10 hover:text-primary"
                                }`}
                                title={`سورة ${fw.surahName} آية ${fw.ayah} (انقر للفحص من هنا)`}
                            >
                                {fw.text}
                            </button>
                        );
                        if (i === res.R || (flatWords[i+1] && (flatWords[i+1].ayah !== fw.ayah || flatWords[i+1].surah !== fw.surah))) {
                            words.push(
                                <span key={`a-${i}`} className="text-primary/60 font-bold text-lg mx-1 select-none inline-flex items-center justify-center">
                                    ﴿{fw.ayah}﴾ 
                                </span>
                            );
                        }
                    }
                    return words;
                })()}
            </div>

            {/* Strategy switch and Sequence Bar */}
            <div className="bg-surface-subtle border-t border-border-default p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-secondary">تسلسل الحروف ({displaySequence.length}):</span>
                        <div className="flex items-center bg-surface p-1 rounded-lg border border-border-default text-[11px]">
                            <button
                                onClick={() => setStrategy('all_letters')}
                                className={`px-2 py-0.5 rounded font-bold ${strategy === 'all_letters' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                كل الحروف
                            </button>
                            <button
                                onClick={() => setStrategy('first_letter')}
                                className={`px-2 py-0.5 rounded font-bold ${strategy === 'first_letter' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                أوائل الكلمات
                            </button>
                            <button
                                onClick={() => setStrategy('last_letter')}
                                className={`px-2 py-0.5 rounded font-bold ${strategy === 'last_letter' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                أواخر الكلمات
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsReversed(!isReversed)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                        >
                            {isReversed ? "الترتيب الأصلي" : "عكس"}
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            {isCopied ? "تم النسخ" : "نسخ التسلسل"}
                        </button>
                    </div>
                </div>

                {/* Extracted Sequence Chips */}
                <div className="flex flex-wrap gap-1" dir="rtl">
                    {displaySequence.map((letter, i) => (
                        <div 
                            key={i} 
                            className="w-7 h-7 flex items-center justify-center rounded bg-surface border border-border-default text-primary font-bold text-sm shadow-2xs font-amiri"
                            title={`الحرف ${i + 1}: ${letter}`}
                        >
                            {letter}
                        </div>
                    ))}
                </div>

                {/* Missing / Absent Letters Display */}
                {extraction.missingLetters.length > 0 && (
                    <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-text-secondary flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            الحروف الغائبة عن هذه الكتلة ({extraction.missingLetters.length} من 27):
                        </span>
                        <div className="flex flex-wrap gap-1" dir="rtl">
                            {extraction.missingLetters.map((char) => (
                                <span 
                                    key={char} 
                                    className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold font-amiri border border-amber-300/60 dark:border-amber-700/60"
                                    title={`حرف (${char}) لم يرد في هذه الكتلة المتتالية المكونة من ${res.length} كلمة`}
                                >
                                    {char}
                                </span>
                            ))}
                        </div>
                        <span className="text-[11px] text-text-muted mr-auto">
                            (حرف الواو مستثنى كلياً من العد والمسح)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
