import React, { useState } from 'react';
import { XIcon, SparklesIcon, CheckIcon, ArrowPathIcon } from './icons';

interface DhikrModalProps {
    isOpen: boolean;
    onClose: () => void;
    repeatAyahTarget: number;
    setRepeatAyahTarget: (n: number) => void;
    repeatPlaylistTarget: number;
    setRepeatPlaylistTarget: (n: number) => void;
    delaySeconds: number;
    setDelaySeconds: (n: number) => void;
    onStartPlayback?: () => void;
    currentAyahRepeatCount?: number;
    playlistLength?: number;
}

const AYAH_REPEAT_PRESETS = [
    { value: 1, label: 'مرة واحدة', desc: 'عادي بدون تكرار' },
    { value: 3, label: '٣ مرات', desc: 'سنة الأذكار والرقية' },
    { value: 7, label: '٧ مرات', desc: 'السبع المثاني والفاتحة' },
    { value: 10, label: '١٠ مرات', desc: 'المراجعة والتدبر' },
    { value: 33, label: '٣٣ مرة', desc: 'ورد التسبيح المسنون' },
    { value: 100, label: '١٠٠ مرة', desc: 'ورد الذكر والاستغفار' },
    { value: 0, label: 'تكرار لا نهائي ∞', desc: 'تكرار مستمر حتى الإيقاف' },
];

const PLAYLIST_REPEAT_PRESETS = [
    { value: 1, label: 'مرة واحدة' },
    { value: 3, label: '٣ دورات' },
    { value: 5, label: '٥ دورات' },
    { value: 0, label: 'دوري مستمر ∞' },
];

const DELAY_PRESETS = [
    { value: 0, label: 'مباشرة' },
    { value: 1, label: 'ثانية' },
    { value: 2, label: 'ثانيتان' },
    { value: 3, label: '٣ ثوانٍ (للترديد)' },
];

export const DhikrModal: React.FC<DhikrModalProps> = ({
    isOpen,
    onClose,
    repeatAyahTarget,
    setRepeatAyahTarget,
    repeatPlaylistTarget,
    setRepeatPlaylistTarget,
    delaySeconds,
    setDelaySeconds,
    onStartPlayback,
    currentAyahRepeatCount = 1,
    playlistLength,
}) => {
    const [customNumber, setCustomNumber] = useState<string>('');
    const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
        return repeatAyahTarget > 0 && !AYAH_REPEAT_PRESETS.some(p => p.value === repeatAyahTarget);
    });

    if (!isOpen) return null;

    const handleSelectAyahTarget = (val: number) => {
        setIsCustomMode(false);
        setRepeatAyahTarget(val);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseInt(customNumber, 10);
        if (!isNaN(num) && num > 0) {
            setRepeatAyahTarget(num);
            setIsCustomMode(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in" dir="rtl">
            <div 
                className="bg-surface border border-border-default rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col gap-5 text-text-primary"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border-default pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
                                <span>وضع الذكر والتكرار القرآني</span>
                                {repeatAyahTarget > 1 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                                        نشط ({repeatAyahTarget === 0 ? '∞' : `${repeatAyahTarget}x`})
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-text-secondary mt-0.5">
                                حدد عدد تكرار كل آية بدقة للأوراد والتسبيح والحفظ والتدبر
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                        aria-label="إغلاق"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Section 1: Repeat count per Ayah */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                            <span>تكرار كل آية:</span>
                            <span className="text-primary font-mono text-base">
                                {repeatAyahTarget === 0 ? 'تكرار مستمر (∞)' : `${repeatAyahTarget} ${repeatAyahTarget === 1 ? 'مرة (عادي)' : 'مرات'}`}
                            </span>
                        </label>
                        {repeatAyahTarget > 1 && (
                            <span className="text-[11px] text-text-muted">
                                الحالية: المرة {currentAyahRepeatCount} من {repeatAyahTarget === 0 ? '∞' : repeatAyahTarget}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AYAH_REPEAT_PRESETS.map((preset) => {
                            const isSelected = !isCustomMode && repeatAyahTarget === preset.value;
                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleSelectAyahTarget(preset.value)}
                                    className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                                            : 'bg-surface-subtle border-border-default hover:bg-surface-hover text-text-primary'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm font-semibold">{preset.label}</span>
                                        {isSelected && <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                    </div>
                                    <span className="text-[11px] text-text-muted mt-0.5 leading-tight">{preset.desc}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom number input */}
                    <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mt-1">
                        <input
                            type="number"
                            min="1"
                            max="999"
                            placeholder="أو اكتب رقماً مخصصاً (مثال: 5، 21، 40)..."
                            value={customNumber}
                            onChange={(e) => setCustomNumber(e.target.value)}
                            className="flex-grow px-3 py-2 text-sm bg-surface-subtle border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-text-primary"
                        />
                        <button
                            type="submit"
                            disabled={!customNumber}
                            className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        >
                            تحديد
                        </button>
                    </form>
                </div>

                {/* Section 2: Pause delay between repetitions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-border-default">
                    <label className="text-sm font-bold text-text-primary">
                        المهلة بين كل تكرار (للاستماع والترديد):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DELAY_PRESETS.map((d) => (
                            <button
                                key={d.value}
                                type="button"
                                onClick={() => setDelaySeconds(d.value)}
                                className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                    delaySeconds === d.value
                                        ? 'bg-primary/15 border-primary text-primary font-bold'
                                        : 'bg-surface-subtle border-border-default hover:bg-surface-hover text-text-secondary'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Repeat entire playlist/selection */}
                {playlistLength && playlistLength > 1 && (
                    <div className="flex flex-col gap-2 pt-3 border-t border-border-default">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                                <span>تكرار كامل القائمة ({playlistLength} آيات):</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PLAYLIST_REPEAT_PRESETS.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setRepeatPlaylistTarget(p.value)}
                                    className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                        repeatPlaylistTarget === p.value
                                            ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                                            : 'bg-surface-subtle border-border-default hover:bg-surface-hover text-text-secondary'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default mt-2">
                    <button
                        type="button"
                        onClick={() => {
                            setRepeatAyahTarget(1);
                            setRepeatPlaylistTarget(1);
                            setDelaySeconds(0);
                            setIsCustomMode(false);
                            setCustomNumber('');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-xl transition-colors cursor-pointer"
                    >
                        إعادة ضبط للوضع العادي
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (onStartPlayback) onStartPlayback();
                            onClose();
                        }}
                        className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>{onStartPlayback ? 'بدء الذكر والتشغيل' : 'حفظ ومتابعة'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DhikrModal;
