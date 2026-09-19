import React, { useMemo, useState } from 'react';
import type { Ayah, SurahData, QuranEdition, FontSize, FontStyleType } from '../types';
import { SparklesIcon, BookmarkIcon, CopyIcon, CheckIcon, PlayIcon, SpinnerIcon, SpeakerWaveIcon } from './icons';
import { normalizeArabicText } from '../utils/text';
import * as textUtils from '../utils/text';
import { getQuranTextStyle } from '../utils/font';
import { useSettingsContext } from '../contexts/SettingsContext';
import { renderWordWithHaMeem } from '../utils/haMeemHighlight';
import { renderWordWithNoorani } from '../utils/nooraniHighlight';
import { playSmartWordAudio } from '../services/quranApiV4';
import WordActionPopover from './WordActionPopover';
import WordMorphologyModal from './WordMorphologyModal';

interface SearchResultItemProps {
  ayah: Ayah;
  queryWords: string[];
  currentQuery?: string;
  onNewSearch: (word: string, sourceEdition?: string, position?: { surah: number, ayah: number, wordIndex: number }, isRootSearch?: boolean, targetSurahNumber?: number) => void;
  displayEdition: QuranEdition;
  displayEditionData: SurahData[];
  searchEdition: string;
  fontSize: FontSize;
  fontStyle: FontStyleType;
  searchType: 'text' | 'number';
  isCurrentlyPlaying: boolean;
  isPlaybackLoading?: boolean;
  itemRef: React.RefObject<HTMLLIElement>;
  pulsingWordIndex: number;
  resultIndex: number;
  simpleAyahText: string;
  onUthmaniWordClick?: (event: React.MouseEvent<HTMLButtonElement>, resultIndex: number, simpleAyahText: string) => void;
  onSaveAyah?: (ayah: Ayah) => void;
  onCopyAyah?: (ayah: Ayah) => void;
  onPlayAyah?: (resultIndex: number) => void;
  copiedAyah?: number | null;
  imlaeiSimpleData?: SurahData[];
}

const SURAH_MUQATTAAT_MAP: Record<number, string> = {
    2: "الم",
    3: "الم",
    7: "المص",
    10: "الر",
    11: "الر",
    12: "الر",
    13: "المر",
    14: "الر",
    15: "الر",
    19: "كهيعص",
    20: "طه",
    26: "طسم",
    27: "طس",
    28: "طسم",
    29: "الم",
    30: "الم",
    31: "الم",
    32: "الم",
    36: "يس",
    38: "ص",
    40: "حم",
    41: "حم",
    42: "حم عسق",
    43: "حم",
    44: "حم",
    45: "حم",
    46: "حم",
    50: "ق",
    68: "ن"
};

const getSurahMuqattaat = (surahNumber?: number): string | null => {
    if (!surahNumber) return null;
    return SURAH_MUQATTAAT_MAP[surahNumber] || null;
};

    const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
    ayah, queryWords, currentQuery, onNewSearch, displayEdition, displayEditionData, searchEdition,
    fontSize, fontStyle, searchType, isCurrentlyPlaying, isPlaybackLoading, itemRef, pulsingWordIndex,
    resultIndex, simpleAyahText, onUthmaniWordClick, onSaveAyah, onCopyAyah, onPlayAyah, copiedAyah,
    imlaeiSimpleData
}) => {
    const { wordClickBehavior, enableWordAudio, enableMorphology, showMuqattaatInSearch, highlightHaMeem, highlightNoorani } = useSettingsContext();

    const [activeWordPopover, setActiveWordPopover] = useState<{
        word: string;
        surahNumber: number;
        surahName?: string;
        ayahNumberInSurah: number;
        wordIndex: number;
        triggerElement: HTMLElement;
    } | null>(null);

    const [activeMorphologyModal, setActiveMorphologyModal] = useState<{
        word: string;
        surahNumber: number;
        surahName?: string;
        ayahNumberInSurah: number;
    } | null>(null);

    // Search results are ALWAYS displayed in standard Imlaei with tashkeel (الرسم الإملائي المشكل)
    const displayAyah = useMemo(() => {
        if (imlaeiSimpleData && imlaeiSimpleData.length > 0 && ayah.surah) {
            const imlaeiSurah = imlaeiSimpleData.find(s => s.number === ayah.surah!.number);
            const imlaeiAyahData = imlaeiSurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
            if (imlaeiAyahData && imlaeiSurah) {
                return { 
                    ...imlaeiAyahData,
                    surah: {
                        number: imlaeiSurah.number,
                        name: imlaeiSurah.name,
                        englishName: imlaeiSurah.englishName,
                        englishNameTranslation: imlaeiSurah.englishNameTranslation,
                        revelationType: imlaeiSurah.revelationType,
                    }
                };
            }
        }
        if (displayEditionData && displayEditionData.length > 0 && ayah.surah) {
            const displaySurah = displayEditionData.find(s => s.number === ayah.surah!.number);
            const displayAyahData = displaySurah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah);
            if (displayAyahData && displaySurah) {
                return { 
                    ...displayAyahData,
                    surah: {
                        number: displaySurah.number,
                        name: displaySurah.name,
                        englishName: displaySurah.englishName,
                        englishNameTranslation: displaySurah.englishNameTranslation,
                        revelationType: displaySurah.revelationType,
                    }
                };
            }
        }
        return ayah;
    }, [ayah, imlaeiSimpleData, displayEditionData]);

    // Always use Uthmani font for search results
    const { className: quranTextClass } = getQuranTextStyle('uthmani', fontSize);

    const playWordAudio = (surahNum: number, ayahNum: number, wordIdxOneBased: number, clickedWordText?: string) => {
        playSmartWordAudio(surahNum, ayahNum, wordIdxOneBased, clickedWordText);
    };

    const handleWordClick = (e: React.MouseEvent<HTMLButtonElement>, rawWord: string, wordIndex: number) => {
        e.stopPropagation();
        const cleanWord = String(rawWord)
            .replace(/<[^>]*>/g, '')
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
            .trim();

        if (!displayAyah.surah) return;

        // Search results are always in Imlaei mode
        const isImlaei = true;
        const shouldSearchDirectly = 
            wordClickBehavior === 'direct_search' || 
            (wordClickBehavior === 'auto' && isImlaei);

        if (shouldSearchDirectly) {
            if (enableWordAudio) {
                playWordAudio(displayAyah.surah.number, displayAyah.numberInSurah, wordIndex + 1, cleanWord);
            }
            onNewSearch(cleanWord, 'quran-simple-clean', { surah: displayAyah.surah.number, ayah: displayAyah.numberInSurah, wordIndex });
        } else {
            setActiveWordPopover({
                word: cleanWord,
                surahNumber: displayAyah.surah.number,
                surahName: displayAyah.surah.name,
                ayahNumberInSurah: displayAyah.numberInSurah,
                wordIndex,
                triggerElement: e.currentTarget
            });
        }
    };

    const renderAyahWithHighlight = () => {
        if (displayEdition.format === 'audio') {
            return <span className="text-sm text-text-muted">[مصدر صوتي، لا يتوفر عرض نصي هنا]</span>
        }

        if (!displayAyah.text) {
            return '';
        }
        
        let textToRender = String(displayAyah.text || '');

        const uthmaniRawWords = textToRender.split(' ');
        const alignmentInfo = textUtils.getUthmaniToImlaeiMap(uthmaniRawWords, simpleAyahText);
        const isImlaeiSearch = searchEdition === 'quran-simple-clean';

        const wordElements = uthmaniRawWords.map((word, index) => {
            const isPulsing = index === pulsingWordIndex;

            // Use mapped click info to search the exact original Imlaei word, improving search reliability
            const handleUthmaniClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                if (searchType === 'number' || !alignmentInfo[index] || alignmentInfo[index].imlaeiIndex === -1) {
                    handleWordClick(e, word, index);
                } else {
                    handleWordClick(e, alignmentInfo[index].imlaeiWord, alignmentInfo[index].imlaeiIndex);
                }
            };

            if (searchType === 'number') { // No highlighting for number search
                 return (
                    <button 
                        type="button" 
                        key={index} 
                        onClick={handleUthmaniClick} 
                        className="word-trigger bg-transparent border-none p-0 font-inherit cursor-pointer hover:bg-primary/10 rounded-md px-1 transition-colors"
                        aria-label={`إظهار خيارات البحث لكلمة: ${word}`}
                    >
                        <span className={isPulsing ? 'animate-highlight-pulse rounded-sm' : ''}>
                            {highlightNoorani 
                                ? renderWordWithNoorani(word, true) 
                                : renderWordWithHaMeem(word, highlightHaMeem)}
                        </span>
                    </button>
                 );
            }

            let isMatch = false;
            if (searchType === 'text') {
                if (isImlaeiSearch) {
                    const iWord = alignmentInfo[index]?.imlaeiWord;
                    if (iWord) {
                        const iNorm = normalizeArabicText(iWord);
                        isMatch = queryWords.some(q => iNorm.includes(normalizeArabicText(q)));
                    }
                } else {
                    const uNorm = normalizeArabicText(word);
                    isMatch = queryWords.some(q => uNorm.includes(normalizeArabicText(q)));
                }
            }

            return (
                <button
                    type="button"
                    key={index}
                    onClick={handleUthmaniClick}
                    className="word-trigger bg-transparent border-none p-0 font-inherit cursor-pointer hover:bg-primary/10 rounded-md px-1 transition-colors"
                    aria-label={`إظهار خيارات البحث لكلمة: ${word}`}
                >
                    {isMatch ? (
                        <mark className={`bg-amber-400/30 dark:bg-amber-400/25 text-text-primary font-bold px-1 py-0.5 rounded-md ring-1 ring-amber-500/30 dark:ring-amber-400/30 ${isPulsing ? 'animate-highlight-pulse' : ''}`}>{word}</mark>
                    ) : (
                        <span className={isPulsing ? 'animate-highlight-pulse rounded-sm' : ''}>
                            {highlightNoorani 
                                ? renderWordWithNoorani(word, true) 
                                : renderWordWithHaMeem(word, highlightHaMeem)}
                        </span>
                    )}
                </button>
            );
        });

        return wordElements.reduce((prev, curr, index) => <>{prev}{index > 0 ? ' ' : ''}{curr}</>, <></>);
    };
    
    return (
        <li
            ref={itemRef}
            className={`p-3 sm:p-4 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg w-full max-w-full overflow-hidden break-words ${isCurrentlyPlaying ? 'bg-yellow-300/60 dark:bg-yellow-400/30 ring-2 ring-yellow-500' : 'bg-surface-subtle'}`}
        >
            <div className="flex justify-between items-center mb-2 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                     <a
                        href={`#/surah/${displayAyah.surah?.number}?ayah=${displayAyah.numberInSurah}`}
                        className="text-primary-text font-bold cursor-pointer rounded-md p-1 -m-1 hover:bg-surface-hover transition-colors"
                        aria-label={`الانتقال إلى ${displayAyah.surah?.name} الآية ${displayAyah.numberInSurah}`}
                    >
                        <span className="font-quran-title">{displayAyah.surah?.name} - الآية {displayAyah.numberInSurah}</span>
                    </a>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {(() => {
                        const letters = getSurahMuqattaat(displayAyah.surah?.number);
                        if (!letters || !showMuqattaatInSearch) return null;
                        return (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    if (displayAyah.surah) {
                                        const safeQuery = currentQuery ? encodeURIComponent(currentQuery) : '';
                                        window.location.hash = `#/search/${safeQuery}?search_edition=${searchEdition || 'quran-simple-clean'}&ts=${displayAyah.surah.number}`;
                                    }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 active:scale-95 dark:bg-primary/10 dark:text-primary dark:border-primary/25 transition-all cursor-pointer select-none"
                            >
                                <SparklesIcon className="w-2.5 h-2.5 flex-shrink-0 text-primary/70" />
                                <span className="font-semibold">{letters}</span>
                            </button>
                        );
                    })()}
                    {onPlayAyah && (
                        <button
                            onClick={() => onPlayAyah(resultIndex)}
                            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
                                isCurrentlyPlaying
                                    ? 'bg-primary text-white border-primary shadow-xs'
                                    : 'text-text-secondary hover:text-primary hover:bg-surface-hover border-border-default'
                            }`}
                            aria-label="تشغيل صوت الآية"
                            title="استماع لهذه الآية"
                        >
                            {isCurrentlyPlaying && isPlaybackLoading ? (
                                <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                            ) : isCurrentlyPlaying ? (
                                <SpeakerWaveIcon className="w-4 h-4 text-white animate-pulse" />
                            ) : (
                                <PlayIcon className="w-4 h-4 text-primary" />
                            )}
                            <span className="hidden sm:inline">استماع</span>
                        </button>
                    )}
                    {onCopyAyah && (
                        <button
                            onClick={() => onCopyAyah(displayAyah)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover border border-border-default transition-all flex items-center gap-1 text-xs font-semibold"
                            aria-label="نسخ الآية"
                            title="نسخ الآية مع المرجع"
                        >
                            {copiedAyah === displayAyah.number ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-primary" />
                            )}
                            <span className="hidden sm:inline">نسخ</span>
                        </button>
                    )}
                    {onSaveAyah && (
                        <button
                            onClick={() => onSaveAyah(displayAyah)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover border border-border-default transition-all flex items-center gap-1 text-xs font-semibold"
                            aria-label="حفظ الآية في الدفتر"
                            title="حفظ الآية في الدفتر"
                        >
                            <BookmarkIcon className="w-4 h-4 text-primary" />
                            <span className="hidden sm:inline">حفظ</span>
                        </button>
                    )}
                </div>
            </div>
            <p
                dir="rtl"
                aria-label={`نص الآية ${displayAyah.numberInSurah} من سورة ${displayAyah.surah?.name}`}
                className={`${quranTextClass} text-text-primary text-justify`}
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
            >
               {renderAyahWithHighlight()}
            </p>

            {activeWordPopover && (
                <WordActionPopover
                    word={activeWordPopover.word}
                    surahNumber={activeWordPopover.surahNumber}
                    surahName={activeWordPopover.surahName}
                    ayahNumberInSurah={activeWordPopover.ayahNumberInSurah}
                    wordIndex={activeWordPopover.wordIndex}
                    triggerElement={activeWordPopover.triggerElement}
                    enableWordAudio={enableWordAudio}
                    enableMorphology={enableMorphology}
                    onClose={() => setActiveWordPopover(null)}
                    onSearchWord={(cleanWord) => {
                        if (displayAyah.surah) {
                            onNewSearch(cleanWord, 'quran-simple-clean', {
                                surah: displayAyah.surah.number,
                                ayah: displayAyah.numberInSurah,
                                wordIndex: activeWordPopover.wordIndex
                            });
                        }
                    }}
                    onPlayAudio={() => {
                        playWordAudio(
                            activeWordPopover.surahNumber,
                            activeWordPopover.ayahNumberInSurah,
                            activeWordPopover.wordIndex + 1,
                            activeWordPopover.word
                        );
                    }}
                    onOpenMorphology={() => {
                        setActiveMorphologyModal({
                            word: activeWordPopover.word,
                            surahNumber: activeWordPopover.surahNumber,
                            surahName: activeWordPopover.surahName,
                            ayahNumberInSurah: activeWordPopover.ayahNumberInSurah
                        });
                        setActiveWordPopover(null);
                    }}
                />
            )}

            {activeMorphologyModal && (
                <WordMorphologyModal
                    word={activeMorphologyModal.word}
                    surahNumber={activeMorphologyModal.surahNumber}
                    surahName={activeMorphologyModal.surahName}
                    ayahNumberInSurah={activeMorphologyModal.ayahNumberInSurah}
                    onClose={() => setActiveMorphologyModal(null)}
                    onSearchWord={(cleanWord) => {
                        if (displayAyah.surah) {
                            onNewSearch(cleanWord, 'quran-simple-clean', {
                                surah: displayAyah.surah.number,
                                ayah: displayAyah.numberInSurah,
                                wordIndex: 0
                            });
                        }
                    }}
                />
            )}
        </li>
    );
};

export default React.memo(SearchResultItem);