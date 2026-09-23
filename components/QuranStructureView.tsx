import React, { useState, useEffect } from 'react';
import type { SurahData } from '../types';
import { BookOpenIcon, SparklesIcon, LightBulbIcon } from './icons';
import NooraniCipherLab from './NooraniCipherLab';

interface QuranStructureViewProps {
    simpleCleanData?: SurahData[];
    onSearch?: (query: string, sourceEdition?: string) => void;
    initialTab?: 'lab' | 'sections';
}

export const QuranStructureView: React.FC<QuranStructureViewProps> = ({
    simpleCleanData = [],
    onSearch,
    initialTab = 'lab'
}) => {
    const [activeTab, setActiveTab] = useState<'lab' | 'sections'>(initialTab);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const sections = [
        {
            title: "مختبر التشفير وفك التشفير النوراني",
            description: "تشفير أي كلمة أو نص إلى كود الحروف النورانية وفك تشفير أي كود إلى كلمات ومفردات قرآنية موثقة وفق الجدول التفضيلي 14 ⟷ 28.",
            icon: <span className="text-2xl font-bold">🔐</span>,
            isInteractiveTab: true,
            bg: "bg-amber-50 dark:bg-amber-900/15",
            borderColor: "border-amber-300 dark:border-amber-700",
            hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/25",
            badge: "جديد ⚡"
        },
        {
            title: "مركز ثقل المفردة وهندسة السور",
            description: "تحليل قوة الكلمة (كثافتها النوعية)، مركز ثقلها المصحفي (Center of Mass)، مصفوفة السور الحاضنة، وتناظر أرقام السور والمسافات البينية.",
            icon: <span className="text-2xl font-bold">⚖️</span>,
            href: "#/word-geometry",
            bg: "bg-emerald-50 dark:bg-emerald-900/15",
            borderColor: "border-emerald-300 dark:border-emerald-700",
            hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/25",
            badge: "جديد ⚡"
        },
        {
            title: "الم (الفروق القرآنية)",
            description: "تحليل ومقارنة المواضع المتشابهة في كتاب الله عبر استنباط البصمة الدلالية لحروف الفواتح الم وحذف المفردات المشتركة.",
            icon: <LightBulbIcon className="w-8 h-8 text-purple-500" />,
            href: "#/alm",
            bg: "bg-purple-50 dark:bg-purple-900/10",
            borderColor: "border-purple-200 dark:border-purple-800",
            hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/20"
        },
        {
            title: "شيفرة الحروف النورانية والجدول التفضيلي",
            description: "هندسة عكسية لكشف التوزيع التفضيلي المزدوج (14 نوراني ⟷ 28 أبجدي كاملة) مع مصفوفة التشابه والأزواج المتطابقة.",
            icon: <SparklesIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
            href: "#/noorani-cipher",
            bg: "bg-yellow-50 dark:bg-yellow-900/10",
            borderColor: "border-yellow-200 dark:border-yellow-800",
            hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
        },
        {
            title: "الآيات النورانية",
            description: "مسح واستكشاف آيات القرآن الكريم المتشكلة حصراً أو بأعلى كثافة من الحروف النورانية الـ 14 مع خيارات التحكم بحرف الواو.",
            icon: <SparklesIcon className="w-8 h-8 text-emerald-500" />,
            href: "#/noorani",
            bg: "bg-emerald-50 dark:bg-emerald-900/10",
            borderColor: "border-emerald-200 dark:border-emerald-800",
            hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
        },
        {
            title: "المصفوفة الأبجدية الشاملة",
            description: "مختبر تفاعلي لفحص وتصفية كامل القرآن (6,236 آية) بأي توليفة من حروف المعجم الـ 28 مع قياس الترددات وشريط التقدم المباشر.",
            icon: <SparklesIcon className="w-8 h-8 text-purple-500" />,
            href: "#/letter-matrix",
            bg: "bg-purple-50 dark:bg-purple-900/10",
            borderColor: "border-purple-200 dark:border-purple-800",
            hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/20"
        },
        {
            title: "أزواج السور",
            description: "دراسة الارتباط العضوي والترابط الموضوعي بين سور القرآن الكريم المثاني التي نزلت أو رتبت كأزواج.",
            icon: <SparklesIcon className="w-8 h-8 text-amber-500" />,
            href: "#/alm?tab=pairing",
            bg: "bg-amber-50 dark:bg-amber-900/10",
            borderColor: "border-amber-200 dark:border-amber-800",
            hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/20"
        },
        {
            title: "حم (بحث الحواميم)",
            description: "محرك بحث مخصص حصرياً لسور آل (حم) السبع المتتالية في المصحف الشريف للبحث في مواضيعها المحورية.",
            icon: <span className="font-quran text-2xl font-bold text-emerald-600 dark:text-emerald-400">حم</span>,
            href: "#/hm",
            bg: "bg-emerald-50 dark:bg-emerald-900/10",
            borderColor: "border-emerald-200 dark:border-emerald-800",
            hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
        },
        {
            title: "البصمة النورانية للمفردات",
            description: "أداة متقدمة لاستخراج البصمة النورانية لأي مفردة عبر السور الـ 29، بالإضافة للبحث العكسي.",
            icon: <div className="font-mono text-xl font-bold text-indigo-500">01</div>,
            href: "#/fingerprint",
            bg: "bg-indigo-50 dark:bg-indigo-900/10",
            borderColor: "border-indigo-200 dark:border-indigo-800",
            hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/20"
        },
        {
            title: "ماسح الحروف الأبجدية",
            description: "تحديد أصغر مساحة نصية حول كلمة معينة تكتمل فيها الحروف الأبجدية الثمانية والعشرون.",
            icon: <SparklesIcon className="w-8 h-8 text-rose-500" />,
            href: "#/alphabet-scanner",
            bg: "bg-rose-50 dark:bg-rose-900/10",
            borderColor: "border-rose-200 dark:border-rose-800",
            hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/20"
        },
        {
            title: "مصفوفة اتصال الحروف والمقاطع",
            description: "ترتيب جميع الحروف الأبجدية الـ 28 حسب قوة اتصالها وتلاصقها بأي مقطع أو حرف (سوابق ولواحق)، مع خيار استبعاد الأحرف النورانية.",
            icon: <SparklesIcon className="w-8 h-8 text-amber-500" />,
            href: "#/syllable-cluster",
            bg: "bg-amber-50 dark:bg-amber-900/10",
            borderColor: "border-amber-200 dark:border-amber-800",
            hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/20"
        },
        {
            title: "الكتب الإلهية والنسخ السبع",
            description: "دراسة وتأملات الأستاذ أنوار إسحاق حول الكتب الإلهية داخل المصحف الشريف والأنبياء المخاطبين بها.",
            icon: <BookOpenIcon className="w-8 h-8 text-blue-500" />,
            href: "#/research",
            bg: "bg-blue-50 dark:bg-blue-900/10",
            borderColor: "border-blue-200 dark:border-blue-800",
            hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/20"
        }
    ];

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl text-text-primary min-h-[70vh]">
            {/* Page Header */}
            <div className="flex flex-col items-center justify-center text-center mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm border border-primary/20">
                    <BookOpenIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-text-primary">
                    بنية المصحف الشريف
                </h1>
                <p className="text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
                    منصة بحثية ودراسية تجمع الأدوات والتحليلات الخاصة بالبنية الموضوعية والرياضية للمصحف الشريف، من تشفير الحروف النورانية إلى ترابط السور.
                </p>

                {/* Primary Tabs */}
                <div className="mt-6 flex items-center bg-surface-subtle p-1 rounded-2xl border border-border-default shadow-xs">
                    <button
                        onClick={() => setActiveTab('lab')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'lab'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>🔬 مختبر التشفير وفك التشفير</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[10px] font-black">
                            14×2
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('sections')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'sections'
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span>📑 فهرس أقسام وبحوث البنية</span>
                        <span className="text-xs opacity-75">({sections.length})</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: THE NOORANI CIPHER LAB (USER'S REQUESTED WORKBENCH) */}
            {activeTab === 'lab' && (
                <div className="space-y-8 animate-fade-in">
                    <NooraniCipherLab
                        simpleCleanData={simpleCleanData}
                        onSearch={onSearch}
                    />

                    {/* Quick navigation to other structure sections */}
                    <div className="pt-4 text-center">
                        <button
                            onClick={() => setActiveTab('sections')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border-default text-sm font-bold text-text-secondary hover:text-primary transition-colors cursor-pointer shadow-xs"
                        >
                            <span>استعراض باقي أقسام وبحوث بنية المصحف ⟵</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 2: SECTIONS DIRECTORY */}
            {activeTab === 'sections' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {sections.map((section, index) => {
                        if (section.isInteractiveTab) {
                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab('lab')}
                                    className={`group relative overflow-hidden flex flex-col p-6 rounded-2xl border ${section.borderColor} ${section.bg} ${section.hoverBg} transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer text-right w-full`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-white dark:bg-surface border border-amber-300/40 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                {section.icon}
                                            </div>
                                            <h2 className="text-2xl font-bold text-text-primary">{section.title}</h2>
                                        </div>
                                        {section.badge && (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                                                {section.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-secondary leading-relaxed">
                                        {section.description}
                                    </p>
                                    <div className="mt-6 flex items-center text-sm font-bold text-amber-700 dark:text-amber-300">
                                        <span>فتح المختبر التفاعلي</span>
                                        <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </div>
                                </button>
                            );
                        }

                        return (
                            <a
                                key={index}
                                href={section.href}
                                className={`group relative overflow-hidden flex flex-col p-6 rounded-2xl border ${section.borderColor} ${section.bg} ${section.hoverBg} transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer`}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-xl bg-white dark:bg-surface border ${section.borderColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-2xl font-bold text-text-primary">{section.title}</h2>
                                </div>
                                <p className="text-text-secondary leading-relaxed">
                                    {section.description}
                                </p>
                                
                                <div className="mt-6 flex items-center text-sm font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                                    <span>استكشف القسم</span>
                                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuranStructureView;
