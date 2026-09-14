import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Ayah, SurahData } from '../../types';
import { copyToClipboard } from '../../utils/text';
import { findWordsByFingerprint, FingerprintMatch } from '../../utils/reverseSearch';
import { 
    CopyIcon, 
    CheckIcon,
    ClearIcon,
    SearchIcon
} from '../icons';

export interface HawameemSurahItem {
    index: number;        // 1 to 7
    surahNumber: number;  // Surah number in Quran (40 to 46)
    surahName: string;    // Arabic name (e.g. "غافر")
    letters: string;      // Muqatta'at formula ("حم" or "حم عسق")
}

// Complete list of the 7 Hawameem Surahs in Quran order (Surahs 40 to 46)
export const HAWAMEEM_7_SURAHS: HawameemSurahItem[] = [
    { index: 1, surahNumber: 40, surahName: "غافر",    letters: "حم" },
    { index: 2, surahNumber: 41, surahName: "فصلت",   letters: "حم" },
    { index: 3, surahNumber: 42, surahName: "الشورى",  letters: "حم عسق" },
    { index: 4, surahNumber: 43, surahName: "الزخرف",  letters: "حم" },
    { index: 5, surahNumber: 44, surahName: "الدخان",  letters: "حم" },
    { index: 6, surahNumber: 45, surahName: "الجاثية", letters: "حم" },
    { index: 7, surahNumber: 46, surahName: "الأحقاف", letters: "حم" }
];

// Helper to convert BigInt to any base (radix) up to 36
function bigIntToRadix(num: bigint, radix: number): string {
    if (num === 0n) return "0";
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let res = "";
    let temp = num;
    const r = BigInt(radix);
    while (temp > 0n) {
        const rem = Number(temp % r);
        res = chars[rem] + res;
        temp = temp / r;
    }
    return res;
}

interface HawameemBinaryMatrixProps {
    query: string;
    baseResults: Ayah[];
    displayedResults?: Ayah[];
    activeMuqattaatFilter?: string;
    setActiveMuqattaatFilter?: (val: string) => void;
    onClose?: () => void;
    simpleCleanData?: SurahData[];
    onNewSearch?: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRoot?: boolean, targetSurahNumber?: number, exactMatch?: boolean) => void;
}

export const HawameemBinaryMatrix: React.FC<HawameemBinaryMatrixProps> = ({
    query,
    baseResults,
    displayedResults = [],
    activeMuqattaatFilter = '',
    setActiveMuqattaatFilter,
    onClose,
    simpleCleanData,
    onNewSearch
}) => {
    const [isBinaryCopied, setIsBinaryCopied] = useState(false);
    const [isReportCopied, setIsReportCopied] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [reverseSearchResults, setReverseSearchResults] = useState<FingerprintMatch[] | null>(null);
    const [isReverseSearchRoot, setIsReverseSearchRoot] = useState(false);
    const [isSearchingReverse, setIsSearchingReverse] = useState(false);

    // Set of surah numbers available in the unfiltered search results
    const availableSurahs = useMemo(() => {
        const set = new Set<number>();
        (baseResults || []).forEach(a => {
            if (a.surah?.number) set.add(a.surah.number);
        });
        return set;
    }, [baseResults]);

    // Set of surah numbers present in the currently filtered search results
    const presentSurahs = useMemo(() => {
        const set = new Set<number>();
        (displayedResults && displayedResults.length > 0 ? displayedResults : baseResults || []).forEach(a => {
            if (a.surah?.number) set.add(a.surah.number);
        });
        return set;
    }, [displayedResults, baseResults]);

    // Construct the 7-bit binary string (1 for present, 0 for absent)
    const { binaryString, items, presentCount } = useMemo(() => {
        const list = HAWAMEEM_7_SURAHS.map(s => {
            const isPresent = presentSurahs.has(s.surahNumber);
            const isAvailable = availableSurahs.has(s.surahNumber);
            return {
                ...s,
                isPresent,
                isAvailable,
                bit: isPresent ? '1' : '0'
            };
        });

        const bits = list.map(item => item.bit).join('');
        const count = list.filter(item => item.isPresent).length;

        return { binaryString: bits, items: list, presentCount: count };
    }, [presentSurahs, availableSurahs]);

    // Calculate conversions using BigInt for exact precision
    const {
        decimalVal,
        hexVal,
        base12Val,
        base19Val,
        isDivisibleBy19,
        quotient19,
        remainder19
    } = useMemo(() => {
        try {
            const val = BigInt('0b' + (binaryString || '0'));
            const isDiv = val > 0n && (val % 19n === 0n);
            return {
                decimalVal: val.toString(10),
                hexVal: '0x' + val.toString(16).toUpperCase(),
                base12Val: bigIntToRadix(val, 12),
                base19Val: bigIntToRadix(val, 19),
                isDivisibleBy19: isDiv,
                quotient19: isDiv ? (val / 19n).toString(10) : null,
                remainder19: (val % 19n).toString(10)
            };
        } catch {
            return {
                decimalVal: '0',
                hexVal: '0x0',
                base12Val: '0',
                base19Val: '0',
                isDivisibleBy19: false,
                quotient19: null,
                remainder19: '0'
            };
        }
    }, [binaryString]);

    // Copy single binary string
    const handleCopyBinary = useCallback(() => {
        copyToClipboard(binaryString);
        setIsBinaryCopied(true);
        setTimeout(() => setIsBinaryCopied(false), 2200);
    }, [binaryString]);

    // Copy single converter value with instant feedback
    const handleCopyVal = useCallback((val: string, key: string) => {
        copyToClipboard(val);
        setCopiedKey(key);
        setTimeout(() => {
            setCopiedKey(prev => prev === key ? null : prev);
        }, 1800);
    }, []);

    // Copy comprehensive research report for Hawameem
    const handleCopyReport = useCallback(() => {
        const breakdown = items.map(s => 
            `${s.index}. سورة ${s.surahName} (${s.surahNumber}) [${s.letters}]: ${s.bit}`
        ).join('\n');

        const report = `====================================
تقرير بصمة سور آل حم السبعة (الحواميم)
====================================
• كلمة / جملة البحث: "${query}"
• عدد سور الحواميم المطابقة: ${presentCount} من 7 سور
• مصفوفة التواجد الثنائية (7-bit):
  ${binaryString}

------------------------------------
التحويلات العددية لأنظمة العد:
------------------------------------
• النظام الثنائي (Base 2):       ${binaryString}
• النظام العشري (Base 10):      ${decimalVal}
• النظام الست عشري (Base 16):   ${hexVal}
• النظام الإثنا عشري (Base 12):  ${base12Val}
• النظام التسعة عشري (Base 19):  ${base19Val}
• خاصية القسمة على 19:          ${isDivisibleBy19 ? `يقبل القسمة تماماً (الناتج: ${quotient19})` : `لا يقبل القسمة (الباقي: ${remainder19})`}

------------------------------------
تفصيل سور الحواميم الـ 7 بترتيب المصحف:
------------------------------------
${breakdown}
====================================
المصدر: تطبيق القرآن الكريم التدبري
`;
        copyToClipboard(report);
        setIsReportCopied(true);
        setTimeout(() => setIsReportCopied(false), 2500);
    }, [items, query, presentCount, binaryString, decimalVal, hexVal, base12Val, base19Val, isDivisibleBy19, quotient19, remainder19]);

    // Handle surah filter toggle on clicking cell
    const handleSurahClick = useCallback((surahNumber: number) => {
        if (!setActiveMuqattaatFilter) return;
        const currentFilters = activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
        const surahKey = `s:${surahNumber}`;
        let nextFilters: string[];
        if (currentFilters.includes(surahKey)) {
            nextFilters = currentFilters.filter(f => f !== surahKey);
        } else {
            nextFilters = [...currentFilters, surahKey];
        }
        setActiveMuqattaatFilter(nextFilters.join(','));
    }, [activeMuqattaatFilter, setActiveMuqattaatFilter]);

    // Parse active filters to mark active surahs
    const activeFilterList = useMemo(() => {
        return activeMuqattaatFilter.split(',').map(f => f.trim()).filter(Boolean);
    }, [activeMuqattaatFilter]);

    useEffect(() => {
        setReverseSearchResults(null);
    }, [binaryString]);

    const handleReverseSearch = useCallback(() => {
        if (!simpleCleanData) return;
        setIsSearchingReverse(true);
        // Add a slight delay so UI can show loading state if needed
        setTimeout(() => {
            const matches = findWordsByFingerprint(simpleCleanData, binaryString, true);
            setReverseSearchResults(matches);
            setIsSearchingReverse(false);
        }, 10);
    }, [simpleCleanData, binaryString]);

    return (
        <div className="w-full mt-3 p-3 sm:p-4 bg-surface border border-amber-500/30 dark:border-amber-500/20 rounded-xl shadow-xs space-y-3 transition-all">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-default/60">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        حم
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        بصمة سور آل حم السبعة (الحواميم) ومحولات أنظمة العد
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                        {presentCount} من 7 سور
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleReverseSearch}
                        disabled={!simpleCleanData || isSearchingReverse}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md border transition-colors cursor-pointer shadow-2xs ${
                            reverseSearchResults 
                                ? 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500' 
                                : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                        title="البحث عن جميع الكلمات القرآنية التي تشترك في نفس بصمة الحواميم (7-bit)"
                    >
                        <SearchIcon className={`w-3.5 h-3.5 ${isSearchingReverse ? 'animate-spin' : ''}`} />
                        <span>{isSearchingReverse ? "جاري الفهرسة..." : "البحث العكسي بالبصمة"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyBinary}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer shadow-2xs"
                        title="نسخ الرقم الثنائي الصافي المكون من 7 بت"
                    >
                        {isBinaryCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        <span>{isBinaryCopied ? "تم النسخ" : "نسخ الثنائي (7-bit)"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyReport}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border-default bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-2xs"
                        title="نسخ تقرير بصمة الحواميم كاملاً بجميع التحويلات وتفاصيل السور"
                    >
                        {isReportCopied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        <span>{isReportCopied ? "تم نسخ التقرير" : "نسخ التقرير الشامل"}</span>
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                            title="إغلاق السحاب"
                            aria-label="إغلاق"
                        >
                            <ClearIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* 1. Hawameem 7 Surahs Grid - Completely Scroll-free */}
            <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-text-muted">
                    <span className="font-semibold text-text-secondary">
                        مصفوفة سور الحواميم الـ 7 بترتيب المصحف (1 = وردت، 0 = لم ترد):
                    </span>
                    <span className="text-[10px] hidden sm:inline text-text-muted/80">
                        انقر على أي سورة ذات قيمة (1) لتصفية النتائج، وانقر على أي رقم لنسخه
                    </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full">
                    {items.map((s) => {
                        const isSurahFilterActive = activeFilterList.includes(`s:${s.surahNumber}`);
                        const isCellActive = isSurahFilterActive;

                        return (
                            <button
                                key={s.surahNumber}
                                type="button"
                                className={`flex flex-col items-center justify-between border rounded-lg transition-all text-center select-none py-1.5 px-1 min-h-[72px] ${
                                    isCellActive
                                        ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-500/15 shadow-xs'
                                        : s.isPresent
                                        ? 'border-amber-500/50 bg-amber-500/10 hover:border-amber-500 hover:shadow-2xs cursor-pointer'
                                        : 'border-border-default/60 bg-surface-subtle/30 opacity-70 cursor-default'
                                }`}
                                title={`سورة ${s.surahName} (${s.surahNumber}) - [${s.letters}]\n${
                                    s.isPresent
                                        ? `وردت في نتائج البحث (القيمة: 1) - ${isCellActive ? 'انقر لإلغاء التصفية' : 'انقر لتصفية النتائج لهذه السورة'}`
                                        : 'لم ترد في نتائج البحث (القيمة: 0)'
                                }`}
                                onClick={() => {
                                    if (s.isPresent) {
                                        handleSurahClick(s.surahNumber);
                                    }
                                }}
                            >
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    {s.letters}
                                </span>
                                <span className="text-[11px] font-medium text-text-primary truncate max-w-full">
                                    {s.surahName}
                                </span>
                                <span className="text-[9px] text-text-muted font-mono">
                                    {s.surahNumber}
                                </span>
                                <span 
                                    className={`w-full py-0.5 text-xs font-mono font-bold rounded mt-1 ${
                                        s.isPresent
                                            ? 'text-amber-800 dark:text-amber-200 bg-amber-500/25'
                                            : 'text-text-muted/40 bg-surface-subtle/40'
                                    }`}
                                >
                                    {s.bit}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Radix converters cards */}
            <div className="pt-2 border-t border-border-default/60">
                <div className="text-[11px] font-semibold text-text-secondary mb-2 flex items-center justify-between">
                    <span>المحولات العددية لبصمة الحواميم (7-bit) — انقر على أي رقم للنسخ المباشر:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                    {/* Base 2 */}
                    <div 
                        onClick={() => handleCopyVal(binaryString, 'base2')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-amber-500/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر لنسخ الرقم الثنائي"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>النظام الثنائي (Base 2)</span>
                            {copiedKey === 'base2' ? (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            ) : (
                                <span className="font-mono text-[9px] opacity-75">7-bit</span>
                            )}
                        </div>
                        <div className="font-mono text-[13px] text-text-primary font-bold mt-1 break-all group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {binaryString}
                        </div>
                    </div>

                    {/* Base 10 */}
                    <div 
                        onClick={() => handleCopyVal(decimalVal, 'base10')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-amber-500/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>النظام العشري (Base 10)</span>
                            {copiedKey === 'base10' && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-[14px] text-text-primary font-bold mt-1 break-all group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {decimalVal}
                        </div>
                    </div>

                    {/* Base 16 */}
                    <div 
                        onClick={() => handleCopyVal(hexVal, 'base16')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-amber-500/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>الست عشري (Hex - Base 16)</span>
                            {copiedKey === 'base16' && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-[14px] text-text-primary font-bold mt-1 break-all group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {hexVal}
                        </div>
                    </div>

                    {/* Base 12 */}
                    <div 
                        onClick={() => handleCopyVal(base12Val, 'base12')}
                        className="p-2.5 rounded-lg bg-surface-subtle/60 border border-border-default hover:border-amber-500/50 flex flex-col justify-between cursor-pointer transition-all hover:bg-surface-subtle shadow-2xs group"
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>الإثنا عشري (Base 12)</span>
                            {copiedKey === 'base12' && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-[14px] text-text-primary font-bold mt-1 break-all group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {base12Val}
                        </div>
                    </div>

                    {/* Base 19 */}
                    <div 
                        onClick={() => handleCopyVal(base19Val, 'base19')}
                        className={`p-2.5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all shadow-2xs group ${
                            isDivisibleBy19 
                                ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500' 
                                : 'bg-surface-subtle/60 border-border-default hover:border-amber-500/50 hover:bg-surface-subtle'
                        }`}
                        title="انقر للنسخ"
                    >
                        <div className="text-[10px] text-text-muted font-medium flex items-center justify-between">
                            <span>التسعة عشري (Base 19)</span>
                            {copiedKey === 'base19' ? (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <CheckIcon className="w-3 h-3" /> تم النسخ
                                </span>
                            ) : isDivisibleBy19 ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    ✓ مضاعف 19
                                </span>
                            ) : null}
                        </div>
                        <div className="font-mono text-[14px] text-text-primary font-bold mt-1 break-all group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {base19Val}
                        </div>
                        <div className="text-[10px] mt-1 text-text-muted truncate">
                            {isDivisibleBy19 ? (
                                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                    الناتج: {quotient19}
                                </span>
                            ) : (
                                <span>الباقي على 19: {remainder19}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Reverse Search Results (Words with same footprint) */}
            {reverseSearchResults !== null && (
                <div className="pt-3 border-t border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col space-y-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <SearchIcon className="w-4 h-4" />
                                <span>الكلمات التي تمتلك نفس بصمة الحواميم (7-bit)</span>
                            </h4>
                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
                                {reverseSearchResults.length} كلمة مطابقة
                            </span>
                        </div>
                        
                        {reverseSearchResults.length === 0 ? (
                            <p className="text-xs text-text-muted py-2 text-center">لا توجد كلمات أخرى في القرآن تتطابق مع هذه البصمة.</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {reverseSearchResults.map(match => (
                                    <button
                                        key={match.word}
                                        onClick={() => {
                                            if (onNewSearch) {
                                                onNewSearch(match.word, 'quran-simple-clean', undefined, false, undefined, true);
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-amber-500/30 hover:border-amber-500 hover:shadow-2xs transition-all text-xs text-text-primary cursor-pointer"
                                        title={`الكلمة المجردة: ${match.word} - وردت ${match.count} مرة في القرآن`}
                                    >
                                        <span className="font-semibold">{match.word}</span>
                                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 rounded font-mono">
                                            {match.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="text-[10px] text-text-muted mt-1">
                            * انقر على أي كلمة للبحث عنها مباشرة. الأرقام الجانبية تمثل إجمالي تكرار الكلمة في القرآن الكريم.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(HawameemBinaryMatrix);
