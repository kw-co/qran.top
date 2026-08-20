import React, { useState, useEffect } from 'react';
import { TrashIcon, RefreshIcon, CheckIcon } from '../icons';
import { downloadAllMushafFonts, checkMushafFontsDownloaded, deleteMushafFonts, MUSHAF_FONTS_VERSION } from '../../utils/mushafFonts';

const DataAndStorageSettings: React.FC = () => {
    const [storageInfo, setStorageInfo] = useState<{ keysCount: number; estimatedKb: string }>({ keysCount: 0, estimatedKb: '0' });
    const [isCleared, setIsCleared] = useState(false);
    const [fontsStatus, setFontsStatus] = useState<'checking' | 'downloaded' | 'not_downloaded' | 'downloading'>('checking');
    const [downloadProgress, setDownloadProgress] = useState(0);

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
        checkMushafFontsDownloaded().then(isDownloaded => {
            setFontsStatus(isDownloaded ? 'downloaded' : 'not_downloaded');
        });
    }, []);

    const handleDownloadFonts = async () => {
        setFontsStatus('downloading');
        setDownloadProgress(0);
        try {
            await downloadAllMushafFonts(progress => {
                setDownloadProgress(progress);
            });
            setFontsStatus('downloaded');
        } catch (e) {
            alert('حدث خطأ أثناء تحميل الخطوط. يرجى المحاولة مرة أخرى.');
            setFontsStatus('not_downloaded');
        }
    };

    const handleDeleteFonts = async () => {
        if (window.confirm('هل أنت متأكد من حذف خطوط المصحف؟')) {
            await deleteMushafFonts();
            setFontsStatus('not_downloaded');
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
                        
                        <div className="flex-shrink-0 min-w-[120px]">
                            {fontsStatus === 'checking' ? (
                                <div className="text-xs text-text-muted">جاري التحقق...</div>
                            ) : fontsStatus === 'downloading' ? (
                                <div className="space-y-2 w-full">
                                    <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                                        <div className="bg-primary h-2 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                                    </div>
                                    <div className="text-xs text-center text-text-muted">{downloadProgress}%</div>
                                </div>
                            ) : fontsStatus === 'downloaded' ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">تم التنزيل</span>
                                    <button onClick={handleDeleteFonts} className="text-xs text-red-500 hover:text-red-700 underline px-1">حذف</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleDownloadFonts}
                                    className="w-full bg-primary text-primary-text font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    تنزيل الخطوط
                                </button>
                            )}
                        </div>
                    </div>
                    {fontsStatus === 'downloaded' && (
                        <div className="px-4 py-2 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300 border-t border-emerald-500/10 flex items-center gap-2">
                            <CheckIcon className="w-4 h-4 flex-shrink-0" />
                            <span>تم تنزيل الخطوط. يمكنك الآن اختيار "المصحف" من خيارات القراءة.</span>
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
