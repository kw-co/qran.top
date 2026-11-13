import React, { useState, useMemo } from 'react';
import type { SurahData } from '../types';
import { QURAN_INDEX } from '../quranIndex';
import {
    HIJAZI_MANUSCRIPTS,
    HIJAZI_INSCRIPTIONS,
    HIJAZI_LETTERS_ATLAS,
    HIJAZI_STUDY_CONCLUSIONS,
    transformToHijaziScript,
    detectAbuAlAswadDot,
    type HijaziManuscriptInfo,
    type HijaziLetterStudy
} from '../data/hijaziStudyData';
import {
    layoutHijaziWord,
    buildHijaziGlyph,
    type HijaziPositionalForm
} from '../utils/hijaziGlyphEngine';
import { AncientManuscriptIcon, BookOpenIcon, SearchIcon, SparklesIcon, ArrowRightIcon } from './icons';

interface HijaziCalligraphyViewProps {
    simpleCleanData: SurahData[];
    uthmaniData?: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
}

type ActiveTab = 'simulator' | 'atlas' | 'manuscripts' | 'study';

/**
 * Renders the authentic historical verse separator SVG for Berlin gr.2" Zu 5956 and the 5 manuscripts in the study.
 */
const HistoricalVerseSeparator: React.FC<{
    styleType: 'berlin_5956' | 'none' | 'berlin' | 'birmingham' | 'tubingen' | 'london' | 'paris';
    ayahNumber: number;
}> = ({ styleType, ayahNumber }) => {
    if (styleType === 'none') {
        return <span className="inline-block mx-2" />;
    }

    const isTithing = ayahNumber % 10 === 0;
    const isQuintile = !isTithing && ayahNumber % 5 === 0;

    if (styleType === 'berlin_5956') {
        // Staatsbibliothek zu Berlin: gr.2" Zu 5956:
        // Cluster of 4 fine parallel diagonal hatch strokes (////) at 45 degrees on the baseline,
        // and at the end of a surah or every 10 verses, the square 8-pointed gold/red star vignette!
        return (
            <span
                className="inline-flex items-center justify-center mx-2 align-middle select-none gap-1.5"
                title={`فاصلة مخطوطة برلين (gr.2" Zu 5956) - آية ${ayahNumber}`}
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <g stroke="#2a1c11" strokeWidth="1.5" strokeLinecap="butt">
                        <line x1="6" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="19" x2="15" y2="13" />
                        <line x1="12" y1="20" x2="18" y2="14" />
                        <line x1="15" y1="21" x2="20" y2="16" />
                    </g>
                </svg>
                {isTithing && (
                    <svg className="w-7 h-7" viewBox="0 0 32 32">
                        <rect x="3" y="3" width="26" height="26" fill="#c29b38" stroke="#2a1c11" strokeWidth="1.4" />
                        <polygon points="16,4 20,12 28,16 20,20 16,28 12,20 4,16 12,12" fill="#991b1b" stroke="#f3e7cf" strokeWidth="1" />
                        <circle cx="16" cy="16" r="4" fill="#d97706" />
                    </svg>
                )}
            </span>
        );
    }

    if (styleType === 'berlin') {
        return (
            <span
                className="inline-flex items-center justify-center mx-2 align-middle select-none"
                title={`فاصلة مصحف برلين - آية ${ayahNumber}${isTithing ? ' (علامة تعشير)' : isQuintile ? ' (علامة تخميس)' : ''}`}
            >
                <svg className="w-6 h-6" viewBox="0 0 28 28">
                    <circle
                        cx="14"
                        cy="14"
                        r={isTithing ? '11' : '8.5'}
                        fill="none"
                        stroke="#b91c1c"
                        strokeWidth="1.8"
                        strokeDasharray="2.2 2.4"
                    />
                    <circle
                        cx="14"
                        cy="14"
                        r={isTithing ? '5' : '3.5'}
                        fill={isTithing ? '#b91c1c' : '#29221c'}
                    />
                </svg>
            </span>
        );
    }

    if (styleType === 'birmingham') {
        return (
            <span
                className="inline-flex items-center justify-center mx-2 align-middle select-none"
                title={`فاصلة مصحف برمنجهام - آية ${ayahNumber}`}
            >
                <svg className="w-6 h-6" viewBox="0 0 28 28">
                    {isTithing ? (
                        <>
                            <circle cx="14" cy="14" r="9.5" fill="none" stroke="#991b1b" strokeWidth="1.6" />
                            <circle cx="14" cy="14" r="5" fill="none" stroke="#29221c" strokeWidth="1.4" />
                            <circle cx="14" cy="14" r="2" fill="#991b1b" />
                        </>
                    ) : (
                        <>
                            <circle cx="14" cy="6" r="1.8" fill="#451a03" />
                            <circle cx="21" cy="11" r="1.8" fill="#451a03" />
                            <circle cx="18.5" cy="19.5" r="1.8" fill="#451a03" />
                            <circle cx="9.5" cy="19.5" r="1.8" fill="#451a03" />
                            <circle cx="7" cy="11" r="1.8" fill="#451a03" />
                            <circle cx="14" cy="13.5" r="1.5" fill="#991b1b" />
                        </>
                    )}
                </svg>
            </span>
        );
    }

    if (styleType === 'tubingen') {
        return (
            <span
                className="inline-flex items-center justify-center mx-2 align-middle select-none"
                title={`فاصلة مصحف توبنجن - آية ${ayahNumber}`}
            >
                <svg className="w-6 h-6" viewBox="0 0 28 28">
                    {isTithing ? (
                        <>
                            <circle cx="14" cy="14" r="9.5" fill="#991b1b" fillOpacity="0.18" stroke="#991b1b" strokeWidth="1.8" />
                            <circle cx="14" cy="14" r="4.5" fill="none" stroke="#29221c" strokeWidth="1.5" />
                        </>
                    ) : (
                        <g stroke="#29221c" strokeWidth="2.1" strokeLinecap="square">
                            <line x1="8" y1="8" x2="20" y2="6.5" />
                            <line x1="8" y1="14" x2="20" y2="12.5" />
                            <line x1="8" y1="20" x2="20" y2="18.5" />
                        </g>
                    )}
                </svg>
            </span>
        );
    }

    if (styleType === 'london') {
        return (
            <span
                className="inline-flex items-center justify-center mx-2 align-middle select-none"
                title={`فاصلة مصحف المكتبة البريطانية بلندن - آية ${ayahNumber}`}
            >
                <svg className="w-6 h-6" viewBox="0 0 28 28">
                    <g stroke={isTithing ? '#991b1b' : '#29221c'} strokeWidth="2" strokeLinecap="square">
                        <line x1="6" y1="8" x2="12" y2="7" />
                        <line x1="6" y1="14" x2="12" y2="13" />
                        <line x1="6" y1="20" x2="12" y2="19" />
                        <line x1="16" y1="8" x2="22" y2="7" />
                        <line x1="16" y1="14" x2="22" y2="13" />
                        <line x1="16" y1="20" x2="22" y2="19" />
                    </g>
                </svg>
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center justify-center mx-2 align-middle select-none"
            title={`فاصلة مصحف باريس الوطني - آية ${ayahNumber}`}
        >
            <svg className="w-6 h-6" viewBox="0 0 28 28">
                <g fill={isTithing ? '#991b1b' : '#29221c'}>
                    <circle cx="9" cy="8" r="1.8" />
                    <circle cx="17" cy="8" r="1.8" />
                    <circle cx="9" cy="14" r="1.8" />
                    <circle cx="17" cy="14" r="1.8" />
                    <circle cx="9" cy="20" r="1.8" />
                    <circle cx="17" cy="20" r="1.8" />
                </g>
            </svg>
        </span>
    );
};

/**
 * Ornamental Surah Divider Band inspired directly by Staatsbibliothek zu Berlin: gr.2" Zu 5956
 */
const Berlin5956SurahBand: React.FC = () => (
    <div className="w-full my-3 select-none" title="شريط الفصل الزخرفي بين السور في مخطوطة برلين gr.2 Zu 5956">
        <svg className="w-full h-7" viewBox="0 0 600 28" preserveAspectRatio="none">
            {/* Outer dotted borders */}
            <line x1="25" y1="3" x2="575" y2="3" stroke="#3b2616" strokeWidth="1.5" strokeDasharray="2 3" />
            <line x1="25" y1="25" x2="575" y2="25" stroke="#3b2616" strokeWidth="1.5" strokeDasharray="2 3" />
            {/* Main polychrome band */}
            <rect x="25" y="6" width="550" height="16" fill="#b48a2e" stroke="#23170e" strokeWidth="1.5" />
            {/* Repeating geometric lozenges */}
            {Array.from({ length: 22 }).map((_, idx) => {
                const x = 30 + idx * 24.5;
                return (
                    <g key={idx}>
                        <polygon
                            points={`${x},14 ${x + 11},7 ${x + 22},14 ${x + 11},21`}
                            fill={idx % 2 === 0 ? '#8c2d19' : '#2d5a3c'}
                            stroke="#f3e7cf"
                            strokeWidth="1"
                        />
                        <circle cx={x + 11} cy={14} r="2" fill="#f3e7cf" />
                    </g>
                );
            })}
            {/* Left & Right Finials */}
            <path d="M 25 14 L 6 6 L 12 14 L 6 22 Z" fill="#8c2d19" stroke="#23170e" strokeWidth="1.2" />
            <path d="M 575 14 L 594 6 L 588 14 L 594 22 Z" fill="#8c2d19" stroke="#23170e" strokeWidth="1.2" />
        </svg>
    </div>
);

export const HijaziCalligraphyView: React.FC<HijaziCalligraphyViewProps> = ({
    simpleCleanData,
    uthmaniData
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

    // Simulator State — Default to Berlin gr.2" Zu 5956 (Surah Taha 20:1-5 + Maryam 19:97-98)
    const [selectedManuscriptId, setSelectedManuscriptId] = useState<string>('berlin_5956');
    const [selectedSurahNum, setSelectedSurahNum] = useState<number>(20);
    const [ayahStart, setAyahStart] = useState<number>(1);
    const [ayahEnd, setAyahEnd] = useState<number>(5);
    const [customText, setCustomText] = useState<string>('');

    // Hijazi / Early Mashq-Kufic Script Controls (Tuned to match Berlin gr.2" Zu 5956)
    const [stripDots, setStripDots] = useState<boolean>(false); // Berlin 5956 has fine diagonal i'jam strokes on selected letters
    const [showAbuAlAswadRedDots, setShowAbuAlAswadRedDots] = useState<boolean>(false);
    const [showNasrIjamStrokes, setShowNasrIjamStrokes] = useState<boolean>(true);
    const [omitMedialAlif, setOmitMedialAlif] = useState<boolean>(true);
    const [showWordCaption, setShowWordCaption] = useState<boolean>(false);
    const [slantAngle, setSlantAngle] = useState<number>(1); // Berlin 5956 has tall upright vertical stems
    const [penThickness, setPenThickness] = useState<number>(6.2); // Broad horizontal reed nib
    const [separatorStyle, setSeparatorStyle] = useState<'berlin_5956' | 'none' | 'berlin' | 'birmingham' | 'tubingen' | 'london' | 'paris'>('berlin_5956');
    const [rightPanelMode, setRightPanelMode] = useState<'berlin_image' | 'uthmani_compare' | 'none'>('berlin_image');
    const [highlightedLetterGroup, setHighlightedLetterGroup] = useState<string[] | null>(null);

    // Atlas State
    const [selectedLetterId, setSelectedLetterId] = useState<string>('kaf');
    const [letterSearchQuery, setLetterSearchQuery] = useState<string>('');

    const currentSurahMeta = useMemo(
        () => QURAN_INDEX.find(s => s.number === selectedSurahNum) || QURAN_INDEX[0],
        [selectedSurahNum]
    );

    const handleSelectBerlin5956Folio = () => {
        setSelectedManuscriptId('berlin_5956');
        setSelectedSurahNum(20);
        setAyahStart(1);
        setAyahEnd(5);
        setSlantAngle(1);
        setPenThickness(6.2);
        setSeparatorStyle('berlin_5956');
        setOmitMedialAlif(true);
        setShowNasrIjamStrokes(true);
        setStripDots(false);
        setShowAbuAlAswadRedDots(false);
        setRightPanelMode('berlin_image');
        setCustomText('');
    };

    const handleSelectPresetManuscript = (ms: HijaziManuscriptInfo) => {
        setSelectedManuscriptId(ms.id);
        setSelectedSurahNum(ms.sampleSurahNumber);
        setAyahStart(ms.sampleAyahStart);
        setAyahEnd(Math.min(ms.sampleAyahStart + 4, ms.sampleAyahEnd));
        setSeparatorStyle(ms.verseSeparatorStyle);
        setCustomText('');
    };

    const handleSurahChange = (newSurahNum: number) => {
        const meta = QURAN_INDEX.find(s => s.number === newSurahNum);
        const maxAyahs = meta?.numberOfAyahs || 7;
        setSelectedSurahNum(newSurahNum);
        setAyahStart(1);
        setAyahEnd(Math.min(5, maxAyahs));
        setSelectedManuscriptId('custom');
    };

    // Extract verses for simulator (When Berlin 5956 preset is active on Surah 20:1-5, also prepend Maryam 19:97-98 just like the physical folio!)
    const simulatorFolioData = useMemo(() => {
        const sourceData = (uthmaniData && uthmaniData.length > 0) ? uthmaniData : simpleCleanData;

        // Helper to build verse objects for a surah slice
        const extractSlice = (surahNum: number, startAyah: number, endAyah: number) => {
            const cleanSurah = simpleCleanData.find(s => s.number === surahNum);
            const uthmaniSurah = sourceData.find(s => s.number === surahNum);
            if (!cleanSurah) return [];

            const start = Math.max(1, Math.min(startAyah, cleanSurah.ayahs.length));
            const end = Math.max(start, Math.min(endAyah, cleanSurah.ayahs.length));

            return cleanSurah.ayahs.slice(start - 1, end).map((cleanAyah, idx) => {
                const uthmaniAyah = uthmaniSurah?.ayahs[start - 1 + idx] || cleanAyah;
                let baseText = cleanAyah.text;
                // Strip automatic Bismillah prefix on Surah 20 Ayah 1 if we render Bismillah as its own line (as on the Berlin 5956 folio)
                if (surahNum === 20 && cleanAyah.numberInSurah === 1) {
                    baseText = baseText.replace(/^بسم الله الرحمن الرحيم\s*/, '');
                }
                const hijaziOrthographyText = transformToHijaziScript(baseText, {
                    stripDiacritics: true,
                    stripDots: false,
                    omitMedialAlif
                });
                const dotlessDisplayText = transformToHijaziScript(baseText, {
                    stripDiacritics: true,
                    stripDots: stripDots && !showNasrIjamStrokes,
                    omitMedialAlif
                });

                return {
                    surahNum,
                    numberInSurah: cleanAyah.numberInSurah,
                    cleanText: baseText,
                    uthmaniText: uthmaniAyah.text,
                    hijaziOrthographyText,
                    hijaziText: dotlessDisplayText
                };
            });
        };

        const isBerlin5956ExactMatch =
            selectedManuscriptId === 'berlin_5956' &&
            selectedSurahNum === 20 &&
            ayahStart === 1 &&
            ayahEnd === 5;

        const maryamTailVerses = isBerlin5956ExactMatch ? extractSlice(19, 97, 98) : [];
        const mainVerses = extractSlice(selectedSurahNum, ayahStart, ayahEnd);

        return {
            isBerlin5956ExactMatch,
            maryamTailVerses,
            mainVerses
        };
    }, [simpleCleanData, uthmaniData, selectedManuscriptId, selectedSurahNum, ayahStart, ayahEnd, stripDots, showNasrIjamStrokes, omitMedialAlif]);

    // Letter frequency across the Quran for the selected letter family in the Atlas
    const letterStatsMap = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!simpleCleanData || simpleCleanData.length === 0) return counts;

        for (const group of HIJAZI_LETTERS_ATLAS) {
            counts[group.id] = 0;
        }

        for (const surah of simpleCleanData) {
            for (const ayah of surah.ayahs) {
                const text = ayah.text;
                if (text.includes('لا') || text.includes('لأ') || text.includes('لإ') || text.includes('لآ')) {
                    counts['lam-alif'] = (counts['lam-alif'] || 0) + (text.match(/لا|لأ|لإ|لآ/g)?.length || 0);
                }
                for (const ch of text) {
                    for (const group of HIJAZI_LETTERS_ATLAS) {
                        if (group.id !== 'lam-alif' && group.letters.includes(ch)) {
                            counts[group.id] = (counts[group.id] || 0) + 1;
                        }
                    }
                }
            }
        }
        return counts;
    }, [simpleCleanData]);

    const selectedLetterStudy: HijaziLetterStudy = useMemo(
        () => HIJAZI_LETTERS_ATLAS.find(l => l.id === selectedLetterId) || HIJAZI_LETTERS_ATLAS[0],
        [selectedLetterId]
    );

    const filteredAtlasLetters = useMemo(() => {
        if (!letterSearchQuery.trim()) return HIJAZI_LETTERS_ATLAS;
        const q = letterSearchQuery.trim();
        return HIJAZI_LETTERS_ATLAS.filter(
            item =>
                item.titleAr.includes(q) ||
                item.summaryAr.includes(q) ||
                item.letters.some(l => l.includes(q))
        );
    }, [letterSearchQuery]);

    /**
     * Renders every word using the Staatsbibliothek zu Berlin: gr.2" Zu 5956 Vector Calligraphic Engine.
     */
    const renderHijaziWords = (hijaziOrthographyText: string, vocalizedReference: string) => {
        const hijaziWords = hijaziOrthographyText.split(' ').filter(Boolean);
        const vocalizedWords = vocalizedReference.split(' ').filter(Boolean);

        return hijaziWords.map((word, wIdx) => {
            const vocalizedWord = vocalizedWords[wIdx] || word;
            const redDotPos = showAbuAlAswadRedDots ? detectAbuAlAswadDot(vocalizedWord) : null;

            const hasHighlightedLetter =
                highlightedLetterGroup &&
                highlightedLetterGroup.some(l => vocalizedWord.includes(l) || word.includes(l));

            const glyphLayout = layoutHijaziWord(word, slantAngle);
            const showIjam = !stripDots || showNasrIjamStrokes;
            const svgWidthPx = Math.max(26, Math.round(glyphLayout.totalWidth * 0.72));

            return (
                <span
                    key={wIdx}
                    title={`الكلمة: ${vocalizedWord}`}
                    className={`relative inline-flex flex-col items-center align-middle mx-1 sm:mx-2 my-1 px-0.5 rounded-lg transition-colors select-none ${
                        hasHighlightedLetter
                            ? 'bg-amber-500/35 ring-2 ring-amber-800/70'
                            : 'hover:bg-amber-900/10'
                    }`}
                >
                    <svg
                        width={svgWidthPx}
                        height={68}
                        viewBox={`0 0 ${glyphLayout.totalWidth} 98`}
                        className="overflow-visible"
                    >
                        {/* Solid filled heads (Meem, Waw, Lam-Alif base) */}
                        {glyphLayout.fillPathD && (
                            <path
                                d={glyphLayout.fillPathD}
                                fill="#1b120c"
                            />
                        )}

                        {/* Main Broad-Nib Calligraphic Skeleton (Berlin gr.2" Zu 5956 geometry) */}
                        <path
                            d={glyphLayout.mainPathD}
                            fill="none"
                            stroke="#1b120c"
                            strokeWidth={penThickness}
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            strokeMiterlimit="3.5"
                        />

                        {/* Fine Slanted I'jam Strokes (شرطات الإعجام المائلة الرفيعة كما في مخطوطة برلين 5956) */}
                        {showIjam && glyphLayout.ijamPathD && (
                            <path
                                d={glyphLayout.ijamPathD}
                                fill="none"
                                stroke="#2b1d12"
                                strokeWidth={1.65}
                                strokeLinecap="butt"
                            />
                        )}

                        {/* Abu al-Aswad al-Du'ali Red Ink Vowel Dots */}
                        {redDotPos === 'above' && (
                            <circle
                                cx={Math.min(22, glyphLayout.totalWidth * 0.35)}
                                cy={20}
                                r={4.2}
                                fill="#b91c1c"
                            />
                        )}
                        {redDotPos === 'below' && (
                            <circle
                                cx={Math.min(22, glyphLayout.totalWidth * 0.35)}
                                cy={84}
                                r={4.2}
                                fill="#b91c1c"
                            />
                        )}
                        {redDotPos === 'before' && (
                            <circle
                                cx={8}
                                cy={54}
                                r={4.2}
                                fill="#b91c1c"
                            />
                        )}
                    </svg>

                    {showWordCaption && (
                        <span className="text-[11px] font-bold text-amber-950/80 -mt-1.5 font-sans">
                            {vocalizedWord}
                        </span>
                    )}
                </span>
            );
        });
    };

    return (
        <div className="container mx-auto px-3 sm:px-6 py-5 max-w-6xl text-text-primary space-y-6 animate-fade-in" dir="rtl">
            {/* Top Breadcrumb & Header */}
            <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <a
                        href="#/structure"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-colors"
                    >
                        <ArrowRightIcon className="w-4 h-4" />
                        <span>العودة إلى بنية المصحف الشريف</span>
                    </a>
                    <div className="flex items-center gap-2">
                        <a
                            href="/assets/aistudio/DOC-20261024-WA0016_938f7b38.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                        >
                            <AncientManuscriptIcon className="w-4 h-4" />
                            <span>فتح الدراسة المرفقة (PDF - 28 صفحة)</span>
                        </a>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-300 shadow-xs">
                        <AncientManuscriptIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                            <span>مبني على مخطوطة برلين (Staatsbibliothek zu Berlin: gr.2&quot; Zu 5956)</span>
                            <span>•</span>
                            <span>ودراسة أ.د. عدنان الشريف وأ.د. ياسر عبد السلام</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary">
                            مختبر الخط الحجازي والمشق الكوفي المبكر
                        </h1>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-4xl">
                            تم تصميم محرك الخط ليحاكي بدقة ورقة مخطوطة مكتبة برلين الوطنية (<strong>gr.2&quot; Zu 5956</strong> — أواخر سورة مريم وأوائل سورة طه): القاعدة الأفقية العريضة، الكاف والدال المبسوطة الحادة، الياء الراجعة الممتدة كخط أفقي مستقيم تحت الكلمة، والنون القائمة المنكسرة تحت السطر.
                        </p>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-4 border-t border-border-subtle">
                    <button
                        type="button"
                        onClick={() => setActiveTab('simulator')}
                        className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'simulator'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span>محاكي مخطوطة برلين 5956</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('atlas')}
                        className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'atlas'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                    >
                        <span className="font-mono text-sm font-bold">جدول 1</span>
                        <span>أطلس الحروف الـ 28</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('manuscripts')}
                        className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'manuscripts'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                    >
                        <AncientManuscriptIcon className="w-4 h-4" />
                        <span>المصاحف الـ 5 والنقوش</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('study')}
                        className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'study'
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-subtle hover:bg-surface-hover text-text-secondary border border-border-default'
                        }`}
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>الدراسة الكاملة والنتائج</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: LIVE HIJAZI / BERLIN 5956 CALLIGRAPHY SIMULATOR */}
            {activeTab === 'simulator' && (
                <div className="space-y-6">
                    {/* Quick Manuscript Presets */}
                    <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span>اختر المخطوطة المرجعية للمحاكاة الفورية:</span>
                            </h2>
                            {highlightedLetterGroup && (
                                <button
                                    type="button"
                                    onClick={() => setHighlightedLetterGroup(null)}
                                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                                >
                                    إلغاء تمييز الحرف ({highlightedLetterGroup.join('، ')}) ✕
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                            {/* Featured Preset: Staatsbibliothek zu Berlin: gr.2" Zu 5956 */}
                            <button
                                type="button"
                                onClick={handleSelectBerlin5956Folio}
                                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                                    selectedManuscriptId === 'berlin_5956'
                                        ? 'bg-amber-500/20 border-amber-600 text-text-primary shadow-xs ring-2 ring-amber-500/50'
                                        : 'bg-surface-subtle hover:bg-surface-hover border-border-default text-text-secondary'
                                }`}
                            >
                                <div>
                                    <div className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 mb-0.5">
                                        ★ المرجع المختار (Zu 5956)
                                    </div>
                                    <div className="text-xs sm:text-sm font-black text-text-primary line-clamp-1">
                                        برلين gr.2&quot; Zu 5956
                                    </div>
                                </div>
                                <div className="text-[11px] font-medium text-text-muted mt-2 pt-1.5 border-t border-border-subtle flex items-center justify-between">
                                    <span>مريم 97 + طه 1-5</span>
                                    <span className="font-mono font-bold text-primary">مطابق للصورة</span>
                                </div>
                            </button>

                            {HIJAZI_MANUSCRIPTS.map((ms) => {
                                const isSelected = selectedManuscriptId === ms.id;
                                return (
                                    <button
                                        key={ms.id}
                                        type="button"
                                        onClick={() => handleSelectPresetManuscript(ms)}
                                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-amber-500/15 border-amber-500 text-text-primary shadow-xs ring-1 ring-amber-500/40'
                                                : 'bg-surface-subtle hover:bg-surface-hover border-border-default text-text-secondary'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
                                                {ms.figureRef}
                                            </div>
                                            <div className="text-sm font-bold text-text-primary line-clamp-1">
                                                {ms.nameAr}
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-medium text-text-muted mt-2 pt-1.5 border-t border-border-subtle flex items-center justify-between">
                                            <span>{ms.sampleSurahName}</span>
                                            <span className="font-mono font-bold text-primary">
                                                {ms.sampleAyahStart}:{ms.sampleAyahEnd}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Surah & Ayah Range Selector + Layer Controls */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-border-subtle">
                            {/* Surah & Range */}
                            <div className="lg:col-span-5 grid grid-cols-3 gap-2">
                                <div className="col-span-3 sm:col-span-1">
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">السورة</label>
                                    <select
                                        value={selectedSurahNum}
                                        onChange={(e) => handleSurahChange(Number(e.target.value))}
                                        className="w-full h-9 px-2 rounded-xl bg-surface-subtle border border-border-default text-xs sm:text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {QURAN_INDEX.map((s) => (
                                            <option key={s.number} value={s.number}>
                                                {s.number}. {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">من الآية</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={currentSurahMeta.numberOfAyahs}
                                        value={ayahStart}
                                        onChange={(e) => {
                                            const v = Math.max(1, Math.min(Number(e.target.value) || 1, currentSurahMeta.numberOfAyahs));
                                            setAyahStart(v);
                                            if (ayahEnd < v) setAyahEnd(Math.min(v + 4, currentSurahMeta.numberOfAyahs));
                                        }}
                                        className="w-full h-9 px-2.5 rounded-xl bg-surface-subtle border border-border-default text-xs sm:text-sm font-mono font-bold text-text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">إلى الآية</label>
                                    <input
                                        type="number"
                                        min={ayahStart}
                                        max={currentSurahMeta.numberOfAyahs}
                                        value={ayahEnd}
                                        onChange={(e) => {
                                            const v = Math.max(ayahStart, Math.min(Number(e.target.value) || ayahStart, currentSurahMeta.numberOfAyahs));
                                            setAyahEnd(v);
                                        }}
                                        className="w-full h-9 px-2.5 rounded-xl bg-surface-subtle border border-border-default text-xs sm:text-sm font-mono font-bold text-text-primary"
                                    />
                                </div>
                            </div>

                            {/* Historical Layers Toggles */}
                            <div className="lg:col-span-7 flex flex-wrap items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextStrip = !stripDots;
                                        setStripDots(nextStrip);
                                        setShowNasrIjamStrokes(!nextStrip);
                                    }}
                                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        !stripDots
                                            ? 'bg-amber-700 text-white border-amber-700'
                                            : 'bg-surface-subtle text-text-secondary border-border-default hover:bg-surface-hover'
                                    }`}
                                >
                                    {!stripDots ? '✓ شرطات الإعجام المائلة' : 'تجريد النقط كلياً'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowAbuAlAswadRedDots(!showAbuAlAswadRedDots)}
                                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        showAbuAlAswadRedDots
                                            ? 'bg-red-700 text-white border-red-700'
                                            : 'bg-surface-subtle text-text-secondary border-border-default hover:bg-surface-hover'
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-300"></span>
                                    <span>نقط أبي الأسود الأحمر</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setOmitMedialAlif(!omitMedialAlif)}
                                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        omitMedialAlif
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-surface-subtle text-text-secondary border-border-default hover:bg-surface-hover'
                                    }`}
                                >
                                    {omitMedialAlif ? '✓ حذف الألف الوسطية (السموت)' : 'إبقاء الألف الإملائية'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowWordCaption(!showWordCaption)}
                                    className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        showWordCaption
                                            ? 'bg-amber-900 text-white border-amber-900'
                                            : 'bg-surface-subtle text-text-secondary border-border-default hover:bg-surface-hover'
                                    }`}
                                >
                                    {showWordCaption ? '✓ قراءة الكلمات تحت السطر' : 'إظهار قراءة الكلمات'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setRightPanelMode(
                                            rightPanelMode === 'berlin_image'
                                                ? 'uthmani_compare'
                                                : rightPanelMode === 'uthmani_compare'
                                                ? 'none'
                                                : 'berlin_image'
                                        )
                                    }
                                    className="h-9 px-3 rounded-xl text-xs font-bold border bg-emerald-700 text-white border-emerald-700 transition-all cursor-pointer"
                                >
                                    {rightPanelMode === 'berlin_image'
                                        ? '✓ مقارنة بصورة مخطوطة برلين 5956'
                                        : rightPanelMode === 'uthmani_compare'
                                        ? '✓ مقارنة بالرسم المعاصر'
                                        : 'عرض الرق بمفرده'}
                                </button>
                            </div>
                        </div>

                        {/* Slant Angle, Pen Thickness & Separator Style */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle text-xs">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-text-secondary">زاوية القوائم (الألف واللام):</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={14}
                                        value={slantAngle}
                                        onChange={(e) => setSlantAngle(Number(e.target.value))}
                                        className="w-24 accent-amber-600 cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{slantAngle}°</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-text-secondary">عَرض القلم الأفقي (سُمك السطر):</span>
                                    <input
                                        type="range"
                                        min={3.8}
                                        max={7.6}
                                        step={0.2}
                                        value={penThickness}
                                        onChange={(e) => setPenThickness(Number(e.target.value))}
                                        className="w-24 accent-amber-600 cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{penThickness}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-bold text-text-secondary">نمط فاصلة الآيات:</span>
                                <select
                                    value={separatorStyle}
                                    onChange={(e) => setSeparatorStyle(e.target.value as any)}
                                    className="h-8 px-2.5 rounded-lg bg-surface-subtle border border-border-default text-xs font-bold text-text-primary"
                                >
                                    <option value="berlin_5956">برلين Zu 5956 (4 شرطات مائلة ////)</option>
                                    <option value="berlin">برلين 4313 (دائرة منقوطة)</option>
                                    <option value="birmingham">مصحف برمنجهام (دائرة خماسية)</option>
                                    <option value="tubingen">مصحف توبنجن (3 شرطات متوازية)</option>
                                    <option value="london">مصحف لندن (6 شرطات مزدوجة)</option>
                                    <option value="paris">مصحف باريس (6 نقاط دائرية)</option>
                                    <option value="none">بلا فواصل</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Custom Text Input Option */}
                    <div className="bg-surface border border-border-default rounded-2xl p-4">
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">
                            اكتب أي آية أو جملة لرسمها فوراً بخط مخطوطة برلين (Staatsbibliothek zu Berlin: gr.2&quot; Zu 5956):
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                placeholder="اكتب هنا أي آية أو جملة (مثل: طه ما انزلنا عليك القران لتشقى) أو اتركه فارغاً لعرض اللوحة..."
                                className="flex-1 h-10 px-3.5 rounded-xl bg-surface-subtle border border-border-default text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            {customText && (
                                <button
                                    type="button"
                                    onClick={() => setCustomText('')}
                                    className="px-3 h-10 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-bold text-text-secondary cursor-pointer"
                                >
                                    مسح
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Historical Parchment Leaf Display + Reference Folio Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className={rightPanelMode !== 'none' ? 'lg:col-span-7' : 'lg:col-span-12'}>
                            <div
                                className="rounded-3xl p-5 sm:p-7 border-2 border-amber-900/40 shadow-md relative overflow-hidden"
                                style={{
                                    backgroundColor: '#dcc08e',
                                    backgroundImage:
                                        'radial-gradient(circle at 30% 25%, rgba(236,214,172,0.92) 0%, rgba(218,188,136,0.95) 60%, rgba(196,162,106,0.98) 100%)'
                                }}
                            >
                                {/* Parchment Top Metadata Strip */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-amber-950/25 text-amber-950/85 text-xs font-bold">
                                    <span>
                                        {simulatorFolioData.isBerlin5956ExactMatch
                                            ? 'محاكاة ورقة برلين (gr.2" Zu 5956) • أواخر سورة مريم (97-98) وفاتحة سورة طه (1-5)'
                                            : `محاكاة الرقّ • ${currentSurahMeta.name} (${ayahStart} - ${ayahEnd})`}
                                    </span>
                                    <span>سُمك القلم: {penThickness}</span>
                                </div>

                                {/* Rendered Calligraphic Lines */}
                                <div className="text-right select-none space-y-1">
                                    {customText.trim() ? (
                                        <div className="flex flex-wrap items-center justify-start">
                                            {renderHijaziWords(
                                                transformToHijaziScript(customText, {
                                                    stripDiacritics: true,
                                                    stripDots: false,
                                                    omitMedialAlif
                                                }),
                                                customText
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Top Section: End of Surah Maryam (19:97-98) when Berlin 5956 folio preset is active */}
                                            {simulatorFolioData.maryamTailVerses.length > 0 && (
                                                <>
                                                    <div className="flex flex-wrap items-center justify-start">
                                                        {simulatorFolioData.maryamTailVerses.map((v) => (
                                                            <React.Fragment key={`m-${v.numberInSurah}`}>
                                                                {renderHijaziWords(v.hijaziOrthographyText, v.uthmaniText)}
                                                                <HistoricalVerseSeparator
                                                                    styleType={separatorStyle}
                                                                    ayahNumber={v.numberInSurah === 98 ? 10 : v.numberInSurah}
                                                                />
                                                            </React.Fragment>
                                                        ))}
                                                    </div>

                                                    {/* Polychrome Ornamental Band between Surah Maryam and Surah Taha */}
                                                    <Berlin5956SurahBand />

                                                    {/* Bismillah Line for Surah Taha */}
                                                    <div className="flex flex-wrap items-center justify-start">
                                                        {renderHijaziWords('بسم الله الرحمن الرحيم', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')}
                                                    </div>
                                                </>
                                            )}

                                            {/* Main Surah Verses */}
                                            <div className="flex flex-wrap items-center justify-start">
                                                {simulatorFolioData.mainVerses.map((v) => (
                                                    <React.Fragment key={`v-${v.numberInSurah}`}>
                                                        {renderHijaziWords(v.hijaziOrthographyText, v.uthmaniText)}
                                                        <HistoricalVerseSeparator
                                                            styleType={separatorStyle}
                                                            ayahNumber={v.numberInSurah}
                                                        />
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Legend at bottom of Parchment */}
                                <div className="mt-5 pt-3 border-t border-amber-950/25 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-amber-950/80">
                                    <span>
                                        السمات: الكاف والدال الزاوية المبسوطة • الياء الراجعة الطويلة تحت الكلمة • النون القائمة • ذيل الألف لليمين
                                    </span>
                                    <span>Staatsbibliothek zu Berlin: gr.2&quot; Zu 5956</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Either Original Berlin gr.2" Zu 5956 Image OR Uthmani Verse Comparison */}
                        {rightPanelMode === 'berlin_image' && (
                            <div className="lg:col-span-5 bg-surface border border-border-default rounded-3xl p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                    <div>
                                        <h3 className="text-sm font-bold text-text-primary">
                                            الأصل المخطوط: Staatsbibliothek zu Berlin (gr.2&quot; Zu 5956)
                                        </h3>
                                        <p className="text-[11px] text-text-muted">
                                            أواخر سورة مريم (97–98) وفاتحة سورة طه (1–5) — قارن شكل كل حرف مباشرةً
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRightPanelMode('uthmani_compare')}
                                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        عرض النص المعاصر ⟵
                                    </button>
                                </div>

                                <div className="rounded-2xl overflow-hidden border border-amber-900/30 shadow-xs">
                                    <img
                                        src="/assets/aistudio/image_aee0b371.png"
                                        alt="Staatsbibliothek zu Berlin: gr.2 Zu 5956"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>

                                <div className="p-3 rounded-2xl bg-surface-subtle border border-border-default text-xs space-y-1.5 leading-relaxed text-text-secondary">
                                    <div className="font-bold text-text-primary">مفاتيح القراءة السريعة لأسطر المخطوطة:</div>
                                    <div><strong className="text-amber-700 dark:text-amber-400">الأسطر 1–4 (أعلى الشريط):</strong> «وتنذر به قوما لدا • وكم أهلكنا قبلهم من قرن هل تحس منهم من أحد أو تسمع لهم ركزا»</div>
                                    <div><strong className="text-amber-700 dark:text-amber-400">الأسطر 5–11 (أسفل الشريط):</strong> «بسم الله الرحمن الرحيم • طه ما أنزلنا عليك القرآن لتشقى • إلا تذكرة لمن يخشى • تنزيلا ممن خلق الأرض والسموت العلى • الرحمن على العرش استوى»</div>
                                </div>
                            </div>
                        )}

                        {rightPanelMode === 'uthmani_compare' && (
                            <div className="lg:col-span-5 bg-surface border border-border-default rounded-3xl p-5 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
                                    <h3 className="text-sm font-bold text-text-primary">
                                        المقابلة مع الرسم العثماني المعاصر
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setRightPanelMode('berlin_image')}
                                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                                    >
                                        عرض صورة المخطوطة ⟵
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[540px] overflow-y-auto pl-1">
                                    {simulatorFolioData.mainVerses.map((v) => (
                                        <div
                                            key={v.numberInSurah}
                                            className="p-3 rounded-2xl bg-surface-subtle border border-border-default space-y-2"
                                        >
                                            <div className="flex items-center justify-between text-xs text-text-muted">
                                                <span className="font-bold text-primary">الآية {v.numberInSurah}</span>
                                                <span className="font-mono text-[11px]">رسم برلين 5956 ⟷ الرسم المعاصر</span>
                                            </div>
                                            <div
                                                className="p-2 rounded-xl border border-amber-900/20 flex flex-wrap items-center"
                                                style={{ backgroundColor: '#dcc08e' }}
                                            >
                                                {renderHijaziWords(v.hijaziOrthographyText, v.uthmaniText)}
                                            </div>
                                            <div className="text-sm sm:text-base text-text-secondary font-serif pt-1 border-t border-border-subtle">
                                                {v.uthmaniText}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: COMPLETE 28-LETTER PALEOGRAPHIC ATLAS (TABLE 1, PAGES 22-26) */}
            {activeTab === 'atlas' && (
                <div className="space-y-6">
                    {/* Search & Filter Strip */}
                    <div className="bg-surface border border-border-default rounded-2xl p-4 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                                    جدول رقم (1): أطلس أشكال الحروف الأبجدية في المصاحف المبكرة ومخطوطة برلين 5956
                                </h2>
                                <p className="text-xs text-text-secondary">
                                    استعراض هندسي للأوضاع الأربعة لكل حرف (مفرد، مبتدأ، متوسط، منتهٍ) ومقارنته بالمصاحف الخمسة والنقوش المؤرخة.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={letterSearchQuery}
                                    onChange={(e) => setLetterSearchQuery(e.target.value)}
                                    placeholder="ابحث عن حرف (مثل: الألف، الكاف، الياء...)"
                                    className="w-full h-9 pr-8 pl-3 rounded-xl bg-surface-subtle border border-border-default text-xs font-medium text-text-primary"
                                />
                                <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {/* Letter Family Selector Grid */}
                        <div className="flex flex-wrap gap-2">
                            {filteredAtlasLetters.map((item) => {
                                const isSelected = item.id === selectedLetterId;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedLetterId(item.id)}
                                        className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                            isSelected
                                                ? 'bg-primary text-white border-primary shadow-xs'
                                                : 'bg-surface-subtle hover:bg-surface-hover text-text-primary border-border-default'
                                        }`}
                                    >
                                        <span className="text-base font-serif">{item.letters.join(' / ')}</span>
                                        <span className="text-[11px] opacity-80">
                                            ({(letterStatsMap[item.id] || 0).toLocaleString('ar-EG')})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Letter Detailed Paleographic Card */}
                    <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-7 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-border-subtle">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                                    <span>{selectedLetterStudy.titleEn}</span>
                                    <span>•</span>
                                    <span>
                                        التكرار في القرآن الكريم:{' '}
                                        {(letterStatsMap[selectedLetterStudy.id] || 0).toLocaleString('ar-EG')} موضعاً
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-text-primary">
                                    {selectedLetterStudy.titleAr}
                                </h3>
                                <p className="text-xs sm:text-sm text-text-secondary max-w-3xl leading-relaxed">
                                    {selectedLetterStudy.summaryAr}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setHighlightedLetterGroup(selectedLetterStudy.letters);
                                    setActiveTab('simulator');
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                            >
                                تمييز هذا الحرف في محاكي الرق ⟵
                            </button>
                        </div>

                        {/* 4 Positional States with Visual Berlin 5956 Specimens */}
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary mb-3">
                                أولاً: الأوضاع الأربعة للحرف في الكلمة على طراز مخطوطة برلين (gr.2&quot; Zu 5956):
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(
                                    [
                                        {
                                            form: 'isolated' as HijaziPositionalForm,
                                            title: '1. الحالة المفردة (Isolated State)',
                                            desc: selectedLetterStudy.isolatedFormDesc
                                        },
                                        {
                                            form: 'initial' as HijaziPositionalForm,
                                            title: '2. الحالة المبتدأة المتصلة (Initial Connected)',
                                            desc: selectedLetterStudy.initialFormDesc
                                        },
                                        {
                                            form: 'medial' as HijaziPositionalForm,
                                            title: '3. الحالة المتوسطة المتصلة (Medial Connected)',
                                            desc: selectedLetterStudy.medialFormDesc
                                        },
                                        {
                                            form: 'final' as HijaziPositionalForm,
                                            title: '4. الحالة المنتهية المتصلة (Final Connected)',
                                            desc: selectedLetterStudy.finalFormDesc
                                        }
                                    ]
                                ).map((st) => {
                                    const sampleChar = selectedLetterStudy.letters[0] || 'ا';
                                    const glyph = buildHijaziGlyph(sampleChar, st.form, 76, 1);
                                    return (
                                        <div
                                            key={st.form}
                                            className="p-4 rounded-2xl bg-surface-subtle border border-border-default flex items-center gap-4"
                                        >
                                            <div
                                                className="w-24 h-20 rounded-xl flex-shrink-0 flex items-center justify-center border border-amber-900/30"
                                                style={{ backgroundColor: '#dcc08e' }}
                                            >
                                                <svg className="w-20 h-16 overflow-visible" viewBox="0 0 100 100">
                                                    <line
                                                        x1="8"
                                                        y1="64"
                                                        x2="92"
                                                        y2="64"
                                                        stroke="#78350f"
                                                        strokeWidth="1"
                                                        strokeDasharray="3 3"
                                                        opacity="0.4"
                                                    />
                                                    {glyph.fillD && <path d={glyph.fillD} fill="#1b120c" />}
                                                    <path
                                                        d={glyph.pathD}
                                                        fill="none"
                                                        stroke="#1b120c"
                                                        strokeWidth="6"
                                                        strokeLinecap="butt"
                                                        strokeLinejoin="miter"
                                                        strokeMiterlimit="3.5"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-primary">{st.title}</div>
                                                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                                    {st.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 6-Column Comparative Vector Specimens (Matching Table 1 on pages 22-26) */}
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary mb-3">
                                ثانياً: مقارنة رسم الحرف عبر المصاحف الخمسة والنقوش الحجرية المؤرخة (جدول الدراسة رقم 1 - ص 22-26):
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {[
                                    { key: 'berlin', label: 'مصحف برلين', sub: 'المكتبة الوطنية', path: selectedLetterStudy.svgPaths.berlin },
                                    { key: 'paris', label: 'مصحف باريس', sub: 'المكتبة الوطنية', path: selectedLetterStudy.svgPaths.paris },
                                    { key: 'london', label: 'مصحف لندن', sub: 'المكتبة البريطانية', path: selectedLetterStudy.svgPaths.london },
                                    { key: 'birmingham', label: 'مصحف برمنجهام', sub: 'جامعة برمنجهام', path: selectedLetterStudy.svgPaths.birmingham },
                                    { key: 'tubingen', label: 'مصحف توبنجن', sub: 'جامعة توبنجن', path: selectedLetterStudy.svgPaths.tubingen },
                                    { key: 'inscription', label: 'النقوش المؤرخة', sub: selectedLetterStudy.inscriptionsReferenced.slice(0, 2).join('، '), path: selectedLetterStudy.svgPaths.inscription }
                                ].map((col) => (
                                    <div
                                        key={col.key}
                                        className="rounded-2xl border border-border-default bg-surface-subtle p-3 flex flex-col items-center text-center"
                                    >
                                        <span className="text-xs font-bold text-text-primary">{col.label}</span>
                                        <span className="text-[10px] text-text-muted mb-2 line-clamp-1">{col.sub}</span>
                                        <div
                                            className="w-full h-24 rounded-xl flex items-center justify-center border border-amber-900/20"
                                            style={{ backgroundColor: '#dcc08e' }}
                                        >
                                            <svg className="w-20 h-20" viewBox="0 0 100 100">
                                                <line
                                                    x1="10"
                                                    y1="64"
                                                    x2="90"
                                                    y2="64"
                                                    stroke="#78350f"
                                                    strokeWidth="1"
                                                    strokeDasharray="3 3"
                                                    opacity="0.4"
                                                />
                                                <path
                                                    d={col.path}
                                                    fill="none"
                                                    stroke="#1b120c"
                                                    strokeWidth="6"
                                                    strokeLinecap="butt"
                                                    strokeLinejoin="miter"
                                                    strokeMiterlimit="3.5"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Distinguishing Paleographic Criterion & Referenced Inscriptions */}
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                    السمة الفارقة في التأريخ والمقارنة الخطية:
                                </div>
                                <div className="text-xs sm:text-sm font-semibold text-text-primary">
                                    {selectedLetterStudy.distinguishingFeature}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                                {selectedLetterStudy.inscriptionsReferenced.map((ins, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2.5 py-1 rounded-lg bg-surface text-xs font-bold text-text-secondary border border-border-default"
                                    >
                                        نقش {ins}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: THE 5 EARLY MANUSCRIPTS & 4 BENCHMARK DATED INSCRIPTIONS */}
            {activeTab === 'manuscripts' && (
                <div className="space-y-8">
                    {/* 5 Quranic Manuscripts */}
                    <div className="space-y-4">
                        <h2 className="text-lg sm:text-xl font-black text-text-primary">
                            أولاً: نسخ المصاحف المخطوطة المعتمدة في الدراسة
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {HIJAZI_MANUSCRIPTS.map((ms) => (
                                <div
                                    key={ms.id}
                                    className="bg-surface border border-border-default rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xs"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                                    {ms.figureRef} • {ms.dating}
                                                </span>
                                                <h3 className="text-lg font-bold text-text-primary mt-0.5">
                                                    {ms.nameAr}
                                                </h3>
                                                <p className="text-xs text-text-muted">{ms.location}</p>
                                            </div>
                                            <HistoricalVerseSeparator
                                                styleType={ms.verseSeparatorStyle}
                                                ayahNumber={10}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-surface-subtle p-3 rounded-2xl border border-border-subtle">
                                            <div>
                                                <span className="text-text-muted block">عدد الأوراق / الصفحات:</span>
                                                <strong className="text-text-primary">{ms.foliaCount}</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-muted block">مسطرة الأسطر والكلمات:</span>
                                                <strong className="text-text-primary">
                                                    {ms.linesPerPage} ({ms.wordsPerLine})
                                                </strong>
                                            </div>
                                            {ms.c14Dating && (
                                                <div className="col-span-2 pt-1 border-t border-border-subtle">
                                                    <span className="text-text-muted">نتيجة الكربون المشع (C14): </span>
                                                    <strong className="text-emerald-700 dark:text-emerald-400">
                                                        {ms.c14Dating}
                                                    </strong>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            <strong className="text-text-primary">الخط والمداد: </strong>
                                            {ms.inkAndScript}
                                        </p>

                                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                            <strong className="text-text-primary">فواصل الآيات والتعشير: </strong>
                                            {ms.separatorDescription}
                                        </p>

                                        <ul className="space-y-1 text-xs text-text-secondary list-disc list-inside bg-surface-subtle/60 p-3 rounded-xl">
                                            {ms.keyFindings.map((finding, idx) => (
                                                <li key={idx}>{finding}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSelectPresetManuscript(ms);
                                                setActiveTab('simulator');
                                            }}
                                            className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 transition-opacity cursor-pointer"
                                        >
                                            محاكاة شاهد المخطوطة ({ms.sampleSurahName} {ms.sampleAyahStart}-{ms.sampleAyahEnd})
                                        </button>
                                        <a
                                            href={ms.corpusUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-border-default text-xs font-bold text-text-secondary"
                                        >
                                            المخطوطة في Corpus Coranicum ↗
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4 Dated Inscriptions & Papyri */}
                    <div className="space-y-4">
                        <h2 className="text-lg sm:text-xl font-black text-text-primary">
                            ثانياً: الشواهد الأثرية المؤرخة (البرديات والنقوش الصخرية 22 هـ - 120 هـ)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {HIJAZI_INSCRIPTIONS.map((ins) => (
                                <div
                                    key={ins.id}
                                    className="bg-surface border border-border-default rounded-3xl p-5 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold">
                                            مؤرخ سنة {ins.dateAh} ({ins.dateAd})
                                        </span>
                                        <span className="text-xs font-bold text-text-muted">{ins.figureRef}</span>
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-text-primary">{ins.nameAr}</h3>
                                    <p className="text-xs text-text-muted">
                                        {ins.material} • {ins.location}
                                    </p>
                                    <div
                                        className="p-3.5 rounded-2xl border border-amber-900/25 flex flex-wrap items-center"
                                        style={{ backgroundColor: '#dcc08e' }}
                                    >
                                        {renderHijaziWords(ins.transcription, ins.transcription)}
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-text-primary font-serif">
                                        قراءة النقش: «{ins.transcription}»
                                    </div>
                                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                        <strong className="text-text-primary">الدلالة العلمية والخطية: </strong>
                                        {ins.significance}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: FULL ACADEMIC STUDY, CONCLUSIONS & ORIGINAL PDF VIEWER */}
            {activeTab === 'study' && (
                <div className="space-y-6">
                    {/* Study Conclusions */}
                    <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-7 space-y-5">
                        <div className="space-y-1">
                            <h2 className="text-lg sm:text-xl font-black text-text-primary">
                                الخلاصة والنتائج العلمية والتوصيات الموثقة في الدراسة
                            </h2>
                            <p className="text-xs sm:text-sm text-text-secondary">
                                نتائج دراسة «مخطوطات المصاحف المبكرة من خلال معطيات الخط الحجازي والشواهد الأثرية» (مجلة الاتحاد العام للآثاريين العرب، المجلد 5، العدد 1، ص 1-28).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {HIJAZI_STUDY_CONCLUSIONS.map((c) => (
                                <div
                                    key={c.number}
                                    className="p-4 rounded-2xl bg-surface-subtle border border-border-default space-y-1.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                            {c.number}
                                        </span>
                                        <h3 className="text-sm sm:text-base font-bold text-text-primary">{c.title}</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pr-8">
                                        {c.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Embedded PDF Viewer of the Original Attached Study */}
                    <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-text-primary">
                                    النسخة الكاملة للبحث الأصلي واللوحات المصورة والجداول (28 صفحة)
                                </h3>
                                <p className="text-xs text-text-secondary">
                                    يشمل الصور الأصلية للمصاحف الخمسة (ص 19-20)، النقوش المؤرخة (ص 20-21)، وجدول أشكال الحروف التفصيلي (ص 22-26).
                                </p>
                            </div>
                            <a
                                href="/assets/aistudio/DOC-20261024-WA0016_938f7b38.pdf"
                                download="Hijazi_Calligraphy_Early_Quran_Manuscripts.pdf"
                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 transition-opacity"
                            >
                                تحميل ملف الدراسة (PDF) ⬇
                            </a>
                        </div>

                        <div className="w-full h-[680px] rounded-2xl overflow-hidden border border-border-default bg-surface-subtle">
                            <iframe
                                src="/assets/aistudio/DOC-20261024-WA0016_938f7b38.pdf"
                                title="دراسة مخطوطات المصاحف المبكرة من خلال معطيات الخط الحجازي والشواهد الأثرية"
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HijaziCalligraphyView;
