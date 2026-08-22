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
        browsingMode, setBrowsingMode, 
        selectedEdition, setSelectedEdition,
        enableTajweed, setEnableTajweed,
        enableWordAudio, setEnableWordAudio,
        wordClickBehavior, setWordClickBehavior,
        enableMorphology, setEnableMorphology,
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
                        const requiresDownload = style.requiresDownload;
                        const isDownloaded = !requiresDownload || isMushafDownloaded;
                        const isDownloading = requiresDownload && isDownloadingFonts;
                        
                        return (
                            <div
                                key={style.id}
                                onClick={() => {
                                    if (isDownloading) return;
                                    if (requiresDownload && !isMushafDownloaded) {
                                        openDownloadMushafModal();
                                        return;
                                    }
                                    setFontStyle(style.id);
                                    if (style.id === 'mushaf') {
                                        setBrowsingMode('page');
                                        setSelectedEdition('quran-uthmani-quran-academy');
                                    } else if (style.id === 'uthmani') {
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
                                    isSelected && isDownloaded
                                        ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                        : (!isDownloading) ? 'bg-surface border-border-default' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center mt-0.5 transition-colors ${
                                        isSelected && isDownloaded ? 'border-primary bg-primary text-white' : 'border-border-default bg-surface'
                                    }`}>
                                        {isSelected && isDownloaded && <CheckIcon className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-base text-text-primary flex flex-wrap items-center gap-2">
                                            <span>{style.name}</span>
                                            {requiresDownload && !isMushafDownloaded && !isDownloading && (
                                                <button 
                                                    type="button"
                                                    onClick={handleDownloadFonts}
                                                    className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>⬇️ تنزيل خطوط المصحف للبدء</span>
                                                </button>
                                            )}
                                            {requiresDownload && isMushafDownloaded && (
                                                <div className="flex items-center gap-1.5 mr-auto" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                                                        <CheckIcon className="w-3.5 h-3.5" /> مثبتة
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleDownloadFonts}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        إعادة التنزيل
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
                                                    ></div>
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

                    <button
                        type="button"
                        onClick={() => setSelectedEdition('quran-simple-clean')}
                        className={`p-5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                            selectedEdition.includes('simple-clean')
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div>
                            <div className="font-bold text-text-primary text-base">الرسم الإملائي المبسط</div>
                            <div className="text-xs text-text-muted mt-1 leading-relaxed">
                                نص مبسط سريع التحميل مخصص للبحث والتدبر المباشر ووضوح القراءة.
                            </div>
                        </div>
                        {selectedEdition.includes('simple-clean') && (
                            <span className="mt-3 text-xs text-primary font-bold flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> مُفعل الآن
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Browsing Mode */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">نمط التصفح الافتراضي</h3>
                    <p className="text-xs text-text-muted">اختر طريقة التنقل بين آيات السورة الكريمة</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            if (fontStyle === 'mushaf') {
                                setFontStyle('imlai_1');
                            }
                            setBrowsingMode('full');
                        }}
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                            browsingMode === 'full'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div className="font-bold text-text-primary text-base">العرض المستمر الشامل (كل السورة)</div>
                        <div className="text-xs text-text-muted mt-1">عرض جميع آيات السورة في قائمة واحدة متصلة وسلسة.</div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBrowsingMode('page')}
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                            browsingMode === 'page'
                                ? 'bg-surface border-primary ring-2 ring-primary/20 shadow-xs'
                                : 'bg-surface border-border-default hover:border-primary/30'
                        }`}
                    >
                        <div className="font-bold text-text-primary text-base">التصفح حسب صفحات المصحف</div>
                        <div className="text-xs text-text-muted mt-1">تقسيم العرض حسب أرقام صفحات المصحف الشريف (604 صفحة).</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReadingSettings;
