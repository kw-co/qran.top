import React, { useState, useEffect, useMemo } from 'react';
import { CheckIcon, RefreshIcon, CopyIcon, SparklesIcon } from '../icons';
import { safeLocalStorage } from '../../utils/storage';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { formatAyahForCopy, formatMultipleAyahsForCopy } from '../../utils/text';
import type { CopyTextFormat, CopyCitationFormat, CopyMultiFormat } from '../../types';

const EXPORT_TEMPLATE_KEY = 'qran_app_export_template';

const DEFAULT_EXPORT_TEMPLATE = `ملخص البحث عن: "{{query}}"
- عدد الآيات المطابقة: {{ayah_count}}
- إجمالي التكرارات: {{general_occurrences}}
- المطابقات التامة: {{exact_occurrences}}
- خيار التطابق: {{exact_match_status}}

====================================

{{#results}}
"{{ayah_text}}" (سورة {{surah_name}} - الآية {{ayah_number_in_surah}})

---

{{/results}}
`;

const SAMPLE_SINGLE_AYAH = {
    text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
    surahName: 'طه',
    surahNumber: 20,
    ayahNumber: 114
};

const SAMPLE_MULTI_AYAHS = [
    { text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', surahName: 'الإخلاص', surahNumber: 112, ayahNumber: 1 },
    { text: 'اللَّهُ الصَّمَدُ', surahName: 'الإخلاص', surahNumber: 112, ayahNumber: 2 },
    { text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', surahName: 'الإخلاص', surahNumber: 112, ayahNumber: 3 },
    { text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', surahName: 'الإخلاص', surahNumber: 112, ayahNumber: 4 },
];

const ExportFormatSettings: React.FC = () => {
    const {
        copyTextFormat,
        setCopyTextFormat,
        copyCitationFormat,
        setCopyCitationFormat,
        copyMultiFormat,
        setCopyMultiFormat,
        fontStyle
    } = useSettingsContext();

    const [template, setTemplate] = useState(DEFAULT_EXPORT_TEMPLATE);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [singleCopied, setSingleCopied] = useState(false);
    const [multiCopied, setMultiCopied] = useState(false);

    useEffect(() => {
        const savedTemplate = safeLocalStorage.getItem(EXPORT_TEMPLATE_KEY);
        if (savedTemplate) {
            setTemplate(savedTemplate);
        }
    }, []);

    const handleSave = () => {
        safeLocalStorage.setItem(EXPORT_TEMPLATE_KEY, template);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
    };

    const handleReset = () => {
        if (window.confirm("هل أنت متأكد من إعادة القالب إلى الوضع الافتراضي؟")) {
            setTemplate(DEFAULT_EXPORT_TEMPLATE);
            safeLocalStorage.setItem(EXPORT_TEMPLATE_KEY, DEFAULT_EXPORT_TEMPLATE);
        }
    };

    // Calculate real-time live preview for single ayah
    const singlePreviewText = useMemo(() => {
        return formatAyahForCopy({
            ayahText: SAMPLE_SINGLE_AYAH.text,
            surahName: SAMPLE_SINGLE_AYAH.surahName,
            surahNumber: SAMPLE_SINGLE_AYAH.surahNumber,
            ayahNumber: SAMPLE_SINGLE_AYAH.ayahNumber,
            textFormat: copyTextFormat,
            citationFormat: copyCitationFormat,
            fontStyle
        });
    }, [copyTextFormat, copyCitationFormat, fontStyle]);

    // Calculate real-time live preview for multiple ayahs
    const multiPreviewText = useMemo(() => {
        return formatMultipleAyahsForCopy(SAMPLE_MULTI_AYAHS, {
            textFormat: copyTextFormat,
            citationFormat: copyCitationFormat,
            multiFormat: copyMultiFormat,
            fontStyle
        });
    }, [copyTextFormat, copyCitationFormat, copyMultiFormat, fontStyle]);

    const handleCopySinglePreview = () => {
        navigator.clipboard.writeText(singlePreviewText).then(() => {
            setSingleCopied(true);
            setTimeout(() => setSingleCopied(false), 2000);
        });
    };

    const handleCopyMultiPreview = () => {
        navigator.clipboard.writeText(multiPreviewText).then(() => {
            setMultiCopied(true);
            setTimeout(() => setMultiCopied(false), 2000);
        });
    };

    return (
        <div className="animate-fade-in space-y-12">
            {/* --- Section 1: Verse Copying Settings --- */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-text-primary">خيارات نسخ الآيات والمشاركة</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        تيك توك / واتساب / تواصل
                    </span>
                </div>
                <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                    خصص كيف يتم تجهيز نص الآية عند الضغط على زر النسخ. الوضع الافتراضي ينسخ الآية <strong className="text-text-primary">خام بدون تشكيل وبدون أرقام أو أسماء سور</strong> لتوفير عدد الحروف وسهولة النشر والاستشهاد.
                </p>

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-surface-subtle p-5 sm:p-6 rounded-2xl border border-border-default shadow-xs mb-6">
                    {/* Option 1: Text format / Tashkeel */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">
                                حالة التشكيل والرسم
                            </label>
                            <select
                                value={copyTextFormat}
                                onChange={(e) => setCopyTextFormat(e.target.value as CopyTextFormat)}
                                className="w-full p-2.5 bg-surface border border-border-default rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-xs text-sm"
                            >
                                <option value="clean">خام بدون تشكيل (افتراضي - موفر للمحارف)</option>
                                <option value="tashkeel">إملائي بالتشكيل (مع الحركات)</option>
                                <option value="current_view">حسب العرض الحالي (عثماني / رسم المصحف)</option>
                            </select>
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                            النص الخام بدون حركات مناسب للتعليقات وتيك توك وواتساب لتفادي استهلاك حد المحارف.
                        </p>
                    </div>

                    {/* Option 2: Citation format for single ayah */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">
                                توثيق الآية المفردة (المرجع)
                            </label>
                            <select
                                value={copyCitationFormat}
                                onChange={(e) => setCopyCitationFormat(e.target.value as CopyCitationFormat)}
                                className="w-full p-2.5 bg-surface border border-border-default rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-xs text-sm"
                            >
                                <option value="none">بدون توثيق (نص الآية فقط - افتراضي)</option>
                                <option value="number_only">رقم الآية فقط: (114)</option>
                                <option value="short">مختصر: (طه: 114)</option>
                                <option value="long">مفصل: "النص" (سورة طه - الآية 114)</option>
                                <option value="quran_brackets">أقواس قرآنية فقط: ﴿ النص ﴾</option>
                                <option value="quran_brackets_with_ref">أقواس مع المرجع: ﴿ النص ﴾ (طه: 114)</option>
                            </select>
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                            اختر ما إذا كان يُلحق بالآية رقمها أو اسم سورتها أو وضعها داخل أقواس قرآنية.
                        </p>
                    </div>

                    {/* Option 3: Multiple selection copy format */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">
                                تنسيق النسخ المتعدد
                            </label>
                            <select
                                value={copyMultiFormat || 'numbers_as_separators'}
                                onChange={(e) => setCopyMultiFormat(e.target.value as CopyMultiFormat)}
                                className="w-full p-2.5 bg-surface border border-border-default rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-xs text-sm"
                            >
                                <option value="numbers_as_separators">أرقام الآيات كفواصل بدون اسم السورة (افتراضي)</option>
                                <option value="consecutive_with_surah">نص متتالي مع اسم السورة في النهاية</option>
                                <option value="separated">كل آية في سطر منفصل مع توثيقها</option>
                                <option value="plain_continuous">نص متواصل خام بدون أي أرقام أو فواصل</option>
                            </select>
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                            طريقة جمع الآيات عند تحديد أكثر من آية ونسخها دفعة واحدة.
                        </p>
                    </div>
                </div>

                {/* --- Live Interactive Previews --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Single Ayah Live Preview Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        معاينة نسخ الآية المفردة
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopySinglePreview}
                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                                    title="تجربة نسخ النص الحالي إلى الحافظة"
                                >
                                    {singleCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    <span>{singleCopied ? 'تم النسخ!' : 'تجربة النسخ'}</span>
                                </button>
                            </div>
                            <div className="p-3 bg-surface-subtle rounded-xl border border-border-default/60 font-sans text-sm text-text-primary select-all whitespace-pre-wrap min-h-[4rem] flex items-center leading-relaxed">
                                {singlePreviewText}
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                            <span>عدد المحارف: <strong className="text-text-primary font-mono">{singlePreviewText.length}</strong></span>
                            <span>الآية: 114 سورة طه</span>
                        </div>
                    </div>

                    {/* Multi Ayah Live Preview Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-default shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        معاينة النسخ المتعدد (سورة الإخلاص)
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopyMultiPreview}
                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer"
                                    title="تجربة نسخ النص الحالي إلى الحافظة"
                                >
                                    {multiCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-600" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    <span>{multiCopied ? 'تم النسخ!' : 'تجربة النسخ'}</span>
                                </button>
                            </div>
                            <div className="p-3 bg-surface-subtle rounded-xl border border-border-default/60 font-sans text-sm text-text-primary select-all whitespace-pre-wrap min-h-[4rem] flex items-center leading-relaxed">
                                {multiPreviewText}
                            </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                            <span>عدد المحارف: <strong className="text-text-primary font-mono">{multiPreviewText.length}</strong></span>
                            <span>4 آيات مختارة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Section 2: Search Export Template Settings --- */}
            <div className="border-t border-border-default pt-8">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">ضبط وتخصيص قالب تصدير البحث</h2>
                <p className="text-text-secondary mb-6 text-sm">
                    خصص شكل المخرجات النصية عند استخدام أدوات "نسخ كل النتائج" أو "تحميل النتائج كملف" في صفحة البحث.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 bg-surface-subtle rounded-2xl border border-border-default">
                        <h3 className="text-lg font-bold mb-3 text-text-primary">محرر القالب</h3>
                        <textarea
                            id="export-template-editor"
                            name="exportTemplate"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            className="w-full h-80 p-3 font-mono text-sm border border-border-default rounded-xl bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition shadow-xs text-text-primary"
                            dir="ltr"
                            aria-label="محرر قالب التصدير"
                        />
                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={handleSave}
                                className="flex-grow flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-xs cursor-pointer text-sm"
                            >
                                <CheckIcon className="w-4 h-4"/>
                                <span>حفظ القالب</span>
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors shadow-xs cursor-pointer text-sm"
                            >
                                <RefreshIcon className="w-4 h-4"/>
                                <span>إعادة الضبط</span>
                            </button>
                        </div>
                        {saveSuccess && (
                            <p className="text-green-600 dark:text-green-400 text-sm mt-3 text-center font-bold">
                                تم حفظ القالب بنجاح.
                            </p>
                        )}
                    </div>

                    <div className="p-5 bg-surface rounded-2xl border border-border-default flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-3 text-text-primary">شرح المتغيرات المدعومة</h3>
                            <div className="space-y-4 text-text-secondary text-sm">
                                <div>
                                    <h4 className="font-bold text-text-primary mb-1">المتغيرات العامة</h4>
                                    <ul className="list-disc pr-5 space-y-1 text-xs leading-relaxed">
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{query}}`}</code>: كلمة البحث المُدخلة.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{ayah_count}}`}</code>: عدد الآيات في النتائج.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{general_occurrences}}`}</code>: إجمالي تكرارات الكلمة.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{exact_occurrences}}`}</code>: عدد المطابقات التامة.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{exact_match_status}}`}</code>: حالة خيار التطابق ("مفعل" أو "غير مفعل").</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-primary mb-1">حلقة النتائج والتكرار</h4>
                                    <p className="text-xs mb-1.5">استخدم هذا التركيب لتكرار كل آية في قائمة النتائج:</p>
                                    <code dir="ltr" className="block p-2 bg-surface-hover rounded-lg text-xs font-mono text-center text-primary font-bold mb-2">{`{{#results}} ... {{/results}}`}</code>
                                    <h4 className="font-bold text-text-primary mb-1">المتغيرات داخل الحلقة</h4>
                                    <ul className="list-disc pr-5 space-y-1 text-xs leading-relaxed">
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{ayah_text}}`}</code>: نص الآية الكامل.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{surah_name}}`}</code>: اسم السورة.</li>
                                        <li><code dir="ltr" className="bg-surface-hover px-1.5 py-0.5 rounded font-mono text-primary font-bold">{`{{ayah_number_in_surah}}`}</code>: رقم الآية داخل السورة.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportFormatSettings;
