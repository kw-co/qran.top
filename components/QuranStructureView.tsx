import React, { useEffect } from 'react';
import { BookOpenIcon, SparklesIcon, LightBulbIcon } from './icons';

const QuranStructureView: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
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
            <div className="flex flex-col items-center justify-center text-center mb-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpenIcon className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">
                    بنية المصحف الشريف
                </h1>
                <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
                    منصة بحثية ودراسية تجمع الأدوات والتحليلات الخاصة بالبنية الموضوعية والرياضية للمصحف الشريف، من حروف الفواتح إلى ترابط السور.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, index) => (
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
                ))}
            </div>
        </div>
    );
};

export default QuranStructureView;
