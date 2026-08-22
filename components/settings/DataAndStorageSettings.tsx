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
        removeMushafFonts
    } = useSettingsContext();

    const [storageInfo, setStorageInfo] = useState<{ keysCount: number; estimatedKb: string }>({ keysCount: 0, estimatedKb: '0' });
    const [isCleared, setIsCleared] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

    const showNotification = (msg: string) => {
        setStatusMessage(msg);
        setIsCleared(true);
        setTimeout(() => {
            setIsCleared(false);
            setStatusMessage(null);
        }, 4000);
    };

    const handleDownloadFonts = async () => {
        await startFontDownload();
    };

    const handleDeleteFonts = async () => {
        try {
            await removeMushafFonts();
            calculateStorage();
            showNotification('تم حذف خطوط مصحف المدينة بنجاح وتفريغ مساحتها');
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearCache = async () => {
        try {
            // Keep notebook saved items, bookmarks, user api key, theme, history
            const notebookData = localStorage.getItem('qran_app_notebook');
            const bookmarksData = localStorage.getItem('qran_app_bookmarks');
            const userApiKey = localStorage.getItem('qran_user_api_key');
            const themeData = localStorage.getItem('theme');
            const readingHistory = localStorage.getItem('qran_app_reading_history');

            // Clear all caches in Cache Storage
            if ('caches' in window) {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
            }

            // Clear localStorage
            localStorage.clear();

            // Restore essential user data
            if (notebookData) localStorage.setItem('qran_app_notebook', notebookData);
            if (bookmarksData) localStorage.setItem('qran_app_bookmarks', bookmarksData);
            if (userApiKey) localStorage.setItem('qran_user_api_key', userApiKey);
            if (themeData) localStorage.setItem('theme', themeData);
            if (readingHistory) localStorage.setItem('qran_app_reading_history', readingHistory);

            calculateStorage();
            showNotification('تم مسح الذاكرة المؤقتة وتفريغ الكاش بالكامل بنجاح');
        } catch (e) {
            console.error(e);
        }
    };

    const handleResetAllSettings = () => {
        try {
            // Remove specific setting keys
            const keysToRemove = [
                'qran_app_edition',
                'qran_app_font_size',
                'qran_app_font_style',
                'qran_app_audio_edition',
                'qran_app_browsing_mode',
                'qran_app_mushaf_type',
                'qran_app_indopak_view_mode',
                'qran_app_word_click_behavior',
                'qran_app_enable_tajweed',
                'qran_app_downloading_fonts',
                'qran_app_downloading_indopak'
            ];
            keysToRemove.forEach(k => localStorage.removeItem(k));
            window.location.reload();
        } catch (e) {
            console.error(e);
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
                            <h4 className="font-bold text-text-primary text-sm mb-1">خطوط مصحف المدينة المنورة</h4>
                            <p className="text-xs text-text-muted max-w-md">
                                ملفات الخطوط لعرض الصفحات بشكل مطابق تماماً للمصحف المطبوع (604 صفحة، حوالي 18 ميغابايت).
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
                            <span>تم تنزيل الخطوط بنجاح. نمط مصحف المدينة مفعل وجاهز.</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                        type="button"
                        onClick={handleClearCache}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-amber-500 hover:bg-amber-500/5 text-right transition-all flex items-center justify-between cursor-pointer"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">مسح المؤقت وتفريغ الكاش</div>
                            <div className="text-xs text-text-muted mt-0.5">تنظيف الذاكرة المؤقتة مع الحفاظ على ملاحظاتك ومفضلاتك.</div>
                        </div>
                        <TrashIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    </button>

                    <button
                        type="button"
                        onClick={handleResetAllSettings}
                        className="flex-1 p-4 rounded-xl bg-surface border border-border-default hover:border-red-500 hover:bg-red-500/5 text-right transition-all flex items-center justify-between cursor-pointer"
                    >
                        <div>
                            <div className="font-bold text-text-primary text-sm">إعادة ضبط الإعدادات للافتراضي</div>
                            <div className="text-xs text-text-muted mt-0.5">إعادة خيارات القراءة والأصوات والمظهر لحالتها الأولى.</div>
                        </div>
                        <RefreshIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </button>
                </div>

                {isCleared && (
                    <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold flex items-center gap-2 justify-center animate-fade-in shadow-xs border border-green-500/20">
                        <CheckIcon className="w-4 h-4" />
                        <span>{statusMessage || 'تم تنظيف الذاكرة المؤقتة بنجاح.'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataAndStorageSettings;
