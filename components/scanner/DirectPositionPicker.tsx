import React, { useState, useMemo } from 'react';
import { QURAN_INDEX } from '../../quranIndex';
import { 
    PRESET_SCAN_POINTS, 
    ExtractionStrategy, 
    ScanDirection, 
    PresetAyah, 
    FlatWord 
} from '../../utils/alphabetCipher';
import { BookOpenIcon, PlayIcon, SparklesIcon, ArrowRightIcon } from '../icons';

interface DirectPositionPickerProps {
    flatWords: FlatWord[];
    onSelectPosition: (startWordIndex: number, strategy: ExtractionStrategy, direction: ScanDirection) => void;
    currentStartIndex: number;
    currentStrategy: ExtractionStrategy;
    currentDirection: ScanDirection;
}

export const DirectPositionPicker: React.FC<DirectPositionPickerProps> = ({
    flatWords,
    onSelectPosition,
    currentStartIndex,
    currentStrategy,
    currentDirection
}) => {
    const [selectedSurah, setSelectedSurah] = useState<number>(48);
    const [selectedAyah, setSelectedAyah] = useState<number>(29);
    const [selectedWordIdxInAyah, setSelectedWordIdxInAyah] = useState<number>(0);
    const [strategy, setStrategy] = useState<ExtractionStrategy>(currentStrategy);
    const [direction, setDirection] = useState<ScanDirection>(currentDirection);

    const surahInfo = useMemo(() => {
        return QURAN_INDEX.find(s => s.number === selectedSurah) || QURAN_INDEX[0];
    }, [selectedSurah]);

    // Words in the currently selected Surah and Ayah
    const wordsInSelectedAyah = useMemo(() => {
        if (!flatWords || flatWords.length === 0) return [];
        return flatWords.filter(w => w.surah === selectedSurah && w.ayah === selectedAyah);
    }, [flatWords, selectedSurah, selectedAyah]);

    // Handle when user changes surah
    const handleSurahChange = (surahNum: number) => {
        setSelectedSurah(surahNum);
        setSelectedAyah(1);
        setSelectedWordIdxInAyah(0);
    };

    // Handle when user chooses a preset
    const handlePresetSelect = (preset: PresetAyah) => {
        setSelectedSurah(preset.surah);
        setSelectedAyah(preset.ayah);
        setSelectedWordIdxInAyah(0);

        // Find matching word index in flatWords
        const targetWord = flatWords.find(w => w.surah === preset.surah && w.ayah === preset.ayah);
        if (targetWord) {
            onSelectPosition(targetWord.index, strategy, direction);
        }
    };

    // Calculate global index and trigger scan
    const handleExecuteScan = () => {
        if (wordsInSelectedAyah.length === 0) return;
        const target = wordsInSelectedAyah[selectedWordIdxInAyah] || wordsInSelectedAyah[0];
        if (target) {
            onSelectPosition(target.index, strategy, direction);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border-default p-5 shadow-sm space-y-6">
            {/* Presets Bar */}
            <div>
                <label className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5 mb-2.5">
                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                    <span>محطات قرآنية نموذجية (آيات جامعة للحروف):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {PRESET_SCAN_POINTS.map(preset => {
                        const isCurrent = selectedSurah === preset.surah && selectedAyah === preset.ayah;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset)}
                                className={`text-right p-3 rounded-lg border transition-all flex flex-col justify-between ${
                                    isCurrent
                                        ? 'bg-amber-500/10 border-amber-500/80 shadow-xs'
                                        : 'bg-surface-subtle border-border-default hover:border-primary/50 hover:bg-surface'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <span className="font-bold text-xs sm:text-sm text-text-primary">
                                        {preset.title}
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                                        سورة {preset.surahName}
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary line-clamp-1 font-amiri mt-1" dir="rtl">
                                    {preset.preview}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Position Selection */}
            <div className="bg-surface-subtle p-4 rounded-xl border border-border-default space-y-4">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-primary" />
                    <span>تأشير وتحديد موضع البداية بدقة (سورة / آية / كلمة):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Surah Dropdown */}
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            السورة:
                        </label>
                        <select
                            value={selectedSurah}
                            onChange={(e) => handleSurahChange(parseInt(e.target.value, 10))}
                            className="w-full bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {QURAN_INDEX.map(s => (
                                <option key={s.number} value={s.number}>
                                    {s.number}. {s.name.replace(/سُورَةُ\s*/g, '')} ({s.numberOfAyahs} آية)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ayah Number */}
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            رقم الآية (من 1 إلى {surahInfo.numberOfAyahs}):
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={surahInfo.numberOfAyahs}
                            value={selectedAyah}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1 && val <= surahInfo.numberOfAyahs) {
                                    setSelectedAyah(val);
                                    setSelectedWordIdxInAyah(0);
                                }
                            }}
                            className="w-full bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Word Pointer within Ayah */}
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                            نقطة الكلمة داخل الآية:
                        </label>
                        <select
                            value={selectedWordIdxInAyah}
                            onChange={(e) => setSelectedWordIdxInAyah(parseInt(e.target.value, 10))}
                            className="w-full bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 font-amiri"
                            disabled={wordsInSelectedAyah.length === 0}
                        >
                            {wordsInSelectedAyah.map((w, idx) => (
                                <option key={idx} value={idx}>
                                    الكلمة {idx + 1}: {w.text}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Live Preview of words in selected Ayah with clickable words */}
                {wordsInSelectedAyah.length > 0 && (
                    <div className="mt-3 p-3 bg-surface rounded-lg border border-border-subtle">
                        <span className="block text-xs font-semibold text-text-muted mb-2">
                            انقر مباشرة على أي كلمة لتحديدها كنقطة انطلاق للمسح:
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-amiri text-lg" dir="rtl">
                            {wordsInSelectedAyah.map((w, idx) => {
                                const isWordSelected = idx === selectedWordIdxInAyah;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedWordIdxInAyah(idx)}
                                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                            isWordSelected
                                                ? 'bg-primary text-white font-bold shadow-xs scale-105'
                                                : 'hover:bg-primary/10 text-text-primary hover:text-primary'
                                        }`}
                                        title={`الكلمة ${idx + 1}: ${w.text} (انقر للاختيار)`}
                                    >
                                        {w.text}
                                    </button>
                                );
                            })}
                            <span className="text-primary font-bold inline-flex items-center text-sm mr-1">
                                ﴿{selectedAyah}﴾
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Strategy and Direction Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Extraction Strategy */}
                <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-text-primary block">
                        طريقة انتقاء الحروف (آلية الاستخراج):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setStrategy('all_letters')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                strategy === 'all_letters'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">جميع الحروف بالتسلسل</span>
                            <span className="text-[10px] text-text-muted mt-0.5">مسح حرفاً بحرف داخل الكلمات</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStrategy('first_letter')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                strategy === 'first_letter'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">أوائل الكلمات فقط</span>
                            <span className="text-[10px] text-text-muted mt-0.5">أول حرف من كل كلمة متعاقبة</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStrategy('last_letter')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                strategy === 'last_letter'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">أواخر الكلمات فقط</span>
                            <span className="text-[10px] text-text-muted mt-0.5">الحرف الأخير من كل كلمة (القوافي)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStrategy('first_and_last')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                strategy === 'first_and_last'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">أوائل وأواخر الكلمات</span>
                            <span className="text-[10px] text-text-muted mt-0.5">الحرف الأول والأخير من كل كلمة</span>
                        </button>
                    </div>
                </div>

                {/* Scan Direction */}
                <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-text-primary block">
                        اتجاه مسار المسح:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setDirection('forward')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                direction === 'forward'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">مسح تقدمي للأمام</span>
                            <span className="text-[10px] text-text-muted mt-0.5">من موضع الكلمة نحو الآيات التالية</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirection('backward')}
                            className={`p-2.5 rounded-lg border text-right transition-all flex flex-col ${
                                direction === 'backward'
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                                    : 'bg-surface border-border-default text-text-secondary hover:border-primary/40'
                            }`}
                        >
                            <span className="text-xs font-bold">مسح تراجعي للخلف</span>
                            <span className="text-[10px] text-text-muted mt-0.5">من موضع الكلمة نحو الآيات السابقة</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex justify-end">
                <button
                    onClick={handleExecuteScan}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-focus text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer text-sm sm:text-base"
                >
                    <PlayIcon className="w-5 h-5" />
                    <span>تطبيق المسح من هذا الموضع</span>
                </button>
            </div>
        </div>
    );
};
