import React, { useState, useEffect } from 'react';
import { audioDspService, AudioDspConfig, DEFAULT_DSP_CONFIG } from '../services/audioDspService';
import { SparklesIcon, XIcon, CheckIcon } from './icons';

interface AudioDspModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AudioDspModal: React.FC<AudioDspModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<AudioDspConfig>(audioDspService.getConfig());

    useEffect(() => {
        return audioDspService.subscribe((newConfig) => {
            setConfig(newConfig);
        });
    }, []);

    if (!isOpen) return null;

    const handleToggle = () => {
        audioDspService.toggleEnabled();
    };

    const handlePreset = (preset: 'recommended' | 'haram' | 'studio') => {
        audioDspService.setPreset(preset);
    };

    const handleSliderChange = (key: keyof AudioDspConfig, value: number) => {
        audioDspService.saveConfig({ [key]: value, presetName: 'custom' });
    };

    const handleReset = () => {
        audioDspService.saveConfig(DEFAULT_DSP_CONFIG);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={onClose}
            dir="rtl"
        >
            <div 
                className="bg-surface border border-border-default rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-default/70">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <SparklesIcon className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-text-primary flex items-center gap-2">
                                <span>الهندسة الصوتية للتلاوة</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                                    DSP مباشر
                                </span>
                            </h3>
                            <p className="text-[11px] text-text-muted">
                                معالجة حية: عزل رنين 250Hz • إشعاع 3500Hz • صدى خفيف
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Master Switch Card */}
                <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    config.enabled 
                        ? 'bg-amber-500/10 border-amber-500/40 text-text-primary' 
                        : 'bg-surface-subtle/40 border-border-default text-text-muted'
                }`}>
                    <div>
                        <div className="font-bold text-xs sm:text-sm text-text-primary flex items-center gap-1.5">
                            <span>تفعيل المعالجة الصوتية</span>
                            {config.enabled && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            )}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                            {config.enabled ? 'المعالجة نشطة الآن على صوت المقرئ' : 'معطلة (يُسمع صوت المقرئ الخام الأصلي)'}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggle}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            config.enabled ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                        role="switch"
                        aria-checked={config.enabled}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                config.enabled ? '-translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* Presets */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">
                        الأنماط الصوتية الجاهزة:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* 1. Recommended (Requested) */}
                        <button
                            type="button"
                            onClick={() => handlePreset('recommended')}
                            className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                                config.presetName === 'recommended' && config.enabled
                                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/15 font-bold'
                                    : 'border-border-default bg-surface hover:bg-surface-subtle text-text-secondary'
                            }`}
                        >
                            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                                <span>الضبط الذهبي</span>
                                {config.presetName === 'recommended' && config.enabled && <CheckIcon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                                عزل 250Hz + إشعاع 3500Hz + صدى خفيف
                            </div>
                        </button>

                        {/* 2. Haram Ambience */}
                        <button
                            type="button"
                            onClick={() => handlePreset('haram')}
                            className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                                config.presetName === 'haram' && config.enabled
                                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/15 font-bold'
                                    : 'border-border-default bg-surface hover:bg-surface-subtle text-text-secondary'
                            }`}
                        >
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                                <span>رحاب الحرم</span>
                                {config.presetName === 'haram' && config.enabled && <CheckIcon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                                صدى أعمق وفخامة محراب المسجد
                            </div>
                        </button>

                        {/* 3. Studio */}
                        <button
                            type="button"
                            onClick={() => handlePreset('studio')}
                            className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                                config.presetName === 'studio' && config.enabled
                                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/15 font-bold'
                                    : 'border-border-default bg-surface hover:bg-surface-subtle text-text-secondary'
                            }`}
                        >
                            <div className="text-[11px] font-bold text-primary flex items-center justify-between">
                                <span>استوديو نقي</span>
                                {config.presetName === 'studio' && config.enabled && <CheckIcon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                                نقاء وإشعاع الحروف بدون صدى
                            </div>
                        </button>
                    </div>
                </div>

                {/* Fine Tuning Sliders */}
                <div className="space-y-3 pt-2 border-t border-border-default/60">
                    {/* 1. Cut 250Hz */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-primary">
                                عزل رنين الصندوق (250Hz):
                            </span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {config.cut250Gain} dB
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-12"
                            max="0"
                            step="0.5"
                            value={config.cut250Gain}
                            disabled={!config.enabled}
                            onChange={(e) => handleSliderChange('cut250Gain', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 accent-amber-500 rounded-lg cursor-pointer disabled:opacity-40"
                        />
                        <p className="text-[10px] text-text-muted">
                            يزيل الخنقة والرنين المكتوم ويجعل صوت القارئ صافياً ومفتوحاً.
                        </p>
                    </div>

                    {/* 2. Boost 3500Hz */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-primary">
                                إشعاع وبريق الصوت (3500Hz):
                            </span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                +{config.boost3500Gain} dB
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="8"
                            step="0.5"
                            value={config.boost3500Gain}
                            disabled={!config.enabled}
                            onChange={(e) => handleSliderChange('boost3500Gain', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 accent-emerald-500 rounded-lg cursor-pointer disabled:opacity-40"
                        />
                        <p className="text-[10px] text-text-muted">
                            يُبرز مخارج الحروف، والهمس، ونقاء تجويد الشيخ بوضوح باهر.
                        </p>
                    </div>

                    {/* 3. Reverb Level */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-text-primary">
                                الصدى الروحاني (Reverb):
                            </span>
                            <span className="font-mono font-bold text-primary">
                                {Math.round(config.reverbLevel * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.5"
                            step="0.02"
                            value={config.reverbLevel}
                            disabled={!config.enabled}
                            onChange={(e) => handleSliderChange('reverbLevel', parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 accent-primary rounded-lg cursor-pointer disabled:opacity-40"
                        />
                        <p className="text-[10px] text-text-muted">
                            صدى هادئ وموزون يحاكي محراب المسجد دون التشويش على التلاوة.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border-default/70">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
                    >
                        استعادة الضبط الافتراضي
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                    >
                        حسناً، تم
                    </button>
                </div>
            </div>
        </div>
    );
};
