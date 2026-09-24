import React, { useState, useEffect, useMemo } from 'react';
import type { SurahData } from '../types';
import { 
    BookOpenIcon, 
    SparklesIcon, 
    LightBulbIcon, 
    SearchIcon,
    ClearIcon,
    ChevronLeftIcon
} from './icons';

interface QuranStructureViewProps {
    simpleCleanData?: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
}

type CategoryType = 'all' | 'noorani' | 'geometry' | 'fawatih' | 'alphabet' | 'research';

interface StructureSection {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    category: CategoryType;
    categoryName: string;
    badge?: string;
    highlights: string[];
    bg: string;
    borderColor: string;
    hoverBorder: string;
    accentColor: string;
    buttonText: string;
}

export const QuranStructureView: React.FC<QuranStructureViewProps> = () => {
    const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections: StructureSection[] = useMemo(() => [
        {
            id: 'cipher-lab',
            title: "مختبر التشفير وفك التشفير النوراني",
            description: "تشفير أي كلمة أو نص إلى كود الحروف النورانية وفك تشفير أي كود إلى كلمات ومفردات قرآنية موثقة وفق الجدول التفضيلي المعتمد (14 ⟷ 28).",
            icon: <span className="text-2xl font-bold">🔐</span>,
            href: "#/cipher-lab",
            category: 'noorani',
            categoryName: 'الحروف النورانية',
            badge: "مختبر تفاعلي ⚡",
            highlights: ["تشفير الكلمات", "فك التشفير القرآني", "توزيع 14 ⟷ 28"],
            bg: "bg-amber-500/5 dark:bg-amber-900/10",
            borderColor: "border-amber-500/25 dark:border-amber-700/40",
            hoverBorder: "hover:border-amber-500/60",
            accentColor: "text-amber-700 dark:text-amber-300",
            buttonText: "فتح المختبر ⟵"
        },
        {
            id: 'word-geometry',
            title: "مركز ثقل المفردة وهندسة السور",
            description: "تحليل قوة الكلمة (كثافتها النوعية)، مركز ثقلها المصحفي (Center of Mass)، مصفوفة السور الحاضنة، وتناظر أرقام السور والمسافات البينية.",
            icon: <span className="text-2xl font-bold">⚖️</span>,
            href: "#/word-geometry",
            category: 'geometry',
            categoryName: 'هندسة السور والمفردات',
            badge: "هندسة رياضية ⚡",
            highlights: ["مركز ثقل المفردة", "كثافة الكلمات", "تناظر المسافات"],
            bg: "bg-emerald-500/5 dark:bg-emerald-900/10",
            borderColor: "border-emerald-500/25 dark:border-emerald-700/40",
            hoverBorder: "hover:border-emerald-500/60",
            accentColor: "text-emerald-700 dark:text-emerald-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'noorani-cipher',
            title: "شيفرة الحروف النورانية والجدول التفضيلي",
            description: "هندسة عكسية لكشف التوزيع التفضيلي المزدوج (14 نوراني ⟷ 28 أبجدي كاملة) مع مصفوفة التشابه والأزواج المتطابقة وتحليل الأوزان.",
            icon: <SparklesIcon className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />,
            href: "#/noorani-cipher",
            category: 'noorani',
            categoryName: 'الحروف النورانية',
            badge: "هندسة عكسية",
            highlights: ["الجدول التفضيلي", "مصفوفة التشابه", "أزواج الحروف"],
            bg: "bg-yellow-500/5 dark:bg-yellow-900/10",
            borderColor: "border-yellow-500/25 dark:border-yellow-700/40",
            hoverBorder: "hover:border-yellow-500/60",
            accentColor: "text-yellow-700 dark:text-yellow-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'noorani-ayahs',
            title: "الآيات النورانية (الخالصة والعالية)",
            description: "مسح واستكشاف آيات القرآن الكريم المتشكلة حصراً أو بأعلى كثافة من الحروف النورانية الـ 14 مع خيارات التحكم بحرف الواو والتصنيف.",
            icon: <SparklesIcon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />,
            href: "#/noorani",
            category: 'noorani',
            categoryName: 'الحروف النورانية',
            badge: "مسح قرآني",
            highlights: ["الآيات الخالصة 100%", "ترتيب الكثافة", "فلترة حرف الواو"],
            bg: "bg-teal-500/5 dark:bg-teal-900/10",
            borderColor: "border-teal-500/25 dark:border-teal-700/40",
            hoverBorder: "hover:border-teal-500/60",
            accentColor: "text-teal-700 dark:text-teal-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'alm-differences',
            title: "الم (الفروق القرآنية وبصمة الفواتح)",
            description: "تحليل ومقارنة المواضع المتشابهة في كتاب الله عبر استنباط البصمة الدلالية لحروف الفواتح الم وحذف المفردات المشتركة.",
            icon: <LightBulbIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />,
            href: "#/alm?tab=intersection",
            category: 'fawatih',
            categoryName: 'فواتح السور',
            badge: "مقارنة المتشابهات",
            highlights: ["بصمة الم", "حذف المشترك", "الفروق الدلالية"],
            bg: "bg-purple-500/5 dark:bg-purple-900/10",
            borderColor: "border-purple-500/25 dark:border-purple-700/40",
            hoverBorder: "hover:border-purple-500/60",
            accentColor: "text-purple-700 dark:text-purple-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'surah-pairing',
            title: "أزواج السور والتناظر البنائي",
            description: "دراسة الارتباط العضوي والترابط الموضوعي بين سور القرآن الكريم المثاني التي نزلت أو رتبت كأزواج متقابلة تكمل بعضها بعضاً.",
            icon: <span className="text-2xl font-bold">🔄</span>,
            href: "#/alm?tab=pairing",
            category: 'geometry',
            categoryName: 'هندسة السور والمفردات',
            badge: "تناظر بنائي",
            highlights: ["المثاني والقرين", "تكامل المحاور", "سور الفواتح المزدوجة"],
            bg: "bg-indigo-500/5 dark:bg-indigo-900/10",
            borderColor: "border-indigo-500/25 dark:border-indigo-700/40",
            hoverBorder: "hover:border-indigo-500/60",
            accentColor: "text-indigo-700 dark:text-indigo-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'exclusive-lexicon',
            title: "معجم الحروف الحصرية والإنفرادية",
            description: "حصر ودراسة المفردات القرآنية التي تنفرد بها سور الفواتح وتتميز بأحرف خاصة دون غيرها مع فهارس دلالية مستوعبة.",
            icon: <BookOpenIcon className="w-7 h-7 text-sky-600 dark:text-sky-400" />,
            href: "#/alm?tab=lexicon",
            category: 'fawatih',
            categoryName: 'فواتح السور',
            badge: "معجم ألفاظ",
            highlights: ["الإنفرادات اللفظية", "حروف الفواتح", "فهرس الكلمات"],
            bg: "bg-sky-500/5 dark:bg-sky-900/10",
            borderColor: "border-sky-500/25 dark:border-sky-700/40",
            hoverBorder: "hover:border-sky-500/60",
            accentColor: "text-sky-700 dark:text-sky-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'hawameem',
            title: "حم (محرك بحث الحواميم السبع)",
            description: "محرك بحث مخصص حصرياً لسور آل (حم) السبع المتتالية في المصحف الشريف للبحث في مواضيعها المحورية وترابطها النسقي.",
            icon: <span className="font-quran text-2xl font-bold text-emerald-600 dark:text-emerald-400">حم</span>,
            href: "#/hm",
            category: 'fawatih',
            categoryName: 'فواتح السور',
            badge: "بحث متخصص",
            highlights: ["السور السبع المتتالية", "مصفوفة الحواميم", "بحث تركيبي"],
            bg: "bg-emerald-500/5 dark:bg-emerald-900/10",
            borderColor: "border-emerald-500/25 dark:border-emerald-700/40",
            hoverBorder: "hover:border-emerald-500/60",
            accentColor: "text-emerald-700 dark:text-emerald-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'fingerprint',
            title: "البصمة النورانية للمفردات والبحث العكسي",
            description: "أداة متقدمة لاستخراج البصمة النورانية الثنائية (01) لأي مفردة عبر السور الـ 29 ذات الفواتح، مع إمكانية البحث العكسي الدقيق بالبصمة.",
            icon: <div className="font-mono text-xl font-black text-violet-600 dark:text-violet-400">01</div>,
            href: "#/fingerprint",
            category: 'noorani',
            categoryName: 'الحروف النورانية',
            badge: "بصمة ثنائية 01",
            highlights: ["بصمة الـ 29 سورة", "البحث العكسي", "مقارنة البصمات"],
            bg: "bg-violet-500/5 dark:bg-violet-900/10",
            borderColor: "border-violet-500/25 dark:border-violet-700/40",
            hoverBorder: "hover:border-violet-500/60",
            accentColor: "text-violet-700 dark:text-violet-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'letter-matrix',
            title: "المصفوفة الأبجدية الشاملة",
            description: "مختبر تفاعلي لفحص وتصفية كامل القرآن (6,236 آية) بأي توليفة من حروف المعجم الـ 28 مع قياس الترددات وشريط التقدم المباشر.",
            icon: <span className="text-2xl font-bold">🔠</span>,
            href: "#/letter-matrix",
            category: 'alphabet',
            categoryName: 'الأبجدية والفواصل',
            badge: "مختبر تفاعلي",
            highlights: ["28 حرفاً كاملاً", "تصفية الآيات الفورية", "إحصاء الترددات"],
            bg: "bg-purple-500/5 dark:bg-purple-900/10",
            borderColor: "border-purple-500/25 dark:border-purple-700/40",
            hoverBorder: "hover:border-purple-500/60",
            accentColor: "text-purple-700 dark:text-purple-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'alphabet-scanner',
            title: "ماسح الحروف الأبجدية (المحيط الأصغر)",
            description: "تحديد أصغر مساحة نصية ومحيط حول كلمة معينة تكتمل فيها الحروف الأبجدية الثمانية والعشرون كاملة دون نقصان.",
            icon: <span className="text-2xl font-bold">🔍</span>,
            href: "#/alphabet-scanner",
            category: 'alphabet',
            categoryName: 'الأبجدية والفواصل',
            badge: "استكشاف نصي",
            highlights: ["المحيط الأصغر", "أقصر نافذة نصية", "اكتمال 28 حرفاً"],
            bg: "bg-rose-500/5 dark:bg-rose-900/10",
            borderColor: "border-rose-500/25 dark:border-rose-700/40",
            hoverBorder: "hover:border-rose-500/60",
            accentColor: "text-rose-700 dark:text-rose-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'syllable-cluster',
            title: "مصفوفة اتصال الحروف والمقاطع",
            description: "ترتيب جميع الحروف الأبجدية الـ 28 حسب قوة اتصالها وتلاصقها بأي مقطع أو حرف (سوابق ولواحق)، مع خيار استبعاد الأحرف النورانية.",
            icon: <span className="text-2xl font-bold">🔗</span>,
            href: "#/syllable-cluster",
            category: 'alphabet',
            categoryName: 'الأبجدية والفواصل',
            badge: "سوابق ولواحق",
            highlights: ["قوة الالتصاق", "سوابق ولواحق المقاطع", "عزل الأحرف"],
            bg: "bg-amber-500/5 dark:bg-amber-900/10",
            borderColor: "border-amber-500/25 dark:border-amber-700/40",
            hoverBorder: "hover:border-amber-500/60",
            accentColor: "text-amber-700 dark:text-amber-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'word-analysis',
            title: "تحليل المفردات وجذورها الصرفية",
            description: "تحليل البنية الصرفية والجذرية لمفردات القرآن الكريم وتوزيع مشتقاتها عبر السور والآيات مع إحصائيات التكرار.",
            icon: <span className="text-2xl font-bold">🌿</span>,
            href: "#/analysis",
            category: 'geometry',
            categoryName: 'هندسة السور والمفردات',
            badge: "تحليل لغوي",
            highlights: ["الجذور الصرفية", "المشتقات اللفظية", "توزيع التكرار"],
            bg: "bg-emerald-500/5 dark:bg-emerald-900/10",
            borderColor: "border-emerald-500/25 dark:border-emerald-700/40",
            hoverBorder: "hover:border-emerald-500/60",
            accentColor: "text-emerald-700 dark:text-emerald-300",
            buttonText: "دخول القسم ⟵"
        },
        {
            id: 'research',
            title: "الكتب الإلهية والنسخ السبع",
            description: "دراسة وتأملات الأستاذ أنوار إسحاق حول الكتب الإلهية داخل المصحف الشريف والأنبياء المخاطبين بها ومسارات النزول.",
            icon: <BookOpenIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />,
            href: "#/research",
            category: 'research',
            categoryName: 'دراسات وبحوث',
            badge: "دراسة تأملية",
            highlights: ["الكتب الإلهية", "النسخ السبع", "تأملات بنائية"],
            bg: "bg-blue-500/5 dark:bg-blue-900/10",
            borderColor: "border-blue-500/25 dark:border-blue-700/40",
            hoverBorder: "hover:border-blue-500/60",
            accentColor: "text-blue-700 dark:text-blue-300",
            buttonText: "دخول القسم ⟵"
        }
    ], []);

    const categories = [
        { id: 'all', label: 'جميع الأقسام', count: sections.length },
        { id: 'noorani', label: 'الحروف النورانية والتشفير', count: sections.filter(s => s.category === 'noorani').length },
        { id: 'geometry', label: 'هندسة السور والمفردات', count: sections.filter(s => s.category === 'geometry').length },
        { id: 'fawatih', label: 'فواتح السور والمتشابهات', count: sections.filter(s => s.category === 'fawatih').length },
        { id: 'alphabet', label: 'الأبجدية والفواصل', count: sections.filter(s => s.category === 'alphabet').length },
        { id: 'research', label: 'دراسات وبحوث', count: sections.filter(s => s.category === 'research').length },
    ];

    const filteredSections = useMemo(() => {
        return sections.filter(section => {
            const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
            if (!matchesCategory) return false;

            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase().trim();
            return (
                section.title.toLowerCase().includes(q) ||
                section.description.toLowerCase().includes(q) ||
                section.categoryName.toLowerCase().includes(q) ||
                section.highlights.some(h => h.toLowerCase().includes(q))
            );
        });
    }, [sections, selectedCategory, searchQuery]);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl text-text-primary min-h-[75vh] space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                    <BookOpenIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 text-text-primary font-amiri tracking-wide">
                    بنية المصحف الشريف
                </h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
                    فهرس شامل يضم المختبرات التحليلية والأدوات التفاعلية لدراسة البنية الرياضية والهندسية والموضوعية لكتاب الله الكريم.
                </p>

                {/* Search & Stats Bar */}
                <div className="w-full max-w-xl mt-6 relative">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في أقسام بنية المصحف (مثل: تشفير، ثقل، حواميم، أبجدية...)"
                            className="w-full pl-10 pr-11 py-3 rounded-2xl bg-surface-subtle border border-border-default text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-text-secondary/60 shadow-xs"
                            dir="rtl"
                        />
                        <div className="absolute right-3.5 text-text-secondary pointer-events-none">
                            <SearchIcon className="w-4 h-4" />
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute left-3 p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                                aria-label="مسح البحث"
                            >
                                <ClearIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id as CategoryType)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                selectedCategory === cat.id
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-surface-subtle hover:bg-surface border border-border-default text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            <span>{cat.label}</span>
                            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                                selectedCategory === cat.id
                                    ? 'bg-white/25 text-white'
                                    : 'bg-border-default/50 text-text-secondary'
                            }`}>
                                {cat.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sections Grid */}
            {filteredSections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6">
                    {filteredSections.map((section) => (
                        <a
                            key={section.id}
                            href={section.href}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl border ${section.borderColor} ${section.bg} ${section.hoverBorder} hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden`}
                        >
                            {/* Card Content Top */}
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-13 h-13 rounded-2xl bg-surface border border-border-default shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {section.icon}
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-text-secondary/80 block mb-0.5">
                                                {section.categoryName}
                                            </span>
                                            <h2 className="text-lg sm:text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
                                                {section.title}
                                            </h2>
                                        </div>
                                    </div>
                                    {section.badge && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex-shrink-0 shadow-2xs">
                                            {section.badge}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                                    {section.description}
                                </p>

                                {/* Highlights */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                    {section.highlights.map((h, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-surface/80 border border-border-default/60 text-text-secondary"
                                        >
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Card Footer Button */}
                            <div className="pt-3 border-t border-border-default/40 flex items-center justify-between mt-auto">
                                <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${section.accentColor} group-hover:gap-2.5 transition-all`}>
                                    <span>{section.buttonText}</span>
                                </span>
                                <div className="w-8 h-8 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                    <ChevronLeftIcon className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center border border-dashed border-border-default rounded-3xl bg-surface-subtle/50">
                    <p className="text-base font-bold text-text-primary mb-1">لم يتم العثور على أقسام مطابقة</p>
                    <p className="text-xs text-text-secondary mb-4">جرّب تغيير كلمات البحث أو اختيار تصنيف آخر.</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        إعادة ضبط الفلترة
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuranStructureView;
