import React, { useState, useMemo, useEffect } from 'react';
import type { Ayah, SurahData } from '../types';
import { SearchIcon, ChevronLeftIcon } from './icons';
import { normalizeArabicText, stripDiacritics } from '../utils/text';
import MuqattaatBinaryMatrix from './search/MuqattaatBinaryMatrix';
import HawameemBinaryMatrix from './search/HawameemBinaryMatrix';

interface FingerprintToolViewProps {
    simpleCleanData: SurahData[];
    onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number, exactMatchOverride?: boolean) => void;
}

const FingerprintToolView: React.FC<FingerprintToolViewProps> = ({ simpleCleanData, onNewSearch }) => {
    const [inputValue, setInputValue] = useState('');
    const [query, setQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            setQuery(trimmed);
        }
    };

    const results = useMemo(() => {
        if (!query) return [];
        
        const qWord = normalizeArabicText(stripDiacritics(query));
        const regex = new RegExp(`(^|\\s)${qWord}(\\s|$)`);
        
        const matches: Ayah[] = [];
        for (const surah of simpleCleanData) {
            for (const ayah of surah.ayahs) {
                if (ayah.text) {
                    const normAyah = normalizeArabicText(stripDiacritics(ayah.text));
                    if (regex.test(normAyah)) {
                        matches.push({
                            ...ayah,
                            surah: {
                                number: surah.number,
                                name: surah.name,
                                englishName: surah.englishName,
                                englishNameTranslation: surah.englishNameTranslation,
                                numberOfAyahs: surah.ayahs.length,
                                revelationType: surah.revelationType,
                            }
                        });
                    }
                }
            }
        }
        return matches;
    }, [query, simpleCleanData]);

    const hasAnyMuqattaatInResults = useMemo(() => {
        if (!results || results.length === 0) return false;
        const targetSurahs = new Set([2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38, 40, 41, 42, 43, 44, 45, 46, 50, 68]);
        return results.some(a => a.surah && targetSurahs.has(a.surah.number));
    }, [results]);

    const hasAnyHawameemInResults = useMemo(() => {
        if (!results || results.length === 0) return false;
        const targetSurahs = new Set([40, 41, 42, 43, 44, 45, 46]);
        return results.some(a => a.surah && targetSurahs.has(a.surah.number));
    }, [results]);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl min-h-[70vh] flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <a href="#/structure" className="p-2 rounded-lg bg-surface border border-border-default hover:bg-surface-subtle text-text-secondary hover:text-text-primary transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 rtl:rotate-180" />
                </a>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">البصمة النورانية للمفردات</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        استخرج البصمة النورانية (29-bit) والمحولات العددية الخاصة بأي مفردة في القرآن الكريم
                    </p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative flex items-center">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-text-muted">
                    <SearchIcon className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="اكتب كلمة واحدة لاستخراج بصمتها النورانية..."
                    className="w-full pl-4 pr-12 py-4 bg-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-text-primary text-lg"
                    dir="rtl"
                />
                <button
                    type="submit"
                    className="absolute left-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                    استخراج البصمة
                </button>
            </form>

            {query && results.length === 0 && (
                <div className="p-8 text-center bg-surface border border-border-default rounded-xl text-text-secondary">
                    لم يتم العثور على نتائج للكلمة "{query}" في القرآن الكريم بالمطابقة التامة.
                </div>
            )}

            {query && results.length > 0 && (
                <div className="space-y-6">
                    {hasAnyMuqattaatInResults ? (
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-primary">المصفوفة النورانية (29 سورة مقطعة)</h2>
                            <MuqattaatBinaryMatrix
                                query={query}
                                baseResults={results}
                                displayedResults={results}
                                simpleCleanData={simpleCleanData}
                                onNewSearch={onNewSearch}
                            />
                        </div>
                    ) : (
                        <div className="p-4 text-center bg-surface border border-border-default rounded-xl text-text-secondary">
                            الكلمة "{query}" لم ترد في أي من السور الـ 29 المبدوءة بالحروف المقطعة. بصمتها النورانية هي أصفار.
                        </div>
                    )}

                    {hasAnyHawameemInResults && (
                        <div className="space-y-2 pt-6 border-t border-border-default">
                            <h2 className="text-lg font-bold text-amber-600">بصمة الحواميم (7 سور)</h2>
                            <HawameemBinaryMatrix
                                query={query}
                                baseResults={results}
                                displayedResults={results}
                                simpleCleanData={simpleCleanData}
                                onNewSearch={onNewSearch}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FingerprintToolView;
