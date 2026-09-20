import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { 
    PlayIcon, 
    SpinnerIcon, 
    CheckIcon, 
    BookOpenIcon, 
    InformationCircleIcon, 
    ArrowRightIcon, 
    SparklesIcon, 
    CopyIcon, 
    DocumentDuplicateIcon,
    SearchIcon
} from './icons';
import { 
    ARABIC_LETTERS, 
    ALL_LETTERS_MASK, 
    FlatWord, 
    ExtractionStrategy, 
    ScanDirection, 
    getLetterMask, 
    getWordStrategyMask,
    findShortestEnclosingWindow,
    extractAlphabetSequence, 
    PRESET_SCAN_POINTS,
    REFERENCE_ALPHABETS
} from '../utils/alphabetCipher';
import { ScannerResultCard } from './scanner/ScannerResultCard';
import { StepByStepInspector } from './scanner/StepByStepInspector';
import { DirectPositionPicker } from './scanner/DirectPositionPicker';
import { AlphabetComparator } from './scanner/AlphabetComparator';

interface AlphabetScannerViewProps {
    simpleCleanData: SurahData[];
}

interface ScanResult {
    L: number;
    R: number;
    length: number;
    targetIndex: number;
    scanMode: 'shortest' | 'forward' | 'backward';
    strategy: ExtractionStrategy;
}

const AlphabetScannerView: React.FC<AlphabetScannerViewProps> = ({ simpleCleanData }) => {
    // Navigation / Active Mode Tab
    const [activeTab, setActiveTab] = useState<'inspector' | 'word_search' | 'presets'>('inspector');

    // Word Search State
    const [targetWord, setTargetWord] = useState('');
    const [scanMode, setScanMode] = useState<'shortest' | 'forward' | 'backward'>('shortest');
    const [searchStrategy, setSearchStrategy] = useState<ExtractionStrategy>('all_letters');
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [statusText, setStatusText] = useState('');
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

    // Inspector State
    const [inspectorStartIndex, setInspectorStartIndex] = useState<number>(0);
    const [inspectorStrategy, setInspectorStrategy] = useState<ExtractionStrategy>('all_letters');
    const [inspectorDirection, setInspectorDirection] = useState<ScanDirection>('forward');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Build flattened word database with global indexes
    const flatWords: FlatWord[] = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return [];
        const words: FlatWord[] = [];
        let globalWordIdx = 0;

        simpleCleanData.forEach(surah => {
            surah.ayahs.forEach(ayah => {
                const ayahWords = ayah.text.split(/\s+/).filter(Boolean);
                ayahWords.forEach((w, wInAyah) => {
                    const norm = normalizeArabicText(w);
                    words.push({
                        index: globalWordIdx++,
                        text: w,
                        normalized: norm,
                        mask: getLetterMask(w),
                        surah: surah.number,
                        ayah: ayah.numberInSurah,
                        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                        wordInAyah: wInAyah
                    });
                });
            });
        });
        return words;
    }, [simpleCleanData]);

    // Initialize inspector with Al-Fath 48:29 on load
    useEffect(() => {
        if (flatWords.length > 0 && inspectorStartIndex === 0) {
            const fathWord = flatWords.find(w => w.surah === 48 && w.ayah === 29);
            if (fathWord) {
                setInspectorStartIndex(fathWord.index);
            }
        }
    }, [flatWords, inspectorStartIndex]);

    // Interactive inspector calculation
    const inspectorResult = useMemo(() => {
        if (flatWords.length === 0) {
            return {
                sequence: [],
                discoveredLetters: [],
                startWordIndex: 0,
                endWordIndex: 0,
                totalWordsSpanned: 0,
                isComplete28: false,
                strategy: inspectorStrategy,
                direction: inspectorDirection,
                firstLetter: '',
                missingLetters: ARABIC_LETTERS.split('')
            };
        }
        return extractAlphabetSequence(flatWords, inspectorStartIndex, inspectorStrategy, inspectorDirection);
    }, [flatWords, inspectorStartIndex, inspectorStrategy, inspectorDirection]);

    // Handle switching to inspector from anywhere
    const handleOpenInInspector = (startWordIndex: number, strategy: ExtractionStrategy = 'all_letters', direction: ScanDirection = 'forward') => {
        setInspectorStartIndex(startWordIndex);
        setInspectorStrategy(strategy);
        setInspectorDirection(direction);
        setActiveTab('inspector');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Word-based scanning algorithm
    const handleScan = () => {
        if (!targetWord.trim() || flatWords.length === 0) return;
        setIsScanning(true);
        setProgress(0);
        setResults([]);
        
        const normTarget = normalizeArabicText(targetWord.trim());
        const occurrences: number[] = [];
        for (let i = 0; i < flatWords.length; i++) {
            if (flatWords[i].normalized === normTarget) {
                occurrences.push(i);
            }
        }

        if (occurrences.length === 0) {
            setStatusText('لم يتم العثور على الكلمة في القرآن الكريم.');
            setIsScanning(false);
            return;
        }

        setStatusText(`تم العثور على ${occurrences.length} موضع للكلمة. جاري الفحص...`);

        const chunks: number[][] = [];
        const chunkSize = 50;
        for (let i = 0; i < occurrences.length; i += chunkSize) {
            chunks.push(occurrences.slice(i, i + chunkSize));
        }

        let currentChunk = 0;
        const foundResults: ScanResult[] = [];

        const processChunk = () => {
            if (currentChunk >= chunks.length) {
                foundResults.sort((a, b) => a.length - b.length);
                setResults(foundResults);
                setProgress(100);
                setIsScanning(false);
                setStatusText(`اكتمل الفحص بنجاح! تم فحص ${occurrences.length} موضع.`);
                return;
            }

            const chunk = chunks[currentChunk];
            for (const idx of chunk) {
                if (scanMode === 'shortest') {
                    const { bestL, bestR, bestLen } = findShortestEnclosingWindow(flatWords, idx, searchStrategy);
                    if (bestL !== -1 && bestR !== -1) {
                        foundResults.push({
                            L: bestL,
                            R: bestR,
                            length: bestLen,
                            targetIndex: idx,
                            scanMode: 'shortest',
                            strategy: searchStrategy
                        });
                    }
                } else if (scanMode === 'forward') {
                    let mask = 0;
                    let foundR = -1;
                    for (let R = idx; R < flatWords.length; R++) {
                        mask |= getWordStrategyMask(flatWords[R], searchStrategy);
                        if (mask === ALL_LETTERS_MASK) {
                            foundR = R;
                            break;
                        }
                    }
                    if (foundR !== -1) {
                        foundResults.push({
                            L: idx,
                            R: foundR,
                            length: foundR - idx + 1,
                            targetIndex: idx,
                            scanMode: 'forward',
                            strategy: searchStrategy
                        });
                    }
                } else if (scanMode === 'backward') {
                    let mask = 0;
                    let foundL = -1;
                    for (let L = idx; L >= 0; L--) {
                        mask |= getWordStrategyMask(flatWords[L], searchStrategy);
                        if (mask === ALL_LETTERS_MASK) {
                            foundL = L;
                            break;
                        }
                    }
                    if (foundL !== -1) {
                        foundResults.push({
                            L: foundL,
                            R: idx,
                            length: idx - foundL + 1,
                            targetIndex: idx,
                            scanMode: 'backward',
                            strategy: searchStrategy
                        });
                    }
                }
            }

            currentChunk++;
            setProgress(Math.round((currentChunk / chunks.length) * 100));
            
            requestAnimationFrame(() => {
                setTimeout(processChunk, 10);
            });
        };

        setTimeout(processChunk, 50);
    };

    // Filter results by initial discovered letter
    const filteredResults = useMemo(() => {
        if (selectedLetters.length === 0) return results;
        return results.filter(res => {
            const ext = extractAlphabetSequence(
                flatWords,
                res.scanMode === 'shortest' ? res.targetIndex : (res.scanMode === 'backward' ? res.R : res.L),
                res.strategy || searchStrategy,
                res.scanMode
            );
            return ext.firstLetter && selectedLetters.includes(ext.firstLetter);
        });
    }, [results, selectedLetters, flatWords, searchStrategy]);

    const displayedResults = filteredResults.slice(0, 30);

    return (
        <div className="animate-fade-in w-full max-w-5xl mx-auto px-4 pb-24">
            {/* Main Header */}
            <div className="mb-6">
                <a href="#/structure" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-focus transition-colors mb-3 font-semibold text-sm">
                    <ArrowRightIcon className="w-4 h-4" />
                    العودة إلى بنية المصحف
                </a>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-primary-text flex items-center gap-3">
                            <SparklesIcon className="w-8 h-8 text-amber-500" />
                            ماسح الحروف الأبجدية ومستكشف الشيفرة
                        </h1>
                        <p className="text-text-secondary mt-1.5 text-sm sm:text-base leading-relaxed">
                            أداة بحثية متقدمة لاستكشاف شيفرة وترتيب الحروف الأبجدية الـ 28 في القرآن الكريم، مع إمكانية تأشير نقطة الانطلاق، واختيار طرق الانتقاء (متسلسلة أو أوائل الكلمات أو أواخرها)، ومطابقة النتائج مع التراتيب التاريخية واللغوية.
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-default mb-6 overflow-x-auto gap-2 text-sm font-bold">
                <button
                    onClick={() => setActiveTab('inspector')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'inspector'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                    <span>مستكشف الشيفرة ومحاكي المسح التفاعلي</span>
                </button>

                <button
                    onClick={() => setActiveTab('word_search')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'word_search'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <SearchIcon className="w-4 h-4" />
                    <span>البحث بالكلمة ومسح النوافذ</span>
                </button>

                <button
                    onClick={() => setActiveTab('presets')}
                    className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'presets'
                            ? 'border-primary text-primary font-bold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4 text-emerald-500" />
                    <span>الآيات الشاملة والأنظمة الأبجدية</span>
                </button>
            </div>

            {/* TAB 1: INTERACTIVE CIPHER INSPECTOR & SIMULATOR */}
            {activeTab === 'inspector' && (
                <div className="space-y-6">
                    {/* Direct Position Picker & Pointer Component */}
                    <DirectPositionPicker
                        flatWords={flatWords}
                        currentStartIndex={inspectorStartIndex}
                        currentStrategy={inspectorStrategy}
                        currentDirection={inspectorDirection}
                        onSelectPosition={(startIdx, strat, dir) => {
                            setInspectorStartIndex(startIdx);
                            setInspectorStrategy(strat);
                            setInspectorDirection(dir);
                        }}
                    />

                    {/* Step by Step Simulator and Word-by-Word Explorer */}
                    <StepByStepInspector
                        result={inspectorResult}
                        flatWords={flatWords}
                        onReScanFromWord={(wIdx, strat, dir) => {
                            setInspectorStartIndex(wIdx);
                            setInspectorStrategy(strat);
                            setInspectorDirection(dir);
                        }}
                    />
                </div>
            )}

            {/* TAB 2: WORD SEARCH & ENCLOSING WINDOWS */}
            {activeTab === 'word_search' && (
                <div className="space-y-6">
                    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-default">
                        {/* Strategy and Direction Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Strategy Selector (ميزة أوائل الكلمات ومناهج الاستخلاص) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-primary">
                                    طريقة استخلاص الحروف في المسح:
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-2 rounded-lg border border-border-default">
                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('first_letter')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'first_letter'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أوائل الكلمات</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'first_letter' ? 'text-white/80' : 'text-text-muted'}`}>
                                            الحرف الأول من كل كلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('all_letters')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'all_letters'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">جميع الحروف</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'all_letters' ? 'text-white/80' : 'text-text-muted'}`}>
                                            كل حروف الكلمات
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSearchStrategy('last_letter')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            searchStrategy === 'last_letter'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أواخر الكلمات</span>
                                        <span className={`text-[10px] mt-0.5 ${searchStrategy === 'last_letter' ? 'text-white/80' : 'text-text-muted'}`}>
                                            الحرف الأخير من كل كلمة
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Scan Direction Selector (مسار المسح وأقصر نافذة محيطة) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-primary">
                                    اتجاه ومسار محرك المسح:
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-surface-subtle p-2 rounded-lg border border-border-default">
                                    <button
                                        type="button"
                                        onClick={() => setScanMode('shortest')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'shortest'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">أقصر نافذة (متشعب)</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'shortest' ? 'text-white/80' : 'text-text-muted'}`}>
                                            محيطة بالكلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScanMode('forward')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'forward'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">مسح تقدمي</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'forward' ? 'text-white/80' : 'text-text-muted'}`}>
                                            للأمام من الكلمة
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScanMode('backward')}
                                        className={`p-2 rounded-md text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                                            scanMode === 'backward'
                                                ? 'bg-primary text-white font-bold shadow-xs'
                                                : 'bg-surface border border-border-default text-text-secondary hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">مسح تراجعي</span>
                                        <span className={`text-[10px] mt-0.5 ${scanMode === 'backward' ? 'text-white/80' : 'text-text-muted'}`}>
                                            للخلف من الكلمة
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                value={targetWord}
                                onChange={(e) => setTargetWord(e.target.value)}
                                placeholder="أدخل كلمة للبحث حولها (مثال: الأرض، موسى، الله)..."
                                className="flex-1 bg-surface-subtle border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-amiri text-lg"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
                                disabled={isScanning}
                            />
                            <button
                                onClick={handleScan}
                                disabled={isScanning || !targetWord.trim()}
                                className="bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isScanning ? (
                                    <>
                                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                                        <span>جاري الفحص...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlayIcon className="w-5 h-5" />
                                        <span>بدء المسح</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {(isScanning || progress > 0) && (
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-text-secondary">{statusText}</span>
                                    <span className="text-primary font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-border-subtle rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative" 
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {results.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-primary-text">
                                    النتائج ({filteredResults.length} موضع)
                                </h2>
                                
                                <div className="flex items-center gap-2">
                                    {selectedLetters.length > 0 && (
                                        <button 
                                            onClick={() => setSelectedLetters([])}
                                            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg font-bold transition-colors cursor-pointer"
                                        >
                                            إلغاء تصفية الحروف ✕
                                        </button>
                                    )}
                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full font-bold">
                                        {scanMode === 'shortest' ? 'مرتبة من الأقصر إلى الأطول' : 'مرتبة حسب موضع الكلمة'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Filter by First Discovered Letter */}
                            <div className="bg-surface-subtle p-4 rounded-xl border border-border-default">
                                <h3 className="text-sm font-bold text-text-primary mb-3">تصفية النتائج حسب أول حرف مكتشف:</h3>
                                <div className="flex flex-wrap gap-1.5" dir="rtl">
                                    {ARABIC_LETTERS.split('').map(letter => {
                                        const isSelected = selectedLetters.includes(letter);
                                        return (
                                            <button
                                                key={letter}
                                                onClick={() => {
                                                    setSelectedLetters(prev => 
                                                        prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter]
                                                    );
                                                }}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-sm transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-primary text-white border-primary shadow-md scale-110' 
                                                        : 'bg-surface border-border-default text-text-secondary hover:border-primary/50 hover:text-primary'
                                                }`}
                                            >
                                                {letter}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Render Scanner Result Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                {displayedResults.map((res, idx) => (
                                    <ScannerResultCard 
                                        key={idx} 
                                        res={res} 
                                        idx={idx} 
                                        flatWords={flatWords}
                                        onOpenInspector={handleOpenInInspector}
                                    />
                                ))}
                            </div>

                            {results.length > 30 && (
                                <p className="text-center text-text-muted mt-6 text-sm">
                                    تم عرض أفضل 30 نتيجة من أصل {filteredResults.length}.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: UNIVERSAL VERSES & ALPHABET SYSTEMS REFERENCE */}
            {activeTab === 'presets' && (
                <div className="space-y-6">
                    {/* Universal Verses Card */}
                    <div className="bg-surface rounded-xl border border-border-default p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-border-default pb-4">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">
                                    الآيات القرآنية الشاملة لجميع حروف الهجاء الـ 28
                                </h3>
                                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                    آيتان كريمتان في كتاب الله جمعت كل منهما حروف الأبجدية العربية الثمانية والعشرين كاملة دون نقص
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PRESET_SCAN_POINTS.slice(0, 2).map(preset => (
                                <div key={preset.id} className="bg-surface-subtle rounded-xl p-5 border border-border-default flex flex-col justify-between space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-text-primary text-base">
                                                {preset.title}
                                            </span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                سورة {preset.surahName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary mb-3">
                                            {preset.description}
                                        </p>
                                        <p className="font-amiri text-lg text-text-primary leading-loose bg-surface p-3.5 rounded-lg border border-border-subtle text-justify" dir="rtl">
                                            {preset.preview}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const match = flatWords.find(w => w.surah === preset.surah && w.ayah === preset.ayah);
                                            if (match) {
                                                handleOpenInInspector(match.index, 'all_letters', 'forward');
                                            }
                                        }}
                                        className="w-full bg-primary hover:bg-primary-focus text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                        <span>فحص هذه الآية في المستكشف التفاعلي</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Educational Guide on Arabic Alphabet Systems */}
                    <div className="bg-surface rounded-xl border border-border-default p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                                    <BookOpenIcon className="w-5 h-5 text-primary" />
                                    <span>الأنظمة المرجعية لترتيب الحروف العربية في التراث اللغوي والإحصائي:</span>
                                </h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    يمكنك نسخ أي تسلسل أبجدي أدناه بنقرة واحدة بصيغ متعددة (مفصول بشرطات، متصل، أو قائمة مرقمة)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {REFERENCE_ALPHABETS.map((refItem) => {
                                const isFrequency = refItem.id === 'quran_frequency';
                                return (
                                    <div 
                                        key={refItem.id} 
                                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                                            isFrequency 
                                                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-2xs' 
                                                : 'bg-surface-subtle border-border-default'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                                    {isFrequency && <SparklesIcon className="w-4 h-4 text-amber-500" />}
                                                    <span>{refItem.name.split('(')[0]}</span>
                                                </h4>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                        {refItem.sequence.length} حرفاً
                                                    </span>
                                                    {isFrequency && (
                                                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                                                            مميز
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                {refItem.description}
                                            </p>

                                            {/* Visual Sequence Chips */}
                                            <div className="bg-surface p-2 rounded-lg border border-border-subtle flex flex-wrap gap-1 font-amiri text-xs text-primary font-bold" dir="rtl">
                                                {refItem.sequence.split('').map((char, cIdx) => (
                                                    <span key={cIdx} className="w-5 h-5 flex items-center justify-center rounded bg-surface-subtle border border-border-subtle text-[11px]" title={`#${cIdx + 1}: ${char}`}>
                                                        {char}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Copy Actions for this alphabet */}
                                        <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-1.5 text-xs">
                                            <span className="text-[11px] font-bold text-text-secondary">نسخ الترتيب:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        const text = refItem.sequence.split('').join(' - ');
                                                        navigator.clipboard.writeText(text).then(() => {
                                                            alert(`تم نسخ ${refItem.name.split('(')[0]} مفصولاً بشرطات!`);
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="نسخ مفصول بشرطات (ا - ب - ج)"
                                                >
                                                    <CopyIcon className="w-3 h-3" />
                                                    <span>بشرطات</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(refItem.sequence).then(() => {
                                                            alert(`تم نسخ ${refItem.name.split('(')[0]} متصلاً!`);
                                                        });
                                                    }}
                                                    className="px-2 py-1 rounded bg-surface border border-border-default hover:bg-surface-hover text-text-primary font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="نسخ متصل (ابج...)"
                                                >
                                                    <CopyIcon className="w-3 h-3" />
                                                    <span>متصل</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlphabetScannerView;
