import React, { useState } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { FontSize, FontStyleType, WordClickBehavior } from '../../types';
import { CheckIcon, SunIcon, MoonIcon } from '../icons';
import { renderWordWithNoorani } from '../../utils/nooraniHighlight';
import { safeLocalStorage } from '../../utils/storage';

const FONT_SIZES: { id: FontSize; label: string; px: string }[] = [
    { id: 'xs', label: 'صغير جداً', px: '16px' },
    { id: 'sm', label: 'صغير', px: '20px' },
    { id: 'md', label: 'متوسط', px: '24px' },
    { id: 'lg', label: 'كبير', px: '28px' },
    { id: 'xl', label: 'كبير جداً', px: '32px' },
    { id: 'xxl', label: 'ضخم', px: '40px' },
];

const FONT_STYLES: { id: FontStyleType; name: string; desc: string; requiresDownload?: boolean }[] = [
    { id: 'uthmani', name: 'الرسم العثماني القياسي', desc: 'بالتشكيل وعلامات الوقف والضبط' },
    { id: 'mushaf', name: 'مصحف المدينة (604 صفحة)', desc: 'مطابق لصفحات المصحف الورقي المطبوع', requiresDownload: true },
];

interface SwitchItemProps {
    id: string;
    checked: boolean;
    onChange: () => void;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    icon?: React.ReactNode;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
    id,
    checked,
    onChange,
    title,
    subtitle,
    badge,
    badgeColor = 'bg-primary/10 text-primary',
    icon
}) => {
    return (
        <div
            onClick={onChange}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                checked
                    ? 'bg-surface border-primary/40 ring-1 ring-primary/20 shadow-xs'
                    : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
            }`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {icon && <span className="text-lg shrink-0">{icon}</span>}
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary truncate">{title}</span>
                        {badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${badgeColor}`}>
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>

            {/* Accessible toggle switch */}
            <div
                role="switch"
                aria-checked={checked}
                aria-labelledby={id}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                    checked ? 'bg-primary' : 'bg-surface-hover border border-border-default'
                }`}
            >
                <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                        checked ? '-translate-x-4' : '-translate-x-0.5'
                    }`}
                />
            </div>
        </div>
    );
};

const ReadingSettings: React.FC = () => {
    const { 
        fontSize, setFontSize, 
        fontStyle, setFontStyle, 
        selectedEdition, setSelectedEdition,
        enableTajweed, setEnableTajweed,
        enableWordAudio, setEnableWordAudio,
        wordClickBehavior, setWordClickBehavior,
        enableMorphology, setEnableMorphology,
        showBottomNavBar, setShowBottomNavBar,
        showMuqattaatInSearch, setShowMuqattaatInSearch,
        showImlaeiTashkeel, setShowImlaeiTashkeel,
        highlightHaMeem, setHighlightHaMeem,
        highlightNoorani, setHighlightNoorani,
        highlightNooraniIncludeWaw, setHighlightNooraniIncludeWaw,
        highlightNooraniIncludeTaaMarbuta, setHighlightNooraniIncludeTaaMarbuta,
        fontDownloadProgress,
        isDownloadingFonts,
        isMushafDownloaded,
        startFontDownload,
        cancelFontDownload,
        removeMushafFonts,
        // Shamarly
        mushafType, setMushafType,
        isShamarlyDownloaded,
        isDownloadingShamarly,
        shamarlyDownloadProgress,
        startShamarlyDownload,
        cancelShamarlyDownload,
        removeShamarlyMushaf,
        enableShamarlyInHeader, setEnableShamarlyInHeader
    } = useSettingsContext();

    const handleDownloadFonts = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await startFontDownload();
    };

    const handleDeleteFonts = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await removeMushafFonts();
    };

    const handleCancelDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        cancelFontDownload();
    };

    const handleDownloadShamarly = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await startShamarlyDownload();
    };

    const handleDeleteShamarly = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await removeShamarlyMushaf();
    };

    const handleCancelShamarlyDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        cancelShamarlyDownload();
    };

    const [shamarlyColorMode, setShamarlyColorMode] = useState<string>(() => {
        return safeLocalStorage.getItem('shamarly_page_color_mode') || 'auto';
    });

    const handleSetShamarlyColorMode = (mode: string) => {
        setShamarlyColorMode(mode);
        safeLocalStorage.setItem('shamarly_page_color_mode', mode);
    };

    const isUthmaniSelected = fontStyle === 'uthmani';
    const isMadinahSelected = fontStyle === 'mushaf' && mushafType === 'madinah';
    const isShamarlySelected = fontStyle === 'mushaf' && mushafType === 'shamarly';

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-text-primary">إعدادات القراءة والمصحف</h2>
                <p className="text-xs text-text-muted mt-0.5">خصص طبعة المصحف، الخط، الحجم، وسلوك التفاعل مع الكلمات والآيات.</p>
            </div>

            {/* 1. Primary Reading Mode & Mushaf Selection (Uthmani, Madinah, Shamarly) */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                        طريقة عرض وقراءة القرآن
                    </label>
                    <span className="text-[11px] text-text-muted font-medium">
                        {isUthmaniSelected && 'الرسم العثماني القياسي'}
                        {isMadinahSelected && 'مصحف المدينة (٦٠٤ صفحة)'}
                        {isShamarlySelected && 'مصحف الشمرلي (٥٢٢ صفحة)'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Option 1: Uthmani Text */}
                    <div
                        onClick={() => {
                            setFontStyle('uthmani');
                            setSelectedEdition('quran-uthmani-quran-academy');
                        }}
                        className={`p-3.5 rounded-xl border text-right transition-all select-none flex flex-col justify-between cursor-pointer ${
                            isUthmaniSelected
                                ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                    <span>الرسم العثماني القياسي</span>
                                </div>
                                {isUthmaniSelected && (
                                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                        <CheckIcon className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                نص رقمي تفاعلي
                            </span>
                            <p className="text-xs text-text-muted mt-1 leading-normal">
                                بالتشكيل وعلامات الوقف والضبط، مع التكبير والتفسير التفاعلي للآيات.
                            </p>
                        </div>
                    </div>

                    {/* Option 2: Madinah Mushaf */}
                    <div
                        onClick={() => {
                            if (isDownloadingFonts) return;
                            setMushafType('madinah');
                            setFontStyle('mushaf');
                            setSelectedEdition('quran-uthmani-quran-academy');
                        }}
                        className={`p-3.5 rounded-xl border text-right transition-all select-none flex flex-col justify-between ${
                            isDownloadingFonts ? 'cursor-default opacity-80' : 'cursor-pointer'
                        } ${
                            isMadinahSelected
                                ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                    <span>مصحف المدينة المنورة</span>
                                </div>
                                {isMadinahSelected && (
                                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                        <CheckIcon className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                ٦٠٤ صفحة • مجمع الملك فهد
                            </span>
                            <p className="text-xs text-text-muted mt-1 leading-normal">
                                مطابق لصفحات المصحف الورقي المطبوع، بخطوط عثمانية رقمية دقيقة.
                            </p>
                        </div>

                        {/* Offline Controls for Madinah Mushaf */}
                        <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                            {!isMushafDownloaded && !isDownloadingFonts && (
                                <button
                                    type="button"
                                    onClick={handleDownloadFonts}
                                    className="w-full text-center py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
                                >
                                    ⬇️ تنزيل للأوفلاين (604 صفحة)
                                </button>
                            )}
                            {isMushafDownloaded && (
                                <div className="flex items-center justify-between w-full text-xs">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckIcon className="w-3.5 h-3.5" /> مثبت أوفلاين
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={handleDownloadFonts} className="text-primary hover:underline cursor-pointer">تحديث</button>
                                        <span className="text-text-muted">•</span>
                                        <button type="button" onClick={handleDeleteFonts} className="text-red-500 hover:underline cursor-pointer">حذف</button>
                                    </div>
                                </div>
                            )}
                            {isDownloadingFonts && (
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-primary font-medium">جاري التحميل... {fontDownloadProgress}%</span>
                                        <button type="button" onClick={handleCancelDownload} className="text-red-500 hover:underline cursor-pointer">إلغاء</button>
                                    </div>
                                    <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${Math.max(0, fontDownloadProgress)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Option 3: Shamarly Mushaf */}
                    <div
                        onClick={() => {
                            if (isDownloadingShamarly) return;
                            setMushafType('shamarly');
                            setFontStyle('mushaf');
                            setEnableShamarlyInHeader(true);
                            setSelectedEdition('quran-uthmani-quran-academy');
                        }}
                        className={`p-3.5 rounded-xl border text-right transition-all select-none flex flex-col justify-between ${
                            isDownloadingShamarly ? 'cursor-default opacity-80' : 'cursor-pointer'
                        } ${
                            isShamarlySelected
                                ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                    <span>مصحف الشمرلي الشهير</span>
                                </div>
                                {isShamarlySelected && (
                                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                        <CheckIcon className="w-3 h-3" />
                                    </span>
                                )}
                            </div>
                            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                ٥٢٢ صفحة • الطبعة المصرية الشهيرة
                            </span>
                            <p className="text-xs text-text-muted mt-1 leading-normal">
                                الخط العريض الواسع، صفحات مصورة عالية الدقة مع العرض الليلي والزوم الحر.
                            </p>
                        </div>

                        {/* Offline Controls for Shamarly Mushaf */}
                        <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                            {!isShamarlyDownloaded && !isDownloadingShamarly && (
                                <button
                                    type="button"
                                    onClick={handleDownloadShamarly}
                                    className="w-full text-center py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    ⬇️ تنزيل للأوفلاين (48 ميجابايت)
                                </button>
                            )}
                            {isShamarlyDownloaded && (
                                <div className="flex items-center justify-between w-full text-xs">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckIcon className="w-3.5 h-3.5" /> مثبت أوفلاين (٤٨ م.ب)
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={handleDownloadShamarly} className="text-primary hover:underline cursor-pointer">تحديث</button>
                                        <span className="text-text-muted">•</span>
                                        <button type="button" onClick={handleDeleteShamarly} className="text-red-500 hover:underline cursor-pointer">حذف</button>
                                    </div>
                                </div>
                            )}
                            {isDownloadingShamarly && (
                                <div className="w-full space-y-1">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-primary font-medium">جاري التحميل... {shamarlyDownloadProgress}%</span>
                                        <button type="button" onClick={handleCancelShamarlyDownload} className="text-red-500 hover:underline cursor-pointer">إلغاء</button>
                                    </div>
                                    <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${Math.max(0, shamarlyDownloadProgress)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dedicated Shamarly Settings Panel (When Shamarly is selected) */}
            {isShamarlySelected && (
                <div className="space-y-3 p-4 rounded-2xl bg-surface-subtle border border-border-default animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                        <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                            <span>خيارات مصحف الشمرلي</span>
                        </label>
                        <span className="text-[11px] text-text-muted font-medium">
                            {isShamarlyDownloaded ? '✅ يعمل بدون إنترنت' : '🌐 تصفح أونلاين سريع'}
                        </span>
                    </div>

                    {/* Paper Appearance Mode */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                        <div>
                            <span className="text-xs font-bold text-text-primary">مظهر صفحة المصحف والعرض الليلي:</span>
                            <p className="text-[11px] text-text-muted">الوضع الليلي يعتم الورق ويحول النص لأبيض مع الحفاظ على الألوان الذهبية.</p>
                        </div>
                        <div className="flex items-center bg-surface rounded-xl border border-border-default p-1 shadow-2xs gap-1">
                            <button
                                type="button"
                                onClick={() => handleSetShamarlyColorMode('dark')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                    shamarlyColorMode === 'dark' 
                                        ? 'bg-slate-800 text-amber-300 font-bold shadow-xs ring-1 ring-amber-400/30' 
                                        : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                🌙 ليلي معتم
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetShamarlyColorMode('light')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                    shamarlyColorMode === 'light' 
                                        ? 'bg-primary text-white font-bold shadow-xs' 
                                        : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                ☀️ ورق أصلي
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetShamarlyColorMode('sepia')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                    shamarlyColorMode === 'sepia' 
                                        ? 'bg-amber-600 text-white font-bold shadow-xs' 
                                        : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                📜 ورق دافئ
                            </button>
                        </div>
                    </div>

                    {/* Header Switcher Toggle */}
                    <div className="pt-2 border-t border-border-subtle/60">
                        <SwitchItem
                            id="enable-shamarly-header"
                            checked={enableShamarlyInHeader}
                            onChange={() => setEnableShamarlyInHeader(!enableShamarlyInHeader)}
                            title="إظهار أيقونة مصحف الشمرلي في الشريط العلوي"
                            subtitle="يتيح لك التبديل السريع بين الرسم العثماني ومصحف الشمرلي بنقرة واحدة من أعلى الشاشة"
                            badge="وصول سريع"
                            badgeColor="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        />
                    </div>
                </div>
            )}

            {/* 2. Font Size & Compact Live Preview */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        حجم الخط
                    </label>
                    <span className="text-xs text-text-muted font-medium">
                        {FONT_SIZES.find(s => s.id === fontSize)?.label} ({FONT_SIZES.find(s => s.id === fontSize)?.px})
                    </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {FONT_SIZES.map((size) => (
                        <button
                            key={size.id}
                            type="button"
                            onClick={() => setFontSize(size.id)}
                            className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                                fontSize === size.id
                                    ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                    : 'bg-surface text-text-primary border-border-default hover:border-primary/40'
                            }`}
                        >
                            <div>{size.label}</div>
                            <div className="opacity-70 text-[10px] mt-0.5" dir="ltr">{size.px}</div>
                        </button>
                    ))}
                </div>

                {/* Compact Live Preview */}
                <div className="p-4 bg-surface rounded-xl border border-border-default text-center shadow-inner mt-2">
                    <p className={`text-text-primary leading-loose ${fontStyle === 'uthmani' || fontStyle === 'mushaf' ? 'font-quran-title' : 'font-quran-simple'} transition-all text-${fontSize}`}>
                        {highlightNoorani ? (
                            <>
                                ﴿ {renderWordWithNoorani('أَلَمْ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('نَشْرَحْ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('لَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('صَدْرَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} ۝ {renderWordWithNoorani('وَوَضَعْنَا', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('عَنكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('وِزْرَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} ﴾
                            </>
                        ) : (
                            '﴿ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنكَ وِزْرَكَ ﴾'
                        )}
                    </p>
                    {highlightNoorani && (
                        <div className="mt-2 pt-2 border-t border-border-subtle flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                ✨ معاينة تلوين الأحرف النورانية {highlightNooraniIncludeWaw || highlightNooraniIncludeTaaMarbuta ? `(${[highlightNooraniIncludeWaw ? '+ الواو' : '', highlightNooraniIncludeTaaMarbuta ? '+ التاء المربوطة' : ''].filter(Boolean).join('، ')})` : '(الـ 14 الأصلية)'}:
                            </span>
                            <p className={`text-text-primary leading-loose ${fontStyle === 'uthmani' || fontStyle === 'mushaf' ? 'font-quran-title' : 'font-quran-simple'} transition-all text-${fontSize}`}>
                                ﴿ {renderWordWithNoorani('الم', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} ۝ {renderWordWithNoorani('تِلۡكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('ءَايَٰتُ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('ٱلۡكِتَٰبِ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} ۝ {renderWordWithNoorani('هُدًى', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} {renderWordWithNoorani('وَرَحۡمَةً', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw, highlightNooraniIncludeTaaMarbuta)} ﴾
                            </p>
                        </div>
                    )}
                    {highlightHaMeem && !highlightNoorani && (
                        <p className={`mt-2 pt-2 border-t border-border-subtle text-text-primary leading-loose ${fontStyle === 'uthmani' || fontStyle === 'mushaf' ? 'font-quran-title' : 'font-quran-simple'} transition-all text-${fontSize}`}>
                            ﴿ <span className="text-amber-600 dark:text-amber-400 font-bold">حـٓمٓ</span> ۝ تَنزِيلُ ٱلۡكِتَٰبِ مِنَ ٱللَّهِ ٱلۡعَزِيزِ ٱلۡعَلِيمِ ﴾
                        </p>
                    )}
                </div>
            </div>

            {/* 3. Word Click Behavior */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    سلوك النقر على الكلمة
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                        { id: 'auto' as WordClickBehavior, icon: '⚡', label: 'تلقائي', desc: 'بحث بالإملائي، وقائمة بالمصحف' },
                        { id: 'direct_search' as WordClickBehavior, icon: '🔍', label: 'بحث فوري', desc: 'فتح نتائج البحث فور الضغط' },
                        { id: 'show_menu' as WordClickBehavior, icon: '📋', label: 'قائمة الخيارات', desc: 'إظهار خيارات البحث، الإعراب، والصوت' },
                    ].map((item) => {
                        const isSelected = wordClickBehavior === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setWordClickBehavior(item.id)}
                                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                        ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{item.icon}</span>
                                    <div>
                                        <div className="font-bold text-sm text-text-primary">{item.label}</div>
                                        <div className="text-[11px] text-text-muted">{item.desc}</div>
                                    </div>
                                </div>
                                {isSelected && <CheckIcon className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Additional Reading Features & Quick Toggles */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    ميزات وتفضيلات إضافية
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {/* Word audio pronunciation - Default now false */}
                    <SwitchItem
                        id="switch-word-audio"
                        icon="🔊"
                        title="نطق الكلمة عند النقر"
                        subtitle="تلاوة صوت المفردة فور النقر عليها"
                        checked={enableWordAudio}
                        onChange={() => setEnableWordAudio(!enableWordAudio)}
                    />

                    {/* Word morphology */}
                    <SwitchItem
                        id="switch-morphology"
                        icon="📐"
                        title="التحليل الصرفي والإعراب"
                        subtitle="إظهار الجذر والإعراب في قائمة الكلمة"
                        checked={enableMorphology}
                        onChange={() => setEnableMorphology(!enableMorphology)}
                    />

                    {/* Tajweed colors */}
                    <SwitchItem
                        id="switch-tajweed"
                        icon="🎨"
                        title="التجويد الملون"
                        subtitle="تلوين أحكام التجويد والمدود"
                        checked={enableTajweed}
                        onChange={() => setEnableTajweed(!enableTajweed)}
                    />

                    {/* Noorani Letters Highlight */}
                    <div className="space-y-2">
                        <SwitchItem
                            id="switch-noorani-letters"
                            icon={<span className="text-amber-600 dark:text-amber-400 font-bold text-sm">✨ نور</span>}
                            title="تلوين الأحرف النورانية في المصحف"
                            subtitle="تمييز أحرف الفواتح بلون ذهبي مكيّف مع كل ثيم"
                            badge="ذهبي"
                            badgeColor="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/40 dark:border-amber-600/40"
                            checked={highlightNoorani}
                            onChange={() => setHighlightNoorani(!highlightNoorani)}
                        />

                        {highlightNoorani && (
                            <div className="mr-5 pr-3 border-r-2 border-amber-400/40 dark:border-amber-500/30 space-y-2">
                                <SwitchItem
                                    id="switch-noorani-include-waw"
                                    icon={<span className="text-amber-700 dark:text-amber-300 font-bold text-base">و</span>}
                                    title="إضافة حرف الواو (و) إلى الأحرف النورانية"
                                    subtitle="إدراج حرف الواو (و، ؤ) ضمن الحروف الملونة بالذهبي"
                                    badge="+ حرف الواو"
                                    badgeColor="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300/50 dark:border-amber-700/50"
                                    checked={highlightNooraniIncludeWaw}
                                    onChange={() => setHighlightNooraniIncludeWaw(!highlightNooraniIncludeWaw)}
                                />
                                <SwitchItem
                                    id="switch-noorani-include-taa-marbuta"
                                    icon={<span className="text-amber-700 dark:text-amber-300 font-bold text-base">ة</span>}
                                    title="إضافة التاء المربوطة (ة) إلى الأحرف النورانية"
                                    subtitle="إدراج التاء المربوطة (ة، ۃ) ضمن الحروف الملونة بالذهبي"
                                    badge="+ التاء المربوطة"
                                    badgeColor="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300/50 dark:border-amber-700/50"
                                    checked={highlightNooraniIncludeTaaMarbuta}
                                    onChange={() => setHighlightNooraniIncludeTaaMarbuta(!highlightNooraniIncludeTaaMarbuta)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Ha-Meem Highlight */}
                    <SwitchItem
                        id="switch-ha-meem"
                        icon={<span className="text-amber-600 dark:text-amber-400 font-bold text-sm">حـم</span>}
                        title="تلوين الحرفين (حم)"
                        subtitle="تمييز الحرفين بلون عنبري لسهولة الرصد"
                        badge="اختياري"
                        badgeColor="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                        checked={highlightHaMeem}
                        onChange={() => setHighlightHaMeem(!highlightHaMeem)}
                    />

                    {/* Bottom floating nav */}
                    <SwitchItem
                        id="switch-bottom-nav"
                        icon="🧭"
                        title="شريط التنقل السفلي"
                        subtitle="شريط عائم للانتقال السريع بين الصفحات"
                        checked={showBottomNavBar}
                        onChange={() => setShowBottomNavBar(!showBottomNavBar)}
                    />

                    {/* Muqattaat in Search */}
                    <SwitchItem
                        id="switch-muqattaat"
                        icon="🔤"
                        title="فواتح السور في البحث"
                        subtitle="عرض الأحرف النورانية بجانب النتائج"
                        checked={showMuqattaatInSearch}
                        onChange={() => setShowMuqattaatInSearch(!showMuqattaatInSearch)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReadingSettings;
