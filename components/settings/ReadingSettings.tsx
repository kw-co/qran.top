import React from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import type { FontSize, FontStyleType } from '../../types';
import { CheckIcon } from '../icons';

const FONT_SIZES: { id: FontSize; label: string; px: string }[] = [
    { id: 'xs', label: 'صغير جداً', px: '16px' },
    { id: 'sm', label: 'صغير', px: '20px' },
    { id: 'md', label: 'متوسط', px: '24px' },
    { id: 'lg', label: 'كبير', px: '28px' },
    { id: 'xl', label: 'كبير جداً', px: '32px' },
    { id: 'xxl', label: 'ضخم', px: '40px' },
];

const FONT_STYLES: { id: FontStyleType; name: string; description: string; className: string; requiresDownload?: boolean }[] = [
    { id: 'imlai_1', name: 'الخط الإملائي القياسي (السريع)', description: 'خط عالي الأداء مع وضوح عالي للتشكيل ومناسب لجميع الشاشات والأجهزة', className: 'font-quran-simple' },
    { id: 'uthmani', name: 'الرسم العثماني القياسي', description: 'خط عثماني مع علامات الضبط والوقف والتشكيل الكامل', className: 'font-quran-title' },
    { id: 'mushaf', name: 'مصحف المدينة المنورة الأصلي', description: 'يعرض الصفحة مطابقة تماماً لمصحف المدينة المنورة المطبوع (604 صفحة)', className: 'font-quran-title', requiresDownload: true },
];

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
        fontDownloadProgress,
        isDownloadingFonts,
        isMushafDownloaded,
        startFontDownload,
        cancelFontDownload,
        removeMushafFonts,
        openDownloadMushafModal
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
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">إعدادات القراءة والخطوط</h2>
                <p className="text-sm text-text-secondary">خصص طريقة العرض وحجم الخط وطريقة التصفح والتفاعل مع المفردات والآيات.</p>
            </div>

            {/* Word Click Behavior Section */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-primary/20 space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">سلوك الضغط والنقر على الكلمة</h3>
                    <p className="text-xs text-text-muted">حدد النتيجة المفضلة لديك عند الضغط على أي كلمة داخل الآية الكريمة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('auto')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'auto'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                ⚡ <span>تلقائي (حسب الخط)</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                الإملائي = بحث مباشر فوراً.<br/>
                                المصحف = إظهار قائمة الخيارات.
                            </div>
                        </div>
                        {wordClickBehavior === 'auto' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('direct_search')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'direct_search'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                🔍 <span>بحث مباشر فوراً</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                إجراء بحث المثاني وتكرارات الكلمة فور الضغط عليها في جميع الأوضاع.
                            </div>
                        </div>
                        {wordClickBehavior === 'direct_search' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setWordClickBehavior('show_menu')}
                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            wordClickBehavior === 'show_menu'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base flex items-center gap-1.5">
                                📋 <span>إظهار قائمة خيارات الكلمة</span>
                            </div>
                            <div className="text-xs text-text-muted mt-2 leading-relaxed">
                                إظهار قائمة منبثقة تتيح الاختيار بين (البحث، الإعراب، الاستماع الصوتي).
                            </div>
                        </div>
                        {wordClickBehavior === 'show_menu' && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Quran Features Options */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                        ميزات التفاعل اللغوي واللفظي
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Tajweed Mode Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableTajweed ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableTajweed(!enableTajweed)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                🎨 <span>التجويد الملون</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                تظليل أحكام التجويد بألوان مميزة.
                            </p>
                        </div>
                        <input 
                            id="enable-tajweed-checkbox"
                            name="enableTajweed"
                            type="checkbox" 
                            checked={enableTajweed} 
                            onChange={() => {}} 
                            aria-label="التجويد الملون"
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>

                    {/* Word Audio Pronunciation Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableWordAudio ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableWordAudio(!enableWordAudio)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                🔊 <span>نطق الكلمة المرتل</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                نطق نبرة الكلمة عند ضغطها.
                            </p>
                        </div>
                        <input 
                            id="enable-word-audio-checkbox"
                            name="enableWordAudio"
                            type="checkbox" 
                            checked={enableWordAudio} 
                            onChange={() => {}} 
                            aria-label="نطق الكلمة المرتل"
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>

                    {/* Word Morphology & Grammar Toggle */}
                    <div className={`p-4 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                        enableMorphology ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs' : 'bg-surface border-border-default'
                    }`}
                    onClick={() => setEnableMorphology(!enableMorphology)}
                    >
                        <div className="space-y-1">
                            <div className="font-bold text-text-primary text-base flex items-center gap-2">
                                📐 <span>التحليل الصرفي والإعراب</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                عرض الجذر، الإعراب، والنوع اللغوي.
                            </p>
                        </div>
                        <input 
                            id="enable-morphology-checkbox"
                            name="enableMorphology"
                            type="checkbox" 
                            checked={enableMorphology} 
                            onChange={() => {}} 
                            aria-label="التحليل الصرفي والإعراب"
                            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer flex-shrink-0" 
                        />
                    </div>
                </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-6 bg-surface-subtle border border-border-default rounded-2xl shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 inline-block">معاينة فورية للخط</span>
                <div className="text-center py-6 px-4 bg-surface rounded-xl border border-border-subtle my-2 shadow-inner">
                    <p className={`text-text-primary leading-loose ${fontStyle === 'uthmani' || fontStyle === 'mushaf' ? 'font-quran-title' : 'font-quran-simple'} transition-all duration-200 text-${fontSize}`}>
                        ﴿ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنكَ وِزْرَكَ ۝ الَّذِي أَنقَضَ ظَهْرَكَ ۝ وَرَفَعْنَا لَكَ ذِكْرَكَ ﴾
                    </p>
                </div>
            </div>

            {/* Font Size Selector */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">حجم خط الآيات</h3>
                        <p className="text-xs text-text-muted">اختر الحجم الأنسب لعينيك أثناء القراءة والتدبر</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {FONT_SIZES.map((size) => (
                        <button
                            key={size.id}
                            onClick={() => setFontSize(size.id)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                fontSize === size.id
                                    ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                    : 'bg-surface text-text-primary border-border-default hover:border-primary/40'
                            }`}
                        >
                            <div className="text-sm">{size.label}</div>
                            <div className="text-xs opacity-75 mt-0.5" dir="ltr">{size.px}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Family / Style */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">طريقة العرض والخط القرآني</h3>
                    <p className="text-xs text-text-muted">اختر بين الخط الإملائي السريع أو مصحف المدينة المنورة الأصلي</p>
                </div>
                <div className="space-y-3">
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
                                    if (style.id === 'mushaf' || style.id === 'uthmani') {
                                        setSelectedEdition('quran-uthmani-quran-academy');
                                    } else {
                                        setSelectedEdition('quran-simple-clean');
                                    }
                                }}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all select-none ${
                                    isDownloading 
                                        ? 'bg-surface-subtle border-border-subtle cursor-default' 
                                        : 'cursor-pointer hover:border-primary/40'
                                } ${
                                    isSelected
                                        ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                        : (!isDownloading) ? 'bg-surface border-border-default' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center mt-0.5 transition-colors ${
                                        isSelected ? 'border-primary bg-primary text-white' : 'border-border-default bg-surface'
                                    }`}>
                                        {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-base text-text-primary flex flex-wrap items-center gap-2">
                                            <span>{style.name}</span>
                                            {isMushafStyle && !isMushafDownloaded && !isDownloading && (
                                                <button 
                                                    type="button"
                                                    onClick={handleDownloadFonts}
                                                    className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                                    title="تنزيل جميع الصفحات الـ 604 لتعمل بدون إنترنت نهائياً"
                                                >
                                                    <span>⬇️ تنزيل الكل للأوفلاين</span>
                                                </button>
                                            )}
                                            {isMushafStyle && isMushafDownloaded && (
                                                <div className="flex items-center gap-1.5 mr-auto" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                                        <CheckIcon className="w-3.5 h-3.5" /> مثبت أوفلاين
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleDownloadFonts}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        تحديث
                                                    </button>
                                                    <span className="text-text-muted text-xs">•</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteFonts}
                                                        className="text-xs text-red-500 hover:underline"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            )}
                                            {isDownloading && (
                                                <button 
                                                    type="button"
                                                    onClick={handleCancelDownload}
                                                    className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-95 transition-colors cursor-pointer"
                                                >
                                                    إلغاء التنزيل
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-xs text-text-muted mt-0.5 mb-2">{style.description}</div>
                                        
                                        {isDownloading && (
                                            <div className="w-full mt-2">
                                                <div className="flex justify-between text-xs text-text-muted mb-1">
                                                    <span className="text-primary font-medium">جاري تنزيل خطوط صفحات المصحف (604 صفحة)...</span>
                                                    <span className="font-bold text-primary" dir="ltr">{fontDownloadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="bg-primary h-2 transition-all duration-300 rounded-full" 
                                                        style={{ width: `${Math.max(0, fontDownloadProgress)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Default Quran Text Mode */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">نص المصحف</h3>
                    <p className="text-xs text-text-muted">التحكم في نص المصحف الأساسي المعروض عند تصفح السور والصفحات</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setSelectedEdition('quran-uthmani-quran-academy')}
                        className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                            selectedEdition.includes('uthmani')
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base">الرسم العثماني الأصيل</div>
                            <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                يعرض النص بالرسم المعتمد لمصحف المدينة مع كافة علامات الضبط والوقف والمدود.
                            </div>
                        </div>
                        {selectedEdition.includes('uthmani') && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل الآن
                            </span>
                        )}
                    </button>

                    <div
                        className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            selectedEdition.includes('simple')
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedEdition(showImlaeiTashkeel ? 'quran-simple' : 'quran-simple-clean')}
                            className="w-full text-right cursor-pointer group"
                        >
                            <div className="font-bold text-text-primary text-base group-hover:text-primary transition-colors">الرسم الإملائي المبسط</div>
                            <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                نص مبسط سريع التحميل مخصص للبحث والتدبر المباشر ووضوح القراءة.
                            </div>
                        </button>
                        
                        {selectedEdition.includes('simple') && (
                            <div className="mt-4 pt-4 border-t border-border-subtle">
                                <span className="mb-3 text-xs text-primary font-bold flex items-center gap-1">
                                    <CheckIcon className="w-4 h-4" /> مُفعل الآن
                                </span>
                                
                                <label className="flex items-center gap-3 cursor-pointer mt-2 hover:bg-surface-hover p-2 rounded-lg transition-colors">
                                    <div className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none bg-surface-hover border border-border-default">
                                        <input 
                                            type="checkbox"
                                            className="sr-only"
                                            checked={showImlaeiTashkeel}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setShowImlaeiTashkeel(checked);
                                                setSelectedEdition(checked ? 'quran-simple' : 'quran-simple-clean');
                                            }}
                                        />
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-primary transition-transform ${showImlaeiTashkeel ? '-translate-x-4' : '-translate-x-1'}`}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-text-primary select-none">
                                        إظهار التشكيل
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Nav Bar Setting */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">شريط التنقل السفلي</h3>
                    <p className="text-xs text-text-muted">إظهار أو إخفاء شريط التنقل السفلي المخصص للانتقال بين الصفحات.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setShowBottomNavBar(!showBottomNavBar)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showBottomNavBar ? 'bg-primary' : 'bg-surface-hover border border-border-default'}`}
                        aria-pressed={showBottomNavBar}
                    >
                        <span className="sr-only">تفعيل شريط التنقل السفلي</span>
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showBottomNavBar ? '-translate-x-6' : '-translate-x-1'}`}
                        />
                    </button>
                    <span className="text-sm font-bold text-text-primary">
                        {showBottomNavBar ? 'مُفعل' : 'مُعطل'}
                    </span>
                </div>
            </div>

            {/* Search Results Settings */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">نتائج البحث</h3>
                    <p className="text-xs text-text-muted">تخصيص الخيارات المعروضة في نتائج البحث</p>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-text-primary text-base">الأحرف النورانية (فواتح السور)</div>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            إظهار الأحرف النورانية (مثل: الم، طه، يس) بجانب نتائج البحث للسور التي تبدأ بها.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMuqattaatInSearch(!showMuqattaatInSearch)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showMuqattaatInSearch ? 'bg-primary' : 'bg-surface-hover border border-border-default'}`}
                        aria-pressed={showMuqattaatInSearch}
                    >
                        <span className="sr-only">تفعيل إظهار الأحرف النورانية</span>
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showMuqattaatInSearch ? '-translate-x-6' : '-translate-x-1'}`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReadingSettings;
