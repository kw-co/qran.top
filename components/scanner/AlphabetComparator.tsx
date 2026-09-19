import React, { useState } from 'react';
import { 
    REFERENCE_ALPHABETS, 
    compareSequenceWithReferences, 
    ARABIC_LETTERS 
} from '../../utils/alphabetCipher';
import { CheckIcon, SparklesIcon, InformationCircleIcon, CopyIcon } from '../icons';

interface AlphabetComparatorProps {
    sequence: string[];
    isComplete28: boolean;
}

export const AlphabetComparator: React.FC<AlphabetComparatorProps> = ({ sequence, isComplete28 }) => {
    const [selectedRefId, setSelectedRefId] = useState<string>('quran_frequency');
    const [customHypothesis, setCustomHypothesis] = useState<string>('');
    const [showCustom, setShowCustom] = useState<boolean>(false);
    const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

    const comparisons = compareSequenceWithReferences(sequence);
    const activeComp = comparisons.find(c => c.referenceId === selectedRefId) || comparisons[0];
    const activeRef = REFERENCE_ALPHABETS.find(r => r.id === selectedRefId) || REFERENCE_ALPHABETS[0];

    const handleCopyRefSequence = (refSeq: string, refId: string, format: 'dashes' | 'compact' | 'spaced' | 'numbered') => {
        const letters = refSeq.split('');
        let text = '';
        if (format === 'dashes') {
            text = letters.join(' - ');
        } else if (format === 'compact') {
            text = refSeq;
        } else if (format === 'spaced') {
            text = letters.join(' ');
        } else if (format === 'numbered') {
            text = letters.map((char, idx) => `${idx + 1}. ${char}`).join('\n');
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopiedRefId(`${refId}-${format}`);
            setTimeout(() => setCopiedRefId(null), 2000);
        });
    };

    // Custom hypothesis comparison if provided
    const customMatches = React.useMemo(() => {
        if (!customHypothesis.trim()) return null;
        const cleaned = customHypothesis.replace(/\s+/g, '').split('');
        let matches = 0;
        const matchIndices: number[] = [];
        for (let i = 0; i < Math.min(sequence.length, cleaned.length); i++) {
            if (sequence[i] === cleaned[i]) {
                matches++;
                matchIndices.push(i);
            }
        }
        return {
            chars: cleaned,
            matches,
            pct: Math.round((matches / Math.max(1, cleaned.length)) * 100),
            matchIndices
        };
    }, [customHypothesis, sequence]);

    if (sequence.length === 0) return null;

    return (
        <div className="bg-surface rounded-xl border border-border-default p-5 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-base sm:text-lg">
                            مقارنة التسلسل المستخرج مع الأنظمة الأبجدية المرجعية
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary">
                            تحليل الشيفرة ومطابقة ترتيب الحروف المستخرج مع التراتيب التاريخية واللغوية والإحصائية
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCustom(!showCustom)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                            showCustom 
                                ? 'bg-primary text-white border-primary shadow-xs' 
                                : 'bg-surface-subtle border-border-default text-text-secondary hover:text-primary'
                        }`}
                    >
                        {showCustom ? 'إخفاء الفرضية المخصصة' : '🧪 اختبار فرضية خاصة'}
                    </button>
                </div>
            </div>

            {/* Custom Hypothesis Tester */}
            {showCustom && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                            أدخل الترتيب أو الشيفرة المفترضة التي تبحث عنها:
                        </span>
                        {customMatches && (
                            <span className="text-xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-full font-bold">
                                نسبة التطابق: {customMatches.pct}% ({customMatches.matches} حرف متطابق)
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={customHypothesis}
                        onChange={(e) => setCustomHypothesis(e.target.value)}
                        placeholder="اكتب الحروف بالتسلسل (مثال: ابجدهوز... أو نصحكيم...)"
                        className="w-full bg-surface border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-2 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        dir="rtl"
                    />
                    <div className="flex flex-wrap gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                        <span className="font-semibold">أزرار سريعة للفرضيات:</span>
                        <button 
                            onClick={() => setCustomHypothesis('النمويهربتكعفسدقحجشضصخذطثظغ')}
                            className="bg-surface px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
                        >
                            📊 التردد الإحصائي (القرآني)
                        </button>
                        <button 
                            onClick={() => setCustomHypothesis('نصحكيمقاطعلهسربتثجخدرذزشضظغف')}
                            className="bg-surface px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
                        >
                            الحروف المقطعة أولاً
                        </button>
                        <button 
                            onClick={() => setCustomHypothesis('عحهخغقكجشضصسزطدتظذثرلنفبموي')}
                            className="bg-surface px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
                        >
                            المخارج الصوتية
                        </button>
                    </div>
                </div>
            )}

            {/* Reference Alphabets Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {comparisons.map((comp) => {
                    const isSelected = comp.referenceId === selectedRefId;
                    return (
                        <button
                            key={comp.referenceId}
                            onClick={() => setSelectedRefId(comp.referenceId)}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                isSelected
                                    ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary'
                                    : 'bg-surface-subtle border-border-default text-text-secondary hover:border-primary/40 hover:text-text-primary'
                            }`}
                        >
                            <span className="text-xs font-bold truncate w-full" title={comp.referenceName}>
                                {comp.referenceName.split('(')[0]}
                            </span>
                            <div className="mt-2 flex items-center justify-between w-full">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                    comp.exactMatchesCount > 2 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-surface text-text-muted'
                                }`}>
                                    {comp.exactMatchesCount}/28 تطابق
                                </span>
                                <span className="text-xs font-mono font-bold">
                                    {comp.matchPercentage}%
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Active Reference Detail Comparison */}
            <div className="bg-surface-subtle rounded-xl p-4 border border-border-default space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-3">
                    <div>
                        <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                            <span>{activeRef.name}</span>
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5">{activeRef.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                            التطابق الموضعي: {activeComp.exactMatchesCount} من 28 ({activeComp.matchPercentage}%)
                        </span>

                        {/* Direct Copy Button for Active Reference */}
                        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-xs">
                            <span className="text-[11px] font-bold text-text-secondary px-1.5">نسخ هذا الترتيب:</span>
                            <button
                                onClick={() => handleCopyRefSequence(activeRef.sequence, activeRef.id, 'dashes')}
                                className="px-2 py-1 rounded bg-primary text-white hover:bg-primary-focus font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs text-[11px]"
                                title="نسخ مفصول بشرطات (ا - ب - ج)"
                            >
                                {copiedRefId === `${activeRef.id}-dashes` ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                <span>{copiedRefId === `${activeRef.id}-dashes` ? 'تم النسخ' : 'مفصول بشرطات'}</span>
                            </button>
                            <button
                                onClick={() => handleCopyRefSequence(activeRef.sequence, activeRef.id, 'compact')}
                                className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-text-primary border border-border-subtle font-semibold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                title="نسخ متصل (ابج...)"
                            >
                                {copiedRefId === `${activeRef.id}-compact` ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                <span>{copiedRefId === `${activeRef.id}-compact` ? 'تم النسخ' : 'متصل'}</span>
                            </button>
                            <button
                                onClick={() => handleCopyRefSequence(activeRef.sequence, activeRef.id, 'numbered')}
                                className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-text-primary border border-border-subtle font-semibold flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                                title="نسخ قائمة مرقمة"
                            >
                                {copiedRefId === `${activeRef.id}-numbered` ? <CheckIcon className="w-3.5 h-3.5 text-emerald-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                <span>{copiedRefId === `${activeRef.id}-numbered` ? 'تم النسخ' : 'قائمة مرقمة'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Side-by-side Slot Visualization (1 to 28) */}
                <div className="space-y-3 overflow-x-auto pb-2" dir="rtl">
                    <div className="min-w-[640px]">
                        {/* Headers */}
                        <div className="grid grid-cols-28 gap-1 mb-1 text-center text-[10px] text-text-muted font-mono">
                            {Array.from({ length: 28 }).map((_, i) => (
                                <div key={i} className="py-0.5">{i + 1}</div>
                            ))}
                        </div>

                        {/* Extracted Sequence Row */}
                        <div className="mb-2">
                            <div className="text-xs font-bold text-text-secondary mb-1 flex items-center justify-between">
                                <span>التسلسل المستخرج من النص:</span>
                                <span className="text-[11px] text-text-muted">({sequence.length} حرفاً)</span>
                            </div>
                            <div className="grid grid-cols-28 gap-1 text-center">
                                {Array.from({ length: 28 }).map((_, i) => {
                                    const char = sequence[i];
                                    const isMatch = activeComp.matchingIndices.includes(i);
                                    return (
                                        <div
                                            key={`ext-${i}`}
                                            className={`h-9 flex items-center justify-center rounded font-bold text-sm font-amiri border transition-all ${
                                                !char
                                                    ? 'bg-surface-subtle border-dashed border-border-default text-text-muted'
                                                    : isMatch
                                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs scale-105'
                                                    : 'bg-surface border-border-default text-text-primary'
                                            }`}
                                            title={char ? `الموضع ${i + 1}: ${char} ${isMatch ? '(متطابق مع المرجع)' : ''}` : `موضع فارغ ${i + 1}`}
                                        >
                                            {char || '-'}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reference Alphabet Row */}
                        <div>
                            <div className="text-xs font-bold text-text-secondary mb-1 flex items-center justify-between">
                                <span>ترتيب المرجع المقارن ({activeRef.name.split('(')[0]}):</span>
                            </div>
                            <div className="grid grid-cols-28 gap-1 text-center">
                                {activeRef.sequence.split('').map((char, i) => {
                                    const isMatch = activeComp.matchingIndices.includes(i);
                                    return (
                                        <div
                                            key={`ref-${i}`}
                                            className={`h-8 flex items-center justify-center rounded text-xs font-bold font-amiri border ${
                                                isMatch
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-extrabold'
                                                    : 'bg-surface/50 border-border-subtle text-text-muted'
                                            }`}
                                            title={`المرجع موضع ${i + 1}: ${char}`}
                                        >
                                            {char}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insight Footnote */}
                <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface p-2.5 rounded-lg border border-border-subtle">
                    <InformationCircleIcon className="w-4 h-4 text-primary shrink-0" />
                    <span>
                        المربعات الخضراء تمثل <strong>تطابقاً موضعياً تاماً</strong> بين ترتيب الحرف المستخرج من المسح وترتيبه في النظام المرجعي.
                    </span>
                </div>
            </div>
        </div>
    );
};
