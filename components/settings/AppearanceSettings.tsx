import React from 'react';
import { useTheme, Theme } from '../../hooks/useTheme';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { MushafFrameStyle } from '../../types';
import { SunIcon, MoonIcon, CheckIcon } from '../icons';

const THEME_OPTIONS: { id: Theme; name: string; emoji: string; desc: string; bgClass: string; textClass: string }[] = [
    { id: 'light', name: 'ورقي دافئ (نهاري)', emoji: '☀️', desc: 'خلفية دافئة بلون الورق الطبيعي مريحة للقراءة في النهار', bgClass: 'bg-[#FAF7F2]', textClass: 'text-[#2A2521]' },
    { id: 'dark', name: 'كحلي هادئ (ليلي)', emoji: '🌙', desc: 'ألوان داكنة كحلية مهدئة للعين في الإضاءة الخافتة', bgClass: 'bg-[#0F172A]', textClass: 'text-[#F8FAFC]' },
    { id: 'duha', name: 'أكاديمي نقي (نهاري)', emoji: '📄', desc: 'تباين نقي وواضح بخلفية بيضاء ودرجات الأزرق الأكاديمي', bgClass: 'bg-[#F8FAFC]', textClass: 'text-[#0F172A]' },
    { id: 'isha', name: 'زيتي ليلي (ليلي)', emoji: '🌌', desc: 'ألوان داكنة زيتية ملكية لمحبي القراءة الليلية الهادئة', bgClass: 'bg-[#0B130E]', textClass: 'text-[#ECFDF5]' },
];

const FRAME_OPTIONS: { id: MushafFrameStyle; name: string; icon: string; desc: string; badge: string }[] = [
    { id: 'classic', name: 'الإطار الكلاسيكي المذهب', icon: '🏛️', desc: 'الإطار القرآني المزدوج مع خطوط ذهبية رقيقة وهامش أمان للموبايل', badge: 'الافتراضي' },
    { id: 'minimal', name: 'الإطار المخفف الناعم (Minimal)', icon: '🖼️', desc: 'إطار خارجي بسيط وناعم يمنح مساحة كافية للكلمات بدون خطوط داخلية', badge: 'مستحسن للموبايل' },
    { id: 'borderless', name: 'قراءة نقية بدون إطار (Borderless)', icon: '📖', desc: 'صفحة نقية تماماً بدون أي حواف تمنح أقصى مساحة للقراءة دون أي تشتيت', badge: 'الأوسع للشاشات الصغيرة' },
    { id: 'ornate', name: 'الإطار الإسلامي المزخرف', icon: '✨', desc: 'إطار بحواف مقوسة وزوايا هندسية مستوحاة من المصاحف العريقة', badge: 'تراثي فاخر' },
];

const AppearanceSettings: React.FC = () => {
    const { theme, name, cycleTheme } = useTheme();
    const { mushafFrameStyle, setMushafFrameStyle } = useSettingsContext();

    const handleSelectTheme = (themeId: Theme) => {
        // Safe set theme in localStorage and document element
        try {
            localStorage.setItem('theme', themeId);
            const themeClassesToRemove = ['dark', 'theme-light', 'theme-dark', 'theme-duha', 'theme-isha'];
            document.documentElement.classList.remove(...themeClassesToRemove);
            document.documentElement.classList.add(`theme-${themeId}`);
            if (themeId === 'dark' || themeId === 'isha') {
                document.documentElement.classList.add('dark');
            }
            // Trigger window event or force re-render
            window.dispatchEvent(new Event('storage'));
            window.location.reload();
        } catch (e) {}
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">المظهر والواجهة</h2>
                <p className="text-sm text-text-secondary">تخصيص ثيمات الألوان، إطار المصحف، والوضع الليلي/النهاري للتطبيق.</p>
            </div>

            {/* Mushaf Frame Style Selector */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-primary/20 space-y-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                            عرض وتنسيق الصفحة
                        </span>
                    </div>
                    <h3 className="font-bold text-lg text-text-primary mt-2">إطار وزخارف صفحة المصحف</h3>
                    <p className="text-xs text-text-muted">اختر شكل الإطار المحيط بصفحات المصحف، وتخفيفه أو إلغائه لمنع خروج الكلمات على شاشات الموبايل</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {FRAME_OPTIONS.map((item) => {
                        const isCurrent = (mushafFrameStyle || 'classic') === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setMushafFrameStyle(item.id)}
                                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                    isCurrent
                                        ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-primary/30'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div>
                                            <div className="font-bold text-base text-text-primary flex items-center gap-2">
                                                <span>{item.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                    isCurrent ? 'bg-primary/15 text-primary font-bold' : 'bg-surface-subtle text-text-muted border border-border-subtle'
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <div className="text-xs text-text-muted mt-1 leading-relaxed">{item.desc}</div>
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Preview mini-frame */}
                                <div className="mt-4 pt-2 border-t border-border-subtle/50 flex items-center justify-center">
                                    <div className={`w-full py-2 px-3 text-center text-xs font-quran-title transition-all ${
                                        item.id === 'classic' 
                                            ? 'border-2 border-amber-600/70 bg-amber-500/5 rounded shadow-xs' 
                                            : item.id === 'minimal'
                                            ? 'border border-border-default bg-surface rounded-lg'
                                            : item.id === 'borderless'
                                            ? 'border-none bg-transparent'
                                            : 'border-2 border-dashed border-amber-700/60 bg-amber-500/10 rounded-xl'
                                    }`}>
                                        <span className="text-text-primary text-xs">﴿ بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ ﴾</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Themes Selection */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">ثيمات الألوان</h3>
                    <p className="text-xs text-text-muted">اختر الثيم المفضل القريب لعينيك وطبيعة إضاءة المكان</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {THEME_OPTIONS.map((item) => {
                        const isCurrent = theme === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSelectTheme(item.id)}
                                className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                                    isCurrent
                                        ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-primary/30'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{item.emoji}</span>
                                        <div>
                                            <div className="font-bold text-base text-text-primary">{item.name}</div>
                                            <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                            <CheckIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>

                                <div className={`mt-4 p-3 rounded-xl border border-black/10 flex items-center justify-between ${item.bgClass} ${item.textClass}`}>
                                    <span className="text-xs font-semibold">عينة النص: ﴿ الحَمْدُ لِلَّهِ ﴾</span>
                                    <span className="text-xs opacity-70">معاينة</span>
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
