import React from 'react';
import { useTheme, Theme } from '../../hooks/useTheme';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { MushafFrameStyle } from '../../types';
import { CheckIcon } from '../icons';

const THEME_OPTIONS: { id: Theme; name: string; emoji: string; desc: string; bgClass: string; textClass: string }[] = [
    { id: 'light', name: 'ورقي دافئ', emoji: '☀️', desc: 'خلفية دافئة مريحة للقراءة النهارية', bgClass: 'bg-[#FAF7F2]', textClass: 'text-[#2A2521]' },
    { id: 'dark', name: 'كحلي ليلي', emoji: '🌙', desc: 'ألوان داكنة مهدئة في الإضاءة الخافتة', bgClass: 'bg-[#0F172A]', textClass: 'text-[#F8FAFC]' },
    { id: 'duha', name: 'أكاديمي ناصع', emoji: '📄', desc: 'خلفية بيضاء وتباين أزرق نقي', bgClass: 'bg-[#F8FAFC]', textClass: 'text-[#0F172A]' },
    { id: 'isha', name: 'زيتي ملكي', emoji: '🌌', desc: 'داكن زيتي هادئ ومريح للعين', bgClass: 'bg-[#0B130E]', textClass: 'text-[#ECFDF5]' },
];

const FRAME_OPTIONS: { id: MushafFrameStyle; name: string; icon: string; desc: string }[] = [
    { id: 'classic', name: 'إطار مذهب كلاسيكي', icon: '🏛️', desc: 'خطوط ذهبية بهامش قرآني تقليدي' },
    { id: 'minimal', name: 'إطار ناعم ومخفف', icon: '🖼️', desc: 'بسيط يمنح مساحة مريحة على الموبايل' },
    { id: 'borderless', name: 'بدون إطار (نقي)', icon: '📖', desc: 'أقصى مساحة للقراءة دون تشتيت' },
    { id: 'ornate', name: 'إطار مزخرف تراثي', icon: '✨', desc: 'زوايا مقوسة مستوحاة من المصاحف القديمة' },
];

const AppearanceSettings: React.FC = () => {
    const { theme } = useTheme();
    const { mushafFrameStyle, setMushafFrameStyle } = useSettingsContext();

    const handleSelectTheme = (themeId: Theme) => {
        try {
            localStorage.setItem('theme', themeId);
            const themeClassesToRemove = ['dark', 'theme-light', 'theme-dark', 'theme-duha', 'theme-isha'];
            document.documentElement.classList.remove(...themeClassesToRemove);
            document.documentElement.classList.add(`theme-${themeId}`);
            if (themeId === 'dark' || themeId === 'isha') {
                document.documentElement.classList.add('dark');
            }
            window.dispatchEvent(new Event('storage'));
            window.location.reload();
        } catch (e) {}
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-xl font-bold text-text-primary">المظهر والواجهة</h2>
                <p className="text-xs text-text-muted mt-0.5">تخصيص ألوان التطبيق وشكل إطار صفحة المصحف.</p>
            </div>

            {/* Themes Selection */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    ثيمات الألوان
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {THEME_OPTIONS.map((item) => {
                        const isCurrent = theme === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectTheme(item.id)}
                                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                    isCurrent
                                        ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{item.emoji}</span>
                                        <span className="font-bold text-sm text-text-primary">{item.name}</span>
                                    </div>
                                    {isCurrent && <CheckIcon className="w-4 h-4 text-primary shrink-0" />}
                                </div>
                                <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                                <div className={`mt-2.5 p-1.5 rounded-lg text-center text-xs font-semibold ${item.bgClass} ${item.textClass} border border-black/10`}>
                                    ﴿ الحَمْدُ لِلَّهِ ﴾
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mushaf Frame Style Selector */}
            <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    إطار صفحة المصحف
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {FRAME_OPTIONS.map((item) => {
                        const isCurrent = (mushafFrameStyle || 'classic') === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setMushafFrameStyle(item.id)}
                                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                    isCurrent
                                        ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 font-bold text-sm text-text-primary">
                                            <span>{item.icon}</span>
                                            <span>{item.name}</span>
                                        </div>
                                        {isCurrent && <CheckIcon className="w-4 h-4 text-primary shrink-0" />}
                                    </div>
                                    <p className="text-xs text-text-muted mt-1 leading-normal">{item.desc}</p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-border-subtle/50 flex items-center justify-center">
                                    <div className={`w-full py-1.5 px-2 text-center text-xs font-quran-title transition-all ${
                                        item.id === 'classic' 
                                            ? 'border-2 border-amber-600/70 bg-amber-500/5 rounded shadow-xs' 
                                            : item.id === 'minimal'
                                            ? 'border border-border-default bg-surface rounded-lg'
                                            : item.id === 'borderless'
                                            ? 'border-none bg-transparent'
                                            : 'border-2 border-dashed border-amber-700/60 bg-amber-500/10 rounded-xl'
                                    }`}>
                                        <span className="text-text-primary text-[11px]">﴿ بِسۡمِ ٱللَّهِ ﴾</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;
