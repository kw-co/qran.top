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
    scanMode: 'shortest' | 'forward' | 'backward';
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
    const [scanMode, setScanMode] = useState<'shortest' | 'forward' | 'backward'>('shortest');
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [statusText, setStatusText] = useState('');
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

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
                if (scanMode === 'shortest') {
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
                            targetIndex: idx,
                            scanMode: 'shortest'
                        });
                    }
                } else if (scanMode === 'forward') {
                    let mask = 0;
                    let foundR = -1;
                    for (let R = idx; R < flatWords.length; R++) {
                        mask |= flatWords[R].mask;
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
                            scanMode: 'forward'
                        });
                    }
                } else if (scanMode === 'backward') {
                    let mask = 0;
                    let foundL = -1;
                    for (let L = idx; L >= 0; L--) {
                        mask |= flatWords[L].mask;
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
                            scanMode: 'backward'
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

        // Start processing after a brief delay to allow UI to update
        setTimeout(processChunk, 50);
    };

    
    const filteredResults = useMemo(() => {
        if (selectedLetters.length === 0) return results;
        return results.filter(res => {
            const seen = new Set<string>();
            let firstLetter = '';
            
            if (res.scanMode === 'backward') {
                for (let j = res.R; j >= res.L; j--) {
                    const word = flatWords[j].normalized;
                    for (let k = word.length - 1; k >= 0; k--) {
                        const char = word[k];
                        if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                            firstLetter = char;
                            break;
                        }
                    }
                    if (firstLetter) break;
                }
            } else {
                for (let j = res.L; j <= res.R; j++) {
                    const word = flatWords[j].normalized;
                    for (const char of word) {
                        if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                            firstLetter = char;
                            break;
                        }
                    }
                    if (firstLetter) break;
                }
            }
            return selectedLetters.includes(firstLetter);
        });
    }, [results, selectedLetters, flatWords]);
    
    const displayedResults = filteredResults.slice(0, 30);

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
                    تقوم هذه الأداة بالبحث عن الكلمة المطلوبة في القرآن الكريم، وتمسح النصوص القرآنية بناءً على <strong>اتجاه المسح</strong> الذي تحدده (تقدمي أو تراجعي أو محيطي) لتستخرج ترتيب الحروف الأبجدية الـ 28 كما وردت في الآيات.
                </p>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-default mb-8">
                <div className="flex flex-col gap-4 mb-4">
                    <label className="text-sm font-bold text-text-primary">اتجاه محرك المسح:</label>
                    <div className="flex flex-wrap gap-4 bg-surface-subtle p-3 rounded-lg border border-border-default">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'shortest'} onChange={() => setScanMode('shortest')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">أقصر نافذة محيطة (متشعب)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'forward'} onChange={() => setScanMode('forward')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">مسح تقدمي (من الكلمة للأمام)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" checked={scanMode === 'backward'} onChange={() => setScanMode('backward')} className="text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                            <span className="text-text-secondary group-hover:text-primary transition-colors text-sm font-semibold">مسح تراجعي (من الكلمة للخلف)</span>
                        </label>
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
                    
                    <div className="bg-surface-subtle p-4 rounded-xl border border-border-default">
                        <h3 className="text-sm font-bold text-text-primary mb-3">تصفية حسب أول حرف مكتشف:</h3>
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
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-sm transition-all ${
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


                                        <div className="grid grid-cols-1 gap-4">
                        {displayedResults.map((res, idx) => (
                            <ScannerResultItem key={idx} res={res} idx={idx} flatWords={flatWords} />
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
    );
};

export default AlphabetScannerView;
