import React, { useMemo, useState } from 'react';
import type { SurahData, SavedAyahItem } from '../../types';
import { 
    PURE_NOORANI_LETTERS, 
    NOORANI_LETTERS_WITH_WAW, 
    normalizeCharForNoorani 
} from '../../utils/nooraniAyahs';
import { stripDiacritics, normalizeArabicText } from '../../utils/text';
import { SparklesIcon, BookOpenIcon, CopyIcon, CheckIcon } from '../icons';

interface NooraniSequencesTabProps {
    quranData: SurahData[];
    allowWaw: boolean;
    onSaveAyah?: (item: SavedAyahItem) => void;
}

interface NooraniSequenceItem {
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
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const allowedSet = useMemo(() => {
        const letters = allowWaw ? NOORANI_LETTERS_WITH_WAW : PURE_NOORANI_LETTERS;
        return new Set(letters.map(normalizeCharForNoorani));
    }, [allowWaw]);

    // Find all sequences with >= minWords pure words
    const sequences = useMemo(() => {
        const list: NooraniSequenceItem[] = [];

        quranData.forEach(surah => {
            surah.ayahs.forEach(ayah => {
                const clean = stripDiacritics(ayah.text);
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
                                surahNumber: surah.number,
                                surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                                ayahNumberInSurah: ayah.numberInSurah,
                                page: ayah.page || 1,
                                juz: ayah.juz || 1,
                                sequenceText: seqText,
                                fullAyahText: ayah.text,
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
                        surahNumber: surah.number,
                        surahName: surah.name.replace(/سُورَةُ\s*/g, ''),
                        ayahNumberInSurah: ayah.numberInSurah,
                        page: ayah.page || 1,
                        juz: ayah.juz || 1,
                        sequenceText: seqText,
                        fullAyahText: ayah.text,
                        wordCount: currentCount,
                        lettersCount: currentLetters
                    });
                }
            });
        });

        return list.sort((a, b) => b.wordCount - a.wordCount || b.lettersCount - a.lettersCount);
    }, [quranData, allowedSet, minWords]);

    const handleCopy = (seq: NooraniSequenceItem, idx: number) => {
        const text = `"${seq.sequenceText}" [سورة ${seq.surahName}: ${seq.ayahNumberInSurah}]`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="p-4 sm:p-5 bg-surface border border-border-default rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-amber-500" />
                            <span>أطول العبارات والمقاطع النورانية المتصلة في القرآن</span>
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                            استخراج الجمل والعبارات التي تتألف كلماتها المتتالية حصراً من الحروف النورانية {allowWaw ? 'مع حرف الواو' : 'بدون حرف الواو'}.
                        </p>
                    </div>

                    {/* Word Count Threshold Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-medium">الحد الأدنى للكلمات:</span>
                        <div className="flex items-center rounded-xl bg-surface-subtle p-1 border border-border-default">
                            {[2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setMinWords(num)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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
                </div>

                <div className="text-xs text-text-muted">
                    تم العثور على <strong className="text-primary font-bold">{sequences.length}</strong> مقطعاً نورانياً متصلاً في المصحف الشريف بطول {minWords} كلمات فأكثر.
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sequences.map((seq, idx) => (
                    <div
                        key={idx}
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
                            className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-right font-quran-text text-xl sm:text-2xl text-emerald-900 dark:text-emerald-300 leading-loose"
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
        </div>
    );
};
