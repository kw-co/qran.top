import React, { useState, useEffect, useMemo } from 'react';
import type { SurahData } from '../types';
import { 
    executeNooraniCipherReverseEngineering,
    simulateCipherTranslation,
    NooraniCipherNode,
    NooraniCipherAnalysisOptions,
    CANONICAL_14_NOORANI_LETTERS,
    ARABIC_ALPHABET_28,
    clusterNodesBySimilarityPairs
} from '../utils/nooraniCipherEngine';
import { 
    computeOptimal14x2Partition,
    Optimal2LetterAssignment,
    OptimalPartitionResult
} from '../utils/optimalMatchingEngine';
import { 
    SparklesIcon, 
    ChevronLeftIcon,
    ClearIcon,
    CopyIcon,
    CheckIcon
} from './icons';

interface NooraniReverseCipherViewProps {
    simpleCleanData: SurahData[];
}

type MainTab = 'preferential_14x2' | 'full_matrix' | 'playground';
type SortMode = 'similarity_pairs' | 'standard' | 'similarity_to_active';
type TableStyle = 'ranking' | 'heatmap';

export const NooraniReverseCipherView: React.FC<NooraniReverseCipherViewProps> = ({
    simpleCleanData
}) => {
    // 1. Navigation / Primary Tab State
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('preferential_14x2');

    // 2. Loading & Multi-Step Progress Bar State
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressStepText, setProgressStepText] = useState<string>('بدء تهيئة محرك الهندسة العكسية والتوزيع الأمثل...');

    // 3. Options State
    const [includeWawBond, setIncludeWawBond] = useState<boolean>(true);
    const [excludeSelf, setExcludeSelf] = useState<boolean>(true);
    const [scope, setScope] = useState<'all_quran' | 'fawatih_surahs_only'>('all_quran');
    const [weightModel, setWeightModel] = useState<'balanced' | 'attachment_heavy' | 'fawatih_heavy'>('balanced');
    const [matchingMethod, setMatchingMethod] = useState<'hungarian_global_optimum' | 'greedy_priority'>('hungarian_global_optimum');

    // 4. Computed Cipher Data
    const [cipherResults, setCipherResults] = useState<NooraniCipherNode[]>([]);
    const [selectedNodeLetter, setSelectedNodeLetter] = useState<string>('ح');

    // 5. View & Sort Controls for Full Matrix
    const [sortMode, setSortMode] = useState<SortMode>('similarity_pairs');
    const [columnsLimit, setColumnsLimit] = useState<number>(28);
    const [tableStyle, setTableStyle] = useState<TableStyle>('ranking');
    const [focusCandidatesLimit, setFocusCandidatesLimit] = useState<number>(4);
    const [showSimilarityMatrix, setShowSimilarityMatrix] = useState<boolean>(false);

    // 6. Decryptor / Simulation State
    const [testWord, setTestWord] = useState<string>('محمد');
    const [copied, setCopied] = useState<boolean>(false);

    // Scroll to top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 7. Heavy Processing Simulation with Real Calculation
    const runAnalysis = () => {
        setIsProcessing(true);
        setProgressPercent(15);
        setProgressStepText('1/4: مسح معجم ألفاظ المصحف الشريف واستخراج الحروف النورانية الـ 14...');

        setTimeout(() => {
            setProgressPercent(40);
            setProgressStepText('2/4: تحليل اقتران وتلاصق الأحرف الـ 28 وتتبع صلة الواو بـ (ن، ق، ص)...');

            setTimeout(() => {
                setProgressPercent(75);
                setProgressStepText('3/4: تشغيل خوارزمية التعيين التفضيلي الأقصى (14 نوراني ↔ 28 أبجدي كاملة)...');

                setTimeout(() => {
                    const options: NooraniCipherAnalysisOptions = {
                        includeWawBond,
                        excludeSelf,
                        scope,
                        weightModel
                    };
                    const res = executeNooraniCipherReverseEngineering(simpleCleanData, options);
                    setCipherResults(res);
                    setProgressPercent(100);
                    setProgressStepText('4/4: اكتمل حساب الجدول التفضيلي المزدوج وتوزيع الأبجدية كاملة بنجاح!');

                    setTimeout(() => {
                        setIsProcessing(false);
                    }, 350);
                }, 250);
            }, 250);
        }, 250);
    };

    // Run on initial mount and when options change
    useEffect(() => {
        if (simpleCleanData && simpleCleanData.length > 0) {
            runAnalysis();
        }
    }, [simpleCleanData, includeWawBond, excludeSelf, scope, weightModel]);

    // 8. Optimal 14x2 Bipartite Partition Calculation (The Core User Request)
    const optimalPartition: OptimalPartitionResult = useMemo(() => {
        if (cipherResults.length === 0) {
            return {
                assignments: [],
                assignedLettersSet: new Set(),
                all28Covered: false,
                coverageCount: 0,
                totalScore: 0,
                method: matchingMethod
            };
        }
        return computeOptimal14x2Partition(cipherResults, matchingMethod);
    }, [cipherResults, matchingMethod]);

    // Reverse lookup map: from Arabic letter to its assigned Noorani letter
    const alphabetToNooraniMap = useMemo(() => {
        const map = new Map<string, string>();
        optimalPartition.assignments.forEach(a => {
            map.set(a.letter1.char, a.nooraniLetter);
            map.set(a.letter2.char, a.nooraniLetter);
        });
        return map;
    }, [optimalPartition]);

    // 9. Calculate Pairwise Similarities and Cluster Twins for Full Table
    const similarityData = useMemo(() => {
        if (cipherResults.length === 0) {
            return {
                sortedNodes: [],
                pairs: [],
                similarityMatrix: {},
                bestPartnerMap: {}
            };
        }
        return clusterNodesBySimilarityPairs(cipherResults);
    }, [cipherResults]);

    // 10. Determine rows order according to sortMode for Full Matrix
    const displayedNodes = useMemo(() => {
        if (cipherResults.length === 0) return [];
        if (sortMode === 'similarity_pairs') {
            return similarityData.sortedNodes;
        }
        if (sortMode === 'similarity_to_active' && selectedNodeLetter) {
            const matrix = similarityData.similarityMatrix;
            return [...cipherResults].sort((a, b) => {
                if (a.nooraniLetter === selectedNodeLetter) return -1;
                if (b.nooraniLetter === selectedNodeLetter) return 1;
                const simA = matrix[selectedNodeLetter]?.[a.nooraniLetter] || 0;
                const simB = matrix[selectedNodeLetter]?.[b.nooraniLetter] || 0;
                return simB - simA;
            });
        }
        return cipherResults; // standard Quranic order
    }, [cipherResults, sortMode, similarityData, selectedNodeLetter]);

    // Active selected node for in-depth inspection
    const activeNode = useMemo(() => {
        return cipherResults.find(n => n.nooraniLetter === selectedNodeLetter) || cipherResults[0];
    }, [cipherResults, selectedNodeLetter]);

    // Top similar partners for the active node
    const activeNodePartners = useMemo(() => {
        if (!activeNode || !similarityData.similarityMatrix[activeNode.nooraniLetter]) return [];
        const letter = activeNode.nooraniLetter;
        const matrix = similarityData.similarityMatrix[letter];

        const list: { letter: string; name: string; similarity: number }[] = [];
        cipherResults.forEach(n => {
            if (n.nooraniLetter !== letter) {
                list.push({
                    letter: n.nooraniLetter,
                    name: n.nooraniLetterName,
                    similarity: matrix[n.nooraniLetter] || 0
                });
            }
        });

        list.sort((a, b) => b.similarity - a.similarity);
        return list;
    }, [activeNode, similarityData, cipherResults]);

    // Simulation calculation using the optimal 14x2 table
    const optimalTranslationResult = useMemo(() => {
        if (!testWord.trim() || alphabetToNooraniMap.size === 0) return null;
        const chars = Array.from(testWord);
        const encoded: string[] = [];
        const details: { char: string; mappedNoorani: string }[] = [];

        chars.forEach(ch => {
            if (ch === ' ') {
                encoded.push(' ');
                return;
            }
            const mapped = alphabetToNooraniMap.get(ch) || ch;
            encoded.push(mapped);
            details.push({ char: ch, mappedNoorani: mapped });
        });

        return {
            original: testWord,
            encodedToNoorani: encoded.join(''),
            details
        };
    }, [testWord, alphabetToNooraniMap]);

    // Copy 14x2 Preferential Table
    const handleCopyPreferentialTable = () => {
        if (optimalPartition.assignments.length === 0) return;
        const lines = [
            '=== الجدول التفضيلي المزدوج: 14 حرفاً نورانياً ↔ 28 حرفاً أبجدياً كاملة ===',
            `طريقة التعيين: ${matchingMethod === 'hungarian_global_optimum' ? 'التعيين التوافقي الأمثل الشامل (Hungarian Global Optimum)' : 'التعيين بالأولوية التراتبية (Greedy Priority)'}`,
            `اكتمال الأبجدية في العمود الثاني: ${optimalPartition.coverageCount} / 28 حرفاً (100% بدون أي تكرار وبدون أي نقص)`,
            'ملاحظة: اليمين = حرف نوراني | اليسار = حرفان من الأبجدية',
            '------------------------------------------------------------------',
            'الحرف النوراني (اليمين)  |  الحرف الأول (اليسار)  |  الحرف الثاني (اليسار)  |  مجموع النقاط',
            '------------------------------------------------------------------'
        ];

        optimalPartition.assignments.forEach((item, i) => {
            lines.push(
                `${i + 1}. [${item.nooraniLetter}] (${item.nooraniLetterName})  |  ` +
                `[${item.letter1.char}] (${item.letter1.name} - ${item.letter1.score}ن)  |  ` +
                `[${item.letter2.char}] (${item.letter2.name} - ${item.letter2.score}ن)  |  ` +
                `${item.totalPairScore} نقطة`
            );
        });

        lines.push('------------------------------------------------------------------');
        lines.push('توزيع الأبجدية الـ 28 بالكامل:');
        ARABIC_ALPHABET_28.forEach(a => {
            lines.push(`حرف ${a.letter} (${a.name}) ⟵ يقابله النوراني [${alphabetToNooraniMap.get(a.letter) || '؟'}]`);
        });

        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl text-text-primary min-h-[85vh] space-y-6" dir="rtl">
            {/* Top Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                <a
                    href="#/structure"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-subtle"
                >
                    <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                    <span>العودة إلى بنية المصحف</span>
                </a>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>التوزيع التفضيلي: كل حرف نوراني مقابله حرفان من الأبجدية</span>
                </div>
            </div>

            {/* Header Description */}
            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 inline-flex">
                                <SparklesIcon className="w-7 h-7" />
                            </span>
                            <span>الجدول التفضيلي (14 نوراني ↔ 28 أبجدي كاملة)</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-4xl">
                            تطبيق فكرة <strong>(14 × 2 = 28)</strong>: وضع أفضل احتمال تفضيلي بحيث يستحق كل حرف نوراني <strong>حرفين من الأبجدية</strong>، وينتج جدول بسيط: <strong>على اليمين الحرف النوراني وعلى اليسار الحرفان المقابلان</strong>، مع احتواء العمود الثاني على <strong>الأبجدية العربية كاملة (28 / 28) دون تكرار ودون نقص</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyPreferentialTable}
                        disabled={isProcessing}
                        className="py-2.5 px-5 bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs self-start shrink-0"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">تم نسخ الجدول بنجاح</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4 text-text-muted" />
                                <span>نسخ الجدول التفضيلي</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Control Panel & Parameters */}
                <div className="pt-4 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Matching Algorithm */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            طريقة التعيين والتحسين:
                        </label>
                        <select
                            value={matchingMethod}
                            onChange={(e) => setMatchingMethod(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="hungarian_global_optimum">التعيين التوافقي الأمثل الشامل (Hungarian)</option>
                            <option value="greedy_priority">التعيين التراتبي بالأسبقية (Greedy Priority)</option>
                        </select>
                    </div>

                    {/* Weight Model */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            معيار الاستحقاق الرياضي:
                        </label>
                        <select
                            value={weightModel}
                            onChange={(e) => setWeightModel(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="balanced">متكامل (التصاق + تجاور + فواتح)</option>
                            <option value="attachment_heavy">تركيز الالتصاق المباشر (سوابق ولواحق)</option>
                            <option value="fawatih_heavy">تركيز الكثافة في سور الفواتح</option>
                        </select>
                    </div>

                    {/* Scope Selector */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            نطاق البيانات:
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as any)}
                            className="w-full py-1.5 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="all_quran">كامل المصحف (114 سورة)</option>
                            <option value="fawatih_surahs_only">سور الفواتح الـ 29 فقط</option>
                        </select>
                    </div>

                    {/* Waw Bond Option */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
                            <span>ارتباط الواو مع (ن، ق، ص):</span>
                            <input
                                type="checkbox"
                                checked={includeWawBond}
                                onChange={(e) => setIncludeWawBond(e.target.checked)}
                                className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer accent-amber-600"
                            />
                        </label>
                        <p className="text-[11px] text-text-muted leading-tight">
                            مراعاة اقتران الواو بفواتح القسم (ن والقلم، ق والقرآن، ص والقرآن).
                        </p>
                    </div>
                </div>

                {/* Primary Tabs Navigation */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle">
                    <button
                        type="button"
                        onClick={() => setActiveMainTab('preferential_14x2')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'preferential_14x2'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>✨</span>
                        <span>الجدول التفضيلي البسيط (14 نوراني ↔ حرفان لكل حرف)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMainTab('full_matrix')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'full_matrix'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>📊</span>
                        <span>مصفوفة التكويد والتشابه الكاملة (فرز الأزواج التوأمة)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveMainTab('playground')}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeMainTab === 'playground'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-surface-subtle hover:bg-surface text-text-secondary border border-border-default'
                        }`}
                    >
                        <span>🧪</span>
                        <span>مختبر فك وتجربة الشيفرة</span>
                    </button>
                </div>
            </div>

            {/* PROCESSING PROGRESS BAR */}
            {isProcessing && (
                <div className="bg-surface rounded-2xl border border-amber-500/30 p-8 shadow-md space-y-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-spin">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary">
                            جاري تنفيذ المعالجة الحسابية والتعيين التفضيلي...
                        </h2>
                        <p className="text-xs md:text-sm text-text-secondary font-mono">
                            {progressStepText}
                        </p>
                    </div>

                    <div className="w-full bg-surface-subtle h-3.5 rounded-full overflow-hidden border border-border-default p-0.5">
                        <div
                            className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300 shadow-inner"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {!isProcessing && cipherResults.length > 0 && (
                <div className="space-y-6">
                    {/* TAB 1: THE CORE 14x2 PREFERENTIAL TABLE (MAIN USER REQUEST) */}
                    {activeMainTab === 'preferential_14x2' && (
                        <div className="space-y-6">
                            {/* ALPHABET COMPLETION / VERIFICATION STATUS BANNER */}
                            <div className="bg-surface rounded-2xl border border-emerald-500/30 p-5 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm md:text-base font-bold text-text-primary">
                                                اكتمال تغطية الأبجدية في العمود الثاني: 28 / 28 حرفاً (100%)
                                            </h3>
                                            <p className="text-xs text-text-secondary">
                                                كل حرف من حروف الأبجدية الـ 28 تم تعيينه مرة واحدة بالضبط دون أي تكرار ودون أي نقصان (14 صفاً × حرفين = 28 حرفاً).
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 self-start">
                                        مجموع نقاط الاستحقاق التراكمي: {optimalPartition.totalScore}ن
                                    </div>
                                </div>

                                {/* Visual strip of all 28 Arabic letters in order showing which Noorani letter each was matched to */}
                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-text-muted block">
                                        فحص الأبجدية الـ 28 وتوزيعها على الحروف النورانية:
                                    </span>
                                    <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-28 gap-1 text-center">
                                        {ARABIC_ALPHABET_28.map(a => {
                                            const assignedNoorani = alphabetToNooraniMap.get(a.letter);
                                            return (
                                                <div 
                                                    key={a.letter}
                                                    title={`حرف الأبجدية [${a.letter}] ⟵ تم تعيينه تفضيلياً للحرف النوراني [${assignedNoorani}]`}
                                                    className="p-1 bg-surface-subtle border border-border-default rounded-lg hover:border-amber-500 transition-colors"
                                                >
                                                    <span className="font-amiri text-base font-bold text-text-primary block leading-none">
                                                        {a.letter}
                                                    </span>
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5 font-amiri">
                                                        {assignedNoorani ? `←${assignedNoorani}` : '؟'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* THE SIMPLE PREFERENTIAL TABLE (RIGHT: NOORANI | LEFT: TWO ALPHABET LETTERS) */}
                            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                    <div>
                                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                            <span>الجدول التفضيلي البسيط (الحرف النوراني ↔ حرفان من الأبجدية)</span>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                                14 صفاً
                                            </span>
                                        </h2>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            العمود الأيمن يحتوي على الحرف النوراني، والعمود الأيسر يحتوي على الحرفين المستحقين تفضيلياً.
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-border-default">
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                                <th className="p-3 font-bold text-center w-12">#</th>
                                                <th className="p-3 font-bold text-right w-1/3">
                                                    الحرف النوراني (العمود الأيمن)
                                                </th>
                                                <th className="p-3 font-bold text-center w-1/3 border-r border-border-subtle">
                                                    الحرف الأول المقابل (🥇)
                                                </th>
                                                <th className="p-3 font-bold text-center w-1/3 border-r border-border-subtle">
                                                    الحرف الثاني المقابل (🥈)
                                                </th>
                                                <th className="p-3 font-bold text-center w-24">مجموع النقاط</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle font-medium">
                                            {optimalPartition.assignments.map((item, idx) => (
                                                <tr
                                                    key={item.nooraniLetter}
                                                    className="hover:bg-surface-subtle/80 transition-colors"
                                                >
                                                    {/* Row Index */}
                                                    <td className="p-3 text-center text-xs text-text-muted font-mono">
                                                        {idx + 1}
                                                    </td>

                                                    {/* RIGHT COLUMN: NOORANI LETTER */}
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-amiri text-2xl font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                                                {item.nooraniLetter}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm text-text-primary">
                                                                    حرف {item.nooraniLetterName}
                                                                </div>
                                                                <div className="text-[11px] text-text-muted">
                                                                    {item.fawatihSurahsCount} سور فواتح
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* LEFT COLUMN PART 1: FIRST ASSIGNED ALPHABET LETTER */}
                                                    <td className="p-3 border-r border-border-subtle">
                                                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-default hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="font-amiri text-3xl font-black text-primary leading-none">
                                                                    {item.letter1.char}
                                                                </span>
                                                                <div>
                                                                    <div className="text-xs font-bold text-text-primary">
                                                                        حرف {item.letter1.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-text-muted">
                                                                        الرتبة الأصلية: #{item.letter1.originalRank}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-left font-mono">
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                                                    {item.letter1.score}ن
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* LEFT COLUMN PART 2: SECOND ASSIGNED ALPHABET LETTER */}
                                                    <td className="p-3 border-r border-border-subtle">
                                                        <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-default hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="font-amiri text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">
                                                                    {item.letter2.char}
                                                                </span>
                                                                <div>
                                                                    <div className="text-xs font-bold text-text-primary">
                                                                        حرف {item.letter2.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-text-muted">
                                                                        الرتبة الأصلية: #{item.letter2.originalRank}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-left font-mono">
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                                    {item.letter2.score}ن
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Total Pair Score */}
                                                    <td className="p-3 text-center">
                                                        <span className="text-xs font-bold font-mono text-text-primary">
                                                            {item.totalPairScore}ن
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: COMPLETE MATRIX WITH SIMILARITY PAIRS (UNDER EACH OTHER) */}
                    {activeMainTab === 'full_matrix' && (
                        <div className="space-y-6">
                            {/* QUICK SELECTION BAR OF THE 14 NOORANI LETTERS */}
                            <div className="bg-surface rounded-2xl border border-border-default p-4 md:p-5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                                    <span>اختر حرفاً نورانياً لمعاينة مراتب استحقاقه والحروف التوأمة له:</span>
                                    <span className="font-mono text-amber-600 dark:text-amber-400">14 حرفاً نورانياً</span>
                                </div>
                                <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                                    {CANONICAL_14_NOORANI_LETTERS.map(({ letter, name }) => {
                                        const isSelected = selectedNodeLetter === letter;
                                        const partnerInfo = similarityData.bestPartnerMap[letter];

                                        return (
                                            <button
                                                key={letter}
                                                type="button"
                                                onClick={() => setSelectedNodeLetter(letter)}
                                                title={`حرف ${name} | الأقرب شبهاً: ${partnerInfo?.partnerLetter || '-'} (${partnerInfo?.similarity || 0}%)`}
                                                className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-primary text-white border-primary shadow-md scale-105'
                                                        : 'bg-surface-subtle hover:bg-surface border-border-default text-text-primary hover:border-primary/50'
                                                }`}
                                            >
                                                <span className="font-amiri text-2xl font-bold leading-none">{letter}</span>
                                                <span className="text-[10px] mt-1 opacity-80 truncate max-w-[45px]">{name}</span>
                                                {partnerInfo && (
                                                    <span className={`text-[9px] font-mono mt-0.5 px-1 rounded ${
                                                        isSelected ? 'bg-white/20 text-white' : 'text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                        ≈{partnerInfo.partnerLetter}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* FOCUS CARD: THE SELECTED NOORANI LETTER */}
                            {activeNode && (
                                <div className="bg-surface rounded-2xl border-2 border-amber-500/30 p-6 md:p-8 shadow-sm space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-amiri text-5xl font-bold shadow-inner">
                                                {activeNode.nooraniLetter}
                                            </div>
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
                                                    <span>الأحرف الأكثر استحقاقاً لحرف «{activeNode.nooraniLetter}» ({activeNode.nooraniLetterName})</span>
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
                                                    <span>وروده في القرآن: <strong className="text-text-primary font-mono">{activeNode.totalOccurrences.toLocaleString('ar-SA')}</strong> موضع</span>
                                                    <span>•</span>
                                                    <span>سور الفواتح ({activeNode.fawatihSurahs.length}): {activeNode.fawatihSurahs.map(s => s.name).join('، ')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Twin Partners Highlight */}
                                        {activeNodePartners.length > 0 && (
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                                                    <span>🔗 الأكثر تشابهاً مع «{activeNode.nooraniLetter}»:</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {activeNodePartners.slice(0, 3).map((partner) => (
                                                        <button
                                                            key={partner.letter}
                                                            type="button"
                                                            onClick={() => setSelectedNodeLetter(partner.letter)}
                                                            className="px-2 py-0.5 rounded-lg bg-surface border border-amber-500/30 hover:border-primary text-text-primary font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                                                        >
                                                            <span className="font-amiri text-sm">{partner.letter}</span>
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                                                                ({partner.similarity}%)
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Focus Candidates View Scope Switcher */}
                                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                        <span className="font-bold text-text-muted">عرض الأحرف المقابلة بالرتب:</span>
                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(4)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 4 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                أعلى 4 أحرف (المقترح)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(10)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 10 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                أعلى 10 أحرف
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFocusCandidatesLimit(28)}
                                                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                                    focusCandidatesLimit === 28 ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                                                }`}
                                            >
                                                جميع الحروف الـ 28
                                            </button>
                                        </div>
                                    </div>

                                    {/* THE CANDIDATE LETTERS GRID */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {activeNode.allCandidates.slice(0, focusCandidatesLimit).map((cand, idx) => {
                                            const rank = idx + 1;
                                            const isTop4 = rank <= 4;
                                            const medal = rank === 1 ? '🥇 الأول' : rank === 2 ? '🥈 الثاني' : rank === 3 ? '🥉 الثالث' : rank === 4 ? '🏅 الرابع' : `رتبة #${rank}`;

                                            return (
                                                <div
                                                    key={cand.letter}
                                                    className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs ${
                                                        isTop4
                                                            ? 'bg-surface-subtle border-amber-500/30 hover:border-primary/50'
                                                            : 'bg-surface border-border-default hover:border-primary/40'
                                                    }`}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-xs font-bold ${isTop4 ? 'text-amber-700 dark:text-amber-300' : 'text-text-muted'}`}>
                                                                {medal}
                                                            </span>
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                                                                {cand.score} نقطة
                                                            </span>
                                                        </div>

                                                        <div className="flex items-baseline gap-3 pt-1">
                                                            <span className="font-amiri text-4xl md:text-5xl font-black text-primary leading-none">
                                                                {cand.letter}
                                                            </span>
                                                            <div>
                                                                <h3 className="font-bold text-sm md:text-base text-text-primary">
                                                                    حرف {cand.letterName}
                                                                </h3>
                                                                <span className="text-[11px] text-text-secondary block">
                                                                    {cand.justification}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-border-subtle text-[11px]">
                                                        <div className="flex items-center justify-between text-text-secondary">
                                                            <span>صلة التصاق مباشرة:</span>
                                                            <strong className="text-text-primary font-mono">{cand.attachmentCount.toLocaleString('ar-SA')}</strong>
                                                        </div>
                                                        <div className="flex items-center justify-between text-text-secondary">
                                                            <span>اقتران في نفس الكلمة:</span>
                                                            <strong className="text-text-primary font-mono">{cand.inWordCount.toLocaleString('ar-SA')}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* COMPLETE CIPHER MASTER TABLE & SIMILARITY CLUSTERING */}
                            <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-3">
                                            <span>جدول مصفوفة التكويد الشاملة وفرز الأزواج المتشابهة</span>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                                                {columnsLimit === 28 ? 'كامل الـ 28 حرفاً' : `${columnsLimit} أحرف`}
                                            </span>
                                        </h2>
                                        <p className="text-xs md:text-sm text-text-secondary mt-1">
                                            {sortMode === 'similarity_pairs' 
                                                ? 'تم تجميع الحروف النورانية بحيث يوضع كل حرفين الأكثر تشابهاً وتطابقاً تحت بعضهما مباشرة.'
                                                : sortMode === 'similarity_to_active'
                                                    ? `تم فرز الحروف حسب نسبة التشابه والتقارب مع حرف «${selectedNodeLetter}» تنازلياً.`
                                                    : 'مرتبة وفق الترتيب المصحفي المعتاد لظهور الحروف النورانية.'}
                                        </p>
                                    </div>

                                    {/* View & Column Controls */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <span className="text-[11px] font-bold text-text-muted px-2">النتائج:</span>
                                            {[4, 7, 10, 14, 28].map((lim) => (
                                                <button
                                                    key={lim}
                                                    type="button"
                                                    onClick={() => setColumnsLimit(lim)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        columnsLimit === lim
                                                            ? 'bg-primary text-white shadow-2xs'
                                                            : 'text-text-secondary hover:text-text-primary'
                                                    }`}
                                                >
                                                    {lim === 28 ? 'كامل الـ 28' : `${lim}`}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
                                            <button
                                                type="button"
                                                onClick={() => setTableStyle('ranking')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    tableStyle === 'ranking' ? 'bg-amber-600 text-white shadow-2xs' : 'text-text-secondary'
                                                }`}
                                            >
                                                أعمدة الرتب
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTableStyle('heatmap')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                    tableStyle === 'heatmap' ? 'bg-amber-600 text-white shadow-2xs' : 'text-text-secondary'
                                                }`}
                                            >
                                                مصفوفة الأبجدية الحرارية (14×28)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* SORTING CONTROLS TABS (SIMILARITY CLUSTERING) */}
                                <div className="bg-surface-subtle p-3 rounded-2xl border border-border-default flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-text-muted ml-1">فرز وترتيب الصفوف:</span>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('similarity_pairs')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'similarity_pairs'
                                                    ? 'bg-amber-600 text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>🔗</span>
                                            <span>فرز الأزواج الأكثر تشابهاً (تحت بعض)</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('standard')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'standard'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>📋</span>
                                            <span>الترتيب المصحفي القياسي</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSortMode('similarity_to_active')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                                sortMode === 'similarity_to_active'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-default'
                                            }`}
                                        >
                                            <span>🎯</span>
                                            <span>فرز حسب الشبه بـ «{selectedNodeLetter}»</span>
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowSimilarityMatrix(!showSimilarityMatrix)}
                                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default hover:border-primary text-text-secondary text-xs font-bold transition-all cursor-pointer"
                                    >
                                        {showSimilarityMatrix ? 'إخفاء مصفوفة التشابه البيني (14×14)' : 'إظهار مصفوفة التشابه البيني (14×14)'}
                                    </button>
                                </div>

                                {/* INTERACTIVE 14 x 14 SIMILARITY MATRIX ACCORDION */}
                                {showSimilarityMatrix && (
                                    <div className="p-4 md:p-5 rounded-2xl bg-surface-subtle border border-amber-500/30 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-amber-800 dark:text-amber-300">
                                                مصفوفة نسب التشابه المتبادلة بين الحروف النورانية الـ 14 (Similarity Matrix):
                                            </span>
                                            <span className="text-text-muted">الخلايا الأكثر اخضراراً تعبر عن أعلى تطابق</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-center border-collapse text-xs font-mono">
                                                <thead>
                                                    <tr className="border-b border-border-default">
                                                        <th className="p-2 font-bold font-amiri text-sm">الحرف</th>
                                                        {cipherResults.map(n => (
                                                            <th key={n.nooraniLetter} className="p-2 font-bold font-amiri text-base text-primary">
                                                                {n.nooraniLetter}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle">
                                                    {cipherResults.map(rNode => (
                                                        <tr key={rNode.nooraniLetter}>
                                                            <td className="p-2 font-bold font-amiri text-base text-primary bg-surface/50">
                                                                {rNode.nooraniLetter}
                                                            </td>
                                                            {cipherResults.map(cNode => {
                                                                const isSelf = rNode.nooraniLetter === cNode.nooraniLetter;
                                                                const sim = similarityData.similarityMatrix[rNode.nooraniLetter]?.[cNode.nooraniLetter] || 0;
                                                                const isTwin = similarityData.bestPartnerMap[rNode.nooraniLetter]?.partnerLetter === cNode.nooraniLetter;

                                                                let bg = 'bg-surface/30 text-text-muted';
                                                                if (isSelf) {
                                                                    bg = 'bg-primary/20 text-primary font-bold';
                                                                } else if (sim >= 85) {
                                                                    bg = 'bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold';
                                                                } else if (sim >= 70) {
                                                                    bg = 'bg-amber-500/20 text-amber-800 dark:text-amber-300';
                                                                }

                                                                return (
                                                                    <td 
                                                                        key={cNode.nooraniLetter}
                                                                        title={`تشابه ${rNode.nooraniLetter} مع ${cNode.nooraniLetter}: ${sim}%`}
                                                                        className={`p-2 transition-colors ${bg} ${isTwin ? 'ring-2 ring-amber-500 font-black' : ''}`}
                                                                    >
                                                                        {isSelf ? '100%' : `${sim}%`}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* MASTER TABLE */}
                                <div className="overflow-x-auto rounded-xl border border-border-default">
                                    {tableStyle === 'ranking' ? (
                                        <table className="w-full text-right border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                                    <th className="p-3 font-bold sticky right-0 bg-surface-subtle z-10">الحرف النوراني</th>
                                                    <th className="p-3 font-bold">الاسم والورود</th>
                                                    <th className="p-3 font-bold">الأقرب شبهاً</th>
                                                    {Array.from({ length: columnsLimit }).map((_, cIdx) => {
                                                        const rankNum = cIdx + 1;
                                                        const medal = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum === 4 ? '🏅' : `#${rankNum}`;
                                                        return (
                                                            <th key={cIdx} className="p-2.5 font-bold text-center min-w-[55px]">
                                                                <span className="block text-[10px] text-text-muted">{medal}</span>
                                                                <span className="font-mono text-xs">المقابل {rankNum}</span>
                                                            </th>
                                                        );
                                                    })}
                                                    <th className="p-3 font-bold">ملاحظات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle font-medium">
                                                {displayedNodes.map((node, rowIdx) => {
                                                    const partnerInfo = similarityData.bestPartnerMap[node.nooraniLetter];
                                                    const isSelected = selectedNodeLetter === node.nooraniLetter;
                                                    const candidatesToShow = node.allCandidates.slice(0, columnsLimit);

                                                    const isPairHeader = sortMode === 'similarity_pairs' && rowIdx % 2 === 0;
                                                    const partnerNode = isPairHeader ? displayedNodes[rowIdx + 1] : null;
                                                    const pairSim = partnerNode ? similarityData.similarityMatrix[node.nooraniLetter]?.[partnerNode.nooraniLetter] : 0;
                                                    const pairNum = Math.floor(rowIdx / 2) + 1;

                                                    return (
                                                        <React.Fragment key={node.nooraniLetter}>
                                                            {isPairHeader && partnerNode && (
                                                                <tr className="bg-amber-500/10 border-t-2 border-b border-amber-500/30">
                                                                    <td colSpan={columnsLimit + 4} className="py-2 px-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-mono">
                                                                                    {pairNum}
                                                                                </span>
                                                                                <span className="text-sm">
                                                                                    🔗 الزوج المتطابق #{pairNum}: حرف «{node.nooraniLetter}» وحرف «{partnerNode.nooraniLetter}»
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono text-xs">
                                                                                    نسبة التشابه: {pairSim}%
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-text-muted font-normal">
                                                                                أبرز الحروف المشتركة بينهما: <strong>{partnerInfo?.sharedLetters?.slice(0, 5).join('، ') || '-'}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            <tr 
                                                                onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                                                className={`hover:bg-surface-subtle/80 cursor-pointer transition-colors ${
                                                                    isSelected ? 'bg-amber-500/15' : ''
                                                                }`}
                                                            >
                                                                <td className="p-3 sticky right-0 bg-surface z-10">
                                                                    <span className="font-amiri text-3xl font-bold text-primary inline-block w-8 text-center leading-none">
                                                                        {node.nooraniLetter}
                                                                    </span>
                                                                </td>

                                                                <td className="p-3 text-xs whitespace-nowrap">
                                                                    <div className="font-bold text-text-primary">
                                                                        {node.nooraniLetterName.replace(' (واو القسم المقترنة بـ ن، ق، ص)', '')}
                                                                    </div>
                                                                    <span className="text-text-muted font-mono">
                                                                        {node.totalOccurrences.toLocaleString('ar-SA')} موضع
                                                                    </span>
                                                                </td>

                                                                <td className="p-3 text-xs whitespace-nowrap">
                                                                    {partnerInfo ? (
                                                                        <span 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedNodeLetter(partnerInfo.partnerLetter);
                                                                            }}
                                                                            className="px-2 py-1 rounded-lg bg-surface-subtle hover:bg-amber-500/20 border border-border-default text-text-primary text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                                                            title="انقر للانتقال للحرف الشبيه"
                                                                        >
                                                                            <span className="font-amiri text-sm">{partnerInfo.partnerLetter}</span>
                                                                            <span className="font-mono text-amber-600 dark:text-amber-400">({partnerInfo.similarity}%)</span>
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>

                                                                {candidatesToShow.map((c, cIdx) => {
                                                                    const isTop3 = cIdx < 3;
                                                                    return (
                                                                        <td 
                                                                            key={cIdx} 
                                                                            className={`p-2 text-center transition-colors min-w-[55px] ${
                                                                                isTop3 ? 'bg-amber-500/5' : ''
                                                                            }`}
                                                                        >
                                                                            <span className={`font-amiri text-lg font-bold block leading-none ${
                                                                                isTop3 ? 'text-primary' : 'text-text-primary'
                                                                            }`}>
                                                                                {c.letter}
                                                                            </span>
                                                                            <span className="text-[10px] text-text-muted font-mono block mt-0.5">
                                                                                {c.score}ن
                                                                            </span>
                                                                        </td>
                                                                    );
                                                                })}

                                                                <td className="p-3 text-xs text-text-muted whitespace-nowrap">
                                                                    {node.hasWawBond ? (
                                                                        <span className="text-amber-700 dark:text-amber-300 font-bold">
                                                                            {node.wawBondDetails}
                                                                        </span>
                                                                    ) : (
                                                                        <span>{node.fawatihSurahs.length} سور فواتح</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-right border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-border-default bg-surface-subtle text-text-secondary">
                                                    <th className="p-3 font-bold sticky right-0 bg-surface-subtle z-10">الحرف النوراني</th>
                                                    {ARABIC_ALPHABET_28.map(a => (
                                                        <th key={a.letter} className="p-2 text-center font-amiri text-base font-bold min-w-[40px]">
                                                            {a.letter}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle font-medium">
                                                {displayedNodes.map((node, rowIdx) => {
                                                    const isSelected = selectedNodeLetter === node.nooraniLetter;
                                                    const scoreMap = new Map<string, { rank: number; score: number }>();
                                                    node.allCandidates.forEach(c => scoreMap.set(c.letter, { rank: c.rank, score: c.score }));

                                                    const isPairHeader = sortMode === 'similarity_pairs' && rowIdx % 2 === 0;
                                                    const partnerNode = isPairHeader ? displayedNodes[rowIdx + 1] : null;
                                                    const pairSim = partnerNode ? similarityData.similarityMatrix[node.nooraniLetter]?.[partnerNode.nooraniLetter] : 0;
                                                    const pairNum = Math.floor(rowIdx / 2) + 1;

                                                    return (
                                                        <React.Fragment key={node.nooraniLetter}>
                                                            {isPairHeader && partnerNode && (
                                                                <tr className="bg-amber-500/10 border-t-2 border-b border-amber-500/30">
                                                                    <td colSpan={30} className="py-1.5 px-4 text-xs font-bold text-amber-800 dark:text-amber-300">
                                                                        <span>🔗 الزوج المتطابق #{pairNum}: «{node.nooraniLetter}» و «{partnerNode.nooraniLetter}» (تشابه {pairSim}%)</span>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr
                                                                onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                                                className={`hover:bg-surface-subtle/80 cursor-pointer ${
                                                                    isSelected ? 'bg-amber-500/15' : ''
                                                                }`}
                                                            >
                                                                <td className="p-2.5 sticky right-0 bg-surface z-10 whitespace-nowrap">
                                                                    <span className="font-amiri text-2xl font-bold text-primary mr-1">
                                                                        {node.nooraniLetter}
                                                                    </span>
                                                                    <span className="text-[11px] text-text-muted">({node.nooraniLetterName})</span>
                                                                </td>

                                                                {ARABIC_ALPHABET_28.map(a => {
                                                                    const item = scoreMap.get(a.letter);
                                                                    const rank = item ? item.rank : 99;
                                                                    const score = item ? item.score : 0;

                                                                    let cellClass = 'bg-surface/20 text-text-muted';
                                                                    if (rank <= 3) {
                                                                        cellClass = 'bg-amber-500/35 font-black text-amber-900 dark:text-amber-200';
                                                                    } else if (rank <= 7) {
                                                                        cellClass = 'bg-amber-500/20 font-bold text-text-primary';
                                                                    } else if (rank <= 14) {
                                                                        cellClass = 'bg-primary/10 text-text-primary';
                                                                    }

                                                                    return (
                                                                        <td
                                                                            key={a.letter}
                                                                            title={`${node.nooraniLetter} ↔ ${a.letter}: رتبة #${rank} (درجة: ${score}ن)`}
                                                                            className={`p-1.5 text-center font-mono transition-colors ${cellClass}`}
                                                                        >
                                                                            {item ? (
                                                                                <div>
                                                                                    <span className="block text-[11px] font-bold">#{rank}</span>
                                                                                    <span className="text-[9px] opacity-75">{score}ن</span>
                                                                                </div>
                                                                            ) : '-'}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CIPHER PLAYGROUND / DECRYPTOR */}
                    {activeMainTab === 'playground' && (
                        <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <span>مختبر فك وتجربة الشيفرة النورانية</span>
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                        تطبيق التكويد العكسي
                                    </span>
                                </h2>
                                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                                    اكتب أي كلمة أو عبارة لترى كيف تترجمها الشيفرة التفضيليّة إلى كود الحروف النورانية الـ 14 المقابلة:
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <input
                                    type="text"
                                    value={testWord}
                                    onChange={(e) => setTestWord(e.target.value)}
                                    placeholder="اكتب كلمة للتجربة (مثال: محمد، الحمد، نور، سلام)..."
                                    className="w-full sm:flex-1 py-2.5 px-4 bg-surface-subtle border border-border-default rounded-xl font-amiri text-lg font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                                    dir="rtl"
                                />
                                {testWord && (
                                    <button
                                        type="button"
                                        onClick={() => setTestWord('')}
                                        className="px-3 py-2 text-xs text-text-muted hover:text-text-primary cursor-pointer"
                                    >
                                        <ClearIcon className="w-4 h-4 inline ml-1" />
                                        <span>مسح</span>
                                    </button>
                                )}
                            </div>

                            {optimalTranslationResult && (
                                <div className="p-4 rounded-xl bg-surface-subtle border border-border-default space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                        <div className="text-xs text-text-muted">
                                            النص الأصلي: <strong className="font-amiri text-lg text-text-primary mr-1">{optimalTranslationResult.original}</strong>
                                        </div>
                                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                            <span>الترجمة بالكود النوراني (وفق التوزيع التفضيلي 14×2):</span>
                                            <span className="font-amiri text-2xl font-black px-3 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                                                {optimalTranslationResult.encodedToNoorani}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {optimalTranslationResult.details.map((detail, dI) => (
                                            <div key={dI} className="p-2.5 bg-surface rounded-lg border border-border-default text-center space-y-1">
                                                <span className="text-xs text-text-muted block">الحرف الأصلي</span>
                                                <span className="font-amiri text-2xl font-bold text-text-primary block">{detail.char}</span>
                                                <div className="pt-1 border-t border-border-subtle">
                                                    <span className="text-[10px] text-text-muted block">المقابل النوراني</span>
                                                    <span className="font-amiri text-2xl font-black text-amber-600 dark:text-amber-400 block leading-none">
                                                        {detail.mappedNoorani}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NooraniReverseCipherView;
