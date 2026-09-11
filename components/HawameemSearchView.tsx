import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Ayah, SurahData, SavedAyahItem, SavedSearchItem } from '../types';
import { SearchIcon, MicrophoneIcon, ClearIcon, BookOpenIcon, SparklesIcon, InformationCircleIcon } from './icons';
import { SearchView } from './SearchView';
import { HAWAMEEM_SURAH_NUMBERS } from '../hooks/useSearch';
import { formatSurahNameForDisplay } from '../utils/text';

export const HAWAMEEM_SURAH_DETAILS = [
    { number: 40, name: "سورة غافر", title: "غافر", ayahs: 85, revelation: "مكية", opening: "حم (1) تَنزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْعَلِيمِ" },
    { number: 41, name: "سورة فصلت", title: "فصلت", ayahs: 54, revelation: "مكية", opening: "حم (1) تَنزِيلٌ مِّنَ الرَّحْمَٰنِ الرَّحِيمِ" },
    { number: 42, name: "سورة الشورى", title: "الشورى", ayahs: 53, revelation: "مكية", opening: "حم (1) عسق (2) كَذَٰلِكَ يُوحِي إِلَيْكَ..." },
    { number: 43, name: "سورة الزخرف", title: "الزخرف", ayahs: 89, revelation: "مكية", opening: "حم (1) وَالْكِتَابِ الْمُبِينِ (2) إِنَّا جَعَلْنَاهُ قُرْآنًا عَرَبِيًّا" },
    { number: 44, name: "سورة الدخان", title: "الدخان", revelation: "مكية", opening: "حم (1) وَالْكِتَابِ الْمُبِينِ (2) إِنَّا أَنزَلْنَاهُ فِي لَيْلَةٍ مُّبَارَكَةٍ" },
    { number: 45, name: "سورة الجاثية", title: "الجاثية", revelation: "مكية", opening: "حم (1) تَنزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْحَكِيمِ" },
    { number: 46, name: "سورة الأحقاف", title: "الأحقاف", revelation: "مكية", opening: "حم (1) تَنزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْحَكِيمِ" },
];

const HAWAMEEM_KEY_SUGGESTIONS = [
    "تنزيل الكتاب", "العزيز العليم", "العزيز الحكيم", "الكتاب المبين", 
    "إنا أنزلناه", "العرش", "استوى", "السميع البصير", "رحمة", 
    "السماوات والأرض", "وحي", "غافر الذنب", "أفلم يسيروا", "الحق"
];

interface HawameemSearchViewProps {
    query: string;
    results: Ayah[];
    onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number) => void;
    onSearchByAyahNumber: (ayahNumber: number) => void;
    onSearchComplete: () => void;
    autoOpenDiscussion?: boolean;
    displayEditionData: SurahData[];
    searchEdition: string;
    position?: { surah: number, ayah: number, wordIndex: number };
    simpleCleanData: SurahData[];
    onSaveAyah: (item: SavedAyahItem) => void;
    onSaveSearch: (item: SavedSearchItem) => void;
    searchType?: 'text' | 'number';
    currentlyPlayingAyahGlobalNumber: number | null;
    isPlaybackLoading: boolean;
    onStartPlayback: (ayahs: Ayah[], audioEditionIdentifier: string, startIndex?: number) => void;
    correctedQuery?: string;
    isRootSearch?: boolean;
    targetSurahNumber?: number;
    onSelectSurahFilter?: (surahNum?: number) => void;
}

export const HawameemSearchView: React.FC<HawameemSearchViewProps> = ({
    query,
    results,
    onNewSearch,
    onSearchByAyahNumber,
    onSearchComplete,
    autoOpenDiscussion,
    displayEditionData,
    searchEdition,
    position,
    simpleCleanData,
    onSaveAyah,
    onSaveSearch,
    searchType = 'text',
    currentlyPlayingAyahGlobalNumber,
    isPlaybackLoading,
    onStartPlayback,
    correctedQuery,
    isRootSearch = false,
    targetSurahNumber,
    onSelectSurahFilter,
}) => {
    const [inputValue, setInputValue] = useState(query);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Keep input in sync with incoming query prop
    useEffect(() => {
        setInputValue(query);
    }, [query]);

    // Calculate match distribution across the 7 Hawameem
    const surahDistribution = useMemo(() => {
        const dist: Record<number, number> = {};
        HAWAMEEM_SURAH_NUMBERS.forEach(num => { dist[num] = 0; });
        results.forEach(ayah => {
            const sNum = ayah.surah?.number;
            if (sNum && dist[sNum] !== undefined) {
                dist[sNum]++;
            }
        });
        return dist;
    }, [results]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            // Check if user entered a number directly
            if (/^\d+$/.test(trimmed)) {
                onSearchByAyahNumber(parseInt(trimmed, 10));
            } else {
                onNewSearch(trimmed, searchEdition, undefined, isRootSearch, targetSurahNumber);
            }
        }
    };

    const handleToggleRoot = () => {
        const nextRoot = !isRootSearch;
        if (inputValue.trim()) {
            onNewSearch(inputValue.trim(), searchEdition, undefined, nextRoot, targetSurahNumber);
        } else {
            let url = '#/hm';
            const params: string[] = [];
            if (nextRoot) params.push('mode=root');
            if (targetSurahNumber) params.push(`ts=${targetSurahNumber}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            window.location.hash = url;
        }
    };

    const handleClearInput = () => {
        setInputValue('');
        window.location.hash = targetSurahNumber ? `#/hm?ts=${targetSurahNumber}` : '#/hm';
    };

    const handleSelectSurah = (surahNum?: number) => {
        if (onSelectSurahFilter) {
            onSelectSurahFilter(surahNum);
        } else {
            let url = inputValue.trim() ? `#/hm/${encodeURIComponent(inputValue.trim())}` : `#/hm`;
            const params: string[] = [];
            if (isRootSearch) params.push('mode=root');
            if (surahNum) params.push(`ts=${surahNum}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            window.location.hash = url;
        }
    };

    // Voice search support
    const startVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('البحث الصوتي غير مدعوم في هذا المتصفح.');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-SA';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognitionRef.current = recognition;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event: any) => {
                let transcript = event.results[0][0].transcript;
                transcript = transcript.replace(/[.?!؟,]/g, '').trim();
                setInputValue(transcript);
                onNewSearch(transcript, searchEdition, undefined, isRootSearch, targetSurahNumber);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => {
                setIsListening(false);
                recognitionRef.current = null;
            };

            recognition.start();
        } catch (e) {
            setIsListening(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-6" dir="rtl">
            {/* Page Header / Brand Identity */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface to-purple-500/5 border border-amber-500/20 p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                            <span className="font-quran text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400">
                                حم
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-quran">
                                    حم — بحث الحواميم
                                </h1>
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    7 سور متتالية • 412 آية
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
                                محرك بحث مخصص حصرياً لسور آل (حم) السبع في المصحف الشريف: غافر، فصلت، الشورى، الزخرف، الدخان، الجاثية، الأحقاف.
                            </p>
                        </div>
                    </div>

                    {/* Quick navigation to full Quran search if query is active */}
                    {query.trim() && (
                        <a
                            href={`#/search/${encodeURIComponent(query.trim())}${isRootSearch ? '?mode=root' : ''}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-surface-subtle hover:bg-surface-hover text-primary border border-border-default transition-all shadow-sm flex-shrink-0"
                            title="الانتقال للبحث عن نفس المفردة في كامل المصحف"
                        >
                            <SearchIcon className="w-4 h-4" />
                            <span>البحث في كل المصحف</span>
                        </a>
                    )}
                </div>

                {/* Surah Filter Chips (All 7 Hawameem) */}
                <div className="mt-5 pt-4 border-t border-border-default/60">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                            <BookOpenIcon className="w-3.5 h-3.5 text-amber-500" />
                            تحديد نطاق البحث:
                        </span>
                        {targetSurahNumber && (
                            <button
                                onClick={() => handleSelectSurah(undefined)}
                                className="text-xs text-primary hover:underline"
                            >
                                إظهار كل الحواميم
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => handleSelectSurah(undefined)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                !targetSurahNumber
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-default'
                            }`}
                        >
                            جميع الحواميم (7)
                        </button>
                        {HAWAMEEM_SURAH_DETAILS.map(s => {
                            const isSelected = targetSurahNumber === s.number;
                            const count = surahDistribution[s.number];
                            return (
                                <button
                                    key={s.number}
                                    onClick={() => handleSelectSurah(isSelected ? undefined : s.number)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isSelected
                                            ? 'bg-amber-600 text-white font-bold shadow-sm'
                                            : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary border border-border-default'
                                    }`}
                                >
                                    <span>{s.number}. {s.title}</span>
                                    {query.trim() && count !== undefined && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                            isSelected ? 'bg-amber-800/60 text-amber-100' : 'bg-surface text-text-muted border border-border-subtle'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Search Input Form */}
            <form onSubmit={handleFormSubmit} className="relative">
                <div className="flex items-center bg-surface border-2 border-amber-500/30 focus-within:border-amber-500 rounded-2xl p-1.5 shadow-sm transition-all">
                    <div className="pr-3 pl-2 text-amber-600 dark:text-amber-400">
                        <SearchIcon className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="ابحث في سور الحواميم (كلمة، عبارة تامة، جذر، أو رقم آية)..."
                        className="w-full bg-transparent text-text-primary placeholder:text-text-muted text-base sm:text-lg focus:outline-none py-2 font-arabic"
                        autoFocus
                    />
                    
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClearInput}
                            className="p-2 text-text-muted hover:text-text-primary transition-colors"
                            title="مسح"
                        >
                            <ClearIcon className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={startVoiceSearch}
                        className={`p-2 rounded-xl transition-all ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'text-text-secondary hover:text-primary hover:bg-surface-hover'
                        }`}
                        title="البحث الصوتي"
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>

                    <button
                        type="submit"
                        className="mr-1 px-4 sm:px-6 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold rounded-xl text-sm sm:text-base transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        بحث
                    </button>
                </div>

                {/* Sub-controls: Root Search Toggle & Mode Indicators */}
                <div className="flex items-center justify-between mt-2.5 px-1 text-xs text-text-secondary flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleToggleRoot}
                            className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isRootSearch
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                    : 'bg-surface-subtle border-border-default text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            <span>🌱</span>
                            <span>بحث بالجذر</span>
                            {isRootSearch && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        </button>

                        <span className="text-text-muted hidden sm:inline">•</span>
                        <span className="text-text-muted hidden sm:inline">
                            للعبارات التامة ضع المفردات بين علامتي اقتباس مثل: <code className="text-primary font-mono font-bold">"تنزيل الكتاب"</code>
                        </span>
                    </div>

                    {targetSurahNumber && (
                        <div className="text-amber-600 dark:text-amber-400 font-medium">
                            مُقيد بسورة: {HAWAMEEM_SURAH_DETAILS.find(s => s.number === targetSurahNumber)?.title}
                        </div>
                    )}
                </div>
            </form>

            {/* Quick Suggestions Chips */}
            {!query.trim() && (
                <div className="space-y-3 bg-surface p-4 sm:p-5 rounded-2xl border border-border-default">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                        <SparklesIcon className="w-4 h-4 text-amber-500" />
                        <span>مفردات ومواضيع محورية بارزة في سور الحواميم:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {HAWAMEEM_KEY_SUGGESTIONS.map(term => (
                            <button
                                key={term}
                                onClick={() => {
                                    setInputValue(term);
                                    onNewSearch(term, searchEdition, undefined, false, targetSurahNumber);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-500/30 text-text-primary text-xs font-medium border border-border-default transition-all cursor-pointer shadow-xs"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State / Welcome Guide: Cards for the 7 Surahs */}
            {!query.trim() && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                            <BookOpenIcon className="w-5 h-5 text-amber-500" />
                            <span>السور السبع في منظومة الحواميم</span>
                        </h2>
                        <span className="text-xs text-text-muted">انقر على أي سورة لتصفيتها أو تصفحها</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {HAWAMEEM_SURAH_DETAILS.map(s => (
                            <div
                                key={s.number}
                                className="group relative bg-surface hover:bg-surface-hover/70 border border-border-default hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 shadow-xs flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
                                                {s.number}
                                            </span>
                                            <h3 className="font-quran text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                                                {s.name}
                                            </h3>
                                        </div>
                                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-subtle text-text-secondary border border-border-default">
                                            {s.ayahs} آية
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-muted font-quran leading-relaxed mb-3 line-clamp-2" dir="rtl">
                                        {s.opening}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-border-subtle text-xs">
                                    <button
                                        onClick={() => handleSelectSurah(s.number)}
                                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium transition-colors text-center cursor-pointer"
                                    >
                                        بحث في السورة
                                    </button>
                                    <a
                                        href={`#/surah/${s.number}`}
                                        className="py-1.5 px-2.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-default transition-colors"
                                        title="قراءة السورة كاملة"
                                    >
                                        تصفح
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Educational Note about Hawameem */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-text-secondary leading-relaxed flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-text-primary ml-1">لطيفة قرآنية في الحواميم:</span>
                            تتوالى سور الحواميم السبعة في المصحف الشريف متتالية من سورة غافر (40) إلى سورة الأحقاف (46)، وتبدأ جميعها بـ «حم»، وتتميز باتفاق مطالعها في تعظيم القرآن الكريم وتنزيل الكتاب، وتفصيل آيات التوحيد وعظمة الخالق والعرش والرحمة.
                        </div>
                    </div>
                </div>
            )}

            {/* Results Section: When query is non-empty */}
            {query.trim() && (
                <div className="space-y-4">
                    {/* Hawameem Scoped Results Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-quran text-base font-bold text-amber-600 dark:text-amber-400">حم</span>
                            <span className="font-bold text-text-primary">
                                نتائج البحث في {targetSurahNumber ? `سورة ${HAWAMEEM_SURAH_DETAILS.find(s => s.number === targetSurahNumber)?.title}` : 'سور الحواميم السبعة'}:
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold font-mono">
                                {results.length} آية
                            </span>
                        </div>
                        {targetSurahNumber && (
                            <button
                                onClick={() => handleSelectSurah(undefined)}
                                className="text-amber-700 dark:text-amber-300 underline font-medium hover:text-amber-800"
                            >
                                إلغاء تحديد السورة والبحث في كل الحواميم
                            </button>
                        )}
                    </div>

                    {/* Rich Standard SearchView Embed */}
                    <SearchView
                        query={query}
                        results={results}
                        onNewSearch={(word, sourceEdition, pos, isRoot, targetSurah) => {
                            onNewSearch(word, sourceEdition, pos, isRoot, targetSurah);
                        }}
                        onSearchByAyahNumber={onSearchByAyahNumber}
                        onSearchComplete={onSearchComplete}
                        autoOpenDiscussion={autoOpenDiscussion}
                        displayEditionData={displayEditionData}
                        searchEdition={searchEdition}
                        position={position}
                        simpleCleanData={simpleCleanData}
                        onSaveAyah={onSaveAyah}
                        onSaveSearch={onSaveSearch}
                        searchType={searchType}
                        currentlyPlayingAyahGlobalNumber={currentlyPlayingAyahGlobalNumber}
                        isPlaybackLoading={isPlaybackLoading}
                        onStartPlayback={onStartPlayback}
                        correctedQuery={correctedQuery}
                        isRootSearch={isRootSearch}
                        targetSurahNumber={targetSurahNumber}
                    />
                </div>
            )}
        </div>
    );
};

export default HawameemSearchView;
