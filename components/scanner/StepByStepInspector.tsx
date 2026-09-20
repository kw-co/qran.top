import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    AlphabetExtractionResult, 
    FlatWord, 
    ExtractionStrategy, 
    ScanDirection, 
    ARABIC_LETTERS 
} from '../../utils/alphabetCipher';
import { 
    PlayIcon, 
    BookOpenIcon, 
    SparklesIcon, 
    CopyIcon, 
    CheckIcon, 
    ArrowRightIcon, 
    InformationCircleIcon 
} from '../icons';
import { AlphabetComparator } from './AlphabetComparator';

interface StepByStepInspectorProps {
    result: AlphabetExtractionResult;
    flatWords: FlatWord[];
    onReScanFromWord: (wordIndex: number, strategy: ExtractionStrategy, direction: ScanDirection) => void;
}

export const StepByStepInspector: React.FC<StepByStepInspectorProps> = ({
    result,
    flatWords,
    onReScanFromWord
}) => {
    const [currentStep, setCurrentStep] = useState<number>(result.discoveredLetters.length);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [copiedType, setCopiedType] = useState<string | null>(null);
    const [selectedLetterDetailIndex, setSelectedLetterDetailIndex] = useState<number | null>(null);
    const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);

    const playTimerRef = useRef<any>(null);

    // Synchronize currentStep whenever result changes
    useEffect(() => {
        setCurrentStep(result.discoveredLetters.length);
        setIsPlaying(false);
    }, [result]);

    // Handle auto simulation playback
    useEffect(() => {
        if (isPlaying) {
            playTimerRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= result.discoveredLetters.length) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 500);
        } else {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
        }

        return () => {
            if (playTimerRef.current) clearInterval(playTimerRef.current);
        };
    }, [isPlaying, result.discoveredLetters.length]);

    // Current active subset of discovered letters based on currentStep
    const visibleLetters = useMemo(() => {
        return result.discoveredLetters.slice(0, currentStep);
    }, [result.discoveredLetters, currentStep]);

    const activeSequence = useMemo(() => {
        return visibleLetters.map(l => l.letter);
    }, [visibleLetters]);

    // Map word index to the letter it contributed (if any)
    const wordLetterMap = useMemo(() => {
        const map = new Map<number, { letter: string; orderIndex: number }>();
        visibleLetters.forEach(dl => {
            map.set(dl.wordIndex, { letter: dl.letter, orderIndex: dl.orderIndex });
        });
        return map;
    }, [visibleLetters]);

    const pivotWordIndex = result.pivotWordIndex ?? result.startWordIndex;

    // Word index bounds reached so far in the simulation
    const activeMinWordIndex = useMemo(() => {
        if (visibleLetters.length === 0) return pivotWordIndex;
        if (result.direction === 'backward' || result.direction === 'shortest') {
            return Math.min(...visibleLetters.map(l => l.wordIndex));
        } else {
            return result.startWordIndex;
        }
    }, [visibleLetters, pivotWordIndex, result.startWordIndex, result.direction]);

    const activeMaxWordIndex = useMemo(() => {
        if (visibleLetters.length === 0) return pivotWordIndex;
        if (result.direction === 'backward') {
            return result.startWordIndex;
        } else {
            return Math.max(...visibleLetters.map(l => l.wordIndex));
        }
    }, [visibleLetters, pivotWordIndex, result.startWordIndex, result.direction]);

    // Copy handlers
    const handleCopySequence = (format: 'dashes' | 'compact' | 'numbered' | 'table') => {
        let text = '';
        if (format === 'dashes') {
            text = activeSequence.join(' - ');
        } else if (format === 'compact') {
            text = activeSequence.join('');
        } else if (format === 'numbered') {
            text = visibleLetters.map(l => `${l.orderIndex}. حرف (${l.letter}) من كلمة [${l.wordText}] سورة ${l.surahName} آية ${l.ayah}`).join('\n');
        } else if (format === 'table') {
            text = "الترتيب\tالحرف\tالكلمة\tالسورة\tالآية\n" + 
                visibleLetters.map(l => `${l.orderIndex}\t${l.letter}\t${l.wordText}\t${l.surahName}\t${l.ayah}`).join('\n');
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopiedType(format);
            setTimeout(() => setCopiedType(null), 2000);
        });
    };

    // Words within the scanned window
    const windowWords = useMemo(() => {
        if (!flatWords || flatWords.length === 0) return [];
        const start = Math.max(0, result.startWordIndex);
        const end = Math.min(flatWords.length - 1, result.endWordIndex);
        const list: FlatWord[] = [];
        for (let i = start; i <= end; i++) {
            list.push(flatWords[i]);
        }
        return list;
    }, [flatWords, result.startWordIndex, result.endWordIndex]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Toolbar */}
            <div className="bg-surface rounded-xl border border-border-default p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {visibleLetters.length}/28
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center flex-wrap gap-2">
                                <span>مستكشف الشيفرة ومحاكي المسح التفاعلي</span>
                                {result.isComplete28 && (
                                    <span className="text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-300 dark:border-emerald-800">
                                        اكتملت الـ 28 حرفاً ✓
                                    </span>
                                )}
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">
                                    {result.direction === 'shortest' ? 'أقصر نافذة محيطة (متشعب)' : result.direction === 'backward' ? 'مسح تراجعي' : 'مسح تقدمي'}
                                    {result.totalWordsSpanned > 0 && ` (${result.totalWordsSpanned} كلمة)`}
                                </span>
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                                {result.direction === 'shortest'
                                    ? `نافذة محيطة بالكلمة المحورية [${flatWords[pivotWordIndex]?.text || ''}] من سورة ${flatWords[result.startWordIndex]?.surahName || ''} (آية ${flatWords[result.startWordIndex]?.ayah || ''}) إلى سورة ${flatWords[result.endWordIndex]?.surahName || ''} (آية ${flatWords[result.endWordIndex]?.ayah || ''})`
                                    : 'تتبع ولادة تسلسل الأبجدية كلمة بكلمة، وانقر على أي كلمة لتغيير نقطة البداية فوراً'}
                            </p>
                        </div>
                    </div>

                    {/* Fast Mode Switchers */}
                    <div className="flex flex-wrap items-center gap-2 bg-surface-subtle p-1.5 rounded-lg border border-border-default text-xs">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-text-secondary px-1">الانتقاء:</span>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, 'all_letters', result.direction)}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.strategy === 'all_letters' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                جميع الحروف
                            </button>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, 'first_letter', result.direction)}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.strategy === 'first_letter' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                أوائل الكلمات
                            </button>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, 'last_letter', result.direction)}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.strategy === 'last_letter' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                أواخر الكلمات
                            </button>
                        </div>

                        <div className="h-4 w-px bg-border-default hidden sm:block"></div>

                        <div className="flex items-center gap-1">
                            <span className="font-bold text-text-secondary px-1">المسار:</span>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, result.strategy, 'forward')}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.direction === 'forward' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                تقدمي للأمام
                            </button>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, result.strategy, 'backward')}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.direction === 'backward' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                تراجعي للخلف
                            </button>
                            <button
                                onClick={() => onReScanFromWord(pivotWordIndex, result.strategy, 'shortest')}
                                className={`px-2 py-1 rounded font-semibold transition-colors ${
                                    result.direction === 'shortest' ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                أقصر نافذة محيطة (متشعب)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Simulation Stepper & Controls */}
                <div className="bg-surface-subtle p-4 rounded-xl border border-border-default space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                                    isPlaying 
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                        : 'bg-primary hover:bg-primary-focus text-white'
                                }`}
                            >
                                <PlayIcon className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                                <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل محاكاة المسح'}</span>
                            </button>

                            <button
                                onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(1, currentStep - 1)); }}
                                disabled={currentStep <= 1}
                                className="px-3 py-2 rounded-lg border border-border-default bg-surface text-text-primary hover:bg-surface-hover disabled:opacity-40 text-xs font-bold transition-colors"
                            >
                                ◂ خطوة للخلف
                            </button>

                            <button
                                onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(result.discoveredLetters.length, currentStep + 1)); }}
                                disabled={currentStep >= result.discoveredLetters.length}
                                className="px-3 py-2 rounded-lg border border-border-default bg-surface text-text-primary hover:bg-surface-hover disabled:opacity-40 text-xs font-bold transition-colors"
                            >
                                خطوة للأمام ▸
                            </button>

                            <button
                                onClick={() => { setIsPlaying(false); setCurrentStep(result.discoveredLetters.length); }}
                                className="px-3 py-2 rounded-lg border border-border-default bg-surface text-text-secondary hover:text-text-primary text-xs font-semibold"
                            >
                                إظهار الكل
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-text-secondary">
                                خطوة {currentStep} من {result.discoveredLetters.length}
                            </span>
                        </div>
                    </div>

                    {/* Step Slider */}
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={1}
                            max={Math.max(1, result.discoveredLetters.length)}
                            value={currentStep}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentStep(parseInt(e.target.value, 10));
                            }}
                            className="w-full accent-primary h-2 bg-surface rounded-lg cursor-pointer"
                        />
                    </div>
                </div>

                {/* Copy Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="font-bold text-text-secondary">خيارات نسخ التسلسل المستخرج:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            onClick={() => handleCopySequence('dashes')}
                            className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                        >
                            {copiedType === 'dashes' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>نسخ (ا - ب - ج)</span>
                        </button>
                        <button
                            onClick={() => handleCopySequence('compact')}
                            className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                        >
                            {copiedType === 'compact' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>نسخ متصل (ابج...)</span>
                        </button>
                        <button
                            onClick={() => handleCopySequence('numbered')}
                            className="px-2.5 py-1.5 rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary font-medium flex items-center gap-1.5 transition-colors"
                        >
                            {copiedType === 'numbered' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>نسخ جدول مرقم</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* The 28 Alphabet Slot Board (اللوحة الأبجدية الـ 28) */}
            <div className="bg-surface rounded-xl border border-border-default p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-amber-500" />
                        <span>ترتيب الأبجدية المستخرج ({activeSequence.length} حرفاً):</span>
                    </h3>
                    <span className="text-xs text-text-muted">
                        انقر على أي بطاقة حرف لعرض موضع استخراجه القرآني
                    </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-2" dir="rtl">
                    {Array.from({ length: 28 }).map((_, idx) => {
                        const item = visibleLetters[idx];
                        const isFilled = !!item;
                        const isSelected = selectedLetterDetailIndex === idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedLetterDetailIndex(isSelected ? null : idx)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center relative ${
                                    isSelected
                                        ? 'bg-primary text-white border-primary shadow-md scale-105 z-10'
                                        : isFilled
                                        ? 'bg-surface-subtle border-border-default hover:border-primary/60 hover:bg-surface'
                                        : 'bg-surface/30 border-dashed border-border-subtle opacity-40'
                                }`}
                            >
                                <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                    #{idx + 1}
                                </span>
                                <span className={`text-xl font-amiri font-extrabold my-0.5 ${isSelected ? 'text-white' : 'text-primary'}`}>
                                    {item ? item.letter : '-'}
                                </span>
                                {item ? (
                                    <span className={`text-[9px] font-amiri truncate max-w-full px-1 ${isSelected ? 'text-white/90 font-bold' : 'text-text-secondary'}`} title={item.wordText}>
                                        {item.wordText}
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-text-muted">شاغر</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Letter Detail Popup / Card */}
                {selectedLetterDetailIndex !== null && visibleLetters[selectedLetterDetailIndex] && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary text-white font-amiri text-2xl font-bold flex items-center justify-center shadow-xs">
                                {visibleLetters[selectedLetterDetailIndex].letter}
                            </div>
                            <div>
                                <h4 className="font-bold text-text-primary text-sm">
                                    الحرف رقم {visibleLetters[selectedLetterDetailIndex].orderIndex}: ({visibleLetters[selectedLetterDetailIndex].letter})
                                </h4>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    ورد في كلمة <strong className="text-primary font-amiri text-base">[{visibleLetters[selectedLetterDetailIndex].wordText}]</strong> — سورة {visibleLetters[selectedLetterDetailIndex].surahName} (آية {visibleLetters[selectedLetterDetailIndex].ayah})
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onReScanFromWord(visibleLetters[selectedLetterDetailIndex].wordIndex, result.strategy, result.direction)}
                            className="bg-primary hover:bg-primary-focus text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <ArrowRightIcon className="w-3.5 h-3.5 rotate-180" />
                            <span>بدء مسح جديد من هذه الكلمة</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Interactive Quranic Text Window (النص القرآني مع أداة التأشير التفاعلية) */}
            <div className="bg-surface rounded-xl border border-border-default p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-3">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-primary" />
                        <h3 className="text-base font-bold text-text-primary">
                            النص القرآني الممسوح (انقر على أي كلمة لتأشيرها وبدء المسح منها):
                        </h3>
                    </div>
                    <span className="text-xs text-text-muted">
                        الكلمات ذات العلامات الملونة هي التي أضافت حروفاً جديدة للتسلسل
                    </span>
                </div>

                <div 
                    className="p-6 bg-surface-subtle/60 rounded-xl border border-border-default font-amiri text-2xl leading-loose text-text-primary text-justify transition-all"
                    dir="rtl"
                >
                    {windowWords.map((fw, idx) => {
                        const globalIdx = fw.index;
                        const letterInfo = wordLetterMap.get(globalIdx);
                        const isStartWord = globalIdx === pivotWordIndex;
                        const isPassedInSim = (globalIdx >= activeMinWordIndex && globalIdx <= activeMaxWordIndex);

                        return (
                            <span key={`w-${globalIdx}`} className="inline-block relative group m-1">
                                <button
                                    onClick={() => onReScanFromWord(globalIdx, result.strategy, result.direction)}
                                    onMouseEnter={() => setHoveredWordIndex(globalIdx)}
                                    onMouseLeave={() => setHoveredWordIndex(null)}
                                    className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 ${
                                        isStartWord
                                            ? 'bg-amber-500 text-white font-bold shadow-xs scale-105 ring-2 ring-amber-400'
                                            : letterInfo
                                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 font-bold'
                                            : isPassedInSim
                                            ? 'text-text-primary hover:bg-primary/10'
                                            : 'text-text-muted/60 hover:text-text-primary'
                                    }`}
                                    title={`سورة ${fw.surahName} آية ${fw.ayah} (انقر للبدء من هنا)`}
                                >
                                    <span>{fw.text}</span>
                                    {letterInfo && (
                                        <span className="bg-emerald-600 text-white text-[11px] font-mono px-1 py-0.2 rounded-full font-bold inline-flex items-center justify-center shadow-2xs">
                                            {letterInfo.orderIndex}:{letterInfo.letter}
                                        </span>
                                    )}
                                </button>
                                
                                {idx === windowWords.length - 1 || (windowWords[idx + 1] && (windowWords[idx + 1].ayah !== fw.ayah || windowWords[idx + 1].surah !== fw.surah)) ? (
                                    <span className="text-primary/70 font-bold text-lg mx-1.5 select-none inline-flex items-center justify-center">
                                        ﴿{fw.ayah}﴾
                                    </span>
                                ) : null}
                            </span>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface-subtle p-3 rounded-lg border border-border-subtle">
                    <InformationCircleIcon className="w-4 h-4 text-primary shrink-0" />
                    <span>
                        <strong>أداة التأشير التفاعلية:</strong> يمكنك النقر المباشر على أي كلمة قرآنية أعلاه لبدء عملية مسح واستخراج جديدة تبدأ بدقة من تلك الكلمة.
                    </span>
                </div>
            </div>

            {/* Reference Alphabets Cipher Comparison */}
            <AlphabetComparator sequence={activeSequence} isComplete28={result.isComplete28} />
        </div>
    );
};
