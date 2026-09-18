import React, { useMemo, useState } from 'react';
import { BookOpenIcon, ArrowRightIcon, CopyIcon, CheckIcon } from './icons';
import { normalizeArabicText } from '../utils/text';

const ARABIC_LETTERS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

export const ScannerResultItem = ({ res, idx, flatWords }: { res: any, idx: number, flatWords: any[] }) => {
    const [isReversed, setIsReversed] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

        const letterSequence = useMemo(() => {
        const seq: string[] = [];
        const seen = new Set<string>();
        
        if (res.scanMode === 'backward') {
            for (let i = res.R; i >= res.L; i--) {
                const word = flatWords[i].normalized;
                for (let j = word.length - 1; j >= 0; j--) {
                    const char = word[j];
                    if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                        seq.push(char);
                        seen.add(char);
                        if (seq.length === 28) break;
                    }
                }
                if (seq.length === 28) break;
            }
        } else {
            for (let i = res.L; i <= res.R; i++) {
                const word = flatWords[i].normalized;
                for (const char of word) {
                    if (ARABIC_LETTERS.includes(char) && !seen.has(char)) {
                        seq.push(char);
                        seen.add(char);
                        if (seq.length === 28) break;
                    }
                }
                if (seq.length === 28) break;
            }
        }
        
        return seq;
    }, [res, flatWords]);

    const displaySequence = isReversed ? [...letterSequence].reverse() : letterSequence;

    const handleCopy = () => {
        const textToCopy = displaySequence.join(' - ');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="bg-surface border border-border-default rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-surface-subtle px-4 py-3 border-b border-border-default flex flex-wrap gap-x-6 gap-y-2 items-center text-sm">
                                <div className="flex items-center gap-2 font-bold text-primary">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        {idx + 1}
                    </div>
                    {res.scanMode === 'backward' ? 'مسح تراجعي' : res.scanMode === 'forward' ? 'مسح تقدمي' : 'أقصر نافذة'} ({res.length} كلمة)
                </div>
                <div className="text-text-secondary flex items-center gap-1.5">
                    <BookOpenIcon className="w-4 h-4" />
                    من: <span className="font-bold text-text-primary">{flatWords[res.L].surahName}</span> (آية {flatWords[res.L].ayah})
                </div>
                <div className="text-text-secondary flex items-center gap-1.5">
                    <ArrowRightIcon className="w-4 h-4 rotate-180" />
                    إلى: <span className="font-bold text-text-primary">{flatWords[res.R].surahName}</span> (آية {flatWords[res.R].ayah})
                </div>
            </div>
            
            <div className="p-5 font-amiri text-xl leading-loose text-text-primary text-justify" dir="rtl">
                {(() => {
                    const words = [];
                    for (let i = res.L; i <= res.R; i++) {
                        const fw = flatWords[i];
                        const isTarget = i === res.targetIndex;
                        words.push(
                            <span key={`w-${i}`} className={isTarget ? "text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1 rounded mx-0.5" : ""}>
                                {fw.text}{" "}
                            </span>
                        );
                        if (i === res.R || flatWords[i+1].ayah !== fw.ayah || flatWords[i+1].surah !== fw.surah) {
                            words.push(
                                <span key={`a-${i}`} className="text-primary/60 font-bold text-lg mx-1 select-none inline-flex items-center justify-center">
                                    ﴿{fw.ayah}﴾ 
                                </span>
                            );
                        }
                    }
                    return words;
                })()}
            </div>

            <div className="bg-surface-subtle border-t border-border-default p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-secondary">تسلسل ظهور الحروف:</span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsReversed(!isReversed)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-surface hover:bg-surface-hover text-text-primary transition-colors"
                        >
                            {isReversed ? "الترتيب الأصلي" : "عكس الترتيب"}
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {isCopied ? "تم النسخ" : "نسخ التسلسل"}
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5" dir="rtl">
                    {displaySequence.map((letter, i) => (
                        <div key={i} className="w-7 h-7 flex items-center justify-center rounded bg-surface border border-border-default text-primary font-bold text-sm shadow-2xs">
                            {letter}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
