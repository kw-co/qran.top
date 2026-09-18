import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { normalizeArabicText } from '../utils/text';
import { PlayIcon, SpinnerIcon, CheckIcon, BookOpenIcon, InformationCircleIcon, ArrowRightIcon, SparklesIcon, CopyIcon, DocumentDuplicateIcon } from './icons';

interface AlphabetScannerViewProps {
    simpleCleanData: SurahData[];
}

interface FlatWord {
    text: string;
    normalized: string;
    mask: number;
    surah: number;
    ayah: number;
    surahName: string;
}

interface ScanResult {
    L: number;
    R: number;
    length: number;
    targetIndex: number;
}

const ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
const ALL_LETTERS_MASK = 0x0FFFFFFF; // 28 bits of 1s

const getLetterMask = (word: string): number => {
    let mask = 0;
    const norm = normalizeArabicText(word);
    for (let i = 0; i < norm.length; i++) {
        const idx = ARABIC_LETTERS.indexOf(norm[i]);
        if (idx !== -1) {
            mask |= (1 << idx);
        }
    }
    return mask;
};

import { ScannerResultItem } from "./ScannerResultItem";

const AlphabetScannerView: React.FC<AlphabetScannerViewProps> = ({ simpleCleanData }) => {
    const [targetWord, setTargetWord] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [statusText, setStatusText] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const flatWords = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return [];
        const words: FlatWord[] = [];
        simpleCleanData.forEach(surah => {
            surah.ayahs.forEach(ayah => {
                const ayahWords = ayah.text.split(' ');
                ayahWords.forEach(w => {
                    const norm = normalizeArabicText(w);
                    words.push({
                        text: w,
                        normalized: norm,
                        mask: getLetterMask(w),
                        surah: surah.number,
                        ayah: ayah.numberInSurah,
                        surahName: surah.name
                    });
                });
            });
        });
        return words;
    }, [simpleCleanData]);

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
                let bestLen = Infinity;
                let bestL = -1;
                let bestR = -1;

                for (let L = idx; L >= 0; L--) {
                    if (idx - L >= bestLen) break;
                    let mask = 0;
                    for (let R = L; R < flatWords.length; R++) {
                        if (R - L + 1 >= bestLen) break;
                        mask |= flatWords[R].mask;
                        if (mask === ALL_LETTERS_MASK && R >= idx) {
                            bestLen = R - L + 1;
                            bestL = L;
                            bestR = R;
                            break;
                        }
                    }
                }

                if (bestL !== -1) {
                    foundResults.push({
                        L: bestL,
                        R: bestR,
                        length: bestLen,
                        targetIndex: idx
                    });
                }
            }

            currentChunk++;
            setProgress(Math.round((currentChunk / chunks.length) * 100));
            
            requestAnimationFrame(() => {
                setTimeout(processChunk, 10);
            });
        };

        // Start processing after a brief delay to allow UI to update
        setTimeout(processChunk, 50);
    };

    const displayedResults = results.slice(0, 30);

    return (
        <div className="animate-fade-in w-full max-w-4xl mx-auto px-4 pb-20">
            <div className="mb-6">
                <a href="#/structure" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-focus transition-colors mb-4 font-semibold text-sm">
                    <ArrowRightIcon className="w-4 h-4" />
                    العودة إلى بنية المصحف
                </a>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary-text flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-amber-500" />
                    ماسح الحروف الأبجدية
                </h1>
                <p className="text-text-secondary mt-2 text-sm sm:text-base leading-relaxed">
                    تقوم هذه الأداة بالبحث عن الكلمة التي تختارها في القرآن الكريم، ثم تبحث في الآيات السابقة واللاحقة لها لتجد <strong>أصغر نافذة نصية (أقرب مسافة)</strong> تحتوي على جميع الحروف الأبجدية العربية (28 حرفاً).
                </p>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-default mb-8">
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
                        className="bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                جاري الفحص...
                            </>
                        ) : (
                            <>
                                <PlayIcon className="w-5 h-5" />
                                بدء المسح
                            </>
                        )}
                    </button>
                </div>

                {(isScanning || progress > 0) && (
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-text-secondary">{statusText}</span>
                            <span className="text-primary">{progress}%</span>
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
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-primary-text">
                            النتائج ({results.length} موضع)
                        </h2>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full font-bold">
                            مرتبة من الأقصر إلى الأطول
                        </span>
                    </div>

                                        <div className="grid grid-cols-1 gap-4">
                        {displayedResults.map((res, idx) => (
                            <ScannerResultItem key={idx} res={res} idx={idx} flatWords={flatWords} />
                        ))}
                    </div>
                    {results.length > 30 && (
                        <p className="text-center text-text-muted mt-6 text-sm">
                            تم عرض أفضل 30 نتيجة من أصل {results.length}.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlphabetScannerView;
