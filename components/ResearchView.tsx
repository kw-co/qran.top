import React, { useEffect, useState } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';
import { researchSurahs } from '../data/researchData';
import { QURAN_INDEX } from '../quranIndex';

const ResearchView: React.FC = () => {
    const { isResearchModeActive, setIsResearchModeActive } = useSettingsContext();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const researchList = Object.values(researchSurahs).sort((a, b) => a.surahNumber - b.surahNumber);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl text-text-primary">
            <h1 className="text-3xl font-bold mb-6 text-center text-primary">
                بنية المصحف الشريف والكتب الإلهية
            </h1>
            
            <div className="bg-surface rounded-2xl p-6 shadow-sm mb-8 border border-border-subtle">
                <p className="text-lg leading-relaxed mb-4">
                    يقدم الباحث <strong>أنوار إسحاق</strong> دراسة قرآنية معمقة ومختلفة حول بنية المصحف الشريف.
                    تشير هذه الأبحاث إلى أن المصحف الشريف ليس كله كتاباً واحداً يسمى "القرآن"، بل هو صحف مطهرة تحتوي على "كتب قيمة" متعددة.
                </p>
                <p className="text-lg leading-relaxed mb-6">
                    وفقاً للبحث، هذه الكتب الإلهية (مثل التوراة، أم الكتاب، وغيرها) موجودة داخل المصحف على شكل سور محددة،
                    ونزلت على أنبياء ورسل معينين، وجميعهم يمثلون الشهود الـ 19 على هذا الميثاق.
                </p>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <a href="https://www.youtube.com/@AnorAzhak1" target="_blank" rel="noopener noreferrer" className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        قناة اليوتيوب الأولى
                    </a>
                    <a href="https://www.youtube.com/@AnorAzhak" target="_blank" rel="noopener noreferrer" className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        قناة اليوتيوب الثانية
                    </a>
                    <a href="https://notebook.google.com/notebook/f20b300b-9940-4baf-bbc3-e8be7eb99a6d" target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-600 transition-colors p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm border border-blue-200 dark:border-blue-800">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        مشروع نوت بوك التفاعلي
                    </a>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200 p-5 rounded-2xl mb-6 border border-orange-200 dark:border-orange-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-bold text-lg">كيف تعمل هذه الميزة؟</p>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base pr-2">
                        <li>ستظهر أسماء الكتب الإلهية والأنبياء المخاطبين بها أسفل أسماء السور المشمولة في البحث (مثل الشورى، الحديد، إبراهيم...).</li>
                        <li>ستظهر أيقونة تنويه <span className="inline-flex items-center text-orange-600 bg-orange-100 px-1 rounded mx-1">💡</span> بلون برتقالي بجانب أرقام الآيات في هذه السور.</li>
                        <li>عند الضغط على رقم الآية ذو اللون البرتقالي، سيظهر خيار "تنويه" في القائمة لعرض الدليل والشرح.</li>
                    </ul>
                </div>
                
                <div className="flex flex-col items-center justify-center bg-surface-active p-8 rounded-2xl border border-border-default mb-8">
                    <h3 className="text-2xl font-bold mb-3">تفعيل الميزة الاختيارية</h3>
                    <p className="text-center text-text-secondary mb-6">
                        هل ترغب في تفعيل نمط عرض الكتب الإلهية وربط الآيات في المصحف؟
                    </p>
                    <button
                        onClick={() => setIsResearchModeActive(!isResearchModeActive)}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
                            isResearchModeActive 
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' 
                                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/30'
                        }`}
                    >
                        {isResearchModeActive ? (
                            <>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                إيقاف الميزة
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                تفعيل الميزة وعرض البيانات
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-10">
                    <h3 className="text-2xl font-bold mb-6 border-b border-border-default pb-4">قائمة السور المشمولة في البحث التفصيلي</h3>
                    <div className="overflow-x-auto rounded-xl border border-border-default">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-surface-active text-text-secondary uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-bold border-b border-border-default w-24">السورة</th>
                                    <th className="px-6 py-4 font-bold border-b border-border-default">الكتاب الإلهي</th>
                                    <th className="px-6 py-4 font-bold border-b border-border-default">النبي المخاطب</th>
                                    <th className="px-6 py-4 font-bold border-b border-border-default">الآيات الدليلة</th>
                                    <th className="px-6 py-4 font-bold border-b border-border-default min-w-[300px]">الدليل والتوضيح</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {researchList.map(item => {
                                    const surahName = QURAN_INDEX.find(s => s.number === item.surahNumber)?.name || item.surahNumber;
                                    return (
                                        <tr key={item.surahNumber} className="hover:bg-surface-hover transition-colors bg-surface">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-primary mb-1">{surahName}</div>
                                                <span className="text-xs font-mono bg-surface-active px-2 py-1 rounded-md text-text-secondary">رقم {item.surahNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-text-primary">
                                                {item.bookName}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                {item.prophet}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-orange-600 dark:text-orange-400 font-bold whitespace-nowrap" dir="ltr">
                                                {item.evidenceAyah || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary leading-relaxed">
                                                {item.description}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ResearchView;
