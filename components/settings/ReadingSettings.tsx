import React from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { FontSize, FontStyleType, WordClickBehavior } from '../../types';
import { CheckIcon } from '../icons';
import { renderWordWithNoorani } from '../../utils/nooraniHighlight';

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
        fontDownloadProgress,
        isDownloadingFonts,
        isMushafDownloaded,
        startFontDownload,
        cancelFontDownload,
        removeMushafFonts
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

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-text-primary">إعدادات القراءة والمصحف</h2>
                <p className="text-xs text-text-muted mt-0.5">خصص الخط، الحجم، وسلوك التفاعل مع الكلمات والآيات.</p>
            </div>

            {/* 1. Font Style Selection */}
            <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    نمط الخط والعرض
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {FONT_STYLES.map((style) => {
                        const isSelected = fontStyle === style.id;
                        const isMushafStyle = style.id === 'mushaf';
                        const isDownloading = isMushafStyle && isDownloadingFonts;

                        return (
                            <div
                                key={style.id}
                                onClick={() => {
                                    if (isDownloading) return;
                                    setFontStyle(style.id);
                                    setSelectedEdition('quran-uthmani-quran-academy');
                                }}
                                className={`p-3.5 rounded-xl border text-right transition-all select-none flex flex-col justify-between ${
                                    isDownloading ? 'cursor-default opacity-80' : 'cursor-pointer'
                                } ${
                                    isSelected
                                        ? 'bg-surface border-primary ring-1 ring-primary/20 shadow-xs'
                                        : 'bg-surface border-border-default hover:border-border-default/80 hover:bg-surface-hover/50'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                                            {style.name}
                                        </div>
                                        {isSelected && (
                                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                                <CheckIcon className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted mt-1 leading-normal">{style.desc}</p>
                                </div>

                                {/* Offline Download Controls for Madinah Mushaf */}
                                {isMushafStyle && (
                                    <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                                        {!isMushafDownloaded && !isDownloading && (
                                            <button
                                                type="button"
                                                onClick={handleDownloadFonts}
                                                className="w-full text-center py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
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
                                                    <button type="button" onClick={handleDownloadFonts} className="text-primary hover:underline">تحديث</button>
                                                    <span className="text-text-muted">•</span>
                                                    <button type="button" onClick={handleDeleteFonts} className="text-red-500 hover:underline">حذف</button>
                                                </div>
                                            </div>
                                        )}
                                        {isDownloading && (
                                            <div className="w-full space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-primary font-medium">جاري التحميل... {fontDownloadProgress}%</span>
                                                    <button type="button" onClick={handleCancelDownload} className="text-red-500 hover:underline">إلغاء</button>
                                                </div>
                                                <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${Math.max(0, fontDownloadProgress)}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

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
                                ﴿ {renderWordWithNoorani('أَلَمْ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('نَشْرَحْ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('لَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('صَدْرَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} ۝ {renderWordWithNoorani('وَوَضَعْنَا', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('عَنكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('وِزْرَكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} ﴾
                            </>
                        ) : (
                            '﴿ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنكَ وِزْرَكَ ﴾'
                        )}
                    </p>
                    {highlightNoorani && (
                        <div className="mt-2 pt-2 border-t border-border-subtle flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                ✨ معاينة تلوين الأحرف النورانية {highlightNooraniIncludeWaw ? '(مع حرف الواو)' : '(الـ 14 الأصلية)'}:
                            </span>
                            <p className={`text-text-primary leading-loose ${fontStyle === 'uthmani' || fontStyle === 'mushaf' ? 'font-quran-title' : 'font-quran-simple'} transition-all text-${fontSize}`}>
                                ﴿ {renderWordWithNoorani('الم', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} ۝ {renderWordWithNoorani('ذَٰلِكَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('ٱلۡكِتَٰبُ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('لَا', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('رَيۡبَ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} {renderWordWithNoorani('فِيهِ', true, 'noorani-letter-highlight', highlightNooraniIncludeWaw)} ﴾
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
                            <div className="mr-5 pr-3 border-r-2 border-amber-400/40 dark:border-amber-500/30">
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
