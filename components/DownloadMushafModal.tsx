import React from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';
import { BookOpenIcon, CheckIcon } from './icons';

interface DownloadMushafModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DownloadMushafModal: React.FC<DownloadMushafModalProps> = ({ isOpen, onClose }) => {
    const {
        isMushafDownloaded,
        isDownloadingFonts,
        fontDownloadProgress,
        startFontDownload,
        cancelFontDownload,
        setFontStyle,
        setSelectedEdition,
        fontStyle
    } = useSettingsContext();

    if (!isOpen) return null;

    const handleStartDownload = async () => {
        await startFontDownload();
    };

    const handleActivateMushaf = () => {
        setFontStyle('mushaf');
        setSelectedEdition('quran-uthmani-quran-academy');
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none" 
            dir="rtl"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-sm bg-surface border border-border-default rounded-2xl shadow-xl overflow-hidden transform transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Content */}
                <div className="p-5 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpenIcon className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-text-primary">
                        تحميل مصحف المدينة
                    </h3>

                    {!isDownloadingFonts && !isMushafDownloaded && (
                        <p className="text-sm text-text-secondary leading-relaxed">
                            يتطلب هذا الوضع تنزيل خطوط مصحف المدينة (~18 ميغابايت) ليعمل لاحقاً بدون إنترنت.
                        </p>
                    )}

                    {/* Progress when downloading */}
                    {isDownloadingFonts && (
                        <div className="space-y-2 py-1">
                            <div className="flex justify-between text-xs font-semibold text-primary">
                                <span>جاري التنزيل...</span>
                                <span dir="ltr">{fontDownloadProgress}%</span>
                            </div>
                            <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-primary h-2 transition-all duration-300 rounded-full" 
                                    style={{ width: `${Math.max(0, fontDownloadProgress)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Status when downloaded */}
                    {isMushafDownloaded && (
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-sm py-1">
                            <CheckIcon className="w-4 h-4" />
                            <span>تم تنزيل مصحف المدينة بنجاح</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-3 bg-surface-subtle border-t border-border-subtle flex gap-2">
                    {isDownloadingFonts ? (
                        <button
                            type="button"
                            onClick={cancelFontDownload}
                            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-surface hover:bg-surface-hover border border-border-default text-red-500 transition-colors cursor-pointer"
                        >
                            إلغاء التنزيل
                        </button>
                    ) : isMushafDownloaded ? (
                        <>
                            <button
                                type="button"
                                onClick={handleActivateMushaf}
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
                            >
                                {fontStyle === 'mushaf' ? 'متابعة القراءة' : 'تفعيل العرض'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-2.5 px-4 rounded-xl text-sm font-medium bg-surface hover:bg-surface-hover border border-border-default text-text-secondary transition-colors cursor-pointer"
                            >
                                إغلاق
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleStartDownload}
                                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-xs transition-colors cursor-pointer"
                            >
                                تحميل
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-2.5 px-4 rounded-xl text-sm font-medium bg-surface hover:bg-surface-hover border border-border-default text-text-secondary transition-colors cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DownloadMushafModal;
