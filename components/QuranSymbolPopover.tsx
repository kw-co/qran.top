import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClearIcon } from './icons';
import { getHizbQuarterLabel, findSajdahByAyah } from '../data/quranSymbolsData';

export interface QuranSymbolPopoverProps {
    type: 'hizb' | 'sajdah';
    surahNumber: number;
    surahName?: string;
    ayahNumberInSurah: number;
    quarterNumber?: number;
    juzNumber?: number;
    triggerElement: HTMLElement;
    onClose: () => void;
}

export const QuranSymbolPopover: React.FC<QuranSymbolPopoverProps> = ({
    type,
    surahNumber,
    surahName,
    ayahNumberInSurah,
    quarterNumber,
    juzNumber,
    triggerElement,
    onClose
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });

    // Calculate details
    const isHizb = type === 'hizb';
    const hizbInfo = quarterNumber ? getHizbQuarterLabel(quarterNumber) : null;
    const hizbNum = hizbInfo?.hizbNumber || (quarterNumber ? Math.floor((quarterNumber - 1) / 4) + 1 : undefined);
    const sajdahInfo = !isHizb ? findSajdahByAyah(surahNumber, ayahNumberInSurah) : null;

    // Smart position calculation based on trigger element
    useLayoutEffect(() => {
        if (popoverRef.current && triggerElement) {
            const popover = popoverRef.current;
            const triggerRect = triggerElement.getBoundingClientRect();
            const popoverWidth = popover.offsetWidth || 300;
            const popoverHeight = popover.offsetHeight || 260;
            const viewportWidth = window.innerWidth;
            const margin = 12;

            let left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (popoverWidth / 2);
            if (left < margin) {
                left = margin;
            } else if (left + popoverWidth > (viewportWidth - margin)) {
                left = viewportWidth - popoverWidth - margin;
            }

            // Prefer showing below or above
            let top = triggerRect.bottom + window.scrollY + 8;
            if (top + popoverHeight > window.scrollY + window.innerHeight - margin) {
                // Not enough room below, show above
                top = triggerRect.top + window.scrollY - popoverHeight - 8;
            }
            if (top < window.scrollY + margin) {
                top = window.scrollY + margin;
            }

            setStyle({
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                opacity: 1,
                pointerEvents: 'auto',
            });
        }
    }, [triggerElement]);

    // Close on outside click or Escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && !triggerElement.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, triggerElement]);

    return createPortal(
        <div 
            ref={popoverRef}
            style={style}
            className="z-50 bg-surface/98 backdrop-blur-md rounded-2xl shadow-2xl border border-primary/30 p-3 sm:p-4 w-[290px] sm:w-[320px] animate-fade-in text-text-primary text-right"
            dir="rtl"
            role="dialog"
            aria-label={isHizb ? "ملخص علامة ربع الحزب" : "ملخص علامة سجدة التلاوة"}
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border-default">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-lg font-serif font-bold ${
                        isHizb 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                        {isHizb ? '۞' : '۩'}
                    </span>
                    <div>
                        <h4 className="font-bold text-sm text-text-primary">
                            {isHizb ? 'علامة ربع الحزب (النجمة)' : 'علامة سجدة التلاوة'}
                        </h4>
                        <span className="text-[11px] text-text-muted">
                            {surahName ? surahName : `سورة ${surahNumber}`}:{ayahNumberInSurah}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
                    title="إغلاق"
                >
                    <ClearIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Content Summary */}
            {isHizb ? (
                <div className="space-y-2.5 text-xs">
                    {/* Location badges */}
                    <div className="grid grid-cols-2 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">الحزب القرآني</span>
                            <span className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                                {hizbNum ? `الحزب ${hizbNum}` : 'تقسيم الحزب'}
                            </span>
                        </div>
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                            <span className="text-[10px] text-text-muted block font-medium">الجزء</span>
                            <span className="font-bold text-sm text-primary">
                                {juzNumber ? `الجزء ${juzNumber}` : 'المصحف'}
                            </span>
                        </div>
                    </div>

                    {hizbInfo && (
                        <div className="text-center py-1 px-2 rounded-lg bg-surface-hover font-semibold text-text-secondary text-[11px]">
                            {hizbInfo.fullLabel} {quarterNumber ? `(الربع ${quarterNumber} من 240)` : ''}
                        </div>
                    )}

                    {/* Brief explanation */}
                    <div className="p-2.5 rounded-xl bg-surface-card border border-border-default/70 space-y-1.5 leading-relaxed text-[11px] text-text-secondary">
                        <div className="font-bold text-text-primary flex items-center gap-1">
                            <span>💡</span>
                            <span>ماذا تعني النجمة في المصحف؟</span>
                        </div>
                        <p>
                            رمز النجمة الثمانية <span className="font-bold text-emerald-600 dark:text-emerald-400 font-serif text-sm">۞</span> هو علامة تقسيم في رسم المصحف الشريف تشير إلى بداية ربع حزب.
                        </p>
                        <p className="text-[10.5px] text-text-muted">
                            المصحف مقسم إلى 30 جزءاً، وكل جزء يضم حزبين (60 حزباً)، وكل حزب ينقسم إلى 4 أرباع (المجموع 240 ربعاً) لتيسير الحفظ والورد اليومي.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5 text-xs">
                    {/* Sajdah Location */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                        <span className="text-amber-700 dark:text-amber-300 font-medium text-xs">
                            سجدة تلاوة مشروعة
                        </span>
                        <span className="font-bold text-amber-800 dark:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-md font-mono text-xs">
                            {sajdahInfo ? `السجدة ${sajdahInfo.sajdahNumber} من 15` : 'سجدة تلاوة'}
                        </span>
                    </div>

                    {/* Brief explanation */}
                    <div className="p-2.5 rounded-xl bg-surface-card border border-border-default/70 space-y-1.5 leading-relaxed text-[11px] text-text-secondary">
                        <div className="font-bold text-text-primary flex items-center gap-1">
                            <span>🕌</span>
                            <span>حكمها والدعاء المأثور:</span>
                        </div>
                        <p>
                            يُسن للقارئ والمستمع عند المرور برمز المحراب <span className="font-bold text-amber-600 dark:text-amber-400 font-serif text-sm">۩</span> أن يكبر ويسجد سجدة واحدة.
                        </p>
                        <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[10.5px] font-serif leading-loose">
                            «سَجَدَ وَجْهِي لِلَّذِي خَلَقَهُ وَصَوَّرَهُ، وَشَقَّ سَمْعَهُ وَبَصَرَهُ، بِحَوْلِهِ وَقُوَّتِهِ»
                        </div>
                    </div>
                </div>
            )}

            {/* Footer button */}
            <div className="mt-3 pt-2 border-t border-border-default flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-1.5 px-3 rounded-xl bg-surface-hover hover:bg-surface-active text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                    إغلاق
                </button>
            </div>
        </div>,
        document.body
    );
};

export default QuranSymbolPopover;
