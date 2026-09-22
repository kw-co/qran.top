import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { SurahData } from '../types';
import { 
    executeNooraniCipherReverseEngineering,
    simulateCipherTranslation,
    NooraniCipherNode,
    NooraniCipherAnalysisOptions,
    CANONICAL_14_NOORANI_LETTERS
} from '../utils/nooraniCipherEngine';
import { 
    SparklesIcon, 
    ChevronLeftIcon,
    SearchIcon,
    ClearIcon
} from './icons';

interface NooraniReverseCipherViewProps {
    simpleCleanData: SurahData[];
}

export const NooraniReverseCipherView: React.FC<NooraniReverseCipherViewProps> = ({
    simpleCleanData
}) => {
    // 1. Loading & Multi-Step Progress Bar State
    const [isProcessing, setIsProcessing] = useState<boolean>(true);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressStepText, setProgressStepText] = useState<string>('بدء تهيئة محرك الهندسة العكسية...');

    // 2. Options State
    const [includeWawBond, setIncludeWawBond] = useState<boolean>(true);
    const [excludeSelf, setExcludeSelf] = useState<boolean>(true);
    const [scope, setScope] = useState<'all_quran' | 'fawatih_surahs_only'>('all_quran');
    const [weightModel, setWeightModel] = useState<'balanced' | 'attachment_heavy' | 'fawatih_heavy'>('balanced');

    // 3. Computed Cipher Data
    const [cipherResults, setCipherResults] = useState<NooraniCipherNode[]>([]);
    const [selectedNodeLetter, setSelectedNodeLetter] = useState<string>('ح');

    // 4. Decryptor / Simulation State
    const [testWord, setTestWord] = useState<string>('محمد');

    // Scroll to top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 5. Heavy Processing Simulation with Real Calculation
    const runAnalysis = () => {
        setIsProcessing(true);
        setProgressPercent(10);
        setProgressStepText('1/4: مسح معجم ألفاظ المصحف الشريف واستخراج الحروف النورانية الـ 14...');

        setTimeout(() => {
            setProgressPercent(35);
            setProgressStepText('2/4: تحليل اقتران وتلاصق الأحرف الـ 28 وتتبع صلة الواو بـ (ن، ق، ص)...');

            setTimeout(() => {
                setProgressPercent(70);
                setProgressStepText('3/4: حساب مصفوفة الاستحقاق وتوزيع أعلى 4 أحرف مقابلة لكل حرف نوراني...');

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
                    setProgressStepText('4/4: اكتملت الهندسة العكسية للشيفرة بنجاح!');

                    setTimeout(() => {
                        setIsProcessing(false);
                    }, 400);
                }, 300);
            }, 300);
        }, 300);
    };

    // Run on initial mount and when options change
    useEffect(() => {
        if (simpleCleanData && simpleCleanData.length > 0) {
            runAnalysis();
        }
    }, [simpleCleanData, includeWawBond, excludeSelf, scope, weightModel]);

    // Active selected node for in-depth inspection
    const activeNode = useMemo(() => {
        return cipherResults.find(n => n.nooraniLetter === selectedNodeLetter) || cipherResults[0];
    }, [cipherResults, selectedNodeLetter]);

    // Simulation calculation
    const translationResult = useMemo(() => {
        if (!testWord.trim() || cipherResults.length === 0) return null;
        return simulateCipherTranslation(testWord, cipherResults);
    }, [testWord, cipherResults]);

    // Copy cipher table as text
    const [copied, setCopied] = useState<boolean>(false);
    const handleCopyCipherSummary = () => {
        if (cipherResults.length === 0) return;
        const lines = [
            '=== نتائج الهندسة العكسية لشيفرة الحروف النورانية (14 إلى 4) ===',
            `نطاق البحث: ${scope === 'all_quran' ? 'كامل المصحف (114 سورة)' : 'سور الفواتح الـ 29 فقط'}`,
            `ارتباط الواو مع (ن، ق، ص): ${includeWawBond ? 'مفعل' : 'معطل'}`,
            '-------------------------------------------------------'
        ];

        cipherResults.forEach(node => {
            const top4Str = node.top4.map((c, i) => `${i + 1}. [${c.letter}] (${c.letterName} - ${c.score} نقطة)`).join(' | ');
            lines.push(`الحرف النوراني [${node.nooraniLetter}] (${node.nooraniLetterName}): ${top4Str}`);
            if (node.hasWawBond && node.wawBondDetails) {
                lines.push(`   * ملاحظة الشيفرة: ${node.wawBondDetails}`);
            }
        });

        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl text-text-primary min-h-[85vh] space-y-6" dir="rtl">
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
                    <span>مختبر الهندسة العكسية للشيفرة النورانية</span>
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
                            <span>الهندسة العكسية لتكويد الحروف النورانية (14 إلى 4)</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl">
                            تحليل استقرائي لاكتشاف <strong>الأحرف الأربعة الأكثر استحقاقاً</strong> للمقابلة والارتباط بكل حرف من الحروف النورانية الـ 14، مع معالجة خصوصية <strong>حرف الواو</strong> واقترانه بحروف الفواتح المفردة (<strong>ن، ق، ص</strong>) عبر آيات القسم.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyCipherSummary}
                        disabled={isProcessing}
                        className="py-2.5 px-5 bg-surface-subtle hover:bg-surface border border-border-default hover:border-primary/50 text-text-primary rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs self-start shrink-0"
                    >
                        <span>{copied ? '✅ تم نسخ جدول الشيفرة' : '📋 نسخ جدول التكويد'}</span>
                    </button>
                </div>

                {/* Control Panel & Parameters */}
                <div className="pt-4 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Waw Bond Option */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
                            <span>ارتباط الواو مع (ن، ق، ص):</span>
                            <input
                                type="checkbox"
                                checked={includeWawBond}
                                onChange={(e) => setIncludeWawBond(e.target.checked)}
                                className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                            />
                        </label>
                        <p className="text-[11px] text-text-muted leading-tight">
                            مراعاة اقتران الواو بفواتح القسم (ن والقلم، ق والقرآن، ص والقرآن).
                        </p>
                    </div>

                    {/* Exclude Self Option */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary flex items-center justify-between cursor-pointer">
                            <span>استبعاد الحرف من نفسه:</span>
                            <input
                                type="checkbox"
                                checked={excludeSelf}
                                onChange={(e) => setExcludeSelf(e.target.checked)}
                                className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                            />
                        </label>
                        <p className="text-[11px] text-text-muted leading-tight">
                            حصر الأحرف الـ 4 المقابلة في أحرف مختلفة عن الحرف النوراني نفسه.
                        </p>
                    </div>

                    {/* Scope Selector */}
                    <div className="p-3 bg-surface-subtle rounded-xl border border-border-default space-y-1">
                        <label className="text-xs font-bold text-text-primary block">
                            نطاق البيانات:
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as any)}
                            className="w-full py-1 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="all_quran">كامل المصحف (114 سورة)</option>
                            <option value="fawatih_surahs_only">سور الفواتح الـ 29 فقط</option>
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
                            className="w-full py-1 px-2 bg-surface border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="balanced">متكامل (التصاق + تجاور + فواتح)</option>
                            <option value="attachment_heavy">تركيز الالتصاق المباشر (سوابق ولواحق)</option>
                            <option value="fawatih_heavy">تركيز الكثافة في سور الفواتح</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* PROCESSING PROGRESS BAR (AS REQUESTED) */}
            {isProcessing && (
                <div className="bg-surface rounded-2xl border border-amber-500/30 p-8 shadow-md space-y-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-spin">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-text-primary">
                            جاري تنفيذ المعالجة الحسابية العكسية...
                        </h2>
                        <p className="text-xs md:text-sm text-text-secondary font-mono">
                            {progressStepText}
                        </p>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-surface-subtle h-3.5 rounded-full overflow-hidden border border-border-default p-0.5">
                        <div
                            className="bg-linear-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted font-bold font-mono px-1">
                        <span>معالجة 77,430 كلمة قرآنية</span>
                        <span>{progressPercent}%</span>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT WHEN PROCESSING IS COMPLETE */}
            {!isProcessing && cipherResults.length > 0 && (
                <div className="space-y-6">
                    {/* Visual 14-Letter Selector Grid */}
                    <div className="bg-surface rounded-2xl border border-border-default p-4 md:p-6 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm font-bold text-text-muted">
                                اختر الحرف النوراني لمعاينة تفاصيل استحقاقه الرباعي:
                            </span>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                                {cipherResults.length} مفاتيح نورانية
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-start">
                            {cipherResults.map((node) => {
                                const isSelected = selectedNodeLetter === node.nooraniLetter;
                                return (
                                    <button
                                        key={node.nooraniLetter}
                                        type="button"
                                        onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                                            isSelected
                                                ? 'bg-amber-500 text-white font-bold shadow-md scale-105 border-amber-600'
                                                : 'bg-surface-subtle hover:bg-surface text-text-primary border-border-default hover:border-amber-400'
                                        }`}
                                    >
                                        <span className="font-amiri text-2xl font-bold leading-none">
                                            {node.nooraniLetter}
                                        </span>
                                        <span className="text-xs font-medium">
                                            {node.nooraniLetterName.replace(' (واو القسم المقترنة بـ ن، ق، ص)', '')}
                                        </span>
                                        {node.hasWawBond && (
                                            <span className={`text-[10px] px-1 rounded-sm ${isSelected ? 'bg-white/20' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
                                                +و
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FOCUS CARD: THE SELECTED NOORANI LETTER & ITS 4 CORRESPONDING LETTERS */}
                    {activeNode && (
                        <div className="bg-surface rounded-2xl border-2 border-amber-500/30 p-6 md:p-8 shadow-sm space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-amiri text-5xl font-bold shadow-inner">
                                        {activeNode.nooraniLetter}
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                                            الأحرف الأربعة المقابلة لحرف «{activeNode.nooraniLetter}» ({activeNode.nooraniLetterName})
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
                                            <span>وروده في القرآن: <strong className="text-text-primary font-mono">{activeNode.totalOccurrences.toLocaleString('ar-SA')}</strong> مرة</span>
                                            <span>•</span>
                                            <span>سور الفواتح ({activeNode.fawatihSurahs.length}): {activeNode.fawatihSurahs.map(s => s.name).join('، ')}</span>
                                        </div>
                                    </div>
                                </div>

                                {activeNode.hasWawBond && (
                                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2 self-start">
                                        <SparklesIcon className="w-4 h-4 text-amber-500" />
                                        <span>{activeNode.wawBondDetails}</span>
                                    </div>
                                )}
                            </div>

                            {/* THE 4 DESERVING LETTERS GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {activeNode.top4.map((cand, idx) => {
                                    const medals = ['🥇 الحرف الأول', '🥈 الحرف الثاني', '🥉 الحرف الثالث', '🏅 الحرف الرابع'];
                                    return (
                                        <div
                                            key={cand.letter}
                                            className="bg-surface-subtle rounded-2xl border border-border-default p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all shadow-xs"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-text-muted">
                                                        {medals[idx]}
                                                    </span>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                                                        {cand.score} نقطة
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline gap-3 pt-1">
                                                    <span className="font-amiri text-5xl font-black text-primary leading-none">
                                                        {cand.letter}
                                                    </span>
                                                    <div>
                                                        <h3 className="font-bold text-base text-text-primary">
                                                            حرف {cand.letterName}
                                                        </h3>
                                                        <span className="text-[11px] text-text-secondary block">
                                                            {cand.justification}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metrics breakdown */}
                                            <div className="space-y-2 pt-3 border-t border-border-subtle text-xs">
                                                <div className="flex items-center justify-between text-text-secondary">
                                                    <span>اتصال قبل (سوابق):</span>
                                                    <span className="font-bold font-mono text-text-primary">{cand.beforeCount.toLocaleString('ar-SA')}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-text-secondary">
                                                    <span>اتصال بعد (لواحق):</span>
                                                    <span className="font-bold font-mono text-text-primary">{cand.afterCount.toLocaleString('ar-SA')}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-text-secondary">
                                                    <span>تزامن داخل الكلمة:</span>
                                                    <span className="font-bold font-mono text-text-primary">{cand.inWordCount.toLocaleString('ar-SA')}</span>
                                                </div>

                                                {cand.exampleWords.length > 0 && (
                                                    <div className="pt-2">
                                                        <span className="text-[10px] text-text-muted block mb-1">شواهد قرآنية:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {cand.exampleWords.map((w, wI) => (
                                                                <span
                                                                    key={wI}
                                                                    className="px-1.5 py-0.5 bg-surface border border-border-default rounded font-amiri text-xs font-bold text-text-primary"
                                                                >
                                                                    {w}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* COMPLETE CIPHER MASTER TABLE (ALL 14 NOORANI LETTERS) */}
                    <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span>جدول مصفوفة التكويد الكاملة (14 × 4)</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                    56 موضع استحقاق
                                </span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border-default bg-surface-subtle text-text-secondary text-xs">
                                        <th className="p-3 font-bold">الحرف النوراني</th>
                                        <th className="p-3 font-bold">الاسم والورود</th>
                                        <th className="p-3 font-bold text-center">المقابل 1 (🥇)</th>
                                        <th className="p-3 font-bold text-center">المقابل 2 (🥈)</th>
                                        <th className="p-3 font-bold text-center">المقابل 3 (🥉)</th>
                                        <th className="p-3 font-bold text-center">المقابل 4 (🏅)</th>
                                        <th className="p-3 font-bold">ملاحظات الشيفرة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle font-medium">
                                    {cipherResults.map((node) => (
                                        <tr 
                                            key={node.nooraniLetter}
                                            onClick={() => setSelectedNodeLetter(node.nooraniLetter)}
                                            className={`hover:bg-surface-subtle/80 cursor-pointer transition-colors ${
                                                selectedNodeLetter === node.nooraniLetter ? 'bg-amber-500/10' : ''
                                            }`}
                                        >
                                            <td className="p-3">
                                                <span className="font-amiri text-2xl font-bold text-primary inline-block w-8 text-center">
                                                    {node.nooraniLetter}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs">
                                                <div className="font-bold text-text-primary">
                                                    {node.nooraniLetterName.replace(' (واو القسم المقترنة بـ ن، ق، ص)', '')}
                                                </div>
                                                <span className="text-text-muted font-mono">
                                                    {node.totalOccurrences.toLocaleString('ar-SA')} موضع
                                                </span>
                                            </td>
                                            {node.top4.map((c, idx) => (
                                                <td key={idx} className="p-3 text-center">
                                                    <span className="font-amiri text-xl font-bold text-text-primary block leading-none">
                                                        {c.letter}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        {c.score}ن
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="p-3 text-xs text-text-muted">
                                                {node.hasWawBond ? (
                                                    <span className="text-amber-700 dark:text-amber-300 font-bold">
                                                        {node.wawBondDetails}
                                                    </span>
                                                ) : (
                                                    <span>{node.fawatihSurahs.length} سور فواتح</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* INTERACTIVE CIPHER PLAYGROUND / DECRYPTOR */}
                    <div className="bg-surface rounded-2xl border border-border-default p-6 md:p-8 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <span>مختبر فك وتجربة الشيفرة النورانية</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                    تطبيق التكويد العكسي
                                </span>
                            </h2>
                            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                                اكتب أي كلمة أو عبارة لترى كيف تترجمها الشيفرة العكسية إلى كود الحروف النورانية المقابلة:
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
                                    مسح
                                </button>
                            )}
                        </div>

                        {translationResult && (
                            <div className="p-4 rounded-xl bg-surface-subtle border border-border-default space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                    <div className="text-xs text-text-muted">
                                        النص الأصلي: <strong className="font-amiri text-lg text-text-primary mr-1">{translationResult.original}</strong>
                                    </div>
                                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                        <span>الترجمة إلى الكود النوراني:</span>
                                        <span className="font-amiri text-2xl font-black px-3 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                                            {translationResult.encodedToNoorani}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {translationResult.cipherDetails.map((detail, dI) => (
                                        <div key={dI} className="p-2 bg-surface rounded-lg border border-border-default text-center space-y-1">
                                            <span className="text-xs text-text-muted block">الحرف الأصلي</span>
                                            <span className="font-amiri text-xl font-bold text-text-primary block">{detail.char}</span>
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
                </div>
            )}
        </div>
    );
};

export default NooraniReverseCipherView;
