import React, { useState, useMemo, useEffect } from 'react';
import type { SurahData } from '../types';
import { 
    computeOptimal14x2Partition, 
    OptimalPartitionResult 
} from '../utils/optimalMatchingEngine';
import { 
    executeNooraniCipherReverseEngineering, 
    CANONICAL_14_NOORANI_LETTERS,
    ARABIC_ALPHABET_28
} from '../utils/nooraniCipherEngine';
import { 
    encryptWordWithPartition, 
    decryptCipherWithPartition, 
    buildQuranLexicon,
    EncryptionResult,
    DecryptionResult
} from '../utils/nooraniCipherLabEngine';
import { 
    SparklesIcon, 
    CopyIcon, 
    CheckIcon, 
    ClearIcon, 
    ChevronLeftIcon,
    SearchIcon,
    RefreshIcon,
    BookOpenIcon
} from './icons';

interface NooraniCipherLabProps {
    simpleCleanData: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
    compactMode?: boolean;
}

type LabMode = 'encrypt' | 'decrypt';

export const NooraniCipherLab: React.FC<NooraniCipherLabProps> = ({
    simpleCleanData,
    onSearch,
    compactMode = false
}) => {
    // 1. Core State
    const [mode, setMode] = useState<LabMode>('encrypt');
    const [matchingMethod, setMatchingMethod] = useState<'hungarian_global_optimum' | 'greedy_priority'>('hungarian_global_optimum');
    
    // Encrypt State
    const [encryptInput, setEncryptInput] = useState<string>('محمد');
    
    // Decrypt State
    const [decryptInput, setDecryptInput] = useState<string>('الم');
    const [customBitmaskChoices, setCustomBitmaskChoices] = useState<Record<number, 1 | 2>>({});

    // UI state
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showCombinationsTable, setShowCombinationsTable] = useState<boolean>(false);
    const [showMasterTable, setShowMasterTable] = useState<boolean>(false);

    // 2. Compute Master Reverse Engineering and 14x2 Partition
    const cipherResults = useMemo(() => {
        if (!simpleCleanData || simpleCleanData.length === 0) return [];
        return executeNooraniCipherReverseEngineering(simpleCleanData, {
            includeWawBond: false, // strictly 14 canonical
            excludeSelf: true,
            scope: 'all_quran',
            weightModel: 'balanced'
        });
    }, [simpleCleanData]);

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

    // 3. Memoized Quranic Lexicon Dictionary
    const quranLexicon = useMemo(() => {
        return buildQuranLexicon(simpleCleanData);
    }, [simpleCleanData]);

    // 4. Run Encryption
    const encryptionResult: EncryptionResult = useMemo(() => {
        if (optimalPartition.assignments.length === 0) {
            return {
                originalText: encryptInput,
                cleanText: '',
                nooraniCipher: '',
                spacedCipher: '',
                details: [],
                uniqueNooraniLetters: [],
                primaryRankCount: 0,
                secondaryRankCount: 0,
                totalScore: 0,
                averageScore: 0
            };
        }
        return encryptWordWithPartition(encryptInput, optimalPartition);
    }, [encryptInput, optimalPartition]);

    // 5. Run Decryption
    const decryptionResult: DecryptionResult = useMemo(() => {
        if (optimalPartition.assignments.length === 0) {
            return {
                inputCipher: decryptInput,
                cleanCipher: '',
                nooraniLetters: [],
                isValidNooraniOnly: true,
                invalidLetters: [],
                primaryDecodedWord: '',
                primaryTotalScore: 0,
                secondaryDecodedWord: '',
                secondaryTotalScore: 0,
                positions: [],
                combinations: [],
                quranicWordsFound: [],
                totalPossibleCombinations: 0
            };
        }
        return decryptCipherWithPartition(decryptInput, optimalPartition, quranLexicon);
    }, [decryptInput, optimalPartition, quranLexicon]);

    // Reset interactive bitmask when decrypt input changes length or content
    useEffect(() => {
        const initialMap: Record<number, 1 | 2> = {};
        decryptionResult.positions.forEach((p, idx) => {
            initialMap[idx] = 1;
        });
        setCustomBitmaskChoices(initialMap);
    }, [decryptionResult.cleanCipher, decryptionResult.positions.length]);

    // Assembled word from interactive custom toggles
    const liveCustomDecodedWord = useMemo(() => {
        if (decryptionResult.positions.length === 0) return '';
        return decryptionResult.positions.map((pos, idx) => {
            const choice = customBitmaskChoices[idx] || 1;
            return choice === 1 ? pos.option1.char : pos.option2.char;
        }).join('');
    }, [decryptionResult.positions, customBitmaskChoices]);

    const liveCustomScore = useMemo(() => {
        if (decryptionResult.positions.length === 0) return 0;
        let score = 0;
        decryptionResult.positions.forEach((pos, idx) => {
            const choice = customBitmaskChoices[idx] || 1;
            score += choice === 1 ? pos.option1.score : pos.option2.score;
        });
        return Math.round(score * 10) / 10;
    }, [decryptionResult.positions, customBitmaskChoices]);

    const liveCustomQuranCount = useMemo(() => {
        if (!liveCustomDecodedWord) return 0;
        return quranLexicon.get(liveCustomDecodedWord) || 0;
    }, [liveCustomDecodedWord, quranLexicon]);

    // Copy Handler
    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2500);
    };

    // Quick presets for encryption
    const encryptPresets = [
        'محمد', 'قرآن', 'كتاب', 'سلام', 'الحمد', 'الرحمن', 'مصحف', 'نور'
    ];

    // Quick presets for decryption (Fawatih and common ciphers)
    const decryptPresets = [
        'الم', 'حم', 'طه', 'طسم', 'يس', 'ص', 'ق', 'ن', 'الر', 'كهيعص'
    ];

    return (
        <div className="w-full bg-surface border border-border-default rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-default/60">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm border border-amber-500/20">
                        🔐
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                                مختبر التشفير وفك التشفير النوراني
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                14 ⟷ 28
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                            تشفير وفك تشفير الكلمات بدقة رياضية حسب الجدول التفضيلي المعتمد (كل حرف نوراني يقابله حرفان حصراً)
                        </p>
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center bg-surface-subtle p-1 rounded-2xl border border-border-default self-start md:self-auto">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            mode === 'encrypt'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>🔒 تشفير الكلمات</span>
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            mode === 'decrypt'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>🔓 فك التشفير والمعجم</span>
                    </button>
                </div>
            </div>

            {/* Mode Content */}
            <div className="mt-6">
                {mode === 'encrypt' ? (
                    /* ---------------- ENCRYPTION VIEW ---------------- */
                    <div className="space-y-6">
                        {/* Input Box & Presets */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <span>أدخل أي كلمة أو عبارة عربية لتشفيرها:</span>
                                </label>
                                {encryptInput && (
                                    <button
                                        onClick={() => setEncryptInput('')}
                                        className="text-xs text-text-secondary hover:text-red-500 flex items-center gap-1 cursor-pointer"
                                    >
                                        <ClearIcon className="w-3.5 h-3.5" />
                                        <span>مسح</span>
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={encryptInput}
                                    onChange={(e) => setEncryptInput(e.target.value)}
                                    placeholder="اكتب هنا، مثل: محمد، كتاب، سلام، قرآن..."
                                    className="w-full px-5 py-3.5 rounded-2xl bg-surface-subtle border border-border-default text-lg sm:text-xl font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-secondary/50 font-amiri"
                                    dir="rtl"
                                />
                            </div>

                            {/* Presets */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-xs text-text-secondary">نماذج سريعة:</span>
                                {encryptPresets.map((word) => (
                                    <button
                                        key={word}
                                        onClick={() => setEncryptInput(word)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                            encryptInput === word
                                                ? 'bg-primary/10 border-primary text-primary font-bold'
                                                : 'bg-surface-subtle border-border-default text-text-secondary hover:text-text-primary hover:border-text-secondary'
                                        }`}
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Encrypted Output Card */}
                        {encryptionResult.nooraniCipher ? (
                            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 sm:p-6 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                            الكود النوراني الناتج المشفر:
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopy(encryptionResult.nooraniCipher, 'cipher_compact')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-default hover:bg-surface-hover text-xs font-bold text-text-primary transition-colors cursor-pointer shadow-xs"
                                        >
                                            {copiedField === 'cipher_compact' ? (
                                                <>
                                                    <CheckIcon className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-emerald-600 dark:text-emerald-400">تم النسخ!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CopyIcon className="w-4 h-4 text-text-secondary" />
                                                    <span>نسخ الكود</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDecryptInput(encryptionResult.nooraniCipher);
                                                setMode('decrypt');
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                                        >
                                            <span>فك تشفير هذا الكود ⟵</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Big Cipher Code Display */}
                                <div className="bg-surface border border-amber-500/30 rounded-2xl p-5 text-center shadow-xs">
                                    <div className="font-quran text-3xl sm:text-4xl md:text-5xl font-bold tracking-widest text-amber-700 dark:text-amber-300 drop-shadow-xs">
                                        {encryptionResult.spacedCipher}
                                    </div>
                                    <div className="text-xs text-text-secondary mt-2">
                                        تشفير تسلسلي دقيق وفق الجدول التفضيلي المزدوج (14 ⟷ 28)
                                    </div>
                                </div>

                                {/* Letter-by-letter Pipeline Breakdown */}
                                <div>
                                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                                        مسار التحويل التفصيلي لكل حرف:
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                        {encryptionResult.details.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-xl bg-surface border border-border-default flex flex-col items-center text-center shadow-xs hover:border-amber-500/40 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-base font-bold text-text-primary">
                                                        {item.originalChar}
                                                    </span>
                                                    <span className="text-xs text-text-secondary">⟶</span>
                                                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-quran">
                                                        {item.nooraniLetter}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                                        item.rank === 1
                                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                                    }`}>
                                                        {item.rank === 1 ? '🥇 مقابل أول' : '🥈 مقابل ثانٍ'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-text-secondary font-mono">
                                                    {item.score} نقطة
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    <div className="p-3 rounded-xl bg-surface border border-border-default text-center">
                                        <div className="text-xs text-text-secondary mb-0.5">الحروف الأصلية</div>
                                        <div className="text-base font-bold text-text-primary">{encryptionResult.details.length}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-surface border border-border-default text-center">
                                        <div className="text-xs text-text-secondary mb-0.5">النورانية المستعملة</div>
                                        <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                                            {encryptionResult.uniqueNooraniLetters.length} من 14
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-surface border border-border-default text-center">
                                        <div className="text-xs text-text-secondary mb-0.5">المقابلات 🥇 / 🥈</div>
                                        <div className="text-base font-bold text-text-primary">
                                            {encryptionResult.primaryRankCount} / {encryptionResult.secondaryRankCount}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-surface border border-border-default text-center">
                                        <div className="text-xs text-text-secondary mb-0.5">إجمالي النقاط</div>
                                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                            {encryptionResult.totalScore}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-text-secondary border border-dashed border-border-default rounded-2xl">
                                اكتب أي كلمة أعلاه لتوليد كود التشفير النوراني فورياً.
                            </div>
                        )}
                    </div>
                ) : (
                    /* ---------------- DECRYPTION VIEW ---------------- */
                    <div className="space-y-6">
                        {/* Input Box & Noorani Keyboard */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <span>أدخل كود الحروف النورانية (من حروف الفواتح الـ 14):</span>
                                </label>
                                {decryptInput && (
                                    <button
                                        onClick={() => setDecryptInput('')}
                                        className="text-xs text-text-secondary hover:text-red-500 flex items-center gap-1 cursor-pointer"
                                    >
                                        <ClearIcon className="w-3.5 h-3.5" />
                                        <span>مسح</span>
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={decryptInput}
                                    onChange={(e) => setDecryptInput(e.target.value)}
                                    placeholder="اكتب كود نوراني، مثل: الم، حم، طه، يس، طسم، ص، ق، ن..."
                                    className="w-full px-5 py-3.5 rounded-2xl bg-surface-subtle border border-border-default text-lg sm:text-xl font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-secondary/50 font-quran tracking-wider"
                                    dir="rtl"
                                />
                            </div>

                            {/* Mini 14 Noorani Letters Keyboard */}
                            <div className="mt-3 p-3 rounded-2xl bg-surface-subtle border border-border-default">
                                <div className="text-[11px] font-bold text-text-secondary mb-2 flex items-center justify-between">
                                    <span>لوحة مفاتيح الحروف النورانية الـ 14 (انقر للإضافة السريعة):</span>
                                    <span>{CANONICAL_14_NOORANI_LETTERS.length} حرفاً</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {CANONICAL_14_NOORANI_LETTERS.map((item) => (
                                        <button
                                            key={item.letter}
                                            onClick={() => setDecryptInput(prev => prev + item.letter)}
                                            className="w-9 h-9 rounded-xl bg-surface border border-border-default hover:border-amber-500 hover:bg-amber-500/10 font-quran font-bold text-lg text-text-primary flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                                            title={item.name}
                                        >
                                            {item.letter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Presets */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-xs text-text-secondary">فواتح مشهورة:</span>
                                {decryptPresets.map((code) => (
                                    <button
                                        key={code}
                                        onClick={() => setDecryptInput(code)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer font-quran ${
                                            decryptInput === code
                                                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                                                : 'bg-surface-subtle border-border-default text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {code}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Non-Noorani Warning */}
                        {!decryptionResult.isValidNooraniOnly && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                                <span>⚠️ تنبيه: الكود يحتوي على أحرف خارج الحروف النورانية الـ 14 ({decryptionResult.invalidLetters.join('، ')}). يتم فك تشفير الحروف النورانية المعتمدة فقط.</span>
                            </div>
                        )}

                        {/* Decrypted Output Section */}
                        {decryptionResult.positions.length > 0 ? (
                            <div className="space-y-6">
                                {/* 1. Primary & Secondary Decryptions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Primary Choice */}
                                    <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 shadow-xs">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                                    🥇 المسار الأساسي الأول (أعلى استحقاق)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(decryptionResult.primaryDecodedWord, 'copy_prim')}
                                                className="text-xs text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                                            >
                                                {copiedField === 'copy_prim' ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-text-primary font-amiri mb-2">
                                            {decryptionResult.primaryDecodedWord}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-default/40">
                                            <span>مجموع النقاط: {decryptionResult.primaryTotalScore}</span>
                                            {quranLexicon.get(decryptionResult.primaryDecodedWord) ? (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    ⭐ موثقة في القرآن ({quranLexicon.get(decryptionResult.primaryDecodedWord)} مرة)
                                                </span>
                                            ) : (
                                                <span>غير مكررة ككلمة كاملة</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Secondary Choice */}
                                    <div className="p-5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/30 shadow-xs">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                    🥈 المسار الرديف الثاني (ثاني أعلى استحقاق)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCopy(decryptionResult.secondaryDecodedWord, 'copy_sec')}
                                                className="text-xs text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                                            >
                                                {copiedField === 'copy_sec' ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-bold text-text-primary font-amiri mb-2">
                                            {decryptionResult.secondaryDecodedWord}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-default/40">
                                            <span>مجموع النقاط: {decryptionResult.secondaryTotalScore}</span>
                                            {quranLexicon.get(decryptionResult.secondaryDecodedWord) ? (
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    ⭐ موثقة في القرآن ({quranLexicon.get(decryptionResult.secondaryDecodedWord)} مرة)
                                                </span>
                                            ) : (
                                                <span>غير مكررة ككلمة كاملة</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Interactive Letter-by-Letter Combinator */}
                                <div className="p-5 rounded-2xl bg-surface border border-border-default shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                                                <span>🎛️ مبدل الحروف التفاعلي المباشر:</span>
                                            </h3>
                                            <p className="text-xs text-text-secondary">
                                                بدّل بين المقابل الأول والثاني لكل حرف على حدة وشاهد الكلمة الناتجة تتشكل حياً:
                                            </p>
                                        </div>

                                        {/* Live Assembled Word Box */}
                                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-subtle border border-border-default">
                                            <span className="text-xs text-text-secondary">الكلمة المجمعة:</span>
                                            <span className="text-xl sm:text-2xl font-bold text-primary font-amiri">
                                                {liveCustomDecodedWord}
                                            </span>
                                            {liveCustomQuranCount > 0 && onSearch && (
                                                <button
                                                    onClick={() => onSearch(liveCustomDecodedWord, 'quran-simple-clean')}
                                                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                                    title="ابحث عنها في المصحف"
                                                >
                                                    <SearchIcon className="w-3.5 h-3.5" />
                                                    <span>({liveCustomQuranCount})</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Position Toggles */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {decryptionResult.positions.map((pos) => {
                                            const currentChoice = customBitmaskChoices[pos.positionIndex] || 1;
                                            return (
                                                <div
                                                    key={pos.positionIndex}
                                                    className="p-3 rounded-xl bg-surface-subtle border border-border-default flex flex-col gap-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-text-secondary font-mono">
                                                            الموضع {pos.positionIndex + 1}
                                                        </span>
                                                        <span className="font-quran font-bold text-base text-amber-600 dark:text-amber-400">
                                                            {pos.nooraniLetter} ({pos.nooraniLetterName})
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {/* Option 1 */}
                                                        <button
                                                            onClick={() => setCustomBitmaskChoices(prev => ({ ...prev, [pos.positionIndex]: 1 }))}
                                                            className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                                                                currentChoice === 1
                                                                    ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-xs'
                                                                    : 'bg-surface text-text-secondary hover:text-text-primary border-border-default'
                                                            }`}
                                                        >
                                                            <div className="text-lg font-bold font-amiri leading-none">
                                                                {pos.option1.char}
                                                            </div>
                                                            <div className="text-[10px] mt-1 opacity-80">
                                                                🥇 {pos.option1.score}
                                                            </div>
                                                        </button>

                                                        {/* Option 2 */}
                                                        <button
                                                            onClick={() => setCustomBitmaskChoices(prev => ({ ...prev, [pos.positionIndex]: 2 }))}
                                                            className={`p-2 rounded-lg text-center transition-all cursor-pointer border ${
                                                                currentChoice === 2
                                                                    ? 'bg-blue-500 text-white font-bold border-blue-600 shadow-xs'
                                                                    : 'bg-surface text-text-secondary hover:text-text-primary border-border-default'
                                                            }`}
                                                        >
                                                            <div className="text-lg font-bold font-amiri leading-none">
                                                                {pos.option2.char}
                                                            </div>
                                                            <div className="text-[10px] mt-1 opacity-80">
                                                                🥈 {pos.option2.score}
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Quranic Vocabulary Solver Box */}
                                {decryptionResult.quranicWordsFound.length > 0 && (
                                    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-500 text-lg">⭐</span>
                                                <h3 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300">
                                                    كلمات قرآنية موثقة في المصحف أنتجتها احتمالات هذا الكود ({decryptionResult.quranicWordsFound.length}):
                                                </h3>
                                            </div>
                                            <span className="text-xs text-text-secondary">
                                                مطابقة فورية مع معجم ألفاظ المصحف الشريف
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2.5 pt-1">
                                            {decryptionResult.quranicWordsFound.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-emerald-500/30 shadow-xs"
                                                >
                                                    <span className="text-xl font-bold font-amiri text-text-primary">
                                                        {item.word}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                                        تكررت {item.quranicOccurrences} مرة
                                                    </span>
                                                    {onSearch && (
                                                        <button
                                                            onClick={() => onSearch(item.word, 'quran-simple-clean')}
                                                            className="p-1 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                                            title="بحث عن الكلمة في القرآن"
                                                        >
                                                            <SearchIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 4. Full Combinations Table Drawer */}
                                <div className="border border-border-default rounded-2xl overflow-hidden bg-surface">
                                    <button
                                        onClick={() => setShowCombinationsTable(!showCombinationsTable)}
                                        className="w-full flex items-center justify-between p-4 bg-surface-subtle hover:bg-surface-hover transition-colors cursor-pointer text-right"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-text-primary">
                                                استعراض كافة التوليفات التوافقية المحتملة (2^{decryptionResult.positions.length} = {decryptionResult.totalPossibleCombinations})
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                (مرتبة حسب مجموع نقاط الاستحقاق)
                                            </span>
                                        </div>
                                        <div className="text-xs text-primary font-bold">
                                            {showCombinationsTable ? 'إخفاء ▲' : 'إظهار التوليفات ▼'}
                                        </div>
                                    </button>

                                    {showCombinationsTable && (
                                        <div className="p-4 max-h-80 overflow-y-auto divide-y divide-border-default/40">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {decryptionResult.combinations.map((combo, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-2.5 rounded-xl border flex items-center justify-between text-sm ${
                                                            combo.isQuranicWord
                                                                ? 'bg-emerald-500/5 border-emerald-500/30 font-bold'
                                                                : 'bg-surface border-border-default/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-text-secondary font-mono w-5">
                                                                {idx + 1}.
                                                            </span>
                                                            <span className="text-lg font-amiri">
                                                                {combo.word}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            {combo.isQuranicWord && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                                                    ⭐ قرآني ({combo.quranicOccurrences})
                                                                </span>
                                                            )}
                                                            <span className="text-text-secondary font-mono">
                                                                {combo.totalScore} ن
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-text-secondary border border-dashed border-border-default rounded-2xl">
                                أدخل كود حروف نورانية أعلاه لاستخراج الكلمات الأبجدية المفكوكة والمطابقات القرآنية.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Master Preferential Table Drawer */}
            <div className="mt-8 pt-6 border-t border-border-default/60">
                <button
                    onClick={() => setShowMasterTable(!showMasterTable)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle hover:bg-surface-hover transition-colors text-right cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            14 ⟷ 28
                        </span>
                        <span className="font-bold text-sm text-text-primary">
                            مرجع الجدول التفضيلي المعتمد في التشفير (14 حرفاً نورانياً ⟷ 28 حرفاً أبجدياً)
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            ✓ تغطية 28/28 بنسبة 100%
                        </span>
                    </div>
                    <span className="text-xs font-bold text-primary">
                        {showMasterTable ? 'إغفاء الجدول ▲' : 'عرض الجدول التفضيلي ▼'}
                    </span>
                </button>

                {showMasterTable && (
                    <div className="mt-4 p-4 rounded-2xl bg-surface border border-border-default overflow-x-auto space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-default/60">
                            <span className="text-xs text-text-secondary">
                                التوزيع التوافقي الأمثل المعتمد للمقابلة الحصرية دون نقص ودون تكرار
                            </span>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-text-secondary">خوارزمية التعيين:</label>
                                <select
                                    value={matchingMethod}
                                    onChange={(e) => setMatchingMethod(e.target.value as any)}
                                    className="px-2.5 py-1 rounded-lg text-xs bg-surface-subtle border border-border-default text-text-primary focus:outline-none"
                                >
                                    <option value="hungarian_global_optimum">التعيين التوافقي الأمثل (Hungarian)</option>
                                    <option value="greedy_priority">التراتبي بالأسبقية (Greedy)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {optimalPartition.assignments.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border-default/70 hover:border-amber-500/40 transition-colors"
                                >
                                    {/* Noorani letter */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-quran font-bold text-xl text-amber-700 dark:text-amber-300">
                                            {item.nooraniLetter}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-text-primary">
                                                {item.nooraniLetterName}
                                            </div>
                                            <div className="text-[10px] text-text-secondary">
                                                {item.fawatihSurahsCount} سورة
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <span className="text-xs text-text-secondary font-bold">⟷</span>

                                    {/* 2 Alphabet letters */}
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 rounded-lg bg-surface border border-border-default text-center">
                                            <div className="text-xs font-bold text-amber-700 dark:text-amber-300 font-amiri">
                                                🥇 {item.letter1.char} ({item.letter1.name})
                                            </div>
                                            <div className="text-[9px] text-text-secondary">
                                                {item.letter1.score} ن
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 rounded-lg bg-surface border border-border-default text-center">
                                            <div className="text-xs font-bold text-blue-700 dark:text-blue-300 font-amiri">
                                                🥈 {item.letter2.char} ({item.letter2.name})
                                            </div>
                                            <div className="text-[9px] text-text-secondary">
                                                {item.letter2.score} ن
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NooraniCipherLab;
