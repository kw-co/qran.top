import React, { useMemo, useState } from 'react';
import type { SurahData, SavedAyahItem } from '../../types';
import { 
    PURE_NOORANI_LETTERS, 
    NOORANI_LETTERS_WITH_WAW, 
    FAWATIH_SURAHS_NUMBERS,
    HAWAMIM_SURAHS_NUMBERS,
    HAWAMIM_LETTERS,
    HAWAMIM_LETTERS_WITH_WAW,
    normalizeCharForNoorani 
} from '../../utils/nooraniAyahs';
import { stripDiacritics } from '../../utils/text';
import { QURAN_INDEX } from '../../quranIndex';
import { 
    SparklesIcon, 
    BookOpenIcon, 
    CopyIcon, 
    CheckIcon, 
    SearchIcon, 
    ClearIcon 
} from '../icons';

interface NooraniSequencesTabProps {
    quranData: SurahData[];
    allowWaw: boolean;
    onSaveAyah?: (item: SavedAyahItem) => void;
}

export type SequenceSortOrder = 'quran_order' | 'length_desc' | 'letters_desc' | 'letters_asc';
export type SequenceSurahScope = 'all' | 'hawamim_surahs' | 'fawatih_surahs' | 'meccan' | 'medinan';
export type SequenceLetterMode = 'all_noorani' | 'hawamim_only';

interface NooraniSequenceItem {
    ayahNumberGlobal: number;
    surahNumber: number;
    surahName: string;
    ayahNumberInSurah: number;
    page: number;
    juz: number;
    sequenceText: string;
    fullAyahText: string;
    wordCount: number;
    lettersCount: number;
}

export const NooraniSequencesTab: React.FC<NooraniSequencesTabProps> = ({
    quranData,
    allowWaw,
    onSaveAyah
}) => {
    const [minWords, setMinWords] = useState<number>(3);
    const [sortOrder, setSortOrder] = useState<SequenceSortOrder>('quran_order');
    const [surahScope, setSurahScope] = useState<SequenceSurahScope>('all');
    const [letterMode, setLetterMode] = useState<SequenceLetterMode>('all_noorani');
    const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedAll, setCopiedAll] = useState<boolean>(false);

    const pageSize = 20;

    // Allowed letters based on letterMode and allowWaw
    const allowedSet = useMemo(() => {
        if (letterMode === 'hawamim_only') {
            const letters = allowWaw ? HAWAMIM_LETTERS_WITH_WAW : HAWAMIM_LETTERS;
            return new Set(letters.map(normalizeCharForNoorani));
        }
        const letters = allowWaw ? NOORANI_LETTERS_WITH_WAW : PURE_NOORANI_LETTERS;
        return new Set(letters.map(normalizeCharForNoorani));
    }, [allowWaw, letterMode]);

    // Quick Action Handlers
    const handleSetQuranOrder = () => {
        setSortOrder('quran_order');
        setCurrentPage(1);
    };

    const handleSetLengthDesc = () => {
        setSortOrder('length_desc');
        setCurrentPage(1);
    };

    const handleSetHawamimOnly = () => {
        setLetterMode('hawamim_only');
        setSurahScope('hawamim_surahs');
        setSelectedSurahNumber(undefined);
        setMinWords(2); // Since Hawamim letters (ح، م) are fewer, allow 2+ words
        setCurrentPage(1);
    };

    const handleSetHawamimSurahsScope = () => {
        setSurahScope('hawamim_surahs');
        setLetterMode('all_noorani');
        setSelectedSurahNumber(undefined);
        setCurrentPage(1);
    };

    const handleResetToAll = () => {
        setSurahScope('all');
        setLetterMode('all_noorani');
        setSelectedSurahNumber(undefined);
        setMinWords(3);
        setCurrentPage(1);
    };

    // Find all sequences with >= minWords pure words
    const allSequences = useMemo(() => {
        const list: NooraniSequenceItem[] = [];

        quranData.forEach(surah => {
            // Scope filters
            if (selectedSurahNumber && surah.number !== selectedSurahNumber) return;
            if (surahScope === 'fawatih_surahs' && !FAWATIH_SURAHS_NUMBERS.includes(surah.number)) return;
            if (surahScope === 'hawamim_surahs' && !HAWAMIM_SURAHS_NUMBERS.includes(surah.number)) return;
            if (surahScope === 'meccan' && surah.revelationType !== 'Meccan') return;
            if (surahScope === 'medinan' && surah.revelationType === 'Meccan') return;

            surah.ayahs.forEach(ayah => {
                const clean = stripDiacritics(ayah.text || '');
                const words = clean.split(/\s+/).filter(Boolean);

                let currentStart = -1;
                let currentCount = 0;
                let currentLetters = 0;

                words.forEach((word, wIdx) => {
                    let isWordPure = true;
                    let wordLetterCount = 0;

                    for (const char of word) {
                        if (/[\u0621-\u064A]/.test(char)) {
                            wordLetterCount++;
                            const norm = normalizeCharForNoorani(char);
                            if (!allowedSet.has(norm)) {
                                isWordPure = false;
                                break;
                            }
                        }
                    }

                    if (isWordPure && wordLetterCount > 0) {
                        if (currentStart === -1) {
                            currentStart = wIdx;
                        }
                        currentCount++;
                        currentLetters += wordLetterCount;
                    } else {
                        if (currentCount >= minWords && currentStart !== -1) {
                            const seqText = words.slice(currentStart, currentStart + currentCount).join(' ');
                            list.push({
                                ayahNumberGlobal: ayah.number,
                                surahNumber: surah.number,
                                surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                                ayahNumberInSurah: ayah.numberInSurah,
                                page: ayah.page || 1,
                                juz: ayah.juz || 1,
                                sequenceText: seqText,
                                fullAyahText: ayah.text || '',
                                wordCount: currentCount,
                                lettersCount: currentLetters
                            });
                        }
                        currentStart = -1;
                        currentCount = 0;
                        currentLetters = 0;
                    }
                });

                // End of ayah check
                if (currentCount >= minWords && currentStart !== -1) {
                    const seqText = words.slice(currentStart, currentStart + currentCount).join(' ');
                    list.push({
                        ayahNumberGlobal: ayah.number,
                        surahNumber: surah.number,
                        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                        ayahNumberInSurah: ayah.numberInSurah,
                        page: ayah.page || 1,
                        juz: ayah.juz || 1,
                        sequenceText: seqText,
                        fullAyahText: ayah.text || '',
                        wordCount: currentCount,
                        lettersCount: currentLetters
                    });
                }
            });
        });

        return list;
    }, [quranData, allowedSet, minWords, surahScope, selectedSurahNumber]);

    // Apply Search Filter and Sort Order
    const filteredSequences = useMemo(() => {
        let list = allSequences;

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(item => 
                item.sequenceText.toLowerCase().includes(q) ||
                item.surahName.toLowerCase().includes(q) ||
                item.fullAyahText.toLowerCase().includes(q)
            );
        }

        const copy = [...list];
        switch (sortOrder) {
            case 'quran_order':
                return copy.sort((a, b) => a.ayahNumberGlobal - b.ayahNumberGlobal);
            case 'length_desc':
                return copy.sort((a, b) => b.wordCount - a.wordCount || b.lettersCount - a.lettersCount || a.ayahNumberGlobal - b.ayahNumberGlobal);
            case 'letters_desc':
                return copy.sort((a, b) => b.lettersCount - a.lettersCount || b.wordCount - a.wordCount || a.ayahNumberGlobal - b.ayahNumberGlobal);
            case 'letters_asc':
                return copy.sort((a, b) => a.lettersCount - b.lettersCount || a.wordCount - b.wordCount || a.ayahNumberGlobal - b.ayahNumberGlobal);
            default:
                return copy;
        }
    }, [allSequences, searchQuery, sortOrder]);

    // Paginated results
    const totalPages = Math.ceil(filteredSequences.length / pageSize) || 1;
    const paginatedSequences = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSequences.slice(start, start + pageSize);
    }, [filteredSequences, currentPage]);

    const handleCopy = (seq: NooraniSequenceItem, idx: number) => {
        const text = `"${seq.sequenceText}" [سورة ${seq.surahName}: ${seq.ayahNumberInSurah}]`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        const text = filteredSequences.map(seq => `"${seq.sequenceText}" [سورة ${seq.surahName}: ${seq.ayahNumberInSurah}]`).join('\n');
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2500);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="p-4 sm:p-5 bg-surface border border-border-default rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-amber-500" />
                            <span>بوابة أطول العبارات والمقاطع النورانية المتصلة</span>
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                            استخراج الجمل والعبارات المتتالية المتشكلة حصراً من الحروف النورانية {letterMode === 'hawamim_only' ? '(حروف الحواميم: ح، م)' : allowWaw ? '(مع حرف الواو)' : '(14 حرفاً صافياً)'}.
                        </p>
                    </div>

                    {/* Quick Stats Badge */}
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                            {filteredSequences.length} مقطعاً متصلاً
                        </span>
                    </div>
                </div>

                {/* Quick Filter Action Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-border-default/60">
                    <span className="text-xs font-bold text-text-muted">فلاتر سريعة:</span>

                    {/* Quran Order Pill */}
                    <button
                        onClick={handleSetQuranOrder}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortOrder === 'quran_order'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                        title="عرض العبارات مرتبة حسب ورودها في المصحف الشريف سورة بسورة"
                    >
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        <span>ترتيب المصحف الشريف</span>
                        {sortOrder === 'quran_order' && <CheckIcon className="w-3 h-3" />}
                    </button>

                    {/* Longest First Pill */}
                    <button
                        onClick={handleSetLengthDesc}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortOrder === 'length_desc'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                        title="عرض المقاطع الأطول والأكثر كلمات أولاً"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>الأطول أولاً</span>
                        {sortOrder === 'length_desc' && <CheckIcon className="w-3 h-3" />}
                    </button>

                    {/* Hawamim in Hawamim Surahs Pill */}
                    <button
                        onClick={handleSetHawamimOnly}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            letterMode === 'hawamim_only' && surahScope === 'hawamim_surahs'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}
                        title="عرض عبارات الحواميم (المكونة من ح، م) في سور آل حم السبعة فقط (40-46)"
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        <span>عبارات الحواميم في سور الحواميم (40-46)</span>
                        {letterMode === 'hawamim_only' && surahScope === 'hawamim_surahs' && (
                            <CheckIcon className="w-3 h-3" />
                        )}
                    </button>

                    {/* Hawamim Surahs Scope Pill */}
                    <button
                        onClick={handleSetHawamimSurahsScope}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            surahScope === 'hawamim_surahs' && letterMode === 'all_noorani'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                        title="حصر البحث في سور آل حم السبعة فقط مع كافة الحروف النورانية"
                    >
                        <span>سور الحواميم فقط (40 - 46)</span>
                        {surahScope === 'hawamim_surahs' && letterMode === 'all_noorani' && (
                            <CheckIcon className="w-3 h-3" />
                        )}
                    </button>

                    {/* Reset to All Quran */}
                    <button
                        onClick={handleResetToAll}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            surahScope === 'all' && letterMode === 'all_noorani'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-muted border border-border-default'
                        }`}
                    >
                        <span>كافة المصحف (14 حرفاً)</span>
                    </button>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Sort Order */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1.5">
                            ترتيب العرض (الفرز):
                        </label>
                        <select
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value as SequenceSortOrder);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="quran_order">📖 حسب ترتيب المصحف الشريف</option>
                            <option value="length_desc">🌟 الأطول عبارة (الأكثر كلمات)</option>
                            <option value="letters_desc">📏 الأكثر حروفاً</option>
                            <option value="letters_asc">📐 الأقل حروفاً</option>
                        </select>
                    </div>

                    {/* Surah Scope */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1.5">
                            نطاق السور:
                        </label>
                        <select
                            value={surahScope}
                            onChange={(e) => {
                                setSurahScope(e.target.value as SequenceSurahScope);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="all">كافة سور المصحف الشريف (114 سورة)</option>
                            <option value="hawamim_surahs">سور الحواميم السبعة فقط (غافر 40 إلى الأحقاف 46)</option>
                            <option value="fawatih_surahs">السور ذات الفواتح النورانية فقط (29 سورة)</option>
                            <option value="meccan">السور المكية فقط</option>
                            <option value="medinan">السور المدنية فقط</option>
                        </select>
                    </div>

                    {/* Letter Mode Scope */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1.5">
                            حروف العبارات:
                        </label>
                        <select
                            value={letterMode}
                            onChange={(e) => {
                                setLetterMode(e.target.value as SequenceLetterMode);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="all_noorani">الحروف النورانية الكاملة ({allowWaw ? '15 حرفاً مع الواو' : '14 حرفاً'})</option>
                            <option value="hawamim_only">حروف الحواميم فقط (ح، م{allowWaw ? '، و' : ''})</option>
                        </select>
                    </div>

                    {/* Specific Surah */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1.5">
                            تحديد سورة معينة:
                        </label>
                        <select
                            value={selectedSurahNumber || ''}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : undefined;
                                setSelectedSurahNumber(val);
                                setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
                        >
                            <option value="">جميع السور في النطاق المحدد</option>
                            {QURAN_INDEX.map(s => (
                                <option key={s.number} value={s.number}>
                                    {s.number}. سورة {s.name.replace(/سُورَةُ\s*/g, '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1.5">
                            بحث بنص العبارة:
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="ابحث في العبارات..."
                                className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs text-text-primary focus:outline-hidden focus:border-primary"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                                >
                                    <ClearIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub Controls Row: Word length threshold + Copy all */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default/60">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-medium">الحد الأدنى للكلمات:</span>
                        <div className="flex items-center rounded-xl bg-surface-subtle p-1 border border-border-default">
                            {[2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        setMinWords(num);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        minWords === num
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {num}+ كلمات
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Copy All Button */}
                    {filteredSequences.length > 0 && (
                        <button
                            onClick={handleCopyAll}
                            className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            {copiedAll ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                            <span>{copiedAll ? 'تم نسخ جميع المقاطع' : 'نسخ كل المقاطع المطابقة'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            {paginatedSequences.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-surface border border-border-default text-text-muted space-y-2">
                    <p className="text-sm font-semibold">لم يتم العثور على مقاطع مطابقة للمعايير المحددة.</p>
                    <p className="text-xs">جرب تقليل الحد الأدنى لعدد الكلمات إلى 2 أو تغيير نطاق السور والحروف.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedSequences.map((seq, idx) => (
                        <div
                            key={`${seq.ayahNumberGlobal}-${idx}`}
                            className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-default hover:border-emerald-500/40 shadow-xs transition-all space-y-3"
                        >
                            <div className="flex items-center justify-between text-xs text-text-muted">
                                <a
                                    href={`#/surah/${seq.surahNumber}?ayah=${seq.ayahNumberInSurah}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                                >
                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                    <span>سورة {seq.surahName} : {seq.ayahNumberInSurah}</span>
                                </a>

                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
                                        {seq.wordCount} كلمات ({seq.lettersCount} حرفاً)
                                    </span>
                                </div>
                            </div>

                            {/* Sequence highlighted text */}
                            <div 
                                className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-right font-quran-text text-xl sm:text-2xl text-emerald-900 dark:text-emerald-300 leading-loose"
                                dir="rtl"
                            >
                                "{seq.sequenceText}"
                            </div>

                            {/* Full ayah context */}
                            <div className="text-right text-xs sm:text-sm text-text-secondary font-quran-text leading-relaxed line-clamp-2" dir="rtl">
                                <span className="text-text-muted font-normal">سياق الآية: </span>
                                {seq.fullAyahText}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-border-default/60">
                                <span className="text-[11px] text-text-muted">
                                    ص {seq.page} • ج {seq.juz}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleCopy(seq, idx)}
                                        className="px-2.5 py-1 rounded-lg text-xs bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default flex items-center gap-1 transition-colors cursor-pointer"
                                    >
                                        {copiedIndex === idx ? <CheckIcon className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
                                        <span>{copiedIndex === idx ? 'تم' : 'نسخ'}</span>
                                    </button>

                                    <a
                                        href={`#/surah/${seq.surahNumber}?ayah=${seq.ayahNumberInSurah}`}
                                        className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors"
                                    >
                                        عرض الآية
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                    >
                        السابق
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 7) {
                                if (currentPage > 4) {
                                    pageNum = currentPage - 3 + i;
                                }
                                if (pageNum > totalPages) {
                                    pageNum = totalPages - (6 - i);
                                }
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        currentPage === pageNum
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-surface hover:bg-surface-hover border border-border-default text-text-secondary'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-xs font-semibold disabled:opacity-40 hover:bg-surface-hover cursor-pointer"
                    >
                        التالي
                    </button>
                </div>
            )}
        </div>
    );
};
