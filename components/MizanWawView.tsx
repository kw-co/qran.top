import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SurahData } from '../types';
import { 
    analyzeMizanWaw, 
    generateFullMizanWawReport,
    generateFullMizanWawJson,
    generateAiPromptMizanWaw,
    generateNooraniOnlyReport,
    getLetterWordCounts,
    extractDualPartnersForNoorani,
    compareMizanCandidateLetters,
    generateDualPartnersReport,
    DualPairRankingMode,
    NooraniDualPartnerResult,
    DualExtractionSummary,
    MizanComparisonCandidate,
    ALL_ARABIC_LETTERS,
    POPULAR_BALANCE_LETTERS,
    ARABIC_LETTER_NAMES,
    CANONICAL_14_NOORANI, 
    NOORANI_NAMES,
    NOORANI_SET,
    WawWordMatch, 
    WawEquation, 
    NooraniWawSummary, 
    NooraniPartnerDetail,
    WawVerseOccurrence 
} from '../utils/mizanWawEngine';
import { 
    SearchIcon, 
    SparklesIcon, 
    ChevronLeftIcon, 
    CopyIcon, 
    CheckIcon, 
    ClearIcon,
    BookOpenIcon,
    RefreshIcon,
    DownloadIcon
} from './icons';

interface MizanWawViewProps {
    simpleCleanData?: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
    onStartPlayback?: (ayahs: any[], audioEditionIdentifier: string, startIndex?: number) => void;
    currentlyPlayingAyahGlobalNumber?: number | null;
}

type TabType = 'dual-pairs' | 'noorani' | 'equations' | 'symmetric' | 'simulator';

const DEFAULT_SAMPLE_WORDS: Record<string, string> = {
    'tri-madd': 'هود',
    'و': 'هود',
    'ا': 'قال',
    'ي': 'دين',
    'م': 'شمس',
    'ن': 'عنب',
    'ر': 'قرب',
    'ل': 'ملك',
    'ك': 'حكم',
    'ق': 'بقر',
    'ح': 'سحر',
    'س': 'عسر',
    'ص': 'نصر',
    'ط': 'فطر',
    'ع': 'نعم',
    'ه': 'عهد'
};

export const MizanWawView: React.FC<MizanWawViewProps> = ({
    simpleCleanData = [],
    onSearch,
    onStartPlayback,
    currentlyPlayingAyahGlobalNumber
}) => {
    // 1. Settings & Dynamic Balance Letter State
    const [balanceLetter, setBalanceLetter] = useState<string>('و');
    const [isLetterPickerOpen, setIsLetterPickerOpen] = useState(false);
    const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
    const [includeTanweenAlif, setIncludeTanweenAlif] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('dual-pairs');
    const [dualRankingMode, setDualRankingMode] = useState<DualPairRankingMode>('frequency');
    const [activeDualLetter, setActiveDualLetter] = useState<string>('ه');
    const [selectedNooraniLetter, setSelectedNooraniLetter] = useState<string>('ه');
    
    // Live Scale Selection State
    const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
    
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [relationFilter, setRelationFilter] = useState<'all' | 'noorani-noorani' | 'noorani-dhulmani' | 'symmetric'>('all');

    // Simulator State
    const [simulatorWord, setSimulatorWord] = useState('هود');

    // Verses Modal State
    const [modalData, setModalData] = useState<{
        title: string;
        subtitle: string;
        equation?: string;
        occurrences: WawVerseOccurrence[];
    } | null>(null);

    // Export & AI Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportModalFormat, setExportModalFormat] = useState<'dual' | 'ai' | 'markdown' | 'json' | 'noorani'>('dual');
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    // Copy Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Reset scale index when balance letter changes
    useEffect(() => {
        setActiveWordIndex(0);
    }, [balanceLetter]);

    // Precompute 3-letter word counts for all 28 letters to display badges on buttons
    const letterWordCounts = useMemo(() => {
        return getLetterWordCounts(simpleCleanData, includeTanweenAlif);
    }, [simpleCleanData, includeTanweenAlif]);

    // 2. Perform Quranic Analysis for the Selected Balance Letter
    const analysis = useMemo(() => {
        return analyzeMizanWaw(simpleCleanData, { 
            balanceLetter,
            includeTanweenAlif 
        });
    }, [simpleCleanData, balanceLetter, includeTanweenAlif]);

    const { 
        allWords, 
        allEquations, 
        nooraniSummaries, 
        nooraniSummariesList, 
        symmetricPairs, 
        selfBalancedWords, 
        stats 
    } = analysis;

    // Candidates comparison advisor
    const mizanComparisonList = useMemo(() => {
        return compareMizanCandidateLetters(simpleCleanData, includeTanweenAlif);
    }, [simpleCleanData, includeTanweenAlif]);

    // Dual extraction summary (14 Noorani letters -> 2 counterpart letters each)
    const dualExtractionSummary = useMemo(() => {
        return extractDualPartnersForNoorani(analysis, dualRankingMode);
    }, [analysis, dualRankingMode]);

    // Switch Balance Letter Handler
    const handleSelectBalanceLetter = (char: string) => {
        setBalanceLetter(char);
        setActiveWordIndex(0);
        if (DEFAULT_SAMPLE_WORDS[char]) {
            setSimulatorWord(DEFAULT_SAMPLE_WORDS[char]);
        }
        showToast(`تم التبديل إلى ميزان (${ARABIC_LETTER_NAMES[char] || char}) بنجاح`);
    };

    // The active word on the golden scale
    const currentScaleWord = useMemo(() => {
        if (!allWords || allWords.length === 0) return null;
        const idx = Math.max(0, Math.min(activeWordIndex, allWords.length - 1));
        return allWords[idx];
    }, [allWords, activeWordIndex]);

    // Active Noorani Letter Details
    const activeNooraniSummary: NooraniWawSummary | undefined = useMemo(() => {
        return nooraniSummaries[selectedNooraniLetter] || nooraniSummariesList[0];
    }, [nooraniSummaries, selectedNooraniLetter, nooraniSummariesList]);

    // Filtered Equations for Tab 2
    const filteredEquations = useMemo(() => {
        return allEquations.filter(eq => {
            // Text search
            if (searchQuery.trim()) {
                const q = searchQuery.trim();
                const matchesEq = eq.id.includes(q) || `${eq.leftLetter} = ${eq.rightLetter}`.includes(q);
                const matchesWord = eq.words.some(w => w.word.includes(q));
                if (!matchesEq && !matchesWord) return false;
            }

            // Category filter
            if (relationFilter === 'noorani-noorani') {
                return eq.relationType === 'noorani-noorani';
            }
            if (relationFilter === 'noorani-dhulmani') {
                return eq.relationType === 'noorani-dhulmani' || eq.relationType === 'dhulmani-noorani';
            }
            if (relationFilter === 'symmetric') {
                return eq.isSymmetric;
            }

            return true;
        });
    }, [allEquations, searchQuery, relationFilter]);

    // Simulator Evaluation
    const simulatorResult = useMemo(() => {
        const clean = simulatorWord.replace(/[^\u0621-\u064A\u0671]/g, '').trim();
        if (clean.length !== 3) {
            return {
                isValid: false,
                message: `الرجاء إدخال كلمة مكونة من ثلاثة أحرف بالضبط يكون أوسطها حرف (${analysis.balanceLetterName} - ${balanceLetter}).`,
                canSwitch: false
            };
        }
        if (clean[1] !== balanceLetter) {
            const detectedChar = clean[1];
            const detectedName = ARABIC_LETTER_NAMES[detectedChar] || detectedChar;
            return {
                isValid: false,
                message: `الحرف الأوسط للكلمة هو (${detectedChar} - ${detectedName})، بينما الميزان المحدد حالياً هو (${balanceLetter} - ${analysis.balanceLetterName}).`,
                detectedChar,
                detectedName,
                canSwitch: ALL_ARABIC_LETTERS.includes(detectedChar as any)
            };
        }

        const L1 = clean[0];
        const L2 = clean[2];
        const eqId = `${L1}=${L2}`;
        const eq = allEquations.find(e => e.id === eqId);
        const wordMatch = allWords.find(w => w.word === clean);

        const isL1Noorani = NOORANI_SET.has(L1);
        const isL2Noorani = NOORANI_SET.has(L2);

        return {
            isValid: true,
            clean,
            L1,
            L2,
            equation: `${L1} = ${L2}`,
            isL1Noorani,
            isL2Noorani,
            existsInQuran: !!wordMatch,
            wordMatch,
            equationInQuran: !!eq,
            matchingEquation: eq
        };
    }, [simulatorWord, allEquations, allWords, balanceLetter, analysis.balanceLetterName]);

    // Quick examples for simulator based on current balance letter
    const quickSimulatorExamples = useMemo(() => {
        if (allWords && allWords.length > 0) {
            return allWords.slice(0, 8).map(w => w.word);
        }
        return DEFAULT_SAMPLE_WORDS[balanceLetter] ? [DEFAULT_SAMPLE_WORDS[balanceLetter]] : [];
    }, [allWords, balanceLetter]);

    // Handle Quick Random Word
    const handleRandomScaleWord = () => {
        if (!allWords || allWords.length === 0) return;
        const randIdx = Math.floor(Math.random() * allWords.length);
        setActiveWordIndex(randIdx);
    };

    // Copy Noorani Partner Network Summary
    const handleCopyNooraniReport = () => {
        if (!activeNooraniSummary) return;
        let report = `⚖️ ميزان ${analysis.balanceLetterName} (${analysis.balanceLetter}) في القرآن الكريم\n`;
        report += `الحرف النوراني: ${activeNooraniSummary.nooraniLetter} (${activeNooraniSummary.nooraniName})\n`;
        report += `إجمالي الأحرف المقابلة: ${activeNooraniSummary.totalPartnersCount} حرفاً (${activeNooraniSummary.nooraniPartnersCount} نوراني + ${activeNooraniSummary.dhulmaniPartnersCount} غير نوراني)\n`;
        report += `إجمالي تكرارات الكلمات: ${activeNooraniSummary.totalWordOccurrences} مرة\n\n`;
        report += `الأحرف المقابلة والكلمات الحاضنة للميزان:\n`;

        activeNooraniSummary.partnerLetters.forEach(p => {
            const kind = p.isPartnerNoorani ? 'نوراني' : 'غير نوراني';
            const wordsStr = p.words.map(w => `${w.word} (${w.frequency})`).join('، ');
            report += `- الحرف [${p.partnerLetter}] (${kind}) ⟵ المعادلات: ${p.equations.join(' / ')} | الكلمات: ${wordsStr}\n`;
        });

        navigator.clipboard.writeText(report).then(() => {
            showToast(`تم نسخ تقرير حرف (${activeNooraniSummary.nooraniLetter}) بنجاح`);
        });
    };

    // Master Copy 0: Dual Partners Matrix (14 ⟶ 28)
    const handleCopyDualPartnersReport = () => {
        const text = generateDualPartnersReport(dualExtractionSummary, analysis);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('dual');
            setTimeout(() => setCopiedFormat(null), 3000);
            showToast('تم نسخ جدول الكفتين (14 ⟵ 28) للذكاء الاصطناعي بنجاح! جاهز للصق المباشر');
        });
    };

    // Master Copy 1: Full AI Prompt & Data (جاهز للتلقين المباشر)
    const handleCopyAiPrompt = () => {
        const text = generateAiPromptMizanWaw(analysis, includeTanweenAlif);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('ai');
            setTimeout(() => setCopiedFormat(null), 3000);
            showToast('تم نسخ جميع النتائج مع توجيه الذكاء الاصطناعي بنجاح! جاهز للصق في ChatGPT أو Claude أو Gemini');
        });
    };

    // Master Copy 2: Full Markdown Document
    const handleCopyFullReport = () => {
        const text = generateFullMizanWawReport(analysis, includeTanweenAlif);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('markdown');
            setTimeout(() => setCopiedFormat(null), 3000);
            showToast('تم نسخ التقرير القرآني الشامل (Markdown) بجميع الجداول بنجاح');
        });
    };

    // Master Copy 3: Full Structured JSON
    const handleCopyJsonData = () => {
        const text = generateFullMizanWawJson(analysis, includeTanweenAlif);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('json');
            setTimeout(() => setCopiedFormat(null), 3000);
            showToast('تم نسخ كامل بيانات الميزان كـ JSON منظم بنجاح');
        });
    };

    // Master Copy 4: 14 Noorani Letters Network Only
    const handleCopyNooraniFullNetwork = () => {
        const text = generateNooraniOnlyReport(analysis);
        navigator.clipboard.writeText(text).then(() => {
            setCopiedFormat('noorani');
            setTimeout(() => setCopiedFormat(null), 3000);
            showToast('تم نسخ شبكة الحروف النورانية الـ 14 كاملة بمقابلاتها بنجاح');
        });
    };

    // Download Handler
    const handleDownloadExport = (format: 'dual' | 'ai' | 'markdown' | 'json' | 'noorani') => {
        let content = '';
        let fileName = '';
        let mimeType = 'text/plain;charset=utf-8';

        if (format === 'dual') {
            content = generateDualPartnersReport(dualExtractionSummary, analysis);
            fileName = `mizan-${analysis.balanceLetter}-dual-partners-14x2.txt`;
        } else if (format === 'ai') {
            content = generateAiPromptMizanWaw(analysis, includeTanweenAlif);
            fileName = 'mizan-alwaw-ai-prompt.txt';
        } else if (format === 'markdown') {
            content = generateFullMizanWawReport(analysis, includeTanweenAlif);
            fileName = 'mizan-alwaw-report.md';
        } else if (format === 'json') {
            content = generateFullMizanWawJson(analysis, includeTanweenAlif);
            fileName = 'mizan-alwaw-data.json';
            mimeType = 'application/json;charset=utf-8';
        } else {
            content = generateNooraniOnlyReport(analysis);
            fileName = 'mizan-alwaw-noorani-network.txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`تم تنزيل ملف: ${fileName}`);
    };

    // Preview Content in Modal
    const exportPreviewContent = useMemo(() => {
        if (exportModalFormat === 'dual') {
            return generateDualPartnersReport(dualExtractionSummary, analysis);
        } else if (exportModalFormat === 'ai') {
            return generateAiPromptMizanWaw(analysis, includeTanweenAlif);
        } else if (exportModalFormat === 'markdown') {
            return generateFullMizanWawReport(analysis, includeTanweenAlif);
        } else if (exportModalFormat === 'json') {
            return generateFullMizanWawJson(analysis, includeTanweenAlif);
        } else {
            return generateNooraniOnlyReport(analysis);
        }
    }, [analysis, includeTanweenAlif, exportModalFormat, dualExtractionSummary]);

    return (
        <div className="container mx-auto p-3 sm:p-6 md:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6" dir="rtl">
            {/* 1. Breadcrumb & Navigation with AI Copy Button */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border-default">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <a href="#/structure" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
                        <span>بنية المصحف الشريف</span>
                    </a>
                    <span className="text-border-default">/</span>
                    <span className="text-text-primary font-bold flex items-center gap-1.5">
                        <span>ميزان {analysis.balanceLetterName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold">
                            L1 ⟵ {analysis.balanceLetter} ⟶ L2
                        </span>
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Primary Instant AI Copy Button in Top Bar */}
                    <button
                        type="button"
                        onClick={handleCopyAiPrompt}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                            copiedFormat === 'ai'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-primary text-white hover:bg-primary-hover'
                        }`}
                        title="نسخ جميع النتائج مهيأة للذكاء الاصطناعي بنقرة واحدة"
                    >
                        {copiedFormat === 'ai' ? (
                            <CheckIcon className="w-4 h-4 text-white" />
                        ) : (
                            <CopyIcon className="w-4 h-4" />
                        )}
                        <span>{copiedFormat === 'ai' ? 'تم نسخ جميع النتائج!' : 'نسخ كل النتائج للذكاء الاصطناعي'}</span>
                    </button>

                    {/* Preview / Export Options Button */}
                    <button
                        type="button"
                        onClick={() => setIsExportModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer shadow-xs"
                        title="خيارات التصدير والمعاينة المتقدمة"
                    >
                        <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>معاينة وتصدير</span>
                    </button>

                    <a
                        href="#/structure"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface hover:bg-surface-subtle border border-border-default text-text-secondary hover:text-primary transition-colors cursor-pointer shadow-xs"
                    >
                        <ChevronLeftIcon className="w-4 h-4 transform rotate-180" />
                        <span>فهرس بنية المصحف</span>
                    </a>
                </div>
            </div>

            {/* 2. Hero Presentation Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-surface to-emerald-500/5 border border-amber-500/25 p-5 sm:p-8 shadow-sm">
                <div className="max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
                        <SparklesIcon className="w-4 h-4" />
                        <span>هندسة التناظر الحرفي القرآني</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight font-quran">
                        مِيزَانُ {analysis.balanceLetterName.toUpperCase()} <span className="text-primary font-normal text-xl sm:text-2xl">في الكلمات الثلاثية</span>
                    </h1>

                    <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                        يبحث هذا القسم في جميع مفردات القرآن الكريم الثلاثية التي يتوسطها 
                        <strong className="text-amber-700 dark:text-amber-300 font-bold mx-1">
                            حرف {analysis.balanceLetterName} ({analysis.balanceLetter})
                        </strong>
                        ، واعتبار هذا الحرف نقطة ارتكاز وميزاناً يُعادل بين الحرفين الجانبيين (مثل: <code className="bg-surface px-1.5 py-0.5 rounded border border-border-default font-bold text-primary">{currentScaleWord ? `${currentScaleWord.word} ⟵ ${currentScaleWord.firstLetter} = ${currentScaleWord.secondLetter}` : `L1 ⟵ ${analysis.balanceLetter} ⟶ L2`}</code>)، ثم يجمع ويوثق شبكة الأحرف التي تقابل كل حرف من <strong className="text-text-primary">الحروف النورانية الـ 14</strong>.
                    </p>

                    <div className="flex items-center gap-3 pt-1 flex-wrap text-xs text-text-muted">
                        <label className="flex items-center gap-2 cursor-pointer select-none bg-surface/70 px-3 py-1.5 rounded-xl border border-border-default hover:bg-surface transition-colors">
                            <input
                                type="checkbox"
                                checked={includeTanweenAlif}
                                onChange={(e) => setIncludeTanweenAlif(e.target.checked)}
                                className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span className="font-semibold text-text-secondary">شمل المفردات المنونة بالفتح (مثل: هُوداً، قَوْماً، بيتاً، نَاراً...)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* 2.2 Balance Letter Selector Hub (لوحة اختيار وتبديل حرف الميزان) */}
            <div className="bg-surface border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xl">⚖️</span>
                            <h2 className="text-base sm:text-lg font-extrabold text-text-primary">
                                تحديد حرف الميزان (الحرف الأوسط للكلمة)
                            </h2>
                            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40">
                                الميزان الحالي: حرف {analysis.balanceLetterName} ({analysis.balanceLetter})
                            </span>
                        </div>
                        <p className="text-xs text-text-muted">
                            يمكنك اختيار أي حرف من حروف الهجاء لجعله ميزاناً أوسط، وسيقوم البرنامج فوراً بإعادة استقصاء وحساب كافة مفردات ومعادلات المصحف لهذا الحرف:
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsLetterPickerOpen(prev => !prev)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <span>{isLetterPickerOpen ? 'طي قائمة الحروف الـ 28' : 'استعراض كل الحروف الـ 28'}</span>
                            <span className="text-[10px]">{isLetterPickerOpen ? '▲' : '▼'}</span>
                        </button>
                    </div>
                </div>

                {/* Popular Madd / Vowel Letters Bar (و، ا، ي) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-secondary">
                            أشهر موازين الكلمات الثلاثية القرآنية (حروف العلة والمد واللين):
                        </span>
                        <span className="text-[11px] text-text-muted">
                            اضغط على الحرف للتبديل الفوري
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {POPULAR_BALANCE_LETTERS.map(char => {
                            const isSelected = balanceLetter === char;
                            const count = letterWordCounts[char] || 0;
                            const name = ARABIC_LETTER_NAMES[char] || char;
                            const isTriMadd = char === 'tri-madd';

                            return (
                                <button
                                    key={char}
                                    type="button"
                                    onClick={() => handleSelectBalanceLetter(char)}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-right shadow-xs ${
                                        isSelected
                                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md ring-4 ring-amber-400/30 scale-[1.02]'
                                            : isTriMadd
                                                ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 hover:bg-amber-500/15 border-amber-500/40 text-text-primary'
                                                : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-amber-500/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-quran text-base font-black shadow-xs shrink-0 ${
                                            isSelected 
                                                ? 'bg-slate-950 text-amber-400' 
                                                : isTriMadd
                                                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                                                    : 'bg-primary/10 text-primary'
                                        }`}>
                                            {isTriMadd ? 'و·ا·ي' : char}
                                        </div>
                                        <div className="truncate">
                                            <div className="text-xs sm:text-sm font-extrabold truncate">
                                                {isTriMadd ? 'أحرف المد (و+ا+ي)' : `ميزان ${name} (${char})`}
                                            </div>
                                            <div className={`text-[10px] truncate ${isSelected ? 'text-slate-900 font-bold' : 'text-text-muted'}`}>
                                                {isTriMadd ? 'الميزان التكاملي الأكمل 🌟' : `L1 + ${char} + L2 ⟵ L1=L2`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left shrink-0">
                                        <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg ${
                                            isSelected ? 'bg-slate-950 text-amber-400' : 'bg-surface border border-border-subtle text-primary'
                                        }`}>
                                            {count} كلمة
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Advisor Banner & Quick Switch to Dual Scale */}
                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdvisorOpen(prev => !prev)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                        >
                            <span>💡</span>
                            <span>محتار أي حرف هو الأنسب؟ اضغط لعرض مستشار المقارنة التشخيصية</span>
                            <span className="text-[10px]">{isAdvisorOpen ? '▲ إخفاء' : '▼ مقارنة الموازين الأربعة'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('dual-pairs');
                                showToast('تم الانتقال إلى ميزان الكفتين (14 ⟵ 28)');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                            <span>⚖️</span>
                            <span>ميزان الكفتين (حرفين لكل نوراني 14 ⟵ 28) ⟵</span>
                        </button>
                    </div>

                    {/* Mizan Diagnostic Comparison Cards (Advisor) */}
                    {isAdvisorOpen && (
                        <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/30 space-y-4 animate-fade-in">
                            <div className="space-y-1">
                                <h3 className="font-extrabold text-sm sm:text-base text-text-primary flex items-center gap-2">
                                    <span>💡</span>
                                    <span>مستشار حل الحيرة: مقارنة الموازين الأساسية وميزات كل منها</span>
                                </h3>
                                <p className="text-xs text-text-muted leading-relaxed">
                                    إذا كنت تتساءل: <strong>«أي حرف أجعله هو الميزان حتى أزن به كفتين وأخرج حرفين لكل حرف نوراني؟»</strong> فإليك التشخيص الإحصائي الدقيق:
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {mizanComparisonList.map(cand => {
                                    const isCurrent = balanceLetter === cand.id;
                                    return (
                                        <div
                                            key={cand.id}
                                            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                                                cand.isRecommended
                                                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-400/30 shadow-xs'
                                                    : 'bg-surface border-border-default'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                                    <span className="text-xs font-extrabold text-text-primary">{cand.name}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface border border-border-subtle text-amber-700 dark:text-amber-300">
                                                        {cand.badge}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-text-muted leading-relaxed">
                                                    {cand.description}
                                                </p>

                                                <div className="space-y-1 pt-1 text-[11px]">
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-text-muted">اكتمال كفتين (حرفين):</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{cand.nooraniFullDualCoverage14} / 14</span>
                                                    </div>
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-text-muted">المفردات الثلاثية:</span>
                                                        <span className="font-bold">{cand.totalUniqueWords} كلمة</span>
                                                    </div>
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-text-muted">إجمالي التكرار:</span>
                                                        <span className="font-bold">{cand.totalWordOccurrences} موضع</span>
                                                    </div>
                                                    <div className="flex items-center justify-between font-mono">
                                                        <span className="text-text-muted">تناظر عكوسي:</span>
                                                        <span className="font-bold text-purple-600 dark:text-purple-400">{cand.symmetricPairsCount} زوجاً</span>
                                                    </div>
                                                </div>

                                                <div className="p-2 rounded-xl bg-surface-subtle text-[11px] text-text-secondary leading-snug">
                                                    <strong className="text-primary font-bold">الميزة: </strong>
                                                    {cand.pros}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSelectBalanceLetter(cand.id);
                                                    setActiveTab('dual-pairs');
                                                }}
                                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                                                        : 'bg-surface hover:bg-surface-subtle border border-border-default text-text-primary hover:border-amber-500'
                                                }`}
                                            >
                                                {isCurrent ? '✓ الميزان المعتمد حالياً' : 'اعتماد هذا الميزان الآن ⟵'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Full 28 Alphabet Grid */}
                {isLetterPickerOpen && (
                    <div className="pt-3 border-t border-border-subtle space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between text-xs text-text-muted">
                            <span className="font-bold text-text-secondary">
                                شبكة الحروف الهجائية الثمانية والعشرين:
                            </span>
                            <span className="text-[11px]">
                                انقر على أي حرف لوزن واستقصاء الكلمات التي يتوسطها في المصحف
                            </span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-1.5 sm:gap-2">
                            {ALL_ARABIC_LETTERS.map(char => {
                                const isSelected = balanceLetter === char;
                                const count = letterWordCounts[char] || 0;
                                const name = ARABIC_LETTER_NAMES[char] || char;

                                return (
                                    <button
                                        key={char}
                                        type="button"
                                        onClick={() => handleSelectBalanceLetter(char)}
                                        className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center select-none ${
                                            isSelected
                                                ? 'bg-amber-500 text-slate-950 border-amber-500 font-black ring-2 ring-amber-400/50 shadow-md scale-105'
                                                : count > 0 
                                                    ? 'bg-surface hover:bg-surface-subtle border-border-default text-text-primary hover:border-primary/50'
                                                    : 'bg-surface-subtle/40 border-border-subtle/50 text-text-muted opacity-50 hover:opacity-100'
                                        }`}
                                        title={`ميزان حرف ${name} (${char}) - ورد في ${count} مفردة قرآنية`}
                                    >
                                        <span className="font-quran text-xl font-bold">{char}</span>
                                        <span className="text-[9px] truncate max-w-full font-sans mt-0.5">{name}</span>
                                        <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'font-bold text-slate-950' : 'text-text-muted'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 2.5 Dedicated AI Export & Copy Hub (لوحة نسخ النتائج للذكاء الاصطناعي) */}
            <div className="rounded-3xl bg-surface border-2 border-primary/20 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl">🤖</span>
                            <h2 className="text-base sm:text-lg font-bold text-text-primary">
                                نسخ وتصدير جميع النتائج للذكاء الاصطناعي (AI Prompt & Data)
                            </h2>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                                جاهز للصق المباشر
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
                            انسخ نتائج الاستقصاء القرآني بالكامل بنقرة زر واحدة لإعطائها لأي نموذج ذكاء اصطناعي (ChatGPT / Claude / Gemini / DeepSeek) لاستخراج الأنماط، أو كتقرير علمي شامل أو بيانات JSON:
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsExportModalOpen(true)}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            <span>معاينة وتخصيص النص</span>
                        </button>
                    </div>
                </div>

                {/* 4 Quick Master Export Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Master AI Prompt */}
                    <button
                        type="button"
                        onClick={handleCopyAiPrompt}
                        className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 shadow-xs group ${
                            copiedFormat === 'ai'
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                : 'bg-primary text-white hover:bg-primary-hover border-primary active:scale-[0.98]'
                        }`}
                        title="نسخ التقرير الشامل مزوداً بتوجيه محكم للذكاء الاصطناعي"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xl">🤖</span>
                            {copiedFormat === 'ai' ? (
                                <CheckIcon className="w-5 h-5 text-white" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-white/80 group-hover:text-white" />
                            )}
                        </div>
                        <div>
                            <div className="font-extrabold text-sm sm:text-base">
                                {copiedFormat === 'ai' ? 'تم نسخ التقرير للذكاء الاصطناعي!' : 'نسخ كل النتائج للذكاء الاصطناعي'}
                            </div>
                            <div className="text-[11px] text-white/80 mt-1">
                                تقرير كامل + برومبت وتوجيه تحليلي جاهز للصق
                            </div>
                        </div>
                    </button>

                    {/* Card 2: Markdown Report */}
                    <button
                        type="button"
                        onClick={handleCopyFullReport}
                        className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 shadow-xs group ${
                            copiedFormat === 'markdown'
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-border-default/80 active:scale-[0.98]'
                        }`}
                        title="نسخ التقرير القرآني الكامل كملف Markdown منسق"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xl">📄</span>
                            {copiedFormat === 'markdown' ? (
                                <CheckIcon className="w-5 h-5 text-white" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-text-muted group-hover:text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="font-extrabold text-sm sm:text-base">
                                {copiedFormat === 'markdown' ? 'تم نسخ التقرير بنجاح!' : 'نسخ التقرير الشامل (Markdown)'}
                            </div>
                            <div className="text-[11px] text-text-muted mt-1">
                                وثيقة علمية منسقة بجميع الجداول والإحصاءات
                            </div>
                        </div>
                    </button>

                    {/* Card 3: JSON Data */}
                    <button
                        type="button"
                        onClick={handleCopyJsonData}
                        className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 shadow-xs group ${
                            copiedFormat === 'json'
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-border-default/80 active:scale-[0.98]'
                        }`}
                        title="نسخ كامل البيانات كـ JSON منظم للنماذج البرمجية"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xl font-mono">{'{}'}</span>
                            {copiedFormat === 'json' ? (
                                <CheckIcon className="w-5 h-5 text-white" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-text-muted group-hover:text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="font-extrabold text-sm sm:text-base">
                                {copiedFormat === 'json' ? 'تم نسخ بيانات JSON!' : 'نسخ كـ JSON برمجي منظم'}
                            </div>
                            <div className="text-[11px] text-text-muted mt-1">
                                كائنات برمجية مهيكلة للـ API والنماذج والتحليل
                            </div>
                        </div>
                    </button>

                    {/* Card 4: 14 Noorani Network */}
                    <button
                        type="button"
                        onClick={handleCopyNooraniFullNetwork}
                        className={`p-4 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-3 shadow-xs group ${
                            copiedFormat === 'noorani'
                                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-border-default/80 active:scale-[0.98]'
                        }`}
                        title="نسخ شبكة الـ 14 حرفاً نورانياً وجميع مقابلاتها فقط"
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className="text-xl">✨</span>
                            {copiedFormat === 'noorani' ? (
                                <CheckIcon className="w-5 h-5 text-white" />
                            ) : (
                                <CopyIcon className="w-4 h-4 text-text-muted group-hover:text-primary" />
                            )}
                        </div>
                        <div>
                            <div className="font-extrabold text-sm sm:text-base">
                                {copiedFormat === 'noorani' ? 'تم نسخ شبكة النوراني!' : 'نسخ شبكة الـ 14 حرفاً كاملة'}
                            </div>
                            <div className="text-[11px] text-text-muted mt-1">
                                كشف موجز لكافة مقابلات الحروف النورانية الـ 14
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* 3. Interactive Fulcrum Scale Display (الميزان التفاعلي الحركي) */}
            {currentScaleWord && (
                <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-7 shadow-md space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border-subtle">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚖️</span>
                            <h3 className="font-bold text-sm sm:text-base text-text-primary">الميزان التفاعلي المباشر للكلمة</h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveWordIndex(prev => Math.max(0, prev - 1))}
                                disabled={activeWordIndex <= 0}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border-default bg-surface-subtle hover:bg-surface-hover disabled:opacity-40 cursor-pointer"
                                title="الكلمة السابقة"
                            >
                                السابق
                            </button>
                            <span className="text-xs font-mono font-bold text-text-secondary">
                                {activeWordIndex + 1} / {allWords.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => setActiveWordIndex(prev => Math.min(allWords.length - 1, prev + 1))}
                                disabled={activeWordIndex >= allWords.length - 1}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border-default bg-surface-subtle hover:bg-surface-hover disabled:opacity-40 cursor-pointer"
                                title="الكلمة التالية"
                            >
                                التالي
                            </button>
                            <button
                                type="button"
                                onClick={handleRandomScaleWord}
                                className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer flex items-center gap-1"
                                title="اختيار عشوائي لكلمة قرآنية"
                            >
                                <span>عشوائي</span>
                                <span>🎲</span>
                            </button>
                        </div>
                    </div>

                    {/* Scale Visual Container */}
                    <div className="relative py-4 flex flex-col items-center">
                        {/* Scale Beam */}
                        <div className="w-full max-w-lg relative flex items-center justify-between px-4 sm:px-12">
                            {/* Horizontal Golden Rod */}
                            <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full shadow-sm z-0 transform -translate-y-1/2"></div>

                            {/* Left Pan (Letter 1) */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-0.5 h-6 bg-amber-600/60 mb-0.5"></div>
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg transition-transform transform hover:scale-105 ${
                                    NOORANI_SET.has(currentScaleWord.firstLetter)
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-800 dark:text-purple-300'
                                }`}>
                                    <span className="font-quran text-2xl sm:text-3xl font-extrabold">{currentScaleWord.firstLetter}</span>
                                    <span className="text-[10px] font-bold mt-0.5">
                                        {NOORANI_SET.has(currentScaleWord.firstLetter) ? 'نوراني ✨' : 'غير نوراني'}
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-text-muted mt-1.5">كفة اليمين (L1)</span>
                            </div>

                            {/* Center Fulcrum (Dynamic Letter Balance) */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 flex flex-col items-center justify-center shadow-xl ring-4 ring-amber-400/30">
                                    <span className="font-quran text-3xl sm:text-4xl font-black">{analysis.balanceLetter}</span>
                                    <span className="text-[9px] font-black uppercase tracking-wider">المِيزَان</span>
                                </div>
                                <div className="w-3 h-8 bg-gradient-to-b from-amber-600 to-amber-800 rounded-b-md shadow-sm"></div>
                                <div className="w-12 h-2.5 bg-amber-800/80 rounded-full mt-0.5"></div>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                                    حرف {analysis.balanceLetterName}
                                </span>
                            </div>

                            {/* Right Pan (Letter 2) */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-0.5 h-6 bg-amber-600/60 mb-0.5"></div>
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg transition-transform transform hover:scale-105 ${
                                    NOORANI_SET.has(currentScaleWord.secondLetter)
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-800 dark:text-purple-300'
                                }`}>
                                    <span className="font-quran text-2xl sm:text-3xl font-extrabold">{currentScaleWord.secondLetter}</span>
                                    <span className="text-[10px] font-bold mt-0.5">
                                        {NOORANI_SET.has(currentScaleWord.secondLetter) ? 'نوراني ✨' : 'غير نوراني'}
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-text-muted mt-1.5">كفة اليسار (L2)</span>
                            </div>
                        </div>

                        {/* Equation & Word Badge */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <div className="px-5 py-2.5 rounded-2xl bg-surface-subtle border border-border-default flex items-center gap-3 shadow-inner">
                                <span className="text-xs text-text-muted font-bold">المعادلة المستنبطة:</span>
                                <span className="font-mono text-xl sm:text-2xl font-black text-primary" dir="ltr">
                                    {currentScaleWord.firstLetter} = {currentScaleWord.secondLetter}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setModalData({
                                    title: `شواهد الكلمة: ${currentScaleWord.word}`,
                                    subtitle: `معادلة الميزان (${currentScaleWord.firstLetter} = ${currentScaleWord.secondLetter}) - وردت ${currentScaleWord.frequency} مرة`,
                                    equation: currentScaleWord.equation,
                                    occurrences: currentScaleWord.occurrences
                                })}
                                className="px-4 py-2 rounded-2xl bg-primary text-white hover:bg-primary-hover font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                <BookOpenIcon className="w-4 h-4" />
                                <span>مفردة: «{currentScaleWord.word}» ({currentScaleWord.frequency} موضع)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State when no 3-letter words exist for selected balance letter */}
            {(!allWords || allWords.length === 0) && (
                <div className="bg-surface border border-border-default rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                    <span className="text-3xl">⚖️</span>
                    <h3 className="font-bold text-base sm:text-lg text-text-primary">
                        لم تُسجَّل في المصحف الشريف كلمات ثلاثية مجردة يتوسطها حرف ({analysis.balanceLetterName} - {analysis.balanceLetter})
                    </h3>
                    <p className="text-xs text-text-muted max-w-md mx-auto">
                        حروف المد والعلة (الواو، الألف، الياء) هي الأكثر توسطاً في الكلمات الثلاثية. يمكنك استكشاف موازين الأحرف الشائعة الأخرى:
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                        {POPULAR_BALANCE_LETTERS.map(char => (
                            <button
                                key={char}
                                type="button"
                                onClick={() => handleSelectBalanceLetter(char)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                                ميزان {ARABIC_LETTER_NAMES[char]} ({char})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Quick Metrics Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between">
                    <span className="text-xs text-text-muted font-medium">الكلمات الثلاثية بحرف ({analysis.balanceLetter})</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-primary">
                            {stats.totalUniqueWords}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{stats.totalWordOccurrences} موضع</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between">
                    <span className="text-xs text-text-muted font-medium">إجمالي علاقات التوازن</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                            {stats.totalUniqueEquations}
                        </span>
                        <span className="text-[10px] text-text-muted">معادلة (L1=L2)</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between">
                    <span className="text-xs text-text-muted font-medium">توازن نوراني خالص</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                            {stats.nooraniNooraniEquations}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">نوراني ⟷ نوراني</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between">
                    <span className="text-xs text-text-muted font-medium">أزواج عكوسية متناظرة</span>
                    <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                            {stats.symmetricPairsCount}
                        </span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">مثل: ل=ح و ح=ل</span>
                    </div>
                </div>
            </div>

            {/* 5. Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border-default pb-2 overflow-x-auto select-none">
                <button
                    type="button"
                    onClick={() => setActiveTab('dual-pairs')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'dual-pairs'
                            ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                >
                    <span>⚖️</span>
                    <span>ميزان الكفتين (حرفين لكل نوراني 14 ⟵ 28)</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeTab === 'dual-pairs' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                    }`}>
                        {dualExtractionSummary.fullyCoveredCount} / 14
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('noorani')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'noorani'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>شبكة الحروف النورانية الـ 14 (المطلوب)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'noorani' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                    }`}>
                        14
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('equations')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'equations'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>فهرس الكلمات والمعادلات</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'equations' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                    }`}>
                        {allEquations.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('symmetric')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'symmetric'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                >
                    <span>🔄</span>
                    <span>المعادلات المتناظرة عكوسياً</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'symmetric' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-text-muted'
                    }`}>
                        {symmetricPairs.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('simulator')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === 'simulator'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                >
                    <span>🧪</span>
                    <span>مختبر وزن الكلمات</span>
                </button>
            </div>

            {/* TAB 0: DUAL PAIR SCALE (14 ⟵ 28) - حل الحيرة واستخراج حرفين لكل نوراني */}
            {activeTab === 'dual-pairs' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Hero & Methodology Card */}
                    <div className="bg-surface border-2 border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-2xl">⚖️</span>
                                    <h3 className="text-base sm:text-xl font-extrabold text-text-primary">
                                        ميزان الكفتين: استخراج حرفين لكل حرف نوراني (14 ⟵ 28)
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                                        الميزان المعتمد: {analysis.balanceLetterName} ({analysis.balanceLetter})
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
                                    حل حيرة الميزان وترتيب النتائج: يضع هذا النظام كل حرف من <strong className="text-text-primary">الحروف النورانية الـ 14</strong> كحلقة وصل في المركز، ويستخرج له <strong className="text-amber-700 dark:text-amber-300 font-bold">حرفين متكافئين في كفتي الميزان (كفة اليمين L1 وكفة اليسار L2)</strong> لتكوين شبكة تغطي حروف الأبجدية الـ 28 (14 × 2 = 28) وفق المعيار الذي تفضله:
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handleCopyDualPartnersReport}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                        copiedFormat === 'dual'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-primary text-white hover:bg-primary-hover'
                                    }`}
                                >
                                    {copiedFormat === 'dual' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                    <span>{copiedFormat === 'dual' ? 'تم نسخ جدول الكفتين!' : 'نسخ جدول الكفتين للذكاء الاصطناعي'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setExportModalFormat('dual');
                                        setIsExportModalOpen(true);
                                    }}
                                    className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-subtle hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>تحميل / معاينة</span>
                                </button>
                            </div>
                        </div>

                        {/* Ranking Criteria Pills Toolbar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                <span className="font-extrabold text-text-secondary flex items-center gap-1.5">
                                    <span>🎯</span>
                                    <span>معيار فرز وترتيب الكفتين (كيف نختار الحرفين لكل نوراني؟):</span>
                                </span>
                                <span className="text-[11px] text-text-muted">
                                    انقر لتغيير الترتيب ومشاهدة الأثر فورياً
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                {[
                                    {
                                        id: 'frequency' as DualPairRankingMode,
                                        label: 'الأعلى تكراراً بالقرآن',
                                        icon: '📊',
                                        desc: 'الأكثر وزناً ومواضع في التنزيل'
                                    },
                                    {
                                        id: 'diversity' as DualPairRankingMode,
                                        label: 'الأكثر تنوعاً بالمفردات',
                                        icon: '📚',
                                        desc: 'أكبر عدد من الكلمات المختلفة'
                                    },
                                    {
                                        id: 'symmetric' as DualPairRankingMode,
                                        label: 'أولوية التناظر العكوسي',
                                        icon: '🔄',
                                        desc: 'تقديم الأزواج المتبادلة (A=B)'
                                    },
                                    {
                                        id: 'balanced' as DualPairRankingMode,
                                        label: 'توازن الكفتين (نوراني+ظلماني)',
                                        icon: '⚖️',
                                        desc: 'أفضل نوراني + أفضل غير نوراني'
                                    },
                                    {
                                        id: 'unique-optimal' as DualPairRankingMode,
                                        label: 'التوزيع الشامل (14 ⟵ 28)',
                                        icon: '🌐',
                                        desc: 'تغطية الـ 28 حرفاً دون تكرار'
                                    }
                                ].map(m => {
                                    const isActive = dualRankingMode === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                setDualRankingMode(m.id);
                                                showToast(`تم تغيير معيار الكفتين إلى: ${m.label}`);
                                            }}
                                            className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer select-none ${
                                                isActive
                                                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm ring-2 ring-amber-400/40'
                                                    : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 font-bold text-xs">
                                                <span>{m.icon}</span>
                                                <span className="truncate">{m.label}</span>
                                            </div>
                                            <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-slate-900 font-medium' : 'text-text-muted'}`}>
                                                {m.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Live Coverage Metrics Bar */}
                        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-text-muted">اكتمال كفتي الميزان:</span>
                                    <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                        {dualExtractionSummary.fullyCoveredCount} / 14 حرفاً
                                    </span>
                                    <span className="text-[10px] text-text-muted">
                                        ({Math.round((dualExtractionSummary.fullyCoveredCount / 14) * 100)}%)
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-text-muted">حروف الأبجدية المغطاة في الكفتين:</span>
                                    <span className="font-mono font-extrabold text-sm text-primary">
                                        {dualExtractionSummary.uniquePartnerLettersCount} / 28 حرفاً
                                    </span>
                                </div>
                            </div>

                            {/* Covered Letters Badges */}
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-text-muted">الحروف المغطاة:</span>
                                {ALL_ARABIC_LETTERS.map(char => {
                                    const isCovered = dualExtractionSummary.uniquePartnerLetters.includes(char);
                                    const isNoorani = NOORANI_SET.has(char);
                                    return (
                                        <span
                                            key={char}
                                            className={`w-5 h-5 rounded-md flex items-center justify-center font-quran text-xs font-bold transition-all ${
                                                isCovered
                                                    ? isNoorani
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-purple-600 text-white'
                                                    : 'bg-surface border border-border-subtle text-text-muted/40 opacity-40'
                                            }`}
                                            title={`حرف ${ARABIC_LETTER_NAMES[char]} (${char}) - ${isCovered ? 'مغطى في كفتي الميزان' : 'غير مغطى بعد'}`}
                                        >
                                            {char}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* The 14 Dual Scales Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dualExtractionSummary.results.map((r, idx) => {
                            const isFullyCovered = r.coverageStatus === 'full';
                            const p1 = r.partner1;
                            const p2 = r.partner2;

                            return (
                                <div
                                    key={r.nooraniLetter}
                                    className={`p-5 rounded-3xl border transition-all space-y-4 shadow-xs ${
                                        isFullyCovered
                                            ? 'bg-surface border-border-default hover:border-amber-500/40'
                                            : 'bg-surface/80 border-dashed border-amber-500/40'
                                    }`}
                                >
                                    {/* Card Top Header */}
                                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono text-xs font-bold flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-extrabold text-base text-text-primary">
                                                    حرف {r.nooraniName}
                                                </span>
                                                <span className="font-quran text-lg font-bold text-amber-600 dark:text-amber-400">
                                                    ({r.nooraniLetter})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                isFullyCovered
                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                                    : r.coverageStatus === 'partial'
                                                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                                        : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                                            }`}>
                                                {isFullyCovered ? 'كفتان مكتملتان ✨' : r.coverageStatus === 'partial' ? 'كفة واحدة فقط' : 'غير متوفر'}
                                            </span>

                                            <span className="text-[11px] text-text-muted font-mono">
                                                {r.allPartners.length} بدائل
                                            </span>
                                        </div>
                                    </div>

                                    {/* Dual Scale Visual Representation */}
                                    <div className="relative py-2 flex items-center justify-between gap-2">
                                        {/* Golden Horizontal Connecting Bar */}
                                        <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-amber-600/50 via-amber-400 to-amber-600/50 rounded-full z-0 transform -translate-y-1/2"></div>

                                        {/* Right Pan (Partner 1) */}
                                        <div className="relative z-10 flex-1 flex flex-col items-center">
                                            {p1 ? (
                                                <div className="w-full p-3 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1.5 text-center transition-all hover:scale-102">
                                                    <span className="text-[10px] text-text-muted font-bold block">كفة اليمين (1)</span>
                                                    <span className="font-quran text-2xl font-black text-text-primary block">
                                                        {p1.partnerLetter}
                                                    </span>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                                            p1.isPartnerNoorani ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                                        }`}>
                                                            {p1.isPartnerNoorani ? 'نوراني' : 'غير نوراني'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-text-muted block">
                                                        {p1.totalOccurrences} موضع
                                                    </span>
                                                    {/* Words buttons */}
                                                    <div className="pt-1 flex items-center justify-center gap-1 flex-wrap">
                                                        {p1.words.slice(0, 2).map(w => (
                                                            <button
                                                                key={w.word}
                                                                type="button"
                                                                onClick={() => setModalData({
                                                                    title: `مفردة: ${w.word}`,
                                                                    subtitle: `معادلة الكفة (${p1.partnerLetter} = ${r.nooraniLetter}) - ${w.frequency} موضع`,
                                                                    equation: w.equation,
                                                                    occurrences: w.occurrences
                                                                })}
                                                                className="px-1.5 py-0.2 rounded bg-surface-subtle hover:bg-primary/10 border border-border-subtle text-[10px] font-bold text-text-primary hover:text-primary cursor-pointer"
                                                            >
                                                                «{w.word}» ({w.frequency})
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full p-4 rounded-2xl bg-surface-subtle/50 border border-dashed border-border-default text-center text-text-muted text-xs">
                                                    لا يوجد مقابل
                                                </div>
                                            )}
                                        </div>

                                        {/* Center Fulcrum (The Noorani Letter itself) */}
                                        <div className="relative z-10 shrink-0 flex flex-col items-center px-1">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 flex flex-col items-center justify-center shadow-lg ring-4 ring-amber-400/30">
                                                <span className="font-quran text-2xl font-black">{r.nooraniLetter}</span>
                                                <span className="text-[8px] font-black uppercase tracking-wider">نوراني</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                                                الميزان: {analysis.balanceLetter}
                                            </span>
                                        </div>

                                        {/* Left Pan (Partner 2) */}
                                        <div className="relative z-10 flex-1 flex flex-col items-center">
                                            {p2 ? (
                                                <div className="w-full p-3 rounded-2xl bg-surface border border-border-default shadow-xs space-y-1.5 text-center transition-all hover:scale-102">
                                                    <span className="text-[10px] text-text-muted font-bold block">كفة اليسار (2)</span>
                                                    <span className="font-quran text-2xl font-black text-text-primary block">
                                                        {p2.partnerLetter}
                                                    </span>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                                            p2.isPartnerNoorani ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                                        }`}>
                                                            {p2.isPartnerNoorani ? 'نوراني' : 'غير نوراني'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-text-muted block">
                                                        {p2.totalOccurrences} موضع
                                                    </span>
                                                    {/* Words buttons */}
                                                    <div className="pt-1 flex items-center justify-center gap-1 flex-wrap">
                                                        {p2.words.slice(0, 2).map(w => (
                                                            <button
                                                                key={w.word}
                                                                type="button"
                                                                onClick={() => setModalData({
                                                                    title: `مفردة: ${w.word}`,
                                                                    subtitle: `معادلة الكفة (${r.nooraniLetter} = ${p2.partnerLetter}) - ${w.frequency} موضع`,
                                                                    equation: w.equation,
                                                                    occurrences: w.occurrences
                                                                })}
                                                                className="px-1.5 py-0.2 rounded bg-surface-subtle hover:bg-primary/10 border border-border-subtle text-[10px] font-bold text-text-primary hover:text-primary cursor-pointer"
                                                            >
                                                                «{w.word}» ({w.frequency})
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full p-4 rounded-2xl bg-surface-subtle/50 border border-dashed border-border-default text-center text-text-muted text-xs">
                                                    لا يوجد مقابل ثانٍ
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Equation Synthesis */}
                                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs flex-wrap gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] text-text-muted font-bold">صيغة التوازن:</span>
                                            <span className="font-mono text-xs font-extrabold text-primary px-2 py-0.5 bg-surface-subtle rounded-lg">
                                                [{p1 ? p1.partnerLetter : '؟'} = {r.nooraniLetter} = {p2 ? p2.partnerLetter : '؟'}]
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedNooraniLetter(r.nooraniLetter);
                                                setActiveTab('noorani');
                                            }}
                                            className="text-[11px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                        >
                                            <span>عرض كافة المقابلات والآيات ({r.allPartners.length})</span>
                                            <span>⟵</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 1: NOORANI LETTERS NETWORK (الهدف الرئيسي) */}
            {activeTab === 'noorani' && (
                <div className="space-y-6 animate-fade-in">
                    {/* 14 Noorani Letter Selector Pill Bar */}
                    <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-border-default shadow-xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-xs font-bold text-text-secondary">
                                اختر حرفاً نورانياً لاستعراض شبكة الأحرف التي تقابله في ميزان {analysis.balanceLetterName} ({analysis.balanceLetter}):
                            </span>
                            <span className="text-[11px] text-text-muted">
                                نص حكيم قاطع له سر (14 حرفاً نورانياً)
                            </span>
                        </div>

                        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 sm:gap-2">
                            {CANONICAL_14_NOORANI.map((char) => {
                                const summary = nooraniSummaries[char];
                                const isSelected = selectedNooraniLetter === char;
                                const count = summary?.totalPartnersCount || 0;

                                return (
                                    <button
                                        key={char}
                                        type="button"
                                        onClick={() => setSelectedNooraniLetter(char)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer select-none ${
                                            isSelected
                                                ? 'bg-primary text-white border-primary shadow-sm scale-105 font-bold ring-2 ring-primary/30'
                                                : 'bg-surface-subtle hover:bg-surface-hover border-border-default text-text-primary'
                                        }`}
                                    >
                                        <span className="font-quran text-xl sm:text-2xl font-bold">{char}</span>
                                        <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Noorani Letter Details Showcase */}
                    {activeNooraniSummary && (
                        <div className="bg-surface border border-border-default rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex flex-col items-center justify-center shadow-xs">
                                        <span className="font-quran text-3xl font-extrabold">{activeNooraniSummary.nooraniLetter}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-text-primary font-quran">
                                                حرف {activeNooraniSummary.nooraniName} ({activeNooraniSummary.nooraniLetter})
                                            </h3>
                                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                حرف نوراني
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            يقابله في ميزان {analysis.balanceLetterName} ({analysis.balanceLetter}) <strong className="text-text-primary font-bold">{activeNooraniSummary.totalPartnersCount}</strong> أحرف (منها {activeNooraniSummary.nooraniPartnersCount} نوراني و {activeNooraniSummary.dhulmaniPartnersCount} غير نوراني) عبر {activeNooraniSummary.totalWordOccurrences} موضعاً قرآنياً.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handleCopyNooraniReport}
                                        className="px-3 py-1.5 rounded-xl border border-border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        title={`نسخ تقرير حرف (${activeNooraniSummary.nooraniLetter}) ومقابلاته`}
                                    >
                                        <CopyIcon className="w-3.5 h-3.5" />
                                        <span>نسخ حرف ({activeNooraniSummary.nooraniLetter})</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCopyNooraniFullNetwork}
                                        className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        title="نسخ شبكة الـ 14 حرفاً نورانياً كاملة"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        <span>نسخ شبكة الـ 14 حرفاً</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCopyAiPrompt}
                                        className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                        title="نسخ جميع النتائج للذكاء الاصطناعي"
                                    >
                                        <CopyIcon className="w-3.5 h-3.5" />
                                        <span>نسخ كل النتائج للذكاء الاصطناعي</span>
                                    </button>
                                </div>
                            </div>

                            {/* Partner Letters Grid */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                        الأحرف المقابلة لحرف ({activeNooraniSummary.nooraniLetter}) في ميزان {analysis.balanceLetterName} ({analysis.balanceLetter}):
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-text-secondary text-[11px]">مقابل نوراني</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                            <span className="text-text-secondary text-[11px]">مقابل غير نوراني</span>
                                        </span>
                                    </div>
                                </div>

                                {activeNooraniSummary.partnerLetters.length === 0 ? (
                                    <div className="p-8 text-center bg-surface-subtle rounded-2xl border border-border-default text-text-muted text-xs">
                                        لم يتم العثور على كلمات ثلاثية وسطها ({analysis.balanceLetterName} - {analysis.balanceLetter}) يظهر فيها حرف ({activeNooraniSummary.nooraniLetter}) في القرآن الكريم.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {activeNooraniSummary.partnerLetters.map((partner) => {
                                            const isPartnerNoorani = partner.isPartnerNoorani;

                                            return (
                                                <div
                                                    key={partner.partnerLetter}
                                                    className="p-4 rounded-2xl border border-border-default bg-surface hover:border-border-default/80 transition-all shadow-2xs space-y-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            {/* Partner Letter Box */}
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-quran text-2xl font-bold border ${
                                                                isPartnerNoorani 
                                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                                                                    : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                                            }`}>
                                                                {partner.partnerLetter}
                                                            </div>

                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-base text-text-primary">
                                                                        الحرف: {NOORANI_NAMES[partner.partnerLetter] || partner.partnerLetter}
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                                                        isPartnerNoorani
                                                                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                                                            : 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
                                                                    }`}>
                                                                        {isPartnerNoorani ? 'نوراني ✨' : 'غير نوراني'}
                                                                    </span>
                                                                </div>

                                                                <div className="text-xs font-mono font-bold text-primary mt-0.5">
                                                                    {partner.equations.join(' ، ')}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 bg-surface-subtle rounded-md">
                                                            {partner.totalOccurrences} موضع
                                                        </span>
                                                    </div>

                                                    {/* Words Forming this equation */}
                                                    <div className="pt-2 border-t border-border-subtle/70 flex items-center justify-between flex-wrap gap-2 text-xs">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-text-muted text-[11px]">المفردات:</span>
                                                            {partner.words.map(w => (
                                                                <button
                                                                    key={w.word}
                                                                    type="button"
                                                                    onClick={() => setModalData({
                                                                        title: `مفردة: ${w.word}`,
                                                                        subtitle: `معادلة الميزان: (${w.equation}) - وردت ${w.frequency} مرة`,
                                                                        equation: w.equation,
                                                                        occurrences: w.occurrences
                                                                    })}
                                                                    className="px-2 py-0.5 rounded-lg bg-surface-subtle hover:bg-primary/10 border border-border-default hover:border-primary text-text-primary hover:text-primary font-bold transition-all cursor-pointer"
                                                                >
                                                                    «{w.word}» ({w.frequency})
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const allOccurrences = partner.words.flatMap(w => w.occurrences);
                                                                setModalData({
                                                                    title: `شواهد التوازن: [${activeNooraniSummary.nooraniLetter}] = [${partner.partnerLetter}]`,
                                                                    subtitle: `عبر المفردات: ${partner.words.map(w => w.word).join('، ')} (إجمالي ${allOccurrences.length} موضع)`,
                                                                    occurrences: allOccurrences
                                                                });
                                                            }}
                                                            className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                                                        >
                                                            عرض الآيات ⟵
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ALL EQUATIONS & WORDS (فهرس الكلمات والمعادلات) */}
            {activeTab === 'equations' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Search & Category Filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border-default shadow-xs">
                        <div className="relative flex-1">
                            <SearchIcon className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث باسم الكلمة (مثلاً: هود، قوم، نور) أو الحرفين..."
                                className="w-full pr-9 pl-8 py-2 rounded-xl bg-surface-subtle border border-border-default text-xs text-text-primary focus:outline-none focus:border-primary"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                                >
                                    <ClearIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                            <button
                                type="button"
                                onClick={() => setRelationFilter('all')}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    relationFilter === 'all'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                الكل ({allEquations.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRelationFilter('noorani-noorani')}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    relationFilter === 'noorani-noorani'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                نوراني ⟷ نوراني
                            </button>
                            <button
                                type="button"
                                onClick={() => setRelationFilter('noorani-dhulmani')}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    relationFilter === 'noorani-dhulmani'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                نوراني ⟷ غير نوراني
                            </button>
                            <button
                                type="button"
                                onClick={() => setRelationFilter('symmetric')}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                    relationFilter === 'symmetric'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                عكوسية متناظرة 🔄
                            </button>
                        </div>
                    </div>

                    {/* Equations Table / Cards Header Action Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs px-1">
                        <span className="text-text-muted font-bold">
                            المعادلات المعروضة: {filteredEquations.length} من أصل {allEquations.length} علاقة توازن
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => {
                                    let text = `# فهرس معادلات ميزان ${analysis.balanceLetterName} (${analysis.balanceLetter}) (${filteredEquations.length} معادلة)\n\n`;
                                    filteredEquations.forEach((eq, idx) => {
                                        const wordsStr = eq.words.map(w => `${w.word} (${w.frequency})`).join('، ');
                                        text += `${idx + 1}. [ ${eq.leftLetter} = ${eq.rightLetter} ] ⟵ الكلمات: ${wordsStr} (مواضع: ${eq.totalOccurrences})\n`;
                                    });
                                    navigator.clipboard.writeText(text).then(() => {
                                        showToast(`تم نسخ فهرس المعادلات (${filteredEquations.length} معادلة) بنجاح`);
                                    });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-border-default bg-surface hover:bg-surface-subtle text-xs font-bold text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                                <span>نسخ المعادلات المعروضة ({filteredEquations.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyAiPrompt}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                                <span>نسخ كل النتائج للذكاء الاصطناعي</span>
                            </button>
                        </div>
                    </div>

                    {/* Equations Table / Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredEquations.map(eq => {
                            return (
                                <div
                                    key={eq.id}
                                    className="p-4 rounded-2xl bg-surface border border-border-default hover:border-border-default/80 transition-all shadow-2xs space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-lg font-black text-text-primary px-2.5 py-0.5 rounded-lg bg-surface-subtle border border-border-subtle" dir="ltr">
                                                {eq.leftLetter} = {eq.rightLetter}
                                            </span>
                                            {eq.isSymmetric && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold" title="توجد معادلة عكوسية مناظرة لها في القرآن">
                                                    🔄 عكوسي
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[11px] font-mono text-text-muted">
                                            {eq.totalOccurrences} موضع
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                            eq.isLeftNoorani 
                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                                        }`}>
                                            {eq.leftLetter} ({eq.isLeftNoorani ? 'نوراني' : 'غير نوراني'})
                                        </span>
                                        <span className="text-text-muted">⟷</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                            eq.isRightNoorani 
                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                                        }`}>
                                            {eq.rightLetter} ({eq.isRightNoorani ? 'نوراني' : 'غير نوراني'})
                                        </span>
                                    </div>

                                    {/* Words forming it */}
                                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between flex-wrap gap-2 text-xs">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {eq.words.map(w => (
                                                <button
                                                    key={w.word}
                                                    type="button"
                                                    onClick={() => setModalData({
                                                        title: `شواهد مفردة: ${w.word}`,
                                                        subtitle: `معادلة الميزان (${eq.leftLetter} = ${eq.rightLetter}) - وردت ${w.frequency} مرة`,
                                                        equation: `${eq.leftLetter} = ${eq.rightLetter}`,
                                                        occurrences: w.occurrences
                                                    })}
                                                    className="px-2 py-0.5 rounded-lg bg-surface-subtle hover:bg-primary/10 border border-border-default hover:border-primary text-text-primary font-bold cursor-pointer transition-all"
                                                >
                                                    «{w.word}» ({w.frequency})
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const occs = eq.words.flatMap(w => w.occurrences);
                                                setModalData({
                                                    title: `شواهد المعادلة: ${eq.leftLetter} = ${eq.rightLetter}`,
                                                    subtitle: `عبر المفردات: ${eq.words.map(w => w.word).join('، ')} (إجمالي ${occs.length} موضع)`,
                                                    equation: `${eq.leftLetter} = ${eq.rightLetter}`,
                                                    occurrences: occs
                                                });
                                            }}
                                            className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                                        >
                                            الآيات ⟵
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: SYMMETRICAL PAIRS (المعادلات المتناظرة والعكوسية) */}
            {activeTab === 'symmetric' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                <span>🔄 التناظر العكوسي المتبادل (A = B و B = A)</span>
                            </h4>
                            <p className="text-xs text-amber-800/80 dark:text-amber-400 leading-relaxed max-w-2xl">
                                هذه المفردات تمثل أعلى درجات التناظر القرآني؛ حيث يتبادل الحرفان الطرفيان موقعيهما في كفتي الميزان عبر كلمتين قرآنيتين مختلفتين، مؤكدين التكافؤ المتبادل بين الحرفين.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    let text = `# الأزواج المتناظرة عكوسياً في ميزان ${analysis.balanceLetterName} (${analysis.balanceLetter}) (${symmetricPairs.length} زوجاً)\n\n`;
                                    symmetricPairs.forEach((pair, idx) => {
                                        const eqA = pair.equationA;
                                        const eqB = pair.equationB;
                                        text += `${idx + 1}. الزوج التناظري [ ${eqA.leftLetter} ⟷ ${eqA.rightLetter} ]:\n`;
                                        text += `   - الاتجاه (1): ${eqA.leftLetter} = ${eqA.rightLetter} عبر ${eqA.words.map(w => `«${w.word}» (${w.frequency})`).join('، ')}\n`;
                                        text += `   - الاتجاه (2): ${eqB.leftLetter} = ${eqB.rightLetter} عبر ${eqB.words.map(w => `«${w.word}» (${w.frequency})`).join('، ')}\n`;
                                        text += `   - الإجمالي الكلي للزوج: ${eqA.totalOccurrences + eqB.totalOccurrences} موضع\n\n`;
                                    });
                                    navigator.clipboard.writeText(text).then(() => {
                                        showToast(`تم نسخ الأزواج المتناظرة عكوسياً (${symmetricPairs.length} زوجاً)`);
                                    });
                                }}
                                className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-surface hover:bg-amber-500/10 text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                                <span>نسخ الأزواج المتناظرة</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCopyAiPrompt}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                            >
                                <CopyIcon className="w-3.5 h-3.5" />
                                <span>نسخ كل النتائج للذكاء الاصطناعي</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {symmetricPairs.map(pair => {
                            const eqA = pair.equationA;
                            const eqB = pair.equationB;

                            return (
                                <div
                                    key={pair.pairKey}
                                    className="p-5 rounded-3xl bg-surface border border-border-default shadow-xs space-y-4"
                                >
                                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                                                🔄
                                            </span>
                                            <span className="font-mono text-base font-extrabold text-text-primary" dir="ltr">
                                                {pair.pairKey.replace('=', ' ⟷ ')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-muted font-mono">
                                            {eqA.totalOccurrences + eqB.totalOccurrences} موضعاً كلياً
                                        </span>
                                    </div>

                                    {/* Dual Scales Comparison */}
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        {/* Side A */}
                                        <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
                                            <span className="text-[10px] text-text-muted font-bold block">الاتجاه الأول</span>
                                            <span className="font-mono text-lg font-black text-primary block" dir="ltr">
                                                {eqA.leftLetter} = {eqA.rightLetter}
                                            </span>
                                            <div className="flex items-center justify-center gap-1 flex-wrap pt-1">
                                                {eqA.words.map(w => (
                                                    <span key={w.word} className="px-1.5 py-0.5 rounded text-xs font-bold bg-surface text-text-primary border border-border-subtle">
                                                        «{w.word}» ({w.frequency})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Side B */}
                                        <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
                                            <span className="text-[10px] text-text-muted font-bold block">الاتجاه المعاكس</span>
                                            <span className="font-mono text-lg font-black text-primary block" dir="ltr">
                                                {eqB.leftLetter} = {eqB.rightLetter}
                                            </span>
                                            <div className="flex items-center justify-center gap-1 flex-wrap pt-1">
                                                {eqB.words.map(w => (
                                                    <span key={w.word} className="px-1.5 py-0.5 rounded text-xs font-bold bg-surface text-text-primary border border-border-subtle">
                                                        «{w.word}» ({w.frequency})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const combined = [...eqA.words.flatMap(w => w.occurrences), ...eqB.words.flatMap(w => w.occurrences)];
                                            setModalData({
                                                title: `الزوج التناظري: [${eqA.leftLetter} ⟷ ${eqA.rightLetter}]`,
                                                subtitle: `الاتجاه الأول (${eqA.leftLetter}=${eqA.rightLetter}): ${eqA.words.map(w => w.word).join('، ')} | الاتجاه المعاكس (${eqB.leftLetter}=${eqB.rightLetter}): ${eqB.words.map(w => w.word).join('، ')}`,
                                                occurrences: combined
                                            });
                                        }}
                                        className="w-full py-2 rounded-xl bg-surface-subtle hover:bg-primary/10 border border-border-default hover:border-primary text-xs font-bold text-text-primary hover:text-primary transition-all cursor-pointer text-center"
                                    >
                                        استعراض آيات الزوجين معاً ({eqA.totalOccurrences + eqB.totalOccurrences} آية) ⟵
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: CUSTOM BALANCE SIMULATOR (مختبر وزن الكلمات) */}
            {activeTab === 'simulator' && (
                <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                    <div className="bg-surface border border-border-default rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                <span>🧪 مختبر وزن أي مفردة ثلاثية في ميزان {analysis.balanceLetterName} ({analysis.balanceLetter})</span>
                            </h3>
                            <p className="text-xs text-text-muted">
                                أدخل أي كلمة ثلاثية أحرف (يكون أوسطها حرف {analysis.balanceLetterName} - {balanceLetter}) لفحص ميزانها الحرفي والتأكد من ورودها في التنزيل الحكيم:
                            </p>
                        </div>

                        {/* Input Form */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-secondary block">
                                الكلمة الثلاثية:
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={simulatorWord}
                                    onChange={(e) => setSimulatorWord(e.target.value)}
                                    placeholder={quickSimulatorExamples[0] ? `مثال: ${quickSimulatorExamples.slice(0, 4).join('، ')}...` : "أدخل كلمة ثلاثية..."}
                                    maxLength={4}
                                    className="w-full text-center font-quran text-2xl font-bold py-3 rounded-2xl bg-surface-subtle border-2 border-border-default focus:border-primary focus:outline-none transition-colors"
                                />
                            </div>
                            {quickSimulatorExamples.length > 0 && (
                                <div className="flex items-center justify-center gap-2 text-xs flex-wrap pt-1">
                                    <span className="text-text-muted">أمثلة سريعة:</span>
                                    {quickSimulatorExamples.map(example => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => setSimulatorWord(example)}
                                            className="px-2 py-0.5 rounded-lg bg-surface border border-border-default text-text-secondary hover:text-primary font-bold transition-colors cursor-pointer text-xs"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Analysis Box */}
                        {simulatorResult.isValid ? (
                            <div className="p-5 rounded-2xl bg-surface-subtle border border-border-default space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                                    <span className="text-xs text-text-muted font-bold">معادلة الميزان الناتجة:</span>
                                    <span className="font-mono text-2xl font-extrabold text-primary" dir="ltr">
                                        {simulatorResult.equation}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                                        <span className="text-[10px] text-text-muted font-bold block">كفة اليمين</span>
                                        <span className="font-quran text-2xl font-bold text-text-primary block">{simulatorResult.L1}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                            simulatorResult.isL1Noorani ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
                                        }`}>
                                            {simulatorResult.isL1Noorani ? 'حرف نوراني ✨' : 'غير نوراني'}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                                        <span className="text-[10px] text-text-muted font-bold block">كفة اليسار</span>
                                        <span className="font-quran text-2xl font-bold text-text-primary block">{simulatorResult.L2}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                            simulatorResult.isL2Noorani ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
                                        }`}>
                                            {simulatorResult.isL2Noorani ? 'حرف نوراني ✨' : 'غير نوراني'}
                                        </span>
                                    </div>
                                </div>

                                {/* Status in Quran */}
                                <div className="pt-2">
                                    {simulatorResult.existsInQuran ? (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                                            <div className="flex items-center gap-2">
                                                <CheckIcon className="w-4 h-4 text-emerald-600" />
                                                <span className="font-bold">مفردة قرآنية موثقة ({simulatorResult.wordMatch?.frequency} موضع في التنزيل)</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setModalData({
                                                    title: `شواهد المفردة: «${simulatorResult.clean}»`,
                                                    subtitle: `معادلة الميزان: (${simulatorResult.equation})`,
                                                    equation: simulatorResult.equation,
                                                    occurrences: simulatorResult.wordMatch!.occurrences
                                                })}
                                                className="underline font-bold cursor-pointer"
                                            >
                                                عرض الآيات
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                                            <div className="font-bold">المفردة «{simulatorResult.clean}» غير واردة بهذا اللفظ المجرد في القرآن الكريم.</div>
                                            {simulatorResult.equationInQuran ? (
                                                <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                                                    ولكن معادلة الميزان ({simulatorResult.equation}) متحققة عبر مفردات قرآنية أخرى: {simulatorResult.matchingEquation?.words.map(w => `«${w.word}»`).join('، ')}.
                                                </p>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs space-y-2">
                                <div>{simulatorResult.message}</div>
                                {simulatorResult.canSwitch && simulatorResult.detectedChar && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectBalanceLetter(simulatorResult.detectedChar!)}
                                        className="px-3.5 py-1.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
                                    >
                                        <span>التبديل فوراً إلى ميزان ({simulatorResult.detectedName} - {simulatorResult.detectedChar})</span>
                                        <span>⟵</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 6. Verses Showcase Modal / Drawer */}
            {modalData && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
                    onClick={() => setModalData(null)}
                >
                    <div 
                        className="bg-surface border border-border-default rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-border-default flex items-center justify-between gap-3 bg-surface-subtle">
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-text-primary">
                                    {modalData.title}
                                </h3>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {modalData.subtitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalData(null)}
                                className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover border border-border-default text-text-muted hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Verses List */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-border-subtle">
                            {modalData.occurrences.map((occ, idx) => {
                                // Highlight word in text
                                const words = occ.ayahText.split(/\s+/);

                                return (
                                    <div key={`${occ.surahNumber}-${occ.ayahNumber}-${idx}`} className="pt-3 first:pt-0 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-primary">
                                                    سورة {occ.surahName}
                                                </span>
                                                <span className="text-text-muted font-mono">
                                                    الآية {occ.ayahNumber}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`#/surah/${occ.surahNumber}?ayah=${occ.ayahNumber}`}
                                                    className="text-[11px] text-text-muted hover:text-primary hover:underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    فتح في المصحف ⟵
                                                </a>
                                            </div>
                                        </div>

                                        <p className="font-quran text-lg sm:text-xl text-text-primary leading-loose text-justify">
                                            {words.map((w, wIdx) => {
                                                const cleanW = w.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06EDـ]/g, '').trim();
                                                const isTarget = cleanW === occ.matchedWord || cleanW.startsWith(occ.matchedWord) || cleanW.includes(occ.matchedWord);

                                                return (
                                                    <span 
                                                        key={wIdx} 
                                                        className={isTarget ? 'text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-1 rounded' : ''}
                                                    >
                                                        {w}{' '}
                                                    </span>
                                                );
                                            })}
                                            <span className="text-amber-700 dark:text-amber-400 text-sm mx-1">
                                                ﴿{occ.ayahNumber}﴾
                                            </span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border-default bg-surface-subtle flex items-center justify-between text-xs">
                            <span className="text-text-muted">
                                إجمالي الشواهد المعروضة: {modalData.occurrences.length} موضع
                            </span>
                            <button
                                type="button"
                                onClick={() => setModalData(null)}
                                className="px-4 py-1.5 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary font-bold cursor-pointer"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Export & AI Preview Modal */}
            {isExportModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
                    onClick={() => setIsExportModalOpen(false)}
                >
                    <div 
                        className="bg-surface border border-border-default rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 sm:p-5 border-b border-border-default flex items-center justify-between gap-3 bg-surface-subtle">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    <h3 className="font-bold text-base sm:text-lg text-text-primary">
                                        معاينة وتصدير نتائج ميزان {analysis.balanceLetterName} ({analysis.balanceLetter}) للذكاء الاصطناعي
                                    </h3>
                                </div>
                                <p className="text-xs text-text-muted mt-0.5">
                                    اختر الصيغة المناسبة وانسخ كامل التقرير بنقرة زر واحدة أو قم بتحميله كملف
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExportModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface hover:bg-surface-hover border border-border-default text-text-muted hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Format Selector Pills Bar */}
                        <div className="p-3 sm:p-4 border-b border-border-subtle bg-surface flex items-center gap-2 overflow-x-auto select-none">
                            <span className="text-xs font-bold text-text-muted whitespace-nowrap pl-1">
                                صيغة التصدير:
                            </span>

                            <button
                                type="button"
                                onClick={() => setExportModalFormat('ai')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    exportModalFormat === 'ai'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover border border-border-default'
                                }`}
                            >
                                <span>🤖</span>
                                <span>مهيأ للذكاء الاصطناعي (Prompt + تقرير)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportModalFormat('markdown')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    exportModalFormat === 'markdown'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover border border-border-default'
                                }`}
                            >
                                <span>📄</span>
                                <span>تقرير Markdown شامل</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportModalFormat('json')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    exportModalFormat === 'json'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover border border-border-default'
                                }`}
                            >
                                <span className="font-mono">{'{}'}</span>
                                <span>بيانات JSON مهيكلة</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setExportModalFormat('noorani')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                    exportModalFormat === 'noorani'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface-subtle text-text-secondary hover:bg-surface-hover border border-border-default'
                                }`}
                            >
                                <span>✨</span>
                                <span>شبكة الـ 14 حرفاً فقط</span>
                            </button>
                        </div>

                        {/* Format Info & Stats Bar */}
                        <div className="px-4 py-2 bg-surface-subtle border-b border-border-subtle flex items-center justify-between flex-wrap gap-2 text-[11px] text-text-muted">
                            <div className="flex items-center gap-3">
                                <span>
                                    عدد الكلمات: <strong className="text-text-primary font-mono">{exportPreviewContent.split(/\s+/).filter(Boolean).length.toLocaleString()}</strong> كلمة
                                </span>
                                <span>•</span>
                                <span>
                                    عدد المحارف: <strong className="text-text-primary font-mono">{exportPreviewContent.length.toLocaleString()}</strong> حرف
                                </span>
                            </div>

                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                                {exportModalFormat === 'ai' && '💡 يتضمن توجيهاً دقيقاً لـ ChatGPT / Claude / Gemini لتحليل العلاقات'}
                                {exportModalFormat === 'markdown' && '💡 منسق بـ Markdown مع جداول واقتباسات علمية'}
                                {exportModalFormat === 'json' && '💡 كائنات JSON مصفوفية مهيكلة وجاهزة للتحليل البرمجي'}
                                {exportModalFormat === 'noorani' && '💡 خلاصة شبكة الحروف النورانية الـ 14 وما يقابلها فقط'}
                            </span>
                        </div>

                        {/* Code / Text Preview Viewport */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-mono text-xs select-all leading-relaxed whitespace-pre-wrap rounded-b-none border-b border-slate-800">
                            {exportPreviewContent}
                        </div>

                        {/* Modal Action Footer */}
                        <div className="p-4 border-t border-border-default bg-surface-subtle flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (exportModalFormat === 'ai') handleCopyAiPrompt();
                                        else if (exportModalFormat === 'markdown') handleCopyFullReport();
                                        else if (exportModalFormat === 'json') handleCopyJsonData();
                                        else handleCopyNooraniFullNetwork();
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                    {copiedFormat ? (
                                        <CheckIcon className="w-4 h-4 text-white" />
                                    ) : (
                                        <CopyIcon className="w-4 h-4 text-white" />
                                    )}
                                    <span>
                                        {copiedFormat ? 'تم نسخ النص إلى الحافظة بنجاح!' : 'نسخ هذا النص كاملاً إلى الحافظة (Copy)'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDownloadExport(exportModalFormat)}
                                    className="px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-default text-text-secondary hover:text-primary font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="تحميل النص كملف"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>تحميل كملف</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsExportModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-xl text-xs font-bold border border-slate-700 flex items-center gap-2 animate-fade-in">
                    <CheckIcon className="w-4 h-4 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
};

export default MizanWawView;
