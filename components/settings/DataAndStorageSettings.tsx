import React, { useState, useEffect } from 'react';
import { TrashIcon, RefreshIcon, CheckIcon } from '../icons';
import { useSettingsContext } from '../../contexts/SettingsContext';

const DataAndStorageSettings: React.FC = () => {
    const {
        isMushafDownloaded,
        isDownloadingFonts,
        fontDownloadProgress,
        startFontDownload,
        cancelFontDownload,
        removeMushafFonts,
        isIndoPakDownloaded,
        isDownloadingIndoPak,
        indoPakDownloadProgress,
        startIndoPakDownload,
        cancelIndoPakDownload,
        removeIndoPakFonts
    } = useSettingsContext();

    const [storageInfo, setStorageInfo] = useState<{ keysCount: number; estimatedKb: string }>({ keysCount: 0, estimatedKb: '0' });
    const [isCleared, setIsCleared] = useState(false);

    const calculateStorage = () => {
        try {
            let total = 0;
            let count = localStorage.length;
            for (let x = 0; x < count; x++) {
                const key = localStorage.key(x);
                if (key) {
                    const val = localStorage.getItem(key) || '';
                    total += key.length + val.length;
                }
            }
            const kb = (total / 1024).toFixed(2);
            setStorageInfo({ keysCount: count, estimatedKb: kb });
        } catch (e) {
            setStorageInfo({ keysCount: 0, estimatedKb: '0' });
        }
    };

    useEffect(() => {
        calculateStorage();
    }, []);

    const handleDownloadFonts = async () => {
        await startFontDownload();
    };

    const handleDeleteFonts = async () => {
        if (window.confirm('هل أنت متأكد من حذف خطوط المصحف؟')) {
            await removeMushafFonts();
        }
    };

    const handleDownloadIndoPak = async () => {
        await startIndoPakDownload();
    };

    const handleDeleteIndoPak = async () => {
        if (window.confirm('هل أنت متأكد من حذف حزمة خطوط مصحف باكستان؟')) {
            await removeIndoPakFonts();
        }
    };

    const handleClearCache = () => {
        if (window.confirm("هل أنت متأكد من مسح الذاكرة المؤقتة للبحث والتصفح؟ (لن يتم حذف الملاحظات أو المفضلة)")) {
            try {
                // Keep notebook saved items
                const notebookData = localStorage.getItem('qran_app_notebook');
                const userApiKey = localStorage.getItem('qran_user_api_key');
                const themeData = localStorage.getItem('theme');

                localStorage.clear();

                if (notebookData) localStorage.setItem('qran_app_notebook', notebookData);
                if (userApiKey) localStorage.setItem('qran_user_api_key', userApiKey);
                if (themeData) localStorage.setItem('theme', themeData);

                calculateStorage();
                setIsCleared(true);
                setTimeout(() => setIsCleared(false), 3000);
            } catch (e) {}
        }
    };

    const handleResetAllSettings = () => {
        if (window.confirm("هل أنت متأكد من إعادة جميع إعدادات الخط والأصوات والمظهر للوضع الافتراضي؟")) {
            try {
                localStorage.removeItem('qran_app_edition');
                localStorage.removeItem('qran_app_font_size');
                localStorage.removeItem('qran_app_font_style');
                localStorage.removeItem('qran_app_audio_edition');
                localStorage.removeItem('qran_app_browsing_mode');
                window.location.reload();
            } catch (e) {}
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">البيانات والذاكرة المؤقتة</h2>
                <p className="text-sm text-text-secondary">إدارة التخزين المحلي، مسح البيانات المؤقتة، وضبط أداء التطبيق.</p>
            </div>

            {/* Storage overview */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <h3 className="font-bold text-lg text-text-primary">إحصائيات التخزين المحلي</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                        <div className="text-xs text-text-muted">عدد السجلات المحفوظة</div>
                        <div className="text-2xl font-bold text-primary mt-1">{storageInfo.keysCount} عنصر</div>
                    </div>
                    <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                        <div className="text-xs text-text-muted">حجم البيانات التقريبي</div>
                        <div className="text-2xl font-bold text-primary mt-1" dir="ltr">{storageInfo.estimatedKb} KB</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-surface-subtle rounded-2xl border border-border-default space-y-4">
                <h3 className="font-bold text-lg text-text-primary">أدوات تنظيف الذاكرة والضبط</h3>

                {/* Mushaf Fonts Download Section */}
                <div className="bg-surface rounded-xl border border-border-default overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h4 className="font-bold text-text-primary text-sm mb-1">خطوط المصحف الأصلي</h4>
                            <p className="text-xs text-text-muted max-w-md">
                                قم بتنزيل ملفات الخطوط لعرض الصفحات بشكل مطابق تماماً للمصحف المطبوع (604 صفحة، حوالي 18 ميغابايت).
                            </p>
                        </div>
                        
                        <div className="flex-shrink-0 min-w-[140px]">
                            {isDownloadingFonts ? (
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between text-xs text-text-muted">
                                        <span>جاري التنزيل...</span>
                                        <span className="font-bold text-primary" dir="ltr">{fontDownloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-primary h-2 transition-all duration-300 rounded-full" 
                                            style={{ width: `${Math.max(0, fontDownloadProgress)}%` }}
                                        ></div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={cancelFontDownload} 
                                        className="text-xs text-red-500 hover:text-red-700 underline block text-center w-full mt-1 cursor-pointer"
                                    >
                                        إلغاء التنزيل
                                    </button>
                                </div>
                            ) : isMushafDownloaded ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <CheckIcon className="w-3.5 h-3.5" /> تم التنزيل
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={handleDeleteFonts} 
                                        className="text-xs text-red-500 hover:text-red-700 underline px-2 py-1 cursor-pointer"
                                    >
                                        حذف
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={handleDownloadFonts}
                                    className="w-full bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                    تنزيل الخطوط
                                </button>
                            )}
                        </div>
                    </div>
                    {isMushafDownloaded && (
                        <div className="px-4 py-2.5 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300 border-t border-emerald-500/10 flex items-center gap-2">
                            <CheckIcon className="w-4 h-4 flex-shrink-0" />
                            <span>تم تنزيل الخطوط بنجاح. يمكنك الآن تفعيل نمط "المصحف" من إعدادات القراءة والخطوط.</span>
                        </div>
                    )}
                </div>

                {/* IndoPak Mushaf Package Section */}
                <div className="bg-surface rounded-xl border border-border-default overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h4 className="font-bold text-text-primary text-sm mb-1">حزمة مصحف باكستان وجنوب آسيا (IndoPak)</h4>
                            <p className="text-xs text-text-muted max-w-md">
                                خط النستعليق الباكستاني الأصيل مع رسم 15 سطر (610 صفحة، حوالي 1.5 ميغابايت).
                            </p>
                        </div>
                        
                        <div className="flex-shrink-0 min-w-[140px]">
                            {isDownloadingIndoPak ? (
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between text-xs text-text-muted">
                                        <span>جاري التنزيل...</span>
                                        <span className="font-bold text-primary" dir="ltr">{indoPakDownloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-primary h-2 transition-all duration-300 rounded-full" 
                                            style={{ width: `${Math.max(0, indoPakDownloadProgress)}%` }}
                                        ></div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={cancelIndoPakDownload} 
                                        className="text-xs text-red-500 hover:text-red-700 underline block text-center w-full mt-1 cursor-pointer"
                                    >
                                        إلغاء التنزيل
                                    </button>
                                </div>
                            ) : isIndoPakDownloaded ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <CheckIcon className="w-3.5 h-3.5" /> تم التنزيل
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={handleDeleteIndoPak} 
                                        className="text-xs text-red-500 hover:text-red-700 underline px-2 py-1 cursor-pointer"
                                    >
                                        حذف
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={handleDownloadIndoPak}
                                    className="w-full bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                    تنزيل حزمة باكستان
                                </button>
                            )}
                        </div>
                    </div>
                    {isIndoPakDownloaded && (
                        <div className="px-4 py-2.5 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300 border-t border-emerald-500/10 flex items-center gap-2">
                            <CheckIcon className="w-4 h-4 flex-shrink-0" />
                            <span>تم تنزيل حزمة مصحف باكستان بنجاح. يمكنك الآن تفعيلها وتصفحها بسلاسة.</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                        onClick={handleClearCache}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-amber-500 hover:bg-amber-500/5 text-right transition-all flex items-center justify-between"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">مسح المؤقت وتفريغ الكاش</div>
                            <div className="text-xs text-text-muted mt-0.5">تنظيف الذاكرة المؤقتة مع الحفاظ على ملاحظاتك ومفضلاتك.</div>
                        </div>
                        <TrashIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    </button>

                    <button
                        onClick={handleResetAllSettings}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-red-500 hover:bg-red-500/5 text-right transition-all flex items-center justify-between"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">إعادة ضبط الإعدادات للافتراضي</div>
                            <div className="text-xs text-text-muted mt-0.5">إعادة خيارات القراءة والأصوات والمظهر لحالتها الأولى.</div>
                        </div>
                        <RefreshIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </button>
                </div>

                {isCleared && (
                    <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold flex items-center gap-2 justify-center">
                        <CheckIcon className="w-4 h-4" />
                        <span>تم تنظيف الذاكرة المؤقتة بنجاح.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAndStorageSettings;
