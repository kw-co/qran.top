import React, { useState, useMemo } from 'react';
import { ClearIcon, CopyIcon, CheckIcon, ShareIcon } from './icons';
import { copyToClipboard, toEasternArabicDigits, stripDiacritics } from '../utils/text';

export interface PageAyahForCopy {
    surahNumber: number;
    surahName: string;
    ayahNumberInSurah: number;
    textUthmani: string;
    textSimple?: string;
    juz?: number;
}

export interface CopyPageModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageNumber: number;
    juzNumber?: number;
    ayahs: PageAyahForCopy[];
}

export type PageCopyFormat = 'uthmani' | 'imlai' | 'clean';
export type PageNumberStyle = 'ornate' | 'standard' | 'none';
export type PageCitationStyle = 'full' | 'simple' | 'none';

export const CopyPageModal: React.FC<CopyPageModalProps> = ({
    isOpen,
    onClose,
    pageNumber,
    juzNumber,
    ayahs
}) => {
    const [textFormat, setTextFormat] = useState<PageCopyFormat>('uthmani');
    const [numberStyle, setNumberStyle] = useState<PageNumberStyle>('ornate');
    const [citationStyle, setCitationStyle] = useState<PageCitationStyle>('full');
    const [includeBismillah, setIncludeBismillah] = useState<boolean>(true);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Group ayahs by surah
    const surahGroups = useMemo(() => {
        if (!ayahs || !Array.isArray(ayahs) || ayahs.length === 0) return [];
        const groups: {
            surahNumber: number;
            surahName: string;
            ayahs: PageAyahForCopy[];
            isStartOfSurah: boolean;
        }[] = [];

        ayahs.forEach(ayah => {
            if (!ayah) return;
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.surahNumber === ayah.surahNumber) {
                lastGroup.ayahs.push(ayah);
            } else {
                groups.push({
                    surahNumber: ayah.surahNumber,
                    surahName: ayah.surahName || `سورة ${ayah.surahNumber}`,
                    ayahs: [ayah],
                    isStartOfSurah: ayah.ayahNumberInSurah === 1
                });
            }
        });

        return groups;
    }, [ayahs]);

    // Unique surah names on this page
    const surahsSummary = useMemo(() => {
        if (!surahGroups || surahGroups.length === 0) return '';
        return surahGroups.map(g => {
            if (!g.ayahs || g.ayahs.length === 0) return `سورة ${g.surahName}`;
            const firstAyah = g.ayahs[0].ayahNumberInSurah;
            const lastAyah = g.ayahs[g.ayahs.length - 1].ayahNumberInSurah;
            const range = firstAyah === lastAyah ? `${firstAyah}` : `${firstAyah}-${lastAyah}`;
            return `سورة ${g.surahName} (${range})`;
        }).join('، ');
    }, [surahGroups]);

    // Generate formatted text for copying
    const formattedText = useMemo(() => {
        if (!isOpen || !ayahs || ayahs.length === 0) return '';

        const sections: string[] = [];

        surahGroups.forEach((group) => {
            const lines: string[] = [];

            // If there are multiple surahs on the page, or start of surah, show surah header
            if (surahGroups.length > 1 || group.isStartOfSurah) {
                lines.push(`--- سورة ${group.surahName} ---`);
            }

            // Bismillah if start of surah (except At-Tawbah 9 and Al-Fatihah 1)
            if (includeBismillah && group.isStartOfSurah && group.surahNumber !== 9 && group.surahNumber !== 1) {
                if (textFormat === 'clean') {
                    lines.push('بسم الله الرحمن الرحيم');
                } else if (textFormat === 'uthmani') {
                    lines.push('بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ');
                } else {
                    lines.push('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
                }
            }

            // Format ayahs
            const ayahTexts = group.ayahs.map(ayah => {
                const rawUthmani = String(ayah.textUthmani || '');
                let baseText = rawUthmani;
                if (textFormat === 'clean') {
                    baseText = ayah.textSimple || stripDiacritics(rawUthmani);
                } else if (textFormat === 'imlai') {
                    // Imlai: remove Quranic pause marks but keep tashkeel
                    baseText = rawUthmani
                        .replace(/[\u06D6-\u06ED]/g, '')
                        .replace(/ـ/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                } else {
                    // Uthmani: clean trailing numbers if present
                    baseText = rawUthmani
                        .replace(/[\s\u0660-\u0669\u06F0-\u06F9\u06DD\uFD3E\uFD3F]+$/, '')
                        .trim();
                }

                // Add number separator according to chosen style
                if (numberStyle === 'ornate') {
                    return `${baseText} ﴿${toEasternArabicDigits(ayah.ayahNumberInSurah)}﴾`;
                } else if (numberStyle === 'standard') {
                    return `${baseText} (${ayah.ayahNumberInSurah})`;
                }
                return baseText;
            });

            lines.push(ayahTexts.join(' '));
            sections.push(lines.join('\n'));
        });

        let result = sections.join('\n\n');

        // Add Citation
        if (citationStyle === 'full') {
            const juzLabel = juzNumber ? ` | الجزء ${juzNumber}` : '';
            result += `\n\n[${surahsSummary} | المصحف الشريف - صفحة ${pageNumber}${juzLabel}]`;
        } else if (citationStyle === 'simple') {
            result += `\n\n[صفحة ${pageNumber} | ${surahsSummary}]`;
        }

        return result;
    }, [ayahs, surahGroups, textFormat, numberStyle, citationStyle, includeBismillah, juzNumber, pageNumber, surahsSummary]);

    if (!isOpen) return null;

    const handleCopy = async () => {
        const success = await copyToClipboard(formattedText);
        if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `المصحف الشريف - صفحة ${pageNumber}`,
                    text: formattedText
                });
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            handleCopy();
        }
    };

    const wordsCount = formattedText.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-page-modal-title"
        >
            <div 
                className="bg-surface rounded-2xl shadow-2xl border border-primary/30 max-w-2xl w-full max-h-[92vh] flex flex-col text-text-primary overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-default bg-surface/90">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                            {pageNumber}
                        </div>
                        <div>
                            <h3 id="copy-page-modal-title" className="text-base sm:text-lg font-bold text-primary-text-strong flex items-center gap-2">
                                <span>خيارات نسخ الصفحة</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    صفحة {pageNumber}
                                </span>
                            </h3>
                            <p className="text-xs text-text-muted mt-0.5 truncate max-w-[280px] sm:max-w-md">
                                {surahsSummary} {juzNumber ? `• الجزء ${juzNumber}` : ''} • ({ayahs.length} آية)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-full transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <ClearIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content / Options & Preview */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
                    {/* 1. Format Option Selector */}
                    <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">
                            صيغة رسم النص:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTextFormat('uthmani')}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                                    textFormat === 'uthmani'
                                        ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                        : 'bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                <span className="block text-xs sm:text-sm">الرسم العثماني</span>
                                <span className="text-[10px] opacity-80 block">مع التشكيل والضبط</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextFormat('imlai')}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                                    textFormat === 'imlai'
                                        ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                        : 'bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                <span className="block text-xs sm:text-sm">إملائي مشكول</span>
                                <span className="text-[10px] opacity-80 block">حركات هجائية حديثة</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextFormat('clean')}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                                    textFormat === 'clean'
                                        ? 'bg-primary text-white border-primary shadow-xs font-bold'
                                        : 'bg-surface-card border-border-default text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                <span className="block text-xs sm:text-sm">نص بسيط مجرد</span>
                                <span className="text-[10px] opacity-80 block">بدون أي تشكيل للبحث</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Numbering and Citation options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Numbering Style */}
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                شكل ترقيم الآيات:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setNumberStyle('ornate')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        numberStyle === 'ornate'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    ﴿١٥﴾ قرآنية
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNumberStyle('standard')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        numberStyle === 'standard'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    (15) قياسية
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNumberStyle('none')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        numberStyle === 'none'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    بدون ترقيم
                                </button>
                            </div>
                        </div>

                        {/* Citation Style */}
                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                تذييل التوثيق والمرجع:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCitationStyle('full')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        citationStyle === 'full'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    توثيق كامل
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCitationStyle('simple')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        citationStyle === 'simple'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    مختصر
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCitationStyle('none')}
                                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-colors cursor-pointer ${
                                        citationStyle === 'none'
                                            ? 'bg-primary/15 border-primary text-primary font-bold'
                                            : 'bg-surface-card border-border-default text-text-muted hover:bg-surface-hover'
                                    }`}
                                >
                                    بدون توثيق
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bismillah toggle */}
                    <div className="flex items-center justify-between py-1 px-3 bg-surface-card rounded-xl border border-border-default/60">
                        <span className="text-xs text-text-secondary font-medium">
                            تضمين البسملة عند بداية السور
                        </span>
                        <input 
                            type="checkbox"
                            checked={includeBismillah}
                            onChange={(e) => setIncludeBismillah(e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-border-default focus:ring-primary cursor-pointer"
                        />
                    </div>

                    {/* Live Preview Box */}
                    <div>
                        <div className="flex items-center justify-between text-xs font-bold text-text-secondary mb-1">
                            <span>معاينة النص الجاهز للنسخ:</span>
                            <span className="text-[11px] text-text-muted font-mono font-normal">
                                {ayahs.length} آية • {wordsCount} كلمة
                            </span>
                        </div>
                        <div className="relative rounded-xl border border-border-default bg-surface-card/60 p-3.5 max-h-48 overflow-y-auto">
                            <p className="font-serif leading-loose text-xs sm:text-sm text-text-primary whitespace-pre-wrap text-justify">
                                {formattedText}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 sm:p-4 border-t border-border-default bg-surface/90 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 rounded-xl text-text-secondary hover:bg-surface-hover transition-colors font-medium text-xs sm:text-sm cursor-pointer"
                    >
                        إلغاء
                    </button>

                    <div className="flex items-center gap-2">
                        {navigator.share && (
                            <button
                                type="button"
                                onClick={handleShare}
                                className="py-2.5 px-3.5 rounded-xl border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-all flex items-center gap-1.5 font-bold text-xs sm:text-sm cursor-pointer"
                                title="مشاركة نص الصفحة"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span>مشاركة</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                                isCopied
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-primary text-white hover:bg-primary-hover active:scale-95'
                            }`}
                        >
                            {isCopied ? (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span>تم نسخ الصفحة بنجاح!</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-4 h-4" />
                                    <span>نسخ نص الصفحة</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopyPageModal;
